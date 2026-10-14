cd "$(dirname "$0")/.." && { [ -d testbuild/node_modules ] || (cd testbuild && npm ci); } && bash testbuild/setup.sh && node tests/step5-load.mjs
