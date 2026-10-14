// Phase 1 step 3: undo and redo in app/. Drives the real page; expected values are typed by hand.
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
const dir = mkdtempSync(resolve(tmpdir(), "p1s3-"));
const sp = newProject(["t / s", "U / V", "sU / V"], [[1, 2.1, 0.2], [2, 4.3, 0.2], [3, 6.2, 0.3]]);
addResult(sp, { kind: "fit", model: "line", params: [{ name: "a", value: 2.01, u: 0.06, unit: "V/s" }] });
writeFileSync(dir + "/mit-ergebnis.plotlab", save(sp));

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 1500 } });
await p.goto(pathToFileURL(resolve("app/index.html")).href);
const plotY = () => p.evaluate(() => document.getElementById("plot").data[0].y);
const rows = () => p.$$eval("#table tbody tr", e => e.length);
const cell = (r, c) => `input[data-r="${r}"][data-c="${c}"]`;
const dis = () => p.evaluate(() => [document.getElementById("undo").disabled, document.getElementById("redo").disabled]);
const U = () => p.click("#undo"), R = () => p.click("#redo");

await p.click("#example");
await p.waitForSelector("#plot .scatterlayer .point");
eq("nothing to undo at start", await dis(), [true, true]);

// One typed edit, undo by button, redo by button.
await p.fill(cell(1, 1), "5,5");
eq("edited", await plotY(), [2.1, 5.5, 6.2, 8.4, 9.9]);
eq("buttons after edit", await dis(), [false, true]);
await U();
eq("undo: plot reverts", await plotY(), [2.1, 4.3, 6.2, 8.4, 9.9]);
eq("undo: cell reverts", await p.inputValue(cell(1, 1)), "4,3");
eq("buttons after undo", await dis(), [true, false]);
await R();
eq("redo: plot returns", await plotY(), [2.1, 5.5, 6.2, 8.4, 9.9]);
eq("redo: cell returns", await p.inputValue(cell(1, 1)), "5,5");

// Typing several characters into one cell is one step.
await p.focus(cell(2, 1)); await p.$eval(cell(2, 1), e => e.select());
await p.keyboard.type("7,25");
eq("typed 7,25", (await plotY())[2], 7.25);
await p.keyboard.press("Control+z");
eq("Ctrl+Z undoes the whole cell edit", (await plotY())[2], 6.2);
await p.keyboard.press("Meta+Shift+z");
eq("Cmd+Shift+Z redoes it", (await plotY())[2], 7.25);
await p.keyboard.press("Meta+z"); await p.keyboard.press("Meta+z");
eq("two undos back to the original", await plotY(), [2.1, 4.3, 6.2, 8.4, 9.9]);
await p.keyboard.press("Control+y");
eq("Ctrl+Y redoes", await plotY(), [2.1, 5.5, 6.2, 8.4, 9.9]);
await p.keyboard.press("Control+z");

// Row add and delete.
await p.click("#addrow");
eq("6 rows", await rows(), 6);
await U();
eq("add row undone", await rows(), 5);
await R();
eq("add row redone", await rows(), 6);
await U();
await p.click('[data-del="0"]');
eq("row deleted", [await rows(), (await plotY())[0]], [4, 4.3]);
await U();
eq("delete row undone", [await rows(), (await plotY())[0]], [5, 2.1]);

// A new edit clears redo.
await p.fill(cell(0, 1), "3");
eq("redo cleared by new edit", (await dis())[1], true);
await U();

// Fit settings.
await p.evaluate(() => setSetting("weighted", false));
eq("setting changed", await p.evaluate(() => proj.settings.weighted), false);
await U();
eq("setting undone", await p.evaluate(() => proj.settings.weighted), true);
await R();
eq("setting redone", await p.evaluate(() => proj.settings.weighted), false);

// Stale result follows the data through undo and redo.
await p.setInputFiles("#openfile", dir + "/mit-ergebnis.plotlab");
await p.waitForSelector("#results .res");
eq("opening a project clears history", await dis(), [true, true]);
await p.fill(cell(0, 1), "2,2");
eq("stale after edit", await p.$$eval(".stalemsg", e => e.length), 1);
await U();
eq("fresh after undo", await p.$$eval(".stalemsg", e => e.length), 0);
eq("result line still there", await p.textContent("#results .res"), "a = (2,01 ± 0,06) V/s");
await R();
eq("stale again after redo", await p.$$eval(".stalemsg", e => e.length), 1);
await p.screenshot({ path: "evidence/phase1-step3-undo.png", fullPage: true });

// Bad text is not a change: nothing to undo for it.
await U();
await p.fill(cell(0, 1), "abc");
eq("bad text adds no step", (await dis())[0], true);
await b.close();
if (bad) process.exit(1);
console.log("phase 1 step 3: undo and redo work for cells, rows, settings, buttons and keys");
