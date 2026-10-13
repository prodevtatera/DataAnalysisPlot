# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A free, browser-based data analysis and plotting app for university students. It is inspired by QtiPlot (https://www.qtiplot.com), but it is not a clone.

Status on 2026-10-13: planning only. There is no code yet.

## Who it is for

- The first users are Biology Bachelor students in years 1 and 2 at Humboldt-Universität zu Berlin (HU Berlin).
- Luis's daughter studies Biology there. She is the best source of real assignments and feedback. Most course material sits in HU's Moodle, behind a student login.
- Lecturers and lab instructors decide which tools students use, because students follow the lab manual. Winning one instructor matters more than winning individual students.

## What the research found (2026-10-13)

Full detail is in `docs/lab-assignments-checklist.md` and `docs/research/`.
- **HU already teaches QtiPlot.** The Biology mentoring programme runs workshops on "Excel, QtiPlot und LaTeX". The physics lab that biology students take (BioB 9 and 14) recommends QtiPlot. This app replaces QtiPlot and Excel for these students.
- **QtiPlot has a known problem at HU.** HU lab staff documented that its weighted-fit parameter errors need manual √(χ²/DoF) scaling. Excel can't do weighted fits or per-point error bars. Correct, transparent weighted fits are a concrete hook.
- **Teaching is in German.** The UI must be German first, and number input and output must handle decimal commas and semicolon CSV files.
- **HU's result format:** (value ± u) unit. Round u to 1 significant digit, or 2 if that digit is 1 or 2, and round the value to match.
- **Statistics:** only BioB 6 (semester 2) teaches it, covering distributions, correlation, regression and test statistics. Other universities' year 1–2 labs use t-tests, χ², ANOVA with corrections, Mann-Whitney/Wilcoxon and Kruskal-Wallis.
- **The everyday biology work** is dilution and unit bookkeeping, calibration lines with unknowns read off, Lambert-Beer, linear regression, replicate means, initial rates and semi-log plots. Lab scripts ask for Lineweaver-Burk, not nonlinear Michaelis-Menten fits.
- **No evidence for FFT or signal processing** in year 1–2 biology, so it moves to later.
- **Missing:** HU's own biology lab and statistics material is in Moodle behind a login. Get it through Luis's daughter. Don't use the Moodle enrolment keys that appear in public course listings.

## Luis's launch bar

Luis wants the first release to feel complete. Students should see its value at first view. He does not want "half things".

How we turned that into something testable:
- "Complete" means a student can do every real year 1–2 lab assignment from start to finish in the app, faster than in Excel. It does not mean matching QtiPlot's feature list.
- Correct numbers and polish come before more features. A wrong p-value or a clumsy editor loses students for good. A missing niche test doesn't.
- In the first minute, a student sees a finished example (plotted and fitted), drags in their own file and gets a result. No signup and no install.

The list of real assignments is the launch checklist. See `docs/lab-assignments-checklist.md` (being built from the research in `docs/research/`).

## Rules for this project

- Don't use the QtiPlot name, logo or branding. QtiPlot is a trademark of IONDEV SRL.
- Check every numerical feature against an independent reference: NIST StRD certified values (nonlinear regression, linear regression, ANOVA, summary statistics) or R. Never check against the library the app itself uses.
- Fit results must state the uncertainty method. For example, SciPy's `curve_fit` scales parameter errors by the reduced chi-square unless `absolute_sigma=True`.
- When data changes, existing fits and statistics must recalculate or show as out of date.
- Failed fits, invalid data and unsupported features must show a clear message.
- Measure speed and download size. State the device, browser and dataset size.
- Don't call a milestone done without showing the result working.
- Each feature needs a pass/fail acceptance check tied to a real assignment.

## Proposed technical direction (not final)

These choices still need to pass the one-day test build (see Next steps):
- Charts: Plotly.js for 2D and 3D. Caveat: Plotly draws WebGL charts (3D, `scattergl`) as pictures inside SVG/PDF exports, so they aren't true vector graphics. Normal 2D charts stay vector.
- Math: Pyodide (Python in the browser) with SciPy and statsmodels, running in a Web Worker. It costs tens of MB on first load, which the browser then caches. Measure this.
- Tables: Glide Data Grid. Windows: Dockview.
- Phase 1 must include the project file format, live updates from table to plot, undo/redo, and save/load. These decide how a project is stored, so adding them later means a rewrite.
- The project file needs more than Plotly's chart settings. It also needs raw data, column roles (X, Y, error), analysis settings and which results depend on which data.
- Browser limits: Excel embedding is impossible. Remote databases (MySQL, PostgreSQL) need a server, but local SQLite works in the browser. The serial port only works in Chrome and Edge.

## Next steps

1. Get real HU biology material from Luis's daughter. The checklist lists exactly what to ask for, including BioB 6 statistics sheets and the BioB 8, 11, 13 and 15–18 lab instructions. Also ask which software she uses (QtiPlot, Excel, R?) and what annoys her most. Add her assignments to the checklist.
2. Run a one-day test build: one page where you paste German-format data (decimal commas) and plot it with error bars. Fit it two ways with SciPy in the browser:
   - a weighted linear fit, showing scaled and unscaled errors and χ²/DoF;
   - a Michaelis-Menten fit.

   Check the results against NIST datasets and R. Measure load time and test figure export.
3. Write the launch specification, using the checklist as acceptance tests.
4. Show the test build to 3–5 lab instructors early.

## Documents

- `docs/plan-review.md`: what Gemini, GPT and Claude proposed, where each went wrong, the agreed principles and the draft launch scope.
- `docs/qtiplot-scope.md`: QtiPlot's full feature inventory from its website and manual, with browser feasibility notes.
- `docs/gemini-prompt.md`: a better prompt for asking another model to plan this.
- `docs/research/`: raw research reports (HU programme, HU lab courses, other universities' biology labs, student tools and pain points).
- `docs/lab-assignments-checklist.md`: real assignments turned into launch acceptance checks.
- `docs/roadmap.md`: phases and pass/fail gates. First target is Physics 2 (the HU physics lab for Biology students).

## Working with Luis

- Lead with the verdict and use plain, jargon-free language.
- Luis compares plans from several models (Gemini, GPT, Claude). Give honest critique, correct your own earlier mistakes openly, and make decisions instead of listing options.
