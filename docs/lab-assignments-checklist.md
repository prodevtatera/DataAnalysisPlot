# Lab assignments checklist (launch acceptance tests)

Built on 2026-10-13 from the four reports in `research/`. This replaces the draft launch scope in `plan-review.md`.

The launch is "complete" when a student can do every assignment below from start to finish in the app, faster than in Excel, with numbers that match an independent reference.

## What the research changed

1. **HU already teaches QtiPlot.**
   - The Biology mentoring programme runs workshops on "Excel, QtiPlot und LaTeX".
   - The physics lab that biology students take recommends QtiPlot and advises against spreadsheets for plots and regression.
   - So this app replaces a tool HU students are already told to use. Excel is the other tool to beat.
2. **QtiPlot has a known problem at HU.**
   - HU lab staff wrote a note, "Rechnet QtiPlot falsch?", saying QtiPlot's weighted-fit parameter errors need manual √(χ²/DoF) scaling and its "scale errors" option does nothing.
   - Excel can't do weighted fits or per-point error bars without workarounds.
   - **Getting weighted fits right, and showing both scaled and unscaled errors, is a concrete hook.**
3. **Everything is in German.**
   - Teaching is in German, and German Excel uses decimal commas and semicolon CSV files.
   - The UI, number input and number output must all handle German formats from day one.
4. **Non-parametric tests and chi-square belong in the launch.** The Tübingen physiology, LMU statistics and genetics labs use Mann-Whitney/Wilcoxon, Kruskal-Wallis, and χ² (2×2 and goodness-of-fit).
5. **FFT and signal processing move to later.** No year 1–2 biology assignment we found uses them.
6. **Lab scripts don't require nonlinear Michaelis-Menten fits.** They ask for Lineweaver-Burk (and Eadie-Hofstee). The app must do those. It should also offer the direct nonlinear fit, because linearisation distorts errors, and lecturers may value that.
7. **The everyday work is bookkeeping, not fancy statistics.** The top tasks are:
   - dilution and unit conversions (8 of 16 assignments);
   - a calibration line with an unknown read off it (6);
   - Lambert-Beer (6);
   - linear regression (6);
   - replicate means (6);
   - normalisation (5);
   - initial rates from a linear section (4);
   - semi-log plots (4).
8. **Results must follow HU's rounding rule.**
   - Write (value ± u) unit, with u at 1 significant digit, or 2 if that digit is 1 or 2.
   - Round the value to match u, and don't round intermediate results.
   - The app should do this automatically.
9. **Students often have to calculate by hand** (χ², Wilcoxon, confidence intervals). A "show the steps" view that lets them check their working is a likely hook for both students and lecturers. This is an idea, not yet tested.

## Acceptance checklist

The "Source" column says how solid each item is:
- **HU-confirmed:** HU biology students do it.
- **HU-script:** in HU's physics script for non-physicists, but not confirmed for biology students.
- **Other uni:** a year 1–2 biology lab elsewhere.

### Physics lab (HU)

| # | Assignment | The app must let the student… | Source |
|---|---|---|---|
| P1 | F1 Error distribution | Make a frequency table (absolute, relative, cumulative), a histogram with a normal curve, a cumulative probability plot and the 16%/84% read-off, and s with n or n−1 as chosen | HU-confirmed |
| P2 | F2 Volume measurement | Combine random and instrument errors in quadrature, propagate errors through a formula, check that three results overlap, and compute a weighted mean with its uncertainty | HU-confirmed |
| P3 | M3 Elasticity | Fit a line to loading and unloading data, get the slope with its uncertainty, and turn it into a derived quantity with a propagated uncertainty | HU-confirmed |
| P4 | M5 Surface tension | Make a calibration curve, plot a transformed variable (h against 1/r), and get σ from the slope with its error | HU-confirmed |
| P5 | O5 Polarimetry and O6 Newton's rings | Use formula columns (d·c, r²), fit with error bars, and get several quantities from slopes with uncertainties | HU-confirmed |
| P6 | E1 Wheatstone bridge and O4 grating | Use formula columns with error propagation, and compare measured and calculated values | HU-confirmed |
| P7 | O7 Refractometer | Fit a calibration line with error bars and read an unknown concentration off it, with an uncertainty | HU-script |
| P8 | F7 Radioactivity | Run a χ² goodness-of-fit against Poisson and Gauss distributions, and plot on a semi-log axis with y error bars | HU-script |
| P9 | F3 Pendulum | Compute a mean, s and confidence interval, and run a linearised regression (T² against l) | HU-script |

**Every physics item must also give:**
- A weighted fit using 1/s², χ²/DoF, and parameter errors both scaled and unscaled.
- A result line in HU format: (value ± u) unit, rounded to the uncertainty.
- Axis labels with quantity, symbol and unit, and the fit line drawn differently from the points.

### Biology labs

| # | Assignment | The app must let the student… | Source |
|---|---|---|---|
| B1 | Protein standard curve (Lowry, Bradford) | Average duplicates, fit a line **through the origin**, read unknowns with their dilution factor, and get ε from the slope and from per-point averages | Other uni (Rostock) |
| B2 | Pigment content | Use formula columns for turbidity correction, dilution and overlap equations (chlorophyll a/b), normalise per mg of fresh mass, and plot a spectrum | Other uni (Rostock) |
| B3 | Photosynthesis light-response curve | Take slopes of chosen segments of a time trace, convert units through a calibration, and fit a line through the low-light points to get the compensation point (y = 0) | Other uni (Rostock) |
| B4 | Enzyme kinetics, with and without an inhibitor | Get initial rates from a chosen linear window for each series. Plot v against S, Lineweaver-Burk and Eadie-Hofstee. Report Km, vmax and kcat for both conditions, and fit Michaelis-Menten directly as an option | Other uni (Rostock, Göttingen, FU Berlin) |
| B5 | Bacterial growth curve | Plot on a semi-log axis, choose the exponential range, fit it, and get the growth rate μ and the doubling or generation time | Other uni (Ulm) |
| B6 | Plasmolysis and water potential | Plot % against concentration and read off the 50% point or the zero crossing (interpolated) | Other uni (FU Berlin, Rostock) |
| B7 | Ion and osmolality calibration | Fit a calibration function, back-calculate concentrations with dilution, and compute derived shares | Other uni (Rostock, which names Excel) |
| B8 | Animal physiology | Compute means and SD per condition, run Mann-Whitney/Wilcoxon, and plot on log axes (frequency, intensity) | Other uni (Tübingen) |
| B9 | Heart drug responses | Plot response against log10 concentration, and draw a bar chart of conditions with and without an antagonist | Other uni (Münster) |
| B10 | Gel fragment sizing | Fit a semi-log calibration line (log bp against migration distance) and read fragment sizes off it | Other uni (TU Braunschweig, semester 2) |
| B11 | Statistics exercise sheet | Get t-based confidence intervals, Wald and Wilson intervals, one-sample, paired and two-sample t-tests, χ² on a 2×2 table, ANOVA with pairwise comparisons and multiple-testing corrections (Bonferroni, Holm, Benjamini-Hochberg), and Kruskal-Wallis | Other uni (LMU) |
| B12 | Biodiversity | Compute species richness, Shannon and Simpson indices and Jaccard similarity across samples | Other uni (Kenyon) |
| B13 | Genetics crosses and Hardy-Weinberg | Run χ² against expected Mendelian ratios (with a warning when expected counts are below 5), and compute Hardy-Weinberg expected counts | Other uni (ABLE, UVM) |

**Every biology item must also give:**
- Bar charts of mean ± SD or SEM **with the individual points** (Weissgerber, Cumming), and a legend that says which error and what n.
- Significance brackets on comparisons.
- Pasting German-format numbers, and export ready for a caption.

## Draft launch scope

| Area | Launch | Later |
|---|---|---|
| Data | Paste and import German formats (decimal comma, semicolon CSV, xlsx); headers with name, symbol and unit; formula columns; replicate grouping (mean, SD, SEM); uncertainty columns with Gaussian error propagation | Databases, .mat, Origin files |
| Plots | Scatter with x and y error bars; bar of means with individual points; box plot; histogram with normal or Poisson curve; cumulative and probability plots; semi-log and log-log axes; several series; fit line drawn differently from points; significance brackets | 3D, contour and heatmap plots, vector fields |
| Fitting | Linear (weighted and unweighted, optionally through the origin) with parameter errors (scaled and unscaled) and χ²/DoF; reading an unknown off a calibration line; fitting a chosen range; exponential growth (μ, doubling time); Michaelis-Menten direct fit plus Lineweaver-Burk and Eadie-Hofstee; polynomial; custom formula | Multi-peak, dose-response (EC50, Hill) |
| Statistics | Descriptive statistics; confidence intervals (t, Wald, Wilson); t-tests (one-sample, paired, two-sample); χ² (goodness-of-fit, 2×2); one-way ANOVA with post-hoc tests and corrections; Mann-Whitney/Wilcoxon; Kruskal-Wallis; correlation; weighted mean; sign test; plain-language explanations and "show the steps" | Two-way ANOVA (check against real HU material), Friedman |
| Biology helpers | Lambert-Beer, dilution (M1V1 = M2V2), diversity indices, Hardy-Weinberg, kcat, as formula templates | Gel band measurement from a photo |
| Results | Automatic HU rounding ((value ± u) unit), German number format | |
| Export | PNG, SVG and PDF; paste into Word or Google Docs | LaTeX formats |
| Projects | Save and open, autosave, undo and redo, one template per assignment above | Shared live projects |
| UI | German first, English second; finished example on first open; no signup | |
| Signals | – | FFT, smoothing, filters (no evidence in year 1–2 biology) |

## Still missing: real HU biology material

There is no public HU source for the biology labs themselves: enzyme kinetics, growth curves, standard curves, t-tests or ANOVA at HU. Those sit in Moodle behind a login.

Ask Luis's daughter for:
- **BioB 6 biostatistics** exercise sheets (semester 2). They define which tests HU actually teaches.
- **BioB 8 chemistry lab** protocol instructions (semester 2, portfolio of 15 protocols).
- **BioB 11 biochemistry** and **BioB 13 animal physiology** practical instructions (semester 3).
- **BioB 15–18** (microbiology, plant physiology, molecular genetics, ecology) practical instructions (semester 4).
- Which software she actually uses (QtiPlot, Excel, R?), and what takes longest or annoys her most.

Another lead: the Biology student council's archive of old exams, https://fachschaften.hu-berlin.de/de/fsbio/alt/files/prufungen/bsc (not read; it has a bot-check).

Some public course-catalogue pages show Moodle enrolment keys. Don't use them. Get course material through a student or lecturer.
