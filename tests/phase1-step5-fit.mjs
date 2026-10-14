// Phase 1 step 5: column roles and the line fit in app/. SciPy runs in a worker, so the page comes from a local server.
// Expected values are closed-form textbook formulas (Taylor, "An Introduction to Error Analysis", ch. 8; ordinary least squares), never SciPy.
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { serve } from "./serve.mjs";
const { newProject, addResult, save } = createRequire(import.meta.url)("../app/project.js");
import { chromium } from "./tools.mjs";
let bad = 0;
const eq = (name, got, want) => {
  got = JSON.stringify(got); want = JSON.stringify(want);
  if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; }
};
const near = (name, got, want, tol) => {
  if (!(Math.abs(got - want) <= tol * Math.abs(want))) { console.log(`FAIL ${name}: got ${got}, want ${want} (rel tol ${tol})`); bad++; }
};
const num = s => Number(s.replace(/\./g, "").replace(",", "."));

const x = [1, 2, 3, 4, 5], y = [2.1, 4.3, 6.2, 8.4, 9.9], sy = [0.2, 0.2, 0.3, 0.3, 0.4];
const S = a => a.reduce((p, q) => p + q, 0);
// weighted
const w = sy.map(s => 1 / (s * s)), Sw = S(w), Sx = S(w.map((v, i) => v * x[i])), Sy = S(w.map((v, i) => v * y[i]));
const Sxx = S(w.map((v, i) => v * x[i] ** 2)), Sxy = S(w.map((v, i) => v * x[i] * y[i])), D = Sw * Sxx - Sx ** 2;
const a = (Sw * Sxy - Sx * Sy) / D, b = (Sxx * Sy - Sx * Sxy) / D, ua = Math.sqrt(Sw / D), ub = Math.sqrt(Sxx / D);
const chi2 = S(w.map((v, i) => v * (y[i] - a * x[i] - b) ** 2)), k = Math.sqrt(chi2 / 3);
// ordinary least squares
const n = 5, mx = S(x) / n, my = S(y) / n, sxx = S(x.map(v => (v - mx) ** 2)), sxy = S(x.map((v, i) => (v - mx) * (y[i] - my)));
const a0 = sxy / sxx, b0 = my - a0 * mx, ssr = S(x.map((v, i) => (y[i] - a0 * v - b0) ** 2)), s2 = ssr / 3;
const ua0 = Math.sqrt(s2 / sxx), ub0 = Math.sqrt(s2 * (1 / n + mx * mx / sxx));

const { base, close } = await serve();
const br = await chromium.launch();
const p = await br.newPage({ viewport: { width: 1200, height: 1900 } });
const external = [];
p.on("request", r => { if (!r.url().startsWith(base) && !r.url().startsWith("blob:") && !r.url().startsWith("data:")) external.push(r.url()); });
await p.goto(base + "app/app.html");
await p.evaluate(() => localStorage.clear());
await p.reload();
const cell = (r, c) => `input[data-r="${r}"][data-c="${c}"]`;
const rowsOf = () => p.$$eval("#results tbody tr", t => t.map(r => [...r.children].map(c => c.textContent)));
const traces = () => p.evaluate(() => document.getElementById("plot").data.map(t => t.name));
const fit = async () => { await p.click("#fit"); await p.waitForFunction(() => !document.getElementById("fit").disabled); };

eq("fit is off before data", await p.isDisabled("#fit"), true);
await p.click("#example");
await p.waitForFunction(() => !document.getElementById("fit").disabled, null, { timeout: 120000 });

// Roles are chosen in the table header and stored in the project.
eq("default roles shown", await p.$$eval("select.role", s => s.map(e => e.value)), ["x", "y", "yerr"]);
await p.selectOption('select[data-role="1"]', "x");
eq("taking x frees the old x column", await p.evaluate(() => proj.columns.map(c => c.role)), ["unused", "x", "yerr"]);
await p.selectOption('select[data-role="0"]', "y");
eq("roles swapped", await p.evaluate(() => proj.columns.map(c => c.role)), ["y", "x", "yerr"]);
eq("plot follows roles: x is column U", await p.evaluate(() => document.getElementById("plot").data[0].x), y);
eq("axis titles follow roles", await p.evaluate(() => [document.getElementById("plot").layout.xaxis.title.text, document.getElementById("plot").layout.yaxis.title.text]), ["U / V", "t / s"]);
await p.click("#undo"); await p.click("#undo");
eq("undo restores roles", await p.$$eval("select.role", s => s.map(e => e.value)), ["x", "y", "yerr"]);

// 1. Weighted fit, scaled errors (default).
await fit();
await p.waitForSelector("#results .res");
let rows = await rowsOf();
near("slope a", num(rows[0][1]), a, 1e-6);
near("intercept b", num(rows[1][1]), b, 1e-6);
near("slope error scaled", num(rows[0][2]), ua * k, 1e-5);
near("slope error unscaled", num(rows[0][3]), ua, 1e-5);
near("intercept error scaled", num(rows[1][2]), ub * k, 1e-5);
near("intercept error unscaled", num(rows[1][3]), ub, 1e-5);
let text = await p.textContent("#results");
near("chi2/DoF", num(/χ²\/DoF = ([\d.,]+)/.exec(text)[1]), chi2 / 3, 1e-5);
eq("method named (scaled)", text.includes("gewichtete Methode der kleinsten Quadrate (Gewichte 1/s²); Fehler mit √(χ²/DoF) skaliert") && !text.includes("absolute_sigma") && text.includes("Freiheitsgrade: 3"), true);
const line = await p.$eval("#results .res", e => e.textContent);
eq("result line shape (value ± u) unit", /^a = \(\d+,\d+ ± 0,\d+\) V\/s$/.test(line), true);
// By hand: a = 2,0094, scaled u = 0,0625 -> leading digit 6, one digit: 0,06; value to the same place: 2,01.
eq("result line, hand-rounded", line, "a = (2,01 ± 0,06) V/s");
console.log("scaled result line:", line, "| expected a =", a.toFixed(4), "u =", (ua * k).toFixed(4));
eq("fit line drawn and named", await traces(), ["Messwerte", "Anpassung"]);
await p.screenshot({ path: "evidence/phase1-step5-fit.png", fullPage: true });

// 2. Unscaled errors: the result line uses the other error and says so.
await p.selectOption("#errm", "unscaled");
text = await p.textContent("#results");
eq("method named (unscaled)", text.includes("Fehler unskaliert, direkt aus den Fehlerwerten") && !text.includes("absolute_sigma"), true);
eq("fit is not stale after changing only the error method", await p.$$eval(".stalemsg", e => e.length), 0);
const uline = await p.$eval("#results .res", e => e.textContent);
eq("unscaled line differs from scaled", uline !== line, true);

// 3. Unweighted fit: ordinary least squares.
await p.uncheck("#weighted");
eq("switching weighting makes the old result out of date", await p.$$eval(".stalemsg", e => e.length), 1);
eq("stale: fit line gone", await traces(), ["Messwerte"]);
eq("error method is off when unweighted", await p.isDisabled("#errm"), true);
await fit();
rows = await rowsOf();
near("OLS slope", num(rows[0][1]), a0, 1e-6);
near("OLS intercept", num(rows[1][1]), b0, 1e-6);
near("OLS slope error", num(rows[0][2]), ua0, 1e-5);
near("OLS intercept error", num(rows[1][2]), ub0, 1e-5);
text = await p.textContent("#results");
eq("method named (unweighted)", text.includes("ungewichtet") && !text.includes("χ²/DoF"), true);
near("sum of squares", num(/Abweichungsquadrate = ([\d.,]+)/.exec(text)[1]), ssr, 1e-5);

// 4. Editing data makes it stale; undo makes it fresh again with the curve back.
await p.fill(cell(0, 1), "2,2");
eq("stale after edit", [await p.$$eval(".stalemsg", e => e.length), (await traces()).length], [1, 1]);
await p.click("#undo");
eq("fresh after undo, curve back", [await p.$$eval(".stalemsg", e => e.length), await traces()], [0, ["Messwerte", "Anpassung"]]);

// 5. The result survives a reload (autosave).
await p.reload();
await p.waitForSelector("#results .res");
eq("result restored after reload", await rowsOf().then(r => num(r[0][1])), num(rows[0][1]));

// 6. An edit made while Python is working: result is refused, not attached to new data.
await p.waitForFunction(() => !document.getElementById("fit").disabled, null, { timeout: 120000 });
await p.evaluate(() => {
  document.getElementById("fit").click();
  const c = document.querySelector('input[data-r="0"][data-c="1"]'); c.value = "3"; c.dispatchEvent(new Event("input", { bubbles: true }));
});
await p.waitForFunction(() => !document.getElementById("fitmsg").hidden);
eq("edit during fit refused", await p.textContent("#fitmsg"), "Die Anpassung ist fehlgeschlagen. Die Daten wurden während der Berechnung geändert. Bitte erneut anpassen.");

// 7. Bad input: clear German messages, no traceback.
await p.fill(cell(0, 1), "2,1");
await p.selectOption('select[data-role="2"]', "unused");
eq("no error column: weighting is off and unavailable", [await p.isDisabled("#weighted"), await p.isChecked("#weighted")], [true, false]);
await p.selectOption('select[data-role="2"]', "yerr");
await p.check("#weighted");
await p.fill(cell(2, 2), "0");
await fit();
eq("zero error value", await p.textContent("#fitmsg"), "Die Anpassung ist fehlgeschlagen. Alle Fehlerwerte müssen größer als 0 sein (Zeile 3).");
await p.screenshot({ path: "evidence/phase1-step5-error.png", fullPage: true });
await p.fill(cell(2, 2), "0,3");
await p.selectOption('select[data-role="1"]', "unused");
await fit();
eq("no y column", await p.textContent("#fitmsg"), "Die Anpassung ist fehlgeschlagen. Für die Anpassung braucht es eine x- und eine y-Spalte. Wähle die Rollen in der Tabelle.");
await p.selectOption('select[data-role="1"]', "y");
for (const r of [4, 3, 2]) await p.click(`[data-del="${r}"]`);
await fit();
eq("two points", await p.textContent("#fitmsg"), "Die Anpassung ist fehlgeschlagen. Es braucht mindestens drei Messpunkte mit x und y.");
eq("no raw Python text", /Traceback|File "/.test(await p.textContent("#fitmsg")), false);
// 8. Security: a hand-edited project file must not be able to inject HTML or script through any result field.
const evil = '<img src=x onerror="window.__xss=1">';
const ep = newProject(["t " + evil, "U / V", "s / V"], [[1, 2, 0.1], [2, 4, 0.1], [3, 6, 0.1]]);
addResult(ep, { kind: "fit", model: "line", weighted: true, dof: evil, chi2: evil, n: evil,
  params: [{ name: evil, unit: evil, value: 1, uScaled: 0.1, uUnscaled: evil }] });
const dir = mkdtempSync(resolve(tmpdir(), "p1s5-"));
writeFileSync(dir + "/evil.plotlab", save(ep));
await p.setInputFiles("#openfile", dir + "/evil.plotlab");
await p.waitForSelector("#results .res");
await p.waitForTimeout(300);
eq("no injected element in page", await p.evaluate(() => [document.querySelectorAll("img:not(.logo)").length, window.__xss ?? null]), [0, null]);
await p.reload(); await p.waitForSelector("#results .res"); await p.waitForTimeout(300);
eq("no injected element after autosave restore", await p.evaluate(() => [document.querySelectorAll("img:not(.logo)").length, window.__xss ?? null]), [0, null]);
eq("no external requests", external, []);
await br.close(); close();
if (bad) process.exit(1);
console.log("phase 1 step 5: roles drive plot and fit; weighted and unweighted line fits match closed-form values; method, stale and bad input handled");
