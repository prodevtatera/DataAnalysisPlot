// Phase 1 step 8: P3 Elasticity start to finish in the real page, timed, with the user actions counted.
// Expected numbers are the ones calculated separately by hand in step 6 (weighted line fit, E = 4L/(pi d^2 a)), not taken from the app.
// An "action" = one click on a button or list, or one paste/entry into one field (focusing a field is not counted).
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";
import { serve } from "./serve.mjs";
const { chromium } = createRequire(resolve("testbuild/x.js"))("playwright-core");
let bad = 0;
const eq = (name, got, want) => {
  got = JSON.stringify(got); want = JSON.stringify(want);
  if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; }
};
// What the student copies from Excel or a lab sheet: German decimal commas, semicolons.
const pasted = "F / N;ΔL / mm;sΔL / mm\n10;0,26;0,02\n20;0,50;0,02\n30;0,77;0,02\n40;1,03;0,02\n50;1,28;0,02\n60;1,51;0,02";

const { base, close } = await serve();
const br = await chromium.launch();
const ctx = await br.newContext({ viewport: { width: 1200, height: 2500 }, acceptDownloads: true });
const p = await ctx.newPage();
await p.goto(base + "app/index.html");
await p.evaluate(() => localStorage.clear());
await p.reload();
const t0 = Date.now();
await p.waitForFunction(() => document.getElementById("fitstate").textContent === "Bereit.", null, { timeout: 120000 });
const loadMs = Date.now() - t0;

// Bad input first: empty paste and text instead of numbers give a clear message and no table.
await p.click("#pastego");
eq("empty paste message", await p.textContent("#msg"), "Keine Daten eingefügt. Füge Zahlen ein oder lade das Beispiel.");
await p.fill("#paste", "F / N;ΔL / mm\n10;abc");
await p.click("#pastego");
eq("text instead of a number", await p.textContent("#msg"), "Zeile 2, Spalte 2: „abc“ ist keine Zahl.");
eq("no table after bad paste", await p.$$eval("#table input", e => e.length), 0);

// The timed run.
let actions = 0;
const act = async f => { actions++; await f(); };
const t1 = Date.now();
await act(() => p.fill("#paste", pasted));
await act(() => p.click("#pastego"));
eq("default roles x, y, y error", await p.$$eval("select.role", s => s.map(e => e.value)), ["x", "y", "yerr"]);
eq("weighting on by default", await p.isChecked("#weighted"), true);
await act(() => p.click("#fit"));
await p.waitForSelector("#results .res");
// Since Phase 2 step 7 the E form is a template button plus one field for L and d (before: four entries).
await act(() => p.click("#d_tE"));
await act(() => p.fill("#d_vars", "L = 1 ± 0,002; d = 0,5 ± 0,01"));
await act(() => p.click("#derive"));
const lines = await p.$$eval("#results .res", e => e.map(x => x.textContent));
const dl = p.waitForEvent("download");
await act(() => p.click("#saveproj"));
const file = await (await dl).path();
const runMs = Date.now() - t1;
console.log(`TIMED P3 run: ${runMs} ms, ${actions} actions (Python load before the run, once per visit: ${loadMs} ms)`);
eq("result lines", lines, ["a = (0,02529 ± 0,00029) mm/N", "b = (0,007 ± 0,011) mm", "E = (201 ± 8) GPa"]);
eq("action count", actions, 7);
eq("fit method on screen", (await p.textContent("#results")).includes("gewichtete Methode der kleinsten Quadrate (Gewichte 1/s²); Fehler mit √(χ²/DoF) skaliert"), true);
eq("no stale result", await p.$$eval(".stalemsg", e => e.length), 0);
eq("plot has points and fit line", await p.evaluate(() => document.getElementById("plot").data.map(t => t.name)), ["Messwerte", "Anpassung"]);
await p.screenshot({ path: "evidence/phase1-step8-timed.png", fullPage: true });

// Gate: edit a cell -> results out of date; undo -> back. (Plot and fit follow.)
const before = await p.evaluate(() => document.getElementById("plot").data[0].y.join());
await p.fill('input[data-r="0"][data-c="1"]', "0,3");
eq("edit changes the plot", await p.evaluate(() => document.getElementById("plot").data[0].y[0]), 0.3);
eq("edit marks both results out of date", await p.$$eval(".stalemsg", e => e.length), 2);
await p.click("#undo");
eq("undo restores the plot", await p.evaluate(() => document.getElementById("plot").data[0].y.join()), before);
eq("undo makes results fresh", await p.$$eval(".stalemsg", e => e.length), 0);

// Gate: save, close, reopen -> nothing lost. A new browser context has no autosave, so only the file can bring it back.
const saved = JSON.parse(readFileSync(file, "utf8"));
const ctx2 = await br.newContext({ viewport: { width: 1200, height: 2500 } });
const p2 = await ctx2.newPage();
await p2.goto(base + "app/index.html");
await p2.setInputFiles("#openfile", file);
await p2.waitForSelector("#results .res");
eq("reopened results", await p2.$$eval("#results .res", e => e.map(x => x.textContent)), lines);
eq("reopened data and roles", await p2.evaluate(() => JSON.stringify(proj.columns)), JSON.stringify(saved.columns));
eq("reopened inputs", await p2.inputValue("#d_vars"), "L = 1 ± 0,002; d = 0,5 ± 0,01");
eq("reopened results are fresh", await p2.$$eval(".stalemsg", e => e.length), 0);
await br.close(); close();
if (bad) process.exit(1);
console.log("phase 1 step 8: P3 start to finish (paste, fit, derived E, save) works; edit/undo and save/reopen keep everything");
