# HU Berlin lab materials for Biology years 1–2

Research agent report, 2026-10-13.

## What is public

The only public HU lab material is the **physics lab** that Biology Monobachelor students take at the Institute of Physics. No biology or chemistry lab scripts are public.
- The plant physiology practical (2112MB016UE) is in Moodle behind a login.
- biologie.hu-berlin.de and some physics pages have a bot-check, so the agent read archive.org copies instead.
- Not readable: the SS16 lab sheets p1–p4, and the 2018 versions of M5, F2neu, Elastizität and O1.

## Which physics experiments biology students do

- **Winter 2008/09:** 6 experiments plus an introduction to error analysis: https://www.physik.hu-berlin.de/en/qom/lehre/ws08bio/info.pdf
- **Summer 2016:** 4 experiments. F1 comes first, for "MB Biologie … ab 1. Fachsemester": https://www.physik.hu-berlin.de/en/qom/lehre/ss16-physik-ii
- **Summer 2017:** E1, F2, O1, O4, O5 and O6. Each student does 3 in a team of three and writes one protocol.
- **Summer 2018 and 2019:** elasticity (M3), thin lenses (O1), surface tension (M5) and volume measurement (F2). **Both course pages name QtiPlot.**
  - https://www.physik.hu-berlin.de/en/qom/lehre/ss18-physik-ii
  - https://www.physik.hu-berlin.de/en/qom/lehre/ss19-physik-ii
- **Current rules (2025):** BioB 14 Physics 2 includes a lab with "measurement tasks in mechanics, oscillations and waves, electrodynamics, optics". The list for 2025/26 isn't confirmed.
- **Script:** "Physik als Nebenfach" (2005): https://gpr.physik.hu-berlin.de/Skripten/Physik%20als%20Nebenfach/PDF-Dateien/Physik%20als%20Nebenfach.pdf

## Assignments

Experiments 1–8 are confirmed for biology students in at least one semester. Experiment 9 is confirmed, but its sheet couldn't be read. Experiments 10–15 are in the same script, but the agent found no source saying biology students do them.

1. **F1 Error distribution.**
   - Data: 100 estimated marker positions, each compared with a vernier reading.
   - Analysis:
     - Differences and a sign test.
     - A frequency table (absolute, relative and cumulative).
     - s = √(Σv²/n), dividing by n because the true value is known.
     - A histogram with a fitted normal curve.
     - A cumulative plot on probability paper. Read the 16% and 84% points and compare them with s.
2. **F2 Volume measurement.**
   - Data: the volume of one body measured three ways (overflow cylinder, geometry with a caliper and micrometer, buoyancy), with repeats.
   - Analysis:
     - Random error per quantity, plus systematic error from instrument formulas.
     - Gaussian error propagation.
     - A check that the three intervals overlap.
     - A **weighted mean** (weights ∝ 1/u²) with its uncertainty.
3. **M3 Elasticity and torsion.**
   - Data: wire extension against load, loading then unloading.
   - Analysis: Young's modulus from the slope with its uncertainty, and the shear modulus from oscillation periods.
4. **M5 Surface tension.**
   - Analysis: a balance calibration curve, ring and capillary methods, a plot of h against 1/r, and σ from the slope with its error. Compare the methods.
5. **E1 Wheatstone bridge.**
   - Analysis: resistances from bridge readings, series and parallel checks, and the relative uncertainty formula.
6. **O4 Grating spectrometer.**
   - Analysis: the grating constant from a known line, unknown wavelengths, and resolving power.
7. **O5 Polarimetry** (the closest to a concentration measurement).
   - Analysis: specific rotation from rotation angle against thickness (quartz) and against thickness × concentration (sucrose), **with error bars**.
8. **O6 Newton's rings.**
   - Analysis: plot r² against k, and get the lens radius and wavelengths from the slopes with their uncertainties.
9. **O1 Thin lenses.** In the 2017–19 lists, but not readable.
10. **F3 Pendulum.**
    - Analysis: mean, s and confidence interval. Plot T² against l, and get g from the slope by graph and by regression.
11. **F7 Statistics and radioactivity.**
    - Analysis: **χ² goodness-of-fit against Poisson and Gauss distributions**, with half-integer class boundaries.
    - Absorption on a semi-log plot with y error bars, and μ from the slope.
12. **T1 and T6 Heat capacity, thermocouple and cooling.**
    - Analysis: a calibration curve, and a cooling curve on semi-log paper.
13. **O7 Abbe refractometer** (the standard-curve analogue).
    - Analysis: n against concentration with error bars, a calibration line by linear regression, and the concentration of an unknown.
14. **O2 Microscope.**
    - Analysis: magnification, eyepiece scale calibration, measured diameters with uncertainty, and the resolution limit.
15. **M6 Viscosity.**
    - Analysis: viscosity with the Ladenburg correction, and the uncertainty by maximum-error estimate.

## Requirements for every experiment

Sources:
- Introduction (2007): https://gpr.physik.hu-berlin.de/Skripten/Einfuehrung/PDF-Datei/Einfuehrung.pdf
- Protocol guidance: https://gpr.physik.hu-berlin.de/Protokollhinweise/Protokollhinweise.pdf
- The SS16 checklist and error-analysis slides for "Physik für Biologen II" (via archive.org).

- **Reporting a result:**
  - Write (value ± u) unit.
  - Round the uncertainty to 1 significant digit, or 2 if that digit is 1 or 2.
  - Round the value to the same decimal place.
  - Don't round intermediate results.
- **Direct measurements:**
  - Mean, and s with n−1 (the script warns about calculators that use n).
  - The uncertainty of the mean is s/√n.
  - Add the instrument error in quadrature: u = √(e_s² + e_z²).
  - For n < 6, estimate the uncertainty from the reading accuracy.
  - Instrument error formulas are given:
    - caliper: 50 µm + 10⁻⁴·L
    - micrometer: 5 µm + 10⁻⁵·L
    - digital stopwatch: 0.01 s + 5·10⁻⁴·t
    - analogue meter: its accuracy class
    - digital multimeter: % of reading + digits
- **Calculated quantities:** Gaussian error propagation, done in a spreadsheet. Maximum-error estimates in some experiments.
- **Regression:**
  - A linear fit with the uncertainties of slope and intercept ("without these the results are practically worthless").
  - A **weighted fit** using 1/s_i².
  - A χ²/degrees-of-freedom plausibility check.
  - Linearisations: T² against l, r² against k, ln p against 1/T, semi-log for exponentials and log-log for power laws.
- **Histograms:** binning rules (N = 5·log₁₀ n, Sturges, Scott) and Gauss and Poisson curves on top.
- **Graphs:**
  - A title, and axis labels with quantity, symbol and unit.
  - Error crosses on the points where sensible.
  - The fit curve marked separately from the points.
  - DIN 461.
- **Software named:**
  - **QtiPlot (recommended, described as an Origin clone)**.
  - LibreOffice or OpenOffice Calc.
  - Excel, with stated limits: no SDs for regression coefficients without RGP/INDEX, no weighted fit, no per-point error bars.
  - Also Origin, Mathematica, MATLAB, Maple, gnuplot, xmgrace and SciGraphica.
  - In-lab programs GERA, CHI.EXE and LABLINK.
  - R and Python aren't mentioned.
- **Known problem with QtiPlot.** A note from the lab staff, "Rechnet QtiPlot falsch?" (Does QtiPlot calculate wrongly?), says QtiPlot's weighted-fit parameter errors need manual scaling by √(χ²/DoF). Its "scale errors" option has no effect, and the note recommends gnuplot instead: https://roe10.physik.hu-berlin.de/Grundpraktikum/Rechnet_QtiPlot_falsch/Rechnet_QtiPlot_falsch.pdf
- **Protocol:**
  - A raw-data log with name, symbol and unit in every column header, plus an instrument list, signed by the supervisor.
  - Formulas, calculations in order, and an error discussion.
  - Submitted as a PDF by email (SS16).

## Biology modules: official text only

From AMB 27/2025 (https://edoc.hu-berlin.de/server/api/core/bitstreams/16900a72-1f9b-4019-b12a-d25ea8223108/content):
- **BioB 6:** the biostatistics lecture covers random variables, distributions, correlations, regression and test statistics.
- **BioB 8 chemistry lab:** assessed by a portfolio of 15 lab protocols.
- **BioB 1:** experiments in molecular cell biology.
- **BioB 2:** building and analysing phylogenetic datasets.
- **BioB 5:** form and function on live material.
- **Coursework formats:** protocols (21,600 to 43,200 characters), short tests, talks, 10–14 exercise sheets, drawings or posters.

No HU biology source was found for Michaelis-Menten, growth curves, photometric standard curves, t-tests or ANOVA. Those have to come from real course material (Luis's daughter, or lecturers).

## What the public evidence supports for launch

The physics lab requires all of these:
- Mean, SD and SEM, and error propagation.
- Unweighted and weighted linear fits with slope and intercept uncertainties, plus χ²/DoF.
- Error bars, log axes, and histograms with a normal curve.
- A Poisson or Gauss χ² goodness-of-fit test.
- A weighted mean, and rounding to the uncertainty.
