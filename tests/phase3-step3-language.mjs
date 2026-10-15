// Phase 3 step 3 (part A): German stays the default; a DE / EN switch changes the fixed texts of the translated sections and the number format.
// Hand values (written here, not read from the app): slope a = 44,25/1750 = 0,0252857 mm/N, u(a) scaled 0,000290 -> (0,02529 ± 0,00029) mm/N; E = (201 ± 8) GPa.
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";
import { serve } from "./serve.mjs";
const req = createRequire(import.meta.url);
const { TEXTS } = req("../app/i18n.js");
import { chromium } from "./tools.mjs";
let bad = 0;
const eq = (name, got, want) => { got = JSON.stringify(got); want = JSON.stringify(want); if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; } };
const yes = (name, v) => eq(name, !!v, true);

// ---- Pure part: one table, both languages complete, same {placeholders}, and every key the page uses exists.
const ph = s => (s.match(/\{\w+\}/g) || []).sort();
for (const [k, e] of Object.entries(TEXTS)) {
  yes(`${k}: German text`, typeof e.de === "string" && e.de.length > 0);
  yes(`${k}: English text`, typeof e.en === "string" && e.en.length > 0);
  eq(`${k}: same placeholders`, ph(e.en), ph(e.de));
  yes(`${k}: English differs from German (or is a name)`, e.en !== e.de || ["th_param", "fit_chi2", "tpl_exp", "sr_chi", "sr_val", "n_calib", "o_ddof0", "o_ddof1h", "n_gchi_poisson", "dist_poisson"].includes(k) || e.en.length < 12);
}
const used = new Set();
// part C: the pure files, the templates and the export call t() too
for (const f of ["app.html", "index.html", "home.js", "consent.js", "gofview.js", "curvefit.js", "parse.js", "drop.js", "project.js", "derived.js", "gof.js", "logaxis.js", "series.js", "compare.js", "formula.js", "propagate.js", "templates.js", "export.js", "toolui.js"]) {
  const src = readFileSync(resolve("app", f), "utf8");
  for (const m of src.matchAll(/data-i18n(?:-\w+)?="(\w+)"/g)) used.add(m[1]);
  for (const m of src.matchAll(/\b(?:t|fitState|stored)\("(\w+)"[,)]/g)) used.add(m[1]);
  for (const m of src.matchAll(/\b(?:t|stored)\(\s*[^()"]*\?\s*"(\w+)"\s*:\s*[^()"]*?"(\w+)"/g)) { used.add(m[1]); used.add(m[2]); }
}
for (const k of ["role_x", "role_y", "role_yerr", "role_unused", "verb_calc", "verb_fit", "how_ols", "how_wun", "how_wsc",
  "hist_stale", "cum_stale", "gof_stale", "dist_poisson", "dist_gauss", "n_gchi_poisson", "n_gchi_gauss", "sr_from", "sr_to", "aria_srfrom", "aria_srto", "cal_how_wsc", "cmp_ok", "cmp_bad", "wm_ok", "wm_bad",
  "cf_how_wsc", "cf_syntax", "cf_nox", "cf_nopar", "cf_func", "cf_manypar", "cf_dof", "cf_p0", "cf_noconv", "cf_singular", "cf_sinefew"]) used.add(k);   // the cf_ keys after wm_bad come from the worker as error codes (cfMessage in curvefit.js) or from a second branch of a choice;   // built from a variable
for (const k of used) yes(`used key exists: ${k}`, k in TEXTS);
for (const k of Object.keys(TEXTS)) yes(`key is used: ${k}`, used.has(k));

// ---- Real page. The browser says it prefers English, the page must still open in German.
const { base, close } = await serve();
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, locale: "en-US" });
const p = await ctx.newPage();
const errors = [];
p.on("pageerror", e => errors.push(String(e)));
const lines = () => p.$$eval("#results .res", e => e.map(x => x.textContent));
const ready = () => p.waitForFunction(() => /E = \(201 ± 8\) GPa/.test(document.getElementById("introres").textContent), null, { timeout: 120000 });
const state = () => p.evaluate(() => JSON.stringify(proj));
const traces = () => p.evaluate(() => document.getElementById("plot").data.map(t => t.name));
const text = sel => p.textContent(sel);
await p.goto(base + "app/app.html");
await ready();

// 1. German first.
const DE_LINES = ["a = (0,02529 ± 0,00029) mm/N", "b = (0,007 ± 0,011) mm", "E = (201 ± 8) GPa", "a (ΔL auf) = (0,02529 ± 0,00029) mm/N", "b (ΔL auf) = (0,007 ± 0,011) mm", "a (ΔL ab) = (0,02502 ± 0,00020) mm/N", "b (ΔL ab) = (0,052 ± 0,006) mm"];
eq("default language is German although the browser is English", [await p.evaluate(() => document.documentElement.lang), await text("h1")], ["de", "Messdaten"]);
eq("German result lines", (await lines()).slice(0, 3), DE_LINES.slice(0, 3));
const stateDe = await state();
const linesDe = await lines();
yes("German detail has the decimal comma", (await text("#results")).includes("0,0252857"));
eq("German pressed button", await p.getAttribute("#lang_de", "aria-pressed"), "true");

// 2. Switch to English: texts, numbers, plot, table; the project is untouched.
await p.click("#lang_en");
eq("html lang", await p.evaluate(() => document.documentElement.lang), "en");
eq("heading, button, hint", [await text("h1"), await text("#blank"), await text("#undo"), await p.getAttribute("#undo", "title")], ["Measurement data", "Empty table", "Undo", "Ctrl/Cmd+Z"]);
eq("section headings", await p.$$eval("h2", e => e.slice(0, 4).map(x => x.textContent)), ["Plot", "Table", "Results", "Tools"]); // Phase 4 step 2: new page order, the template chooser sits in the file row
eq("English result lines: decimal point, HU format unchanged", await lines(), DE_LINES.map(l => l.replace(/,/g, ".")));
eq("headline in the note", await text("#introres"), "E = (201 ± 8) GPa");
yes("English detail has the decimal point and the method in English", (await text("#results")).includes("0.0252857") && (await text("#results")).includes("Method: weighted least squares (weights 1/s²); errors scaled with √(χ²/DoF)") && (await text("#results")).includes("Degrees of freedom: 4"));
eq("table header texts", await p.$$eval("#results table th", e => e.slice(0, 3).map(x => x.textContent)), ["Parameter", "Value", "Error scaled"]);
eq("role names in the table", await p.$$eval("select.role:first-of-type, th select.role", e => [...e[0].options].map(o => o.textContent)), ["x values", "y values", "Error of y", "not used"]);
yes("plot legend is English", (await traces()).some(n => n.startsWith("Fit ΔL auf")) && (await traces()).some(n => n.startsWith("Fit ΔL ab")));
eq("plot uses the point as decimal separator", await p.evaluate(() => document.getElementById("plot").layout.separators), ".,");
eq("table cell shows the English format", await p.inputValue('#table input[data-r="0"][data-c="1"]'), "0.26");
yes("logarithmic label and fit button", (await text("#loglabel")).includes("Logarithmic y axis") && (await text("#fit")) === "Fit");
eq("no note about unfinished sections any more (everything is translated)", await p.$$eval("#langnote", e => e.length), 0);
eq("project is not changed by the switch", await state(), stateDe);
eq("undo history is still clean", [await p.isDisabled("#undo"), await p.isDisabled("#redo")], [true, true]);
await p.screenshot({ path: "evidence/phase3-step3-en.png" });

// 3. English input and messages: a point and a comma both work; a letter gives an English message and changes nothing.
await p.fill('#table input[data-r="0"][data-c="1"]', "0.27");
eq("0.27 typed with a point", await p.evaluate(() => proj.columns[1].values[0]), 0.27);
yes("edit makes results out of date, message in English", (await text(".stalemsg")).startsWith("The data have changed. This result is out of date. Please fit again."));
await p.fill('#table input[data-r="0"][data-c="1"]', "0,26");
eq("0,26 typed with a comma", await p.evaluate(() => proj.columns[1].values[0]), 0.26);
const s1 = await state();
await p.fill('#table input[data-r="1"][data-c="1"]', "abc");
eq("letter in a cell: English message", await text("#msg"), "Row 2, column 2: “abc” is not a number.");
eq("letter in a cell: value unchanged", await p.evaluate(() => proj.columns[1].values[1]), 0.5);
await p.fill('#table input[data-r="1"][data-c="1"]', "0.5");
await p.click("#blank");
await p.click("#fit");
eq("fit without data: English message", await text("#fitmsg"), "The fit failed. At least three data points with x and y are needed.");
eq("empty table: English placeholder in the plot area", await text("#results"), "No results yet. Enter your measured values and press “Fit”.");
await p.screenshot({ path: "evidence/phase3-step3-en-error.png" });

// 4. The choice survives a reload (autosave holds the blank table, so load the example again).
await p.reload();
eq("after reload: still English", [await p.evaluate(() => document.documentElement.lang), await text("h1"), await p.getAttribute("#lang_en", "aria-pressed")], ["en", "Measurement data", "true"]);
await p.evaluate(() => { localStorage.removeItem("plotlab-autosave"); });
await p.reload(); await ready();
eq("after reload with the example: English lines", (await lines()).slice(0, 3), DE_LINES.slice(0, 3).map(l => l.replace(/,/g, ".")));

// 5. Back to German: everything as before, nothing lost.
await p.click("#lang_de");
eq("back to German: lines, heading", [await lines(), await text("h1")], [linesDe, "Messdaten"]);
eq("back to German: project identical", await state(), stateDe);
eq("back to German: separators and cell", [await p.evaluate(() => document.getElementById("plot").layout.separators), await p.inputValue('#table input[data-r="0"][data-c="1"]')], [",.", "0,26"]);
await p.reload(); await ready();
eq("German choice survives a reload", await text("h1"), "Messdaten");
await p.screenshot({ path: "evidence/phase3-step3-de.png" });

// 6. A damaged language entry in the storage falls back to German; storage blocked still works.
await p.evaluate(() => localStorage.setItem("plotlab-lang", "fr"));
await p.reload(); await ready();
eq("unknown language entry: German", await text("h1"), "Messdaten");

eq("page errors", errors, []);
await b.close(); close();
console.log(bad ? `${bad} FAILED` : "all checks passed");
process.exit(bad ? 1 : 0);
