cd "$(dirname "$0")/.." && { [ -d testbuild/node_modules ] || (cd testbuild && npm ci); } && node tests/phase2-step2-propagate.mjs && node tests/phase2-step2-browser.mjs
