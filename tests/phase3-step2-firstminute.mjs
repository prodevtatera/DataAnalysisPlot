// Phase 3 step 2: first visit = finished example; a dropped file loads; "Leere Tabelle" starts empty; a returning visit restores the autosave.
// Expected numbers are hand values: weighted line through the P3 loading data with equal errors 0,02 is the ordinary least-squares line:
// xbar = 35, sum (x-xbar)^2 = 1750, sum (x-xbar) y = 44,25, a = 44,25/1750 = 0,0252857 mm/N (written here, not read from the app).
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { serve } from "./serve.mjs";
const req = createRequire(import.meta.url);
const { classifyDrop } = req("../app/drop.js");
import { chromium } from "./tools.mjs";
let bad = 0;
const eq = (name, got, want) => { got = JSON.stringify(got); want = JSON.stringify(want); if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; } };
const yes = (name, v) => eq(name, !!v, true);

// ---- Pure part: what is a dropped file?
eq("csv is a table", classifyDrop("a.csv", "text/csv", "﻿x;y\n1;2"), { kind: "table", text: "x;y\n1;2" });
eq("no type (some browsers) is still read by its content", classifyDrop("daten", "", "1;2\n3;4"), { kind: "table", text: "1;2\n3;4" });
eq("plotlab is a project", classifyDrop("p.plotlab", "", "{}").kind, "project");
eq("json text is a project, whatever the name", classifyDrop("p.txt", "text/plain", ' {"a":1}').kind, "project");
yes("image refused", classifyDrop("a.png", "image/png", "x").error.includes("keine Tabelle"));
yes("binary refused", classifyDrop("a.dat", "", "ab\0cd").error.includes("keine Tabelle"));
yes("excel refused with advice", classifyDrop("a.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "PK").error.includes("CSV"));
yes("text without numbers refused", classifyDrop("n.txt", "text/plain", "Hallo Welt").error.includes("keine Zahlen"));

// ---- Real page.
const { base, close } = await serve();
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });   // a fresh profile: nothing saved
const p = await ctx.newPage();
const errors = [];
p.on("pageerror", e => errors.push(String(e)));
const lines = () => p.$$eval("#results .res", e => e.map(x => x.textContent));
const msg = async () => (await p.isVisible("#msg")) ? p.textContent("#msg") : null;
const state = () => p.evaluate(() => JSON.stringify(proj));
const ready = () => p.waitForFunction(() => !document.getElementById("fit").disabled, null, { timeout: 120000 });
const traces = () => p.evaluate(() => (document.getElementById("plot").data || []).map(t => t.name));

// 1. First visit: example, plotted, fitted, result line, no click.
const t0 = Date.now();
await p.goto(base + "app/app.html");
await p.waitForFunction(() => document.querySelectorAll("#plot .scatterlayer .trace").length > 0, null, { timeout: 120000 });
const tPlot = Date.now() - t0;
await p.waitForFunction(() => /E = \(201 ± 8\) GPa/.test(document.getElementById("introres").textContent), null, { timeout: 120000 });
const tResult = Date.now() - t0;
console.log(`first visit (Apple M5, Chromium, local server, no cache restrictions): plot after ${tPlot} ms, fit and E = (201 ± 8) GPa after ${tResult} ms`);
yes("plot appears within 10 s", tPlot < 10000);
eq("headline in the note", await p.textContent("#introres"), "E = (201 ± 8) GPa");
eq("result lines (fit, E, series)", await lines(), ["a = (0,02529 ± 0,00029) mm/N", "b = (0,007 ± 0,011) mm", "E = (201 ± 8) GPa", "a (ΔL auf) = (0,02529 ± 0,00029) mm/N", "b (ΔL auf) = (0,007 ± 0,011) mm", "a (ΔL ab) = (0,02502 ± 0,00020) mm/N", "b (ΔL ab) = (0,052 ± 0,006) mm"]);
yes("plot names the fit lines", (await traces()).some(n => n.startsWith("Anpassung ΔL auf")) && (await traces()).some(n => n.startsWith("Anpassung ΔL ab")));
yes("note says data are invented", (await p.textContent("#tpl_info")).includes("Erfundene Beispieldaten") && (await p.textContent("#intro")).includes("erfundene Daten"));
eq("every result is fresh", await p.$$eval("#results .result.stale", e => e.length), 0);
eq("undo history starts clean", [await p.isDisabled("#undo"), await p.isDisabled("#redo")], [true, true]);
eq("the three results are there", await p.evaluate(() => proj.results.map(r => r.kind)), ["fit", "derived", "series"]);
eq("no message", await msg(), null);
yes("blank button is visible", await p.isVisible("#blank"));
await p.screenshot({ path: "evidence/phase3-step2-firstminute.png" });

// 2. Returning visit: the autosave is restored, not the example. Edit one cell first.
await p.fill('#table input[data-r="0"][data-c="1"]', "0,27");
await p.reload(); await ready();
eq("returning visit: edited value restored", await p.evaluate(() => proj.columns[1].values[0]), 0.27);
yes("returning visit: restore note, no first-visit note", (await p.textContent("#note")).startsWith("Wiederhergestellt") && await p.isHidden("#intro"));
yes("returning visit: the edit made results out of date", (await p.$$eval("#results .result.stale", e => e.length)) > 0);

// 3. "Leere Tabelle": an empty table, a clear message for a fit without data, then paste fills it.
await p.click("#blank");
eq("empty table: columns", await p.evaluate(() => proj.columns.map(c => [c.name, c.role, c.values.length, c.values.every(v => v === null)])), [["x", "x", 8, true], ["y", "y", 8, true], ["sy", "yerr", 8, true]]);
eq("empty table: no results, intro gone", [await p.$$eval("#results .res", e => e.length), await p.isHidden("#intro"), await msg()], [0, true, null]);
await p.click("#fit");
eq("fit without data: clear message", await p.textContent("#fitmsg"), "Die Anpassung ist fehlgeschlagen. Es braucht mindestens drei Messpunkte mit x und y.");
await p.screenshot({ path: "evidence/phase3-step2-blank.png" , fullPage: true });

// 4. Drop a German CSV (BOM, CRLF, semicolons, decimal commas): table, plot, then a fit gives the hand value.
const drop = (name, type, content) => p.evaluate(([n, t, c]) => {
  const dt = new DataTransfer(); dt.items.add(new File([c], n, { type: t }));
  const over = new DragEvent("dragover", { dataTransfer: dt, bubbles: true, cancelable: true }); document.body.dispatchEvent(over);
  const dropping = document.body.classList.contains("dropping");
  const ev = new DragEvent("drop", { dataTransfer: dt, bubbles: true, cancelable: true }); document.body.dispatchEvent(ev);
  return [over.defaultPrevented, dropping, ev.defaultPrevented, document.body.classList.contains("dropping")];
}, [name, type, content]);
const csv = "﻿F / N;ΔL / mm;sΔL / mm\r\n10;0,26;0,02\r\n20;0,50;0,02\r\n30;0,77;0,02\r\n40;1,03;0,02\r\n50;1,28;0,02\r\n60;1,51;0,02\r\n";
eq("drag over shows the drop frame, drop is taken over and clears it", await drop("messung.csv", "text/csv", csv), [true, true, true, false]);
await p.waitForFunction(() => proj.columns[0].name === "F / N");
eq("dropped csv: columns, roles, values", await p.evaluate(() => proj.columns.map(c => [c.name, c.role, c.values])),
  [["F / N", "x", [10, 20, 30, 40, 50, 60]], ["ΔL / mm", "y", [0.26, 0.5, 0.77, 1.03, 1.28, 1.51]], ["sΔL / mm", "yerr", [0.02, 0.02, 0.02, 0.02, 0.02, 0.02]]]);
await p.waitForFunction(() => document.querySelectorAll("#plot .scatterlayer .trace").length > 0);
eq("dropped csv: points plotted with error bars", await p.evaluate(() => { const t = document.getElementById("plot").data[0]; return [t.x, t.y, t.error_y.array]; }), [[10, 20, 30, 40, 50, 60], [0.26, 0.5, 0.77, 1.03, 1.28, 1.51], [0.02, 0.02, 0.02, 0.02, 0.02, 0.02]]);
await p.click("#fit"); await ready();
eq("dropped csv: weighted fit, slope a = 44,25/1750 = 0,025286", (await lines())[0], "a = (0,02529 ± 0,00029) mm/N");
await p.screenshot({ path: "evidence/phase3-step2-drop.png" , fullPage: true });

// 5. Tab text (Excel copy saved as .txt) and a saved project can be dropped, too.
await drop("excel.txt", "text/plain", "x\ty\n1\t2,5\n2\t5\n3\t7,5\n");
await p.waitForFunction(() => proj.columns[0].name === "x");
eq("tab text: two columns", await p.evaluate(() => proj.columns.map(c => [c.name, c.role, c.values])), [["x", "x", [1, 2, 3]], ["y", "y", [2.5, 5, 7.5]]]);
const saved = await p.evaluate(() => save(proj));
await drop("andere.csv", "text/csv", "q;r\n1;1\n2;4\n");
await p.waitForFunction(() => proj.columns[0].name === "q");
await drop("projekt.plotlab", "", saved);
await p.waitForFunction(() => proj.columns[0].name === "x");
eq("dropped project equals the saved one", await state(), JSON.stringify(JSON.parse(saved)));

// 6. Bad input: nothing changes, the message says what to do.
const s0 = await state();
await drop("foto.png", "image/png", "\x89PNG\r\n\x1a\n\0\0\0");
eq("image", [await msg(), await state()], ["„foto.png“ ist keine Tabelle. Bitte eine CSV- oder Textdatei mit Zahlen oder ein PlotLab-Projekt (.plotlab) auf die Seite ziehen.", s0]);
await p.screenshot({ path: "evidence/phase3-step2-error.png" , fullPage: true });
await drop("notizen.txt", "text/plain", "Hallo Welt\nkeine Zahl hier");
await p.waitForFunction(() => document.getElementById("msg").textContent.includes("notizen"));
eq("text without numbers", [await msg(), await state()], ["In „notizen.txt“ stehen keine Zahlen. Bitte eine CSV- oder Textdatei mit Messwerten auf die Seite ziehen.", s0]);
await drop("tabelle.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "PK\u0003\u0004");
await p.waitForFunction(() => document.getElementById("msg").textContent.includes("Excel"));
eq("excel file: advice and no change", [(await msg()).startsWith("„tabelle.xlsx“ ist eine Excel-Datei"), await state()], [true, s0]);
await drop("kaputt.plotlab", "", "{ nicht fertig");
await p.waitForFunction(() => document.getElementById("msg").textContent.includes("JSON"));
eq("broken project", [await msg(), await state()], ["Die Datei ist kein gültiges Projekt (kein lesbares JSON).", s0]);
await drop("falsch.csv", "text/csv", "a;b\n1;2\n3;x\n");
await p.waitForFunction(() => document.getElementById("msg").textContent.includes("keine Zahl"));
eq("csv with a letter in a number cell", [await msg(), await state()], ["Zeile 3, Spalte 2: „x“ ist keine Zahl.", s0]);
eq("a drag of plain text (no file) is left to the browser", await p.evaluate(() => { const dt = new DataTransfer(); dt.setData("text/plain", "1;2"); const ev = new DragEvent("drop", { dataTransfer: dt, bubbles: true, cancelable: true }); document.body.dispatchEvent(ev); return ev.defaultPrevented; }), false);

// 7. First visit again with a damaged autosave: the example opens and the page says what happened.
await p.evaluate(() => localStorage.setItem("plotlab-autosave", "{kaputt"));
await p.reload();
await p.waitForFunction(() => /E = \(201 ± 8\) GPa/.test(document.getElementById("introres").textContent), null, { timeout: 120000 });
eq("damaged autosave: message and example", await msg(), "Der automatisch gespeicherte Stand war beschädigt und wurde verworfen.");

// 8. Storage blocked (private window): the example still opens.
const c2 = await b.newContext({ viewport: { width: 1280, height: 800 } }), p2 = await c2.newPage();
p2.on("pageerror", e => errors.push(String(e)));
await p2.addInitScript(() => { Object.defineProperty(window, "localStorage", { get() { throw new Error("blocked"); } }); });
await p2.goto(base + "app/app.html");
await p2.waitForFunction(() => /E = \(201 ± 8\) GPa/.test(document.getElementById("introres").textContent), null, { timeout: 120000 });
eq("storage blocked: example, warning about saving", [await p2.isVisible("#storewarn")], [true]);

eq("page errors", errors, []);
await b.close(); close();
console.log(bad ? `${bad} FAILED` : "all checks passed");
process.exit(bad ? 1 : 0);
