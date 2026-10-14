// Phase 2 step 10: logarithmic y axis with y error bars (P8 radioactive decay).
// Expected numbers are written by hand from the typed data, not taken from the app:
//   t / min = 0 2 4 6 8 10, N = 980 640 410 270 170 110, sN = 31,3 25,3 20,2 16,4 13,0 10,5 (about sqrt(N)).
//   An error bar from N-sN to N+sN is log10(N+sN) - log10(N-sN) decades long, so its drawn height is
//   (that many decades) / (axis span in decades) * (height of the plot area).
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { serve } from "./serve.mjs";
const req = createRequire(import.meta.url);
const { logYProblem, clippedBars } = req("../app/logaxis.js");
const { newProject, save } = req("../app/project.js");
const { chromium } = createRequire(resolve("testbuild/x.js"))("playwright-core");
let bad = 0;
const eq = (name, got, want) => { got = JSON.stringify(got); want = JSON.stringify(want); if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; } };
const near = (name, got, want, tol) => { if (!(Math.abs(got - want) <= tol)) { console.log(`FAIL ${name}: got ${got}, want ${want} (± ${tol})`); bad++; } };

// --- pure functions ---
eq("all positive: no problem", logYProblem([{ name: "N / 1", values: [1, 0.001, null, 5] }]), null);
eq("a zero is named", logYProblem([{ name: "N / 1", values: [5, 0, 3] }]),
  "Die logarithmische y-Achse braucht Werte größer als 0. In Spalte „N / 1“ steht ein Wert von 0 oder darunter: Zeile 2 (y = 0). Korrigiere die Werte oder schalte die logarithmische Achse aus.");
const m5 = logYProblem([{ name: "N", values: [-1.5, 0, 2, 0, -3, 0] }]);
eq("five bad values: three named, rest counted", m5.includes("5 Werte") && m5.includes("Zeile 1 (y = -1,5), Zeile 2 (y = 0), Zeile 4 (y = 0) und 2 weitere"), true);
eq("empty cells are not a problem", logYProblem([{ name: "N", values: [null, null] }]), null);
eq("second column is checked too", logYProblem([{ name: "A", values: [1] }, { name: "B", values: [0] }]).includes("„B“"), true);
eq("clipped bars: y - err <= 0 counts", clippedBars([10, 4, 5, null], [2, 5, 5, 1]), 2);
eq("no error values: nothing clipped", clippedBars([1, 2], [null, undefined]), 0);

// --- real page ---
const { base, close } = await serve();
const dir = mkdtempSync(resolve(tmpdir(), "p2s10-"));
const hand = newProject(["t / min", "<img src=x onerror=window.pwn=1>", "s"], [[0, 0, 1], [1, 5, 1], [2, 4, 1]]);
hand.settings.logy = true; writeFileSync(dir + "/hand-log.plotlab", save(hand));
const hand2 = newProject(["t / min", "N / 1", "s"], [[0, 5, 1], [1, 4, 1], [2, 3, 1]]);
hand2.settings.logy = "<script>window.pwn=2</script>"; writeFileSync(dir + "/hand-text.plotlab", save(hand2));

const br = await chromium.launch();
const ctx = await br.newContext({ viewport: { width: 1200, height: 2400 } });
const p = await ctx.newPage();
const external = [];
p.on("request", r => { if (!r.url().startsWith(base) && !r.url().startsWith("data:") && !r.url().startsWith("blob:")) external.push(r.url()); });
await p.goto(base + "app/index.html?start=leer");
await p.evaluate(() => localStorage.clear());
await p.reload();
const axisType = () => p.evaluate(() => document.getElementById("plot")._fullLayout?.yaxis?.type ?? null);
const plotText = () => p.textContent("#plot");
const pm = async () => (await p.isVisible("#plotmsg")) ? await p.textContent("#plotmsg") : null;
const svgs = () => p.$$eval("#plot .main-svg", e => e.length);
const DATA = "t / min;N / 1;sN / 1\n0;980;31,3\n2;640;25,3\n4;410;20,2\n6;270;16,4\n8;170;13,0\n10;110;10,5";
const NS = [980, 640, 410, 270, 170, 110], ES = [31.3, 25.3, 20.2, 16.4, 13.0, 10.5];

eq("switch is off before data", await p.isDisabled("#logy"), true);
await p.fill("#paste", DATA); await p.click("#pastego");
eq("switch on after data, unchecked, axis linear", [await p.isDisabled("#logy"), await p.isChecked("#logy"), await axisType()], [false, false, "linear"]);

// Log axis on.
await p.check("#logy");
eq("axis is logarithmic", await axisType(), "log");
eq("setting stored in the project", await p.evaluate(() => proj.settings.logy), true);
const geo = await p.evaluate(() => { const l = document.getElementById("plot")._fullLayout.yaxis; return { range: l.range, len: l._length, title: l.title.text, xt: document.getElementById("plot")._fullLayout.xaxis.title.text }; });
eq("axis titles keep quantity and unit", [geo.title, geo.xt], ["N / 1", "t / min"]);
// Whole data incl. error bars (110 - 10,5 = 99,5 up to 980 + 31,3 = 1011,3) must be inside the axis range, and the axis must not waste more than a decade on either side.
const lo = Math.log10(99.5), hi = Math.log10(1011.3);
eq("range contains all points with their bars", geo.range[0] <= lo && geo.range[1] >= hi, true);
eq("range is not wasteful", geo.range[0] > lo - 1 && geo.range[1] < hi + 1, true);
// Drawn error bars: heights in pixels from the hand values.
const bars = await p.$$eval("#plot .errorbar path.yerror", e => e.map(x => { const r = x.getBoundingClientRect(); return { h: r.height, w: r.width }; }));
eq("one error bar per point, all visible", [bars.length, bars.every(b => b.h > 1)], [6, true]);
const span = geo.range[1] - geo.range[0];
NS.forEach((n, i) => near(`bar ${i + 1} height`, bars[i].h, geo.len * (Math.log10(n + ES[i]) - Math.log10(n - ES[i])) / span, 1.5));
// On a log axis equal relative uncertainties look equal: bar 1 (3,2 %) is not 10 times bar 6 (9,5 %) as it would be on the linear axis (62,6 against 21).
eq("bars are shorter at the top than the log scale would make them linear", bars[0].h < bars[5].h * 1.5, true);
// Nothing may hide a point: the legend box must not overlap any marker (it sat on top of the first point before).
const covered = await p.evaluate(() => { const L = document.querySelector("#plot .legend .bg").getBoundingClientRect(); return [...document.querySelectorAll("#plot .scatterlayer .points path")].filter(m => { const r = m.getBoundingClientRect(); return r.right > L.left && r.left < L.right && r.bottom > L.top && r.top < L.bottom; }).length; });
eq("legend covers no data point", covered, 0);
eq("no message while all is well", [await pm(), await p.$$eval("#plot .empty", e => e.length)], [null, 0]);
const ticks = await p.$$eval("#plot .yaxislayer-above .ytick text", e => e.map(x => x.textContent));
eq("tick labels exist and use no exponent notation", ticks.length >= 3 && ticks.every(t => /^[\d.,]+$/.test(t)), true);
await p.screenshot({ path: "evidence/phase2-step10-semilog.png", fullPage: true });
await p.locator("#plot").screenshot({ path: "evidence/phase2-step10-semilog-plot.png" });

// Undo and redo bring the axis back and forth; reload keeps it.
await p.click("#undo");
eq("undo: linear again, switch unchecked", [await axisType(), await p.isChecked("#logy")], ["linear", false]);
await p.click("#redo");
eq("redo: log again, switch checked", [await axisType(), await p.isChecked("#logy")], ["log", true]);
await p.reload();
eq("reload keeps the log axis", [await axisType(), await p.isChecked("#logy")], ["log", true]);

// Bad input 1: a zero. The plot gives way to a message that names the row.
await p.fill('input[data-r="2"][data-c="1"]', "0");
eq("zero: message", (await plotText()).trim(), "Die logarithmische y-Achse braucht Werte größer als 0. In Spalte „N / 1“ steht ein Wert von 0 oder darunter: Zeile 3 (y = 0). Korrigiere die Werte oder schalte die logarithmische Achse aus.");
eq("zero: no broken plot left behind", await svgs(), 0);
await p.screenshot({ path: "evidence/phase2-step10-error.png", fullPage: true });
await p.fill('input[data-r="2"][data-c="1"]', "-2");
eq("negative value named", /Zeile 3 \(y = [-−]2\)/.test(await plotText()), true);
await p.fill('input[data-r="2"][data-c="1"]', "410");
eq("fixed: plot is back, log, no message", [await axisType(), await svgs() > 0, await p.$$eval("#plot .empty", e => e.length)], ["log", true, 0]);
// Several bad values.
for (const r of [0, 1, 2, 3]) await p.fill(`input[data-r="${r}"][data-c="1"]`, "0");
eq("four zeros: three named, one more", (await plotText()).includes("4 Werte") && (await plotText()).includes("Zeile 1 (y = 0), Zeile 2 (y = 0), Zeile 3 (y = 0) und 1 weitere"), true);
// Undo steps restore the numbers; the plot comes back.
for (let i = 0; i < 4; i++) await p.click("#undo");
eq("undo of the zeros restores the plot", [await axisType(), (await p.evaluate(() => proj.columns[1].values))], ["log", NS]);
// Switching the axis off with bad values shows the linear plot again.
await p.fill('input[data-r="0"][data-c="1"]', "0");
await p.uncheck("#logy");
eq("axis off: linear plot even with a zero", [await axisType(), await p.$$eval("#plot .empty", e => e.length)], ["linear", 0]);
await p.check("#logy");
await p.fill('input[data-r="0"][data-c="1"]', "980");

// Error bar reaching below zero: only the upper part can be drawn, and the page says so.
await p.fill('input[data-r="5"][data-c="1"]', "10"); await p.fill('input[data-r="5"][data-c="2"]', "12");
eq("clipped bar note", await pm(), "Bei 1 Messpunkt reicht der Fehlerbalken nach unten bis 0 oder darunter. Auf der logarithmischen Achse ist nur der obere Teil sichtbar.");
eq("plot is still drawn", [await axisType(), await p.$$eval("#plot .errorbar path.yerror", e => e.length)], ["log", 6]);
await p.screenshot({ path: "evidence/phase2-step10-clipped.png", fullPage: true });
await p.fill('input[data-r="5"][data-c="1"]', "110"); await p.fill('input[data-r="5"][data-c="2"]', "10,5");
eq("note gone when the bars fit", await pm(), null);

// Saved project keeps the setting; a fresh browser profile opens it as log.
const saved = await p.evaluate(() => save(proj));
writeFileSync(dir + "/saved.plotlab", saved);
const p2 = await (await br.newContext({ viewport: { width: 1200, height: 1600 } })).newPage();
await p2.goto(base + "app/index.html?start=leer");
await p2.setInputFiles("#openfile", dir + "/saved.plotlab");
await p2.waitForSelector("#plot .main-svg");
eq("opened project is log", [await p2.evaluate(() => document.getElementById("plot")._fullLayout.yaxis.type), await p2.isChecked("#logy")], ["log", true]);
await p2.close();

// Series plot (P3 style): wait for the fit engine, fit one series, switch the axis.
await p.waitForFunction(() => !document.getElementById("sr_go").disabled, null, { timeout: 120000 });
await p.click("#sr_add"); await p.click("#sr_go");
await p.waitForFunction(() => !document.getElementById("sr_go").disabled && proj.results.some(r => r.kind === "series"));
eq("series plot honours the log axis", await p.evaluate(() => { const d = document.getElementById("plot"); return [d._fullLayout.yaxis.type, d.data.map(t => t.name)]; }), ["log", ["N / 1", "Anpassung N / 1"]]);
await p.screenshot({ path: "evidence/phase2-step10-series.png", fullPage: true });
await p.uncheck("#logy");
eq("series plot back to linear", await axisType(), "linear");
// A series with a zero value can be fitted; the log axis then explains itself.
await p.fill('input[data-r="2"][data-c="1"]', "0");
await p.click("#sr_go");
await p.waitForFunction(() => !document.getElementById("sr_go").disabled && proj.results.some(r => r.kind === "series"));
await p.check("#logy");
eq("series with a zero: message", (await plotText()).includes("Zeile 3 (y = 0)"), true);
await p.fill('input[data-r="2"][data-c="1"]', "410"); await p.uncheck("#logy");

// Hand-edited projects: text in the setting counts as off; names with HTML are shown as text.
await p.setInputFiles("#openfile", dir + "/hand-text.plotlab");
await p.waitForSelector("#plot .main-svg");
eq("text in the setting: linear, unchecked", [await axisType(), await p.isChecked("#logy")], ["linear", false]);
await p.setInputFiles("#openfile", dir + "/hand-log.plotlab");
await p.waitForSelector("#plot .empty");
eq("script column name is shown as text", [(await plotText()).includes("<img src=x onerror=window.pwn=1>"), await p.$$eval("#plot img, #plot script", e => e.length), await p.evaluate(() => window.pwn)], [true, 0, undefined]);
eq("no external requests", external, []);
await br.close(); close();
if (bad) process.exit(1);
console.log("phase 2 step 10: log y axis keeps the error bars at the hand-calculated heights; zero and negative values give a message");
