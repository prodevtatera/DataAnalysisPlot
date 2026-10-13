# Plan review: Gemini, GPT and Claude

Written 2026-10-13. Luis asked Gemini whether it could build QtiPlot online. He then asked Claude and GPT to review the answer. This file records what each proposed, what was wrong, and what everyone agreed on.

## 1. Gemini's original answer

Gemini's prompt was: "Scan this website and tell me if you would be capable of building this online."

Gemini said it was "fully capable". It mapped QtiPlot's features to web tools:
- Window manager: Dockview
- Tables: Glide, AG Grid or TanStack
- 2D plots: Plotly, ECharts or uPlot
- Formulas: KaTeX
- 3D: Three.js
- Fitting: `ml-levenberg-marquardt` or GSL compiled to WebAssembly
- Statistics: jStat or simple-statistics
- Python: Pyodide
- Import: SheetJS and PapaParse

It proposed four phases:
1. Workspace, table and 2D plots.
2. Statistics, fitting, FFT and KaTeX.
3. 3D plots, multi-layer graphs and saving projects.
4. Optional Python console.

## 2. Claude's review of Gemini

Verdict: it's a good list of features, not a plan.

What was wrong:
- **No goal.** It never asked who the app is for.
- **"Fully capable" oversells.** A demo of Phase 1 takes days. Matching QtiPlot takes years, given its 20+ years of development.
- **It listed options instead of making decisions.**
- **Wrong order.** Saving waited until Phase 3 and undo was never mentioned. Both shape how a project is stored, so they belong in Phase 1.
- **The math would be built twice.** It planned JavaScript statistics libraries first and Python later. The JavaScript libraries don't cover most of QtiPlot's tests.
- **No correctness checks.** QtiPlot itself checks its fitting against NIST datasets.
- **Smaller errors:**
  - It invented Butterworth and Chebyshev filters. QtiPlot has FFT filters instead.
  - It promised both "100% local" and "share via URL", but sharing needs a server.
  - It proposed `.qtiweb` file names, which use a trademark.
- **Missed scope.** It skipped about half the features. Most importantly, it never mentioned the click-to-edit graph editor. See `qtiplot-scope.md`.

Claude proposed:
- Pick one job and do it well instead of matching QtiPlot.
- Use one tool per job:
  - Plotly.js for every chart, 2D and 3D.
  - Pyodide with SciPy and statsmodels, in a Web Worker, for all math.
  - Glide Data Grid for tables and Dockview for windows.
- Build the foundations in Phase 1.
- Test every number automatically.
- Answer why someone would use it instead of the competition.
- Estimate the effort for each phase.

## 3. GPT's review of both

GPT said Gemini's direction was feasible and Claude's critique was substantially better. Then it corrected Claude.

Claude accepted these corrections:
- **Exporting figures.** Plotly WebGL charts (3D, `scattergl`) become pictures inside SVG exports. Normal 2D charts stay vector.
- **Project file.** Plotly's chart settings aren't the whole project file. It also needs raw data, column roles, analysis settings and dependencies.
- **Checking the math.** Checking SciPy against SciPy proves nothing. Use NIST certified values and R.
- **Databases.** "SQL needs a server" was too broad. A local SQLite file works in the browser. Only remote databases need a server.
- **"Roughly half."** That was a guess, not a counted inventory.

GPT added these points, which we kept:
- When data changes, an existing fit must recalculate or be marked out of date.
- Fit uncertainty depends on weighting and covariance choices (`curve_fit`'s `absolute_sigma`). The app must state which method it used.
- Failed fits, bad data and unsupported features need clear messages.
- Every feature needs an acceptance check, and speed claims need measurements.

Where GPT fell short:
- It didn't decide anything. It called Plotly "a candidate".
- Its first release repeated Claude's suggested workflow in 6 steps.

## 4. The goal became clear

Luis said the app is first for university students. He wants it to be really useful and not "half things", because students will ignore it if it doesn't catch their attention at first view. Then he narrowed the target to year 1–2 Biology at HU Berlin, where his daughter studies.

GPT then proposed a "complete university analysis workspace" covering data, plots, fitting, statistics, signal processing, figure preparation, projects and teaching. It gave its first impression its own workstream.

Claude's response:
- GPT changed its advice because Luis pushed back, not because of new evidence. It also didn't say what its scope would cost (likely several months for one person with AI help).
- What catches students' attention:
  - Their own lab report gets done faster.
  - The first figure looks good enough for a report without fiddling.
  - The results are correct and correctly rounded, like "2.31 ± 0.04".
  - It opens with no signup and no install.
- Define "complete" as every real year 1–2 assignment working from start to finish, faster than in Excel. Not as a feature list.
- Lecturers decide adoption, so lecturer templates belong in the launch. Talk to 3–5 instructors early.

## 5. Agreed principles

1. Build one complete, trustworthy workflow first, then widen it to cover every real assignment.
2. Correct numbers and polish come before feature count.
3. Phase 1 includes the project format, live updates, undo/redo and save/load.
4. Check numbers against independent references (NIST, R), automatically.
5. Measure performance. Don't claim it.
6. Plan and review before writing code, then deliver in milestones with evidence.

## 6. Draft launch scope (superseded)

The newer scope in `lab-assignments-checklist.md` replaces this one. It's kept to show how the plan changed.

Claude wrote this before the biology research came in. It was aimed at general science labs. Revise it once `lab-assignments-checklist.md` is done. Biology will probably move non-parametric tests, two-way ANOVA and chi-square goodness-of-fit (genetics) into the launch, and make error propagation less central.

| Area | Launch | Later |
|---|---|---|
| Data | Paste from Excel, CSV/Excel import, editable table, formula columns, uncertainty columns with error propagation | Databases, Matlab and Origin files |
| Plots | Scatter and line with error bars, bar, histogram, box plot, two Y axes, simple side-by-side panels | 3D, contour and heatmap plots, vector fields |
| Fitting | Linear, polynomial, exponential, power, Gaussian, custom formula; weighted fits, residuals, correctly rounded results | Multi-peak fitting, parameter limits |
| Statistics | Summary statistics, t-tests, one-way ANOVA, normality check, correlation, results explained in plain words | Two-way ANOVA, non-parametric tests (check against the biology research) |
| Signals | Smoothing, derivative, area under a curve, FFT, interpolation | Filters, convolution |
| Export | Print-quality PNG, SVG and PDF; copy straight into Word or Google Docs | LaTeX formats |
| Projects | Save and open, autosave, undo and redo | Shared live projects |
| Lecturers | Template projects instructors can hand out | |
| First view | An example already plotted and fitted, drag in your own file, no signup | |
