#!/usr/bin/env bash
# The one acceptance command. Runs every test in tests/*.sh; any failure fails the whole check.
# Used by the loop between rounds and by /ship before every commit. Each round adds its own tests.
set -u
cd "$(dirname "$0")/.."

tests=(tests/*.sh)
if [ ! -e "${tests[0]}" ]; then
  # ponytail: no tests is fine only while nothing has been built yet.
  grep -q '^- \[x\]' docs/progress.md && { echo "FAIL: steps are ticked but tests/ has no tests"; exit 1; }
  echo "no tests yet, nothing built"; exit 0
fi

# Pyodide is not committed (about 31 MB); this downloads it once so a fresh checkout works.
bash app/setup.sh || { echo "FAIL: app/setup.sh could not get Pyodide"; exit 1; }

failed=0
for t in "${tests[@]}"; do
  if bash "$t"; then echo "PASS $t"; else echo "FAIL $t"; failed=1; fi
done
exit $failed
