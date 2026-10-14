// Phase 1 step 4: autosave and restore in app/. Drives the real page; expected values are typed by hand.
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
const { chromium } = createRequire(resolve("testbuild/x.js"))("playwright-core");
const { newProject, addResult, save } = createRequire(import.meta.url)("../app/project.js");
let bad = 0;
const eq = (name, got, want) => {
  got = JSON.stringify(got); want = JSON.stringify(want);
  if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; }
};
const dir = mkdtempSync(resolve(tmpdir(), "p1s4-"));
const sp = newProject(["t / s", "U / V", "sU / V"], [[1, 2.1, 0.2], [2, 4.3, 0.2], [3, 6.2, 0.3]]);
addResult(sp, { kind: "fit", model: "line", params: [{ name: "a", value: 2.01, u: 0.06, unit: "V/s" }] });
writeFileSync(dir + "/mit-ergebnis.plotlab", save(sp));
const url = pathToFileURL(resolve("app/index.html")).href + "?start=leer";
const cell = (r, c) => `input[data-r="${r}"][data-c="${c}"]`;

const b = await chromium.launch();
// One browser context keeps its storage across reloads, like a normal window.
const ctx = await b.newContext({ viewport: { width: 1200, height: 1500 } });
const p = await ctx.newPage();
const plotY = () => p.evaluate(() => document.getElementById("plot").data[0].y);
await p.goto(url);
eq("fresh browser: no restore note, no data", [await p.isHidden("#note"), await p.textContent("#table")], [true, "Noch keine Daten. Lade das Beispiel oder öffne ein Projekt."]);

// Edit, add a row, reload: nothing lost.
await p.click("#example");
await p.fill(cell(1, 1), "5,5");
await p.click("#addrow");
await p.fill(cell(5, 0), "6"); await p.fill(cell(5, 1), "12,1");
await p.reload();
await p.waitForSelector("#plot .scatterlayer .point");
eq("note after reload", await p.textContent("#note"), "Wiederhergestellt: Dein letzter Stand wurde automatisch geladen.");
eq("note visible", await p.isVisible("#note"), true);
eq("6 rows restored", await p.$$eval("#table tbody tr", e => e.length), 6);
eq("edited cell restored", await p.inputValue(cell(1, 1)), "5,5");
eq("plot restored", await plotY(), [2.1, 5.5, 6.2, 8.4, 9.9, 12.1]);
eq("column roles restored", await p.evaluate(() => proj.columns.map(c => c.role)), ["x", "y", "yerr"]);
eq("save and undo buttons: nothing to undo yet", await p.evaluate(() => [document.getElementById("saveproj").disabled, document.getElementById("undo").disabled]), [false, true]);
await p.screenshot({ path: "evidence/phase1-step4-autosave.png", fullPage: true });
// Note goes away on the next edit; a further edit is saved too.
await p.fill(cell(0, 1), "2,2");
eq("note hidden after edit", await p.isHidden("#note"), true);
await p.reload();
eq("second edit restored", await p.inputValue(cell(0, 1)), "2,2");
// Undo still works after the restore and is saved.
await p.fill(cell(0, 1), "9"); await p.click("#undo");
await p.reload();
eq("undo was saved", await p.inputValue(cell(0, 1)), "2,2");

// A project with a fit result: still stale after an edit and a reload.
await p.setInputFiles("#openfile", dir + "/mit-ergebnis.plotlab");
await p.waitForSelector("#results .res");
await p.fill(cell(0, 1), "2,2");
await p.reload();
await p.waitForSelector("#results .res");
eq("result restored", await p.textContent("#results .res"), "a = (2,01 ± 0,06) V/s");
eq("result still out of date", await p.$$eval(".stalemsg", e => e.length), 1);

// Same data in a new tab (same storage): restored too.
const p2 = await ctx.newPage(); await p2.goto(url);
eq("new tab restores", await p2.inputValue(cell(0, 1)), "2,2");
await p2.close();

// Bad input 1: damaged autosave is dropped with a clear message.
await p.evaluate(() => localStorage.setItem("plotlab-autosave", "{kaputt"));
await p.reload();
eq("damaged autosave message", await p.textContent("#msg"), "Der automatisch gespeicherte Stand war beschädigt und wurde verworfen.");
eq("damaged autosave replaced by the first-visit example", await p.evaluate(() => JSON.parse(localStorage.getItem("plotlab-autosave")).template), "p3"); // since Phase 3 step 2 the example opens instead of an empty page
await p.reload();
eq("after that: no error, the saved example is restored", [await p.isHidden("#msg"), await p.isVisible("#note")], [true, true]);

// Bad input 2: storage that refuses to save (private window, full disk): clear message once, app keeps working.
const ctx2 = await b.newContext();
await ctx2.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException("full", "QuotaExceededError"); }; });
const q = await ctx2.newPage(); await q.goto(url);
await q.click("#example");
eq("no-storage warning", await q.textContent("#storewarn"), "Automatisches Speichern ist in diesem Browser nicht möglich. Bitte speichere das Projekt mit „Projekt speichern“.");
await q.fill(cell(0, 1), "3");
eq("warning stays while editing", await q.isVisible("#storewarn"), true);
eq("app still works without storage", (await q.evaluate(() => document.getElementById("plot").data[0].y))[0], 3);
await q.screenshot({ path: "evidence/phase1-step4-nostorage.png", fullPage: true });

await b.close();
if (bad) process.exit(1);
console.log("phase 1 step 4: autosave restores data, roles, results and stale state; damaged or blocked storage gives a clear message");
