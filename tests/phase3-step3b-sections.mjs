// Phase 3 step 3 (part B): the sections from "Formelspalte" on in English. Every section is run in English with the hand values of its German test
// (tests/phase2-step*), the number format is English (decimal point, no thousands separator), the HU result format (value ± u) unit is unchanged.
// Hand values (written in the German tests, not read from the app): burette sample mean 10,110, s(n-1) 0,0258, sem 0,00816, t(0,975; 9) = 2,262 (table);
// 30 readings, 6 classes of 0,2 from 9,5; counts of 40 decays, Poisson chi2 3,99 with 8 degrees of freedom; calibration x0 = 5,19 ± 0,21 %; comparison 0,4 and 2,4 combined uncertainties.
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { serve } from "./serve.mjs";
import { chromium } from "./tools.mjs";
let bad = 0;
let last = Date.now();
const eq = (name, got, want) => { if (Date.now() - last > 4000) console.log(`slow step before "${name}": ${((Date.now() - last) / 1000).toFixed(1)} s`); last = Date.now(); got = JSON.stringify(got); want = JSON.stringify(want); if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; } };
const yes = (name, v) => eq(name, !!v, true);

const { base, close } = await serve();
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1280, height: 900 }, locale: "en-US" })).newPage();
const errors = [];
p.on("pageerror", e => errors.push(String(e)));
const lines = () => p.$$eval("#results .res", e => e.map(x => x.textContent));
const text = sel => p.textContent(sel);
const vis = async sel => (await p.isVisible(sel)) ? await p.textContent(sel) : null;
const stale = () => p.$$eval(".stalemsg", e => e.length);
const paste = async t => { await p.fill("#paste", t); await p.click("#pastego"); };
const ready = () => p.waitForFunction(() => !document.getElementById("fit").disabled, null, { timeout: 120000 });
const idle = id => p.waitForFunction(i => !document.getElementById(i).disabled, id);
const pl = (id, f) => p.evaluate(`(${f})(document.getElementById(${JSON.stringify(id)}))`);   // f is a constant function text written in this file
await p.goto(base + "app/index.html?start=leer");
await p.evaluate(() => localStorage.clear());
await p.reload();
await p.waitForFunction(() => document.getElementById("fitstate").dataset.i18n === "fs_ready", null, { timeout: 120000 });   // no project yet, so the fit button stays off
await p.click("#lang_en");

console.log("section 0");
// 0. Headings, labels and placeholders of the translated sections are English.
// Phase 4 step 2: the page order changed (table beside the plot, fit bar inside "Results", the tools in a "Tools" menu, "Paste data" is a tool, the log axis and the figure export are tools of their own); every heading is still English.
eq("section headings", await p.$$eval("h2", e => e.map(x => x.textContent)), ["Plot", "Table", "Results", "Tools", "Paste data", "Formula column", "Mean and spread of a column", "Frequency table and histogram",
  "Cumulative frequency with read-off at 16 % and 84 %", "χ² test: Poisson and Gaussian distribution (count rates)", "Weighted mean and overlap of several results", "Several series in one plot",
  "Derived quantity from the fit parameters", "Calibration line: read off an unknown", "Compare a measured value with a reference value", "Logarithmic y axis", "Save plot"]);
eq("placeholders and button texts", await p.evaluate(() => [$("f_unc").placeholder, $("h_w").placeholder, $("d_vars").placeholder, $("c_y0").placeholder, $("k_meas").placeholder, $("f_add").textContent, $("s_go").textContent, $("c_go").textContent, $("k_go").textContent, $("sr_go").textContent]),
  ["D = sD; c = 0.01", "automatic", "L = 1 ± 0.002; d = 0.5 ± 0.01", "1.3405 ± 0.0003; 1.3372 ± 0.0002", "100.2 ± 0.3", "Calculate column", "Calculate", "Read off x₀", "Compare", "Fit series"]);
eq("labels of the stats bar", await p.$$eval("#stats label > span", e => e.map(x => x.textContent)), ["Column", "Standard deviation with", "Instrument error (optional)", "Confidence interval"]);

console.log("section 1");
// 1. Formula column with uncertainties: r² = (D/2)², u = (D/2)·sD, hand values 1; 4 and 0.1; 0.4.
await paste("D / mm;sD / mm\n2;0.1\n4;0.2");
await p.fill("#f_name", "r² / mm²"); await p.fill("#f_expr", "(D/2)^2"); await p.fill("#f_unc", "D = sD");
await p.click("#f_add");
eq("formula columns, English number format", await p.$$eval("td.calc", e => e.map(x => x.textContent)), ["1", "0.1", "4", "0.4"]);
yes("propagation note in the header", (await p.$$eval("th .fx", e => e.map(x => x.textContent))).some(x => x.startsWith("Gaussian propagation of (D/2)^2")));
eq("remove button and role names", await p.$$eval("th button[data-delcol]", e => e.map(x => x.textContent)), ["Remove column", "Remove column"]);
await p.fill("#f_name", ""); await p.click("#f_add");
eq("no name", await text("#fmsg"), "Please enter a name for the new column, for example “r² / mm²”.");
await p.fill("#f_name", "D / mm"); await p.click("#f_add");
eq("name exists", await text("#fmsg"), "There is already a column “D / mm”. Please choose another name.");
await p.fill("#f_name", "q"); await p.fill("#f_expr", "zz+1"); await p.click("#f_add");
yes("unknown column: a message is shown, no column added", (await vis("#fmsg")) && (await p.$$eval("td.calc", e => e.length)) === 4);

console.log("section 2");
// 2. Mean and spread, instrument error and the confidence interval.
const V = [10.12, 10.08, 10.15, 10.10, 10.11, 10.09, 10.14, 10.07, 10.13, 10.11];
await paste("V / mL\n" + V.join("\n"));
await p.click("#s_go");
eq("stats lines", await lines(), ["Mean x̄ = (10.110 ± 0.008) mL", "Standard deviation s (divisor n−1) = 0.0258 mL", "Standard error of the mean s/√n = 0.00816 mL"]);
eq("stats detail", await text("#results .detail"), "Column “V / mL”, n = 10 values. Standard deviation with divisor n−1. Mean ± standard error s/√n (s with n−1).");
await p.selectOption("#s_ddof", "0");
eq("stale note in English", await text(".stalemsg"), "The data have changed. This result is out of date. Please recalculate.");
await p.fill("#s_instr", "0.02"); await p.selectOption("#s_conf", "0.95");
await p.click("#s_go");
eq("stats lines, instrument error and 95 % interval", await lines(), ["Mean x̄ = (10.110 ± 0.008) mL", "Standard deviation σ (divisor n) = 0.0245 mL", "Standard error of the mean s/√n = 0.00816 mL",
  "Mean x̄ with instrument error = (10.110 ± 0.022) mL", "Mean x̄ with 95 % confidence interval = (10.110 ± 0.018) mL"]);
eq("stats detail with instrument error", await text("#results [data-how]"), "Column “V / mL”, n = 10 values. Standard deviation with divisor n. Mean ± standard error s/√n (s with n−1). With instrument error 0.02: u = √(urandom² + uinstrument²).");
eq("confidence interval detail", await text("#results [data-ci]"), "95 % confidence interval: x̄ ± t·s/√n with t(0.975; 9) = 2.262 (two-sided, Student distribution, 9 degrees of freedom). Interval: [10.092; 10.128] mL.");
eq("stored names stay German in the project file", await p.evaluate(() => proj.results[0].params.map(q => q.name).slice(0, 2)), ["Mittelwert x̄", "Standardabweichung σ (Teiler n)"]);
await p.click("#lang_de");
eq("same result in German", (await lines()).slice(0, 2).concat((await lines()).slice(3)), ["Mittelwert x̄ = (10,110 ± 0,008) mL", "Standardabweichung σ (Teiler n) = 0,0245 mL", "Mittelwert x̄ mit Gerätefehler = (10,110 ± 0,022) mL", "Mittelwert x̄ mit 95 %-Vertrauensintervall = (10,110 ± 0,018) mL"]);
eq("German detail from the same result", (await text("#results [data-ci]")).startsWith("95 %-Vertrauensintervall: x̄ ± t·s/√n mit t(0,975; 9) = 2,262 (zweiseitig, Student-Verteilung, 9 Freiheitsgrade)."), true);
await p.click("#lang_en");
await paste("a;b\n1;\n2;5"); await p.selectOption("#s_col", "b"); await p.click("#s_go");
eq("one value", await text("#statsmsg"), "The column “b” has 1 value. Mean and spread need at least two values.");
await p.selectOption("#s_col", "a"); await p.fill("#s_instr", "-1"); await p.click("#s_go");
eq("negative instrument error", await text("#statsmsg"), "The instrument error must not be negative.");
await p.fill("#s_instr", "abc"); await p.click("#s_go");
eq("instrument error not a number", await text("#statsmsg"), "The instrument error is not a number.");

console.log("section 3");
// 3. Weighted mean and overlap (hand values 10.02 ± 0.09 cm³, gaps 0.1 and 0.2).
await paste("Method;V / cm³;u / cm³\n1;10.3;0.2\n2;10.5;0.3\n3;9.9;0.1");
await p.click("#w_go");
const KOK = "Overlap of the intervals x ± 1·u: The results do not agree: row 1 and row 3 (gap 0.1 cm³); row 2 and row 3 (gap 0.2 cm³). The weighted mean should then be read with caution.";
eq("wmean line", await lines(), ["Weighted mean = (10.02 ± 0.09) cm³"]);
eq("wmean verdict k=1", await text("#results [data-verdict]"), KOK);
eq("wmean detail", await text("#results [data-how]"), "Results “V / cm³” with uncertainties “u / cm³”, n = 3 rows. Weights w = 1/u², mean Σ(w·x)/Σw, uncertainty 1/√Σw.");
await p.click("#lang_de");
eq("wmean verdict in German from the stored key", await text("#results [data-verdict]"), "Überlappung der Intervalle x ± 1·u: Die Ergebnisse stimmen nicht überein: Zeile 1 und Zeile 3 (Lücke 0,1 cm³); Zeile 2 und Zeile 3 (Lücke 0,2 cm³). Der gewichtete Mittelwert ist dann mit Vorsicht zu lesen.");
eq("stored verdict is German", await p.evaluate(() => proj.results[0].verdict.startsWith("Die Ergebnisse stimmen nicht überein: Zeile 1 und Zeile 3")), true);
await p.click("#lang_en");
await p.fill("#w_k", "2"); await p.click("#w_go");
eq("wmean verdict k=2", await text("#results [data-verdict]"), "Overlap of the intervals x ± 2·u: All intervals have a common range. The results agree within their uncertainties.");
await p.fill("#w_k", "0");
await p.click("#w_go");
eq("k not above 0", await text("#wmsg"), "The factor k must be a number above 0.");
await p.fill("#w_k", "1"); await p.selectOption("#w_unc", "V / cm³"); await p.click("#w_go");
eq("same column twice", await text("#wmsg"), "Results and uncertainties must be different columns.");
eq("(none) option", await p.$$eval("#w_unc option", e => e[0].textContent), "(none)");

console.log("section 4");
// 4. Histogram, frequency table and cumulative plot with the 30 readings of the German test.
const L = "9.5 9.6 9.7 9.7 9.8 9.8 9.8 9.9 9.9 9.9 10.0 10.0 10.0 10.0 10.05 10.05 10.1 10.1 10.1 10.2 10.2 10.2 10.2 10.2 10.3 10.3 10.4 10.4 10.5 10.6".split(" ");
await paste("l / mm\n" + L.join("\n"));
await p.fill("#h_w", "0.2"); await p.fill("#h_s", "9.5"); await p.click("#h_go");
eq("frequency table", await p.$$eval("#results table[data-freq] tr", e => e.map(r => [...r.cells].map(c => c.textContent))), [
  ["Class / mm", "absolute", "relative", "cumulative absolute", "cumulative relative"],
  ["9.5 to below 9.7", "2", "6.7 %", "2", "6.7 %"], ["9.7 to below 9.9", "5", "16.7 %", "7", "23.3 %"], ["9.9 to below 10.1", "9", "30.0 %", "16", "53.3 %"],
  ["10.1 to below 10.3", "8", "26.7 %", "24", "80.0 %"], ["10.3 to below 10.5", "4", "13.3 %", "28", "93.3 %"], ["10.5 to below 10.7", "2", "6.7 %", "30", "100.0 %"]]);
eq("hist lines", await lines(), ["Mean x̄ = (10.05 ± 0.05) mm", "Standard deviation s (divisor n−1) = 0.263 mm"]);
eq("hist detail", await text("#results [data-how]"), "Column “l / mm”, n = 30 values, 6 classes of width 0.2, start 9.5. Normal distribution with x̄ and s (divisor n−1): expected count per class = n·class width·φ(x).");
eq("hist plot names and axis titles", await pl("histplot", "d => [d.data.map(t => t.name), d.layout.xaxis.title.text, d.layout.yaxis.title.text, d.layout.separators]"), [["Data (count per class)", "Normal distribution (x̄, s)"], "l / mm", "Number of measurements", ".,"]);
eq("cumulative read-off", await text("#results [data-readoff]"), "Read-off in the cumulative frequency: x at 16 % = 9.812 mm, x at 84 % = 10.36 mm; half the difference = 0.274 mm. For comparison: x̄ − s = 9.787 mm, x̄ + s = 10.31 mm.");
eq("cumulative plot names and axis", await pl("cumplot", "d => [d.data.map(t => t.name), d.layout.yaxis.title.text]"), [["Cumulative relative frequency", "Read-off at 16 % and 84 %"], "Cumulative frequency / %"]);
await p.selectOption("#h_ddof", "0");
eq("stale: both plots are replaced by a note", [await text("#histplot .empty"), await text("#cumplot .empty")], ["The histogram is out of date. Please recalculate.", "The cumulative frequency is out of date. Please recalculate the histogram."]);
await p.fill("#h_w", ""); await p.fill("#h_s", ""); await p.click("#h_go");
yes("automatic classes are named", (await text("#results [data-how]")).includes("classes of width 0.2 (automatic), start 9.4 (automatic)."));
await p.fill("#h_w", "0"); await p.click("#h_go");
eq("width 0", await text("#hmsg"), "The class width must be a number above 0 (or empty for automatic).");
await p.fill("#h_w", "0.001"); await p.fill("#h_s", "9.5"); await p.click("#h_go");
eq("too many classes, no thousands separator", await text("#hmsg"), "With class width 0.001 there would be 1101 classes. That is too many (at most 100). Please choose a larger class width.");
await p.fill("#h_w", "0.2"); await p.fill("#h_s", "10"); await p.click("#h_go");
eq("start above minimum", await text("#hmsg"), "The start 10 is above the smallest value 9.5. Please choose a start that is less than or equal to the smallest value.");
await p.fill("#h_s", "x"); await p.click("#h_go");
eq("start not a number", await text("#hmsg"), "The start of the first class is not a number (or empty for automatic).");
await p.screenshot({ path: "evidence/phase3-step3b-hist.png", fullPage: true });

console.log("section 5");
// 5. Chi-square test against Poisson and Gaussian (needs the worker): 40 counts of the German test, classes of width 1 from 3.
const A = [4, 7, 9, 6, 8, 5, 10, 7, 6, 8, 9, 3, 7, 11, 6, 8, 7, 5, 9, 6, 8, 10, 4, 7, 6, 12, 7, 5, 8, 9, 6, 7, 8, 3, 9, 7, 10, 6, 5, 8];
await paste("N\n" + A.join("\n")); await ready();
await p.fill("#g_w", "0"); await p.click("#g_go");
eq("class width 0", await text("#gofmsg"), "The class width must be a whole number from 1 (or empty for automatic).");
await p.fill("#g_w", "1"); await p.fill("#g_s", "3"); await p.click("#g_go"); await idle("g_go");
eq("chi-square lines", await lines(), ["Mean x̄ (= λ of the Poisson distribution) = (7.2 ± 0.3)", "Poisson: χ² = 3.99 with 8 degrees of freedom, p = 0.858", "Gaussian: χ² = 0.549 with 7 degrees of freedom, p = 0.999"]);
const gt = await p.$$eval("#results table[data-gof] tr", e => e.map(r => [...r.cells].map(c => c.textContent)));
eq("chi-square table head", gt[0], ["Class (count)", "observed", "expected Poisson", "expected Gaussian"]);
eq("chi-square rows", [gt[1].slice(0, 2), gt[2].slice(0, 2), gt[10].slice(0, 2)], [["≤ 3", "2"], ["4", "2"], ["≥ 12", "1"]]);
eq("chi-square expected counts, 2 decimals with a point", [gt[1][2], gt[1][3], gt[5][2], gt[5][3]], ["2.97 *", "1.56 *", "5.95", "7.62"]);
eq("warnings", await p.$$eval("#results [data-warn]", e => e.map(x => x.textContent)), [
  "Warning Poisson: in classes 1, 2, 3, 7, 8, 9, 10 the expected count is below 5 (marked with *). The χ² test is then inaccurate. Choose wider classes or merge classes.",
  "Warning Gaussian: in classes 1, 2, 3, 8, 9, 10 the expected count is below 5 (marked with *). The χ² test is then inaccurate. Choose wider classes or merge classes."]);
const how = (await p.$$eval("#results [data-how]", e => e.map(x => x.textContent))).find(x => x.includes("Poisson with"));
eq("method named", [how.includes("Poisson with λ = x̄ = 7.15 (1 estimated parameter: degrees of freedom = classes − 1 − 1)"), how.includes("Gaussian with x̄ and s = 2.07 (divisor n−1; 2 estimated parameters: degrees of freedom = classes − 1 − 2)"), how.includes("continuity correction −0.5"), how.includes("10 classes of width 1, start 3.")], [true, true, true, true]);
eq("chi-square plot names and axes", await pl("gofplot", "d => [d.data.map(t => t.name), d.layout.xaxis.title.text, d.layout.yaxis.title.text]"), [["Data (number of intervals)", "Expected Poisson", "Expected Gaussian"], "N (count per interval)", "Number of intervals"]);
eq("p below 0.001 in both languages", await p.evaluate(() => [gofP(0.0004, "en"), gofP(0.0004, "de"), gofP(0.04321, "en"), gofP(0.04321, "de")]), ["p < 0.001", "p < 0,001", "p = 0.043", "p = 0,043"]);
await p.click("#lang_de");
eq("same result in German, from the raw numbers", await lines(), ["Mittelwert x̄ (= λ der Poisson-Verteilung) = (7,2 ± 0,3)", "Poisson: χ² = 3,99 bei 8 Freiheitsgraden, p = 0,858", "Gauß: χ² = 0,549 bei 7 Freiheitsgraden, p = 0,999"]);
await p.click("#lang_en");
await p.fill('#table input[data-r="0"][data-c="0"]', "5");
eq("data edit: chi-square note", await text("#gofplot .empty"), "The χ² test is out of date. Please recalculate.");
await p.screenshot({ path: "evidence/phase3-step3b-gof.png", fullPage: true });

console.log("section 6");
// 6. First visit example (P3): derived quantity E and two series, all run by the page itself.
await p.evaluate(() => localStorage.removeItem("plotlab-autosave"));
await p.goto(base + "app/index.html");   // without ?start=leer, so the page opens its finished example
await p.waitForFunction(() => /E = \(201 ± 8\) GPa/.test(document.getElementById("introres").textContent), null, { timeout: 120000 });
eq("example: English first-visit note and E", [(await text("#intro span")).startsWith("This is a finished example (P3 elasticity, invented data)"), await text("#introres")], [true, "E = (201 ± 8) GPa"]);
const lns = await lines();
eq("series result lines", lns.filter(l => l.startsWith("a (") || l.startsWith("b (")), ["a (ΔL auf) = (0.02529 ± 0.00029) mm/N", "b (ΔL auf) = (0.007 ± 0.011) mm", "a (ΔL ab) = (0.02502 ± 0.00020) mm/N", "b (ΔL ab) = (0.052 ± 0.006) mm"]);
eq("series table", await p.$$eval("#results table[data-series] tr", e => e.map(r => [...r.cells].map(c => c.textContent))), [["Series", "x range", "Points", "Method", "Quality"],
  ["ΔL auf / mm", "Beginning to End", "6", "weighted (error column “sΔL auf / mm”)", "χ²/DoF = 0.369"], ["ΔL ab / mm", "Beginning to End", "6", "weighted (error column “sΔL ab / mm”)", "χ²/DoF = 0.07691"]]);
eq("series comparison", await p.$$eval("#results [data-compare]", e => e.map(x => x.textContent)), ["Slopes: a (ΔL auf) − a (ΔL ab) = (0.0003 ± 0.0004) mm/N. That is 0.7596 combined uncertainties. The slopes agree within their uncertainties (below 2)."]);
eq("series method text", await p.$$eval("#results [data-how]", e => e.map(x => x.textContent).filter(x => x.startsWith("Each series"))), ["Each series: straight line y = a·x + b, weighted series with weights 1/s²; the errors of a and b are scaled with √(χ²/DoF) (unweighted series: from the scatter of the points)."]);
eq("series rows in the settings", await p.$$eval("#sr_rows strong, #sr_rows label", e => e.slice(0, 5).map(x => x.firstChild.textContent.trim())), ["Series 1", "y", "Error", "x from", "x to"]);
eq("series input placeholders", await p.$$eval("#sr_rows input", e => e.slice(0, 2).map(x => x.placeholder)), ["Beginning", "End"]);
const dd = await p.$$eval("#results [data-how]", e => e.map(x => x.textContent).find(x => x.startsWith("Calculation: E")));
yes("derived detail in English", dd && dd.includes("u(E)² = Σ (∂E/∂xᵢ)²·u(xᵢ)² (independent inputs). Inserted: ") && dd.includes("L = 1 ± 0.002") && dd.includes("Contributions to u(E)/|E|: ") && dd.includes("Errors of a and b: scaled or from the scatter."));
yes("derived detail uses the point as decimal separator", /a = 0\.02528\d*/.test(dd) && !/\d,\d/.test(dd));
await p.fill("#d_name", ""); await p.click("#derive");
eq("derived: no name", await text("#derivemsg"), "Please enter a name for the quantity, for example E.");
await p.fill("#d_name", "E"); await p.fill("#d_aunit", "cm/N"); await p.click("#derive");
eq("derived: unit mismatch", await text("#derivemsg"), "The formula expects a in cm/N, the fit gives a in mm/N. Please check the units of the x and y columns.");
await p.click("#sr_add");
eq("series: fifth series refused when four exist", await p.evaluate(() => { for (let i = 0; i < 4; i++) $("sr_add").click(); return $("srmsg").textContent; }), "At most 4 series are possible.");
await p.fill('#table input[data-r="0"][data-c="1"]', "0.27");
eq("fit and derived are out of date, English note", (await text(".stalemsg")).startsWith("The data have changed."), true);
await p.click("#derive");
eq("derived without a fresh fit", await text("#derivemsg"), "Please press “Fit” first. The result of the line fit is missing or out of date.");
await p.screenshot({ path: "evidence/phase3-step3b-series.png", fullPage: true });

console.log("section 7");
// 7. Calibration line: refractive index against mass fraction (hand values x0 = 5.19 ± 0.21 %, 2.89 ± 0.14 %, 11.11 ± 0.23 %).
await p.click("#example4");
await p.click("#c_go");
eq("calibration without a fit", await text("#calibmsg"), "Please press “Fit” first. The result of the line fit is missing or out of date.");
await p.click("#fit"); await idle("fit");
await p.fill("#c_y0", "1.3405 ± 0.0003; 1.3372 ± 0.0002; 1.3490 ± 0.0003"); await p.click("#c_go");
eq("calibration lines", (await lines()).slice(-3), ["x₀ (y₀ = 1.3405) = (5.19 ± 0.21) %", "x₀ (y₀ = 1.3372) = (2.89 ± 0.14) %", "x₀ (y₀ = 1.349) = (11.11 ± 0.23) %"]);
const calc = (await p.$$eval("#results [data-calibhow]", e => e.map(x => x.textContent)))[0];
yes("calibration numbers and method", calc.includes("a = 0.00143481, b = 1.33306, u(a) = 0.0000154167, u(b) = 0.0000666079, cov(a,b) = -7.606E-10") && calc.startsWith("Calculation: x₀ = (y₀ − b)/a with a = ") &&
  calc.endsWith("Method: weighted fit (weights 1/s²); a, b and their covariance scaled with χ²/DoF."));
const ro = await p.$$eval("#results [data-readoff]", e => e.map(x => x.textContent));
eq("calibration shares", ro[0].startsWith("y₀ = 1.3405 ± 0.0003: x₀ = 5.189 %. Shares of u(x₀)²: y₀ 97 %, a 7 %, b 5 %, covariance -8 %"), true);
eq("extrapolation warning for the third value only", ro.map(x => x.includes("Note: x₀ lies outside the calibrated range 0 to 10 % (extrapolation). The uncertainty there is larger than the calculation shows.")), [false, false, true]);
eq("calibration plot names", (await pl("plot", "d => d.data.map(t => t.name)")).filter(Boolean), ["Data", "Fit", "Read-off x₀ (± u)"]);
await p.click("#lang_de");
eq("calibration lines in German from the same result", (await lines()).slice(-3), ["x₀ (y₀ = 1,3405) = (5,19 ± 0,21) %", "x₀ (y₀ = 1,3372) = (2,89 ± 0,14) %", "x₀ (y₀ = 1,349) = (11,11 ± 0,23) %"]);
await p.click("#lang_en");
await p.screenshot({ path: "evidence/phase3-step3b-calib.png", fullPage: true });

console.log("section 8");
// 8. Comparison of a measured and a reference value.
await p.click("#example");
const enter = async (m, r, u) => { await p.fill("#k_meas", m); await p.fill("#k_ref", r); await p.fill("#k_unit", u); await p.click("#k_go"); };
await enter("100.2 ± 0.3", "100.0 ± 0.4", "Ω");
eq("compare A lines", await lines(), ["Difference measured value − reference value = (0.2 ± 0.5) Ω", "Deviation in combined uncertainties = 0.4"]);
eq("compare A detail", await text("#results [data-how]"), "Measured value (100.2 ± 0.3) Ω, reference value (100.0 ± 0.4) Ω. Uncertainty of the difference √(u₁² + u₂²). Deviation from the reference value: 0.2 %.");
eq("compare A verdict", await text("#results [data-verdict]"), "The difference is 0.4 combined uncertainties (below 2). The measured value and the reference value agree within their uncertainties.");
await enter("30.0 ± 0.3", "31.2 ± 0.4", "µm");
eq("compare B lines", await lines(), ["Difference measured value − reference value = (-1.2 ± 0.5) µm", "Deviation in combined uncertainties = 2.4"]);
eq("compare B verdict", await text("#results [data-verdict]"), "The difference is 2.4 combined uncertainties (2 or more). The measured value and the reference value differ clearly. Check units, calculation and possible systematic errors.");
await p.click("#lang_de");
eq("compare B in German from the same result", [await lines(), await text("#results [data-verdict]"), (await text("#results [data-how]")).endsWith("Abweichung vom Vergleichswert: -3,85 %.")], [["Differenz Messwert − Vergleichswert = (-1,2 ± 0,5) µm", "Abweichung in kombinierten Unsicherheiten = 2,4"],
  "Der Unterschied beträgt 2,4 kombinierte Unsicherheiten (2 oder mehr). Messwert und Vergleichswert unterscheiden sich deutlich. Prüfe Einheiten, Rechnung und mögliche systematische Fehler.", true]);
eq("stored verdict and names are German in the file", await p.evaluate(() => { const r = proj.results.find(q => q.kind === "compare"); return [r.verdict.startsWith("Der Unterschied beträgt 2,4"), r.params[0].name]; }), [true, "Differenz Messwert − Vergleichswert"]);
await p.click("#lang_en");
await p.fill("#k_meas", "abc"); await p.click("#k_go");
yes("bad measured value: a message is shown and the result stays", (await vis("#comparemsg")) && (await lines()).length === 2);

console.log("section 9");
// 9. A project file from before this change (names and verdicts without keys) still shows its own text, escaped.
const old = await p.evaluate(() => { const q = JSON.parse(save(proj)); const r = q.results.find(x => x.kind === "compare"); delete r.vk; delete r.vv; r.verdict = "<img src=x onerror=window.pwn=1>"; r.params.forEach(x => { delete x.nk; x.name = "<b>alt</b>"; }); return JSON.stringify(q); });
await p.evaluate(txt => { const r = open(txt); setProject(r.project); }, old);
eq("old file: texts shown as text, nothing injected", [await p.$$eval("#results b, #results img", e => e.length), await text("#results [data-verdict]"), (await lines())[0].startsWith("<b>alt</b> = ")], [0, "<img src=x onerror=window.pwn=1>", true]);
eq("old file: no script ran", await p.evaluate(() => window.pwn), undefined);

console.log("section 10");
// 10. The static texts of the translated sections hold no German word any more (results, messages from the calculation files and the template box are not part of this check).
const german = await p.evaluate(() => [...document.querySelectorAll("h1, h2, .hint, label, button, th, .empty, option, p")].filter(e => !e.closest("#results, #tpl_info, #tpl_sel, #table, #sr_rows") && !e.querySelector("#tpl_sel")).map(e => e.textContent)
  .filter(s => /[äöüß]|\b(und|der|die|das|nicht|Bitte|Spalte|Zeile|Wert|Werte|Berechnen|Anpassen|Reihe)\b/.test(s)));
eq("no German left in the static texts", german, []);

eq("page errors", errors, []);
await b.close(); close();
console.log(bad ? `${bad} FAILED` : "all checks passed");
process.exit(bad ? 1 : 0);
