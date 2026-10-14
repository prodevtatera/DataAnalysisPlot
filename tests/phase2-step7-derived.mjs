// Phase 2 step 7: a general derived quantity from the fit parameters a and b with Gaussian propagation (P3, P4, P5, P9).
// Pure cases are worked out by hand (derivatives in each comment). The P9 numbers come from tests/reference/derived_g.py
// (exact fractions, own formulas), never from the app, SciPy or the library the app uses. The P3 numbers (E = (201 ± 8) GPa)
// are checked in tests/phase1-step6-elasticity.mjs through the same code.
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { mkdtempSync, writeFileSync } from "node:fs";
import { serve } from "./serve.mjs";
const req = createRequire(import.meta.url);
const { parseDerivedVars, deriveQuantity } = req("../app/derived.js");
const { newProject, save } = req("../app/project.js");
import { chromium } from "./tools.mjs";
let bad = 0;
const eq = (name, got, want) => {
  got = JSON.stringify(got); want = JSON.stringify(want);
  if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; }
};
const near = (name, got, want, tol = 1e-7) => { if (!(Math.abs(got - want) <= tol * Math.abs(want))) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; } };

// --- pure function, a = 2 ± 0,1 and b = 3 ± 0,2 ---
const fit = { a: { value: 2, u: 0.1, unit: "s" }, b: { value: 3, u: 0.2, unit: "m" } };
const run = (f, vars = []) => deriveQuantity(f, fit, vars);
// a·b: partials b = 3 and a = 2: u = √((3·0,1)² + (2·0,2)²) = √(0,09 + 0,16) = 0,5; shares 0,3/6 = 0,05 and 0,4/6.
let r = run("a*b");
near("a*b value", r.value, 6); near("a*b u", r.u, 0.5);
near("share a", r.parts[0].share, 0.05); near("share b", r.parts[1].share, 0.4 / 6);
// a/b: partials 1/b = 1/3 and -a/b² = -2/9: u² = (0,1/3)² + (0,4/9)² = 1/900 + 16/810... = 9/8100 + 16/8100 = 1/324, u = 1/18.
near("a/b u", run("a/b").u, 1 / 18);
// zero crossing -b/a with independent a, b: partials b/a² = 0,75 and -1/a = -0,5: u² = 0,075² + 0,1² = 0,015625, u = 0,125.
r = run("-b/a"); near("-b/a value", r.value, -1.5); near("-b/a u", r.u, 0.125);
// b alone: u = 0,2 exactly (and a is not listed in used).
r = run("b"); near("b u", r.u, 0.2); eq("only b used", r.used.map(q => q.name), ["b"]);
// A further quantity with no uncertainty is exact: 5·a gives 0,5; with "k = 5 ± 0,2": u² = (5·0,1)² + (2·0,2)² = 0,41.
near("exact var", run("k*a", [{ name: "k", value: 5, u: 0 }]).u, 0.5);
near("var with u", run("k*a", [{ name: "k", value: 5, u: 0.2 }]).u, Math.sqrt(0.41));
// 4π²/a: partial -4π²/a², relative error u(a)/a = 0,05 -> u = 4π²/2·0,05.
r = run("4*pi^2/a"); near("4pi^2/a", r.value, 2 * Math.PI ** 2); near("4pi^2/a u", r.u, 2 * Math.PI ** 2 * 0.05);
// Everything exact: u is 0 and no shares.
r = deriveQuantity("2*a", { a: { value: 2, u: 0 }, b: { value: 1, u: 0 } }, []); eq("u 0", [r.u, r.parts], [0, []]);
// Bad formulas give a message, never a number.
eq("no a or b", run("5").error, "Die Formel muss a oder b (die Fit-Parameter) enthalten.");
eq("division by zero", run("1/(a-a)").error, "Die Formel lässt sich nicht berechnen: Division durch 0.");
eq("negative root", run("sqrt(0-a)").error, "Die Formel lässt sich nicht berechnen: Wurzel aus einer negativen Zahl.");
eq("unknown name", run("a*x").error, "Unbekannte Größe „x“ in der Formel. Verfügbar: a, b. Erlaubt sind a, b und die weiteren Größen.");
eq("code is not run", /Unbekannte Funktion/.test(run("alert(1)+a").error), true);
eq("empty", /Bitte eine Formel/.test(run("  ").error), true);
// Further quantities: German and English decimals, +- as a plain ±, missing u means exact.
eq("vars", parseDerivedVars("L = 1,5 +- 0,1; d=2; m = 3 ± 0.5").vars, [{ name: "L", value: 1.5, u: 0.1 }, { name: "d", value: 2, u: 0 }, { name: "m", value: 3, u: 0.5 }]);
eq("vars empty", parseDerivedVars("").vars, []);
eq("no equals", parseDerivedVars("L 1").error, "„L 1“: Es fehlt ein „=“. Schreibe zum Beispiel L = 1 ± 0,002.");
eq("reserved", /schon vergeben/.test(parseDerivedVars("a = 1").error), true);
eq("duplicate", parseDerivedVars("L = 1; L = 2").error, "Die Größe „L“ ist doppelt angegeben.");
eq("negative u", /Unsicherheit „-1“/.test(parseDerivedVars("L = 1 ± -1").error), true);
eq("two ±", parseDerivedVars("L = 1 ± 2 ± 3").error, "„L = 1 ± 2 ± 3“: Es darf nur ein ± vorkommen.");
eq("not a number", parseDerivedVars("L = x").error, "„L = x“: „x“ ist keine Zahl.");
eq("bad name", /kein gültiger Name/.test(parseDerivedVars("1x = 3").error), true);

// --- the real page: P9, g from the slope of T² against l ---
// Reference (derived_g.py), weighted: a = 3,993310573, u(a) scaled 0,036276593 / unscaled 0,061192263, g = 9,886137551,
// u(g) scaled 0,089809041 / unscaled 0,151492132; b = 0,021146486 (u scaled 0,026629525), x0 = -b/a = -0,005295477 (u scaled 0,006668707).
// Unweighted (all sigma equal): a = 3,996, u(a) = 0,037735925, g = 9,879483885, u(g) = 0,093296161.
const { base, close } = await serve();
const dir = mkdtempSync(resolve(tmpdir(), "p2s7-"));
const hand = newProject(["l / m", "T² / s²", "sT² / s²"], [[0.25, 1, 0.1], [0.5, 2, 0.1]]);
hand.settings.derived = { name: "<img src=x onerror=window.pwn=1>", unit: "<script>window.pwn=2</script>", formula: "<img src=x onerror=window.pwn=3>", vars: 7, aUnit: null };
hand.results.push({ kind: "derived", weighted: true, formula: "<img src=x onerror=window.pwn=4>", used: [{ name: "<img src=x onerror=window.pwn=5>", value: "<script>window.pwn=6</script>", u: "<img src=x onerror=window.pwn=7>", unit: "<img src=x onerror=window.pwn=8>" }],
  partsScaled: [{ name: "<img src=x onerror=window.pwn=9>", share: "<script>window.pwn=10</script>" }], partsUnscaled: "<img src=x onerror=window.pwn=11>",
  params: [{ name: "<img src=x onerror=window.pwn=12>", unit: "<script>window.pwn=13</script>", value: 1, uScaled: 0.1, uUnscaled: 0.1 }], computedFrom: "x" });
writeFileSync(dir + "/hand.plotlab", save(hand));

const br = await chromium.launch();
const p = await (await br.newContext({ viewport: { width: 1200, height: 2900 } })).newPage();
const external = [];
p.on("request", q => { if (!q.url().startsWith(base) && !q.url().startsWith("data:") && !q.url().startsWith("blob:")) external.push(q.url()); });
await p.goto(base + "app/index.html");
await p.evaluate(() => localStorage.clear());
await p.reload();
const lines = () => p.$$eval("#results .res", e => e.map(x => x.textContent));
const how = async () => (await p.$$eval("#results [data-how]", e => e.map(x => x.textContent))).at(-1);
const dmsg = async () => (await p.isVisible("#derivemsg")) ? await p.textContent("#derivemsg") : null;
const stale = () => p.$$eval(".result", r => r.map(x => x.classList.contains("stale")));

await p.fill("#paste", "l / m;T² / s²;sT² / s²\n0,25;1,02;0,04\n0,50;2,01;0,04\n0,75;3,05;0,05\n1,00;3,98;0,05\n1,25;5,03;0,06");
await p.click("#pastego");
await p.waitForFunction(() => !document.getElementById("fit").disabled, null, { timeout: 120000 });
await p.click("#derive");
eq("needs a fit first", await dmsg(), "Bitte zuerst „Anpassen“ drücken. Das Ergebnis der Geradenanpassung fehlt oder ist veraltet.");
await p.click("#fit"); await p.waitForSelector("#results .res");
eq("fit a", (await lines())[0], "a = (3,99 ± 0,04) s²/m");

// Empty template fields: clear messages.
await p.click("#derive");
eq("name missing", await dmsg(), "Bitte einen Namen für die Größe eintragen, zum Beispiel E.");
await p.click("#d_tg");
eq("template g", await p.$$eval("#derived input", e => e.map(x => x.value)), ["g", "m/s²", "4*pi^2/a", "", "s²/m"]);
await p.click("#derive");
eq("no message when it works", await dmsg(), null);
eq("g scaled, HU format", (await lines()).at(-1), "g = (9,89 ± 0,09) m/s²");
let d = await how();
eq("detail formula and inputs", d.includes("g = 4*pi^2/a") && d.includes("Eingesetzt: a = 3,99331 s²/m."), true);
eq("share of a scaled 0,908 %", d.includes("Beiträge zu u(g)/|g|: a: 0,908 %"), true);
eq("no a-b warning when only a is used", d.includes("Hinweis"), false);
await p.screenshot({ path: "evidence/phase2-step7-derived.png", fullPage: true });

await p.selectOption("#errm", "unscaled");
eq("g unscaled", (await lines()).at(-1), "g = (9,89 ± 0,15) m/s²");
eq("share of a unscaled 1,53 %", (await how()).includes("a: 1,53 %"), true);
await p.selectOption("#errm", "scaled");

// Editing the formula, unit or name marks only the derived result out of date; undo makes it fresh again.
await p.fill("#d_unit", "m/s^2");
eq("stale after unit change, fit still fresh", await stale(), [false, true]);
await p.click("#undo");
eq("undo restores unit and freshness", [await p.inputValue("#d_unit"), await stale()], ["m/s²", [false, false]]);
await p.fill("#d_formula", "4*pi^2/a/1");
eq("stale after formula change", await stale(), [false, true]);
await p.click("#derive");
eq("recomputed", [(await lines()).at(-1), await stale()], ["g = (9,89 ± 0,09) m/s²", [false, false]]);

// a and b together: the zero crossing x0 = -b/a with the independence note.
await p.fill("#d_name", "x0"); await p.fill("#d_unit", "m"); await p.fill("#d_formula", "-b/a"); await p.fill("#d_aunit", "");
await p.click("#derive");
eq("x0", (await lines()).at(-1), "x0 = (-0,005 ± 0,007) m");
d = await how();
eq("x0 detail names the independence assumption", d.includes("Hinweis: a und b werden als unabhängig behandelt"), true);
await p.selectOption("#errm", "unscaled");
eq("x0 unscaled (0,01125)", (await lines()).at(-1), "x0 = (-0,005 ± 0,011) m");
await p.selectOption("#errm", "scaled");

// A further quantity: g from a template-like custom formula with a length scale, k = 2 ± 0,1: u(k·a) = √((2·0,03628)² + (3,9933·0,1)²) = 0,40587 (HU: one digit, 0,4).
await p.fill("#d_name", "y"); await p.fill("#d_unit", ""); await p.fill("#d_formula", "k*a"); await p.fill("#d_vars", "k = 2 ± 0,1");
await p.click("#derive");
eq("custom quantity with a further input", (await lines()).at(-1), "y = (8,0 ± 0,4)");
eq("detail lists k", (await how()).includes("k = 2 ± 0,1"), true);

// Bad input: each gives a message and adds no result.
const n0 = (await lines()).length;
const bads = [
  ["#d_formula", "a*x", "Unbekannte Größe „x“ in der Formel. Verfügbar: a, b, k. Erlaubt sind a, b und die weiteren Größen."],
  ["#d_formula", "7", "Die Formel muss a oder b (die Fit-Parameter) enthalten."],
  ["#d_formula", "1/(a-a)", "Die Formel lässt sich nicht berechnen: Division durch 0."],
  ["#d_formula", "alert(1)*a", "Unbekannte Funktion „alert“. Erlaubt: sqrt, ln, log10, exp, abs, sin, cos, tan, wurzel."],
  ["#d_vars", "k = zwei", "„k = zwei“: „zwei“ ist keine Zahl."],
  ["#d_aunit", "kg", "Die Formel erwartet a in kg, die Anpassung liefert a in s²/m. Bitte die Einheiten der x- und y-Spalte prüfen."],
];
await p.fill("#d_formula", "k*a");
for (const [sel, text, want] of bads) {
  const keep = await p.inputValue(sel);
  await p.fill(sel, text); await p.click("#derive");
  eq("message for " + text, await dmsg(), want);
  eq("no result added for " + text, (await lines()).length, n0);
  await p.fill(sel, keep);
}
await p.fill("#d_formula", "a*x"); await p.click("#derive");
await p.screenshot({ path: "evidence/phase2-step7-error.png", fullPage: true });
await p.fill("#d_formula", "4*pi^2/a"); await p.fill("#d_vars", ""); await p.fill("#d_name", "g"); await p.fill("#d_unit", "m/s²");
await p.click("#derive");

// A data edit makes both out of date and the button refuses until refitted.
await p.fill('input[data-r="0"][data-c="1"]', "1,1");
eq("both stale after a data edit", await stale(), [true, true]);
await p.click("#derive");
eq("refuses with a stale fit", await dmsg(), "Bitte zuerst „Anpassen“ drücken. Das Ergebnis der Geradenanpassung fehlt oder ist veraltet.");
await p.click("#undo");
eq("fresh again after undo", await stale(), [false, false]);

// Reload keeps settings and result.
await p.click("#derive");
await p.reload(); await p.waitForSelector("#results .res");
eq("restored after reload", [(await lines()).at(-1), await p.inputValue("#d_formula")], ["g = (9,89 ± 0,09) m/s²", "4*pi^2/a"]);
// Save and open in a fresh page gives the same line.
await p.waitForFunction(() => !document.getElementById("fit").disabled, null, { timeout: 120000 });
const [dl] = await Promise.all([p.waitForEvent("download"), p.click("#saveproj")]);
await dl.saveAs(dir + "/saved.plotlab");
await p.click("#example");
await p.setInputFiles("#openfile", dir + "/saved.plotlab");
await p.waitForSelector("#results .res");
eq("save and open", [(await lines()).at(-1), await stale()], ["g = (9,89 ± 0,09) m/s²", [false, false]]);

// Unweighted fit: ordinary least squares, g = (9,88 ± 0,09) m/s² (u from the scatter of the points).
await p.setChecked("#weighted", false);
await p.click("#fit"); await p.waitForFunction(() => document.querySelectorAll("#results .res").length >= 2 && !document.getElementById("fit").disabled);
await p.click("#derive");
eq("unweighted g", (await lines()).at(-1), "g = (9,88 ± 0,09) m/s²");
eq("unweighted detail", (await how()).includes("Beiträge zu u(g)/|g|: a: 0,944 %"), true); // 0,037735925 / 3,996 = 0,0094433

// A hand-edited project with script text everywhere: shown as text, nothing runs.
await p.setInputFiles("#openfile", dir + "/hand.plotlab");
// Wait for the hand-edited project itself (old results are on screen already, so a selector alone races with the file read).
await p.waitForFunction(() => proj.settings.derived.name.startsWith("<img"));
await p.waitForSelector("#results .res");
eq("no script ran", await p.evaluate(() => window.pwn), undefined);
eq("no injected elements", await p.$$eval("#results img, #results script, #derived img, #derived script, #derivemsg img", e => e.length), 0);
eq("hand result is stale", await p.$$eval(".stalemsg", e => e.length), 1);
eq("no external requests", external, []);
await br.close(); close();
if (bad) process.exit(1);
console.log("phase 2 step 7: derived quantity g = (9,89 ± 0,09) m/s² and the E template match the hand values; propagation, stale, undo, bad input and injection handled");
