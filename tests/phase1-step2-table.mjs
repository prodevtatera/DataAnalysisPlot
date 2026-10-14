// Phase 1 step 2: editable table in app/. Drives the real page; expected values are typed by hand.
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { writeFileSync, readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
const { chromium } = createRequire(resolve("testbuild/x.js"))("playwright-core");
const { newProject, addResult, save } = createRequire(import.meta.url)("../app/project.js");
let bad = 0;
const eq = (name, got, want) => {
  got = JSON.stringify(got); want = JSON.stringify(want);
  if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; }
};
const dir = mkdtempSync(resolve(tmpdir(), "p1s2-"));
// A saved project that already holds a fit result.
const sp = newProject(["t / s", "U / V", "sU / V"], [[1, 2.1, 0.2], [2, 4.3, 0.2], [3, 6.2, 0.3]]);
addResult(sp, { kind: "fit", model: "line", params: [{ name: "a", value: 2.01, u: 0.06, unit: "V/s" }] });
writeFileSync(dir + "/mit-ergebnis.plotlab", save(sp));
writeFileSync(dir + "/kaputt.plotlab", "das ist kein projekt");

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 1500 } });
const external = [];
p.on("request", r => { if (!r.url().startsWith("file:")) external.push(r.url()); });
await p.goto(pathToFileURL(resolve("app/index.html")).href);
const plotY = () => p.evaluate(() => document.getElementById("plot").data[0].y);
const plotX = () => p.evaluate(() => document.getElementById("plot").data[0].x);
const cell = (r, c) => `input[data-r="${r}"][data-c="${c}"]`;

eq("starts empty", await p.textContent("#plot"), "Noch keine Daten.");
await p.click("#example");
await p.waitForSelector("#plot .scatterlayer .point");
eq("5 rows", await p.$$eval("#table tbody tr", e => e.length), 5);
eq("table shows decimal comma", await p.inputValue(cell(0, 1)), "2,1");

// Edit a cell with a decimal comma: plot follows at once.
await p.fill(cell(1, 1), "5,5");
eq("plot y after edit", await plotY(), [2.1, 5.5, 6.2, 8.4, 9.9]);
// Empty cell: point leaves the plot.
await p.fill(cell(4, 1), "");
eq("empty cell drops the point", await plotY(), [2.1, 5.5, 6.2, 8.4]);
// Add and fill a row.
await p.click("#addrow");
eq("6 rows", await p.$$eval("#table tbody tr", e => e.length), 6);
await p.fill(cell(5, 0), "6"); await p.fill(cell(5, 1), "12,1");
eq("new row plotted", [await plotX(), await plotY()], [[1, 2, 3, 4, 6], [2.1, 5.5, 6.2, 8.4, 12.1]]);
// Delete row 2.
await p.click('[data-del="1"]');
eq("row deleted", await plotX(), [1, 3, 4, 6]);
eq("5 rows after delete", await p.$$eval("#table tbody tr", e => e.length), 5);
// Bad cell: clear message, plot keeps the last good value.
await p.fill(cell(0, 1), "abc");
eq("bad cell message", await p.textContent("#msg"), "Zeile 1, Spalte 2: „abc“ ist keine Zahl.");
eq("bad cell marked", await p.$$eval("input.bad", e => e.length), 1);
eq("plot unchanged by bad text", (await plotY())[0], 2.1);
await p.screenshot({ path: "evidence/phase1-step2-bad.png", fullPage: true });
await p.fill(cell(0, 1), "2,2");
eq("message gone after fix", await p.isHidden("#msg"), true);
// Number is shown in German format after leaving the cell.
await p.fill(cell(0, 1), "2.25"); await p.press(cell(0, 1), "Tab");
eq("reformatted on leave", await p.inputValue(cell(0, 1)), "2,25");

// Stale results: open a project that has a fit, then edit.
await p.setInputFiles("#openfile", dir + "/mit-ergebnis.plotlab");
await p.waitForSelector("#results .res");
eq("result line", await p.textContent("#results .res"), "a = (2,01 ± 0,06) V/s");
eq("fresh: no stale message", await p.$$eval(".stalemsg", e => e.length), 0);
await p.fill(cell(0, 1), "2,2");
eq("stale message after edit", await p.textContent(".stalemsg"), "Die Daten wurden geändert. Dieses Ergebnis ist veraltet. Bitte neu anpassen.");
await p.fill(cell(0, 1), "2,1");
eq("fresh again when the value is put back", await p.$$eval(".stalemsg", e => e.length), 0);
await p.fill(cell(0, 1), "2,2");
await p.screenshot({ path: "evidence/phase1-step2-table.png", fullPage: true });

// Save gives the edited data back.
const [dl] = await Promise.all([p.waitForEvent("download"), p.click("#saveproj")]);
const saved = JSON.parse(readFileSync(await dl.path(), "utf8"));
eq("saved edit", saved.columns[1].values, [2.2, 4.3, 6.2]);

// Wrong file: clear message, data stays.
await p.setInputFiles("#openfile", dir + "/kaputt.plotlab");
await p.waitForSelector("#msg:not([hidden])");
eq("wrong file message", await p.textContent("#msg"), "Die Datei ist kein gültiges Projekt (kein lesbares JSON).");
eq("data kept after wrong file", await p.$$eval("#table tbody tr", e => e.length), 3);
eq("no external requests", external, []);
await b.close();
if (bad) process.exit(1);
console.log("phase 1 step 2: edit, add and delete rows, bad cell, stale result, save and open behave");
