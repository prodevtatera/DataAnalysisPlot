# Changelog

Written in plain language for people who do not read code. Newest entry on top.

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
