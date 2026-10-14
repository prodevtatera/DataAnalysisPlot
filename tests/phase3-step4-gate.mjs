// Phase 3 gate, the part that can be done alone: one student journey through every Phase 3 item in the real page.
// 1 first minute: fresh visit shows the finished example; 2 drop a file; 3 English; 4 paste own numbers into a template.
// Expected numbers are hand values: weighted mean of V = 10,3; 10,5; 9,9; 10,1; 10,0 with u = 0,2; 0,3; 0,1; 0,2; 0,1 (w = 1/u^2, sum w = 2350/9,
// mean = 10,02128, u = 1/sqrt(sum w) = 0,06189, so (10,02 ± 0,06) cm³, exact fractions in plain Python, not read from the app);
// P3 line through equal-error data: a = 44,25/1750 = 0,0252857 mm/N (see phase3-step2-firstminute.mjs).
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { serve } from "./serve.mjs";
import { chromium } from "./tools.mjs";
let bad = 0;
const eq = (name, got, want) => { got = JSON.stringify(got); want = JSON.stringify(want); if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; } };
const yes = (name, v) => eq(name, !!v, true);

const { base, close } = await serve();
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });   // fresh profile
const p = await ctx.newPage();
const errors = [], external = [];
p.on("pageerror", e => errors.push(String(e)));
p.on("request", r => { if (!r.url().startsWith(base) && !r.url().startsWith("data:") && !r.url().startsWith("blob:")) external.push(r.url()); });
const lines = () => p.$$eval("#results .res", e => e.map(x => x.textContent));
const msg = async () => (await p.isVisible("#msg")) ? p.textContent("#msg") : null;
const ready = () => p.waitForFunction(() => !document.getElementById("fit").disabled, null, { timeout: 120000 });
const state = () => p.evaluate(() => JSON.stringify(proj));
const paste = (r, c, text) => p.evaluate(([r, c, t]) => {
  const el = document.querySelector(`#table input[data-r="${r}"][data-c="${c}"]`), dt = new DataTransfer(); dt.setData("text", t);
  const ev = new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }); el.dispatchEvent(ev); return ev.defaultPrevented;
}, [r, c, text]);
const drop = (name, type, content) => p.evaluate(([n, t, c]) => {
  const dt = new DataTransfer(); dt.items.add(new File([c], n, { type: t }));
  document.body.dispatchEvent(new DragEvent("dragover", { dataTransfer: dt, bubbles: true, cancelable: true }));
  document.body.dispatchEvent(new DragEvent("drop", { dataTransfer: dt, bubbles: true, cancelable: true }));
}, [name, type, content]);
// All text a student can see: the page text plus the plot texts (title, axis titles, legend names).
const seen = () => p.evaluate(() => {
  const g = document.getElementById("plot"), l = g.layout || {};
  const txt = [document.body.innerText, ...(g.data || []).map(t => t.name || ""), l.xaxis?.title?.text || "", l.yaxis?.title?.text || ""];
  return txt.join("\n");
});
const GERMAN = ["Berechnen", "Speichern", "Vorlage", "Diagramm", "Tabelle", "Projekt", "Bitte", "Anpassen", "Anpassung", "Messwert", "Mittelwert", "Unsicherheit", "Wiederhergestellt", "Leere", "Fehler", "Versuch", "Daten einfügen", "Rückgängig", "Wiederholen"];

// ---- 1. First minute: nothing saved, nothing clicked.
const t0 = Date.now();
await p.goto(base + "app/index.html");
await p.waitForFunction(() => document.querySelectorAll("#plot .scatterlayer .trace").length > 0, null, { timeout: 120000 });
const tPlot = Date.now() - t0;
await p.waitForFunction(() => /E = \(201 ± 8\) GPa/.test(document.getElementById("introres").textContent), null, { timeout: 120000 });
const tResult = Date.now() - t0;
console.log(`gate 1 first visit (Apple M5, Chromium, local server): plot after ${tPlot} ms, fit and E = (201 ± 8) GPa after ${tResult} ms`);
yes("plot within 10 s", tPlot < 10000);
eq("a = line, E line without a click", (await lines()).slice(0, 3), ["a = (0,02529 ± 0,00029) mm/N", "b = (0,007 ± 0,011) mm", "E = (201 ± 8) GPa"]);
// "In the first view" (1280 x 800 window, no scrolling): the result note is fully inside, the plot starts inside; the plot is 420 px high and
// ends below the fold at this window height (known, see docs/phase3-report.md), so only its upper part is visible.
const view = await p.evaluate(() => { const r = i => document.getElementById(i).getBoundingClientRect(), pl = r("plot"), n = r("introres"); return { note: n.bottom <= innerHeight, plotTop: pl.top < innerHeight - 200, plotH: Math.round(pl.height), plotBottom: Math.round(pl.bottom) }; });
console.log(`gate 1 first view at 1280 x 800: plot ${view.plotH} px high, ends at y = ${view.plotBottom} px`);
eq("result note and top of the plot are in the first view", [view.note, view.plotTop], [true, true]);
yes("note says the data are invented", (await p.textContent("#intro")).includes("erfundene Daten"));
await p.screenshot({ path: "evidence/phase3-step4-first.png" });
const exampleState = await state();

// ---- 2. English on: the whole page, the plot and the result lines; nothing in the data changes.
await p.click("#lang_en");
eq("English lang attribute", await p.evaluate(() => document.documentElement.lang), "en");
eq("data and results unchanged", await state(), exampleState);
eq("English result lines (decimal point)", (await lines()).slice(0, 3), ["a = (0.02529 ± 0.00029) mm/N", "b = (0.007 ± 0.011) mm", "E = (201 ± 8) GPa"]);
let s = await seen();
eq("no German word on the English page or plot", GERMAN.filter(w => s.includes(w)), []);
await p.screenshot({ path: "evidence/phase3-step4-en.png" });

// ---- 3. A student's own file dropped on the page while English is on: German semicolon CSV, then a fit in English.
const csv = "﻿F / N;ΔL / mm;sΔL / mm\r\n10;0,26;0,02\r\n20;0,50;0,02\r\n30;0,77;0,02\r\n40;1,03;0,02\r\n50;1,28;0,02\r\n60;1,51;0,02\r\n";
await drop("messung.csv", "text/csv", csv);
await p.waitForFunction(() => proj.columns[0].name === "F / N");
await p.click("#fit"); await ready();
eq("dropped file, English fit line", (await lines())[0], "a = (0.02529 ± 0.00029) mm/N");
// Bad input in English: a picture dropped on the page.
const before = await state();
await drop("foto.png", "image/png", "\x89PNG\r\n\x1a\n\0\0");
await p.waitForFunction(() => document.getElementById("msg").textContent.includes("foto"));
const m = await msg();
yes("English message for a picture", m.includes("not a table") && !GERMAN.some(w => m.includes(w)));
eq("picture changed nothing", await state(), before);
await p.screenshot({ path: "evidence/phase3-step4-en-error.png", fullPage: true });

// ---- 4. Own numbers into a template, English on: P2, paste V and u (5 x 2) into the first V cell, weighted mean.
await p.selectOption("#tpl_sel", "p2"); await p.click("#tpl_load"); await ready();
yes("template box in English", (await p.textContent("#tpl_info")).includes("Invented example data"));
eq("paste with a letter: English message, nothing changed", await (async () => { const s0 = await state(); await paste(0, 2, "10,3\t0,2\nx\t0,3"); return [await msg(), s0 === await state()]; })(),
  ["Pasted block, row 2, column 1: “x” is not a number. Nothing was changed.", true]);
eq("paste of own numbers is taken over", await paste(0, 2, "10,3\t0,2\r\n10,5\t0,3\r\n9,9\t0,1\r\n10,1\t0,2\r\n10,0\t0,1\r\n"), true);
await p.click("#w_go"); await ready();
eq("weighted mean of own numbers, English", (await lines()).filter(l => l.startsWith("Weighted")), ["Weighted mean = (10.02 ± 0.06) cm³"]);
// Overlap check, hand intervals x ± u: [10,1; 10,5] [10,2; 10,8] [9,8; 10,0] [9,9; 10,3] [9,9; 10,1]. Gaps: rows 1/3 0,1; 2/3 0,2; 2/5 0,1.
// Rows 1/5 only touch (0,3 = 0,2 + 0,1), so they must not be listed (found at this gate: a rounding gap of 7e-17 was listed).
const detail = await p.textContent("#results");
yes("overlap names rows 1/3, 2/3, 2/5 with hand gaps", detail.includes("row 1 and row 3 (gap 0.1 cm³); row 2 and row 3 (gap 0.2 cm³); row 2 and row 5 (gap 0.1 cm³)"));
yes("touching rows 1 and 5 are not listed", !detail.includes("row 1 and row 5"));
await p.screenshot({ path: "evidence/phase3-step4-own.png", fullPage: true });
// Back to German: the same result in the German format, project file identical, choice survives a reload.
const own = await state();
await p.click("#lang_de");
eq("German result line of the same numbers", (await lines()).filter(l => l.startsWith("Gewichteter")), ["Gewichteter Mittelwert = (10,02 ± 0,06) cm³"]);
eq("switching language does not change the project", await state(), own);
await p.reload(); await p.waitForFunction(() => document.getElementById("fitstate").textContent === "Bereit.", null, { timeout: 120000 });
eq("returning visit keeps German and the pasted numbers", [await p.evaluate(() => document.documentElement.lang), await p.evaluate(() => proj.columns.find(c => c.name === "V / cm³").values)], ["de", [10.3, 10.5, 9.9, 10.1, 10]]);

// ---- 5. Blank start and a project file, in German.
await p.click("#blank");
eq("empty table", await p.evaluate(() => proj.columns.map(c => c.values.every(v => v === null))), [true, true, true]);
await drop("projekt.plotlab", "", own);
await p.waitForFunction(() => proj.template === "p2");
eq("dropped project equals the saved one", await state(), JSON.stringify(JSON.parse(own)));

eq("no request left the local server (no signup, no tracking, no CDN)", external, []);
eq("page errors", errors, []);
await b.close(); close();
console.log(bad ? `${bad} FAILED` : "all checks passed");
process.exit(bad ? 1 : 0);
