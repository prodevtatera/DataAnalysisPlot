# Roadmap

Written 2026-10-13, reduced to the open items on 2026-10-14. What is done is in `roadmap_done.md`.

## What we know

- The first real use is **Physics 2**, the physics lab that Biology students take at HU Berlin. That is all Luis's daughter knows so far.
- We don't yet know which experiments she will get. We assume they come from the HU physics script for non-physicists. Those are items P1–P9 in `lab-assignments-checklist.md`. Treat them as a guess until she confirms.
- The physics lab recommends QtiPlot and advises against spreadsheets for regression. So the first competitor is QtiPlot, and Excel is second.
- Physics items need weighted fits, error propagation and HU's rounding rule. Those are the hardest numbers to get right, so we start there.

## How to read this

- Each phase ended with a **gate**: a pass/fail check shown working, not described. The open items below are the unfinished parts of those gates.

## Done

Phases 0 to 2, the built parts of Phase 3 and Phase 4 (the calmer page and the home page) are finished and moved to `roadmap_done.md`, with their evidence. 46 automatic checks pass.

## Open now: needs people or extra software

These are what is left of the gates. The code is ready for all of them.

1. **Phase 3 gate: instructor demos.** Show the app to 3 to 5 Physics 2 lab instructors and ask what they would need to put it in the lab manual. **Pass:** at least one instructor says they would try it in a lab group, or we learn exactly what blocks that. Write down what they ask for. The demo script and questions are under "For Luis" in `progress.md`.
2. **Real data and the real experiment list from her.** Phase 2 assumed P1 to P9 and used invented data. With her list and one dataset from last semester, rerun the P1 to P9 checks on real data and fix what differs.
3. **Time one real student on one experiment.** A person (her, or a classmate) does the analysis of one experiment twice, once in the app and once in her usual tool, with a stopwatch. Write down the minutes and where she got stuck. This replaces the estimated Excel step count in `phase1-report.md` and `phase2-report.md`.
4. **R cross-check (later).** Install R (`brew install r`). Run the weighted line fit, the NIST Norris data and the template results through R and compare them with the app to 6 digits or more. **Pass:** every number agrees, or each difference is explained. This closes the "matches R" part of the Phase 1 and Phase 2 gates. Not urgent: NIST and the hand calculations already agree to 9 digits.
5. **Hosting.** Decide where the app lives. It must send long cache headers and compress files (see `phase0-timing.md`).
6. **Launch specification.** Write it from the checklist and what the instructors say.

## Backlog from the new look, logo and deploy (2026-10-15)

Things that should be done but were not. None blocks the launch on its own.

1. **Look at every workbench screen in the new look.** Only the home page and the workbench's first screen were checked by eye. Open each tool (Werkzeuge menu), each template and the results tables, at 1200, 800 and 375 px, and fix leftovers (old blue, square corners, hard-coded colours in plots). **Pass:** screenshots of all of them in `evidence/`, nothing looks out of place.
2. **Contrast check of the new colours.** The grey-violet text (`--muted`) on white and on the lavender hero box, and white on indigo, were chosen by eye. Measure them against WCAG AA (4.5:1 for text) and darken what fails.
3. **Safer deploys.** On 2026-10-15 a production deploy was marked "Ready" but served 404 on every page, and nothing warned us. Add a small script in `scripts/` that deploys from a clean copy of `app/` (runs `setup.sh` first) and then checks that `/`, `/app.html` and `/logo.jpg` answer 200 on the live address. Keep the Vercel link in one place, as it exists only in one worktree now. Then update `.claude/ship.md`: it still says "No deploy exists", which is no longer true.
4. **Run a fit on the live address and measure the load time there.** Still open from the web-address entry in `CHANGELOG.md`. Add the long cache headers for the big files (item 5 above).
5. **Decide the final logo.** The logo is Luis's photo, cropped round. It is small and low-resolution. Decide: keep it, or have a drawn mark made. Also make a PNG tab icon, an Apple home-screen icon and a preview picture for links shared in chats. Ask the daughter what she thinks of the look and the logo.
6. **A test that failed once.** `tests/phase3-step2-firstminute.sh` failed once during a full run (the "image refused" message was missing) and passed on four later runs. Find the timing cause and make the test wait for the message instead of a fixed pause.
7. **Tests change tracked files.** Every run of `scripts/check.sh` rewrites the screenshots in `evidence/` and `docs/phase0-timing.md`, so the work tree is dirty after each run. Have the tests write to a scratch folder, or only update evidence on request. The old screenshots there also show the old look.

## Later: Biology widening (not planned in detail)

B1–B13 in the checklist: standard curves, enzyme kinetics, growth curves, non-parametric tests, ANOVA, diversity indices. Plan this only after phase 3, once we know whether Physics 2 landed. Biology courses depend on Moodle material we don't have yet.

## Open questions for the daughter

1. Which Physics 2 experiments will you do? Any script or protocol PDFs?
2. Which software does the lab use for plots and fits (QtiPlot, Excel, other)?
3. What takes longest or annoys you most?
4. Can we use one of your own datasets from last semester to test with?
