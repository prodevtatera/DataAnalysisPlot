// Phase 4 gate: one student journey through the home page and the calmer workbench in a real browser, with the counts of the first view measured.
// Expected numbers are hand values, not read from the app: P3 line through equal-error data a = 44,25/1750 = 0,0252857 mm/N, E = (201 ± 8) GPa
// (phase3-step2-firstminute.mjs); weighted mean of V = 10,3; 10,5; 9,9; 10,1; 10,0 with u = 0,2; 0,3; 0,1; 0,2; 0,1: 10,02128 ± 0,06189 (exact fractions).
import { serve } from "./serve.mjs";
import { chromium, openTools as openAll, ALL_TOOLS } from "./tools.mjs";
let bad = 0;
const eq = (name, got, want) => { got = JSON.stringify(got); want = JSON.stringify(want); if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; } };
const yes = (name, v) => eq(name, !!v, true);

const { base, close } = await serve(["app/"], "app");
const b = await chromium.launch();
const errors = [], outside = [];
const fresh = async (w = 1200, h = 800) => {
  const c = await b.newContext({ viewport: { width: w, height: h }, locale: "de-DE" });
  const p = await c.newPage();
  p.on("pageerror", e => errors.push(String(e)));
  p.on("request", r => { if (!r.url().startsWith(base) && !r.url().startsWith("data:") && !r.url().startsWith("blob:")) outside.push(r.url()); });
  return p;
};
const home = async p => { await p.goto(base); await p.waitForFunction(() => /^D = \(/.test(document.getElementById("res").textContent)); };
const example = p => p.waitForFunction(() => /E = \(201 ± 8\) GPa/.test(document.getElementById("introres").textContent), null, { timeout: 120000 });
const lines = p => p.$$eval("#results .res", e => e.map(x => x.textContent));
const fitted = p => p.waitForFunction(() => !document.getElementById("fit").disabled, null, { timeout: 120000 });
const openTools = p => p.evaluate(() => [...document.querySelectorAll("[data-tool-panel]")].filter(e => e.checkVisibility()).map(e => e.dataset.toolPanel));
// What a student sees: not hidden, not in a closed menu; Plotly's own chart toolbar is not counted (same rule as phase4-step2-tools.mjs).
const count = p => p.evaluate(() => ({
  sections: [...document.querySelectorAll("main section")].filter(e => e.checkVisibility({ checkVisibilityCSS: true })).map(e => e.id || e.dataset.toolPanel),
  buttons: [...document.querySelectorAll("button, label.btn, summary")].filter(e => e.checkVisibility({ checkVisibilityCSS: true }) && !e.closest(".modebar")).length,
  height: document.documentElement.scrollHeight, width: document.documentElement.scrollWidth, win: innerWidth,
  plotBottom: Math.round(document.getElementById("plot")?.getBoundingClientRect().bottom), noteBottom: Math.round(document.getElementById("introres")?.getBoundingClientRect().bottom),
}));
const drop = (p, name, type, content) => p.evaluate(([n, t, c]) => {
  const dt = new DataTransfer(); dt.items.add(new File([c], n, { type: t }));
  document.body.dispatchEvent(new DragEvent("dragover", { dataTransfer: dt, bubbles: true, cancelable: true }));
  document.body.dispatchEvent(new DragEvent("drop", { dataTransfer: dt, bubbles: true, cancelable: true }));
}, [name, type, content]);
const GERMAN = ["Berechnen", "Speichern", "Vorlage", "Diagramm", "Tabelle", "Projekt", "Bitte", "Anpassen", "Anpassung", "Messwert", "Mittelwert", "Unsicherheit", "Leere", "Versuch", "Rückgängig", "Wiederholen", "Werkzeug", "Datei wählen", "Beispiel"];

// 1. Home page at 1200 x 800: the first thing a student sees.
let p = await fresh();
await home(p);
let c = await count(p);
console.log(`home page at 1200 x 800: sections ${c.sections.length}, buttons ${c.buttons}, page height ${c.height} px`);
eq("home: no sideways scroll", c.width <= c.win, true);
await p.screenshot({ path: "evidence/phase4-step6-1-home.png" });

// 2. "Beispiel öffnen": the workbench with the finished example, no further click. Measure the first view.
await Promise.all([p.waitForURL(/app\.html/), p.click("#go_example")]);
await p.waitForFunction(() => document.querySelectorAll("#plot .scatterlayer .trace").length > 0, null, { timeout: 120000 });
const atPlot = await count(p);
await example(p);
// The E line appears before the second fit (the two series) has finished; wait until the page height stops changing, then measure.
await p.waitForFunction(() => { const h = document.documentElement.scrollHeight, w = window.__h; window.__h = h; if (h !== w) window.__t = Date.now(); return Date.now() - (window.__t || 0) > 1500; }, null, { timeout: 60000, polling: 250 });
c = await count(p);
console.log(`workbench first view at 1200 x 800: plot drawn: sections ${atPlot.sections.length}, buttons ${atPlot.buttons}, page height ${atPlot.height} px`);
console.log(`workbench first view at 1200 x 800: example fitted: sections ${c.sections.length} (${c.sections.join(", ")}), buttons ${c.buttons}, page height ${c.height} px, plot ends at y = ${c.plotBottom}, E note ends at y = ${c.noteBottom}`);
yes("at most 4 sections (before: 16)", c.sections.length <= 4);
yes("at most 15 buttons (before: 55)", c.buttons <= 15);
yes("page at most 2600 px high with the finished example (before: 6441)", c.height <= 2600);
yes("the whole plot and the E result are inside the 800 px window", c.plotBottom <= 800 && c.noteBottom <= 800);
eq("E line without a click", (await lines(p)).slice(0, 3), ["a = (0,02529 ± 0,00029) mm/N", "b = (0,007 ± 0,011) mm", "E = (201 ± 8) GPa"]);
eq("no tool is open at first", await openTools(p), []);
await p.screenshot({ path: "evidence/phase4-step6-2-example.png" });
// For comparison with the old page, where every tool was always open: open all 13 tools and measure again.
await openAll(p, ...ALL_TOOLS);
c = await count(p);
console.log(`workbench with all 13 tools opened by hand: sections ${c.sections.length}, buttons ${c.buttons}, page height ${c.height} px`);
eq("all 13 tools can be opened", (await openTools(p)).length, 13);
await p.close();

// 3. A template card on the home page: P2 with its two tools only, own numbers pasted in, weighted mean.
p = await fresh(); await home(p);
await Promise.all([p.waitForURL(/app\.html/), p.click('.card[href$="=p2"]')]);
await p.waitForFunction(() => typeof proj !== "undefined" && proj && proj.template === "p2");
await fitted(p);
eq("P2 opens exactly its tools", await openTools(p), ["stats", "wmean"]);
c = await count(p);
console.log(`template P2 at 1200 x 800: sections ${c.sections.length} (${c.sections.join(", ")}), buttons ${c.buttons}, page height ${c.height} px`);
await p.evaluate(() => {
  const el = document.querySelector('#table input[data-r="0"][data-c="2"]'), dt = new DataTransfer(); dt.setData("text", "10,3\t0,2\r\n10,5\t0,3\r\n9,9\t0,1\r\n10,1\t0,2\r\n10,0\t0,1\r\n");
  el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
});
eq("pasting own numbers keeps the tools open", await openTools(p), ["stats", "wmean"]);
await p.click("#w_go"); await fitted(p);
eq("weighted mean of own numbers", (await lines(p)).filter(l => l.startsWith("Gewichteter")), ["Gewichteter Mittelwert = (10,02 ± 0,06) cm³"]);
await p.screenshot({ path: "evidence/phase4-step6-3-template.png" });
await p.close();

// 4. A dropped German CSV on the home page arrives in the workbench; fit; then a picture is refused on the home page.
p = await fresh(); await home(p);
const csv = "﻿F / N;ΔL / mm;sΔL / mm\r\n10;0,26;0,02\r\n20;0,50;0,02\r\n30;0,77;0,02\r\n40;1,03;0,02\r\n50;1,28;0,02\r\n60;1,51;0,02\r\n";
await drop(p, "messung.csv", "text/csv", csv);
await p.waitForURL(/app\.html/);
await p.waitForFunction(() => typeof proj !== "undefined" && proj && proj.columns[0].name === "F / N");
await fitted(p); await p.click("#fit"); await fitted(p);
eq("dropped file: fit line (hand value 44,25/1750)", (await lines(p))[0], "a = (0,02529 ± 0,00029) mm/N");
await p.screenshot({ path: "evidence/phase4-step6-4-dropped.png" });
await p.goto(base); await p.waitForFunction(() => /^D = \(/.test(document.getElementById("res").textContent));
await drop(p, "foto.png", "image/png", "\x89PNG\r\n\x1a\n\0\0");
await p.waitForFunction(() => !document.getElementById("homemsg").hidden);
eq("a picture is refused, the page stays on the home page", [await p.evaluate(() => location.pathname), (await p.textContent("#homemsg")).includes("keine Tabelle")], ["/", true]);
await p.close();

// 5. English, end to end: home, example, workbench; no German word left anywhere.
p = await fresh(); await home(p);
await p.click("#lang_en");
eq("English home", await p.textContent("h1"), "From measurements to a finished lab-report plot");
await Promise.all([p.waitForURL(/app\.html/), p.click("#go_example")]);
await example(p);
eq("English example result lines", (await lines(p)).slice(0, 3), ["a = (0.02529 ± 0.00029) mm/N", "b = (0.007 ± 0.011) mm", "E = (201 ± 8) GPa"]);
const text = await p.evaluate(() => { const g = document.getElementById("plot"), l = g.layout || {}; return [document.body.innerText, ...(g.data || []).map(t => t.name || ""), l.xaxis?.title?.text || "", l.yaxis?.title?.text || ""].join("\n"); });
eq("no German word on the English workbench or plot", GERMAN.filter(w => text.includes(w)), []);
await p.screenshot({ path: "evidence/phase4-step6-5-english.png" });
await p.close();

eq("no request left the machine", outside, []);
eq("no script errors", errors, []);
await b.close(); close();
if (bad) process.exit(1);
console.log("phase 4 gate: home page, example, template, dropped file and English end to end OK");
