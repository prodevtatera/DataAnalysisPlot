cd "$(dirname "$0")/.." && { [ -d testbuild/node_modules ] || (cd testbuild && npm ci); } && bash app/setup.sh && node tests/phase2-step14b-move.mjs
