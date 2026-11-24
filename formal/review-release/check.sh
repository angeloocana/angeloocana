#!/usr/bin/env bash
# Model-check the review publisher's release boundary (scripts/review-release.ts) with a pinned TLC.
#   formal/review-release/check.sh         every rule holds on the current code, and each historical
#                                          transition still breaks its rule (the check can fail)
#   formal/review-release/check.sh <bug>   one of those runs, printing its trace: current or a bug name
# The same command runs locally and in CI (.github/workflows/formal.yml). Needs Java 11 or later
# (JAVA overrides `java`); the jar is downloaded once into a cache and checked against its hash.
set -euo pipefail

TLC_VERSION=1.7.4
TLC_SHA256=936a262061c914694dfd669a543be24573c45d5aa0ff20a8b96b23d01e050e88
here=$(cd "$(dirname "$0")" && pwd)
cache=${TLA2TOOLS_CACHE:-${XDG_CACHE_HOME:-$HOME/.cache}/tla2tools}
jar=$cache/tla2tools-$TLC_VERSION.jar
java=${JAVA:-java}
bugs=(receiptAsLive retryFailedDeploy oneAuthAllBatches tombstoneHidesRestore rearmOnlyOnPrepare urgentForgets)

sha256() { if command -v sha256sum > /dev/null; then sha256sum "$1"; else shasum -a 256 "$1"; fi; }
if [[ ! -f $jar ]] || ! sha256 "$jar" | grep -q "^$TLC_SHA256 "; then
  mkdir -p "$cache"
  curl -fsSL -o "$jar.part" "https://github.com/tlaplus/tlaplus/releases/download/v$TLC_VERSION/tla2tools.jar"
  sha256 "$jar.part" | grep -q "^$TLC_SHA256 " || { echo "tla2tools.jar does not match its pinned hash" >&2; exit 1; }
  mv "$jar.part" "$jar"
fi

# The rule each historical transition breaks (README.md, "Counterexamples").
expected() {
  case $1 in
    receiptAsLive) echo LiveMeansDeployed ;;
    retryFailedDeploy) echo NewerFailureStands ;;
    oneAuthAllBatches) echo RestoreLosesAtMostOneBatch ;;
    tombstoneHidesRestore) echo CleanupDoneMeansGone ;;
    rearmOnlyOnPrepare) echo CleanupDoneMeansGone ;;
    urgentForgets) echo CleanupDoneMeansGone ;;
    *) return 1 ;;
  esac
}

work=$(mktemp -d)
trap 'rm -rf -- "$work"' EXIT

# run <current|bug> <print the trace?>
run() {
  local name=$1 dir=$work/$1 rule='' status
  mkdir -p "$dir"
  cp "$here/ReviewRelease.tla" "$dir/"
  if [[ $name == current ]]; then
    cp "$here/ReviewRelease.cfg" "$dir/"
  else
    rule=$(expected "$name") || { echo "Unknown run: $name (current, ${bugs[*]})" >&2; exit 2; }
    # A bug run stops at its first (shortest) violation, so it can afford a wider bound.
    sed -e "s/Bugs = {}/Bugs = {\"$name\"}/" -e 's/MaxPeerPushes = 1/MaxPeerPushes = 2/' \
      "$here/ReviewRelease.cfg" > "$dir/ReviewRelease.cfg"
  fi
  set +e
  (cd "$dir" && "$java" -XX:+UseParallelGC -cp "$jar" tlc2.TLC -workers "${TLC_WORKERS:-1}" -deadlock \
    -metadir "$dir/states" -config ReviewRelease.cfg ReviewRelease.tla) > "$dir/tlc.out" 2>&1
  status=$?
  set -e
  if [[ $2 == yes ]]; then
    grep -vE '^(@!@|Progress\(|Starting\.\.\.|Implied-temporal|Computing initial|Finished computing|Checking [0-9]+ invariants)' "$dir/tlc.out"
  fi
  if [[ $name == current ]]; then
    if [[ $status -ne 0 ]] || ! grep -q 'Model checking completed. No error has been found.' "$dir/tlc.out"; then
      grep -E '^Error' "$dir/tlc.out" >&2 || true
      echo "FAIL current: a rule breaks (or TLC failed). Trace: $0 current" >&2
      return 1
    fi
    echo "PASS current: every rule holds ($(grep -oE '[0-9]+ distinct states found, 0 states left' "$dir/tlc.out" | cut -d' ' -f1) distinct states)."
  elif [[ $status -eq 12 ]] && grep -q "Invariant $rule is violated" "$dir/tlc.out"; then
    echo "PASS $name: breaks $rule, as it did in the code."
  else
    echo "FAIL $name: no longer breaks $rule; the model lost sight of this bug. Trace: $0 $name" >&2
    return 1
  fi
}

if [[ $# -gt 0 ]]; then
  run "$1" yes
else
  failed=0
  for name in current "${bugs[@]}"; do run "$name" no || failed=1; done
  exit $failed
fi
