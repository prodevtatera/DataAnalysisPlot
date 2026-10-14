# Changelog

Written in plain language for people who do not read code. Newest entry on top.

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
