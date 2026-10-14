cd "$(dirname "$0")/.." && { [ -d testbuild/node_modules ] || (cd testbuild && npm ci); } && node tests/phase4-step6-gate.mjs && {
  # The gate report must exist and say what was measured and what was not.
  for w in "Before" "After" "16 sections" "55 buttons" "6441" "No real student" "Not tested" "1200 x 800"; do
    grep -q "$w" docs/phase4-report.md || { echo "FAIL: docs/phase4-report.md lacks \"$w\""; exit 1; }
  done
  grep -q "^STATUS: DONE" docs/progress.md || { echo "FAIL: progress.md is not STATUS: DONE"; exit 1; }
}
