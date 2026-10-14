// Phase 2 step 11: chi-square goodness of fit of counts against Poisson and Gauss (P8 radioactivity), with a warning for expected counts below 5.
// Expected numbers come from tests/reference/gof.py (plain math: exp, erf, closed-form chi-square p-values that the script itself checks against the printed
// critical-value table, for example df = 3: 7,815 at p = 0,05), never from the app or SciPy:
//   A: 40 counts, mean 7,15, s(n-1) 2,0699312511809143. Classes of width 1 from 3: observed 2 2 4 7 8 7 5 3 1 1
//      Poisson chi2 3,9874131891589983 (df 8) p 0,8582572964207479; Gauss chi2 0,5492098838247079 (df 7) p 0,9992456023666847
//      width 2 from 3 (also the automatic choice): observed 4 11 15 8 2; Poisson 3,5084921334764605 (df 3) p 0,3196623886515077; Gauss 0,018582495424461175 (df 2) p 0,9907517825583716
//   B: 30 counts 19, 20, 21 (10 each), width 1 from 16: Poisson chi2 52,605394388824756 (df 4) p 1,03e-10 (rejected); Gauss 3,543854131236329 (df 3) p 0,3151187697164778
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { serve } from "./serve.mjs";
const req = createRequire(import.meta.url);
const { gofPrepare, gofVerdict, gofLow } = req("../app/gof.js");
const { newProject, save, gofSettings, isStale, addResult } = req("../app/project.js");
import { chromium } from "./tools.mjs";
let bad = 0;
const eq = (name, got, want) => {
  got = JSON.stringify(got); want = JSON.stringify(want);
  if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; }
};
const near = (name, got, want, tol = 1e-8) => { if (!(Math.abs(got - want) <= tol * Math.abs(want))) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; } };
const nearAll = (name, got, want, tol = 1e-8) => { eq(name + " length", got.length, want.length); want.forEach((w, i) => near(`${name}[${i}]`, got[i], w, tol)); };

const A = [4,7,9,6,8,5,10,7,6,8, 9,3,7,11,6,8,7,5,9,6, 8,10,4,7,6,12,7,5,8,9, 6,7,8,3,9,7,10,6,5,8];
const B = [...Array(10).fill(19), ...Array(10).fill(20), ...Array(10).fill(21)];
const MEAN = 7.15, S = 2.0699312511809143;
const REF = {
  A1: { obs: [2, 2, 4, 7, 8, 7, 5, 3, 1, 1],
    poisson: { e: [2.9709375042920554, 3.41875021675389, 4.888812809958062, 5.825835265200025, 5.9506745923114535, 5.318415416878364, 4.225185581186701, 3.0210076905484895, 1.9636549988565166, 2.4167259240144423], chi2: 3.9874131891589983, dof: 8, p: 0.8582572964207479 },
    gauss: { e: [1.556851158487924, 2.4523935271767128, 4.498290127239873, 6.562580778333977, 7.615331867080897, 7.029052242049616, 5.160535988448025, 3.01348427923652, 1.3995715183177193, 0.7119085136287362], chi2: 0.5492098838247079, dof: 7, p: 0.9992456023666847 } },
  A2: { obs: [4, 11, 15, 8, 2],
    poisson: { e: [6.389687721045946, 10.714648075158086, 11.269090009189817, 7.246193271735191, 4.380380922870959], chi2: 3.5084921334764605, dof: 3, p: 0.3196623886515077 },
    gauss: { e: [4.009244685664637, 11.06087090557385, 14.644384109130513, 8.174020267684545, 2.1114800319464555], chi2: 0.018582495424461175, dof: 2, p: 0.9907517825583716 } },
  B1: { obs: [0, 0, 0, 10, 10, 10],
    poisson: { e: [6.632226046633228, 2.2786258911069854, 2.5318065456744288, 2.6650595217625566, 2.6650595217625583, 13.227222473060243], chi2: 52.605394388824756, dof: 4, p: 1.0305980153310681e-10 },
    gauss: { e: [0.00037540157876769786, 0.038760349762049784, 1.024079043611155, 7.143601213213863, 13.586367983668332, 8.206816008165834], chi2: 3.543854131236329, dof: 3, p: 0.3151187697164778 } },
};

// --- pure functions ---
let g = gofPrepare("N", A, { width: 1, start: 3 });
eq("counts w1", g.counts, REF.A1.obs); eq("edges w1", g.edges, [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]); near("mean", g.mean, MEAN); near("s", g.s, S); eq("n", g.n, 40);
g = gofPrepare("N", A, { width: 2, start: 3 }); eq("counts w2", g.counts, REF.A2.obs); eq("edges w2", g.edges, [3, 5, 7, 9, 11, 13]);
g = gofPrepare("N", A, { width: null, start: null }); eq("auto = width 2 from 3 (range 3..12 over 8 classes, rounded up)", [g.width, g.start, g.counts], [2, 3, REF.A2.obs]);
g = gofPrepare("N", [null, ...A, null], { width: 1, start: 3 }); eq("empty cells skipped", g.n, 40);
eq("bad: one value", gofPrepare("N", [5, null], { width: null, start: null }).error, "Die Spalte „N“ hat 1 Wert. Für den χ²-Test braucht es viele Zählwerte.");
eq("bad: fraction", gofPrepare("N", [1, 2, 3.5, 4], { width: null, start: null }).error, "Zählwerte sind ganze Zahlen ab 0. In Zeile 3 der Spalte „N“ steht 3,5.");
eq("bad: negative", gofPrepare("N", [1, -2, 3], { width: null, start: null }).error, "Zählwerte sind ganze Zahlen ab 0. In Zeile 2 der Spalte „N“ steht -2.");
eq("bad: all equal", gofPrepare("N", [4, 4, 4], { width: null, start: null }).error, "Alle Werte der Spalte „N“ sind gleich (4). Mit Standardabweichung 0 gibt es keine Gauß-Verteilung und keine Klassen.");
eq("bad: start above minimum", gofPrepare("N", A, { width: 1, start: 4 }).error, "Der Beginn 4 liegt über dem kleinsten Wert 3. Bitte einen Beginn kleiner oder gleich dem kleinsten Wert wählen.");
eq("bad: too few classes", gofPrepare("N", A, { width: 4, start: 3 }).error, "Mit Klassenbreite 4 ab 3 gibt es nur 3 Klassen. Für die Gauß-Verteilung (2 geschätzte Parameter) braucht es mindestens 4, sonst bleibt kein Freiheitsgrad. Bitte eine kleinere Klassenbreite wählen.");
eq("bad: too many classes", gofPrepare("N", [0, 150], { width: 1, start: 0 }).error, "Mit Klassenbreite 1 gäbe es 151 Klassen. Das sind zu viele (höchstens 100). Bitte eine größere Klassenbreite wählen.");
eq("3 classes is the limit", typeof gofPrepare("N", A, { width: 3, start: 3 }).error, "undefined"); // 3..12 in classes of 3: 4 classes
eq("low classes", gofLow(REF.A1.poisson.e), [1, 2, 3, 7, 8, 9, 10]); eq("low classes gauss", gofLow(REF.A1.gauss.e), [1, 2, 3, 8, 9, 10]);
eq("exactly 5 is not low", gofLow([5, 4.999999, 5.0001]), [2]);
eq("verdict at 0,05", [gofVerdict("Poisson", 0.05), gofVerdict("Gauß", 0.0499)], ["Poisson: Die Zählwerte widersprechen der Poisson-Verteilung nicht (p ≥ 0,05).", "Gauß: Die Gauß-Verteilung passt nicht zu den Zählwerten (p < 0,05), sie wird bei 5 % Signifikanzniveau verworfen."]);
// Staleness and settings.
const q = newProject(["N"], A.map(v => [v]));
q.settings.gof = { col: "N", width: 1, start: 3 }; addResult(q, { kind: "gof" });
const fresh = () => !isStale(q, q.results[0]);
eq("fresh", fresh(), true);
q.settings.gof = { col: "N", width: 2, start: 3 }; eq("width change is stale", fresh(), false); q.settings.gof = { col: "N", width: 1, start: 3 }; eq("and back", fresh(), true);
q.columns[0].values[0] = 5; eq("data change is stale", fresh(), false);
eq("settings: junk becomes automatic", gofSettings({ columns: [{ name: "N", role: "x" }], settings: { gof: { col: "?", width: 1.5, start: "3" } } }), { col: "N", width: null, start: null });

// --- real page ---
const { base, close } = await serve();
const dir = mkdtempSync(resolve(tmpdir(), "p2s11-"));
const H = "<img src=x onerror=window.pwn=";
const hand = newProject([H + "1>", "m"], [[1, 2], [2, 3]]);
hand.settings.gof = { col: H + "2>", width: H + "3>", start: "<script>window.pwn=4</script>" };
const handResult = { kind: "gof", inputs: { col: H + "5>", width: H + "6>", start: "<script>window.pwn=7</script>" }, n: H + "8>", mean: 1, s: 1, start: 1, width: H + "9>", counts: [1, H + "10>", 1, 1],
  dists: { poisson: { expected: [1, 1, 1, H + "11>"], chi2: 1, dof: 1, p: 0.5 }, gauss: { expected: [1, 1, 1, 1], chi2: 1, dof: 1, p: 0.5 } },
  params: [{ name: H + "12>", unit: "<script>window.pwn=13</script>", text: H + "14>", value: 1 }], computedFrom: "x" };
hand.results.push(handResult); writeFileSync(dir + "/hand1.plotlab", save(hand));
const hand2 = JSON.parse(save(hand));   // numbers valid, text only in labels
Object.assign(hand2.results[0], { n: 3, width: 1, counts: [1, 1, 1, 1] }); hand2.results[0].dists.poisson.expected = [1, 1, 1, 1];
hand2.results[0].params[0].value = 1; writeFileSync(dir + "/hand2.plotlab", save(hand2));

const br = await chromium.launch();
const p = await (await br.newContext({ viewport: { width: 1200, height: 3900 } })).newPage();
const external = [];
p.on("request", r => { if (!r.url().startsWith(base) && !r.url().startsWith("data:") && !r.url().startsWith("blob:")) external.push(r.url()); });
await p.goto(base + "app/app.html");
await p.evaluate(() => localStorage.clear());
await p.reload();
const lines = () => p.$$eval("#results .res", e => e.map(x => x.textContent));
const gmsg = async () => (await p.isVisible("#gofmsg")) ? await p.textContent("#gofmsg") : null;
const stale = () => p.$$eval(".stalemsg", e => e.length);
const table = () => p.$$eval("#results table[data-gof] tr", e => e.map(r => [...r.cells].map(c => c.textContent)));
const warns = () => p.$$eval("#results [data-warn]", e => e.map(x => x.textContent));
const verdicts = () => p.$$eval("#results [data-verdict]", e => e.map(x => x.textContent));
const plot = () => p.evaluate(() => { const d = document.getElementById("gofplot"); return { t: d.data?.map(t => ({ name: t.name, x: t.x, y: t.y, type: t.type })), x: d.layout?.xaxis.title.text, y: d.layout?.yaxis.title.text }; });
const ready = () => p.waitForFunction(() => !document.getElementById("fit").disabled, null, { timeout: 120000 });
const stored = () => p.evaluate(() => proj.results.find(r => r.kind === "gof"));
const run = async () => { await p.click("#g_go"); await p.waitForFunction(() => !document.getElementById("g_go").disabled); };
const setup = async (name, vals) => { await p.fill("#paste", name + "\n" + vals.join("\n")); await p.click("#pastego"); await ready(); };
const checkDist = (name, d, ref) => { nearAll(name + " expected", d.expected, ref.e); near(name + " chi2", d.chi2, ref.chi2); eq(name + " dof", d.dof, ref.dof); near(name + " p", d.p, ref.p, 1e-6); near(name + " sum expected = n", d.expected.reduce((a, v) => a + v, 0), ref.e.reduce((a, v) => a + v, 0)); };

// Bad input first: no data (nothing happens), then non-counts.
eq("no project: button off, nothing happens", [await p.isDisabled("#g_go"), await gmsg()], [true, null]);
await setup("N", ["1,5", "2", "3", "4", "5", "6"]);
await run();
eq("fractions refused", await gmsg(), "Zählwerte sind ganze Zahlen ab 0. In Zeile 1 der Spalte „N“ steht 1,5.");
await p.screenshot({ path: "evidence/phase2-step11-error.png", fullPage: true });

// Case A, classes of width 1 from 3.
await setup("N", A);
eq("column offered", await p.inputValue("#g_col"), "N");
await p.fill("#g_w", "1"); await p.fill("#g_s", "3"); await run();
eq("no message", await gmsg(), null);
let r = await stored();
eq("observed counts", r.counts, REF.A1.obs); near("mean", r.mean, MEAN); near("s", r.s, S);
checkDist("A1 poisson", r.dists.poisson, REF.A1.poisson); checkDist("A1 gauss", r.dists.gauss, REF.A1.gauss);
eq("result lines", await lines(), ["Mittelwert x̄ (= λ der Poisson-Verteilung) = (7,2 ± 0,3)", "Poisson: χ² = 3,99 bei 8 Freiheitsgraden, p = 0,858", "Gauß: χ² = 0,549 bei 7 Freiheitsgraden, p = 0,999"]);
const t = await table();
eq("table head", t[0], ["Klasse (Zählwert)", "beobachtet", "erwartet Poisson", "erwartet Gauß"]);
eq("table rows", t.slice(1).map(x => x.slice(0, 2)), [["≤ 3", "2"], ["4", "2"], ["5", "4"], ["6", "7"], ["7", "8"], ["8", "7"], ["9", "5"], ["10", "3"], ["11", "1"], ["≥ 12", "1"]]);
eq("table expected, 2 decimals", [t[1][2], t[1][3], t[5][2], t[5][3], t[10][3]], ["2,97 *", "1,56 *", "5,95", "7,62", "0,71 *"]);
eq("warning lists the classes below 5", await warns(), [
  "Warnung Poisson: In den Klassen 1, 2, 3, 7, 8, 9, 10 ist die erwartete Anzahl kleiner als 5 (mit * markiert). Der χ²-Test ist dann ungenau. Wähle breitere Klassen oder fasse Klassen zusammen.",
  "Warnung Gauß: In den Klassen 1, 2, 3, 8, 9, 10 ist die erwartete Anzahl kleiner als 5 (mit * markiert). Der χ²-Test ist dann ungenau. Wähle breitere Klassen oder fasse Klassen zusammen."]);
eq("verdicts", await verdicts(), ["Poisson: Die Zählwerte widersprechen der Poisson-Verteilung nicht (p ≥ 0,05).", "Gauß: Die Zählwerte widersprechen der Gauß-Verteilung nicht (p ≥ 0,05)."]);
const how = await p.textContent("#results [data-how]");
eq("method named", [how.includes("Poisson mit λ = x̄ = 7,15 (1 geschätzter Parameter: Freiheitsgrade = Klassen − 1 − 1)"), how.includes("Gauß mit x̄ und s = 2,07 (Teiler n−1; 2 geschätzte Parameter: Freiheitsgrade = Klassen − 1 − 2)"), how.includes("Stetigkeitskorrektur"), how.includes("10 Klassen der Breite 1, Beginn 3.")], [true, true, true, true]);
let pl = await plot();
eq("plot series", pl.t.map(s => [s.name, s.type]), [["Messwerte (Anzahl der Intervalle)", "bar"], ["Erwartet Poisson", "scatter"], ["Erwartet Gauß", "scatter"]]);
eq("plot bars", [pl.t[0].x, pl.t[0].y], [[3, 4, 5, 6, 7, 8, 9, 10, 11, 12], REF.A1.obs]);
nearAll("plot poisson", pl.t[1].y, REF.A1.poisson.e); nearAll("plot gauss", pl.t[2].y, REF.A1.gauss.e);
eq("axis titles", [pl.x, pl.y], ["N (Zählwert je Intervall)", "Anzahl der Intervalle"]);
await p.screenshot({ path: "evidence/phase2-step11-gof.png", fullPage: true });
await p.locator("#gofplot").screenshot({ path: "evidence/phase2-step11-gof-plot.png" });

// Width 2 and the automatic choice give the same classes and numbers.
await p.fill("#g_w", "2"); eq("typing the width makes the result stale", [await stale(), (await plot()).t], [1, undefined]);
await run(); r = await stored();
eq("W2 observed", r.counts, REF.A2.obs); checkDist("A2 poisson", r.dists.poisson, REF.A2.poisson); checkDist("A2 gauss", r.dists.gauss, REF.A2.gauss);
eq("W2 lines", (await lines()).slice(1), ["Poisson: χ² = 3,51 bei 3 Freiheitsgraden, p = 0,320", "Gauß: χ² = 0,0186 bei 2 Freiheitsgraden, p = 0,991"]);
eq("W2 labels", (await table()).slice(1).map(x => x[0]), ["≤ 4", "5 bis 6", "7 bis 8", "9 bis 10", "≥ 11"]);
eq("W2 warnings (singular for one class)", (await warns()).map(x => x.split(" ist die")[0]), ["Warnung Poisson: In Klasse 5", "Warnung Gauß: In den Klassen 1, 5"]);
nearAll("W2 plot bar centres", (await plot()).t[0].x, [3.5, 5.5, 7.5, 9.5, 11.5]);
await p.fill("#g_w", ""); await p.fill("#g_s", ""); await run(); r = await stored();
eq("automatic = width 2 from 3", [r.width, r.start, r.counts], [2, 3, REF.A2.obs]);
eq("automatic is stated", (await p.textContent("#results [data-how]")).includes("5 Klassen der Breite 2 (automatisch), Beginn 3 (automatisch)."), true);

// Staleness, undo, reload, save and open.
await p.fill('input[data-r="0"][data-c="0"]', "5");
eq("data edit: stale, plot gone", [await stale(), (await plot()).t], [1, undefined]);
await p.fill('input[data-r="0"][data-c="0"]', "4");
eq("old value: fresh again, plot back", [await stale(), (await plot()).t.length], [0, 3]);
await p.fill("#g_w", "1"); eq("width typed: stale", await stale(), 1);
await p.click("#undo");
eq("undo: fresh again", [await stale(), await p.inputValue("#g_w")], [0, ""]);
await p.reload(); await p.waitForSelector("#results .res"); await ready();
eq("after reload", [(await lines()).length, await stale(), (await plot()).t.length], [3, 0, 3]);
const [dl] = await Promise.all([p.waitForEvent("download"), p.click("#saveproj")]);
writeFileSync(dir + "/saved.plotlab", readFileSync(await dl.path()));
await p.click("#example"); await p.setInputFiles("#openfile", dir + "/saved.plotlab"); await p.waitForFunction(() => proj.results.some(r => r.kind === "gof"));
eq("after save and open", [(await lines()).length, await stale(), (await plot()).t.length], [3, 0, 3]);

// Case B: counts far too narrow for Poisson: rejected; Gauss with its own s is not.
await setup("N", B);
await p.fill("#g_w", "1"); await p.fill("#g_s", "16"); await run(); r = await stored();
eq("B observed", r.counts, REF.B1.obs); checkDist("B poisson", r.dists.poisson, REF.B1.poisson); checkDist("B gauss", r.dists.gauss, REF.B1.gauss);
eq("B lines", (await lines()).slice(1), ["Poisson: χ² = 52,6 bei 4 Freiheitsgraden, p < 0,001", "Gauß: χ² = 3,54 bei 3 Freiheitsgraden, p = 0,315"]);
eq("B verdicts", await verdicts(), ["Poisson: Die Poisson-Verteilung passt nicht zu den Zählwerten (p < 0,05), sie wird bei 5 % Signifikanzniveau verworfen.", "Gauß: Die Zählwerte widersprechen der Gauß-Verteilung nicht (p ≥ 0,05)."]);
await p.screenshot({ path: "evidence/phase2-step11-rejected.png", fullPage: true });

// More bad input.
await setup("N", A);
await p.fill("#g_w", "0"); await run(); eq("width 0 refused", await gmsg(), "Die Klassenbreite muss eine ganze Zahl ab 1 sein (oder leer für automatisch).");
await p.fill("#g_w", "1,5"); await run(); eq("width 1,5 refused", await gmsg(), "Die Klassenbreite muss eine ganze Zahl ab 1 sein (oder leer für automatisch).");
await p.fill("#g_w", ""); await p.fill("#g_s", "x"); await run(); eq("start letters refused", await gmsg(), "Der Beginn der ersten Klasse muss eine ganze Zahl ab 0 sein (oder leer für automatisch).");
await p.fill("#g_s", "5"); await run(); eq("start above minimum", await gmsg(), "Der Beginn 5 liegt über dem kleinsten Wert 3. Bitte einen Beginn kleiner oder gleich dem kleinsten Wert wählen.");
await p.fill("#g_s", ""); await p.fill("#g_w", "5"); await run(); eq("too few classes", (await gmsg()).startsWith("Mit Klassenbreite 5 ab 3 gibt es nur 2 Klassen."), true);
eq("no result after refusals", await p.evaluate(() => proj.results.filter(r => r.kind === "gof").length), 0);
// A zero in the expected counts is impossible here, but an empty column is: all cells cleared.
await setup("N", ["", "", ""].map(() => "5"));
await run(); eq("all equal", await gmsg(), "Alle Werte der Spalte „N“ sind gleich (5). Mit Standardabweichung 0 gibt es keine Gauß-Verteilung und keine Klassen.");

// Hand-edited projects: nothing in names, settings or results runs.
await p.setInputFiles("#openfile", dir + "/hand1.plotlab");
await p.waitForFunction(() => proj.results.length === 1 && proj.results[0].computedFrom === "x");
eq("hand1: incomplete result is named so", await p.textContent("#results .detail"), "Dieses Ergebnis ist unvollständig. Bitte neu berechnen.");
await p.setInputFiles("#openfile", dir + "/hand2.plotlab");
await p.waitForFunction(() => proj.results.length === 1 && proj.results[0].n === 3);
eq("hand2: still no script, no injected element", [await p.evaluate(() => window.pwn), await p.$$eval("#results img, #results script, #gof img, #gof script, #gofmsg img, #gofplot img, #table img", e => e.length)], [undefined, 0]);
eq("hand2 result is stale", await stale(), 1);
eq("no external requests", external, []);
await br.close(); close();
if (bad) process.exit(1);
console.log("phase 2 step 11: chi-square against Poisson and Gauss matches the hand values (expected counts, chi2, degrees of freedom, p, warnings, verdicts)");
