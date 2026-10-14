# Phase 1 report: foundations plus P3 Elasticity

Date: 2026-10-14. Code in `app/`, checks in `tests/`, all run by `bash scripts/check.sh` (15 checks, all pass). Evidence is in `evidence/` and the tests named below.

## Verdict

**Two of the three gate items pass; the R half of the second is open.** The app can do P3 Elasticity from pasted data to a saved project with a result line in HU format. Open and not provable without people: the R cross-check (R is not installed), a human timing against Excel, and whether a real student finds it clear. These are under "For Luis" in `docs/progress.md`. STATUS stays RUNNING because Phase 2 can start without them.

## Gate checks

| Gate check | Result | Evidence |
|---|---|---|
| P3 works start to finish, faster than in Excel | **Pass on number of actions; time against Excel is estimated, not measured.** See the next section. | `tests/phase1-step8-timed.sh`, `evidence/phase1-step8-timed.png`, `tests/phase1-step6-elasticity.sh` |
| Weighted-fit results match R and NIST | **NIST: pass. R: open.** Line fit against NIST Norris (36 points): slope, intercept, their errors and the residual sum of squares agree to 9 or more digits. Weighted fit: with equal errors it equals the unweighted NIST result (9 digits); with unequal errors it matches a separate exact-fraction Python script to 9 digits. NIST has no certified weighted line data, so that case rests on the hand calculation. R is not installed. | `tests/phase1-step7-reference.sh`, `tests/reference/weighted_line.py`, `evidence/phase1-step7-*.png` |
| Edit a cell: plot and fit update. Undo: they revert. Save, close, reopen: nothing lost | **Pass.** Edit gives a new plot and marks both results out of date; undo restores plot and makes results fresh again. A project saved to a file and opened in a brand-new browser profile has identical data, roles, settings, inputs and results, all fresh. Also: autosave survives reload. | `tests/phase1-step8-timed.sh`, `tests/phase1-step2-table.sh`, `-step3-undo.sh`, `-step4-autosave.sh`, `tests/step1-project.sh` |

Other Phase 1 "Build" items, all done and tested: project file with data, column roles, settings and results with data fingerprints; editable table with live plot; undo and redo; autosave with a "Wiederhergestellt" note; German numbers in and out (decimal comma, semicolon or tab paste); weighted and unweighted line fit with scaled and unscaled errors, χ²/DoF and the method named on screen; result line (value ± u) unit; results go out of date when data changes; clear German messages for bad paste, bad cells, error value 0, too few points, damaged files, wrong units.

## The timed P3 run

What is measured: `tests/phase1-step8-timed.sh` drives the real page in headless Chromium on an Apple M5 (10 cores, 16 GB), local server. It pastes the six-row German-format P3 table, presses "Anpassen", types L, u(L), d, u(d), presses "E berechnen", reads the three result lines and saves the project.

- **9 user actions** (a click on a button or list, or one paste or entry into one field; focusing a field is not counted): paste, "Als Tabelle übernehmen", "Anpassen", 4 entries, "E berechnen", "Projekt speichern". Roles (x, y, error) and weighting are right by default, so no action is needed for them.
- **Machine time of that run: 219 to 291 ms** (four runs: 291, 267, 226, 219 ms). This is the computer's time, not a person's.
- **Once per visit, before the first fit: 4.6 to 5.3 s** until Python is ready (local server, nothing downloaded over a network). On a first real visit add the download (about 24.7 MB compressed, see `docs/phase0-report.md`).
- Result on screen: a = (0,02529 ± 0,00029) mm/N, b = (0,007 ± 0,011) mm, E = (201 ± 8) GPa. These equal the numbers calculated separately by hand in step 6.

What the same task takes in Excel: **estimated, not measured with a person.** I listed the steps a student has to do in German Excel for the same result (a weighted slope with per-point error bars, as the lab sheet asks, and E with its uncertainty):

| Part | Excel actions (estimate) |
|---|---|
| Paste the data | 1 |
| Weighted slope and intercept with errors: Excel has no weighted fit, so helper cells for 1/s², Σw, Σwx, Σwy, Σwx², Σwxy, determinant, a, b, u(a), u(b), χ², scaling (formulas typed or copied) | about 15 |
| Chart: scatter plot, axis titles with units, custom y error bars from a range, fit line as a second series | about 16 |
| E, its uncertainty, and the L, u(L), d, u(d) inputs (formulas) | about 6 |
| Round to (value ± u) by hand, type the result line | about 2 |
| Save | 1 |
| **Total** | **about 40 (lower bound about 30)** |

For comparison, an unweighted fit in Excel with `RGP` (LINEST) is quicker, about 10 actions, but it ignores the error values and gives no per-point error bars without the chart steps above, which is the case the checklist says Excel cannot do. So: 9 actions in the app against about 40 in Excel is a measured count against an estimated one. If a person needs 2 to 4 seconds per action, the app takes roughly 20 to 40 seconds and Excel 1.5 to 3 minutes; that conversion is a guess, not a measurement. QtiPlot was not compared at all.

Limits of this claim: a student who has never seen the app needs more time to find the buttons; the typed data in the real lab has more rows; the first visit is slow (Python load, download). A timed run with a real student is under "For Luis".

## Changed in this round

- The fit details text no longer names `absolute_sigma` (the line fit is solved directly now). It says "gewichtete Methode der kleinsten Quadrate (Gewichte 1/s²); Fehler mit √(χ²/DoF) skaliert" or "Fehler unskaliert, direkt aus den Fehlerwerten", and "Methode der kleinsten Quadrate, ungewichtet" for the unweighted fit. Test wording in `tests/phase1-step5-fit.mjs` updated, and it now checks that "absolute_sigma" is not shown.
- New "Daten einfügen" box in the app: paste from Excel or CSV and press "Als Tabelle übernehmen". Before, the app could only load the two examples or a saved project, so a student could not start with their own numbers. Limit: pressing it replaces the current table and clears undo (the same as loading an example).

## Known gaps carried into Phase 2

- The app still borrows fonts, Plotly, rounding and the parser from `testbuild/`; the fit worker and Pyodide too.
- No figure export in the app page yet (the test build has PNG and SVG).
- P3 only covers the Young's modulus from the slope. The loading versus unloading comparison and the shear modulus are not done.
- The derived quantity is hard-wired to E; Phase 2 makes it a general formula.
- Only straight lines in the app; no Michaelis-Menten (not needed for Physics 2).
- No R cross-check; no statsmodels yet.

## Phase 2 assumption

Phase 2 assumes the Physics 2 experiments are P1 to P9 of `docs/lab-assignments-checklist.md`, because the real list from Luis's daughter is not known yet. If her list differs, the steps are revised.
