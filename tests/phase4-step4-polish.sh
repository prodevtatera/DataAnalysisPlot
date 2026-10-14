cd "$(dirname "$0")/.." && { [ -d testbuild/node_modules ] || (cd testbuild && npm ci); } && node tests/phase4-step4-polish.mjs
