#!/usr/bin/env bash
# Claude Code hook (PreToolUse, Bash): blocks raw "vercel" production commands so production only changes through scripts/deploy.sh.
# A guard against accidents by sessions, not a security boundary (anyone with the Vercel login can still deploy by hand).
CMD=$(jq -r '.tool_input.command // empty' | tr -s '[:space:]' ' ')
echo "$CMD" | grep -Eq '^ ?bash scripts/deploy\.sh ?$' && exit 0
if echo "$CMD" | grep -Eq 'vercel.*(--prod|--target|promote|rollback|alias)'; then
  echo "Blocked: deploy to production only with: bash scripts/deploy.sh (it refuses branches that are behind main)." >&2
  exit 2
fi
