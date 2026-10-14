STATUS: DONE
PHASE: 0

Read by every round of the loop (see docs/loop-prompt.md). Keep the first line exactly as `STATUS: RUNNING`, `STATUS: DONE` or `STATUS: BLOCKED`.

## Next steps (Phase 0: one-day test build, code in `testbuild/`)

- [x] 1. One page: paste a CSV (also German format: decimal comma, semicolon) into a box, parse it, show it as a table. Bad input shows a clear message.
- [x] 2. Plot the table with y error bars.
- [x] 3. Fit a curve with SciPy in the browser (Pyodide in a Web Worker). Show parameters, their errors, and say which error method was used.
- [x] 4. Check the fit against 3 NIST datasets, one each of lower, average and higher difficulty. Record certified values, app values and the difference. Check in an automatic script.
- [x] 5. Measure first load time and download size (state device, browser, dataset size), and the time of a repeat visit.
- [x] 6. Export the figure as PNG and SVG. Look at both and say if they are fit for a lab report.
- [x] 7. Write `docs/phase0-report.md`: gate results and a recommendation to keep or change Pyodide + Plotly. Set STATUS: DONE.

## For Luis

- Phase 0 passed (see `docs/phase0-report.md`). Decision: keep Pyodide + Plotly. Say go to start Phase 1.
- Ask your daughter for the real HU material listed in the checklist, and show the test build (run `bash testbuild/setup.sh`, then serve `testbuild/` with any web server) to 3-5 lab instructors.
- Decide where the app will be hosted. It must send long cache headers and compress files (see `docs/phase0-timing.md`).
- Optional: install R if you want the R cross-check from the roadmap.

## Blocked

(nothing)

## Log

(one line per round: date, step, what changed, check results)

- 2026-10-13, step 1: A student can now paste data (German `1,5;2,25`, English `1.5,2`, or Excel tab), choose a CSV file, or load an example, and see it as a table with decimal commas. Bad input (a letter in a number cell, rows with different column counts, header only) shows a plain German message naming the row and column. Tested in a real browser: all checks pass, and no request leaves the machine (fonts Barlow and Source Sans 3 are bundled). Screenshots `evidence/step1-table*.png` judged OK: HU blue header, warm page, square corners, footer present. npm packages: @fontsource/barlow, @fontsource/source-sans-3, playwright-core (dev, for tests). The browser test cannot start inside the Claude sandbox, so it runs outside it.

- 2026-10-14, step 2 (ticked after a manual fix): Added the plot under the table (Plotly, points in HU blue, y error bars from the third column, German decimal commas on the axes, legend "Messwerte", axis labels taken from the column headers; bad input clears the plot with a message). The example data now has headers "t / s", "U / V", "sU / V". Wrote `tests/step2-plot.sh`. The round could not run it inside the sandbox. Run outside it: found a wrong test expectation (Plotly draws one error-bar group per point, not one in total) and a leftover "Noch keine Daten." text under the plot; fixed both and added a check for the second. All 3 tests pass, screenshot `evidence/step2-plot.png` judged OK. `loop.sh` now runs `scripts/check.sh` and `tests/*` outside the sandbox so later rounds can run the browser. npm package: plotly.js-dist-min (copy in `testbuild/vendor/`).
- 2026-10-14, step 3 (finished by hand after the loop stopped): A student can now pick a straight line or Michaelis-Menten, press "Anpassen" and get the parameters as (value ± u) unit, with the error method named: weighted fits show both the scaled errors (√(χ²/DoF)) and unscaled errors, and χ²/DoF; unweighted fits say so. SciPy runs in the browser (Pyodide 314, NumPy, SciPy, about 31 MB in `testbuild/vendor/pyodide`, not committed; `testbuild/setup.sh` downloads it) inside a Web Worker. Tested in a real browser against hand-calculated closed-form values: slope 2,01 ± 0,06 V/s (scaled; 0,089 unscaled), intercept 0,18 ± 0,17 V, χ²/DoF 0,498; Michaelis-Menten recovers Vmax=2 and Km=0,5 from exact data. Editing data marks results as out of date. Bad input (error bar 0, fewer than 3 points, flat data) shows a clear German message. Fixes: Pyodide needs a module worker; opening the page as a plain file now only turns the fit off instead of breaking the whole page; Km<=0 is refused. Screenshot `evidence/step3-fit.png` judged OK. npm package: pyodide.
- 2026-10-14, step 4: SciPy in the browser was checked against 3 official NIST datasets (lower: Misra1a, average: Misra1d, higher: BoxBOD), each from both NIST starting points. Misra1a and Misra1d: parameters correct to 8.4 to 8.6 digits, standard errors to 6 digits or more. BoxBOD from the easy start: 9 digits. BoxBOD from the hard start: SciPy diverges, and the app now says so in German instead of showing a wrong number (found and fixed: it used to crash on "Infinity"). Also tightened SciPy's stopping tolerance (first run gave only 5.1 digits on BoxBOD). Table of certified vs app values: `docs/nist-results.md`, written by `tests/step4-nist.sh`. R is not installed, so the R cross-check from the roadmap is still open.
- 2026-10-14, step 5: Measured on an Apple M5 (10 cores, 16 GB), Chromium 145 headless, local server, 5-point example. First visit: 35.4 MB stored (about 24.7 MB with gzip), page ready to fit after 2.9 s (plus download: about 4 s at 50 Mbit/s, about 20 s at 10 Mbit/s). Repeat visit: 0 MB downloaded, ready after 2.8 s. One fit takes about 35 ms. Needs long cache headers and compression on the real host; in a private window the two biggest files (23.6 MB) are downloaded again. Written to `docs/phase0-timing.md` by `tests/step5-load.sh`. Not measured: a real phone, a slow laptop, real network.
- 2026-10-14, step 6: A student can now save the figure as PNG (2400 x 1400 pixels, sharp for a report) or SVG (vector; text stays text, error bars and fit line are paths, no embedded raster). Buttons are off until there is a plot. Tested in a real browser: the downloaded files were checked as files (PNG signature and size, SVG text "t / s", "U / V", "Messwerte", "Anpassung") and both were looked at. Found and fixed: the legend box was too narrow in the export because the exported image used a fallback font; the figure now uses Arial so page, PNG and SVG match. Verdict: fit for a lab report. Limits: this is a normal 2D chart (3D or WebGL charts would not be true vector); the SVG names the font Arial, so another program without Arial will substitute. Evidence: `evidence/step6-export.png`, `evidence/step6-export.svg`.
- 2026-10-14, step 7: Wrote `docs/phase0-report.md`. All four Phase 0 gate checks pass, with evidence. Recommendation: keep Pyodide + Plotly. All 7 checks in `scripts/check.sh` pass. Phase 0 done; Phase 1 waits for Luis.
