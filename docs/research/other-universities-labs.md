# Biology lab assignments at other universities

Research agent report, 2026-10-13.

The agent found 16 assignments in 14 documents and read each document in full unless marked partial.

Limits:
- No fitted EC50 or Hill curve turned up, and no species-area assignment.
- No source asks for a nonlinear Michaelis-Menten fit.
- German genetics and ecology lab scripts are mostly behind Moodle or ILIAS logins, so those two types rely on English sources.
- No Origin, Prism or ImageJ requirement was found anywhere.

## A. Photosynthesis, pigments, plant water

**1. Respiration rate and photosynthesis light-response curve (O2 electrode)**
- University of Rostock, plant physiology lab, Bachelor Biology, winter 2017/18: https://www.itmz.uni-rostock.de/storages/uni-rostock/Alle_MNF/Bio_Pflanzenphysiologie/PP-grundpraktikum-vorschriften-18.pdf
- Data:
  - Clark electrode trace (volts over time) for 4 mL of cyanobacteria.
  - 5–10 minutes of dark respiration, then 2–5 minutes per light step, with light-meter readings.
  - Calibration with O2-saturated water, and E750 of a 1:10 dilution.
- Analysis:
  - The slope of each step (V/min), converted to µg O2/mL/min/E750 using the calibration.
  - Plot the light-response curve.
  - Run a linear regression through the respiration point and the 2–3 lowest light steps. Solve for y = 0 to get the light compensation point.
- Same document, MTT dehydrogenase assay: 8 samples at 5-minute intervals. Plot E570 over time for two treatments, take the slopes of the linear parts and compare them.
- Figures need legends, with the independent variable on the x axis.

**2. Pigment content (chlorophyll a/b, phycocyanin, carotenoids)**
- Same Rostock document.
- Data:
  - Absorbance at 750, 680, 625 and 490 nm of a 1+9 dilution.
  - Chlorophyll in methanol (E663) and in 90% acetone (E647, E663, E750), from 0.5 g of fresh mass.
- Analysis:
  - Subtract the E750 turbidity, multiply by the dilution factor and apply overlap-correction equations. For example, Chl a = 11.8(E663−E750) − 2.3(E647−E750).
  - Normalise to µg per mg of fresh mass.
  - Assign the spectrum peaks to pigments.

**3. Ions, osmotic concentration and potato water potential**
- Same Rostock document.
- Data:
  - Flame photometer readings for 6 Na/K standards, with plant sap diluted 1:100 to 1:5000.
  - Freezing-point osmometer, at least 2 repeats.
  - Potato cylinders in 5 sucrose solutions, measured with a caliper before and after 2 hours.
- Analysis:
  - A calibration function **in Excel (named)**, then back-calculation and multiplication by the dilution factor.
  - Osmolality from the calibration factor, and the share of osmolality explained by Na+, K+ and Cl−.
  - Van't Hoff for osmotic potential.
  - Plot length change against sucrose concentration, read off the isotonic point and compare it with the osmometer.

**4. Biology lab for biochemists (plant physiology)**
- FU Berlin, summer 2007: http://userpage.fu-berlin.de/~schmitt/Lehre/BfB/assets/BfB_Skript.pdf
- Plasmolysis: onion cells in 6 sucrose concentrations, at least 50 cells each. Plot % plasmolysed against concentration. The 50% point is the limit of plasmolysis.
- Water potential: weigh potato and pea before and after 24 hours in 0–2 M sucrose. Plot % weight change and read the zero crossing.
- Elodea CO2 uptake: plot pH over time.
- Urine osmolality: 7 time points, with three graphs over time and totals in a table.
- Psychophysics: a 75%-correct threshold converted to milliseconds, with the spread reported. Weight discrimination shown in a graph.

## B. Enzymes and photometry

**5. Lowry protein assay and the extinction coefficient of NADH**
- University of Rostock, biochemistry lab, summer 2017: https://www.lkv.uni-rostock.de/storages/uni-rostock/Alle_MNF/Bio_Biochemie/Dateien/GP_Script2017.pdf
- Data:
  - BSA from 0 to 200 µg/mL (11 points, in duplicate), plus an unknown in duplicate.
  - NADH at 6 concentrations, in duplicate.
- Analysis:
  - Average the duplicates and draw a calibration line **through the origin**. Read the unknown off the line.
  - For NADH, get ε from the slope and also as the average of A/(c·d) per point. Compare the two.

**6. Alcohol dehydrogenase kinetics (plus catalase, amylase, gel filtration)**
- Same Rostock document.
- Data: 6 ethanol concentrations, with A366 measured for 60 seconds. The initial rate comes from a fixed linear window.
- Analysis:
  - v = ΔE/Δt ÷ (ε·d), in µM/min.
  - A table of S, v, 1/S and 1/v.
  - Plot **v against S** and **1/v against 1/S with regression**, and get Km and vmax from the intercepts.
  - Specific activity, active-site concentration and kcat.
- Gel filtration: plot log molecular weight against elution distance with a regression line.

**7. Alkaline phosphatase kinetics, with and without an inhibitor**
- University of Göttingen, 2011: https://www.uni-goettingen.de/de/document/download/febb7507f9905f91837c4bbf26335b52.pdf/V15%20neu.pdf
- Data: 5 substrate concentrations, A436 every 30 seconds for 3 minutes, with and without inhibitor.
- Analysis:
  - Convert absorbance to product concentration, and plot product against time for each condition.
  - Take initial rates and draw **Michaelis-Menten, Lineweaver-Burk and Eadie-Hofstee** plots.
  - Report Km, vmax and k2 for both conditions.
  - Decide whether the inhibition is competitive or non-competitive, and compare Km with the literature.

**8. Michaelis-Menten urease kinetics by conductivity**
- FU Berlin, physical chemistry lab, 2012: http://pcprakt.userpage.fu-berlin.de/SKRIPT/MM3.pdf
- Data: 9 urea concentrations, with conductivity every 10 seconds for 3 minutes. A dilution series serves as the calibration.
- Analysis: a calibration curve, initial rates, and Lineweaver-Burk for vmax, Km and k2.

## C. Growth curves

**9. E. coli growth**
- University of Ulm, module "Biology of Prokaryotes", 2017: https://www.uni-ulm.de/fileadmin/website_uni_ulm/nawi.inst.140/files/Skript_UEbungen_BdP.pdf
- Data:
  - OD600 every hour from 0 to 8 hours and at 24 hours, diluted above OD 0.3, with two readings and their mean.
  - Total cell count (counting chamber) and viable count (spot plating) at 5 time points.
  - Glucose at 4 time points.
- Analysis:
  - Plot OD and cells/mL by hand on semi-log paper, then again **in "Excel, Numbers etc."**.
  - Fit a line in the exponential range. Then compute the growth rate ν = (log N2 − log N1)/(log 2 · Δt), the generation time g = 1/ν, μ = (ln OD2 − ln OD1)/Δt, and the doubling time td = ln 2/μ.
  - Compare total and viable counts, and get glucose concentration with Lambert-Beer.

## D. Physiology, and physics for biologists

**10. Animal physiology course**
- University of Tübingen, summer 2016 (partly read): https://www.hih-tuebingen.de/fileadmin/web/img/content/Forschung/Kognitive_Neurologie/SkriptTierphys_SS_2016_Bioinformatiker.pdf
- Data:
  - Frog muscle force at 5 stimulus levels × 5 twitches.
  - Fly ERG at several wavelengths and intensities, with 3 repeats.
  - Hearing thresholds, knee-reflex times (16 trials × 3 conditions) and eye-position calibration.
- Analysis:
  - Plot force against stimulus and against length. Plot ERG on a semi-log axis, then iso-potential curves.
  - Draw an audiogram on a log frequency axis.
  - Mean and SD per condition, and a **Wilcoxon/Mann-Whitney rank-sum test by hand** (n = 16 per group).
  - A linear regression to judge linearity.
- Excel is optional. The script **warns against Excel's "smooth line"**. Axes need units and legends.

**11. Heart physiology (virtual rat heart) and drug responses**
- University of Münster: https://www.uni-muenster.de/imperia/md/content/biologie_zoophysiologie/electrophys/_v/herz07.pdf
- Data: contraction amplitude and frequency at adrenaline concentrations from 10⁻⁸ to 10⁻⁵ M, plus antagonist conditions.
- Analysis:
  - Molarity from mg/mL, and dilutions with M1V1 = M2V2.
  - Plot amplitude against **log10 concentration**, and draw a bar chart with and without the antagonist.
  - No curve fit or EC50 is asked for.

**12. Physics lab for biology students**
- University of Hamburg, 2026: https://www.physik.uni-hamburg.de/service/praktika/biologie/skript-bio-2026.pdf
- Data:
  - Haem-protein absorbance for 5 known concentrations × 3 repeats, and 2 patient samples × 3 (diluted 5000×).
  - Microscope eyepiece calibration, then hair thickness.
- Analysis:
  - A **hand-drawn** graph of all 15 points, and the line y = mx + b with r.
  - Unknowns × 5000, and a decision on anaemia.
  - Mean, SD (n−1) and SEM = s/√n, reported as mean ± SEM.
  - Error propagation, semi-log graphs, and **rounding to the size of the error**.
- Every graph and table needs a caption. Computer plots aren't allowed unless agreed.

## E. Molecular sizing

**13. Restriction analysis**
- TU Braunschweig, Institute of Genetics, Biotechnology Bachelor, **semester 2** (evaluation section only): https://www.tu-braunschweig.de/index.php?eID=dumpFile&t=f&f=41017&token=b5fcaa5d3e5eba27a28867d811f673eafa66e52c
- Data: a gel photo with a ruler, ladder bands and 6 digests.
- Analysis:
  - Measure migration distances and draw a **calibration line on semi-log paper** (250–2000 bp).
  - Read off the fragment sizes and draw a restriction map.

## F. Statistics

**14. Probability and statistics exercises for biologists**
- LMU Munich, module P20, Bachelor Biology, summer 2026: https://www.bio.lmu.de/de/forschung/forschungsbereiche/evolutionsbiologie/metzler-lab/statistik-im-biologie-bachelor-studium/
- Data: small tables, such as paired measurements (n = 16), three groups of 10, 2×2 counts, and group means with standard errors.
- Analysis:
  - 95% confidence intervals with t quantiles.
  - One-sample, paired and two-sample t-tests, with the null hypothesis stated first.
  - Wald and Wilson intervals, and χ² on a 2×2 table.
  - ANOVA, pairwise comparisons and at least 3 corrections for multiple testing.
  - Kruskal-Wallis step by step.
  - "Visualise appropriately", with one-sentence conclusions.
- Software: **R throughout**.

## G. English-language sources (ecology and genetics)

**15. Measuring biodiversity**
- Kenyon College, Ecology, 2010: https://biology.kenyon.edu/courses/biol229/diversity.pdf
- Data: species counts from 4 samples.
- Analysis:
  - Species richness, the Shannon index H' = −Σ p ln p and the Simpson index 1 − D.
  - Rank the samples and say whether the indices agree.
  - Jaccard similarity for each pair of sites.

**16. Fruit fly crosses (chi-square) and Hardy-Weinberg**
- Fruit flies: ABLE Proceedings vol. 29: https://www.ableweb.org/biologylabs/wp-content/uploads/volumes/vol-29/004b.pdf
- Hardy-Weinberg: University of Vermont: https://blog.uvm.edu/tdonovan-vtcfwru/files/2020/06/29-Donovan-pages-308-EE.pdf
- Data: F2 phenotype counts, and 1000 genotypes simulated in Excel.
- Analysis:
  - Expected counts from the ratio, then χ² = Σ(O−E)²/E with df = classes − 1, and accept or reject.
  - Hardy-Weinberg: allele frequencies p and q, expected counts p², 2pq and q² times N, and χ² by hand and in a spreadsheet.

## Found but not used

- **Not opened:**
  - Kiel biol103 (password-protected; the agent didn't try to get around it).
  - Bielefeld Basismodul Biologie II (a Moodle protocol template).
  - Hamburg Tierphysiologie and BOKU enzyme kinetics (both returned 404).
  - Jena Botanisches Grundpraktikum and the LOUIS lab manual (couldn't be fetched).
  - Halle genetics: only student protocols on Studocu.
- **Opened but weak:**
  - HHU Düsseldorf animal physiology module description: O2 consumption with the gas law, mean and SD, pH optima, lipase activity.
  - Greifswald Bradford instructions (Master's level).
  - Saarland genetics (no statistics).
  - Ulm limnology (saprobic index).
  - Duisburg-Essen Master's documents.

## Tally (16 assignments)

| Feature | Count | Assignments |
|---|---|---|
| Dilution and unit-conversion bookkeeping | 8 | 2, 3, 5, 6, 7, 9, 11, 12 |
| Calibration line and reading an unknown | 6 | 3, 5, 6, 8, 12, 13 |
| Lambert-Beer or ε conversion | 6 | 2, 5, 6, 7, 9, 12 |
| Explicit linear regression | 6 | 1, 3, 5, 6, 10, 12 |
| Means of replicates | about 6 | 3, 5, 9, 10, 12, 14 |
| Normalisation (per mass, per kg, per E750) | 5 | 1, 2, 3, 4, 6 |
| Initial rate from a linear section | 4 | 1, 6, 7, 8 |
| Semi-log plot | 4 | 9, 10, 12, 13 |
| SD, SEM or spread | 4 | 4, 10, 12, 14 |
| Excel named | 4 | 3, 9, 10, 16 |
| Lineweaver-Burk | 3 | 6, 7, 8 |
| kcat or turnover number | 3 | 6, 7, 8 |
| Hypothesis tests | 3 | 10 (Wilcoxon), 14 (t, χ², ANOVA, Kruskal-Wallis), 16 (χ²) |
| Threshold, 50% reading or log-dose plot | 3 | 4, 10, 11 |
| Hand-drawn graph on paper | 3 | 9, 12, 13 |
| Michaelis-Menten v against S plot | 2 | 6, 7 |
| Eadie-Hofstee, inhibition type | 1 | 7 |
| Growth rate and doubling time | 1 | 9 |
| Error propagation | 1 | 12 |
| Diversity indices | 1 | 15 |
| R named | 1 | 14 |
| Nonlinear fit (Michaelis-Menten or Hill) | 0 | – |
| Error bars explicitly required | 0 | – |
