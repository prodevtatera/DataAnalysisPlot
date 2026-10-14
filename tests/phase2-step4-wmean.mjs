// Phase 2 step 4: weighted mean with uncertainty and overlap check of several results (P2 volume).
// Three volume results V = 10,3 ± 0,2; 10,5 ± 0,3; 9,9 ± 0,1 cm³. Hand values (tests/reference/weighted_mean.py, exact fractions):
// w = 25; 11,111; 100, Σw = 136,111 = 1225/9, mean = 10,0224490, u = 1/√Σw = 3/35 = 0,0857143.
// Overlap, gap = |xi-xj| - k(ui+uj): k=1: rows 1/3 gap 0,1 and rows 2/3 gap 0,2 (no overlap); k=2: all gaps negative (overlap).
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { writeFileSync, readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
const req = createRequire(import.meta.url);
import { chromium } from "./tools.mjs";
const { weightedMean } = req("../app/stats.js");
const { newProject, save } = req("../app/project.js");
let bad = 0;
const eq = (name, got, want) => {
  got = JSON.stringify(got); want = JSON.stringify(want);
  if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; }
};
const near = (name, got, want, tol = 1e-9) => {
  if (!(Math.abs(got - want) <= tol * Math.abs(want))) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; }
};

// Pure function.
const x = [10.3, 10.5, 9.9], u = [0.2, 0.3, 0.1];
const d1 = weightedMean(x, u, 1), d2 = weightedMean(x, u, 2);
near("mean", d1.mean, 10.022448979591836); near("u", d1.u, 3 / 35); near("w sum", d1.w.reduce((a, v) => a + v, 0), 1225 / 9);
eq("k=1 overlap", d1.overlap, false); eq("k=1 pairs", d1.bad.map(b => [b.i, b.j]), [[1, 3], [2, 3]]);
near("gap 1-3", d1.bad[0].gap, 0.1, 1e-9); near("gap 2-3", d1.bad[1].gap, 0.2, 1e-9);
{ // touching intervals: hand gap = 0,3 - (0,2 + 0,1) = 0 exactly; floating point gives 7e-17, which must not count as a gap
  const t = weightedMean([10.3, 10.0], [0.2, 0.1], 1); eq("touching intervals overlap", [t.overlap, t.bad], [true, []]);
  const t2 = weightedMean([10.3, 10.0], [0.2, 0.0999], 1); eq("a real gap of 0,0001 is still found", t2.overlap, false);
}
eq("k=2 overlap", d2.overlap, true); eq("k=2 no pairs", d2.bad, []);
// Equal uncertainties: the weighted mean is the plain mean, u = u0/√n (5,0 and 5,05 with 0,1: mean 5,025, u 0,0707107).
const e = weightedMean([5, 5.05], [0.1, 0.1], 1);
near("equal u mean", e.mean, 5.025); near("equal u", e.u, 0.1 / Math.SQRT2);

// Real page.
const dir = mkdtempSync(resolve(tmpdir(), "p2s4-"));
const hand = newProject(["x / mL", "u / mL"], [[1, 0.1], [2, 0.1]]);
hand.settings.wmean = { val: "<img src=x onerror=window.pwn=1>", unc: "<img src=x onerror=window.pwn=2>", k: "<script>window.pwn=3</script>" };
hand.results.push({ kind: "wmean", inputs: { val: "<img src=x onerror=window.pwn=4>", unc: "<script>window.pwn=5</script>", k: "<img src=x onerror=window.pwn=6>" }, n: "<img src=x onerror=window.pwn=7>",
  verdict: "<img src=x onerror=window.pwn=8>", params: [{ name: "<img src=x onerror=window.pwn=9>", unit: "<script>window.pwn=10</script>", value: 1, u: 0.1 }], computedFrom: "x" });
writeFileSync(dir + "/hand.plotlab", save(hand));

const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1200, height: 2500 } })).newPage();
const external = [];
p.on("request", r => { if (!r.url().startsWith("file:")) external.push(r.url()); });
await p.goto(pathToFileURL(resolve("app/index.html")).href);
const lines = () => p.$$eval("#results .res", e => e.map(x => x.textContent));
const verdict = () => p.textContent("#results [data-verdict]");
const go = () => p.click("#w_go");
const msg = () => p.textContent("#wmsg");

await p.fill("#paste", "Methode;V / cm³;u / cm³\n1;10,3;0,2\n2;10,5;0,3\n3;9,9;0,1");
await p.click("#pastego");
// Defaults: the y column (second) holds the results, the error column (third) the uncertainties, k = 1.
eq("defaults", await p.evaluate(() => [$("w_val").value, $("w_unc").value, $("w_k").value]), ["V / cm³", "u / cm³", "1"]);
await go();
eq("result line", await lines(), ["Gewichteter Mittelwert = (10,02 ± 0,09) cm³"]);
eq("verdict k=1", await verdict(), "Überlappung der Intervalle x ± 1·u: Die Ergebnisse stimmen nicht überein: Zeile 1 und Zeile 3 (Lücke 0,1 cm³); Zeile 2 und Zeile 3 (Lücke 0,2 cm³). Der gewichtete Mittelwert ist dann mit Vorsicht zu lesen.");
eq("detail", await p.textContent("#results [data-how]"), "Ergebnisse „V / cm³“ mit Unsicherheiten „u / cm³“, n = 3 Zeilen. Gewichte w = 1/u², Mittelwert Σ(w·x)/Σw, Unsicherheit 1/√Σw.");

// Changing k makes the result out of date; with k = 2 the intervals overlap.
await p.fill("#w_k", "2");
eq("stale after k", await p.textContent(".stalemsg"), "Die Daten wurden geändert. Dieses Ergebnis ist veraltet. Bitte neu berechnen.");
await go();
eq("verdict k=2", await verdict(), "Überlappung der Intervalle x ± 2·u: Alle Intervalle haben einen gemeinsamen Bereich. Die Ergebnisse stimmen im Rahmen ihrer Unsicherheiten überein.");
eq("same mean for k=2", await lines(), ["Gewichteter Mittelwert = (10,02 ± 0,09) cm³"]);
await p.screenshot({ path: "evidence/phase2-step4-wmean.png", fullPage: true });

// Undo of the k edit brings back the old k and makes the k=2 result stale; a data edit does the same; reload and save/open keep it.
await p.fill('input[data-r="2"][data-c="1"]', "9,8");
eq("stale after edit", await p.$$eval(".stalemsg", e => e.length), 1);
await p.click("#undo");
eq("fresh after undo", await p.$$eval(".stalemsg", e => e.length), 0);
await p.reload(); await p.waitForSelector("#results .res");
eq("after reload", [await verdict(), await p.inputValue("#w_k")], ["Überlappung der Intervalle x ± 2·u: Alle Intervalle haben einen gemeinsamen Bereich. Die Ergebnisse stimmen im Rahmen ihrer Unsicherheiten überein.", "2"]);
const [dl] = await Promise.all([p.waitForEvent("download"), p.click("#saveproj")]);
writeFileSync(dir + "/saved.plotlab", readFileSync(await dl.path()));
await p.click("#example"); await p.setInputFiles("#openfile", dir + "/saved.plotlab"); await p.waitForSelector("#results .res");
eq("after save and open", await lines(), ["Gewichteter Mittelwert = (10,02 ± 0,09) cm³"]);
eq("undo history cleared after open", await p.evaluate(() => undo.length), 0);

// Rows with an empty cell are skipped: the weighted mean of rows 1 and 3 only (9,98, u = 1/√(25+100) = 0,0894427).
await p.fill('input[data-r="1"][data-c="2"]', "");
await go();
eq("skipped row", await lines(), ["Gewichteter Mittelwert = (9,98 ± 0,09) cm³"]);
await p.click("#undo");

// Bad input.
await p.fill('input[data-r="1"][data-c="2"]', "0");
await go(); eq("zero u", await msg(), "Alle Unsicherheiten müssen größer als 0 sein (Zeile 2). Das Gewicht 1/u² ist sonst nicht definiert.");
await p.fill('input[data-r="1"][data-c="2"]', "0,3");
await p.selectOption("#w_unc", "");
await go(); eq("no unc column", await msg(), "Bitte eine Spalte mit den Unsicherheiten wählen.");
await p.selectOption("#w_unc", "V / cm³");
await go(); eq("same column", await msg(), "Ergebnisse und Unsicherheiten müssen verschiedene Spalten sein.");
await p.selectOption("#w_unc", "u / cm³");
await p.fill("#w_k", "0"); await go(); eq("k zero", await msg(), "Der Faktor k muss eine Zahl größer als 0 sein.");
await p.fill("#w_k", "abc"); await go(); eq("k text", await msg(), "Der Faktor k muss eine Zahl größer als 0 sein.");
await p.fill("#paste", "a;b;c\n1;;\n2;5;0,1");
await p.click("#pastego");
await go(); eq("one row", await msg(), "Es gibt 1 Zeile mit Ergebnis und Unsicherheit. Ein gewichteter Mittelwert braucht mindestens zwei.");
eq("no result for bad input", await p.evaluate(() => proj.results.length), 0);
await p.screenshot({ path: "evidence/phase2-step4-error.png", fullPage: true });

// Hand-edited project: nothing in names, inputs or settings runs.
await p.setInputFiles("#openfile", dir + "/hand.plotlab");
await p.waitForSelector("#results .res");
eq("no script ran", await p.evaluate(() => window.pwn), undefined);
eq("no injected elements", await p.$$eval("#results img, #results script, #wmean img, #wmean script, #wmsg img", e => e.length), 0);
eq("hand result is stale", await p.$$eval(".stalemsg", e => e.length), 1);
eq("no external requests", external, []);
await b.close();
if (bad) process.exit(1);
console.log("phase 2 step 4: weighted mean (10,02 ± 0,09) and overlap verdicts match the hand values in the real page");
