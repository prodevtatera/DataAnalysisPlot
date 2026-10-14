cd "$(dirname "$0")/.." && { [ -d testbuild/node_modules ] || (cd testbuild && npm ci); } && node tests/phase2-step17-gate.mjs && {
  # The gate report must exist and say what is measured, what is estimated, and that P1 to P9 are an assumption.
  for w in "P1 to P9" "Measured" "Estimated" "Excel" "R is not installed" "real student" "assumed"; do
    grep -qi "$w" docs/phase2-report.md || { echo "FAIL: docs/phase2-report.md lacks \"$w\""; exit 1; }
  done
  grep -q "^## For Luis" docs/progress.md || { echo "FAIL: progress.md has no For Luis"; exit 1; }
}
