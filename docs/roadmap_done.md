# Roadmap: what is done

Moved out of `roadmap.md` on 2026-10-14. Everything here was built and checked by `bash scripts/check.sh` (40 checks, all pass). The open items from these phases (R, a real student, her real data, instructor demos) are in `roadmap.md`.

## Phase 0: One-day test build. Gate passed

One page: paste a CSV, plot it with error bars, fit a curve with SciPy in the browser.

- Fits match 3 NIST datasets (certified values). Done.
- Load time and download size measured, with device, browser and file size stated. Done.
- A figure exports as PNG and SVG and looks fit for a lab report. Done.
- Decision: keep Pyodide + Plotly. Done.

Evidence: `docs/phase0-report.md`, `docs/nist-results.md`, `docs/phase0-timing.md`.

## Phase 1: Foundations plus P3 Elasticity. Gate passed, with two parts open

Built: project file, editable table with live plot, undo and redo, save and open, autosave, German number input and output, weighted and unweighted line fit with scaled and unscaled errors and χ²/DoF, result line in HU format, results that go out of date when data changes, clear messages for bad data and failed fits.

Gate:
- Edit a cell: plot and fit update. Undo: they revert. Save, close, reopen: nothing lost. **Passed.**
- Weighted-fit numbers match NIST (Norris, 9 digits) and an exact hand calculation. **Passed.** The R half is open (see `roadmap.md`).
- P3 start to finish in the app, faster than in Excel. **Passed on counted actions** (7 to 9 in the app against about 40 in Excel, an estimate). A timed real student is open (see `roadmap.md`).

Evidence: `docs/phase1-report.md`.

## Phase 2: All Physics 2 experiments P1 to P9. Gate passed on invented data

Built: formula columns with error propagation, mean and spread with n or n−1, weighted mean with overlap check, frequency table and histogram with normal curve, cumulative plot with the 16 % and 84 % read-off, general derived quantities from fit parameters, several series with their own x range, calibration line with an unknown read off, semi-log axis, χ² against Poisson and Gauss, confidence interval with the t distribution, comparison of a measured and a calculated value, PNG and SVG export for every plot, 12 template projects.

Gate:
- Each of P1 to P9 passes its own check, against hand calculations. **Passed**, on invented example data.
- Every number checked against a hand calculation from the script. **Passed.** R is open.
- Show it to her and compare her time with her current tool. **Open.**

Phase 2 assumed P1 to P9, because the real experiment list is not known yet. Evidence: `docs/phase2-report.md`.

## Phase 3: Show lecturers. Built parts done, gate is open

Built:
- First minute: a finished, fitted example opens on the first visit, a file can be dropped, an empty table is one click away, no signup.
- German first, English second.
- Own numbers can be pasted into a template.

Evidence: `docs/phase3-report.md`.

## Open questions for the daughter (asked, no answers yet)

The questions are still in `roadmap.md`.
