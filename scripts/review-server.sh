#!/usr/bin/env bash
# Keeps the review tool (/review and /review/cut) running on this Mac for as long as reviewing takes:
# a launchd agent runs the dev server from this checkout at http://localhost:44144, starts it at login
# and starts it again if it stops. It runs with REVIEW_AUTOPUBLISH=1, so what changes there goes live by
# itself (app/content/publish.ts). Install it from the main checkout, and keep that checkout on master.
#
#   scripts/review-server.sh install     # set it up (again) and start it
#   scripts/review-server.sh restart     # after changing the review tool's code
#   scripts/review-server.sh status      # is it up
#   scripts/review-server.sh logs        # follow its output (publishing has its own log, see publish.ts)
#   scripts/review-server.sh uninstall   # stop it and remove it
set -euo pipefail

LABEL=com.angeloocana.review
PORT=${REVIEW_PORT:-44144}
REPO=$(cd "$(dirname "$0")/.." && pwd)
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
LOG="$HOME/Library/Logs/angeloocana-review.log"
JOB="gui/$(id -u)/$LABEL"

# launchd starts jobs with almost no PATH: give it the folders of every tool the server and its jobs
# call, as found here. node and npx (Node 24), python3 with numpy and Pillow (clips.py), ffmpeg, git, gh.
tool_path() {
  local dirs="" tool found dir
  for tool in node python3 ffmpeg git gh; do
    found=$(command -v "$tool") || { echo "Can't find $tool on PATH" >&2; exit 1; }
    dir=$(dirname "$found")
    case ":$dirs:" in *":$dir:"*) ;; *) dirs="${dirs:+$dirs:}$dir" ;; esac
  done
  echo "$dirs:/usr/bin:/bin:/usr/sbin:/sbin"
}

stop() {
  launchctl bootout "$JOB" 2>/dev/null || true
  for _ in 1 2 3 4 5 6 7 8 9 10; do launchctl print "$JOB" >/dev/null 2>&1 || return 0; sleep 0.5; done
}

case "${1:-}" in
  install)
    node -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 24 ? 0 : 1)' || { echo "Needs Node 24 on PATH" >&2; exit 1; }
    branch=$(git -C "$REPO" rev-parse --abbrev-ref HEAD)
    [ "$branch" = master ] || echo "Note: $REPO is on $branch. It publishes only from master." >&2
    [ -d "$REPO/node_modules" ] || (cd "$REPO" && npm ci --no-audit --no-fund)
    mkdir -p "$(dirname "$PLIST")" "$(dirname "$LOG")"
    media=""
    [ -n "${ANGELOOCANA_MEDIA:-}" ] && media="<key>ANGELOOCANA_MEDIA</key><string>$ANGELOOCANA_MEDIA</string>"
    cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<!-- Written by $REPO/scripts/review-server.sh; change that and run it again rather than editing this. -->
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array><string>$(command -v node)</string><string>--import</string><string>remix/node-tsx</string><string>server.ts</string></array>
  <key>WorkingDirectory</key><string>$REPO</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>NODE_ENV</key><string>development</string>
    <key>PORT</key><string>$PORT</string>
    <key>REVIEW_AUTOPUBLISH</key><string>1</string>
    <key>REVIEW_SERVER_JOB</key><string>$JOB</string>
    <key>PATH</key><string>$(tool_path)</string>
    $media
  </dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>10</integer>
  <key>ProcessType</key><string>Interactive</string>
  <key>StandardOutPath</key><string>$LOG</string>
  <key>StandardErrorPath</key><string>$LOG</string>
</dict>
</plist>
EOF
    stop
    launchctl bootstrap "gui/$(id -u)" "$PLIST"
    echo "The review tool runs at http://localhost:$PORT/review (log: $LOG)"
    ;;
  restart) launchctl kickstart -k "$JOB" ;;
  status)
    launchctl print "$JOB" 2>/dev/null | grep -E '^\s*(state|pid|last exit code) =' || echo "Not installed"
    curl -s -o /dev/null -w "http://localhost:$PORT/review answers %{http_code}\n" "http://localhost:$PORT/review" || echo "Nothing answers on port $PORT"
    ;;
  logs) tail -n 50 -f "$LOG" ;;
  uninstall)
    stop
    rm -f "$PLIST"
    echo "Removed. The review tool runs again only with npm run dev."
    ;;
  *) sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
