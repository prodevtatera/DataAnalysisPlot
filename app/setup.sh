#!/usr/bin/env bash
# Puts Pyodide (Python in the browser) with NumPy and SciPy into app/vendor/pyodide, so the page loads nothing from outside.
# The scipy file comes last: it is the marker that everything is there.
# Not committed (about 31 MB). Skips work if already there. Needs only curl, no npm.
set -e
cd "$(dirname "$0")"
D=vendor/pyodide
SCIPY=scipy-1.18.0-cp314-cp314-pyemscripten_2026_0_wasm32.whl
[ -e $D/$SCIPY ] && exit 0
mkdir -p $D
for f in pyodide.js pyodide.mjs pyodide.asm.mjs pyodide.asm.wasm python_stdlib.zip pyodide-lock.json numpy-2.4.6-cp314-cp314-pyemscripten_2026_0_wasm32.whl libopenblas-0.3.31.zip $SCIPY; do
  curl -fsSL -o $D/$f.part https://cdn.jsdelivr.net/pyodide/v314.0.7/full/$f && mv $D/$f.part $D/$f
done
