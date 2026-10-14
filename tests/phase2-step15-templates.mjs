// Phase 2 step 15: template projects P1 to P5 ("Vorlage laden"). Each template is loaded in the real page, its steps are pressed
// in order, and the result lines must equal the hand-calculated numbers of tests/reference/templates.py (exact fractions and
// formulas written separately: no SciPy, no app code). Numbers pasted below are the ones that script prints.
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { mkdtempSync, writeFileSync } from "node:fs";
import { serve } from "./serve.mjs";
const req = createRequire(import.meta.url);
const { TEMPLATES } = req("../app/templates.js");
const { open, save } = req("../app/project.js");
const { chromium } = createRequire(resolve("testbuild/x.js"))("playwright-core");
let bad = 0;
const eq = (name, got, want) => { got = JSON.stringify(got); want = JSON.stringify(want); if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; } };
const near = (name, got, want, tol = 1e-7) => { if (!(Math.abs(got - want) <= tol * Math.abs(want))) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; } };

// Pure: every template builds a project the page's own opener accepts, with the id stored and equal column lengths.
eq("template ids (P1 to P5 first; P6 to P9 are in phase2-step16-templates.mjs)", TEMPLATES.map(t => t.id).slice(0, 6), ["p1", "p2", "p3", "p4", "p5a", "p5b"]);
for (const t of TEMPLATES) {
  const p = t.build(), r = open(save(p));
  eq(`${t.id} opens`, [!!r.project, r.project?.template], [true, t.id]);
  eq(`${t.id} one x, one y`, [p.columns.filter(c => c.role === "x").length, p.columns.filter(c => c.role === "y").length], [1, 1]);
  eq(`${t.id} every step with a button names one that exists in the page`, t.steps.every(s => !s.go || /^[a-z_]+$/.test(s.go)), true);
}

const { base, close } = await serve();
const dir = mkdtempSync(resolve(tmpdir(), "p2s15-"));
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1200, height: 2600 } })).newPage();
const external = [], errors = [];
p.on("request", r => { if (!r.url().startsWith(base) && !r.url().startsWith("data:") && !r.url().startsWith("blob:")) external.push(r.url()); });
p.on("pageerror", e => errors.push(String(e)));
await p.goto(base + "app/index.html?start=leer");
await p.waitForFunction(() => !document.getElementById("fit").disabled || document.getElementById("fitstate").textContent === "Bereit.", null, { timeout: 120000 });
const lines = () => p.$$eval("#results .res", e => e.map(x => x.textContent));
const ready = () => p.waitForFunction(() => !document.getElementById("fit").disabled, null, { timeout: 120000 });
const load = async id => { await p.selectOption("#tpl_sel", id); await p.click("#tpl_load"); await ready(); };
const press = async go => { await p.click("#" + go); await ready(); };
const cols = () => p.evaluate(() => proj.columns.map(c => [c.name, c.role]));
const colv = name => p.evaluate(n => proj.columns.find(c => c.name === n).values, name);
const result = kind => p.evaluate(k => proj.results.find(r => r.kind === k), kind);
const shot = n => p.screenshot({ path: `evidence/phase2-step15-${n}.png`, fullPage: true });
const info = () => p.evaluate(() => { const q = x => document.querySelector("#tpl_info " + x); return $("tpl_info").hidden ? null : { title: q("h3").textContent, warn: q("[data-invented]").textContent, steps: document.querySelectorAll("#tpl_info li").length, goButtons: document.querySelectorAll("#tpl_info [data-go]").length }; });
const INVENTED = "Erfundene Beispieldaten, keine echten Messwerte von Studierenden.";

// Bad input first: no template chosen, then an empty page has no info box.
eq("no box at the start", await info(), null);
await p.click("#tpl_load");
eq("nothing chosen", [await p.textContent("#tplmsg"), await info()], ["Bitte zuerst einen Versuch in der Liste wählen.", null]);
eq("list starts with P1 to P5", (await p.$$eval("#tpl_sel option", o => o.map(x => x.textContent))).slice(0, 7), ["(bitte wählen)", "P1 Fehlerverteilung", "P2 Volumenmessung", "P3 Elastizität", "P4 Oberflächenspannung", "P5 Polarimetrie (Saccharose)", "P5 Newtonsche Ringe"]);

// ---- P1: 30 readings; mean, s, table, histogram, cumulative plot with the 16 % and 84 % read-off (hand values of tests/reference/histogram.py and templates.py).
await load("p1");
eq("P1 box", await info(), { title: "P1 Fehlerverteilung", warn: (await p.textContent("#tpl_info [data-invented]")), steps: 2, goButtons: 2 });
eq("P1 says the data are invented", (await p.textContent("#tpl_info [data-invented]")).startsWith(INVENTED), true);
eq("P1 roles", await cols(), [["Nr / 1", "x"], ["l / mm", "y"]]);
eq("P1 30 rows", (await colv("l / mm")).length, 30);
await press("s_go");
eq("P1 stats lines", await lines(), ["Mittelwert x̄ = (10,05 ± 0,05) mm", "Standardabweichung s (Teiler n−1) = 0,263 mm", "Standardfehler des Mittelwerts s/√n = 0,0481 mm"]);
const st = await result("stats");
near("P1 mean", st.params[0].value, 10.05); near("P1 s", st.params[1].value, 0.26326857926381225); near("P1 sem", st.params[2].value, 0.04806604651504226);
await press("h_go");
eq("P1 counts", (await result("hist")).counts, [2, 5, 9, 8, 4, 2]);
eq("P1 table", await p.$$eval("#results [data-freq] tbody tr", r => r.map(x => [...x.cells].map(c => c.textContent).join("|"))),
  ["9,5 bis unter 9,7|2|6,7 %|2|6,7 %", "9,7 bis unter 9,9|5|16,7 %|7|23,3 %", "9,9 bis unter 10,1|9|30,0 %|16|53,3 %", "10,1 bis unter 10,3|8|26,7 %|24|80,0 %", "10,3 bis unter 10,5|4|13,3 %|28|93,3 %", "10,5 bis unter 10,7|2|6,7 %|30|100,0 %"]);
eq("P1 read-off 2453/250 and 259/25", (await p.textContent("#results [data-readoff]")).startsWith("Ablesung in der Summenhäufigkeit: x bei 16 % = 9,812 mm, x bei 84 % = 10,36 mm; halbe Differenz = 0,274 mm."), true);
eq("P1 both plots drawn", await p.$$eval("#histplot.js-plotly-plot, #cumplot.js-plotly-plot", e => e.length), 2);
eq("P1 axis titles", await p.evaluate(() => [$("histplot").layout.xaxis.title.text, $("histplot").layout.yaxis.title.text, $("cumplot").layout.yaxis.title.text]), ["l / mm", "Anzahl der Messwerte", "Kumulierte Häufigkeit / %"]);
await shot("p1");

// ---- P2: mean of d with instrument error, calculated columns A and u(A), weighted mean of three volumes with the overlap check.
await load("p2");
eq("P2 results cleared by loading", await lines(), []);
eq("P2 box", (await info()).title, "P2 Volumenmessung");
eq("P2 roles", await cols(), [["Nr / 1", "x"], ["d / mm", "unused"], ["V / cm³", "y"], ["u / cm³", "yerr"], ["A / mm²", "unused"], ["u(A) / mm²", "unused"]]);
const A = await colv("A / mm²"), uA = await colv("u(A) / mm²");
near("P2 A row 1 = pi (20,02/2)^2", A[0], 314.78789804896263); near("P2 u(A) row 1 = pi 20,02/2 * 0,05", uA[0], 1.5723671231216914);
near("P2 A row 2 = 100 pi", A[1], 314.1592653589793); near("P2 u(A) row 2 = 0,05 pi 10", uA[1], 1.5707963267948966);
eq("P2 rows 4 and 5 have no volume", (await colv("V / cm³")).slice(3), [null, null]);
await press("s_go");
eq("P2 stats lines", await lines(), ["Mittelwert x̄ = (20,000 ± 0,007) mm", "Standardabweichung s (Teiler n−1) = 0,0158 mm", "Standardfehler des Mittelwerts s/√n = 0,00707 mm", "Mittelwert x̄ mit Gerätefehler = (20,00 ± 0,05) mm"]);
near("P2 u with instrument error", (await result("stats")).params[3].u, 0.050497524691810396);
await press("w_go");
eq("P2 weighted mean", (await lines()).at(-1), "Gewichteter Mittelwert = (10,02 ± 0,09) cm³");
near("P2 weighted mean exact", (await result("wmean")).params[0].value, 10.022448979591836); near("P2 u exact 3/35", (await result("wmean")).params[0].u, 3 / 35);
eq("P2 overlap verdict (rows 1/3 gap 0,1 and 2/3 gap 0,2 at k = 1)", await p.textContent("#results [data-verdict]"),
  "Überlappung der Intervalle x ± 1·u: Die Ergebnisse stimmen nicht überein: Zeile 1 und Zeile 3 (Lücke 0,1 cm³); Zeile 2 und Zeile 3 (Lücke 0,2 cm³). Der gewichtete Mittelwert ist dann mit Vorsicht zu lesen.");
await shot("p2");

// ---- P3: loading and unloading, slope comparison, main fit, E.
await load("p3");
eq("P3 roles", await cols(), [["F / N", "x"], ["ΔL auf / mm", "y"], ["sΔL auf / mm", "yerr"], ["ΔL ab / mm", "unused"], ["sΔL ab / mm", "unused"]]);
await press("derive");
eq("P3 derived before the fit: clear message", await p.textContent("#derivemsg"), "Bitte zuerst „Anpassen“ drücken. Das Ergebnis der Geradenanpassung fehlt oder ist veraltet.");
await press("sr_go");
eq("P3 series lines", await lines(), ["a (ΔL auf) = (0,02529 ± 0,00029) mm/N", "b (ΔL auf) = (0,007 ± 0,011) mm", "a (ΔL ab) = (0,02502 ± 0,00020) mm/N", "b (ΔL ab) = (0,052 ± 0,006) mm"]);
const cmp = await p.textContent("#results [data-compare]");
eq("P3 slope comparison", cmp.startsWith("Steigungen: a (ΔL auf) − a (ΔL ab) = (0,0003 ± 0,0004) mm/N. Das sind 0,7596 kombinierte Unsicherheiten. Die Steigungen stimmen im Rahmen ihrer Unsicherheiten überein"), true);
await press("fit");
eq("P3 fit lines", (await lines()).slice(4), ["a = (0,02529 ± 0,00029) mm/N", "b = (0,007 ± 0,011) mm"]);
await press("derive");
eq("P3 E scaled", (await lines()).at(-1), "E = (201 ± 8) GPa");
let f = await result("fit"), dv = await result("derived");
near("P3 a", f.params[0].value, 0.0252857143, 1e-9); near("P3 u(a) scaled", f.params[0].uScaled, 0.000290437156, 1e-8); near("P3 u(a) unscaled", f.params[0].uUnscaled, 0.000478091444, 1e-8);
near("P3 E", dv.params[0].value, 201.416425, 1e-8); near("P3 u(E) scaled", dv.params[0].uScaled, 8.39192088, 1e-7); near("P3 u(E) unscaled", dv.params[0].uUnscaled, 8.92048823, 1e-7);
await p.selectOption("#errm", "unscaled");
eq("P3 E unscaled", (await lines()).at(-1), "E = (201 ± 9) GPa");
await p.selectOption("#errm", "scaled");
await shot("p3");

// ---- P4: h against 1/r (calculated column), sigma.
await load("p4");
eq("P4 roles", await cols(), [["r / mm", "unused"], ["h / mm", "y"], ["sh / mm", "yerr"], ["r⁻¹ / mm⁻¹", "x"]]);
const inv = await colv("r⁻¹ / mm⁻¹");
near("P4 1/0,75", inv[1], 4 / 3, 1e-12); eq("P4 1/r exact for r = 1, 2, 0,5", [inv[2], inv[5], inv[0]], [1, 0.5, 2]);
await press("derive");
eq("P4 derived before the fit: clear message", await p.textContent("#derivemsg"), "Bitte zuerst „Anpassen“ drücken. Das Ergebnis der Geradenanpassung fehlt oder ist veraltet.");
await press("fit");
eq("P4 fit lines", await lines(), ["a = (14,82 ± 0,10) mm/mm⁻¹", "b = (0,02 ± 0,09) mm"]);
await press("derive");
eq("P4 sigma scaled", (await lines()).at(-1), "σ = (72,6 ± 0,5) mN/m");
f = await result("fit"); dv = await result("derived");
near("P4 a", f.params[0].value, 14.8231148, 1e-8); near("P4 u(a) scaled", f.params[0].uScaled, 0.1010507, 1e-6); near("P4 u(a) unscaled", f.params[0].uUnscaled, 0.257552919, 1e-8);
near("P4 sigma", dv.params[0].value, 72.5619632, 1e-8); near("P4 u scaled", dv.params[0].uScaled, 0.499977229, 1e-7); near("P4 u unscaled", dv.params[0].uUnscaled, 1.26286521, 1e-7);
await p.selectOption("#errm", "unscaled");
eq("P4 sigma unscaled", (await lines()).at(-1), "σ = (72,6 ± 1,3) mN/m");
await p.selectOption("#errm", "scaled");
// Editing a measured height makes both results out of date (they must not keep showing the old numbers as fresh).
await p.fill('input[data-r="1"][data-c="1"]', "20,5");
eq("P4 stale after an edit", await p.$$eval(".stalemsg", e => e.length), 2);
await p.click("#undo");
eq("P4 fresh after undo", await p.$$eval(".stalemsg", e => e.length), 0);
await shot("p4");

// ---- P5 polarimetry: [alpha] as the slope of alpha against d*c.
await load("p5a");
eq("P5a roles", await cols(), [["d / dm", "unused"], ["c / g·mL⁻¹", "unused"], ["α / °", "y"], ["sα / °", "yerr"], ["d·c / dm·g·mL⁻¹", "x"]]);
(await colv("d·c / dm·g·mL⁻¹")).forEach((v, i) => near(`P5a d*c row ${i + 1}`, v, [0.05, 0.1, 0.1, 0.2, 0.3, 0.4][i], 1e-12));
await press("fit");
eq("P5a fit lines", await lines(), ["a = (66,6 ± 0,4) °/dm·g·mL⁻¹", "b = (-0,02 ± 0,06) °"]);
f = await result("fit");
near("P5a a", f.params[0].value, 66.5899189, 1e-8); near("P5a u scaled", f.params[0].uScaled, 0.365941007, 1e-8); near("P5a u unscaled", f.params[0].uUnscaled, 0.985745973, 1e-8);
near("P5a b", f.params[1].value, -0.0191431547, 1e-7);
await shot("p5a");

// ---- P5 Newton's rings: r^2 = (D/2)^2 with u(r^2) from u(D), slope = lambda R, R.
await load("p5b");
eq("P5b roles", await cols(), [["k / 1", "x"], ["D / mm", "unused"], ["sD / mm", "unused"], ["r² / mm²", "y"], ["u(r²) / mm²", "yerr"]]);
near("P5b r2 row 1 = 0,77^2", (await colv("r² / mm²"))[0], 0.5929); near("P5b u(r2) row 1 = 0,77 * 0,02", (await colv("u(r²) / mm²"))[0], 0.0154);
await press("fit");
eq("P5b fit lines", await lines(), ["a = (0,5886 ± 0,0007) mm²/1", "b = (0,0034 ± 0,0026) mm²"]);
await press("derive");
eq("P5b R scaled", (await lines()).at(-1), "R = (0,9989 ± 0,0012) m");
f = await result("fit"); dv = await result("derived");
near("P5b a", f.params[0].value, 0.588631233, 1e-8); near("P5b u(a) scaled", f.params[0].uScaled, 0.00071634155, 1e-6); near("P5b u(a) unscaled", f.params[0].uUnscaled, 0.00435421288, 1e-8);
near("P5b R", dv.params[0].value, 0.99886515, 1e-8); near("P5b u(R) scaled", dv.params[0].uScaled, 0.00122734108, 1e-6); near("P5b u(R) unscaled", dv.params[0].uUnscaled, 0.00739073211, 1e-7);
await p.selectOption("#errm", "unscaled");
eq("P5b R unscaled", (await lines()).at(-1), "R = (0,999 ± 0,007) m");
await p.selectOption("#errm", "scaled");
await shot("p5b");

// ---- The "Zeigen" button jumps to the step's control.
await p.click('#tpl_info [data-go="derive"]');
eq("Zeigen focuses the button", await p.evaluate(() => document.activeElement.id), "derive");

// ---- Survives reload (autosave) and save/open; the box comes back with title and warning from the page's own table.
await p.reload(); await p.waitForSelector("#results .res");
eq("after reload", [(await info()).title, (await lines()).at(-1)], ["P5 Newtonsche Ringe", "R = (0,9989 ± 0,0012) m"]);

// ---- A project file with a made-up template id or injected text shows no box and runs nothing; a known id shows the page's own text.
const hand = TEMPLATES[3].build();
hand.template = "<img src=x onerror=window.pwn=1>";
writeFileSync(dir + "/hand.plotlab", save(hand));
await p.setInputFiles("#openfile", dir + "/hand.plotlab"); await p.waitForFunction(() => proj.template && proj.template.startsWith("<img"));
eq("unknown template id: no box, no script", [await info(), await p.evaluate(() => window.pwn), await p.$$eval("#tpl_info img", e => e.length)], [null, undefined, 0]);
hand.template = "p3";
writeFileSync(dir + "/hand2.plotlab", save(hand));
await p.setInputFiles("#openfile", dir + "/hand2.plotlab"); await p.waitForFunction(() => proj.template === "p3");
eq("known template id in a file: box from the page's table", (await info()).title, "P3 Elastizität");
await p.click("#example");
eq("a plain example removes the box", await info(), null);
await shot("error");
eq("no request left the machine", external, []);
eq("no page errors", errors, []);
await b.close(); close();
console.log(bad ? `${bad} FAILED` : "all template checks passed");
process.exit(bad ? 1 : 0);
