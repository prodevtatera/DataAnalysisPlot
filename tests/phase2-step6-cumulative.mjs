// Phase 2 step 6: cumulative probability plot with the 16 % and 84 % read-off (P1 error distribution).
// Same 30 readings as step 5, classes of 0,2 mm from 9,5. Hand values from tests/reference/histogram.py (exact fractions):
// cumulative share at the limits 0 6,7 23,3 53,3 80,0 93,3 100 %; 16 % crosses in class 9,7-9,9 -> 9,812 (2453/250);
// 84 % crosses in class 10,3-10,5 -> 10,36 (259/25); x̄ - s = 9,7867, x̄ + s = 10,3133; half difference 0,274.
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
const req = createRequire(import.meta.url);
import { chromium, openTool } from "./tools.mjs";
const { cumRead } = req("../app/stats.js");
const { newProject, save } = req("../app/project.js");
let bad = 0;
const eq = (name, got, want) => {
  got = JSON.stringify(got); want = JSON.stringify(want);
  if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; }
};
const near = (name, got, want, tol = 1e-9) => {
  if (!(Math.abs(got - want) <= tol * Math.abs(want))) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; }
};
const L = "9.5 9.6 9.7 9.7 9.8 9.8 9.8 9.9 9.9 9.9 10.0 10.0 10.0 10.0 10.05 10.05 10.1 10.1 10.1 10.2 10.2 10.2 10.2 10.2 10.3 10.3 10.4 10.4 10.5 10.6".split(" ").map(Number);

// Pure function on the hand-made counts.
const C = [2, 5, 9, 8, 4, 2];
near("16 %", cumRead(C, 9.5, 0.2, 0.16), 9.812); near("84 %", cumRead(C, 9.5, 0.2, 0.84), 10.36);
near("50 %", cumRead(C, 9.5, 0.2, 0.5), 9.9 + 0.2 * (15 - 7) / 9);   // 15 of 30 lies in class 9,9-10,1 (7 before, 9 in it)
near("exactly on a limit (7/30 reached at 9,9)", cumRead(C, 9.5, 0.2, 7 / 30), 9.9, 1e-9);
near("100 %", cumRead(C, 9.5, 0.2, 1), 10.7); near("0 %", cumRead(C, 9.5, 0.2, 0), 9.5);

const dir = mkdtempSync(resolve(tmpdir(), "p2s6-"));
const hand = newProject(["l / mm", "m / g"], [[1, 2], [2, 3]]);
hand.results.push({ kind: "hist", inputs: { col: "<img src=x onerror=window.pwn=1>" }, n: 3, start: 1, width: 1, counts: [1, 2], mean: 2, s: 1,
  params: [{ name: "<img src=x onerror=window.pwn=2>", unit: "<script>window.pwn=3</script>", value: 1, u: 0.1 }], computedFrom: "x" });
writeFileSync(dir + "/hand.plotlab", save(hand));

const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1200, height: 3200 } })).newPage();
const external = [];
p.on("request", r => { if (!r.url().startsWith("file:")) external.push(r.url()); });
await p.goto(pathToFileURL(resolve("app/index.html")).href);
const plot = () => p.evaluate(() => ({ d: document.getElementById("cumplot").data, layout: document.getElementById("cumplot").layout }));
const readoff = () => p.textContent("#results [data-readoff]");
const paste = t => p.fill("#paste", t).then(() => p.click("#pastego"));

eq("before calculation", await p.textContent("#cumplot .empty"), "Noch keine Summenhäufigkeit. Berechne zuerst das Histogramm.");
await paste("l / mm\n" + L.map(v => String(v).replace(".", ",")).join("\n"));
await p.fill("#h_w", "0,2"); await p.fill("#h_s", "9,5"); await p.click("#h_go");
let pl = await plot();
const r1 = a => a.map(v => +v.toFixed(9));
eq("limits", r1(pl.d[0].x), [9.5, 9.7, 9.9, 10.1, 10.3, 10.5, 10.7]);
near("cum % at 9,7", pl.d[0].y[1], 100 * 2 / 30); near("cum % at 9,9", pl.d[0].y[2], 100 * 7 / 30); near("cum % at 10,1", pl.d[0].y[3], 100 * 16 / 30);
near("cum % at 10,3", pl.d[0].y[4], 80); near("cum % at 10,5", pl.d[0].y[5], 100 * 28 / 30);
eq("cum % ends", [pl.d[0].y[0], pl.d[0].y[6]], [0, 100]);
eq("marks y", pl.d[1].y, [16, 84]);
near("mark x 16 %", pl.d[1].x[0], 9.812); near("mark x 84 %", pl.d[1].x[1], 10.36);
// Both levels drawn: a horizontal and a vertical guide per level, ending on the marked points.
const sh = pl.layout.shapes.map(s => [s.x0, s.y0, s.x1, s.y1].map(v => +v.toFixed(6)));
eq("guides", sh, [[9.5, 16, 9.812, 16], [9.812, 16, 9.812, 0], [9.5, 84, 10.36, 84], [10.36, 84, 10.36, 0]]);
eq("axis titles", [pl.layout.xaxis.title.text, pl.layout.yaxis.title.text], ["l / mm", "Kumulierte Häufigkeit / %"]);
eq("legend names", pl.d.map(t => t.name), ["Kumulierte relative Häufigkeit", "Ablesung bei 16 % und 84 %"]);
eq("labels", pl.d[1].text, ["9,812", "10,36"]);
eq("read-off text", await readoff(), "Ablesung in der Summenhäufigkeit: x bei 16 % = 9,812 mm, x bei 84 % = 10,36 mm; halbe Differenz = 0,274 mm. Zum Vergleich: x̄ − s = 9,787 mm, x̄ + s = 10,31 mm.");
await p.screenshot({ path: "evidence/phase2-step6-cumulative.png", fullPage: true });
await openTool(p, "cum");   // the cumulative plot is a tool that is hidden until opened
await (await p.$("#cumplot")).screenshot({ path: "evidence/phase2-step6-cumulative-plot.png" });

// Out of date after an edit: plot removed; edit reverted: back. Divisor change does not move the cumulative plot's marks (it only changes s) but still marks the result stale.
await p.fill('input[data-r="1"][data-c="0"]', "9,7");
eq("stale: plot removed", [await p.textContent("#cumplot .empty"), (await plot()).d], ["Die Summenhäufigkeit ist veraltet. Bitte das Histogramm neu berechnen.", undefined]);
await p.fill('input[data-r="1"][data-c="0"]', "9,6");
eq("fresh again", (await plot()).d[1].y, [16, 84]);
// Automatic classes (width 0,2 from 9,4, counts 1 3 6 9 7 3 1, cumulative 1 4 10 19 26 29 30): 16 % = 4,8 readings -> class 9,8-10,0 (4 before, 6 in it); 84 % = 25,2 -> class 10,2-10,4 (19 before, 7 in it).
await p.fill("#h_w", ""); await p.fill("#h_s", ""); await p.click("#h_go");
pl = await plot();
near("auto 16 %", pl.d[1].x[0], 9.8 + 0.2 * (0.8 / 6), 1e-9); near("auto 84 %", pl.d[1].x[1], 10.2 + 0.2 * (6.2 / 7), 1e-9);
// Reload and save/open keep the plot.
await p.reload(); await p.waitForSelector("#results [data-readoff]");
near("after reload", (await plot()).d[1].x[0], 9.8 + 0.2 * (0.8 / 6), 1e-9);

// Bad input: no result, so no plot and no stale numbers.
await paste("a;b\n1;5\n2;5"); await p.click("#h_go");
eq("bad input: no cumulative plot", [await p.textContent("#cumplot .empty"), await p.$$eval("#results [data-readoff]", e => e.length)], ["Noch keine Summenhäufigkeit. Berechne zuerst das Histogramm.", 0]);
await p.screenshot({ path: "evidence/phase2-step6-error.png", fullPage: true });

// Hand-edited project with script text: nothing runs.
await p.setInputFiles("#openfile", dir + "/hand.plotlab");
await p.waitForSelector("#results .result");
eq("no script ran", await p.evaluate(() => window.pwn), undefined);
eq("no injected elements", await p.$$eval("#results img, #results script, #cumplot img, #cumplot script", e => e.length), 0);
eq("no external requests", external, []);
await b.close();
if (bad) process.exit(1);
console.log("phase 2 step 6: cumulative plot and 16 % / 84 % read-off (9,812 and 10,36) match the hand values in the real page");
