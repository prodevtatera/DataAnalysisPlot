STATUS: RUNNING
PHASE: 0

Read by every round of the loop (see docs/loop-prompt.md). Keep the first line exactly as `STATUS: RUNNING`, `STATUS: DONE` or `STATUS: BLOCKED`.

## Next steps (Phase 0: one-day test build, code in `testbuild/`)

- [x] 1. One page: paste a CSV (also German format: decimal comma, semicolon) into a box, parse it, show it as a table. Bad input shows a clear message.
- [ ] 2. Plot the table with y error bars.
- [ ] 3. Fit a curve with SciPy in the browser (Pyodide in a Web Worker). Show parameters, their errors, and say which error method was used.
- [ ] 4. Check the fit against 3 NIST datasets, one each of lower, average and higher difficulty. Record certified values, app values and the difference. Check in an automatic script.
- [ ] 5. Measure first load time and download size (state device, browser, dataset size), and the time of a repeat visit.
- [ ] 6. Export the figure as PNG and SVG. Look at both and say if they are fit for a lab report.
- [ ] 7. Write `docs/phase0-report.md`: gate results and a recommendation to keep or change Pyodide + Plotly. Set STATUS: DONE.

## For Luis

(things only a person can do, filled in when the loop finishes)

## Blocked

(nothing yet)

## Log

(one line per round: date, step, what changed, check results)

- 2026-10-13, step 1: A student can now paste data (German `1,5;2,25`, English `1.5,2`, or Excel tab), choose a CSV file, or load an example, and see it as a table with decimal commas. Bad input (a letter in a number cell, rows with different column counts, header only) shows a plain German message naming the row and column. Tested in a real browser: all checks pass, and no request leaves the machine (fonts Barlow and Source Sans 3 are bundled). Screenshots `evidence/step1-table*.png` judged OK: HU blue header, warm page, square corners, footer present. npm packages: @fontsource/barlow, @fontsource/source-sans-3, playwright-core (dev, for tests). The browser test cannot start inside the Claude sandbox, so it runs outside it.
