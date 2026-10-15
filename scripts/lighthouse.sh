#!/usr/bin/env bash
# Lighthouse scores (mobile) for the main pages. Usage: bash scripts/lighthouse.sh [baseUrl]   (no baseUrl: serves app/ locally on port 4178)
# Fails if SEO < 100, Accessibility < 95, Best Practices < 95 or Performance < 90 on any page. Needs network once for npx (lighthouse 12.6.1).
set -u
cd "$(dirname "$0")/.."
BASE=${1:-}
export CHROME_PATH="$(find "$HOME/Library/Caches/ms-playwright" -name 'Google Chrome for Testing' -path '*MacOS*' 2>/dev/null | head -1)"
if [ -z "$BASE" ]; then (cd app && python3 -m http.server 4178 --bind 127.0.0.1 >/dev/null 2>&1 &); BASE=http://127.0.0.1:4178; sleep 1; LOCAL=1; fi
OUT=$(mktemp -d); fail=0
for p in / /en/ /versuche/ /versuche/elastizitaet/ /en/experiments/pendulum/ /methode/; do
  npx -y lighthouse@12.6.1 "$BASE$p" --chrome-flags="--headless=new --no-sandbox" --output=json --output-path="$OUT/x.json" --quiet --only-categories=performance,accessibility,best-practices,seo >/dev/null 2>&1
  node -e '
    const r = require(process.argv[1]), s = k => Math.round(r.categories[k].score * 100);
    const [p, a, b, e] = [s("performance"), s("accessibility"), s("best-practices"), s("seo")];
    console.log(process.argv[2].padEnd(34), `performance ${p}  accessibility ${a}  best-practices ${b}  seo ${e}`);
    process.exit(e < 100 || a < 95 || b < 95 || p < 90 ? 1 : 0);' "$OUT/x.json" "$p" || fail=1
done
[ -n "${LOCAL:-}" ] && pkill -f "http.server 4178"
exit $fail
