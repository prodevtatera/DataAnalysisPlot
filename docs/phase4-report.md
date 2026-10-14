# Phase 4 report: a calmer page and a home page

Date: 2026-10-14. Code in `app/`, checks in `tests/`, all run by `bash scripts/check.sh`. Evidence: `evidence/phase4-step*.png` and the gate test `tests/phase4-step6-gate.sh`.

## Verdict

**Passed.** Luis found the first view overwhelming. It is now a home page that leads into a workbench showing only the table, the plot and the result; every other tool is one button away. Every older check still passes. The gate walk (home page, example, template, dropped file, English) works end to end in a real browser. No real student has used any of it.

## What changed

1. **Wording (step 1).** No page names the university. The footer reads "Unabhängiges Studierendenwerkzeug. Nicht mit der Universität verbunden." (English: "Independent student tool. Not affiliated with the university.") and follows the language switch.
2. **Werkzeuge menu (step 2).** The 13 extra tools (formula column, mean and spread, histogram, cumulative plot, χ² test, weighted mean, several series, derived quantity, calibration line, comparison, log axis, save plot, paste data) sit behind one "Werkzeug wählen" button and open one panel each below the results. A dot marks a tool that has a result. Open tools are saved with the project.
3. **Templates open only their tools (step 3).** Each of the 12 templates opens just the tools of its experiment, and each numbered step names the tool button.
4. **First-view polish (step 4).** Header actions in three groups on one row (Datei, Bearbeiten, Versuchsvorlage); nothing sticks out sideways at 800 or 375 px.
5. **Home page (step 5).** The root address `app/index.html` is the home page (headline, drop zone, "Beispiel öffnen", "Leeres Projekt", "Datei wählen", a finished weighted-fit picture, three value points, 12 experiment cards, footer). It loads no Python engine and nothing from outside. The workbench is `app/app.html`.

## Measured: before and after

Device: Apple M5, Chromium (Playwright), fresh profile, window 1200 x 800, local server. "Visible" means what a student sees: not hidden, not inside a closed menu; Plotly's own chart toolbar is not counted. The test prints these numbers on every run.

| First visit of the workbench at 1200 x 800 | Before | After |
|---|---|---|
| Sections on the page | 16 sections | 4 (plot, table, results, tools) |
| Buttons | 55 buttons | 12 |
| Page height | 6441 px (at first view) | 1657 px when the plot is drawn; 2178 px when the finished example is fitted and its results are shown |
| Plot and E result in the 800 px window | no, the plot started far down | yes: E note ends at y = 318, plot ends at y = 757 |

Other measured counts (same method):

| Page | Sections | Buttons | Page height |
|---|---|---|---|
| Home page | 2 | 3 | 1750 px |
| Workbench with template P2 loaded (2 tools open) | 6 | 18 | 2194 px |
| Workbench with all 13 tools opened by hand | 17 | 48 | 5815 px |

The last row is the fairest comparison with the old page, where everything was always open: 5815 px against 6441 px, 17 sections against 16 and 48 buttons against 55 (the old page also differed in layout, so this is not an exact like-for-like). The gain is that a student no longer has to look at all of it: the first view has 4 sections and 12 buttons. The home page is about 180 KB uncompressed, 9 files, no Python.

Earlier progress notes quote page heights of 2397 px (step 2) and 2286 px (step 4) for the fitted example. Those were read at an earlier moment, before the second fit (the two series) had finished. The gate waits until the height stops changing: 2178 px. This is the number to use.

## The gate walk (`tests/phase4-step6-gate.sh`)

All in one real browser, German locale, no request leaves the machine, no script error:

1. **Home page** at 1200 x 800: headline, three buttons, result picture D = (2,32 ± 0,03) N/cm. Screenshot `evidence/phase4-step6-1-home.png`.
2. **"Beispiel öffnen"**: the workbench shows the finished example by itself, no tool open, E = (201 ± 8) GPa, a = (0,02529 ± 0,00029) mm/N. Screenshot `evidence/phase4-step6-2-example.png`.
3. **Template card P2**: opens exactly mean and spread and weighted mean; five own volumes pasted in keep both open; the weighted mean reads (10,02 ± 0,06) cm³ (hand value 10,02128 ± 0,06189, exact fractions). Screenshot `evidence/phase4-step6-3-template.png`.
4. **Dropped German CSV** (BOM, semicolons, decimal commas) on the home page arrives in the workbench; the fit gives a = (0,02529 ± 0,00029) mm/N (hand value 44,25/1750). A dropped picture is refused on the home page with a plain message and the page does not move. Screenshot `evidence/phase4-step6-4-dropped.png`.
5. **English**: home page, example and workbench in English with decimal points (E = (201 ± 8) GPa, a = (0.02529 ± 0.00029) mm/N); a scan of all page and plot text finds no German word. Screenshot `evidence/phase4-step6-5-english.png`.

Screenshots judged as a first-year student: the home page says what to do (one drop zone, three buttons); the workbench shows file row, example, table and plot side by side with the E result at the top; nothing overlaps or is cut off; the tools are named and out of the way. Known small thing: column names of the invented example ("ΔL auf", "ΔL ab") are German data names and stay in the English view.

Every step's own test also covers layout at 800 and 375 px (no sideways scroll), the 13 tools, the 12 templates and the bad inputs.

## Not tested

- No real student or lab instructor has used the new pages. "Calmer" is judged by counts and by screenshots, not by a person.
- English text was not read by a native speaker.
- Touch devices were emulated by window size only (375 px), not run on a phone.
- Only Chromium was driven. Firefox and Safari are untested.
- All experiment data are invented; the people items (instructor demos, her real data, a timed student run, R) are unchanged and listed in `docs/progress.md` under "For Luis".
