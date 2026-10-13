# Student tools, pain points and competitors

Research agent report, 2026-10-13.

The brief: what tools year 1–2 biology students in Germany use, what they cost, where they hurt, what lecturers require in figures, and which free tools compete.

Limits: Reddit, StackExchange and StackOverflow were blocked for the agent. HU's CMS pages sit behind a bot-check, which the agent didn't bypass. So student-voice evidence is thin, and most pain points rest on vendor docs, papers and old German forum threads.

Tags: **[R]** = read in the source. **[S]** = search-result summary only. **[I]** = inference.

## 1. Tools, prices and fit for lab reports

- **Excel**
  - HU account holders get Office 365 free [R]: https://www2.mathematik.hu-berlin.de/it/index.php?seite=software&lang=de
  - HU-Desktop (a Windows remote desktop) is free for HU students [R]: https://www3.hu-berlin.de/cmsdienstewww/index_nojs.php?svc=108
  - Trendlines come in six fixed forms (linear, log, polynomial, power, exponential, moving average), with no custom model [R]: https://support.microsoft.com/en-us/office/trendline-options-in-office-92157920-fee4-4905-bc89-6a0f48152c52
  - Solver isn't available in Excel for the web [S]. The Analysis ToolPak exists on Mac [R].
- **Google Sheets**
  - Free.
  - Error bars only work on bar and line charts [R]: https://support.google.com/docs/answer/9085344
  - Trendlines: linear, exponential, polynomial, log and power [S].
- **LibreOffice Calc**
  - Free.
  - The same six trendline types, with no custom model [R].
  - The CSV import dialog lets you choose the separator and language [S].
- **R / RStudio**
  - Free (AGPLv3) and the most capable option, but it needs code.
  - HU has an open 5-credit course, "Praktische Datenanalyse mit R" (listed for SoSe 2024) [R]: https://qis.hu-berlin.de/lupo/rds?publishContainer=lectureContainer&publishid=215713&state=verpublish
- **GraphPad Prism**
  - Student price: USD 142 per year for 2 PCs, with an ID check. Academic price: USD 260 per year. Prices are only in USD [R]: https://www.graphpad.com/how-to-buy/student/
  - Professors can request free course licences [R]: https://www.graphpad.com/free-course-licenses
  - It has 105 built-in nonlinear equations [R].
  - Significance brackets and stars have been built in since Prism 9 [S].
- **SPSS**
  - No EUR student price was found. HU's SPSS licence isn't verified.
  - Münster gives students the network licence free and sells an offline one for EUR 30 [S].
- **Origin**
  - The student version is USD 69 per year, but only in the US and Canada [R].
  - The free Learning Edition lasts 6 months, has a 12-window limit and needs a promo link [R].
  - It has no built-in Michaelis-Menten model; users fix a Hill function at n=1 instead [S].
- **Fiji**: image analysis (GPL), not a plotting tool [R].

## 2. Pain points

- **Error bars (SD vs SEM, per bar).**
  - Excel's SD and SE presets compute from the whole series, so each bar needs Custom error values [R]: https://support.microsoft.com/en-us/office/add-change-or-remove-error-bars-in-a-chart-e6d12c87-8533-4cd6-a3f5-864049a145f0
  - Google Sheets' SD option centres on the series mean [R].
  - A German forum thread from 2007 shows this exact complaint [R]: https://www.herber.de/forum/archiv/860to864/862583_Standardabweichung_in_Balkendiagramm.html
  - Cumming et al.: experimental biologists are often unsure how to use and read error bars [R]: https://fortinlab.bio.uci.edu/resources/Error_bars_in_experimental_biology.pdf
- **Significance stars.**
  - Excel has no feature for them, and guides tell users to add text boxes by hand [I, weak source].
  - No forum evidence was found.
- **Choosing a test.**
  - The authors of BioStats built a free Shiny app because Excel is hard for beginners and lacks non-parametric tests [R]: https://qubeshub.org/community/groups/coursesource/publications?id=4651&v=1
  - numiqo offers a test assistant [R]: https://numiqo.de/
  - Forum evidence is thin.
- **R learning curve.**
  - The BioStats paper says R coding intimidates many students [R].
  - A 2023 study found no difference in R anxiety between maths and biomedical first-years at the start [S].
  - Evidence is thin.
- **Nonlinear fits in Excel.**
  - Solver works but depends on starting values. Teaching protocols walk students through it [S]: https://www.protocols.io/view/fitting-enzyme-kinetics-data-with-solver-bik7kczn.html and https://www.nature.com/articles/nprot.2009.182
  - Students default to Lineweaver-Burk linearisation, which distorts the errors [S].
- **Error propagation by hand.**
  - Heidelberg's lab guide teaches it by formula (2016) [R]: https://backend.cos.uni-heidelberg.de/de/dokumente/laborguidestatistikpdf/download
  - So does a 2026 Hamburg physics course for biologists [R]: https://www.physik.uni-hamburg.de/service/praktika/biologie/skript-bio-2026.pdf
  - HU's B.Sc. has Physik 1 and 2 modules [R].
  - No student complaints were found.
- **Decimal comma and semicolon CSV files.**
  - Excel follows the Windows regional separators [S].
  - R ships `read.csv2` for this case [R].
  - JASP only fixed German-locale decimals in xlsx import in version 0.96.0 [R]: https://jasp-stats.org/release-notes/
  - Excel turns gene names into dates in about 20% of genomics supplementary files (Ziemann et al.) [R]: https://pmc.ncbi.nlm.nih.gov/articles/5359807
- **Figure quality.** Kiel's guide contrasts incomplete and complete graphs and bans photographed pages [R], so incomplete axes probably recur [I].
- **Prism cost.** The official prices are above. No forum complaints were found.

## 3. What lecturers and guides require

- **Kiel biol108 (2019)** [R]: https://www.molphys.uni-kiel.de/en/teaching/biol108-2018/biol108_leitfaden2019
  - Graphs come from Excel or R. Raw-data tables don't go in the results.
  - Figures are numbered, with axis labels, units and a caption below that explains them on their own.
  - Linear fits show y = mx + b and R².
  - The example caption gives n = 3 and mean ± SD.
- **Frankfurt (2023)** [R]: https://www.starkerstart.uni-frankfurt.de/133515644.pdf
  - The caption must stand alone and include the methods.
  - Figures need units, error bars and sensible axes.
  - It warns that a log versus linear scale changes the impression.
- **Salzburg Zoology (2020)** [R]: https://www.plus.ac.at/wp-content/uploads/2021/02/Anleitung_zur_Abfassung_eines_wissenschaftlichen_Protokolls_neu.pdf
  - Never show a mean without an SD, SE or CI.
  - Choose the plot type by the question, not by bar length.
  - Label every axis with its unit.
  - Tools like Excel were built for business.
- **Heidelberg COS (2016)** [R]
  - SEM = SD/√n.
  - Give n and say which error you report.
  - Round the error to 1–2 significant digits.
- **LMU (2026)** [R] defines the standard error as s/√n: https://cms-cdn.lmu.de/media/19-biologie/fakultaetswebsite-biologie/downloads/evolutionsbiologie/statgen/statbiol/standardfehler_kompakt.pdf
- **Cumming 2007** [R]
  - The legend must say what the error bars are and give n.
  - Use error bars only for independent replicates.
  - For n = 3, plot the individual points.
- **Weissgerber 2015** [R]: bar graphs hide data, so show individual points for small samples. https://journals.plos.org/plosbiology/article?id=10.1371/journal.pbio.1002128
- **Gaps:**
  - No guide fixes a convention for significance stars or p-value format.
  - No HU Biology protocol guide was found.
- **HU B.Sc. regulations (2025)** [R]: https://edoc.hu-berlin.de/server/api/core/bitstreams/16900a72-1f9b-4019-b12a-d25ea8223108/content
  - Module BioB 6 covers biostatistics: distributions, correlation, regression and test statistics.
  - The chemistry lab module is assessed by a portfolio of 15 protocols.
  - No module text names any software. Semesters weren't verified.

## 4. Free competitors

- **JASP**
  - Free. Covers t-tests, ANOVA, regression, frequencies and more [R].
  - The docs don't mention nonlinear regression or curve fitting [R].
  - Plot editing is basic (since 0.15) [R].
  - German UI since 0.14. Opens csv, xlsx, ods and sav [R].
- **jamovi**
  - Free and built on R.
  - In 2018 a developer said nonlinear regression wasn't available, and no module was found since [R/S].
  - Exports PNG, PDF, SVG and EPS [S].
- **PAST**
  - Free desktop app for Windows and Apple-silicon Macs.
  - Fits Michaelis-Menten, logistic, Gompertz, von Bertalanffy, Hill, Gaussian, power and exponential models with bootstrap 95% CIs [R]: https://nhm.uio.no/english/research/resources/past/help/nonlinearfit.html
  - Aimed at ecology and palaeontology [I].
- **Desmos**
  - Nonlinear regression with R², but it can get stuck on local minima [S].
  - No statistical tests and no error bars [I].
- **Google Colab**: Python only, needs code, and its limits aren't guaranteed [R].
- **Web curve fitters** (GVSU, UAH Michaelis-Menten pages): you set start values by hand and click repeatedly [S].
- **numiqo (formerly DATAtab)**: German browser statistics with tests, charts and a test assistant. It doesn't mention curve fitting, and prices aren't shown [R].
- **BioStats (Louisville, 2024)**
  - Browser app with CSV upload.
  - Offers histograms, box plots, scatter plots, t-tests, Mann-Whitney, ANOVA with Tukey, Kruskal-Wallis, chi-square and Fisher tests.
  - No curve fitting and no mean-with-error-bar charts [R].
- **LabPlot**: free desktop app with curve fitting and a plot digitiser [R].
- **SciDAVis**: free, but its site was last updated in 2017 [R].

## The gap [I]

Among the tools checked, none combines all four of these:

1. Pasting German-format numbers (decimal comma) without trouble.
2. Plots of mean ± SD/SEM with the individual points and significance brackets.
3. Nonlinear fits without hand-set start values, with confidence intervals for the parameters.
4. Export ready for a caption.
