# Sourced by each model's check.sh: the pinned TLC, downloaded once into a cache and checked against its hash.
# Sets $jar and $java. Needs Java 11 or later (JAVA overrides `java`).
TLC_VERSION=1.7.4
TLC_SHA256=936a262061c914694dfd669a543be24573c45d5aa0ff20a8b96b23d01e050e88
cache=${TLA2TOOLS_CACHE:-${XDG_CACHE_HOME:-$HOME/.cache}/tla2tools}
jar=$cache/tla2tools-$TLC_VERSION.jar
java=${JAVA:-java}

sha256() { if command -v sha256sum > /dev/null; then sha256sum "$1"; else shasum -a 256 "$1"; fi; }
if [[ ! -f $jar ]] || ! sha256 "$jar" | grep -q "^$TLC_SHA256 "; then
  mkdir -p "$cache"
  curl -fsSL -o "$jar.part" "https://github.com/tlaplus/tlaplus/releases/download/v$TLC_VERSION/tla2tools.jar"
  sha256 "$jar.part" | grep -q "^$TLC_SHA256 " || { echo "tla2tools.jar does not match its pinned hash" >&2; exit 1; }
  mv "$jar.part" "$jar"
fi
