// Phase 1 step 6 (inputs moved to the general derived-quantity form in Phase 2 step 7; every expected number is unchanged).
// P3 Elasticity, Young's modulus from the fitted slope with propagated uncertainty.
// Expected numbers were calculated by hand/in plain Python from the textbook formulas (weighted line fit, then
// E = 4L/(pi d^2 a) and u(E)/E = sqrt((uL/L)^2 + (2ud/d)^2 + (ua/a)^2)), not by the app or SciPy:
//   a = 0.0252857 mm/N, b = 0.00667 mm (u 0.0113 scaled), u(a) unscaled 0.000478091, scaled 0.000290437, chi2/DoF = 0.369048
//   E = 201.416 GPa, u(E) unscaled 8.9205, scaled 8.3919.
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { serve } from "./serve.mjs";
import { chromium } from "./tools.mjs";
const { deriveQuantity } = createRequire(import.meta.url)("../app/derived.js");
let bad = 0;
const eq = (name, got, want) => {
  got = JSON.stringify(got); want = JSON.stringify(want);
  if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; }
};
// The formula on its own, with a case that can be checked in the head: L = 1 m, d = 1 mm, a = 1 mm/N -> E = 4/pi GPa,
// all three relative errors 10 % -> u(E)/E = sqrt(0.01 + 0.04*... ) : uL/L = 0.1, 2ud/d = 0.2 (ud = 0.1), ua/a = 0.2 -> sqrt(0.01+0.04+0.04) = 0.3
const t = deriveQuantity("4*L/(pi*d^2*a)", { a: { value: 1, u: 0.2 }, b: { value: 0, u: 0 } }, [{ name: "L", value: 1, u: 0.1 }, { name: "d", value: 1, u: 0.1 }]);
eq("formula E", Math.abs(t.value - 4 / Math.PI) < 1e-12, true);
eq("formula uE/E", Math.abs(t.u / t.value - 0.3) < 1e-8, true);

const { base, close } = await serve();
const br = await chromium.launch();
const p = await br.newPage({ viewport: { width: 1200, height: 2300 } });
await p.goto(base + "app/app.html");
await p.evaluate(() => localStorage.clear());
await p.reload();
const lines = () => p.$$eval("#results .res", e => e.map(x => x.textContent));
const how = () => p.$$eval("#results [data-how]", e => e.map(x => x.textContent));
const dmsg = async () => (await p.isVisible("#derivemsg")) ? await p.textContent("#derivemsg") : null;

await p.click("#example2");
await p.waitForFunction(() => !document.getElementById("fit").disabled, null, { timeout: 120000 });
eq("example loads the E template", await p.$$eval("#derived input", e => e.map(x => x.value)), ["E", "GPa", "4*L/(pi*d^2*a)", "L = 1 ± 0,002; d = 0,5 ± 0,01", "mm/N"]);

// Bad: no fit yet.
await p.click("#derive");
eq("needs a fit first", await dmsg(), "Bitte zuerst „Anpassen“ drücken. Das Ergebnis der Geradenanpassung fehlt oder ist veraltet.");

await p.click("#fit");
await p.waitForSelector("#results .res");
// Bad: an input missing.
await p.fill("#d_vars", "L = 1 ± 0,002");
await p.click("#derive");
eq("missing d", await dmsg(), "Unbekannte Größe „d“ in der Formel. Verfügbar: a, b, L. Erlaubt sind a, b und die weiteren Größen.");
await p.fill("#d_vars", "L = 1 ± abc; d = 0,5 ± 0,01");
await p.click("#derive");
eq("text instead of a number", await dmsg(), "„L = 1 ± abc“: Die Unsicherheit „abc“ ist keine Zahl größer oder gleich 0.");
await p.fill("#d_vars", "L = 1 ± 0,002; d = 0,5 ± 0,01");

// Weighted fit, scaled errors (default).
await p.click("#derive");
eq("no message when it works", await dmsg(), null);
eq("two results", await lines(), ["a = (0,02529 ± 0,00029) mm/N", "b = (0,007 ± 0,011) mm", "E = (201 ± 8) GPa"]);
let d = (await how()).at(-1);
eq("contributions scaled", ["0,2 %", "4 %", "1,15 %"].every(s => d.includes(s)), true);
eq("formula named", d.includes("E = 4*L/(pi*d^2*a)"), true);
await p.screenshot({ path: "evidence/phase1-step6-elasticity.png", fullPage: true });

// Unscaled error of the slope.
await p.selectOption("#errm", "unscaled");
eq("E with unscaled slope error", (await lines()).at(-1), "E = (201 ± 9) GPa");
d = (await how()).at(-1);
eq("contributions unscaled", ["0,2 %", "4 %", "1,89 %"].every(s => d.includes(s)), true);
eq("still fresh after changing only the method", await p.$$eval(".stalemsg", e => e.length), 0);

// Changing an input marks E as out of date (the fit stays fresh); computing again clears it.
await p.fill("#d_vars", "L = 1 ± 0,002; d = 0,6 ± 0,01");
eq("only E is stale after an input change", await p.$$eval(".result", r => r.map(x => x.classList.contains("stale"))), [false, true]);
await p.click("#derive");
eq("E with d = 0,6 mm: 201,416·(0,5/0,6)² = 139,9 GPa", (await lines()).at(-1).startsWith("E = (140 ± "), true);
// Undo goes back through the recompute and the input change.
await p.click("#undo"); await p.click("#undo");
eq("undo restores d", await p.inputValue("#d_vars"), "L = 1 ± 0,002; d = 0,5 ± 0,01");
eq("undo restores E", (await lines()).at(-1), "E = (201 ± 9) GPa");
eq("fresh again", await p.$$eval(".stalemsg", e => e.length), 0);

// Data edit: both results out of date; E button refuses until refitted.
await p.fill('input[data-r="0"][data-c="1"]', "0,3");
eq("both stale after a data edit", await p.$$eval(".result", r => r.map(x => x.classList.contains("stale"))), [true, true]);
await p.click("#derive");
eq("refuses with a stale fit", await dmsg(), "Bitte zuerst „Anpassen“ drücken. Das Ergebnis der Geradenanpassung fehlt oder ist veraltet.");
await p.click("#undo");

// Survives a reload.
await p.reload();
await p.waitForSelector("#results .res");
eq("restored after reload", (await lines()).at(-1), "E = (201 ± 9) GPa");
eq("inputs restored", await p.inputValue("#d_vars"), "L = 1 ± 0,002; d = 0,5 ± 0,01");

// Wrong units: clear message.
await p.click("#example");
await p.waitForFunction(() => !document.getElementById("fit").disabled);
await p.click("#fit"); await p.waitForSelector("#results .res");
await p.click("#d_tE");
await p.click("#derive");
eq("wrong units", await dmsg(), "Die Formel erwartet a in mm/N, die Anpassung liefert a in V/s. Bitte die Einheiten der x- und y-Spalte prüfen.");
await p.screenshot({ path: "evidence/phase1-step6-error.png", fullPage: true });
await br.close(); close();
if (bad) process.exit(1);
console.log("phase 1 step 6: E from the fitted slope with propagated uncertainty matches the hand calculation; stale, undo and bad input handled");
