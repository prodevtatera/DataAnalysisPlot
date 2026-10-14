cd "$(dirname "$0")/.." && { [ -d testbuild/node_modules ] || (cd testbuild && npm ci); } && python3 -I tests/reference/templates.py > /dev/null && node tests/phase2-step15-templates.mjs
