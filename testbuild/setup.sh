#!/usr/bin/env bash
# Puts Pyodide (Python in the browser) with NumPy and SciPy into testbuild/vendor/pyodide, so the page loads nothing from outside.
# Skips work if already there. Needs `npm ci` first (the core files come from the npm package).
set -e
cd "$(dirname "$0")"
D=vendor/pyodide
SCIPY=scipy-1.18.0-cp314-cp314-pyemscripten_2026_0_wasm32.whl
[ -e $D/$SCIPY ] && exit 0
mkdir -p $D
for f in pyodide.js pyodide.mjs pyodide.asm.js pyodide.asm.mjs pyodide.asm.wasm python_stdlib.zip pyodide-lock.json; do
  [ -e node_modules/pyodide/$f ] && cp node_modules/pyodide/$f $D/
done
for f in numpy-2.4.6-cp314-cp314-pyemscripten_2026_0_wasm32.whl $SCIPY libopenblas-0.3.31.zip; do
  curl -fsSL -o $D/$f https://cdn.jsdelivr.net/pyodide/v314.0.7/full/$f
done
