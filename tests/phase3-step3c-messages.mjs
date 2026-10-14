// Phase 3 step 3 (part C): the messages of the calculation files, the template texts and the export in English.
// The German texts are checked by the older tests (phase1/phase2/phase3-step1/step2), which must stay unchanged. Here: one English message per family,
// the same call in German gives the German text again, the quoted names in the English template steps are real labels of the page, and the real page
// shows the messages, the template box, the export names and the saved file name in English and switches back.
// Expected English texts are written by hand here; the hand values (chi-square verdicts) are those of tests/phase3-step3b-sections.mjs.
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { mkdtempSync, writeFileSync } from "node:fs";
import { serve } from "./serve.mjs";
const req = createRequire(import.meta.url);
const { TEXTS, setLang } = req("../app/i18n.js");
const { parseTable, parseBlock, pasteInto } = req("../app/parse.js");
const { classifyDrop } = req("../app/drop.js");
const { open, newProject } = req("../app/project.js");
const { parseFormula, recalcFormulas } = req("../app/formula.js");
const { parseUncertainty } = req("../app/propagate.js");
const { parseDerivedVars, deriveQuantity, parseCalibValues, readOff } = req("../app/derived.js");
const { gofPrepare, gofVerdict } = req("../app/gof.js");
const { logYProblem } = req("../app/logaxis.js");
const { prepareSeries } = req("../app/series.js");
const { parseValue, compareValues } = req("../app/compare.js");
const { TEMPLATES } = req("../app/templates.js");
import { chromium } from "./tools.mjs";
let bad = 0;
const eq = (name, got, want) => { got = JSON.stringify(got); want = JSON.stringify(want); if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; } };
const yes = (name, v) => eq(name, !!v, true);
// A German word or letter in a text that should be English. Column names of the test data are English on purpose.
const GERMAN = /[äöüß]|\b(Spalte|Spalten|Zeile|Bitte|keine|nicht|und|der|die|das|ist|Wert|Werte|Formel|Fehler|Messwert|Vergleichswert|Anpassung|Berechnen|drücken|Unter|eingetragen|gewählt|Zahl|Zahlen|Klasse|Klassen)\b/;

// ---- Pure part, English. Every family: the message, in the same call German first (the German tests hold the exact German text).
const rows5 = [[1, 2, 0.1], [2, 4, 0.1], [3, 6, 0.1], [4, 8, 0.1], [5, 10, 0.1]];
const proj = () => newProject(["x / s", "y / V", "sy / V"], rows5.map(r => r.slice()));
const cols = [{ name: "D / mm" }];
const FAMILIES = [
  ["table: no data", () => parseTable("").error, "No data pasted. Paste numbers or load the example."],
  ["table: header only", () => parseTable("x;y\n").error, "Found only a header line and no measurements."],
  ["table: ragged row", () => parseTable("1;2\n3").error, "Row 2 has 1 instead of 2 columns. Check the separator (; or tab)."],
  ["table: text in a number cell", () => parseTable("1;2\n3;a").error, "Row 2, column 2: “a” is not a number."],
  ["table: default header", () => parseTable("1;2").header, ["Column 1", "Column 2"]],
  ["block: empty", () => parseBlock("").error, "No data pasted."],
  ["block: ragged", () => parseBlock("1\t2\n3").error, "Pasted block, row 2: 1 instead of 2 columns. Separate columns with a tab or a semicolon. Nothing was changed."],
  ["block: text", () => parseBlock("1\tx").error, "Pasted block, row 1, column 2: “x” is not a number. Nothing was changed."],
  ["paste: too wide, plural", () => pasteInto([{ values: [1] }, { values: [2] }], 0, 0, [[1, 2, 3]]), "The pasted block has 3 columns, but from this cell there are only 2 columns without a formula. Nothing was changed."],
  ["paste: too wide, singular", () => pasteInto([{ values: [1] }, { values: [2] }], 0, 1, [[1, 2]]), "The pasted block has 2 columns, but from this cell there are only 1 column without a formula. Nothing was changed."],
  ["paste: too many rows", () => pasteInto([{ values: [1] }], 1999, 0, [[1], [2]]), "The table would get 2001 rows. More than 2000 rows are not possible. Nothing was changed."],
  ["drop: Excel file", () => classifyDrop("a.xlsx", "", "PK").error, "“a.xlsx” is an Excel file that PlotLab cannot read. In Excel, save the sheet as “CSV (comma delimited)” or copy the cells and paste them into the table."],
  ["drop: picture", () => classifyDrop("a.png", "image/png", "x").error, "“a.png” is not a table. Please drag a CSV or text file with numbers, or a PlotLab project (.plotlab), onto the page."],
  ["drop: no numbers", () => classifyDrop("n.txt", "text/plain", "Hello world").error, "“n.txt” contains no numbers. Please drag a CSV or text file with measurements onto the page."],
  ["project: not JSON", () => open("x").error, "The file is not a valid project (not readable JSON)."],
  ["project: other format", () => open('{"format":"x"}').error, "The file is not a project of this application."],
  ["project: version", () => open('{"format":"datenplot-projekt","version":2}').error, "Project version 2 is not supported."],
  ["project: damaged", () => open('{"format":"datenplot-projekt","version":1,"columns":[],"results":[],"settings":{}}').error, "The project is damaged: columns or values are missing or are not numbers."],
  ["formula: empty", () => parseFormula("", cols).error, "Please enter a formula, for example (D/2)^2."],
  ["formula: too long", () => parseFormula("1+".repeat(200), cols).error, "The formula is too long (at most 300 characters)."],
  ["formula: unknown column", () => parseFormula("zz+1", cols).error, "Unknown column “zz” in the formula. Available: D. The formula may only use columns to the left of the new column."],
  ["formula: ambiguous column", () => parseFormula("D", [{ name: "D / mm" }, { name: "D / cm" }]).error, "The column name “D” is ambiguous. Write the full name in square brackets, for example [D / mm]."],
  ["formula: unknown function", () => parseFormula("foo(1)", cols).error, "Unknown function “foo”. Allowed: sqrt, ln, log10, exp, abs, sin, cos, tan, wurzel."],
  ["formula: bracket", () => parseFormula("(1", cols).error, "A bracket was not closed."],
  ["formula: operator missing", () => parseFormula("1 2", cols).error, "Unexpected: “2”. Is an operator (+ − * / ^) missing?"],
  ["formula: end", () => parseFormula("1+", cols).error, "Unexpected: the end of the formula. A number, a column name or a bracket is missing here."],
  ["recalc: division by 0 in two rows", () => { const p = { columns: [{ name: "x", role: "x", values: [1, 0, 0, 2] }, { name: "q", role: "unused", values: [], formula: "1/x" }] }; return recalcFormulas(p); },
    ["Column “q”, row 2: Division by 0. The value stays empty. Other affected rows: 3."]],
  ["recalc: root and logarithm", () => { const p = { columns: [{ name: "x", role: "x", values: [-1] }, { name: "q", role: "unused", values: [], formula: "sqrt(x)" }, { name: "r", role: "unused", values: [], formula: "ln(0*x)" }] }; return recalcFormulas(p); },
    ["Column “q”, row 1: Square root of a negative number. The value stays empty.", "Column “r”, row 1: Logarithm of 0 or of a negative number. The value stays empty."]],
  ["recalc: formula error names the column", () => recalcFormulas({ columns: [{ name: "x", role: "x", values: [1] }, { name: "q", role: "unused", values: [], formula: "zz" }] }),
    ["Column “q”: Unknown column “zz” in the formula. Available: x. The formula may only use columns to the left of the new column."]],
  ["uncertainty: none", () => parseUncertainty("D*2", "", [{ name: "D" }, { name: "sD" }], 2).error, "Please give the uncertainties, for example D = sD; c = 0.01."],
  ["uncertainty: no =", () => parseUncertainty("D*2", "D", [{ name: "D" }, { name: "sD" }], 2).error, "“D”: An “=” is missing. Write, for example, D = sD (the uncertainty of D is in column sD) or D = 0.05."],
  ["uncertainty: unknown name", () => parseUncertainty("D*2", "q = 1", [{ name: "D" }, { name: "sD" }], 2).error, "Uncertainties: Unknown column “q”."],
  ["uncertainty: twice", () => parseUncertainty("D*2", "D = sD; D = sD", [{ name: "D" }, { name: "sD" }], 2).error, "Uncertainties: “D” is given twice."],
  ["uncertainty: wrapped formula error", () => parseUncertainty("D*2", "D = zz", [{ name: "D" }, { name: "sD" }], 2).error, "Uncertainty of “D”: Unknown column “zz” in the formula. Available: D, sD. The formula may only use columns to the left of the new column."],
  ["uncertainty: negative value", () => recalcFormulas({ columns: [{ name: "x", role: "x", values: [3] }, { name: "sx", role: "unused", values: [-0.1] }, { name: "u(f)", role: "unused", values: [], uncert: { formula: "x*2", map: "x = sx" } }] }),
    ["Column “u(f)”, row 1: The uncertainty is negative or not a number. The value stays empty."]],
  ["derived: no =", () => parseDerivedVars("L").error, "“L”: An “=” is missing. Write, for example, L = 1 ± 0.002."],
  ["derived: name taken", () => parseDerivedVars("a = 1").error, "The name “a” is already taken (a and b are the fit parameters, pi is the circle constant). Please choose another name."],
  ["derived: bad name", () => parseDerivedVars("1x = 1").error, "“1x” is not a valid name. Letters, digits and _ are allowed, and the name starts with a letter."],
  ["derived: twice", () => parseDerivedVars("L = 1; L = 2").error, "The quantity “L” is given twice."],
  ["derived: two ±", () => parseDerivedVars("L = 1 ± 1 ± 2").error, "“L = 1 ± 1 ± 2”: Only one ± is allowed."],
  ["derived: not a number", () => parseDerivedVars("L = x").error, "“L = x”: “x” is not a number."],
  ["derived: bad uncertainty", () => parseDerivedVars("L = 1 ± -1").error, "“L = 1 ± -1”: The uncertainty “-1” is not a number greater than or equal to 0."],
  ["derived: unknown quantity", () => deriveQuantity("4*zz/a", { a: { value: 2, u: 0.1, unit: "" }, b: { value: 1, u: 0.1, unit: "" } }, []).error, "Unknown quantity “zz” in the formula. Available: a, b. Allowed are a, b and the further quantities."],
  ["derived: no fit parameter", () => deriveQuantity("L*2", { a: { value: 2, u: 0.1, unit: "" }, b: { value: 1, u: 0.1, unit: "" } }, [{ name: "L", value: 1, u: 0 }]).error, "The formula must contain a or b (the fit parameters)."],
  ["derived: cannot be calculated", () => deriveQuantity("sqrt(0-a)", { a: { value: 2, u: 0.1, unit: "" }, b: { value: 1, u: 0.1, unit: "" } }, []).error, "The formula cannot be calculated: Square root of a negative number."],
  ["calibration: no value", () => parseCalibValues("").error, "Please enter at least one measured value y₀, for example 0.45 ± 0.01. Separate several values with “;”."],
  ["calibration: too many", () => parseCalibValues("1;2;3;4;5;6;7;8;9;10;11").error, "At most 10 measured values are possible."],
  ["calibration: not a number", () => parseCalibValues("x").error, "“x”: “x” is not a number."],
  ["calibration: slope 0", () => readOff({ a: 0.001, b: 1, ua: 0.01, ub: 0.1, cov: 0 }, 1.2, 0.1).error, "The slope a = 0.001 (u(a) = 0.01) is not clearly different from 0. No x₀ can be read off from it."],
  ["chi-square: one value", () => gofPrepare("N", [5, null], { width: null, start: null }).error, "The column “N” has 1 value. The χ² test needs many counts."],
  ["chi-square: no values", () => gofPrepare("N", [null, null], { width: null, start: null }).error, "The column “N” has 0 values. The χ² test needs many counts."],
  ["chi-square: fraction", () => gofPrepare("N", [1, 2, 3.5, 4], { width: null, start: null }).error, "Counts are whole numbers from 0. Row 3 of column “N” contains 3.5."],
  ["chi-square: all equal", () => gofPrepare("N", [4, 4, 4], { width: null, start: null }).error, "All values of column “N” are equal (4). With a standard deviation of 0 there is no Gaussian distribution and there are no classes."],
  ["chi-square: start", () => gofPrepare("N", [3, 5, 7, 9], { width: 1, start: 4 }).error, "The start 4 is above the smallest value 3. Please choose a start less than or equal to the smallest value."],
  ["chi-square: too many classes", () => gofPrepare("N", [0, 150], { width: 1, start: 0 }).error, "With a class width of 1 there would be 151 classes. That is too many (at most 100). Please choose a larger class width."],
  ["chi-square: too few classes", () => gofPrepare("N", [3, 5, 7, 9, 12], { width: 4, start: 3 }).error, "With a class width of 4 from 3 there are only 3 classes. The Gaussian distribution (2 estimated parameters) needs at least 4, otherwise no degree of freedom is left. Please choose a smaller class width."],
  ["chi-square: verdicts", () => [gofVerdict("Poisson", 0.05), gofVerdict("Gaussian", 0.0499)], ["Poisson: The counts do not contradict the Poisson distribution (p ≥ 0.05).", "Gaussian: The Gaussian distribution does not fit the counts (p < 0.05); it is rejected at the 5 % significance level."]],
  ["log axis: one value", () => logYProblem([{ name: "N", values: [5, 0, 3] }]), "The logarithmic y axis needs values above 0. In column “N” there is one value of 0 or below: row 2 (y = 0). Correct the values or switch the logarithmic axis off."],
  ["log axis: five values", () => logYProblem([{ name: "N", values: [-1.5, 0, 2, 0, -3, 0] }]), "The logarithmic y axis needs values above 0. In column “N” there are 5 values of 0 or below: row 1 (y = -1.5), row 2 (y = 0), row 4 (y = 0) and 2 more. Correct the values or switch the logarithmic axis off."],
  ["series: none", () => prepareSeries(proj(), []).error, "There is no series yet. Please choose a y column with “Add series”."],
  ["series: no x column", () => { const p = proj(); p.columns[0].role = "unused"; return prepareSeries(p, [{ y: "y / V", err: null, xmin: null, xmax: null }]).error; }, "The fit needs an x column. Choose the role “x values” in the table."],
  ["series: y is x", () => prepareSeries(proj(), [{ y: "x / s", err: null, xmin: null, xmax: null }]).error, "Series 1 (“x / s”): The y column is the x column. Please choose another column."],
  ["series: error column", () => prepareSeries(proj(), [{ y: "y / V", err: "y / V", xmin: null, xmax: null }]).error, "Series 1 (“y / V”): The error column must be a different column than x and y."],
  ["series: empty range, decimal point", () => prepareSeries(proj(), [{ y: "y / V", err: null, xmin: 2.5, xmax: 1.5 }]).error, "Series 1 (“y / V”): The x range is empty because “x from” (2.5) is larger than “x to” (1.5)."],
  ["series: one point", () => prepareSeries(proj(), [{ y: "y / V", err: null, xmin: 1, xmax: 1 }]).error, "Series 1 (“y / V”): The chosen x range contains 1 data point. A straight line needs at least three."],
  ["series: two points", () => prepareSeries(proj(), [{ y: "y / V", err: null, xmin: 1, xmax: 2 }]).error, "Series 1 (“y / V”): The chosen x range contains 2 data points. A straight line needs at least three."],
  ["series: error 0", () => { const p = proj(); p.columns[2].values[1] = 0; return prepareSeries(p, [{ y: "y / V", err: "sy / V", xmin: null, xmax: null }]).error; }, "Series 1 (“y / V”): All error values must be above 0 (row 2)."],
  ["series: same x", () => { const p = proj(); p.columns[0].values = [2, 2, 2, 2, 2]; return prepareSeries(p, [{ y: "y / V", err: null, xmin: null, xmax: null }]).error; }, "Series 1 (“y / V”): All x values in the range are equal. A straight line is not determined this way."],
  ["compare: empty", () => parseValue("  ", "Messwert").error, "Please enter the measured value, for example 100.2 ± 0.3."],
  ["compare: text", () => parseValue("abc ± 1", "Vergleichswert").error, "Reference value: “abc” is not a number."],
  ["compare: negative", () => parseValue("5 ± -1", "Messwert").error, "Measured value: The uncertainty “-1” is not a number greater than or equal to 0."],
  ["compare: two ±", () => parseValue("5 ± 1 ± 2", "Messwert").error, "Measured value: Only one ± is allowed."],
  ["compare: both exact", () => compareValues({ value: 1, u: 0 }, { value: 1, u: 0 }).error, "Both uncertainties are 0. Without an uncertainty the difference cannot be measured in units of uncertainty."],
];
const en = FAMILIES.map(([, f]) => { setLang("en"); const r = f(); setLang("de"); return r; });
FAMILIES.forEach(([name, , want], i) => { setLang("en"); eq("English: " + name, en[i], want); setLang("de"); });
FAMILIES.forEach(([name, f], i) => yes("German call gives the German text, not the English one: " + name, JSON.stringify(f()) !== JSON.stringify(en[i])));
const flat = x => Array.isArray(x) ? x.flatMap(flat) : [String(x)];
FAMILIES.forEach(([name], i) => yes("no German word in the English text: " + name, !flat(en[i]).some(s => GERMAN.test(s.replace(/„[^“]*“/g, "")))));

// Templates: titles, notes and steps in English; the quoted names in the steps are labels that exist in the page (headings, buttons) or columns of that template.
const labels = new Set(Object.values(TEXTS).map(e => e.en));
setLang("en");
const tpl = TEMPLATES.map(tp => ({ id: tp.id, title: tp.title, note: tp.note, steps: tp.steps.map(s => s.text), go: tp.steps.map(s => s.go || null), colNames: tp.build().columns.map(c => c.name) }));
setLang("de");
eq("English titles", tpl.map(q => q.title), ["P1 Error distribution", "P2 Volume measurement", "P3 Elasticity", "P4 Surface tension", "P5 Polarimetry (sucrose)", "P5 Newton's rings", "P6 Wheatstone bridge", "P6 Grating", "P7 Refractometer", "P8 Radioactivity: count rates", "P8 Radioactivity: decay curve", "P9 Pendulum"]);
eq("German titles are unchanged", TEMPLATES.map(tp => tp.title), ["P1 Fehlerverteilung", "P2 Volumenmessung", "P3 Elastizität", "P4 Oberflächenspannung", "P5 Polarimetrie (Saccharose)", "P5 Newtonsche Ringe", "P6 Wheatstone-Brücke", "P6 Gitter", "P7 Refraktometer", "P8 Radioaktivität: Zählraten", "P8 Radioaktivität: Zerfallskurve", "P9 Pendel"]);
eq("same number of steps in both languages, same buttons", tpl.map(q => q.steps.length), TEMPLATES.map(tp => tp.steps.length));
for (const q of tpl) {
  yes(`${q.id}: no German in the English texts`, ![q.title, q.note, ...q.steps].some(s => GERMAN.test(s)));
  for (const s of q.steps) for (const m of s.matchAll(/“([^”]+)”/g)) {
    const ph = m[1];
    yes(`${q.id}: “${ph}” is a label or a column`, q.colNames.includes(ph) || [...labels].some(l => l.startsWith(ph)));
  }
}

// ---- Real page, English.
const { base, close } = await serve();
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, locale: "en-US", acceptDownloads: true });
const p = await ctx.newPage();
const errors = [];
p.on("pageerror", e => errors.push(String(e)));
const text = sel => p.textContent(sel);
const vis = async sel => (await p.isVisible(sel)) ? await p.textContent(sel) : null;
const lines = () => p.$$eval("#results .res", e => e.map(x => x.textContent));
const paste = async t => { await p.fill("#paste", t); await p.click("#pastego"); };
const ready = () => p.waitForFunction(() => !document.getElementById("fit").disabled, null, { timeout: 120000 });
const idle = id => p.waitForFunction(i => !document.getElementById(i).disabled, id);
const drop = (name, type, content) => p.evaluate(([n, t, c]) => {
  const dt = new DataTransfer(); dt.items.add(new File([c], n, { type: t }));
  document.body.dispatchEvent(new DragEvent("drop", { dataTransfer: dt, bubbles: true, cancelable: true }));
}, [name, type, content]);
const dir = mkdtempSync(tmpdir() + "/plotlab-3c-");
await p.goto(base + "app/index.html?start=leer");
await p.evaluate(() => { localStorage.clear(); localStorage.setItem("plotlab-lang", "en"); });
await p.reload();
await p.waitForFunction(() => document.getElementById("fitstate").dataset.i18n === "fs_ready", null, { timeout: 120000 });
eq("page is English", await p.evaluate(() => document.documentElement.lang), "en");

// 1. Files and pasting.
await drop("sheet.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "PK");
eq("drop: Excel", await text("#msg"), "“sheet.xlsx” is an Excel file that PlotLab cannot read. In Excel, save the sheet as “CSV (comma delimited)” or copy the cells and paste them into the table.");
await drop("notes.txt", "text/plain", "Hello world");
eq("drop: no numbers", await text("#msg"), "“notes.txt” contains no numbers. Please drag a CSV or text file with measurements onto the page.");
writeFileSync(dir + "/broken.plotlab", "this is not a project");
await p.setInputFiles("#openfile", dir + "/broken.plotlab");
await p.waitForFunction(() => !document.getElementById("msg").textContent.includes("notes.txt"));
eq("open: damaged file", await text("#msg"), "The file is not a valid project (not readable JSON).");
await paste("a;b\n1;2\n3");
eq("paste: ragged", await text("#msg"), "Row 3 has 1 instead of 2 columns. Check the separator (; or tab).");
await paste("1.5;2\n3;4");
eq("paste without header: English column names", await p.evaluate(() => proj.columns.map(c => c.name)), ["Column 1", "Column 2"]);
await p.evaluate(() => { const el = document.querySelector('#table input[data-r="0"][data-c="0"]'), dt = new DataTransfer(); dt.setData("text", "1;2;3"); el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true })); });
eq("table paste: block too wide", await text("#msg"), "The pasted block has 3 columns, but from this cell there are only 2 columns without a formula. Nothing was changed.");

// 2. Formula columns and the semi-log axis.
await paste("x / mm;y / V;sy / V\n1;1000;31.6\n0;0;27.7\n2;586;24.2");
await p.fill("#f_name", "q"); await p.fill("#f_expr", "zz+1"); await p.click("#f_add");
eq("formula: unknown column", await text("#fmsg"), "Unknown column “zz” in the formula. Available: x, y, sy. The formula may only use columns to the left of the new column.");
await p.fill("#f_expr", "1/x"); await p.fill("#f_unc", ""); await p.click("#f_add");
eq("formula: division by zero names the row", await text("#fmsg"), "Column “q”, row 2: Division by 0. The value stays empty.");
await p.fill("#f_name", "w"); await p.fill("#f_expr", "x*2"); await p.fill("#f_unc", "x"); await p.click("#f_add");
eq("uncertainty: no =", await text("#fmsg"), "“x”: An “=” is missing. Write, for example, D = sD (the uncertainty of D is in column sD) or D = 0.05.");
await p.evaluate(() => { const c = document.getElementById("logy"); c.checked = true; c.dispatchEvent(new Event("change", { bubbles: true })); });
eq("log axis: message names the row, English number", (await text("#plot")).trim(), "The logarithmic y axis needs values above 0. In column “y / V” there is one value of 0 or below: row 2 (y = 0). Correct the values or switch the logarithmic axis off.");

// 3. The finished example: derived quantity, calibration, comparison and series messages.
await p.evaluate(() => localStorage.removeItem("plotlab-autosave"));
await p.goto(base + "app/index.html");
await p.waitForFunction(() => /E = \(201 ± 8\) GPa/.test(document.getElementById("introres").textContent), null, { timeout: 120000 });
eq("example: result line in English", (await lines()).slice(0, 3), ["a = (0.02529 ± 0.00029) mm/N", "b = (0.007 ± 0.011) mm", "E = (201 ± 8) GPa"]);
await p.fill("#d_formula", "4*zz/a"); await p.click("#derive");
eq("derived: unknown quantity", await text("#derivemsg"), "Unknown quantity “zz” in the formula. Available: a, b, L, d. Allowed are a, b and the further quantities.");
await p.fill("#d_formula", "L*2"); await p.click("#derive");
eq("derived: no fit parameter", await text("#derivemsg"), "The formula must contain a or b (the fit parameters).");
await p.fill("#d_formula", "4*L/(pi*d^2*a)"); await p.fill("#d_vars", "L = x"); await p.click("#derive");
eq("derived: not a number", await text("#derivemsg"), "“L = x”: “x” is not a number.");
await p.fill("#c_y0", "abc"); await p.click("#c_go");
eq("calibration: not a number", await text("#calibmsg"), "“abc”: “abc” is not a number.");
await p.fill("#k_meas", ""); await p.click("#k_go");
eq("comparison: empty value", await text("#comparemsg"), "Please enter the measured value, for example 100.2 ± 0.3.");
await p.fill("#k_meas", "5"); await p.fill("#k_ref", "5 ± 1 ± 2"); await p.click("#k_go");
eq("comparison: two ±", await text("#comparemsg"), "Reference value: Only one ± is allowed.");
await p.fill("#k_meas", "5"); await p.fill("#k_ref", "5"); await p.click("#k_go");
eq("comparison: both exact", await text("#comparemsg"), "Both uncertainties are 0. Without an uncertainty the difference cannot be measured in units of uncertainty.");
while (await p.$("[data-sdel]")) await p.click("[data-sdel]");   // the rows are drawn again after each removal
await p.click("#sr_go");
eq("series: none left", await text("#srmsg"), "There is no series yet. Please choose a y column with “Add series”.");

// 4. Templates: list, box and the example numbers in the fields are English; the project keeps the German text; back to German.
const opts = () => p.$$eval("#tpl_sel option", e => e.map(o => o.textContent));
eq("template list in English", await opts(), ["(please choose)", "P1 Error distribution", "P2 Volume measurement", "P3 Elasticity", "P4 Surface tension", "P5 Polarimetry (sucrose)", "P5 Newton's rings", "P6 Wheatstone bridge", "P6 Grating", "P7 Refractometer", "P8 Radioactivity: count rates", "P8 Radioactivity: decay curve", "P9 Pendulum"]);
const box = () => p.evaluate(() => { const b = document.getElementById("tpl_info"); return b.hidden ? null : { title: b.querySelector("h3").textContent, note: b.querySelector("div:not([data-invented])").textContent, steps: [...b.querySelectorAll("li")].map(l => l.firstChild.textContent), show: [...b.querySelectorAll("li a.go")].map(x => x.textContent) }; });
await p.selectOption("#tpl_sel", "p6a"); await p.click("#tpl_load"); await ready();
const bx = await box();
eq("P6 box title and first step", [bx.title, bx.steps[0], bx.show], ["P6 Wheatstone bridge", "The columns “Rx / Ω” and “u(Rx) / Ω” are already calculated: Rx = R1·R2/R3, u(Rx) from Gaussian error propagation with u(R1), u(R2), u(R3) (see the column heads).", ["Show", "Show"]]);
eq("P6 numbers in the fields use the point", await p.evaluate(() => [document.getElementById("k_meas").value, document.getElementById("k_ref").value]), ["219.4 ± 1.0", "220 ± 2.2"]);
eq("P6 the project stores the German text", await p.evaluate(() => [proj.settings.compare.meas, proj.settings.compare.ref]), ["219,4 ± 1,0", "220 ± 2,2"]);
await p.selectOption("#tpl_sel", "p3"); await p.click("#tpl_load"); await ready();
eq("P3 derived example in English", await p.evaluate(() => document.getElementById("d_vars").value), "L = 1 ± 0.002; d = 0.5 ± 0.01");
await p.selectOption("#tpl_sel", "p7"); await p.click("#tpl_load"); await ready();
eq("P7 calibration values in English", await p.evaluate(() => document.getElementById("c_y0").value), "1.3505 ± 0.0003; 1.3600 ± 0.0003; 1.3780 ± 0.0003");
await p.screenshot({ path: "evidence/phase3-step3c-en.png", fullPage: true });
await p.click("#lang_de");
eq("German: box title and field", [(await box()).title, await p.evaluate(() => document.getElementById("c_y0").value)], ["P7 Refraktometer", "1,3505 ± 0,0003; 1,3600 ± 0,0003; 1,3780 ± 0,0003"]);
eq("German: list", (await opts()).slice(0, 3), ["(bitte wählen)", "P1 Fehlerverteilung", "P2 Volumenmessung"]);
await p.click("#lang_en");
eq("English again: box title", (await box()).title, "P7 Refractometer");

// 5. Chi-square: verdict sentences and the message of the worker (a class with expected count 0).
const A = [4, 7, 9, 6, 8, 5, 10, 7, 6, 8, 9, 3, 7, 11, 6, 8, 7, 5, 9, 6, 8, 10, 4, 7, 6, 12, 7, 5, 8, 9, 6, 7, 8, 3, 9, 7, 10, 6, 5, 8];
await paste("N\n" + A.join("\n")); await ready();
await p.fill("#g_w", "1"); await p.fill("#g_s", "3"); await p.click("#g_go"); await idle("g_go");
eq("verdict sentences in English", await p.$$eval("#results [data-verdict]", e => e.map(x => x.textContent)), ["Poisson: The counts do not contradict the Poisson distribution (p ≥ 0.05).", "Gaussian: The counts do not contradict the Gaussian distribution (p ≥ 0.05)."]);
await p.click("#lang_de");
eq("same verdicts in German", await p.$$eval("#results [data-verdict]", e => e.map(x => x.textContent)), ["Poisson: Die Zählwerte widersprechen der Poisson-Verteilung nicht (p ≥ 0,05).", "Gauß: Die Zählwerte widersprechen der Gauß-Verteilung nicht (p ≥ 0,05)."]);
await p.click("#lang_en");
await paste("N\n" + [...Array(29).fill(0).map((_, i) => i % 3), 40].join("\n")); await ready();
await p.fill("#g_w", "1"); await p.fill("#g_s", "0"); await p.click("#g_go"); await idle("g_go");
eq("worker message in English", await text("#gofmsg"), "The χ² test failed. For one class the expected count is 0. Please choose fewer or wider classes.");
await p.click("#lang_de");
await p.click("#g_go"); await idle("g_go");
eq("worker message in German", await text("#gofmsg"), "Der χ²-Test ist fehlgeschlagen. Für eine Klasse ist die erwartete Anzahl 0. Bitte weniger oder breitere Klassen wählen.");
await p.click("#lang_en");

// 6. Export: button texts, file names and the failure message follow the language; the saved project too.
eq("export buttons in English", await p.evaluate(ids => ids.map(i => document.getElementById(i).textContent), ["plot_png", "plot_svg", "histplot_png", "cumplot_svg", "gofplot_png"]), ["Save plot as PNG", "Save plot as SVG", "Save plot as PNG", "Save plot as SVG", "Save plot as PNG"]);
await p.selectOption("#tpl_sel", "p8b"); await p.click("#tpl_load"); await ready();
await p.waitForFunction(() => !document.getElementById("plot_svg").disabled);
const file = async sel => { const [d] = await Promise.all([p.waitForEvent("download"), p.click(sel)]); return d.suggestedFilename(); };
eq("English file names", [await file("#plot_png"), await file("#plot_svg"), await file("#saveproj")], ["plot.png", "plot.svg", "project.plotlab"]);
await p.evaluate(() => { window.__toImage = Plotly.toImage; Plotly.toImage = () => Promise.reject(new Error("no")); });
await p.click("#plot_png");
eq("export failure message in English", await vis("#exp_plot .msg"), "The plot could not be saved.");
await p.click("#lang_de");
eq("the visible failure message follows the language", await vis("#exp_plot .msg"), "Das Diagramm konnte nicht gespeichert werden.");
eq("German export buttons", await p.$$eval("#plot_png, #plot_svg", e => e.map(x => x.textContent)), ["Diagramm als PNG speichern", "Diagramm als SVG speichern"]);
await p.evaluate(() => { Plotly.toImage = window.__toImage; });
eq("German file names", [await file("#plot_png"), await file("#plot_svg"), await file("#saveproj")], ["diagramm.png", "diagramm.svg", "projekt.plotlab"]);
await p.click("#lang_en");

// 7. No German word in any message or template text the page shows in English (project data such as column names is the student's own text).
await p.screenshot({ path: "evidence/phase3-step3c-en-msg.png", fullPage: true });
const shown = await p.evaluate(() => [...document.querySelectorAll(".msg:not([hidden]), #tpl_info, #tpl_sel option")].map(e => e.textContent));
eq("no German left in the visible messages and template texts", shown.filter(s => GERMAN.test(s)), []);
eq("no page errors", errors, []);

await b.close(); close();
if (bad) { console.log(bad + " FAILED"); process.exit(1); }
console.log("phase 3 step 3c: messages, template texts and export names in English (" + FAMILIES.length + " families), German unchanged, real page switches both ways");
