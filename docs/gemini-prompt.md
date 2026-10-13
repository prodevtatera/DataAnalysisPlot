# Prompt for asking another model to plan this

Use this when asking Gemini, GPT or another model for a plan. The original question ("would you be capable of building this?") invited a "yes" and a sales pitch. This version asks for a critical inventory first, then a plan, and no code until the plan has been reviewed.

Fill in the time budget before sending.

```
I want to build a free browser-based data analysis and plotting app inspired by QtiPlot (https://www.qtiplot.com). Do not write code yet.

Context:
- Users: Biology Bachelor students in years 1 and 2 at Humboldt-Universität zu Berlin, then other universities. Lecturers and lab instructors decide which tools students use.
- Launch bar: it must feel complete at first view. "Complete" means a student can do every real year 1–2 lab assignment from start to finish in the app, faster than in Excel.
- Builder: me, with AI coding help. Time budget: [fill in].
- Runs fully in the browser. Use a server only where a feature truly needs one.
- Don't use the QtiPlot name or branding. It is a trademark.

Step 1: Scope inventory. Read every page on qtiplot.com (index, plot-gallery, plot3D, data-analysis, statistics, data-exchange, scripting, project) and the manual's table of contents (https://www.qtiplot.com/doc/manual-en/index.html). Put every feature in a table with these columns: feature, source URL, browser feasibility (works / needs server / Chrome-only / impossible), effort (S/M/L/XL), and must/should/won't for my users. List only features you found on those pages.

Step 2: Hard parts. Name the 5 hardest parts and explain why each is hard. Cover the click-to-edit graph editor, live updates between tables and plots, undo/redo, and numerical correctness.

Step 3: Decisions. Pick exactly one library for each job and explain why in one line. Don't give "X or Y" answers. Give the download size and load-time cost of each library.

Step 4: Plan. Plan a launch that fits my time budget, then the later phases. Phase 1 must include how projects are stored, save/load, undo/redo and live updates. For each phase, say what the user can do at the end, how long it will take, and how we'll verify it.

Step 5: Verification. Explain how we'll prove the math is right. Use the NIST StRD datasets for curve fitting, linear regression, ANOVA and summary statistics, and use R reference outputs for each statistical test.

Step 6: Risks. Be blunt. Don't say you are "fully capable". Say where you are likely to fail.

Additional rules:
- Every feature needs a source URL and a pass/fail acceptance check.
- Measure speed and download sizes. State the device, browser and dataset size.
- Check results against independent answers (NIST certified values, R). Never check against the same library the app uses.
- When data changes, existing fits must recalculate or show as out of date.
- Failed fits, invalid data and unsupported features must show a clear message.
- State which method is used for fit uncertainties.
- Don't call a milestone done without showing the result.

Stop after step 6 and wait for my review.
```
