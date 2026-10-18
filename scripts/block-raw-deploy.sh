#!/usr/bin/env bash
# Claude Code hook (PreToolUse, Bash): blocks a raw "vercel ... --prod" so production only changes through scripts/deploy.sh.
IN=$(cat)
if echo "$IN" | grep -Eq 'vercel (deploy|--prod)[^|;&]*--prod|vercel --prod' && ! echo "$IN" | grep -q 'scripts/deploy.sh'; then
  echo "Blocked: deploy to production only with: bash scripts/deploy.sh (it refuses branches that are behind main)." >&2
  exit 2
fi
