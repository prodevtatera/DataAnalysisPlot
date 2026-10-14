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

Phases 0 to 2 and the built parts of Phase 3 are finished and moved to `roadmap_done.md`, with their evidence. 40 automatic checks pass.

## Open now: needs people or extra software

These are what is left of the gates. The code is ready for all of them.

1. **Phase 3 gate: instructor demos.** Show the app to 3 to 5 Physics 2 lab instructors and ask what they would need to put it in the lab manual. **Pass:** at least one instructor says they would try it in a lab group, or we learn exactly what blocks that. Write down what they ask for. The demo script and questions are under "For Luis" in `progress.md`.
2. **Real data and the real experiment list from her.** Phase 2 assumed P1 to P9 and used invented data. With her list and one dataset from last semester, rerun the P1 to P9 checks on real data and fix what differs.
3. **Time one real student on one experiment.** A person (her, or a classmate) does the analysis of one experiment twice, once in the app and once in her usual tool, with a stopwatch. Write down the minutes and where she got stuck. This replaces the estimated Excel step count in `phase1-report.md` and `phase2-report.md`.
4. **R cross-check (later).** Install R (`brew install r`). Run the weighted line fit, the NIST Norris data and the template results through R and compare them with the app to 6 digits or more. **Pass:** every number agrees, or each difference is explained. This closes the "matches R" part of the Phase 1 and Phase 2 gates. Not urgent: NIST and the hand calculations already agree to 9 digits.
5. **Hosting.** Decide where the app lives. It must send long cache headers and compress files (see `phase0-timing.md`).
6. **Launch specification.** Write it from the checklist and what the instructors say.

## Later: Biology widening (not planned in detail)

B1–B13 in the checklist: standard curves, enzyme kinetics, growth curves, non-parametric tests, ANOVA, diversity indices. Plan this only after phase 3, once we know whether Physics 2 landed. Biology courses depend on Moodle material we don't have yet.

## Open questions for the daughter

1. Which Physics 2 experiments will you do? Any script or protocol PDFs?
2. Which software does the lab use for plots and fits (QtiPlot, Excel, other)?
3. What takes longest or annoys you most?
4. Can we use one of your own datasets from last semester to test with?
