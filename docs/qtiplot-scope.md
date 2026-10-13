# QtiPlot feature inventory

Source: QtiPlot website feature pages and the manual's table of contents, read on 2026-10-13.

- Pages: index, plot-gallery, plot3D, data-analysis, statistics, data-exchange, scripting, project (all under https://www.qtiplot.com/).
- Manual: https://www.qtiplot.com/doc/manual-en/index.html

This lists what the website and manual describe. It wasn't checked in the desktop app itself.

## Product facts

- Commercial product. "QtiPlot" is a trademark of IONDEV SRL.
- Author: Ion Vasilief. The manual copyright runs from 2004 to 2025.
- Latest release: 1.2.7, on 2026-05-20.
- Runs on Windows, macOS and Linux. Widely used for teaching, and the UI comes in several languages.
- Free, open-source alternatives: LabPlot and SciDAVis (SciDAVis is an old QtiPlot fork). Paid alternatives: Origin and GraphPad Prism.

## Workspace and projects

- **Project file (.qti):** tables, matrices, plots and notes in one file. It has subfolders, a folder can be saved as its own project, and other projects can be appended.
- **Live links:** editing a table updates every dependent plot (curves, axis scales, legends).
- **Tables:**
  - No row or column limits.
  - Column types: numeric, text, date and time. Column roles: X, Y, Z, error and label.
  - Set Column Values (formulas), fill, normalise, sort, statistics, column preview.
  - Commands: insert, move, swap and hide columns, extract data, convert to matrix.
- **Matrices:**
  - Data that depends on two variables, used for 3D, image and contour plots.
  - Table mode or image mode, which works as a basic image viewer and editor (rotate, flip).
  - Operations: transpose, invert, determinant, expand, shrink, smooth.
- **Notes:** text, a maths calculator, and a Python script editor with syntax highlighting, line numbers, find/replace and autocompletion.
- **Project Explorer:** a dockable folder and window tree with drag and drop, and a preview when you hover over a window. You can hide, minimise, rename and print windows from it.
- **Other:**
  - Results log window, undo/redo stack and a preferences dialog.
  - Window templates (.qwt) and format copying (Copy Format, Apply Template).
  - Command-line batch mode (`-x` runs a script, `-X` runs it without the UI) and a serial port monitor.

## 2D plots

- **Function plots:** functions and parametric functions.
- **Axes and layers:**
  - Double-Y graphs and up to 4 Y axes.
  - Multilayer panels: arrange, merge and extract layers, and merge graph windows.
  - Math formulas (LaTeX) in titles, legends and labels.
- **Lines and areas:** line, colour-mapped lines, area, stacked lines and waterfall.
- **Bubbles:** bubble charts (size from one column) and colour-mapped bubble charts.
- **Bars and pies:** column and bar charts, stacked and 100% stacked bars, 2D and 3D pie charts, and doughnut charts.
- **Contours and heatmaps:** contour lines (customisable, labelled), colour-filled contours and heatmaps.
- **Vector fields:** XYXY (start and end points) and XYAM (origin, angle, magnitude).
- **Statistical plots:**
  - Box plots, interval plots (confidence interval of the mean) and violin plots.
  - Histograms with 10 overlay curves: Normal, Lognormal, Poisson, Exponential, Laplace, Lorentz, Weibull, Kernel Smooth, Gamma and Binomial.
  - Histogram with cumulative probabilities, stacked histograms, Pareto charts, and Q-Q plots (5 distributions).
- **Editing:** double-click any element (axis, curve, label, legend) to edit it in a dialog. Plot Details covers scales, axes, grid and title. This click-to-edit editor is the biggest hidden cost of a rebuild.

## 3D plots (OpenGL)

- Surfaces from a function F(x, y), and parametric surfaces (several in one plot, such as tori, a seashell or a Klein bottle).
- Wireframes with hidden lines removed, filled surfaces and 3D bars.
- 3D vectors in XYZ XYZ or XYZ dXdYdZ form, and trajectory and dot plots with a colour map.
- Animation (video), colour scales, legends, perspective, rotation, and 3D colour maps.

## Analysis

- **Signal processing:**
  - FFT, FFT filters (low-pass, band-pass and others), and correlation and autocorrelation.
  - Convolution and deconvolution, integration, and baseline and peak tools.
- **Interpolation:** linear, natural cubic spline and Akima.
- **Smoothing:** moving average, Savitzky-Golay, LOWESS and FFT filter.
- **Fitting:**
  - Built-in models: linear, polynomial, exponential, logistic, Boltzmann, Gaussian, Lorentzian and Pseudo-Voigt.
  - A fit wizard for custom models.
  - Multi-peak fitting: you set the number of peaks, click to place each one, then refine.
- **Image analysis:** image profiles (X and Y intensity) and pixel line profiles.
- **Validation:** QtiPlot ships a script that checks its fitting against the NIST StRD nonlinear regression datasets.

## Statistics

- **Descriptive statistics:**
  - Mean, SD, standard error, variance, sum, skewness, kurtosis, min and max, median, quartiles, IQR and custom percentiles.
  - Frequency counts.
- **Normality:** Shapiro-Wilk.
- **Parametric tests:** one-sample, two-sample and paired t-tests, and the chi-square test for variance.
- **Non-parametric tests:** Mann-Whitney, Kolmogorov-Smirnov, Wilcoxon signed rank (one sample and paired), paired sign test, Mood's median, Kruskal-Wallis ANOVA and Friedman ANOVA.
- **ANOVA:**
  - One-way ANOVA with 7 follow-up (post-hoc) tests: Tukey, Bonferroni, Dunn-Sidak, Fisher LSD, Scheffé, Holm-Bonferroni and Holm-Sidak.
  - Two-way ANOVA.

## Data exchange

- **Origin:** imports .opj files (Origin 2.0 to 10.0 / 2023), .org, .ogw and .ogg. The Pro edition handles .opju on Windows with Origin installed. It can also export Origin C.
- **Excel:** imports .xls, .xlsx and .xml, and exports .xls. It can embed workbooks as OLE objects (Windows with Excel only).
- **LibreOffice and OpenOffice:** imports .ods and .fods, including charts. Exporting .ods needs LibreOffice or OpenOffice installed.
- **Instruments and databases:**
  - LabVIEW TDMS, with a channel tree preview.
  - SQL databases (MySQL, PostgreSQL, SQLite), with an optional query before import.
  - Microsoft Access .mdb files, on all operating systems.
- **Matlab:** .mat files, with a variable tree.
- **Serial port:** reading and writing, for devices like Arduino.
- **Plain files:** ASCII and CSV import and export, image import, graph export as images and vector files, and printing.

## Python scripting

- Create and customise plots, and automate analysis (including in hidden tables).
- Imports SymPy, SciPy and rpy2 automatically if they are installed.

## Browser feasibility

| Feature | In a browser |
|---|---|
| Tables, 2D plots, fitting, statistics, signal processing | Works |
| 3D plots | Works (WebGL), but exports as pictures, not true vector graphics |
| Excel, CSV, ODS, .mat import | Works with JavaScript or Python libraries |
| Local SQLite file | Works (SQLite compiled to WebAssembly) |
| Remote MySQL or PostgreSQL | Needs a server |
| Serial port | Chrome and Edge only (Web Serial API) |
| Excel OLE embedding | Not possible |
| Origin .opj import | Needs a reverse-engineered parser (liborigin is open source; check its licence first) |
| Python scripting | Works with Pyodide, but the app must expose its own Python API for tables and plots |
