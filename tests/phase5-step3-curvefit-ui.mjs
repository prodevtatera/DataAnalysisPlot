// Phase 5 step 3: the "Kurvenanpassung" tool in the real page, from pasted data to result lines, plot curve, out-of-date handling, undo, save and messages.
// Expected numbers come from tests/reference/curves.py (own solver and exact fractions, no SciPy), never from the app.
import { execFileSync } from "node:child_process";
import { serve } from "./serve.mjs";
import { chromium } from "./tools.mjs";

const cases = JSON.parse(execFileSync("python3", ["-I", "tests/reference/curves.py"], { encoding: "utf8" }));
let bad = 0;
const eq = (name, got, want) => { got = JSON.stringify(got); want = JSON.stringify(want); if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; } else console.log(`ok   ${name}`); };
const yes = (name, v) => eq(name, !!v, true);
const digits = (got, want) => got === want ? 9 : Math.min(9, -Math.log10(Math.abs(got - want) / Math.abs(want)));
const dec = v => String(v).replace(".", ",");

const { base, close } = await serve();
const br = await chromium.launch();
const p = await (await br.newContext({ viewport: { width: 1200, height: 2200 } })).newPage();
const errors = [], external = [];
p.on("pageerror", e => errors.push(String(e)));
p.on("request", r => { if (!r.url().startsWith(base) && !/^(blob|data):/.test(r.url())) external.push(r.url()); });
await p.goto(base + "app/app.html?start=blank");
await p.evaluate(() => localStorage.clear());
await p.reload();
await p.waitForFunction(() => document.getElementById("fitstate").textContent === "Bereit.", null, { timeout: 120000 });

const load = async c => {
  const head = c.sy ? "x / s;y / V;sy / V" : "x / s;y / V";
  await p.fill("#paste", [head, ...c.x.map((v, i) => [v, c.y[i], ...(c.sy ? [c.sy[i]] : [])].map(dec).join(";"))].join("\n"));
  await p.click("#pastego");
  await p.waitForFunction(() => !document.getElementById("cf_go").disabled, null, { timeout: 60000 });
};
const go = async () => { await p.click("#cf_go"); await p.waitForFunction(() => !document.getElementById("cf_go").disabled, null, { timeout: 60000 }); };
const result = () => p.evaluate(() => proj.results.find(r => r.kind === "curvefit") || null);
const stale = () => p.$$eval("#results .stalemsg", e => e.length);
const traces = () => p.evaluate(() => document.getElementById("plot").data.map(t => t.name));
const msg = () => p.evaluate(() => document.getElementById("cfmsg").hidden ? "" : document.getElementById("cfmsg").textContent);
const setModel = async (model, extra = {}) => {
  await p.selectOption("#cf_model", model);
  if (extra.degree) await p.selectOption("#cf_deg", String(extra.degree));
  if (extra.offset !== undefined) await (extra.offset ? p.check("#cf_off") : p.uncheck("#cf_off"));
};

// 1. Every reference case through the page: model, degree and offset chosen in the panel, numbers compared with the reference.
for (const c of cases) {
  await load(c);
  await setModel(c.model, { degree: c.degree, offset: c.offset });
  await go();
  const r = await result();
  if (!r) { console.log(`FAIL ${c.name}: no result, message "${await msg()}"`); bad++; continue; }
  const dv = Math.min(...c.p.map((v, i) => digits(r.params[i].value, v))), de = Math.min(...c.err_scaled.map((v, i) => digits(r.params[i].uScaled, v)));
  const du = c.sy ? Math.min(...c.err_unscaled.map((v, i) => digits(r.params[i].uUnscaled, v))) : 9;
  const ok = dv >= 7 && de >= 6 && du >= 6 && r.dof === c.dof && r.weighted === !!c.sy && r.curve.x.length === 500;
  console.log(`${ok ? "ok  " : "FAIL"} page: ${c.name}: values ${dv.toFixed(1)} digits, errors ${de.toFixed(1)}${c.sy ? `, unscaled ${du.toFixed(1)}` : ""}`);
  if (!ok) bad++;
  yes(`curve drawn for ${c.model}`, (await traces()).some(n => n.startsWith("Anpassung: ")));
}

// 2. One case in detail: exponential with offset, weighted (units, symbols, text, plot).
const E = cases[1];
await load(E);
await setModel("exp", { offset: true });
await go();
const lines = await p.$$eval("#results .res", e => e.map(x => x.textContent));
yes("result line a: (value ± u) V", /^a = \(7,\d+ ± 0,\d+\) V$/.test(lines[0]));
yes("result line τ: (value ± u) s", /^τ = \(2,\d+ ± 0,\d+\) s$/.test(lines[1]));
yes("result line c", /^c = \(1,\d+ ± 0,\d+\) V$/.test(lines[2]));
eq("hand-rounded result lines (1 digit; reference 7,7669 ± 0,0794, 2,5721 ± 0,0669, 1,5643 ± 0,0489, scaled)", lines, ["a = (7,77 ± 0,08) V", "τ = (2,57 ± 0,07) s", "c = (1,56 ± 0,05) V"]);
const detail = await p.textContent("#results");
yes("model named", detail.includes("Exponentialfunktion, y = a·exp(−x/τ) + c"));
yes("method named (nonlinear, weighted, scaled)", detail.includes("nichtlineare Methode der kleinsten Quadrate (Levenberg–Marquardt); gewichtet (Gewichte 1/s²); Fehler mit √(χ²/DoF) skaliert") && detail.includes("Freiheitsgrade: 11"));
yes("start-value warning shown for a nonlinear fit", await p.$$eval("[data-cfnote]", e => e.length === 1));
eq("curve plus data in the plot", await traces(), ["Messwerte", "Anpassung: Exponentialfunktion"]);
await p.selectOption("#errm", "unscaled");
yes("unscaled errors change the result line", (await p.$eval("#results .res", e => e.textContent)) !== lines[0] || (await p.$$eval("#results .res", e => e[1].textContent)) !== lines[1]);
eq("changing only the error method keeps the fit fresh", await stale(), 0);
await p.selectOption("#errm", "scaled");

// 3. Out of date: edit a cell, switch the model, switch weighting; undo brings the result back.
await p.fill('input[data-r="0"][data-c="1"]', "9,5");
eq("edit makes it stale, curve gone", [await stale(), await traces()], [1, ["Messwerte"]]);
await p.click("#undo");
eq("undo: fresh again, curve back", [await stale(), (await traces()).length], [0, 2]);
await p.selectOption("#cf_model", "gauss");
eq("changing the model makes the result stale", await stale(), 1);
await p.click("#undo");
eq("undo restores the model and the fresh result", [await p.inputValue("#cf_model"), await stale()], ["exp", 0]);
await p.uncheck("#cf_off");
eq("offset is part of the key", await stale(), 1);
await p.click("#undo");
await p.uncheck("#weighted");
eq("weighting is part of the key", await stale(), 1);
await p.click("#undo");
await p.selectOption("#cf_model", "poly");
await p.selectOption("#cf_deg", "3");
await p.selectOption("#cf_model", "exp");
await p.selectOption("#cf_deg", "4").catch(() => {});   // the degree select is hidden for an exponential: nothing to do
eq("only the settings of the chosen model count (degree changed while exp was chosen, offset on)", await stale(), 0);
// restore the original state of the model for the next steps
await p.selectOption("#cf_model", "exp");

// 4. Saved with the project and restored after a reload.
await p.reload();
await p.waitForFunction(() => document.getElementById("fitstate").textContent === "Bereit.", null, { timeout: 120000 });
eq("after reload: result lines and curve are back", [await p.$$eval("#results .res", e => e.length), (await traces()).length], [3, 2]);
eq("after reload: panel shows the saved settings", [await p.inputValue("#cf_model"), await p.isChecked("#cf_off")], ["exp", true]);

// 5. Free formula equals the built-in model; start values; names with Greek letters.
await p.selectOption("#cf_model", "free");
await p.fill("#cf_expr", "a*exp(-x/τ)+c");
await p.fill("#cf_p0", "a = 7; τ = 3; c = 1");
await go();
const F = await result();
eq("free formula: parameters in order of appearance", F.params.map(q => q.name), ["a", "τ", "c"]);
yes("free formula = built-in exponential with offset (7 digits)", F.params.every((q, i) => digits(q.value, E.p[i]) >= 7 && digits(q.uScaled, E.err_scaled[i]) >= 6));
eq("free formula has no known units", F.params.map(q => q.unit), ["", "", ""]);
eq("equation shown for a free formula", await p.textContent("#cf_eq"), "y = a*exp(-x/τ)+c");

// 6. Messages a student can act on (German), nothing is stored for a refusal.
const before = (await p.evaluate(() => proj.results.length));
await p.fill("#cf_expr", "");
await go();
eq("empty formula", await msg(), "Bitte eine Formel eingeben, zum Beispiel a*exp(-x/tau)+c.");
await p.fill("#cf_expr", "a*(x+");
await go();
yes("syntax error says what is allowed", (await msg()).startsWith("Die Kurvenanpassung ist fehlgeschlagen. Die Formel ist nicht lesbar. Erlaubt sind Zahlen, x, Parameternamen"));
await p.fill("#cf_expr", "a*foo(x)");
await go();
yes("unknown function is named", (await msg()).includes("Die Funktion „foo“ gibt es nicht"));
await p.fill("#cf_expr", "2*x+1");
await go();
yes("formula without a parameter", (await msg()).includes("fehlt ein Parameter"));
await p.fill("#cf_expr", "a*x+b");
await p.fill("#cf_p0", "a 1");
await go();
yes("bad start values", (await msg()).includes("Startwerte schreibst du so: a = 1; tau = 0,5. Problem bei „a 1“."));
await p.fill("#cf_p0", "a = 1; b = 0");
await p.fill("#cf_expr", "a+b*x+c*x^2+d*x^3+e*x^4+f*x^5+g*x^6+h*x^7+i*x^8+j*x^9+k*x^10+l*x^11");
await go();
yes("more parameters than the limit", (await msg()).includes("mehr als 10 Parameter"));
await p.fill("#cf_expr", "a*ln(x-100)");
await p.fill("#cf_p0", "a = 1");
await go();
yes("start values give no numbers", (await msg()).includes("ergibt die Formel keine Zahlen"));
eq("no result was stored by a refusal", (await p.evaluate(() => proj.results.length)) <= before, true);
await p.selectOption("#cf_model", "poly");
await p.selectOption("#cf_deg", "6");
await load({ x: [1, 2, 3, 4], y: [1, 4, 9, 16], sy: null });
await p.selectOption("#cf_model", "poly"); await p.selectOption("#cf_deg", "6");
await go();
yes("polynomial with too few points", (await msg()).includes("Das Modell hat 7 Parameter, aber es gibt nur 4 Messpunkte"));

// 7. English.
await load(cases[0]);
await setModel("exp", { offset: false });
await go();
await p.click('[data-lang="en"]');
yes("English: model line and method", (await p.textContent("#results")).includes("Model: Exponential, y = a·exp(−x/τ)") && (await p.textContent("#results")).includes("nonlinear least squares"));
eq("English: curve name in the plot", (await traces())[1], "Fit: Exponential");
await p.selectOption("#cf_model", "free");
await p.fill("#cf_expr", "");
await go();
eq("English: refusal", await msg(), "Please enter a formula, for example a*exp(-x/tau)+c.");
await p.click('[data-lang="de"]');

eq("no page errors", errors, []);
eq("nothing was loaded from outside", external, []);
await p.screenshot({ path: "evidence/phase5-step3-curvefit.png", fullPage: false });
await br.close(); close();
if (bad) process.exit(1);
console.log("phase 5 step 3: the curve-fit tool works in the page");
