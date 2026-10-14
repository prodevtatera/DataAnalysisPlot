// Phase 2 step 12: confidence interval of a mean with the t distribution (P9).
// Sample 9,8 10,1 10,0 10,3 9,9: mean 10,02, Σ(x-x̄)² = 0,148, s = 0,192354, s/√n = 0,0860233 (tests/reference/ci_t.py, exact fractions).
// t values come from the printed two-sided table (6 digits), never from the app: t(0,975; 4) = 2,776445, t(0,95; 4) = 2,131847, t(0,995; 4) = 4,604095.
// 95 %: u = 2,776445 · 0,0860233 = 0,238839 -> HU format (10,02 ± 0,24), interval [9,78; 10,26].
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { writeFileSync, readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
const req = createRequire(import.meta.url);
import { chromium } from "./tools.mjs";
const { tCrit, tCentral } = req("../app/stats.js");
const { newProject, save, statsSettings } = req("../app/project.js");
let bad = 0;
const eq = (name, got, want) => {
  got = JSON.stringify(got); want = JSON.stringify(want);
  if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; }
};
const near = (name, got, want, tol) => {
  if (!(Math.abs(got - want) <= tol)) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; }
};

// Pure function against the printed table: [two-sided level, degrees of freedom, t].
for (const [c, v, t] of [[0.95, 1, 12.706205], [0.95, 2, 4.302653], [0.95, 3, 3.182446], [0.95, 4, 2.776445], [0.95, 5, 2.570582], [0.95, 9, 2.262157], [0.95, 10, 2.228139],
  [0.95, 20, 2.085963], [0.95, 30, 2.042272], [0.95, 120, 1.979930], [0.90, 4, 2.131847], [0.90, 10, 1.812461], [0.99, 4, 4.604095], [0.99, 10, 3.169273], [0.99, 2, 9.924843]]) {
  near(`t(${c}; ${v})`, tCrit(c, v), t, 2e-6);
}
// Closed forms by hand: one degree of freedom is the Cauchy distribution, t = tan(π·c/2); two degrees: t = c·√2/√(1-c²).
near("df 1 closed form", tCrit(0.95, 1), Math.tan(Math.PI * 0.95 / 2), 1e-9);
near("df 2 closed form", tCrit(0.9, 2), 0.9 * Math.SQRT2 / Math.sqrt(1 - 0.81), 1e-9);
// The probability inside ±t is 0 at 0 and rises towards 1.
near("central at 0", tCentral(0, 4), 0, 1e-12); near("central far out", tCentral(1e6, 7), 1, 1e-9);

// Real page.
const dir = mkdtempSync(resolve(tmpdir(), "p2s12-"));
const hand = newProject(["x / mL"], [[1], [2], [3]]);
hand.settings.stats = { col: "x / mL", ddof: 1, conf: "<img src=x onerror=window.pwn=1>" };
hand.results.push({ kind: "stats", inputs: { col: "x / mL", ddof: 1, conf: 0.95 }, n: 3, ci: { level: "<script>window.pwn=2</script>", df: "<img src=x onerror=window.pwn=3>", t: 1, lo: 0, hi: 1 },
  params: [{ name: "x", unit: "<img src=x onerror=window.pwn=4>", value: 1, u: 0.1 }], computedFrom: "x" });
hand.results.push({ kind: "stats", inputs: { col: "x / mL", ddof: 1, conf: 0.95 }, n: 3, ci: { level: 0.95, df: 2, t: 4.3, lo: 0, hi: 1 },
  params: [{ name: "x", unit: "<img src=x onerror=window.pwn=5>", value: 1, u: 0.1 }], computedFrom: "x" });
writeFileSync(dir + "/hand.plotlab", save(hand));
eq("hand-edited level is ignored", statsSettings(hand).conf, undefined);

const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1200, height: 2300 } })).newPage();
const external = [];
p.on("request", r => { if (!r.url().startsWith("file:")) external.push(r.url()); });
await p.goto(pathToFileURL(resolve("app/index.html")).href);
const lines = () => p.$$eval("#results .res", e => e.map(x => x.textContent));
const go = () => p.click("#s_go");
const msg = () => p.textContent("#statsmsg");
const ci = () => p.textContent("#results [data-ci]");

await p.fill("#paste", "l / mm\n9,8\n10,1\n10,0\n10,3\n9,9");
await p.click("#pastego");
eq("default is no interval", await p.evaluate(() => $("s_conf").value), "");
await go();
eq("no interval line without a level", (await lines()).length, 3);
await p.selectOption("#s_conf", "0.95");
eq("stale after choosing a level", await p.$$eval(".stalemsg", e => e.length), 1);
await go();
eq("95 % lines", await lines(), ["Mittelwert x̄ = (10,02 ± 0,09) mm", "Standardabweichung s (Teiler n−1) = 0,192 mm", "Standardfehler des Mittelwerts s/√n = 0,086 mm", "Mittelwert x̄ mit 95 %-Vertrauensintervall = (10,02 ± 0,24) mm"]);
eq("95 % detail", await ci(), "95 %-Vertrauensintervall: x̄ ± t·s/√n mit t(0,975; 4) = 2,776 (zweiseitig, Student-Verteilung, 4 Freiheitsgrade). Intervall: [9,78; 10,26] mm.");
await p.screenshot({ path: "evidence/phase2-step12-ci.png", fullPage: true });
const r = await p.evaluate(() => proj.results.find(q => q.kind === "stats"));
near("stored t", r.ci.t, 2.776445, 2e-6); near("stored lower", r.ci.lo, 9.781161, 2e-5); near("stored upper", r.ci.hi, 10.258839, 2e-5); eq("stored df", r.ci.df, 4);

// 90 % and 99 % against the hand values of tests/reference/ci_t.py.
await p.selectOption("#s_conf", "0.9"); await go();
eq("90 % line", (await lines())[3], "Mittelwert x̄ mit 90 %-Vertrauensintervall = (10,02 ± 0,18) mm");
eq("90 % detail", await ci(), "90 %-Vertrauensintervall: x̄ ± t·s/√n mit t(0,95; 4) = 2,132 (zweiseitig, Student-Verteilung, 4 Freiheitsgrade). Intervall: [9,84; 10,20] mm.");
await p.selectOption("#s_conf", "0.99"); await go();
eq("99 % line", (await lines())[3], "Mittelwert x̄ mit 99 %-Vertrauensintervall = (10,0 ± 0,4) mm");
eq("99 % detail", await ci(), "99 %-Vertrauensintervall: x̄ ± t·s/√n mit t(0,995; 4) = 4,604 (zweiseitig, Student-Verteilung, 4 Freiheitsgrade). Intervall: [9,6; 10,4] mm.");

// n = 10 readings (burette, step 3): t(0,975; 9) = 2,262157, sem = 0,00816497 -> u = 0,0184700 -> (10,110 ± 0,018) mL.
await p.fill("#paste", "V / mL\n" + [10.12, 10.08, 10.15, 10.10, 10.11, 10.09, 10.14, 10.07, 10.13, 10.11].map(x => String(x).replace(".", ",")).join("\n"));
await p.click("#pastego");
await p.selectOption("#s_conf", "0.95"); await go();
eq("n = 10 line", (await lines())[3], "Mittelwert x̄ mit 95 %-Vertrauensintervall = (10,110 ± 0,018) mL");

// Instrument error and interval together; undo of the level; reload; save and open.
await p.fill("#s_instr", "0,02"); await go();
eq("instrument error line still there", (await lines()).length, 5);
await p.selectOption("#s_conf", ""); 
eq("stale after removing the level", await p.$$eval(".stalemsg", e => e.length), 1);
await p.click("#undo");
eq("undo brings the level back", await p.evaluate(() => $("s_conf").value), "0.95");
eq("fresh after undo", await p.$$eval(".stalemsg", e => e.length), 0);
await p.fill('input[data-r="0"][data-c="0"]', "10,2");
eq("stale after edit", await p.$$eval(".stalemsg", e => e.length), 1);
await p.click("#undo");
await p.reload(); await p.waitForSelector("#results .res");
eq("after reload", [(await lines())[4], await p.evaluate(() => $("s_conf").value)], ["Mittelwert x̄ mit 95 %-Vertrauensintervall = (10,110 ± 0,018) mL", "0.95"]);
const [dl] = await Promise.all([p.waitForEvent("download"), p.click("#saveproj")]);
writeFileSync(dir + "/saved.plotlab", readFileSync(await dl.path()));
await p.click("#example"); await p.setInputFiles("#openfile", dir + "/saved.plotlab"); await p.waitForSelector("#results .res");
eq("after save and open", [(await lines())[4], await p.evaluate(() => $("s_conf").value)], ["Mittelwert x̄ mit 95 %-Vertrauensintervall = (10,110 ± 0,018) mL", "0.95"]);

// Bad input: one value gives no interval, and a missing level adds no line.
await p.fill("#paste", "a;b\n1;\n2;5");
await p.click("#pastego");
await p.selectOption("#s_col", "b"); await go();
eq("one value", await msg(), "Die Spalte „b“ hat 1 Wert. Mittelwert und Streuung brauchen mindestens zwei Werte.");
eq("no result for bad input", await p.evaluate(() => proj.results.length), 0);
// Two values: df = 1 gives the huge factor 12,706 (the page must not hide it): u = 12,706, interval 2 -10,706 .. 2 + 12,706 = [-11; 15] after rounding to 2 digits.
await p.fill("#paste", "a / s\n1\n3");
await p.click("#pastego"); await p.selectOption("#s_conf", "0.95"); await go();
eq("two values", await ci(), "95 %-Vertrauensintervall: x̄ ± t·s/√n mit t(0,975; 1) = 12,71 (zweiseitig, Student-Verteilung, 1 Freiheitsgrad). Intervall: [-11; 15] s.");
await p.screenshot({ path: "evidence/phase2-step12-error.png", fullPage: true });

// Hand-edited project: nothing in names, level or interval runs.
await p.setInputFiles("#openfile", dir + "/hand.plotlab");
await p.waitForSelector("#results .res");
eq("no script ran", await p.evaluate(() => window.pwn), undefined);
eq("no injected elements", await p.$$eval("#results img, #results script, #stats img, #stats script", e => e.length), 0);
eq("no external requests", external, []);
await b.close();
if (bad) process.exit(1);
console.log("phase 2 step 12: t confidence interval of a mean matches the table and hand values in the real page");
