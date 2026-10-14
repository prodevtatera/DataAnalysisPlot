# Changelog

Written in plain language for people who do not read code. Newest entry on top.

## 2026-10-14: Confidence interval of a mean with the t distribution (P9)

- **What a student can now do:** in "Mittelwert und Streuung einer Spalte" there is a new choice "Vertrauensintervall" (keines, 90 %, 95 %, 99 %). With a level chosen, the result gets one more line in HU format, for example "Mittelwert x̄ mit 95 %-Vertrauensintervall = (10,02 ± 0,24) mm", and below it the factor and the interval: "t(0,975; 4) = 2,776 (zweiseitig, Student-Verteilung, 4 Freiheitsgrade). Intervall: [9,78; 10,26] mm."
- **Good to know:** u = t·s/√n, where t depends on the number of readings (n−1 degrees of freedom), so few readings give a wide interval (two readings: t = 12,71). The instrument error is not part of this interval; the line with the instrument error stays separate. The level is saved in the project, can be undone and survives a reload. Without a level nothing changes.
- **Tested:** `tests/phase2-step12-ci.sh`: t factors against the printed Student table for 15 combinations of level and degrees of freedom (6 digits, e.g. t(0,975; 4) = 2,776445), the closed forms for 1 and 2 degrees of freedom, and the 5-reading sample 9,8 10,1 10,0 10,3 9,9 against an exact-fraction hand calculation (`tests/reference/ci_t.py`) at 90, 95 and 99 %. Also undo, reload, save and open, one reading only (clear message), and a hand-edited project file.

## 2026-10-14: χ² test against Poisson and Gauss (P8)

- **What a student can now do:** the new section "χ²-Test: Poisson- und Gauß-Verteilung (Zählraten)" takes a column of counts per measuring interval (for example decays in 10 s), groups them into classes of whole numbers (class width and start can be typed or left automatic) and tests them against a Poisson and a Gauss distribution. For each class the page shows observed and expected counts; the result lines read for example "Poisson: χ² = 3,99 bei 8 Freiheitsgraden, p = 0,858". A plot shows the observed counts as bars and both expected distributions as lines. A short sentence per distribution says whether the counts contradict it at the 5 % level.
- **Warning:** a class with an expected count below 5 is marked with * and a warning names the classes, because the χ² test is unreliable then.
- **Good to know:** Poisson uses λ = mean (1 estimated parameter), Gauss uses mean and s with n−1 (2 estimated parameters) and a continuity correction of 0,5; the first and last class reach out to infinity so the expected counts add up to n. All of this is written under the result.
- **Messages:** values that are not whole numbers from 0, all values equal, a start above the smallest count, a class width that is not a whole number, fewer than 4 or more than 100 classes each give a clear message and no result.
- **Tested:** `tests/phase2-step11-gof.sh` with 40 hand-made counts against a separate plain-Python calculation (`tests/reference/gof.py`, p-values from closed formulas that the script itself checks against the printed χ² table, e.g. df = 3: 7,815 at p = 0,05): expected counts, χ², degrees of freedom and p for class widths 1, 2 and automatic, plus a case where Poisson is rejected (p about 1e-10) and Gauss is not. Also undo, reload, save and open, out-of-date marking, and a hand-edited project file.

## 2026-10-14: Logarithmic y axis with error bars (P8)

- **What a student can now do:** the switch "Logarithmische y-Achse (halblogarithmisch)" above the plot turns the y axis logarithmic, for example for a radioactive decay series or a bacterial growth curve. The y error bars stay visible and keep their true size on the log scale. It also works for the plot of several series. The switch is saved in the project, can be undone and survives a reload.
- **Good to know:** the legend moves above the plot on the log axis, so it never covers the first data point. A straight-line fit y = a·x + b is still a straight line in the numbers, so it looks curved on this axis (the page says so). Fitting ln y comes with the later radioactivity steps.
- **Messages:** a zero or negative y value cannot be drawn on a log axis. The plot then gives way to a message naming the column, the rows and the values (up to three, then "und n weitere"); correcting the value brings the plot back. If an error bar reaches down to 0 or below, only its upper part is drawn and a note says how many points are affected.
- **Tested:** `tests/phase2-step10-semilog.sh` with six decay readings (980 to 110 counts, errors about √N): the drawn height of every error bar matches log10(N + s) − log10(N − s) from the hand values to 1,5 pixels, all points and bars lie inside the axis range, and the legend covers no point. Plus zero, negative and several bad values, undo, reload, save and open, a hand-edited project file.

## 2026-10-14: Calibration line with an unknown read off (P4, P7)

- **What a student can now do:** after "Anpassen" on a calibration line, the new section "Kalibriergerade: Unbekanntes ablesen" takes one or more measured values of the unknown sample (for example `1,3405 ± 0,0003; 1,3372 ± 0,0002`) and gives the concentration x₀ = (y₀ − b)/a as (value ± u) unit, for example x₀ = (5,19 ± 0,21) %. A new example "Beispiel Kalibriergerade laden" shows a refractometer calibration.
- **In the plot:** a dashed guide runs from each measured y₀ across to the line and down to the x axis, with a marker at x₀ and its uncertainty as a horizontal bar, named in the legend.
- **Good to know:** the uncertainty uses the covariance of a and b, because the two fit parameters are not independent. In the example it changes u(x₀) from 0,22 to 0,21 %. The details line shows the numbers used and how much y₀, a, b and the covariance each contribute. The scaled/unscaled switch above applies. If x₀ is outside the measured standards, the page warns that this is extrapolation. The fit result now also stores the covariance, so a fit made with an older version has to be run again.
- **Messages:** no fit yet or an out-of-date fit, empty or non-numeric y₀, negative uncertainty, more than 10 values, and a slope that is not clearly different from 0 each give a plain German message. Changing a value or the y₀ text makes the result "veraltet" and the guides leave the plot.
- **Tested:** `tests/phase2-step9-calibration.sh` against exact-fraction hand calculations (`tests/reference/calibration.py`): weighted x₀ = 5,1886 with u = 0,2125 (scaled) and 0,2266 (unscaled); unweighted x₀ = 5,1977, u = 0,2110, also by the classic inverse-regression formula. Plus undo, reload, save and open, and a hand-edited project file.

## 2026-10-14: Several measurement series with their own x range (P3 loading and unloading)

- **What a student can now do:** the new section "Mehrere Messreihen in einem Diagramm" takes any number of y columns (up to 4) against the x column. For each series the student picks the y column, an optional error column and an x range ("x von", "x bis", empty = all points). "Reihen anpassen" fits one straight line per series over its range. All series appear in the main plot, each with its own marker, colour and named fit line; points outside the range are pale and not fitted. A new example "Beispiel Belastung und Entlastung laden" shows P3.
- **Slope comparison:** the results list a and b of each series as (value ± u) unit, and then compare every pair of slopes: the difference with its uncertainty, how many combined uncertainties that is, and a plain verdict (under 2 = agree within the uncertainties, 2 or more = clearly different). The scaled/unscaled switch above applies.
- **Good to know:** a series with an error column is weighted (1/s²), one without is fitted unweighted. The series are treated as independent. Changing a value, an error, a range or a column makes the result "veraltet" and the series lines leave the plot; undo brings them back.
- **Messages:** fewer than three points in the range, a range where "von" is above "bis", text in a range field, an error value of 0 (with the row), a y column that is the x column, and an edit made while the fit is running each give a plain German message.
- **Tested:** `tests/phase2-step8-series.sh` against exact-fraction hand calculations (`tests/reference/series_fit.py`): loading a = 0,02529 ± 0,00029 mm/N, unloading a = 0,02502 ± 0,00020 mm/N, difference 0,76 combined uncertainties, a ranged case (0,82) and a clearly different case (20,9). Also undo, reload, save and open, and a hand-edited project file.

## 2026-10-14: Any derived quantity from the fit line (P3, P4, P5, P9)

- **What a student can now do:** the section "Abgeleitete Größe aus den Fit-Parametern" replaces the fixed Young's modulus form. After "Anpassen", type a name, a unit and a formula over a (slope) and b (intercept), for example `4*pi^2/a`, and optionally further quantities with their uncertainty, such as `L = 1 ± 0,002; d = 0,5 ± 0,01`. "Berechnen" gives the result as (value ± u) unit, for example g = (9,89 ± 0,09) m/s² from the slope of T² against l.
- **Templates:** two buttons fill the form: the elasticity modulus E from P3 (same numbers as before: E = (201 ± 8) GPa) and g from the pendulum P9. "Beispiel Elastizität laden" still loads the E case.
- **Good to know:** the uncertainty comes from Gaussian propagation and uses the scaled or unscaled error of a and b, as chosen above. The details line shows the formula, the numbers put in and how much each input contributes. If a formula uses both a and b, the page says that their correlation is not taken into account. If the slope has a different unit than the template expects, the page says so instead of giving a wrong number.
- **Messages:** unknown name in the formula, a formula without a or b, division by zero, a root of a negative number, a missing "=" or a text instead of a number in the further quantities, and a wrong unit of a each give a plain German message.
- **Tested:** `tests/phase2-step7-derived.sh` against hand derivatives and exact fractions (g = 9,886138, u = 0,0898 scaled and 0,1515 unscaled; unweighted g = 9,8795), with undo, reload, save and open and a hand-edited project file. The Phase 1 elasticity test still passes with the same numbers.

## 2026-10-14: Cumulative plot with 16 % and 84 % read-off (P1)

- **What a student can now do:** after "Berechnen" in the histogram section, a second plot "Summenhäufigkeit mit Ablesung bei 16 % und 84 %" shows the cumulative share at each class limit with dashed guides to the x axis. The two read-off values are marked and written on the plot, for example 9,812 mm and 10,36 mm. The result list adds a line with both values, their half difference and, for comparison, x̄ − s and x̄ + s.
- **Good to know:** the values are read by a straight line between the class limits, so they depend on the class width. The plot is removed when the data changes, like the histogram.
- **Tested:** `tests/phase2-step6-cumulative.sh` with the 30 readings of the histogram test against hand values in exact fractions (16 %: 9,812; 84 %: 10,36), including automatic classes, undo of an edit, reload, bad input and a hand-edited project file.

## 2026-10-14: Frequency table and histogram with normal curve (P1)

- **What a student can now do:** under "Häufigkeitstabelle und Histogramm" pick a column (for example 30 length readings) and press "Berechnen". The page shows a table with each class (von bis unter), the absolute, relative and cumulative frequency, and a histogram of the counts with the fitted normal curve (mean x̄ and s with n−1, or σ with n, as chosen) and a legend. The mean is given as (value ± u) unit, for example (10,05 ± 0,05) mm.
- **Good to know:** class width and start can be typed in or left empty for an automatic choice (the page says which values it used). Classes are closed on the left: a reading exactly on a class limit counts in the upper class. Editing the data, the divisor, the width or the start marks the result as out of date and removes the plot until you press "Berechnen" again.
- **Messages:** a class width of 0 or text, a start above the smallest value, more than 100 classes, a column with fewer than two values, and a column where all values are equal give a plain German message.
- **Tested:** `tests/phase2-step5-histogram.sh` with 30 hand-made readings against a separate hand calculation in exact fractions (counts 2 5 9 8 4 2, cumulative 2 7 16 24 28 30, mean 10,05, s 0,263269; curve 9,092 at the mean), including readings exactly on class limits, in the real page with undo, reload, save, reopen and a hand-edited project file.

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
