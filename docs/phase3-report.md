# Phase 3 report: first minute, own numbers, English, and what is still open

Date: 2026-10-14. Code in `app/`, checks in `tests/`, all run by `bash scripts/check.sh` (40 checks, all pass). Evidence is in `evidence/phase3-*.png` and the tests named below.

## Verdict

**Everything in Phase 3 that can be built and tested alone is done and works. The Phase 3 gate itself is a people gate and cannot pass alone.** The gate in `docs/roadmap.md` reads: "at least one instructor says they would try it in a lab group, or we learn exactly what blocks that." No instructor has seen the app, so that sentence is neither true nor false yet. Only Luis (and his daughter) can close it, by showing the app to 3 to 5 Physics 2 lab instructors. The concrete steps are under "For Luis" in `docs/progress.md`.

## What is built (Phase 3 steps 1 to 4)

| Item | What a student can do | Check |
|---|---|---|
| 1 Own numbers into a template | Copy cells from Excel or a CSV (decimal comma, tab or semicolon) and paste into a table cell. They fill the table from that cell, rows are added, formula columns recompute, the template box, roles and settings stay, results show as out of date, one undo step. A letter in a number cell, a ragged block or too many columns gives a clear message and changes nothing. | `tests/phase3-step1-paste.sh` |
| 2 First minute | A visit with nothing saved opens a finished example (P3 Elastizität, invented data, said so on the page), plotted with error bars and fitted: E = (201 ± 8) GPa is shown without a click. A file dragged onto the page (CSV, tab text, `.plotlab`) loads. "Leere Tabelle" starts empty. A returning visit restores the autosave. A picture, Excel file, text without numbers or a broken project gives a clear message. | `tests/phase3-step2-firstminute.sh` |
| 3 DE / EN switch | German is the default (also when the browser says English). The whole page is switchable: every section, plot texts, result lines, messages, the 12 templates, export file names. In English numbers use the decimal point, the result format (value ± u) unit is unchanged. A project file holds the same content in both languages. | `tests/phase3-step3-language.sh`, `-step3b-sections.sh`, `-step3c-messages.sh` |
| 4 Gate run alone | One student journey through all of the above in a real browser (below). | `tests/phase3-step4-gate.sh` |

## The gate run (`tests/phase3-step4-gate.sh`)

One fresh browser profile, Chromium, Apple M5 16 GB, local server, 1280 x 800 window:

1. **First visit.** Nothing saved, nothing clicked. Plot with error bars after about 0.45 s, the fit and E = (201 ± 8) GPa after about 3.2 s (the Python engine is ready after about 2.5 s on this machine). The result note is inside the first view; the top of the plot too (see "Known gaps" for the bottom).
2. **English on.** Data and project unchanged, result lines with decimal point (`a = (0.02529 ± 0.00029) mm/N`, `E = (201 ± 8) GPa`). A scan of all visible page text, plot legend and axis titles finds none of 19 German words.
3. **Own file dropped** while English is on: a German semicolon CSV (BOM, CRLF, decimal commas) becomes the table and plot; the weighted fit gives a = (0.02529 ± 0.00029) mm/N, the hand value 44.25/1750 = 0.0252857. A dropped picture gives an English message and changes nothing.
4. **Own numbers into a template.** P2 loaded, five own volumes and uncertainties pasted, "Calculate": (10.02 ± 0.06) cm³ in English and (10,02 ± 0,06) cm³ in German. Hand value: weighted mean 10.02128, u = 1/√(2350/9) = 0.06189 (exact fractions in plain Python). A paste with a letter gives the English message and changes nothing.
5. **Language switch loses nothing:** the project is byte-identical before and after; the German choice and the pasted numbers survive a reload.
6. **Blank table and project drop** in German work. No request left the local server: no signup, no tracking, no CDN.

**A real bug was found by this run and fixed.** The overlap check of the weighted mean listed two intervals that only touch (rows 1 and 5: 10.3 and 10.0 with u = 0.2 and 0.1) as "gap 0.0000000000000000667" because of floating-point rounding. A hand calculation says the gap is exactly 0, so they overlap. `weightedMean` in `app/stats.js` now ignores gaps below 1e-9 of the interval size; a real gap of 0.0001 is still found. Tests: `tests/phase2-step4-wmean.sh` (pure) and the gate (page text must list rows 1/3, 2/3, 2/5 with gaps 0.1, 0.2, 0.1 and must not list 1/5).

## What is measured, what is not

| Thing | Status |
|---|---|
| Result numbers of the gate run and of every step | **Measured against hand calculations** (exact fractions, closed forms, table values) in separate files; nothing taken from the app or from SciPy. The line fit also agrees with NIST Norris to 9 digits (Phase 1), the nonlinear fits with NIST Misra1a, Misra1d, BoxBOD (Phase 0). |
| First-visit timing | **Measured**: plot about 0.45 s, fit result about 3.2 s, Apple M5, Chromium headless, local server, three runs: 0.45 to 0.49 s and 3.0 to 3.3 s. |
| Download size and repeat visit | **Measured in Phase 0**: first visit 35.5 MB stored, about 24.7 MB gzip-compressed; repeat visit 0 MB when the server sends long cache headers. Not re-measured in Phase 3; not measured on a phone, an old laptop or university Wi-Fi. |
| English text | **Checked by tests** (hand-written texts, every quoted name in a template step is a real label, no German word left). **Not read by a native speaker.** |
| No instructor has seen it | **Not done.** The people gate. No feedback from any lab instructor exists. |
| Real student data | **None.** Every template and the first-visit example hold invented numbers, and the page says so. |
| R cross-check | **Not done.** R is not installed. Hand calculations and NIST stand in for it. |
| Timed student run | **Not done.** No real student has used the app with a stopwatch. The Excel step counts in `docs/phase2-report.md` are my estimates, not measurements. |
| Physics 2 experiment list | **Assumed**: P1 to P9 of the checklist. The real HU list is unknown. |
| Other browsers, devices | **Not tested.** Only headless Chromium on one Mac. Not Safari, Firefox, a phone or a tablet. |

## Known gaps

- **The plot ends below the fold at 800 px window height.** The first view shows header, buttons, the result note and the upper two thirds of the plot (420 px high, ends at y = 930 px). On a typical laptop window the legend and x axis need a scroll. A smaller plot or a side-by-side layout would fix it; not done because it is a design decision for after instructors have looked at it.
- The page is one long scroll with all sections visible (about 5200 px). Fine for a demo, probably too much for a student who only needs the line fit.
- The Phase 2 and 3 steps assume an English or German reader who knows the lab; there is no help page or video.
- Hosting is undecided (needs long cache headers and compression).

## Phase 3 gate

| Gate check | Result |
|---|---|
| Polish the first minute: finished example open on first visit, drag in a file, no signup | **Pass** (alone). `tests/phase3-step2-firstminute.sh`, `tests/phase3-step4-gate.sh`, `evidence/phase3-step4-first.png`. |
| German first, English second | **Pass** (alone), English not proofread by a native speaker. |
| Demo to 3 to 5 Physics 2 lab instructors, ask what they need for the lab manual, write it down | **Open. People gate.** |
| At least one instructor says they would try it in a lab group, or we learn what blocks that | **Open. People gate; cannot pass alone.** |

The loop stops here (STATUS: DONE) because every phase that can be finished alone has passed its own checks. That is not the same as "launch-ready": the launch bar in `CLAUDE.md` (a student does a real assignment faster than in Excel) is untested with a real student.
