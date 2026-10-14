// Phase 2 step 16: template projects P6 to P9 ("Vorlage laden"): Wheatstone bridge, grating, refractometer, radioactivity (counts and decay), pendulum.
// Each template is loaded in the real page, its steps are pressed in order, and the result lines must equal the hand-calculated numbers of
// tests/reference/templates2.py (exact fractions and hand-derived partial derivatives, written separately: no SciPy, no app code).
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { mkdtempSync } from "node:fs";
import { serve } from "./serve.mjs";
const req = createRequire(import.meta.url);
const { TEMPLATES } = req("../app/templates.js");
const { open, save, colUnit } = req("../app/project.js");
import { chromium } from "./tools.mjs";
let bad = 0;
const eq = (name, got, want) => { got = JSON.stringify(got); want = JSON.stringify(want); if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; } };
const near = (name, got, want, tol = 1e-7) => { if (!(Math.abs(got - want) <= tol * Math.abs(want))) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; } };

// Pure: ids, every template opens with the page's own opener; the unit of a column is everything after the first "/" (a bug found by P9: "gi / m/s²" gave "m").
eq("new template ids", TEMPLATES.map(t => t.id).slice(6), ["p6a", "p6b", "p7", "p8a", "p8b", "p9"]);
for (const t of TEMPLATES.slice(6)) { const r = open(save(t.build())); eq(`${t.id} opens`, [!!r.project, r.project?.template], [true, t.id]); }
eq("colUnit", ["gi / m/s²", "ΔL / mm", "Nr / 1", "ohne", "a / b / c", "x /"].map(colUnit), ["m/s²", "mm", "1", "", "b / c", ""]);

const { base, close } = await serve();
const dir = mkdtempSync(resolve(tmpdir(), "p2s16-"));
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1200, height: 2600 } })).newPage();
const external = [], errors = [];
p.on("request", r => { if (!r.url().startsWith(base) && !r.url().startsWith("data:") && !r.url().startsWith("blob:")) external.push(r.url()); });
p.on("pageerror", e => errors.push(String(e)));
await p.goto(base + "app/app.html");
await p.waitForFunction(() => !document.getElementById("fit").disabled || document.getElementById("fitstate").textContent === "Bereit.", null, { timeout: 120000 });
const lines = () => p.$$eval("#results .res", e => e.map(x => x.textContent));
const ready = () => p.waitForFunction(() => !document.getElementById("fit").disabled, null, { timeout: 120000 });
const load = async id => { await p.selectOption("#tpl_sel", id); await p.click("#tpl_load"); await ready(); };
const press = async go => { await p.click("#" + go); await ready(); };
const cols = () => p.evaluate(() => proj.columns.map(c => [c.name, c.role]));
const colv = name => p.evaluate(n => proj.columns.find(c => c.name === n).values, name);
const result = kind => p.evaluate(k => proj.results.find(r => r.kind === k), kind);
const text = sel => p.textContent(sel);
const shot = n => p.screenshot({ path: `evidence/phase2-step16-${n}.png`, fullPage: true });
const info = () => p.evaluate(() => { const q = x => document.querySelector("#tpl_info " + x); return $("tpl_info").hidden ? null : { title: q("h3").textContent, steps: document.querySelectorAll("#tpl_info li").length, goButtons: document.querySelectorAll("#tpl_info [data-go]").length }; });
const INVENTED = "Erfundene Beispieldaten, keine echten Messwerte von Studierenden.";
const msgOf = id => p.evaluate(i => { const e = document.getElementById(i); return e && !e.hidden ? e.textContent : null; }, id);

eq("list has all twelve", await p.$$eval("#tpl_sel option", o => o.map(x => x.textContent)), ["(bitte wählen)", "P1 Fehlerverteilung", "P2 Volumenmessung", "P3 Elastizität", "P4 Oberflächenspannung", "P5 Polarimetrie (Saccharose)", "P5 Newtonsche Ringe",
  "P6 Wheatstone-Brücke", "P6 Gitter", "P7 Refraktometer", "P8 Radioaktivität: Zählraten", "P8 Radioaktivität: Zerfallskurve", "P9 Pendel"]);
// Every "Zeigen" target of every template exists in the page, and every template says its data are invented.
for (const t of TEMPLATES) {
  await load(t.id);
  eq(`${t.id} box`, await info(), { title: t.title, steps: t.steps.length, goButtons: t.steps.filter(s => s.go).length });
  eq(`${t.id} invented`, (await text("#tpl_info [data-invented]")).startsWith(INVENTED), true);
  eq(`${t.id} every Zeigen target exists`, await p.evaluate(ids => ids.filter(i => !document.getElementById(i)), t.steps.filter(s => s.go).map(s => s.go)), []);
}

// ---- P6a Wheatstone: Rx = R1 R2 / R3 with u from the partial derivatives (relative errors in quadrature), weighted mean, comparison with the nominal value.
await load("p6a");
eq("P6a roles", await cols(), [["Nr / 1", "x"], ["R1 / Ω", "unused"], ["sR1 / Ω", "unused"], ["R2 / Ω", "unused"], ["sR2 / Ω", "unused"], ["R3 / Ω", "unused"], ["sR3 / Ω", "unused"], ["Rx / Ω", "y"], ["u(Rx) / Ω", "yerr"]]);
(await colv("Rx / Ω")).forEach((v, i) => near(`P6a Rx row ${i + 1}`, v, [220.0, 216.7487684729064, 220.9][i], 1e-12));
(await colv("u(Rx) / Ω")).forEach((v, i) => near(`P6a u(Rx) row ${i + 1}`, v, [1.4806154876341873, 1.8125135539236985, 1.7283287447705078][i], 1e-7));
await press("w_go");
eq("P6a weighted mean", await lines(), ["Gewichteter Mittelwert = (219,4 ± 1,0) Ω"]);
near("P6a mean exact", (await result("wmean")).params[0].value, 219.37154194280257); near("P6a u exact", (await result("wmean")).params[0].u, 0.9554957481559139);
eq("P6a overlap: only rows 2 and 3 are apart (gap 0,61 at k = 1)", (await text("#results [data-verdict]")), "Überlappung der Intervalle x ± 1·u: Die Ergebnisse stimmen nicht überein: Zeile 2 und Zeile 3 (Lücke 0,61 Ω). Der gewichtete Mittelwert ist dann mit Vorsicht zu lesen.");
await press("k_go");
eq("P6a comparison lines", (await lines()).slice(1), ["Differenz Messwert − Vergleichswert = (-0,6 ± 2,4) Ω", "Abweichung in kombinierten Unsicherheiten = 0,248"]);
const c6 = (await result("compare")).params[0]; near("P6a diff", c6.value, -0.6, 1e-9); near("P6a u", c6.u, 2.4166091947189146, 1e-9);
eq("P6a verdict and % deviation", [(await text("#results")).includes("Der Unterschied beträgt 0,248 kombinierte Unsicherheiten (unter 2). Messwert und Vergleichswert stimmen im Rahmen ihrer Unsicherheiten überein."), (await text("#results")).includes("Abweichung vom Vergleichswert: -0,273 %")], [true, true]);
await shot("p6a");
// bad input: a zero R3 shows the page's message and no number; undo brings everything back and the old result is out of date meanwhile.
await p.fill('input[data-r="0"][data-c="5"]', "0");
eq("P6a division by zero named", (await msgOf("fmsg")).includes("Division durch 0"), true);
eq("P6a weighted mean is out of date after the edit (the comparison depends on its typed values only)", await p.$$eval(".stalemsg", e => e.length), 1);
await p.click("#undo");
eq("P6a fine after undo", [await msgOf("fmsg"), await p.$$eval(".stalemsg", e => e.length)], [null, 0]);

// ---- P6b grating: lam = d x / (k sqrt(x^2 + L^2)), d = 1e6/300 nm; compared with 632,8 nm (exact).
await load("p6b");
(await colv("λ / nm")).forEach((v, i) => near(`P6b lam row ${i + 1}`, v, [633.2537193747453, 632.255468559073, 631.9564525515895][i], 1e-12));
(await colv("u(λ) / nm")).forEach((v, i) => near(`P6b u(lam) row ${i + 1}`, v, [3.3825026593065384, 1.7072565718799628, 1.0551567487038347][i], 1e-7));
await press("w_go");
eq("P6b weighted mean", await lines(), ["Gewichteter Mittelwert = (632,1 ± 0,9) nm"]);
near("P6b exact", (await result("wmean")).params[0].value, 632.1189999283512); near("P6b u", (await result("wmean")).params[0].u, 0.8675427052822898, 1e-7);
eq("P6b overlap", (await text("#results [data-verdict]")).startsWith("Überlappung der Intervalle x ± 1·u: Alle Intervalle haben einen gemeinsamen Bereich."), true);
await press("k_go");
eq("P6b comparison with an exact literature value", (await lines()).slice(1), ["Differenz Messwert − Vergleichswert = (-0,7 ± 0,9) nm", "Abweichung in kombinierten Unsicherheiten = 0,778"]);
eq("P6b % deviation", (await text("#results")).includes("Abweichung vom Vergleichswert: -0,111 %"), true);
await shot("p6b");

// ---- P7 refractometer: weighted calibration line and three unknowns including one outside the standards.
await load("p7");
eq("P7 roles", await cols(), [["w / %", "x"], ["n / 1", "y"], ["sn / 1", "yerr"]]);
await press("c_go");
eq("P7 read-off before the fit: clear message", await msgOf("calibmsg"), "Bitte zuerst „Anpassen“ drücken. Das Ergebnis der Geradenanpassung fehlt oder ist veraltet.");
await press("fit");
eq("P7 fit lines", await lines(), ["a = (0,001560 ± 0,000005) 1/%", "b = (1,33301 ± 0,00007) 1"]);
const f7 = await result("fit");
near("P7 a", f7.params[0].value, 0.0015598625954198473, 1e-9); near("P7 b", f7.params[1].value, 1.3330115776081426, 1e-9);
near("P7 u(a) scaled", f7.params[0].uScaled, 5.418408223806752e-06, 1e-7); near("P7 u(a) unscaled", f7.params[0].uUnscaled, 1.1954110730572084e-05, 1e-7);
near("P7 u(b) scaled", f7.params[1].uScaled, 6.790354764699799e-05, 1e-7);
await press("c_go");
eq("P7 read-off scaled", (await lines()).slice(2), ["x₀ (y₀ = 1,3505) = (11,21 ± 0,19) %", "x₀ (y₀ = 1,36) = (17,30 ± 0,20) %", "x₀ (y₀ = 1,378) = (28,84 ± 0,21) %"]);
const r7 = (await result("calib")).reads;
[11.211514682900845, 17.301794703650415, 28.84127263770202].forEach((v, i) => near(`P7 x0 ${i + 1}`, r7[i].x0, v, 1e-9));
[0.1944194666001854, 0.19616592744938133, 0.20549520246255362].forEach((v, i) => near(`P7 u(x0) scaled ${i + 1} (with the covariance term)`, r7[i].uScaled, v, 1e-7));
[0.20231684701504604, 0.2103623532949088, 0.24998245255238458].forEach((v, i) => near(`P7 u(x0) unscaled ${i + 1}`, r7[i].uUnscaled, v, 1e-7));
eq("P7 extrapolation warning on the third only", await p.$$eval("#results [data-readoff]", e => e.map(x => x.textContent.includes("Extrapolation"))), [false, false, true]);
await p.selectOption("#errm", "unscaled");
eq("P7 read-off unscaled", (await lines()).slice(2), ["x₀ (y₀ = 1,3505) = (11,21 ± 0,20) %", "x₀ (y₀ = 1,36) = (17,30 ± 0,21) %", "x₀ (y₀ = 1,378) = (28,84 ± 0,25) %"]);
await p.selectOption("#errm", "scaled");
eq("P7 calibration plot has the marker for x0", await p.evaluate(() => $("plot").data.length > 1), true);
await shot("p7");

// ---- P8a counts: chi-square against Poisson and Gauss (hand values: closed-form p, table-checked in the reference script).
await load("p8a");
await press("g_go");
const g8 = await result("gof");
eq("P8a observed counts", g8.counts, [3, 10, 18, 7, 2]);
near("P8a mean", g8.mean, 9.525); near("P8a s", g8.s, 2.9263392726171618);
[3.4931570996003174, 12.056865793805152, 14.422690877888733, 7.585486376842923, 2.441799851862876].forEach((v, i) => near(`P8a Poisson expected ${i + 1}`, g8.dists.poisson.expected[i], v, 1e-8));
[3.379910162428723, 11.142856810981783, 15.48250618178975, 8.21239529818088, 1.782331546618865].forEach((v, i) => near(`P8a Gauss expected ${i + 1}`, g8.dists.gauss.expected[i], v, 1e-8));
near("P8a Poisson chi2", g8.dists.poisson.chi2, 1.4329369296970422, 1e-8); near("P8a Poisson p", g8.dists.poisson.p, 0.6978326171292824, 1e-7); eq("P8a Poisson dof", g8.dists.poisson.dof, 3);
near("P8a Gauss chi2", g8.dists.gauss.chi2, 0.7748383424125725, 1e-8); near("P8a Gauss p", g8.dists.gauss.p, 0.6788064991445438, 1e-7); eq("P8a Gauss dof", g8.dists.gauss.dof, 2);
eq("P8a lines", await lines(), ["Mittelwert x̄ (= λ der Poisson-Verteilung) = (9,5 ± 0,5) 1", "Poisson: χ² = 1,43 bei 3 Freiheitsgraden, p = 0,698", "Gauß: χ² = 0,775 bei 2 Freiheitsgraden, p = 0,679"]);
eq("P8a warns about classes 1 and 5 (expected below 5) for both", (await p.$$eval("#results .msg, #results .detail", e => e.map(x => x.textContent))).filter(t => t.includes("In den Klassen 1, 5 ist die erwartete Anzahl kleiner als 5")).length, 2);
eq("P8a plot drawn", await p.$$eval("#gofplot.js-plotly-plot", e => e.length), 1);
await shot("p8a");

// ---- P8b decay: semi-log axis with y error bars sN = sqrt(N) of the invented counts.
await load("p8b");
eq("P8b roles", await cols(), [["t / min", "x"], ["N / 1", "y"], ["sN / 1", "yerr"]]);
const pl = await p.evaluate(() => { const d = $("plot").data[0]; return { type: $("plot").layout.yaxis.type, y: d.y, err: d.error_y.array, box: $("logy").checked, ytitle: $("plot").layout.yaxis.title.text, xtitle: $("plot").layout.xaxis.title.text }; });
eq("P8b semi-log, 8 points, error bars", [pl.type, pl.y, pl.err, pl.box, pl.ytitle, pl.xtitle], ["log", [1000, 766, 586, 449, 344, 263, 201, 154], [31.6, 27.7, 24.2, 21.2, 18.5, 16.2, 14.2, 12.4], true, "N / 1", "t / min"]);
const bars = await p.$$eval("#plot .errorbar", e => e.length); eq("P8b one error bar per point is drawn", bars, 8);
eq("P8b no message", await msgOf("plotmsg"), null);
// bad input on the log axis: a zero count gives the page's message instead of a broken plot
await p.fill('input[data-r="7"][data-c="1"]', "0");
eq("P8b zero on the log axis: message names the row, no plot left", [(await text("#plot")).trim(), await p.$$eval("#plot .errorbar", e => e.length)], ["Die logarithmische y-Achse braucht Werte größer als 0. In Spalte „N / 1“ steht ein Wert von 0 oder darunter: Zeile 8 (y = 0). Korrigiere die Werte oder schalte die logarithmische Achse aus.", 0]);
await p.click("#undo");
eq("P8b plot back after undo", [await msgOf("plotmsg"), await p.$$eval("#plot .errorbar", e => e.length)], [null, 8]);
await shot("p8b");

// ---- P9 pendulum: g_i per row (mean, s, 95 % interval, t(0,975; 4) = 2,776 from the table), slope of T^2 against l, g = 4 pi^2 / a.
await load("p9");
eq("P9 roles", await cols(), [["l / m", "x"], ["T / s", "unused"], ["sT / s", "unused"], ["T² / s²", "y"], ["u(T²) / s²", "yerr"], ["gi / m/s²", "unused"]]);
(await colv("gi / m/s²")).forEach((v, i) => near(`P9 g_i row ${i + 1}`, v, [9.770265229369743, 9.849636998086016, 9.78344486332633, 9.856975151676274, 9.781373962603189][i], 1e-12));
(await colv("u(T²) / s²")).forEach((v, i) => near(`P9 u(T2) row ${i + 1} = 2 T sT`, v, [0.01101, 0.01343, 0.01556, 0.02864, 0.04018][i], 1e-7));
await press("s_go");
eq("P9 mean lines with the unit m/s² (not cut at the slash)", await lines(), ["Mittelwert x̄ = (9,808 ± 0,019) m/s²", "Standardabweichung s (Teiler n−1) = 0,0414 m/s²", "Standardfehler des Mittelwerts s/√n = 0,0185 m/s²", "Mittelwert x̄ mit 95 %-Vertrauensintervall = (9,81 ± 0,05) m/s²"]);
const s9 = await result("stats"); near("P9 mean", s9.params[0].value, 9.80833924101231); near("P9 s", s9.params[1].value, 0.0414350189695981); near("P9 sem", s9.params[2].value, 0.018530303813002927);
eq("P9 interval [9,76; 9,86] with t = 2,776", (await text("#results")).includes("t(0,975; 4) = 2,776") && (await text("#results")).includes("Intervall: [9,76; 9,86] m/s²"), true);
await press("fit");
eq("P9 fit lines", (await lines()).slice(4), ["a = (4,017 ± 0,023) s²/m", "b = (0,004 ± 0,011) s²"]);
const f9 = await result("fit");
near("P9 a", f9.params[0].value, 4.016701056988455, 1e-9); near("P9 u(a) scaled", f9.params[0].uScaled, 0.023245954880473152, 1e-7); near("P9 u(a) unscaled", f9.params[0].uUnscaled, 0.04035242619099723, 1e-7);
near("P9 b", f9.params[1].value, 0.004276046799448349, 1e-7); near("P9 u(b) scaled", f9.params[1].uScaled, 0.011398603088335454, 1e-7);
await press("derive");
eq("P9 g scaled", (await lines()).at(-1), "g = (9,83 ± 0,06) m/s²");
const d9 = await result("derived"); near("P9 g", d9.params[0].value, 9.828567534462374, 1e-9); near("P9 u(g) scaled", d9.params[0].uScaled, 0.05688111567284413, 1e-7); near("P9 u(g) unscaled", d9.params[0].uUnscaled, 0.09873937352335167, 1e-7);
await p.selectOption("#errm", "unscaled");
eq("P9 g unscaled", (await lines()).at(-1), "g = (9,83 ± 0,10) m/s²");
await p.selectOption("#errm", "scaled");
await shot("p9");

// ---- Survives a reload; and a project saved from a template and opened again keeps its box.
await p.reload(); await p.waitForSelector("#results .res");
eq("after reload", [(await info()).title, (await lines()).at(-1)], ["P9 Pendel", "g = (9,83 ± 0,06) m/s²"]);
await p.click("#example");
eq("a plain example removes the box", await info(), null);
await shot("error");
eq("no request left the machine", external, []);
eq("no page errors", errors, []);
await b.close(); close();
console.log(bad ? `${bad} FAILED` : "all template checks passed (P6 to P9)");
process.exit(bad ? 1 : 0);
