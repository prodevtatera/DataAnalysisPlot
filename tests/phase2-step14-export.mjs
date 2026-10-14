// Phase 2 step 14: save every plot of the app page as PNG (2400 x 1400) and SVG (real text, no raster).
// The page checks the files themselves; the texts to look for are typed by hand from what the page must show.
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { serve } from "./serve.mjs";
import { chromium } from "./tools.mjs";
let bad = 0;
const eq = (name, got, want) => { got = JSON.stringify(got); want = JSON.stringify(want); if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; } };

const L = "9.5 9.6 9.7 9.7 9.8 9.8 9.8 9.9 9.9 9.9 10.0 10.0 10.0 10.0 10.05 10.05 10.1 10.1 10.1 10.2 10.2 10.2 10.2 10.2 10.3 10.3 10.4 10.4 10.5 10.6".split(" ").map(v => v.replace(".", ","));
const N = [4,7,9,6,8,5,10,7,6,8, 9,3,7,11,6,8,7,5,9,6, 8,10,4,7,6,12,7,5,8,9];
const DECAY = "t / min;N / 1;sN / 1\n0;980;31,3\n2;640;25,3\n4;410;20,2\n6;270;16,4\n8;170;13,0\n10;110;10,5";
const BTNS = ["plot", "histplot", "cumplot", "gofplot"].flatMap(i => [i + "_png", i + "_svg"]);

const { base, close } = await serve();
const br = await chromium.launch();
const ctx = await br.newContext({ acceptDownloads: true, viewport: { width: 1200, height: 3400 } });
const p = await ctx.newPage();
await p.goto(base + "app/index.html?start=leer");
await p.evaluate(() => localStorage.clear()); await p.reload();
const off = () => p.evaluate(ids => ids.map(i => document.getElementById(i).disabled), BTNS);   // by id in this order (the main plot's buttons moved into the "Diagramm speichern" tool, so document order is no longer this order)
const paste = t => p.fill("#paste", t).then(() => p.click("#pastego"));
const grab = async (id, fmt, tag) => {
  const [d] = await Promise.all([p.waitForEvent("download"), p.click(`#${id}_${fmt}`)]);
  const f = `evidence/phase2-step14-${tag}.${fmt}`; await d.saveAs(f);
  return { name: d.suggestedFilename(), data: await readFile(f), file: f };
};
const checkPng = (tag, g, name) => { eq(`${tag} PNG name`, g.name, name + ".png"); eq(`${tag} PNG signature`, [...g.data.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]); eq(`${tag} PNG 2400 x 1400`, [g.data.readUInt32BE(16), g.data.readUInt32BE(20)], [2400, 1400]); eq(`${tag} PNG is not blank (> 15 kB)`, g.data.length > 15000, true); };
const checkSvg = (tag, g, name, texts, minPaths) => {
  const s = g.data.toString("utf8");
  eq(`${tag} SVG name`, g.name, name + ".svg"); eq(`${tag} SVG starts with <svg`, s.trimStart().startsWith("<svg"), true);
  for (const t of texts) eq(`${tag} SVG has the text "${t}" as text`, s.includes(`>${t}</text>`) || s.includes(`>${t}<`), true);
  eq(`${tag} SVG has no embedded raster`, /<image\b/.test(s), false);
  eq(`${tag} SVG has at least ${minPaths} paths`, (s.match(/<path\b/g) || []).length >= minPaths, true);
};

// Nothing to export yet: all 8 buttons are off.
eq("all buttons off without data", await off(), Array(8).fill(true));

// 1. The main plot with y error bars (P8 decay series).
await paste(DECAY);
eq("main plot buttons on, others off", await off(), [false, false, true, true, true, true, true, true]);
let g = await grab("plot", "png", "plot"); checkPng("plot", g, "diagramm");
g = await grab("plot", "svg", "plot"); checkSvg("plot", g, "diagramm", ["t / min", "N / 1"], 12);   // 6 points: at least 6 error bars plus axes
// Semi-log plot, still with its error bars.
await p.check("#logy");
g = await grab("plot", "svg", "semilog"); checkSvg("semilog", g, "diagramm", ["t / min", "N / 1"], 12);
eq("semi-log SVG has 6 error bars drawn", (g.data.toString("utf8").match(/class="yerror"/g) || []).length, 6);
const png = await grab("plot", "png", "semilog"); checkPng("semilog", png, "diagramm");
await p.screenshot({ path: "evidence/phase2-step14-page.png", fullPage: true });
// Bad input: a zero on the log axis removes the plot, and the buttons go off with it.
await p.fill('input[data-r="2"][data-c="1"]', "0");
eq("log axis with a zero: no plot, buttons off", (await off()).slice(0, 2), [true, true]);
await p.fill('input[data-r="2"][data-c="1"]', "410");
eq("repaired: buttons on again", (await off()).slice(0, 2), [false, false]);

// 2. Histogram, cumulative plot and chi-square plot from 30 readings and 30 counts.
await paste("l / mm;N\n" + L.map((v, i) => v + ";" + N[i]).join("\n"));
await p.waitForFunction(() => !document.getElementById("fit").disabled, null, { timeout: 120000 });
eq("hist, cum and gof buttons are off before they are calculated", (await off()).slice(2), Array(6).fill(true));
await p.selectOption("#h_col", "l / mm"); await p.fill("#h_w", "0,2"); await p.fill("#h_s", "9,5"); await p.click("#h_go");
eq("hist and cum buttons on, gof off", (await off()).slice(2), [false, false, false, false, true, true]);
g = await grab("histplot", "png", "hist"); checkPng("hist", g, "histogramm");
g = await grab("histplot", "svg", "hist"); checkSvg("hist", g, "histogramm", ["l / mm", "Anzahl der Messwerte"], 8);
g = await grab("cumplot", "png", "cum"); checkPng("cum", g, "summenhaeufigkeit");
g = await grab("cumplot", "svg", "cum"); checkSvg("cum", g, "summenhaeufigkeit", ["l / mm", "Kumulierte Häufigkeit / %"], 4);
await p.selectOption("#g_col", "N"); await p.fill("#g_w", "1"); await p.fill("#g_s", "3"); await p.click("#g_go");
await p.waitForFunction(() => !document.getElementById("g_go").disabled && document.getElementById("gofplot").querySelector(".main-svg"));
eq("gof buttons on", (await off()).slice(6), [false, false]);
g = await grab("gofplot", "png", "gof"); checkPng("gof", g, "chi2-test");
g = await grab("gofplot", "svg", "gof"); checkSvg("gof", g, "chi2-test", ["N (Zählwert je Intervall)", "Anzahl der Intervalle"], 8);
await p.screenshot({ path: "evidence/phase2-step14-page-all.png", fullPage: true });

// 3. Editing a length removes the histogram and the cumulative plot (out of date): their buttons go off. The count column is untouched, so the chi-square plot stays.
await p.fill('input[data-r="0"][data-c="0"]', "9,55");
eq("stale: hist and cum buttons off, gof still on", (await off()).slice(2), [true, true, true, true, false, false]);

// 4. A failing export gives a clear message instead of nothing.
await p.click("#undo");
await p.evaluate(() => { Plotly.toImage = () => Promise.reject(new Error("boom")); });
await p.click("#histplot_png");
await p.waitForFunction(() => !document.querySelector("#histplot + .btns + .msg").hidden);
eq("failed export message", await p.textContent("#histplot + .btns + .msg"), "Das Diagramm konnte nicht gespeichert werden.");
await br.close(); close();
if (bad) process.exit(1);
console.log("phase 2 step 14: PNG 2400x1400 and SVG with real text for the main plot, semi-log plot, histogram, cumulative plot and chi-square plot");
