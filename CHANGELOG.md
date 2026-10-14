# Changelog

Written in plain language for people who do not read code. Newest entry on top.

## 2026-10-14: Weighted mean and overlap check (P2)

- **What a student can now do:** under "Gewichteter Mittelwert und Überlappung mehrerer Ergebnisse" pick the column with the results (for example three volume measurements) and the column with their uncertainties, set the factor k (default 1) and press "Berechnen". The page shows the weighted mean as (value ± u) unit in HU format, for example (10,02 ± 0,09) cm³, with weights 1/u² and u = 1/√Σw. It also says whether the intervals x ± k·u all share a common range ("stimmen im Rahmen ihrer Unsicherheiten überein") or names the rows that do not overlap and by how much.
- **Good to know:** the uncertainties are used as they stand in the table (not scaled). Rows with an empty result or uncertainty are skipped. Changing a column, k or any value marks the result as out of date.
- **Messages:** an uncertainty of 0 or less (names the row), no uncertainty column, the same column twice, a k that is not a positive number, or fewer than two usable rows gives a plain German message.
- **Tested:** `tests/phase2-step4-wmean.sh` with three volume results (10,3 ± 0,2; 10,5 ± 0,3; 9,9 ± 0,1 cm³) against a separate hand calculation in exact fractions (mean 10,02245, u 0,0857143; k = 1 no overlap, k = 2 overlap), in the real page with undo, reload, save, reopen and a hand-edited project file.

## 2026-10-14: Mean, standard deviation and standard error (P1, P2)

- **What a student can now do:** choose a column under "Mittelwert und Streuung einer Spalte", pick n or n−1 for the standard deviation, optionally enter an instrument (reading) error and press "Berechnen". The page shows the mean as (value ± standard error) unit, the standard deviation, the standard error s/√n, and with an instrument error a second mean line where random and instrument error are added in quadrature, for example (10,110 ± 0,022) mL.
- **Good to know:** the standard error always uses s with n−1, even when n is chosen for the standard deviation; the page says so. Changing the column, the choice, the instrument error or any value of that column marks the result as out of date.
- **Messages:** a column with fewer than two values, or a negative or non-numeric instrument error, gives a plain German message.
- **Tested:** `tests/phase2-step3-stats.sh`, ten burette readings against hand calculations (mean 10,11; s 0,0258 or 0,0245; standard error 0,00816; combined 0,0216), in the real page with undo, reload, save and reopen.

## 2026-10-14: Uncertainties for formula columns (P2, P5, P6)

- **What a student can now do:** in "Formelspalte" fill the new field "Unsicherheiten", for example `R1 = sR1; R2 = sR2; R3 = sR3` for the Wheatstone bridge Rx = R1·R2/R3. Next to Rx the app adds a column "u(Rx)" with the Gaussian error propagation. Each input gets a column, a number or an expression such as 0,01*D as its uncertainty; inputs you leave out count as exact. The new column updates when data changes, is saved with the project, and can be set as "Fehler von y" so the plot shows the error bars.
- **Messages:** an unknown column, a missing "=", an input that is not in the formula, an input named twice, a negative uncertainty or a division by zero gives a plain German message. Nothing is added when the input is wrong.
- **Limits:** the inputs must be independent of each other (stated on the page). The formula is still never run as code.
- **Tested:** `tests/phase2-step2-propagate.sh` against partial derivatives worked out by hand, for example Rx = 50 with u = 0,4330 and Rx = 180 with u = 1,5131 for the Wheatstone rows, product, quotient, square root, logarithm, power, sum, a squared input (x·x), and in the real page with undo, save, reopen and a hand-edited project file.

## 2026-10-14: Formula columns (Physics 2 experiments P2, P5, P6)

- **What a student can now do:** add a new column that is calculated from other columns, for example r² = (D/2)^2 for Newton's rings or d·c for polarimetry. Type a name and a formula under "Formelspalte" and press "Spalte berechnen". Decimal commas, brackets, + − * / ^ and the functions sqrt, ln, log10, exp, abs, sin, cos, tan and pi work. The column updates by itself when a number is changed, can be used as the x or y column of the plot, is saved with the project, and can be removed again.
- **Messages:** an unknown column name, an unknown function, a missing bracket, a duplicate name or a division by zero gives a plain German message (division by zero names the row and leaves that cell empty).
- **Safe:** the formula is read by a small parser and never run as code. Attempts such as "alert(1)" are just reported as unknown.
- **Tested:** `tests/phase2-step1-formula.sh` against values worked out by hand (for example r² = 1; 2,25; 4; 6,25), in the real page, including undo, save, reopen and a hand-edited project file. **Not covered yet:** uncertainties of formula results (next step).

## 2026-10-14: Elasticity (P3) works start to finish, and you can paste your own data

- **What a student can now do:** paste a table from Excel or a CSV file (semicolon or tab, decimal comma) into the new box "Daten einfügen", press "Als Tabelle übernehmen", fit, enter wire length and diameter, and get E = (201 ± 8) GPa, then save the project. That is 9 clicks and entries. The same work in Excel is about 40 by my count of the steps (an estimate, not timed with a person). Before, the app could only load two examples or a saved project.
- **Also changed:** the fit details now say exactly what is done ("gewichtete Methode der kleinsten Quadrate (Gewichte 1/s²); Fehler mit √(χ²/DoF) skaliert", or unscaled) instead of naming a SciPy setting that the straight-line fit no longer uses.
- **Tested:** `tests/phase1-step8-timed.sh` runs the whole task in the real page (219 to 291 ms of computer time, plus about 5 s once for Python to start), then changes a cell and undoes it, then saves and reopens the project in a fresh browser: nothing is lost. Empty or non-numeric pasted data shows a clear message. Phase 1 report: `docs/phase1-report.md`.
- **Not covered yet:** no comparison with R (not installed) and no timing with a real student. Pasting replaces the table and clears undo. Phase 2 (all Physics 2 experiments, assuming P1 to P9) starts next.

## 2026-10-14: Line fit checked against official reference numbers, and made more exact

- **What changed for a student:** the straight-line fit now gives the same numbers as the official NIST reference data set "Norris" to 9 digits (before: 5 to 7 digits for some values, which would not show in a lab report but is not good enough for a tool that claims correct numbers). Michaelis-Menten is unchanged.
- **Tested:** `tests/phase1-step7-reference.sh` compares slope, intercept, their errors and the sum of squares with the NIST certified values, and weighted fits (equal and unequal errors) with a separate hand calculation in exact fractions. Everything matches to 9 digits, and all older tests still pass.
- **Not covered yet:** no comparison with R (not installed here). NIST publishes no certified weighted straight-line data, so the weighted check rests on the separate hand calculation.

## 2026-10-14: Young's modulus from the fitted slope (P3 Elasticity)

- **What a student can now do:** fit load against extension, enter the wire length and diameter with their uncertainties and get the Young's modulus, for example E = (201 ± 8) GPa. The page shows the formula and how much each input adds to the uncertainty. An example ("Beispiel Elastizität") is built in.
- **Tested:** `tests/phase1-step6-elasticity.sh` compares the result with numbers calculated separately by hand. It passed, together with all older tests. Clear messages for a missing fit, empty or wrong inputs and wrong column units.
- **Not covered yet:** the shear modulus from oscillation periods and the comparison of loading and unloading from the lab sheet; no free formulas yet.

## 2026-10-14: Safer project files

- **What was fixed:** a project file that someone had edited by hand could make the page run unwanted code when its fit result was shown. Numbers from a file are now always shown as numbers.
- **Tested:** `tests/phase1-step5-fit.sh` opens a project file with script text in every result field, also after reloading. It failed with the old code and passes now.
- **Not covered yet:** no other part of the app has had a separate security review.

## 2026-10-14: Straight-line fit in the app, with column roles

- **What a student can now do:** choose in the table header which column is x, y or the y error, then press "Anpassen" to fit a straight line. The result reads (value ± u) unit, for example a = (2,01 ± 0,06) V/s. A weighted fit shows the errors both scaled with √(χ²/DoF) and unscaled, plus χ²/DoF, and says which method is shown. The student can switch weighting and error method. The fitted line appears in the plot. After any change to the data the result is marked out of date and the line disappears; undo brings them back.
- **Tested:** `tests/phase1-step5-fit.sh` opens the real page and compares weighted and unweighted results with hand-typed textbook formulas. All passed. Clear messages for an error value of 0, missing x or y column and fewer than three points.
- **Not covered yet:** no derived quantity such as the spring constant (next step), no Michaelis-Menten in the new app page, and no comparison with R yet.

## 2026-10-14: Autosave

- **What a student can now do:** close the tab or reload the page and find the work as it was, with the note "Wiederhergestellt". Data, column roles and fit results come back, and a result that was out of date stays marked as out of date. If the browser cannot store anything (private window, full disk), a warning says so and asks to use "Projekt speichern".
- **Tested:** `tests/phase1-step4-autosave.sh` reloads the real page after edits, opens a second tab, and tries a damaged saved state and a browser that refuses to store. All passed, as did every older test.
- **Not covered yet:** the undo history is lost on reload. There is one saved slot per browser, and no "start empty" button.

## 2026-10-14: Undo and redo

- **What a student can now do:** take back a mistake with "Rückgängig" (or Ctrl/Cmd+Z) and bring it back with "Wiederholen" (or Shift+Ctrl/Cmd+Z). It works for typed values, added or deleted rows and fit settings. A fit result turns up to date again when the data is put back, and out of date again when the change returns.
- **Tested:** `tests/phase1-step3-undo.sh` opens the real page and checks all of this with hand-typed numbers. All passed, as did every older test.
- **Not covered yet:** the history is lost when the page is reloaded. The fit settings have no screen control yet, so that was tested without it.

## 2026-10-14: Editable data table in the app

- **What a student can now do:** open the app page, load the example or a saved project, and type straight into the table. The plot follows at once. Decimal commas work, an empty cell drops the point, rows can be added and deleted. A wrong entry turns red and says which row and column. A saved fit result is greyed out as out of date after any edit.
- **Tested:** in a real browser with hand-typed expected values; all 9 checks pass. Screenshots looked at.
- **Not covered yet:** undo and redo, autosave, choosing column roles, and running the fit inside the new app page.

## 2026-10-14: Save the figure as PNG or SVG

- **What a student can now do:** save the plot, with data, error bars, fit line, axis labels and legend, as a sharp PNG image or as an SVG vector graphic that stays sharp at any size and can be edited in a drawing program.
- **Tested:** the saved files were opened and checked, and looked at. The legend was too narrow in the first export; fixed.
- **Not covered yet:** PDF export, choosing the picture size.

## 2026-10-14: Fit results checked against NIST

- **What changed for a student:** a fit that does not converge now says so in German instead of showing a wrong number or an error code. Fit results are also more precise.
- **Tested:** against three official NIST reference datasets (easy, medium, hard). The numbers agree to at least 8 digits, and the errors to at least 6 digits. From the hardest starting point, the app says the fit did not converge. The full table is in `docs/nist-results.md`.
- **Not covered yet:** comparison with R, and the weighted fit against a NIST dataset (NIST certifies only unweighted fits).

## 2026-10-14: Fit a line or a saturation curve

- **What a student can now do:** choose "Gerade" or "Michaelis-Menten" and press "Anpassen". The page shows the parameters as (value ± u) unit, draws the fitted curve over the data, and says which error method it used. With error bars, it shows both the scaled and the unscaled errors and χ²/DoF. If the data changes, the old result is marked as out of date.
- **Tested:** in a real browser, against numbers worked out by hand. The straight line gave a = (2,01 ± 0,06) V/s. Michaelis-Menten recovered Vmax = 2 and Km = 0,5 from exact data. Error bar 0, too few points and flat data each give a clear message.
- **Not covered yet:** a check against the official NIST datasets, load time, and export. The first visit downloads about 31 MB for the calculation engine.

## 2026-10-14: Your data as a plot with error bars

- **What a student can now do:** after pasting data, the page draws it as a plot under the table. The first column is x, the second is y, and an optional third column gives the y error bars. Axis labels come from the column headers, numbers on the axes use decimal commas, and a legend names the data.
- **Tested:** in a real browser. Five points and five error bars appear, the axes show commas, and bad input clears the plot with a clear message. I looked at the screenshot: no leftover placeholder text.
- **Not covered yet:** curve fitting, x error bars, export as image.

## 2026-10-13: Paste your data and see it as a table

- **What a student can now do:** paste numbers from Excel, paste German-style data (semicolons, decimal commas such as 1,5) or English-style data (1.5), choose a CSV file, or load an example. The data appears as a table with decimal commas. If something is wrong (a letter where a number should be, rows with different column counts, only a header line), a clear German message names the row and column.
- **Tested:** in a real browser, all of the above passed. Nothing is loaded from outside the page; the fonts are included.
- **Not covered yet:** plotting, error bars, curve fitting, export. Numbers like 1.234,5 (thousands dots) are rejected with a message.
