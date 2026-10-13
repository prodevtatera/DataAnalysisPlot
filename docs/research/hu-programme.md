# HU Berlin Bachelor Biology, years 1–2: programme, statistics, software

Research agent report, 2026-10-13.

Tags: **[R]** = read in the source. **[S]** = search-result summary only. **[I]** = inference.

Access limit: hu-berlin.de, biologie.hu-berlin.de and cms.hu-berlin.de sit behind a bot-check, which the agent didn't bypass. The agent used pages without the check instead: the HU document repository (edoc), the AGNES course catalogue, the Institute for Theoretical Biology wiki, lecturer pages and the physics lab site.

## Key findings for the app

1. **HU teaches QtiPlot.** The Biology institute's mentoring programme teaches "Excel, QtiPlot und LaTeX" in workshops (the page is about 5 years old) [S]. The HU physics lab recommends Origin and QtiPlot, and advises against using spreadsheets for plots or regression [R]. That is likely why QtiPlot came up at all.
2. **Teaching is in German** [R/S]. The UI must be German, and German decimal commas must work.
3. **Statistics is light in the rules.** BioB 6 (semester 2) is the only module that names statistics: random variables, distributions, correlation, regression and test statistics [R]. Labs in physiology, ecology, biochemistry and other modules involve data collection and evaluation.
4. **Physics labs expect real error analysis.** BioB 9 and 14 require error propagation, weighted linear regression with parameter uncertainties, and chi² [R]. So error propagation still matters for biology students.
5. **Licences:** Office 365 is free. SPSS and MATLAB have campus licences. No HU licence was found for Origin or GraphPad Prism [S].

## 1. Rules and modules

**Rules [R]:** Fachspezifische Studien- und Prüfungsordnung Biologie, AMB Nr. 27/2025 (18.07.2025): https://edoc.hu-berlin.de/server/api/core/bitstreams/16900a72-1f9b-4019-b12a-d25ea8223108/content (DOI 10.18452/34250).
- It applies from 1 October 2025. Students who started earlier stay under the 2021 rules until 30 September 2027.
- Students start in the winter semester only.
- The single-subject Bachelor (Monobachelor) is 180 credits.
- The module descriptions are in Appendix 1 and the ideal study plan in Appendix 3.

**Monobachelor ideal plan, semesters 1–4 [R].** Each module is 5 credits unless stated. "UE" means a practical class (Übung).

| Sem | Module | Lab / field work | Maths, statistics, physics, chemistry |
|---|---|---|---|
| 1 | BioB 1 Molecular cell biology (10 credits) | UE with experiments | – |
| 1 | BioB 2 Evolution and biosystematics | UE: traits, identification keys, phylogenetic datasets | – |
| 1 | BioB 3 Maths 1 | UE (problem sets) | Functions, sequences, iterated maps, differentiation, integration, complex numbers, intro to differential equations |
| 1 | BioB 4 General and inorganic chemistry | – | Chemistry |
| 2 | BioB 5 Organismal biology (10 credits) | UE, 4 hours a week, live material | – |
| 2 | BioB 6 Maths 2 | UE | Maths and **biostatistics** |
| 2 | BioB 7 Organic chemistry | – | Chemistry |
| 2 | BioB 8 Chemistry lab course | Block lab, 2×60 h, portfolio of 15 protocols | Chemistry |
| 2 | BioB 9 Physics 1 | UE | Mechanics, waves |
| 3 | BioB 10 Parasitology | UE (microscopy) | – |
| 3 | BioB 11 Biochemistry | UE (experiments) | – |
| 3 | BioB 12 Biophysics | UE | Physical chemistry, thermodynamics |
| 3 | BioB 13 Animal and neurophysiology | UE (experiments, data collection and evaluation) | – |
| 3 | BioB 14 Physics 2 | Lab, 2 hours a week | Electrodynamics, optics, quantum physics |
| 4 | BioB 15 Microbiology | UE | – |
| 4 | BioB 16 Plant physiology | UE | – |
| 4 | BioB 17 Molecular genetics | UE | – |
| 4 | BioB 18 Ecology and biodiversity | UE and field trip (field data) | – |
| 4 | BioB 19 Theory, tools and methods | Seminar | Bioinformatics, modelling, quantitative methods, data analysis |

Each semester also has a 5-credit free elective (ÜWP).

**Combined Bachelor (Kombibachelor) [R]:** it is only offered with a teaching focus. BioB 3, 6 and 19 are only for the Monobachelor, so these students get no maths or statistics module.

## 2. Statistics content

- **BioB 6 only [R]:**
  - A biostatistics lecture (1 credit) plus a practical class shared with Maths 2.
  - Topics: random variables, distributions, correlations, regression and test statistics.
  - Exam: 90 minutes written, or 30 minutes oral.
- **What the rules don't name [R]:** t-test, ANOVA, chi-square, non-parametric tests and descriptive statistics. "Test statistics" probably covers some hypothesis tests [I].
- **How it's taught [R]:** 7 Maths 2 sessions, then 7 "Biostatistik 1–7" sessions: https://itb.biologie.hu-berlin.de/~kempter/Teaching/2025-SS-Mathematik/index.html
- **BioB 3 plan for winter 2026/27 [R]:** http://itb.biologie.hu-berlin.de/~kempter/Teaching/2026-WS-Mathematik/index.html
- **Physics lab [R]:** https://gpr.physik.hu-berlin.de/Downloads/Programme.html stresses error analysis, weighted linear regression with parameter uncertainties, and chi². The physics lab script is listed as the reading for the BioB 14 lab.

## 3. Software

- **The rules [R]:** no software is named.
- **Biology mentoring programme [S]:** workshops teach "Excel, QtiPlot und LaTeX" and can count for up to 2 elective credits. The page is about 5 years old: https://www.biologie.hu-berlin.de/de/studenten/aktuelles/erstsemester/mentoring-tutoring-programm-1
- **Physics lab [R]:** recommends Origin and QtiPlot. It advises using spreadsheets only for tables and calculations, not for plots or regression. MATLAB, Mathematica and Maple are allowed.
- **R [R]:** found only as an elective, "Praktische Datenanalyse mit R – Deskriptive Statistik" (5 credits, German, summer 2024).
- **Python [R]:** found only in a Master's course.
- **Not found:** software for BioB 3, 6 or 19 (their Moodle courses need a login).
- **Also not found** in the biology Bachelor: SPSS, Prism, ImageJ/Fiji, PAST, JASP or jamovi.

## 4. HU licences for students

Mostly [S], because the HU IT pages have a bot-check.

- **Campus agreements:** Adobe, Affinity, ArcGIS, Citavi, MATLAB, Mathematica, SPSS and Zoom.
- **Microsoft:** Microsoft 365 Apps.
- **HU-Desktop [R]:** a free remote Windows desktop with the computer-room software: https://www3.hu-berlin.de/cmsdienstewww/index_nojs.php?svc=108
- **Training-room PCs:** R, RStudio, SPSS and Stata (the list is about 3 years old).
- **Origin and GraphPad Prism:** no HU licence found. Whether QtiPlot is listed is unverified.

## 5. Language

German [R/S]. The course catalogue lists "Sprache: deutsch" for BioB 6, BioB 19 and the Physics 2 lab.

## 6. Public course pages

- **Lecture pages with session plans [R]:** https://itb.biologie.hu-berlin.de/~kempter/Teaching/
- **Exercise sheets:** none public. They are in Moodle behind a login.
- **Physics 2 lab:** students write a report per experiment, and the physics lab script is the reading.
  - Protocol advice: https://gpr.physik.hu-berlin.de/Allgemeines/Allgemeines.html
  - Scripts: https://gpr.physik.hu-berlin.de/Skripten/GPRII.html
- **Unread lead:** the student council's archive of old exams: https://fachschaften.hu-berlin.de/de/fsbio/alt/files/prufungen/bsc
