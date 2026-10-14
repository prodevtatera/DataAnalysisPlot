// Phase 2 step 5: frequency table and histogram with the fitted normal curve (P1 error distribution).
// 30 length readings l / mm, classes of 0,2 mm from 9,5 (left-closed). Hand values from tests/reference/histogram.py (exact fractions):
// counts 2 5 9 8 4 2; relative 6,7 16,7 30,0 26,7 13,3 6,7 %; cumulative 2 7 16 24 28 30 (6,7 23,3 53,3 80,0 93,3 100,0 %);
// mean 10,05; s(n-1) = 0,263269; σ(n) = 0,258844; curve n·w·φ: at the mean 6/(s·√(2π)) = 9,09206, at 9,5 1,025507, at 10,0 8,929556, at 10,7 0,431502.
// Automatic classes (width 0,2, start 9,4): counts 1 3 6 9 7 3 1 (counted by hand from the list).
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { writeFileSync, readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
const req = createRequire(import.meta.url);
import { chromium } from "./tools.mjs";
const { histogram, autoBins, normalCount } = req("../app/stats.js");
const { newProject, save } = req("../app/project.js");
let bad = 0;
const eq = (name, got, want) => {
  got = JSON.stringify(got); want = JSON.stringify(want);
  if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; }
};
const near = (name, got, want, tol = 1e-9) => {
  if (!(Math.abs(got - want) <= tol * Math.abs(want))) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; }
};
const L = "9.5 9.6 9.7 9.7 9.8 9.8 9.8 9.9 9.9 9.9 10.0 10.0 10.0 10.0 10.05 10.05 10.1 10.1 10.1 10.2 10.2 10.2 10.2 10.2 10.3 10.3 10.4 10.4 10.5 10.6".split(" ").map(Number);
const MEAN = 10.05, S1 = 0.26326857926381225, S0 = 0.2588435821108957;

// Pure functions. 9,7 and 10,1 sit on class boundaries where (v-start)/w is 0,9999... or 2,9999... in floating point.
eq("counts", histogram(L, 9.5, 0.2).counts, [2, 5, 9, 8, 4, 2]);
eq("edges", histogram(L, 9.5, 0.2).edges, [9.5, 9.7, 9.9, 10.1, 10.3, 10.5, 10.7]);
eq("auto counts", histogram(L, 9.4, 0.2).counts, [1, 3, 6, 9, 7, 3, 1]);
eq("auto bins", autoBins(L), { width: 0.2, start: 9.4 });
eq("auto bins integers", autoBins([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), { width: 2, start: 0 }); // range 9, 5 classes -> 1,8 -> width 2; 1/2 = 0,5 -> start 0
near("curve at mean (n-1)", normalCount(MEAN, MEAN, S1, 30, 0.2), 9.092059861841696);
near("curve at 9,5", normalCount(9.5, MEAN, S1, 30, 0.2), 1.025507446287714);
near("curve at 10,0", normalCount(10.0, MEAN, S1, 30, 0.2), 8.929555915195538);
near("curve at 10,7", normalCount(10.7, MEAN, S1, 30, 0.2), 0.4315015906415935);
near("curve at 10,0 (n)", normalCount(10.0, MEAN, S0, 30, 0.2), 9.076562570454474);

// Real page.
const dir = mkdtempSync(resolve(tmpdir(), "p2s5-"));
const hand1 = newProject(["l / mm", "m / g"], [[1, 2], [2, 3]]);
hand1.settings.hist = { col: "<img src=x onerror=window.pwn=1>", ddof: "<script>window.pwn=2</script>", width: "<img src=x onerror=window.pwn=3>", start: "<script>window.pwn=4</script>" };
hand1.results.push({ kind: "hist", inputs: { col: "<img src=x onerror=window.pwn=5>", ddof: "<script>window.pwn=6</script>", width: "<img src=x onerror=window.pwn=7>" }, n: "<img src=x onerror=window.pwn=8>",
  start: "<script>window.pwn=9</script>", width: "<img src=x onerror=window.pwn=10>", counts: ["<img src=x onerror=window.pwn=11>", 2], mean: 1, s: 1,
  params: [{ name: "<img src=x onerror=window.pwn=12>", unit: "<script>window.pwn=13</script>", value: 1, u: 0.1 }], computedFrom: "x" });
writeFileSync(dir + "/hand1.plotlab", save(hand1));
const hand2 = JSON.parse(save(hand1));   // numbers valid, text only in the labels
Object.assign(hand2.results[0], { n: 3, start: 1, width: 1, counts: [1, 2] });
writeFileSync(dir + "/hand2.plotlab", save(hand2));

const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1200, height: 2800 } })).newPage();
const external = [];
p.on("request", r => { if (!r.url().startsWith("file:")) external.push(r.url()); });
await p.goto(pathToFileURL(resolve("app/index.html")).href);
const lines = () => p.$$eval("#results .res", e => e.map(x => x.textContent));
const table = () => p.$$eval("#results table[data-freq] tr", e => e.map(r => [...r.cells].map(c => c.textContent)));
const go = () => p.click("#h_go");
const msg = () => p.textContent("#hmsg");
const plot = () => p.evaluate(() => ({ bars: document.getElementById("histplot").data?.[0], curve: document.getElementById("histplot").data?.[1], layout: document.getElementById("histplot").layout }));
const paste = t => p.fill("#paste", t).then(() => p.click("#pastego"));

await paste("l / mm\n" + L.map(v => String(v).replace(".", ",")).join("\n"));
eq("default column", await p.inputValue("#h_col"), "l / mm");   // one column only: it is x, so the select shows it by name
await p.selectOption("#h_col", "l / mm");
await p.fill("#h_w", "0,2"); await p.fill("#h_s", "9,5");
await go();
eq("table", await table(), [
  ["Klasse / mm", "absolut", "relativ", "kumuliert absolut", "kumuliert relativ"],
  ["9,5 bis unter 9,7", "2", "6,7 %", "2", "6,7 %"], ["9,7 bis unter 9,9", "5", "16,7 %", "7", "23,3 %"], ["9,9 bis unter 10,1", "9", "30,0 %", "16", "53,3 %"],
  ["10,1 bis unter 10,3", "8", "26,7 %", "24", "80,0 %"], ["10,3 bis unter 10,5", "4", "13,3 %", "28", "93,3 %"], ["10,5 bis unter 10,7", "2", "6,7 %", "30", "100,0 %"]]);
eq("result lines", await lines(), ["Mittelwert x̄ = (10,05 ± 0,05) mm", "Standardabweichung s (Teiler n−1) = 0,263 mm"]);
eq("detail", await p.textContent("#results [data-how]"), "Spalte „l / mm“, n = 30 Werte, 6 Klassen der Breite 0,2, Beginn 9,5. Normalverteilung mit x̄ und s (Teiler n−1): erwartete Anzahl je Klasse = n·Klassenbreite·φ(x).");
let pl = await plot();
eq("bars y", pl.bars.y, [2, 5, 9, 8, 4, 2]);
eq("bars x (class centres)", pl.bars.x.map(v => +v.toFixed(9)), [9.6, 9.8, 10, 10.2, 10.4, 10.6]);
eq("bars width", pl.bars.width.map(v => +v.toFixed(9)), [0.2, 0.2, 0.2, 0.2, 0.2, 0.2]);
eq("curve range", [pl.curve.x[0], +pl.curve.x.at(-1).toFixed(9)], [9.5, 10.7]);
// Every plotted point of the curve against the textbook formula written out here with the hand mean and s.
const ref = (x, s) => 30 * 0.2 * Math.exp(-((x - MEAN) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI));
const worst = pl.curve.x.reduce((m, x, i) => Math.max(m, Math.abs(pl.curve.y[i] - ref(x, S1)) / ref(x, S1)), 0);
if (!(worst < 1e-9)) { console.log("FAIL curve points: worst relative error", worst); bad++; }
const at = x => pl.curve.y[pl.curve.x.findIndex(v => Math.abs(v - x) < 1e-9)];
near("page curve at 9,5", at(9.5), 1.025507446287714); near("page curve at 10,0", at(10.0), 8.929555915195538); near("page curve at 10,7", at(10.7), 0.4315015906415935);
eq("axis titles", [pl.layout.xaxis.title.text, pl.layout.yaxis.title.text], ["l / mm", "Anzahl der Messwerte"]);
eq("legend names", [pl.bars.name, pl.curve.name], ["Messwerte (Anzahl je Klasse)", "Normalverteilung (x̄, s)"]);
await p.screenshot({ path: "evidence/phase2-step5-hist.png", fullPage: true });
await (await p.$("#histplot")).screenshot({ path: "evidence/phase2-step5-hist-plot.png" });

// Divisor n: out of date until recalculated, then the curve uses σ (10,0 -> 9,0765626).
await p.selectOption("#h_ddof", "0");
eq("stale after divisor", await p.textContent(".stalemsg"), "Die Daten wurden geändert. Dieses Ergebnis ist veraltet. Bitte neu berechnen.");
eq("plot removed when stale", [await p.textContent("#histplot .empty"), (await plot()).bars], ["Das Histogramm ist veraltet. Bitte neu berechnen.", undefined]);
await go(); pl = await plot();
near("curve at 10,0 with n", pl.curve.y[pl.curve.x.findIndex(v => Math.abs(v - 10.0) < 1e-9)], 9.076562570454474);
eq("legend sigma", pl.curve.name, "Normalverteilung (x̄, σ)");
eq("sigma line", (await lines())[1], "Standardabweichung σ (Teiler n) = 0,259 mm");
// Undo of the recalculation brings back the n-1 result, which is out of date while the divisor is still n; undoing the divisor too makes it fresh.
await p.click("#undo"); eq("undo recalculation: old result stale", [await p.$$eval(".stalemsg", e => e.length), (await plot()).bars], [1, undefined]);
await p.click("#undo"); eq("undo divisor: plot back", (await plot()).curve.name, "Normalverteilung (x̄, s)");
// A data edit (9,6 -> 9,7 moves one reading into class 2) removes the plot; putting it back restores it.
await p.fill('input[data-r="1"][data-c="0"]', "9,7");
eq("stale after edit", [await p.$$eval(".stalemsg", e => e.length), (await plot()).bars], [1, undefined]);
await p.fill('input[data-r="1"][data-c="0"]', "9,6");
eq("fresh after edit reverted", [await p.$$eval(".stalemsg", e => e.length), (await plot()).bars.y], [0, [2, 5, 9, 8, 4, 2]]);
// Reload and save/open keep table and plot.
await p.reload(); await p.waitForSelector("#results table[data-freq]");
eq("after reload", [(await table()).length, (await plot()).bars.y, await p.inputValue("#h_w"), await p.inputValue("#h_s")], [7, [2, 5, 9, 8, 4, 2], "0,2", "9,5"]);
const [dl] = await Promise.all([p.waitForEvent("download"), p.click("#saveproj")]);
writeFileSync(dir + "/saved.plotlab", readFileSync(await dl.path()));
await p.click("#example"); await p.setInputFiles("#openfile", dir + "/saved.plotlab"); await p.waitForSelector("#results table[data-freq]");
eq("after save and open", [(await plot()).bars.y, (await lines())[0]], [[2, 5, 9, 8, 4, 2], "Mittelwert x̄ = (10,05 ± 0,05) mm"]);

// Automatic classes (fields empty): width 0,2 from 9,4, counts 1 3 6 9 7 3 1.
await p.fill("#h_w", ""); await p.fill("#h_s", ""); await go();
eq("auto bars", (await plot()).bars.y, [1, 3, 6, 9, 7, 3, 1]);
eq("auto detail", await p.textContent("#results [data-how]"), "Spalte „l / mm“, n = 30 Werte, 7 Klassen der Breite 0,2 (automatisch), Beginn 9,4 (automatisch). Normalverteilung mit x̄ und s (Teiler n−1): erwartete Anzahl je Klasse = n·Klassenbreite·φ(x).");

// Bad input.
await p.fill("#h_w", "0"); await go(); eq("width zero", await msg(), "Die Klassenbreite muss eine Zahl größer als 0 sein (oder leer für automatisch).");
await p.fill("#h_w", "abc"); await go(); eq("width text", await msg(), "Die Klassenbreite muss eine Zahl größer als 0 sein (oder leer für automatisch).");
await p.fill("#h_w", "0,001"); await p.fill("#h_s", "9,5"); await go(); eq("too many classes", await msg(), "Mit Klassenbreite 0,001 gäbe es 1.101 Klassen. Das sind zu viele (höchstens 100). Bitte eine größere Klassenbreite wählen.");
await p.fill("#h_w", "0,2"); await p.fill("#h_s", "10"); await go(); eq("start above minimum", await msg(), "Der Beginn 10 liegt über dem kleinsten Wert 9,5. Bitte einen Beginn kleiner oder gleich dem kleinsten Wert wählen.");
await p.fill("#h_s", "x"); await go(); eq("start text", await msg(), "Der Beginn der ersten Klasse ist keine Zahl (oder leer für automatisch).");
await p.fill("#h_s", ""); await p.fill("#h_w", "");
await paste("a;b\n1;5\n2;5"); await go(); eq("all equal", await msg(), "Alle Werte der Spalte „b“ sind gleich (5). Die Standardabweichung ist 0, daher gibt es keine Normalverteilung und keine sinnvolle Klasseneinteilung.");
await paste("a;b\n1;5\n2;"); await go(); eq("one value", await msg(), "Die Spalte „b“ hat 1 Wert. Ein Histogramm mit Normalverteilung braucht mindestens zwei Werte.");
eq("no result for bad input", await p.evaluate(() => proj.results.length), 0);
eq("no plot for bad input", await p.textContent("#histplot .empty"), "Noch kein Histogramm. Wähle eine Spalte und drücke „Berechnen“.");
await p.screenshot({ path: "evidence/phase2-step5-error.png", fullPage: true });

// Hand-edited projects: nothing in names, inputs, settings or counts runs.
for (const f of ["hand1", "hand2"]) {
  await p.setInputFiles("#openfile", `${dir}/${f}.plotlab`);
  await p.waitForSelector("#results .result");
  eq(f + ": no script ran", await p.evaluate(() => window.pwn), undefined);
  eq(f + ": no injected elements", await p.$$eval("#results img, #results script, #hist img, #histplot img, #histplot script, #hmsg img", e => e.length), 0);
  eq(f + ": stale", await p.$$eval(".stalemsg", e => e.length), 1);
}
eq("hand2 shows its numbers as text", await p.$$eval("#results table[data-freq] tr", e => e.length), 3);
eq("no external requests", external, []);
await b.close();
if (bad) process.exit(1);
console.log("phase 2 step 5: frequency table (2 5 9 8 4 2) and normal curve match the hand values in the real page");
