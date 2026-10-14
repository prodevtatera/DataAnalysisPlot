#!/usr/bin/env bash
# Runs one fresh Claude session per roadmap step until docs/progress.md says DONE or BLOCKED.
# After every round the script itself runs scripts/check.sh, so a round cannot mark itself passed.
# Stop early between rounds with: touch STOP
# Usage: caffeinate -i scripts/loop.sh [max_rounds]   (caffeinate keeps the Mac awake)
# Env: MAX_USD per round (default 10)
set -u
cd "$(dirname "$0")/.."

MAX_ROUNDS=${1:-100}
MAX_USD=${MAX_USD:-10}
# One entry per tool, in an array, so the shell never splits or globs the patterns.
# No bare interpreters (python3 *, node *, npx *): they would run anything. Add entries as steps need them.
ALLOWED=(
  Read Write Edit Skill
  'Bash(git status*)' 'Bash(git diff*)' 'Bash(git log*)' 'Bash(git add*)' 'Bash(git commit*)'
  'Bash(git fetch*)' 'Bash(git rebase*)' 'Bash(git push*)' 'Bash(git switch*)' 'Bash(git rev-parse*)'
  'Bash(gh pr create*)' 'Bash(gh pr view*)' 'Bash(gh pr list*)'
  'Bash(mkdir *)' 'Bash(rm -rf .git/ship.lock)' 'Bash(ls *)'
  'Bash(bash scripts/check.sh)' 'Bash(bash tests/*)'
  'Bash(python3 testbuild/*)' 'Bash(python3 app/*)' 'Bash(python3 -m pytest*)' 'Bash(python3 -m http.server*)'
  'Bash(node testbuild/*)' 'Bash(node app/*)'
  'Bash(npm install*)' 'Bash(npm ci)' 'Bash(npm test)' 'Bash(npm run *)' 'Bash(npx playwright install*)'
  'Bash(curl * https://www.itl.nist.gov/*)'
  mcp__plugin_playwright_playwright
)
# Sandbox: file writes limited to this folder, network limited to the hosts below. The check and test scripts run outside it, because the browser tests cannot start inside it.
SETTINGS='{"sandbox":{"enabled":true,"excludedCommands":["bash scripts/check.sh","bash tests/*"],"network":{"allowedDomains":["www.itl.nist.gov","registry.npmjs.org","cdn.playwright.dev","cdn.jsdelivr.net","github.com","api.github.com"]}}}'

git switch loop/work 2>/dev/null || git switch -c loop/work || exit 1

rm -f STOP
fails=0
for i in $(seq 1 "$MAX_ROUNDS"); do
  [ -e STOP ] && { echo "STOP file found, stopping" | tee -a loop.log; exit 0; }
  echo "== round $i of $MAX_ROUNDS: $(date) ==" | tee -a loop.log
  # If claude fails (usually a usage limit), wait and retry the same round, up to 12 hours.
  waited=0
  while true; do
    claude -p "$(cat docs/loop-prompt.md)" \
      --permission-mode acceptEdits \
      --allowedTools "${ALLOWED[@]}" \
      --settings "$SETTINGS" \
      --max-budget-usd "$MAX_USD" 2>&1 | tee -a loop.log round.out
    rc=${PIPESTATUS[0]}
    [ "$rc" -eq 0 ] && { rm -f round.out; break; }
    # A login problem will not fix itself, so stop instead of waiting.
    if grep -qiE 'authenticate|OAuth|not logged in|invalid api key|/login' round.out; then
      echo "Claude is not logged in. Run 'claude /login' in a terminal, then start the loop again." | tee -a loop.log
      rm -f round.out; exit 1
    fi
    rm -f round.out
    waited=$((waited + 1))
    [ "$waited" -ge 48 ] && { echo "claude kept failing for 12 hours, stopping" | tee -a loop.log; exit 1; }
    echo "claude failed (exit $rc), probably a usage limit. Waiting 15 min, retry $waited of 48." | tee -a loop.log
    [ -e STOP ] && { echo "STOP file found, stopping" | tee -a loop.log; exit 0; }
    sleep 900
  done

  # Independent check: the script runs every test itself, outside Claude.
  if bash scripts/check.sh > docs/last-check.log 2>&1; then
    fails=0
    perl -ni -e 'print unless /^FIX FIRST:/' docs/progress.md
    echo "check.sh: all tests pass" | tee -a loop.log
  else
    fails=$((fails + 1))
    echo "check.sh: FAILED ($fails in a row), see docs/last-check.log" | tee -a loop.log
    perl -pi -e 's/^STATUS: DONE/STATUS: RUNNING/ if $.==1' docs/progress.md
    grep -q '^FIX FIRST:' docs/progress.md || perl -pi -e 'print "FIX FIRST: scripts/check.sh fails, see docs/last-check.log. Fix this before any new step.\n" if $.==2' docs/progress.md
    if [ "$fails" -ge 3 ]; then
      perl -pi -e 's/^STATUS: .*/STATUS: BLOCKED/ if $.==1' docs/progress.md
      echo "check.sh failed 3 rounds in a row, stopping" | tee -a loop.log; exit 1
    fi
  fi

  grep -qE '^STATUS: (DONE|BLOCKED)' docs/progress.md && { head -1 docs/progress.md; exit 0; }
done
echo "Reached $MAX_ROUNDS rounds, stopping." | tee -a loop.log
