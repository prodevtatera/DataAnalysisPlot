#!/usr/bin/env bash
# Tells Bing (and the other IndexNow search engines) that the pages changed. Run after a deploy: bash scripts/indexnow.sh
# The key file app/aae30dfeca58bcb0be744b93d962e6bc.txt proves the site is ours. Sends only the public page addresses of the sitemap.
set -e
cd "$(dirname "$0")/.."
SITE=https://plot.productledlab.dev
KEY=aae30dfeca58bcb0be744b93d962e6bc
URLS=$(grep -o '<loc>[^<]*</loc>' app/sitemap.xml | sed 's/<[^>]*>//g' | awk '{printf "%s\"%s\"", (NR>1?",":""), $0}')
curl -fsS -o /dev/null -w "IndexNow HTTP %{http_code}\n" -X POST https://api.indexnow.org/indexnow -H 'Content-Type: application/json; charset=utf-8' \
  -d "{\"host\":\"plot.productledlab.dev\",\"key\":\"$KEY\",\"keyLocation\":\"$SITE/$KEY.txt\",\"urlList\":[$URLS]}"
