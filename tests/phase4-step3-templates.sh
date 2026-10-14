cd "$(dirname "$0")/.." && { [ -d testbuild/node_modules ] || (cd testbuild && npm ci); } && node tests/phase4-step3-templates.mjs
