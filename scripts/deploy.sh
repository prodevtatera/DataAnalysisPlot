#!/usr/bin/env bash
# The only way to deploy to production: bash scripts/deploy.sh
# Refuses when this checkout is behind main or has loose changes, so an old branch can never replace the live site.
set -e
cd "$(dirname "$0")/.."
git fetch -q origin main
git merge-base --is-ancestor origin/main HEAD || { echo "STOP: this branch is behind main. Merge main first (git merge origin/main), then deploy." >&2; exit 1; }
[ -z "$(git status --porcelain)" ] || { echo "STOP: uncommitted changes. Commit them or deploy from a clean checkout of main." >&2; exit 1; }
bash app/setup.sh
cd app
[ -f .vercel/project.json ] || vercel link --yes --project data-analysis-plot
vercel deploy --prod --yes
cd ..
node scripts/live-check.mjs
