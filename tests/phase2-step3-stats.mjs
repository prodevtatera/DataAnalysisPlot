// Phase 2 step 3: mean, standard deviation (n or n-1), standard error, random + instrument error in quadrature.
// Sample: ten burette readings (mL) 10,12 10,08 10,15 10,10 10,11 10,09 10,14 10,07 10,13 10,11.
// Hand calculation (exact fractions in a separate script): sum 101,11 -> mean 10,11; Σ(x-x̄)² = 0,006;
// s(n-1) = √(0,006/9) = 0,0258199; σ(n) = √(0,006/10) = 0,0244949; sem = √(0,006/9/10) = 0,00816497;
// with instrument error 0,02: √(sem² + 0,02²) = √(0,000466667) = 0,0216025.
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { writeFileSync, readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
const req = createRequire(import.meta.url);
import { chromium } from "./tools.mjs";
const { describe } = req("../app/stats.js");
const { newProject, save } = req("../app/project.js");
let bad = 0;
const eq = (name, got, want) => {
  got = JSON.stringify(got); want = JSON.stringify(want);
  if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; }
};
const near = (name, got, want, tol = 1e-6) => {
  if (!(Math.abs(got - want) <= tol * Math.abs(want))) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; }
};

// Pure functions.
const v = [10.12, 10.08, 10.15, 10.10, 10.11, 10.09, 10.14, 10.07, 10.13, 10.11];
for (const [ddof, s] of [[1, 0.0258198890], [0, 0.0244948974]]) {
  const d = describe(v, ddof, 0.02);
  near(`mean ddof ${ddof}`, d.mean, 10.11, 1e-12); near(`s ddof ${ddof}`, d.s, s, 1e-8);
  near(`sem ddof ${ddof}`, d.sem, 0.00816496581, 1e-8); near(`uTotal ddof ${ddof}`, d.uTotal, 0.0216024690, 1e-8);
  eq("n", d.n, 10);
}
eq("no instrument error", describe(v, 1).uTotal, null);
// Two values 1 and 3: mean 2, Σ(x-x̄)² = 2, s(n-1) = √2, σ(n) = 1, sem = √(2/1/2) = 1, with 0,5: √1,25.
const t = describe([1, 3], 1, 0.5), t0 = describe([1, 3], 0);
near("two values s", t.s, Math.SQRT2); near("two values sigma", t0.s, 1); near("two values sem", t.sem, 1); near("two values u", t.uTotal, Math.sqrt(1.25));

// Real page.
const dir = mkdtempSync(resolve(tmpdir(), "p2s3-"));
const hand = newProject(["x / mL"], [[1], [2], [3]]);
hand.settings.stats = { col: "<img src=x onerror=window.pwn=1>", ddof: "<b>", instr: "<script>window.pwn=3</script>" };
hand.results.push({ kind: "stats", inputs: { col: "<img src=x onerror=window.pwn=2>", ddof: 0, instr: "<script>window.pwn=4</script>" }, n: "<img src=x onerror=window.pwn=5>",
  params: [{ name: "<img src=x onerror=window.pwn=6>", unit: "<script>window.pwn=7</script>", value: 1, u: 0.1 }], computedFrom: "x" });
writeFileSync(dir + "/hand.plotlab", save(hand));

const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1200, height: 2300 } })).newPage();
const external = [];
p.on("request", r => { if (!r.url().startsWith("file:")) external.push(r.url()); });
await p.goto(pathToFileURL(resolve("app/app.html")).href);
const lines = () => p.$$eval("#results .res", e => e.map(x => x.textContent));
const go = async () => { await p.click("#s_go"); };
const msg = () => p.textContent("#statsmsg");

await p.fill("#paste", "V / mL\n" + v.map(x => String(x).replace(".", ",")).join("\n"));
await p.click("#pastego");
eq("column offered", await p.$$eval("#s_col option", e => e.map(x => x.value)), ["V / mL"]);
await go();
eq("result lines n-1", await lines(), ["Mittelwert x̄ = (10,110 ± 0,008) mL", "Standardabweichung s (Teiler n−1) = 0,0258 mL", "Standardfehler des Mittelwerts s/√n = 0,00816 mL"]);
eq("detail", await p.textContent("#results .detail"), "Spalte „V / mL“, n = 10 Werte. Standardabweichung mit Teiler n−1. Mittelwert ± Standardfehler s/√n (s mit n−1).");

// Switching to divisor n makes the result out of date; calculating again gives sigma. The mean line does not change.
await p.selectOption("#s_ddof", "0");
eq("stale after switching n", await p.textContent(".stalemsg"), "Die Daten wurden geändert. Dieses Ergebnis ist veraltet. Bitte neu berechnen.");
await go();
eq("result lines n", await lines(), ["Mittelwert x̄ = (10,110 ± 0,008) mL", "Standardabweichung σ (Teiler n) = 0,0245 mL", "Standardfehler des Mittelwerts s/√n = 0,00816 mL"]);

// Instrument error 0,02 adds the quadrature line: (10,110 ± 0,022) mL.
await p.fill("#s_instr", "0,02");
await go();
eq("result lines instrument", await lines(), ["Mittelwert x̄ = (10,110 ± 0,008) mL", "Standardabweichung σ (Teiler n) = 0,0245 mL", "Standardfehler des Mittelwerts s/√n = 0,00816 mL", "Mittelwert x̄ mit Gerätefehler = (10,110 ± 0,022) mL"]);
await p.screenshot({ path: "evidence/phase2-step3-stats.png", fullPage: true });

// Edit a value: the result is out of date; undo makes it fresh; reload keeps it.
await p.fill('input[data-r="0"][data-c="0"]', "10,2");
eq("stale after edit", await p.$$eval(".stalemsg", e => e.length), 1);
await p.click("#undo");
eq("fresh after undo", await p.$$eval(".stalemsg", e => e.length), 0);
await p.reload(); await p.waitForSelector("#results .res");
eq("after reload", (await lines())[3], "Mittelwert x̄ mit Gerätefehler = (10,110 ± 0,022) mL");
eq("settings restored", await p.evaluate(() => [$("s_ddof").value, $("s_instr").value, $("s_col").value]), ["0", "0,02", "V / mL"]);
const [dl] = await Promise.all([p.waitForEvent("download"), p.click("#saveproj")]);
writeFileSync(dir + "/saved.plotlab", readFileSync(await dl.path()));
await p.click("#example"); await p.setInputFiles("#openfile", dir + "/saved.plotlab"); await p.waitForSelector("#results .res");
eq("after save and open", (await lines())[3], "Mittelwert x̄ mit Gerätefehler = (10,110 ± 0,022) mL");
eq("undo history cleared after open", await p.evaluate(() => undo.length), 0);

// Bad input.
await p.fill("#paste", "a;b\n1;\n2;5");
await p.click("#pastego");
await p.selectOption("#s_col", "b");
await go();
eq("one value", await msg(), "Die Spalte „b“ hat 1 Wert. Mittelwert und Streuung brauchen mindestens zwei Werte.");
await p.selectOption("#s_col", "a");
await p.fill("#s_instr", "-1"); await go();
eq("negative", await msg(), "Der Gerätefehler darf nicht negativ sein.");
await p.fill("#s_instr", "abc"); await go();
eq("not a number", await msg(), "Der Gerätefehler ist keine Zahl.");
eq("no result for bad input", await p.evaluate(() => proj.results.length), 0);
await p.screenshot({ path: "evidence/phase2-step3-error.png", fullPage: true });

// Hand-edited project: nothing in names, inputs or settings runs.
await p.setInputFiles("#openfile", dir + "/hand.plotlab");
await p.waitForSelector("#results .res");
eq("no script ran", await p.evaluate(() => window.pwn), undefined);
eq("no injected elements", await p.$$eval("#results img, #results script, #stats img, #stats script, #statsmsg img", e => e.length), 0);
eq("hand result is stale", await p.$$eval(".stalemsg", e => e.length), 1);
eq("no external requests", external, []);
await b.close();
if (bad) process.exit(1);
console.log("phase 2 step 3: mean, s (n and n-1), standard error and combined error match the hand values in the real page");
