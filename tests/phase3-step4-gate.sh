cd "$(dirname "$0")/.." && { [ -d testbuild/node_modules ] || (cd testbuild && npm ci); } && node tests/phase3-step4-gate.mjs && {
  # The gate report must exist and say what is measured, what is not, and that the people gate cannot pass alone.
  for w in "Measured" "Not measured" "No instructor" "people gate" "cannot pass alone" "R is not installed" "real student" "invented"; do
    grep -qi "$w" docs/phase3-report.md || { echo "FAIL: docs/phase3-report.md lacks \"$w\""; exit 1; }
  done
  grep -q "^STATUS: DONE" docs/progress.md || { echo "FAIL: progress.md is not STATUS: DONE"; exit 1; }
  grep -q "^## For Luis" docs/progress.md || { echo "FAIL: progress.md has no For Luis"; exit 1; }
}
