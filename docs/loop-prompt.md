You are one round of an automatic loop. Each round is a fresh session with no memory, so everything you need is in files. Do exactly one step, then stop.

0. Sync first. Run `git fetch origin`. If `origin/main` has commits your branch lacks and `git status` is clean, run `git rebase origin/main` before anything else, because progress.md on an old branch can be out of date and you would redo finished work. If you have uncommitted changes, finish the step first and rebase before running ship. If the rebase conflicts, run `git rebase --abort`, set STATUS: BLOCKED, name the files, and stop.
1. Read CLAUDE.md, docs/roadmap.md, docs/lab-assignments-checklist.md and docs/progress.md. If progress.md says STATUS: DONE or STATUS: BLOCKED, stop now and change nothing.
   If it has a line starting `FIX FIRST:`, your step is to fix that: read docs/last-check.log, fix the cause (never the test, unless the test itself is wrong and you say why), and run `bash scripts/check.sh` until it passes. Do no new step this round.
   A previous round may have been cut off by a usage limit. Run `git status`. If there are uncommitted changes, they belong to the step still unchecked in progress.md: inspect them, finish or fix that step, and do not start over.
2. Pick the first unchecked step under "Next steps" in progress.md. Do only that step. If it is too big for one session, split it into smaller steps in progress.md and do the first one.
3. Build the smallest version that works. Any page a student sees follows docs/design.md (colours, type, spacing, square corners, bundled free fonts, the "not affiliated" footer). Phase 0 code is in `testbuild/` (finished; its page now loads shared files from `app/`). Everything new goes in `app/`. Pyodide comes from `bash app/setup.sh`.
4. Make test data from independent sources only: NIST StRD certified values (download from https://www.itl.nist.gov/), or hand calculations from the lab scripts. Never take expected values from the app or from the library it uses. R is not installed. If a check needs R, mark the step BLOCKED.
5. Luis cannot test the product, so you must prove each step works yourself:
   - Write the test as a file `tests/<step>.sh` that exits 0 on pass, non-zero on fail, and runs without you. `scripts/check.sh` runs all of them, so every old test runs again on every round.
   - For anything a student sees, the test must drive the real page in a browser (Playwright): load it, enter data, check the on-screen result. Save a screenshot to `evidence/<step>.png`, then open it with the Read tool and judge it yourself against this list. Fix every failure and take a new screenshot, up to 3 times:
     - Axis labels show quantity, symbol and unit. Numbers are readable and use German format (decimal comma).
     - Data points and the fit line look different. Error bars are visible. A legend names each series.
     - Nothing overlaps, is cut off, or is empty. Text is large enough to read in a printed report.
     - The result line reads (value ± u) unit, rounded to the uncertainty, and the fit says which error method it used.
     - It matches docs/design.md: HU blue header, warm off-white page, square corners, no HU logo or name.
     - The page looks finished: aligned, consistent spacing, no raw error text or placeholder text.
     Write your verdict in the Log (pass, or what you fixed).
   - Also try one bad input (wrong file, empty data, impossible fit) and check the message is clear.
   Run `bash scripts/check.sh` and look at the real output. If a check fails, fix it and re-run, up to 3 tries. Never weaken a check to make it pass. Never call a step done without showing it working: paste the actual numbers into progress.md.
6. Update docs/progress.md: tick the step only if `bash scripts/check.sh` passes, add one line to the Log, and keep "Next steps" accurate. Write the Log line for a reader who cannot read code: what a student can now do, what was tested, pass or fail.
7. When the last step of a phase is ticked, check that phase's gate in docs/roadmap.md:
   - Every gate check passes with evidence: write the result in docs/phase<N>-report.md, set PHASE to the next phase, and write that phase's steps into "Next steps" from the roadmap and the checklist. Each step needs its own pass/fail check. Keep STATUS: RUNNING.
   - Phase 0 only: if the gate passes, keep Pyodide + Plotly and go on. If any gate check fails, set STATUS: BLOCKED with the evidence and a recommendation.
   - Any other gate check fails after 3 tries: STATUS: BLOCKED.
8. Last, run the ship skill with the argument --no-merge. Ship runs scripts/check.sh and must pass. If ship reports anything other than Shipped or Pushed, PR open, fix the cause and run ship again, up to 3 times, then set STATUS: BLOCKED. Never move on from a step whose ship failed. Then stop.

Set STATUS in progress.md:
- STATUS: RUNNING while there is work you can do alone.
- STATUS: BLOCKED when you need something only Luis can give (a decision, a file or dataset from his daughter, a login, a package not allowed), or the same check has failed in 3 rounds in a row. Write the exact question under "Blocked", still run ship so work is saved, and stop.
- STATUS: DONE when every phase you can finish alone has passed its gate. The rest needs people (instructor demos, her real data). List them under "For Luis" and stop.

Phase 2 assumes the experiments P1–P9 from the checklist, because the real list is not known yet. Say so in the phase report.

Do not push to main. Do not delete files you did not create. Install packages only with npm install, only when a step needs them, and name them in the Log.
