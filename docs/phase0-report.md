# Phase 0 report: one-day test build

Date: 2026-10-14. Code in `testbuild/`, checks in `tests/`, all run by `bash scripts/check.sh` (7 checks, all pass). Evidence is in `evidence/`, `docs/nist-results.md` and `docs/phase0-timing.md`.

## Verdict

**Gate passed. Keep Pyodide + Plotly.** Three things need attention before launch: the first-visit download is large, hosting must cache and compress, and the R cross-check is still open.

## Gate checks

| Gate check | Result | Evidence |
|---|---|---|
| Fits match 3 NIST datasets | **Pass.** Misra1a (lower), Misra1d (average), BoxBOD (higher), each from both NIST start points. Parameters agree to 8.4–9.0 correct digits, standard errors to 6.1 digits or more, residual sum of squares to 9 digits. From BoxBOD's hard start SciPy diverges; the app says so in German and shows no number. | `docs/nist-results.md`, `tests/step4-nist.sh` |
| Load time and download size measured, with device, browser, file size | **Pass.** Apple M5, 16 GB, Chromium 145 headless, local server, 5-point example. First visit: 35.4 MB stored, about 24.7 MB gzip-compressed, ready to fit after 2.9 s plus download. Repeat visit: 0 MB, ready after 2.8 s. One fit: about 35 ms. | `docs/phase0-timing.md`, `tests/step5-load.sh` |
| Figure exports as PNG and SVG, fit for a lab report | **Pass.** PNG 2400 x 1400 px. SVG is vector with real text. Both looked at; a too-narrow legend was found and fixed. | `evidence/step6-export.*`, `tests/step6-export.sh` |
| Decision made | Keep Pyodide + Plotly (below). | this file |

Also built and checked: pasting German or English data into a table (step 1), plot with y error bars and German decimal commas (step 2), and a weighted or unweighted straight line and Michaelis-Menten fit that shows scaled and unscaled errors, χ²/DoF and the method used, in HU format (value ± u) unit (step 3). The weighted line was checked against closed-form hand formulas (Taylor, *An Introduction to Error Analysis*), not against SciPy.

## Why keep Pyodide + Plotly

- SciPy in the browser reproduces the NIST reference values to far more digits than a lab report needs, and a fit takes milliseconds.
- Plotly gave error bars, German number format and clean PNG and SVG with few lines of code. Its bundle is 4.8 MB (1.5 MB gzip).
- No server is needed, so students need no signup and no install.

## Costs and risks (measured or known)

1. **First visit is heavy.** About 24.7 MB compressed. Estimate: 4 s at 50 Mbit/s, 20 s at 10 Mbit/s, plus 3 s for the browser. Not measured on a phone or an old laptop. The page should show the table and plot at once and load SciPy in the background (it already does: only the fit button waits).
2. **Hosting must send long cache headers and compress.** Without them every visit downloads everything. In a private window the two largest files (23.6 MB) were downloaded again.
3. **Not covered:** the R cross-check (R is not installed here; NIST was enough for this gate), statsmodels (the statistics tests of the roadmap), and a real network. NIST certifies only unweighted fits, so the weighted fit has hand-calculated checks only.
4. **Test-only code to remove or keep on purpose:** the worker accepts a free formula (`expr`) for the NIST check. No page feature uses it yet.
5. QtiPlot-style 3D and WebGL charts would not export as true vector. Not needed for year 1–2 labs.

## Next

Phase 1 (roadmap): project file, undo/redo, save and open, live table-to-plot updates. Before it starts, ask Luis's daughter for real HU assignments (checklist) and show this page to 3–5 lab instructors.
