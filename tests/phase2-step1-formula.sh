cd "$(dirname "$0")/.." && { [ -d testbuild/node_modules ] || (cd testbuild && npm ci); } && node tests/phase2-step1-formula.mjs && node tests/phase2-step1-browser.mjs
