#!/usr/bin/env bash
# Claude Code hook (PreToolUse, Bash): blocks raw "vercel" production commands so production only changes through scripts/deploy.sh.
# A guard against accidents by sessions, not a security boundary (anyone with the Vercel login can still deploy by hand).
command -v jq >/dev/null || { echo "Blocked: the deploy guard needs jq (brew install jq)." >&2; exit 2; }
CMD=$(jq -r '.tool_input.command // empty' | tr -s '[:space:]' ' ') || { echo "Blocked: could not read the command." >&2; exit 2; }
echo "$CMD" | grep -Eq '^ ?bash scripts/deploy\.sh ?$' && exit 0
if echo "$CMD" | grep -Eq 'vercel.*(--prod|--target|promote|rollback|alias)'; then
  echo "Blocked: deploy to production only with: bash scripts/deploy.sh (it refuses branches that are behind main)." >&2
  exit 2
fi
