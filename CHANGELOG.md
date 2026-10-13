# Changelog

Written in plain language for people who do not read code. Newest entry on top.

## 2026-10-13: Paste your data and see it as a table

- **What a student can now do:** paste numbers from Excel, paste German-style data (semicolons, decimal commas such as 1,5) or English-style data (1.5), choose a CSV file, or load an example. The data appears as a table with decimal commas. If something is wrong (a letter where a number should be, rows with different column counts, only a header line), a clear German message names the row and column.
- **Tested:** in a real browser, all of the above passed. Nothing is loaded from outside the page; the fonts are included.
- **Not covered yet:** plotting, error bars, curve fitting, export. Numbers like 1.234,5 (thousands dots) are rejected with a message.
