// Phase 2 step 1: formula columns in the real page (P5 sheet: r² of Newton's rings, d·c of polarimetry). Expected values by hand.
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { writeFileSync, readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { chromium } from "./tools.mjs";
const { newProject, save } = createRequire(import.meta.url)("../app/project.js");
let bad = 0;
const eq = (name, got, want) => {
  got = JSON.stringify(got); want = JSON.stringify(want);
  if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; }
};
const near = (name, got, want) => eq(name, got.map(v => v === null ? v : Math.round(v * 1e9) / 1e9), want);
const dir = mkdtempSync(resolve(tmpdir(), "p2s1-"));
// A hand-edited project: a formula column whose stored numbers are wrong, and text that must never run.
const hand = newProject(["D / mm", "<img src=x onerror=window.pwn=1>"], [[2, 1], [3, 1]]);
hand.columns.push({ name: "r2", role: "unused", values: [99, 99], formula: "(D/2)^2" });
hand.columns.push({ name: "<script>window.pwn=2</script>", role: "unused", values: [0, 0], formula: "alert(1)<img src=x onerror=window.pwn=3>" });
writeFileSync(dir + "/hand.plotlab", save(hand));

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1200, height: 1700 } });
const p = await ctx.newPage();
const external = [];
p.on("request", r => { if (!r.url().startsWith("file:")) external.push(r.url()); });
await p.goto(pathToFileURL(resolve("app/index.html")).href + "?start=leer");
const vals = j => p.evaluate(j => proj.columns[j].values, j);
const cellsText = j => p.$$eval(`td[data-calc="${j}"]`, e => e.map(x => x.textContent));
const addF = async (name, expr) => { await p.fill("#f_name", name); await p.fill("#f_expr", expr); await p.click("#f_add"); };

eq("add button off without data", await p.isDisabled("#f_add"), true);
// P5 sheet: Newton's rings diameter D (mm), polarimetry path d (dm) and concentration c (g/mL).
await p.fill("#paste", "D / mm;d / dm;c / g/mL\n2;2;0,1\n3;2;0,2\n4;2;0,3\n5;2;0,4");
await p.click("#pastego");
await p.waitForSelector("#plot .scatterlayer .point");

// r² = (D/2)^2 = 1; 2,25; 4; 6,25 (checked in the head). d·c = 0,2; 0,4; 0,6; 0,8.
await addF("r² / mm²", "(D/2)^2");
eq("no message", await p.isHidden("#fmsg"), true);
near("r2 values", await vals(3), [1, 2.25, 4, 6.25]);
eq("r2 shown with decimal comma", await cellsText(3), ["1", "2,25", "4", "6,25"]);
eq("formula shown in header", await p.textContent("th:nth-child(5) .fx"), "= (D/2)^2");
await addF("d·c / dm g/mL", "d*c");
near("d*c values", await vals(4), [0.2, 0.4, 0.6, 0.8]);
// A formula with decimal comma and a function: sqrt(r2) = D/2 = 1; 1,5; 2; 2,5; plus 0,5.
await addF("w / mm", "sqrt([r²])+0,5");
near("sqrt formula", await vals(5), [1.5, 2, 2.5, 3]);
eq("form is cleared after adding", await p.inputValue("#f_expr"), "");

// Make r² the y column: the plot follows, with the formula column's name as axis label.
await p.selectOption('select[data-role="3"]', "y");
await p.selectOption('select[data-role="0"]', "x");
eq("plot y is r²", await p.evaluate(() => document.getElementById("plot").data[0].y), [1, 2.25, 4, 6.25]);
eq("axis label is the column name", await p.evaluate(() => document.getElementById("plot").layout.yaxis.title.text), "r² / mm²");

// Changing data recalculates: D 2 -> 2,2 gives r² = 1,1² = 1,21, w = 1,1 + 0,5 = 1,6.
await p.fill('input[data-r="0"][data-c="0"]', "2,2");
near("r2 after edit", await vals(3), [1.21, 2.25, 4, 6.25]);
eq("cell text follows without reload", (await cellsText(3))[0], "1,21");
near("plot follows", await p.evaluate(() => document.getElementById("plot").data[0].y), [1.21, 2.25, 4, 6.25]);
// Undo brings the old value back, redo the new one.
await p.click("#undo"); near("undo", await vals(3), [1, 2.25, 4, 6.25]);
await p.click("#redo"); near("redo", await vals(3), [1.21, 2.25, 4, 6.25]);
// Undo of adding a column: after the edit (undone and redone) there are the two role changes and then the last column.
for (let i = 0; i < 4; i++) await p.click("#undo");
eq("undo removes the last column", await p.evaluate(() => proj.columns.length), 5);
for (let i = 0; i < 4; i++) await p.click("#redo");
eq("redo brings the column back", await p.evaluate(() => proj.columns.length), 6);
near("redo keeps the numbers", await vals(3), [1.21, 2.25, 4, 6.25]);
// An empty cell: the dependent value is empty too.
await p.fill('input[data-r="1"][data-c="0"]', "");
eq("empty input gives empty result", (await cellsText(3))[1], "");
await p.click("#undo");
// Add a row: new row has empty formula values until typed.
await p.click("#addrow"); await p.fill('input[data-r="4"][data-c="0"]', "6");
near("new row computed", (await vals(3)), [1.21, 2.25, 4, 6.25, 9]);
await p.screenshot({ path: "evidence/phase2-step1-formula.png", fullPage: true });

// Survives reload (autosave) and save/open.
await p.reload();
await p.waitForSelector("td.calc");
near("after reload", await vals(3), [1.21, 2.25, 4, 6.25, 9]);
eq("formula kept", await p.evaluate(() => proj.columns[3].formula), "(D/2)^2");
const [dl] = await Promise.all([p.waitForEvent("download"), p.click("#saveproj")]);
const savedText = readFileSync(await dl.path(), "utf8");
eq("saved formula", JSON.parse(savedText).columns[3].formula, "(D/2)^2");
writeFileSync(dir + "/saved.plotlab", savedText);
await p.click("#example");
await p.setInputFiles("#openfile", dir + "/saved.plotlab");
await p.waitForSelector("td.calc");
near("after open", await vals(3), [1.21, 2.25, 4, 6.25, 9]);

// Remove a formula column.
await p.click('[data-delcol="5"]');
eq("column removed", await p.evaluate(() => proj.columns.map(c => c.name)), ["D / mm", "d / dm", "c / g/mL", "r² / mm²", "d·c / dm g/mL"]);

// Bad input 1: unknown column. Nothing is added, the message says which name.
await addF("falsch", "D*foo");
eq("unknown column message", await p.textContent("#fmsg"), "Unbekannte Spalte „foo“ in der Formel. Verfügbar: D, d, c, r², d·c. Die Formel darf nur Spalten links von der neuen Spalte benutzen.");
eq("nothing added", await p.evaluate(() => proj.columns.length), 5);
// Bad input 2: division by zero in one row: the column is added, that cell stays empty, the message names the row.
await addF("q / mm", "D/(c-0,1)");
eq("division message", await p.textContent("#fmsg"), "Spalte „q / mm“, Zeile 1: Division durch 0. Der Wert bleibt leer.");
eq("division cell empty, others calculated (shown to 8 digits)", await cellsText(5), ["", "30", "20", "16,666667", ""]);
await p.screenshot({ path: "evidence/phase2-step1-error.png", fullPage: true });
// Bad input 3: empty name, empty formula, duplicate name.
await addF("", "D");
eq("empty name message", await p.textContent("#fmsg"), "Bitte einen Namen für die neue Spalte eingeben, zum Beispiel „r² / mm²“.");
await addF("x", "");
eq("empty formula message", await p.textContent("#fmsg"), "Bitte eine Formel eingeben, zum Beispiel (D/2)^2.");
await addF("D / mm", "1");
eq("duplicate name message", await p.textContent("#fmsg"), "Es gibt schon eine Spalte „D / mm“. Bitte einen anderen Namen wählen.");

// A hand-edited project file: wrong stored numbers are recalculated, nothing in names or formulas runs.
await p.setInputFiles("#openfile", dir + "/hand.plotlab");
await p.waitForFunction(() => proj.columns.length === 4);
near("stored numbers are recomputed", await vals(2), [1, 2.25]);
eq("no script ran", await p.evaluate(() => window.pwn), undefined);
eq("no injected elements", await p.$$eval("#table img, #table script, #fmsg img, #fmsg script", e => e.length), 0);
eq("message for the bad formula is shown as text", (await p.textContent("#fmsg")).startsWith("Spalte „<script>window.pwn=2</script>“:"), true);
eq("no external requests", external, []);
await b.close();
if (bad) process.exit(1);
console.log("phase 2 step 1: formula columns recalculate, undo, save and report errors in the real page");
