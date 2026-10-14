# Phase 2 report: all Physics 2 experiments P1 to P9

Date: 2026-10-14. Code in `app/`, checks in `tests/`, all run by `bash scripts/check.sh` (33 checks, all pass). Evidence is in `evidence/` and the tests named below.

## Verdict

**Every experiment of the assumed list passes its own check with hand-calculated numbers. Three gate items cannot be closed without people: real data from the daughter, the R cross-check, and a timed run with a real student.** Those are under "For Luis" in `docs/progress.md`. Everything that can be done alone is done for the app as a calculator. A new gap showed up while writing this report (see "Gaps found at the gate"): there is no good way yet to put the student's own numbers into a template. That is Phase 3 step 1.

## Phase 2 assumed P1 to P9

The real list of Physics 2 experiments is not known. Phase 2 assumed that the experiments are P1 to P9 of `docs/lab-assignments-checklist.md` (HU-confirmed for P1 to P6 by the research reports, from the HU script only for P7 to P9). If her list differs, the templates and steps are revised. Nothing here says the app covers her actual lab.

## What is measured and what is estimated

| Thing | Status |
|---|---|
| Result numbers of P1 to P9 | **Measured against hand calculations** (exact fractions, hand-derived partial derivatives, closed-form p-values, textbook t and χ² table values), written in separate Python files under `tests/reference/` that use no SciPy and no app code. |
| Machine time and number of actions per experiment | **Measured** by `tests/phase2-step17-gate.sh` (below), headless Chromium on an Apple M5, 16 GB, local server, invented data. |
| Time in Excel and number of Excel actions | **Estimated.** I listed the steps in German Excel and counted. Nobody timed it. QtiPlot was not compared at all. |
| Whether a real student finds it faster or clearer | **Not measured.** No real student has used the app. |
| Real data | **None.** Every template holds invented numbers, and the page says so. |
| R cross-check | **Not done.** R is not installed. Hand calculations and NIST (for the line fit, Phase 0 and 1) stand in for it. |

## Gate checks

| Gate check | Result | Evidence |
|---|---|---|
| Each of P1 to P9 passes its own check from the checklist, on real data if we can get it | **Pass on invented data; real data not available.** All twelve templates (P5, P6 and P8 have two each) reach their final result lines with the hand-calculated numbers. See the table below. | `tests/phase2-step15-templates.sh` (P1 to P5), `tests/phase2-step16-templates.sh` (P6 to P9), `tests/phase2-step17-gate.sh`, `evidence/phase2-step15-*.png`, `evidence/phase2-step16-*.png`, `evidence/phase2-step17-gate.png` |
| Every number checked against R or a hand calculation from the script | **Hand calculation: pass. R: open.** Reference scripts: `tests/reference/templates.py`, `templates2.py`, `histogram.py`, `weighted_mean.py`, `weighted_line.py`, `calibration.py`, `series_fit.py`, `gof.py`, `ci_t.py`, `derived_g.py`. The line fit also agrees with NIST Norris to 9 digits (`docs/phase1-report.md`). | the tests named above and in the table |
| Show it to her; her time on one experiment is compared with her current tool | **Open, needs her.** | "For Luis" |

## The nine experiments

Actions = clicks on a list or button from "choose the template" to the last result (focusing is not counted; entering the student's own numbers is not counted, in the app or in Excel). Time = machine time of that run, measured; it is not a student's time. The Python engine is ready once per visit after 2.5 s on this machine (local server, no download; the real first visit adds about 24.7 MB compressed, see `docs/phase0-report.md`). Excel actions are estimates of the setup work (helper cells, formulas, chart settings), without typing the numbers.

| Experiment | Result with invented data (checked by hand) | App actions | Machine time | Excel actions (estimate) |
|---|---|---|---|---|
| P1 Fehlerverteilung | x̄ = (10,05 ± 0,05) mm; 16 % and 84 % read-off 9,812 and 10,36 mm; table counts 2, 5, 9, 8, 4, 2 | 4 | 168 ms | about 25 |
| P2 Volumenmessung | weighted V = (10,02 ± 0,09) cm³; overlap check names rows 1 and 3, 2 and 3 | 4 | 107 ms | about 18 |
| P3 Elastizität | a = (0,02529 ± 0,00029) mm/N; slopes compared 0,7596 combined u; E = (201 ± 8) GPa | 5 | 204 ms | about 55 for loading and unloading (about 40 for one series) |
| P4 Oberflächenspannung | σ = (72,6 ± 0,5) mN/m | 4 | 130 ms | about 35 |
| P5 Polarimetrie | [α] = (66,6 ± 0,4) °/(dm·g·mL⁻¹) | 3 | 91 ms | about 30 |
| P5 Newtonsche Ringe | R = (0,9989 ± 0,0012) m | 4 | 139 ms | about 35 |
| P6 Wheatstone | Rx weighted = (219,4 ± 1,0) Ω; 0,248 combined u from the nominal value, agrees | 4 | 96 ms | about 25 |
| P6 Gitter | λ = (632,1 ± 0,9) nm; 0,778 combined u from 632,8 nm, agrees | 4 | 99 ms | about 25 |
| P7 Refraktometer | unknowns (11,21 ± 0,19) %, (17,30 ± 0,20) %, (28,84 ± 0,21) % with the covariance term; third one flagged as outside the standards | 4 | 135 ms | about 35 |
| P8 Zählraten | χ² Poisson 1,43 (3 dof, p = 0,698), Gauß 0,775 (2 dof, p = 0,679); classes with expected count below 5 warned | 3 | 689 ms | about 25 |
| P8 Zerfallskurve | semi-log plot with 8 error bars, ready on load | 2 | 38 ms | about 12 |
| P9 Pendel | g mean (9,81 ± 0,05) m/s² with 95 % interval (t = 2,776); g = (9,83 ± 0,06) m/s² from T²(l) | 5 | 164 ms | about 30 |

How the Excel estimates were made: weighted fits need helper cells for the sums (Excel has no weighted fit), per-point error bars need a custom-range setting in the chart, propagation needs one formula per partial derivative, the weighted mean needs a SUMPRODUCT, and the p-values need POISSON.VERT and CHIQU.VERT with manual merging of classes. The P3 count (about 40 for one series) comes from the Phase 1 report. These numbers are a guess with a wide margin (plus or minus a third). The app counts are exact, but they assume the template does the setup, which is the whole idea of a template.

What this does show: for these nine tasks, the app needs 2 to 5 clicks where Excel needs roughly 12 to 55 steps, and each calculation takes under 0,7 s of machine time. What it does not show: how long a student needs who has never seen the page, or the time to replace the invented numbers with her own (next section).

## Gaps found at the gate

1. **Putting her own numbers into a template is awkward.** The table accepts one cell at a time. The "Daten einfügen" box replaces the whole project (new table, no formula columns, no template steps). So the 2 to 5 clicks above leave out the data entry, and a student would type every raw cell by hand. This is the first Phase 3 step.
2. **A fresh visit shows an empty page** with buttons, not a finished example. Roadmap Phase 3 asks for the finished example on first visit.
3. **The interface is German only.** Roadmap: German first, English second.
4. The templates and every number rest on the guess P1 to P9 and on invented data.
5. R is not installed, so no cross-check against R. Weighted fits have no NIST certified data, so hand calculation is the only independent check for them (as in Phase 1).
6. Measured speed is on one machine with invented data of 3 to 40 values. No measurement on a phone, an old laptop, a real network or large data.

## Tests added by the gate

`tests/phase2-step17-gate.sh` runs all twelve templates through their steps in a real browser and checks the final result lines, no stale or error message left, the semi-log plot of the decay, the action counts, and a bad input (loading with no template chosen). It also checks that this report says what is measured and what is estimated, and that the P1 to P9 assumption is stated.
