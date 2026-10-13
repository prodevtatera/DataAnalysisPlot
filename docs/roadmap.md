# Roadmap

Written 2026-10-13. Only phases 0 and 1 are firm. Phases 2 and 3 get revised after phase 1.

## What we know

- The first real use is **Physics 2**, the physics lab that Biology students take at HU Berlin. That is all Luis's daughter knows so far.
- We don't yet know which experiments she will get. We assume they come from the HU physics script for non-physicists. Those are items P1–P9 in `lab-assignments-checklist.md`. Treat them as a guess until she confirms.
- The physics lab recommends QtiPlot and advises against spreadsheets for regression. So the first competitor is QtiPlot, and Excel is second.
- Physics items need weighted fits, error propagation and HU's rounding rule. Those are the hardest numbers to get right, so we start there.

## How to read this

- Each phase ends with a **gate**: a pass/fail check shown working, not described.
- A phase does not start until the previous gate passes.
- Effort figures are rough guesses for one person working with AI help. Replace them with real numbers after phase 0.

## Phase 0: One-day test build (about 1 day)

One page: paste a CSV, plot it with error bars, fit a curve with SciPy in the browser.

**Gate:**
- Fits match 3 NIST datasets (certified values).
- Load time and download size measured. State the device, browser and file size.
- A figure exports as PNG and SVG and looks fit for a lab report.
- Decision made: keep Pyodide + Plotly, or change.

If the gate fails, we change the stack before writing anything else.

## Phase 1: Foundations plus one physics experiment (about 3–5 weeks)

Build the parts that decide how a project is stored, and prove them on a single experiment (P3 Elasticity, a line fit with a derived quantity).

Build:
- Project file: raw data, column roles (X, Y, error), analysis settings, and which results depend on which data.
- Table with live updates to the plot.
- Undo and redo. Save and open. Autosave.
- German number input and output (decimal comma, semicolon CSV).
- Weighted and unweighted linear fit. Show parameter errors both scaled and unscaled, and χ²/DoF. State the uncertainty method on screen.
- Result line in HU format: (value ± u) unit, rounded to the uncertainty.
- Fit goes stale or recalculates when data changes.
- Clear messages for failed fits and bad data.

**Gate:**
- P3 works start to finish in the app, faster than in Excel (timed, on real or realistic data).
- Weighted-fit results match R and NIST (see the "Rechnet QtiPlot falsch?" note in the checklist).
- Edit a data cell: plot and fit update. Undo it: they revert. Save, close, reopen: nothing lost.

## Phase 2: All Physics 2 experiments (about 4–6 weeks)

Widen to every item P1–P9, using whatever list the daughter confirms.

Build as needed by those items:
- Formula columns with error propagation (P2, P5, P6).
- Histogram with normal curve, cumulative and probability plots (P1).
- Calibration line with an unknown read off it, with uncertainty (P4, P7).
- Semi-log axes and χ² goodness-of-fit against Poisson and Gauss (P8).
- Confidence intervals and linearised regression (P9).
- Weighted mean with uncertainty (P2).
- One template project per experiment.

**Gate:**
- Each of P1–P9 passes its own check from the checklist, on real data from the daughter if we can get it.
- Every number checked against R or a hand calculation from the script.
- Show it to her. Her time on one experiment is compared with her current tool.

## Phase 3: Show lecturers (about 2 weeks, partly waiting)

Lecturers decide the tools. Winning one matters more than many students.

- Polish the first minute: finished example open on first visit, drag in a file, no signup.
- German first, English second.
- Demo to 3–5 Physics 2 lab instructors. Ask what they would need to put it in the lab manual.
- Write down what they ask for.

**Gate:** at least one instructor says they would try it in a lab group, or we learn exactly what blocks that.

## Later: Biology widening (not planned in detail)

B1–B13 in the checklist: standard curves, enzyme kinetics, growth curves, non-parametric tests, ANOVA, diversity indices. Plan this only after phase 3, once we know whether Physics 2 landed. Biology courses depend on Moodle material we don't have yet.

## Open questions for the daughter

1. Which Physics 2 experiments will you do? Any script or protocol PDFs?
2. Which software does the lab use for plots and fits (QtiPlot, Excel, other)?
3. What takes longest or annoys you most?
4. Can we use one of your own datasets from last semester to test with?
