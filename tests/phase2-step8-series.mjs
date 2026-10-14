// Phase 2 step 8: several y series in one plot, each fitted over its own x range, and the two slopes compared (P3 loading and unloading).
// Expected numbers come from tests/reference/series_fit.py (exact fractions, textbook weighted line fit), never from the app or SciPy:
//   loading   (s = 0,02 everywhere), all 6 points:  a = 0,025285714286, u scaled 0,000290437156, unscaled 0,000478091444, chi2 1,47619047619, b = 0,006666666667 (u scaled 0,011310902172)
//   unloading (s = 0,02 ×3, 0,04 ×3), all 6 points: a = 0,025018987342, u scaled 0,000197330702, unscaled 0,000711568067, chi2 0,307621308017, b = 0,052172995781 (u scaled 0,005875906176)
//   difference of the two slopes: 0,000266726944; combined u scaled 0,000351131240 (z = 0,7596), unscaled 0,000857263403 (z = 0,3111)
//   loading x 10..30:  a = 0,0255, u scaled 0,000866025404, chi2 0,375;  unloading x 40..60: a = 0,0245, u scaled 0,000866025404, chi2 0,09375; z = 0,8165 (diff 0,001, u 0,001224744871)
//   a clearly softer unloading series (s = 0,01): a = 0,018685714286, u scaled 0,000125627676, unscaled 0,000239045722; z = 20,857 scaled, 12,347 unscaled
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { serve } from "./serve.mjs";
const req = createRequire(import.meta.url);
const { prepareSeries, compareSlopes, seriesAxisTitle, inRange } = req("../app/series.js");
const { newProject, save, seriesSettings, isStale, addResult } = req("../app/project.js");
import { chromium } from "./tools.mjs";
let bad = 0;
const eq = (name, got, want) => {
  got = JSON.stringify(got); want = JSON.stringify(want);
  if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; }
};
const near = (name, got, want, tol = 1e-7) => { if (!(Math.abs(got - want) <= tol * Math.abs(want))) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; } };

// --- pure functions ---
// Slopes 3 ± 0,3 and 2 ± 0,4: difference 1, combined u = √(0,09 + 0,16) = 0,5, z = 2.
const c = compareSlopes(3, 0.3, 2, 0.4);
near("diff", c.diff, 1); near("combined u", c.u, 0.5); near("z", c.z, 2);
eq("both u zero: no z", compareSlopes(1, 0, 2, 0).z, null);
eq("axis title, same unit", seriesAxisTitle(["ΔL auf / mm", "ΔL ab / mm"]), "ΔL auf, ΔL ab / mm");
eq("axis title, one series", seriesAxisTitle(["ΔL / mm"]), "ΔL / mm");
eq("axis title, different units", seriesAxisTitle(["U / V", "I / A"]), "U / V, I / A");
eq("range ends are inclusive, 0,1 + 0,2 is inside a range ending at 0,3", [inRange(0.1 + 0.2, { xmin: null, xmax: 0.3 }), inRange(0.31, { xmin: null, xmax: 0.3 }), inRange(5, { xmin: 5, xmax: null }), inRange(4.9, { xmin: 5, xmax: null })], [true, false, true, false]);
const pp = newProject(["x / m", "y / V", "sy / V"], [[1, 1, 0.1], [2, 2, 0.1], [3, 3.1, 0.1], [4, 4, 0.1]]);
pp.settings.series = [{ y: "y / V", err: "sy / V", xmin: 2, xmax: 4 }, { y: "gone", err: null }, "text", { y: "y / V", err: "nothing", xmin: "a", xmax: null }];
eq("settings normalised: unknown y dropped, unknown error column and text numbers cleared",
  seriesSettings(pp), [{ y: "y / V", err: "sy / V", xmin: 2, xmax: 4 }, { y: "y / V", err: null, xmin: null, xmax: null }]);
const job = prepareSeries(pp, [{ y: "y / V", err: "sy / V", xmin: 2, xmax: 4 }]).jobs[0];
eq("points in range", [job.x, job.yv, job.sy, job.weighted, job.unit, job.yunit], [[2, 3, 4], [2, 3.1, 4], [0.1, 0.1, 0.1], true, "V/m", "V"]);
const msg = l => prepareSeries(pp, l).error;
eq("two points in range", msg([{ y: "y / V", err: null, xmin: 3, xmax: 4 }]), "Reihe 1 („y / V“): Im gewählten x-Bereich liegen 2 Messpunkte. Für eine Gerade braucht es mindestens drei.");
eq("empty range", msg([{ y: "y / V", err: null, xmin: 3.5, xmax: 3.6 }]), "Reihe 1 („y / V“): Im gewählten x-Bereich liegen 0 Messpunkte. Für eine Gerade braucht es mindestens drei.");
eq("from above to", msg([{ y: "y / V", err: null, xmin: 4, xmax: 1.5 }]), "Reihe 1 („y / V“): Der x-Bereich ist leer, denn „x von“ (4) ist größer als „x bis“ (1,5).");
eq("y is x", msg([{ y: "x / m", err: null, xmin: null, xmax: null }]), "Reihe 1 („x / m“): Die y-Spalte ist die x-Spalte. Bitte eine andere Spalte wählen.");
eq("error is y", msg([{ y: "y / V", err: "y / V", xmin: null, xmax: null }]), "Reihe 1 („y / V“): Die Fehlerspalte muss eine andere Spalte sein als x und y.");
eq("no series", msg([]), "Es gibt noch keine Reihe. Bitte mit „Reihe hinzufügen“ eine y-Spalte wählen.");
pp.columns[2].values[1] = 0;
eq("error 0 names the row", msg([{ y: "y / V", err: "sy / V", xmin: null, xmax: null }]), "Reihe 1 („y / V“): Alle Fehlerwerte müssen größer als 0 sein (Zeile 2).");
// Staleness: the result depends on the series settings and on the columns it used, not on other columns.
const q = newProject(["x / m", "y / V", "sy / V", "other"], [[1, 1, 0.1, 5], [2, 2, 0.1, 5], [3, 3.1, 0.1, 5]]);
q.settings.series = [{ y: "y / V", err: "sy / V", xmin: null, xmax: null }];
addResult(q, { kind: "series", fits: [] });
const fresh = () => !isStale(q, q.results[0]);
eq("fresh after computing", fresh(), true);
q.columns[3].values[0] = 9; eq("other column does not matter", fresh(), true);
q.columns[1].values[0] = 1.5; eq("y value change makes it stale", fresh(), false); q.columns[1].values[0] = 1; eq("and back", fresh(), true);
q.settings.series[0].xmax = 2; eq("range change makes it stale", fresh(), false); q.settings.series[0].xmax = null;
q.columns[2].values[2] = 0.2; eq("error value change makes it stale", fresh(), false);

// --- real page ---
const { base, close } = await serve();
const dir = mkdtempSync(resolve(tmpdir(), "p2s8-"));
const hand = newProject(["F / N", "<img src=x onerror=window.pwn=1>", "s"], [[1, 1, 0.1], [2, 2, 0.1], [3, 3, 0.1]]);
hand.settings.series = [{ y: "<img src=x onerror=window.pwn=1>", err: "s", xmin: "<script>window.pwn=2</script>", xmax: 3 }];
hand.results.push({ kind: "series", inputs: [], fits: [{ y: "<img src=x onerror=window.pwn=3>", err: "<img src=x onerror=window.pwn=4>", xmin: "<script>window.pwn=5</script>", xmax: null, n: "<img src=x onerror=window.pwn=6>", weighted: true,
  dof: "<img src=x onerror=window.pwn=7>", chi2: "<img src=x onerror=window.pwn=8>", xlo: 1, xhi: 3, a: { value: "<img src=x onerror=window.pwn=9>", uScaled: "x", unit: "<script>window.pwn=10</script>" }, b: { value: 1, uScaled: 1, unit: "m" } },
  { y: "<img src=x onerror=window.pwn=11>", weighted: false, ssr: "<img src=x onerror=window.pwn=12>", xlo: 1, xhi: 3, a: { value: 1, uScaled: 1, unit: "<img src=x onerror=window.pwn=13>" }, b: { value: 1, uScaled: 1, unit: "m" } }],
  params: [{ name: "<img src=x onerror=window.pwn=14>", unit: "<script>window.pwn=15</script>", value: 1, uScaled: 0.1 }], computedFrom: "x" });
writeFileSync(dir + "/hand.plotlab", save(hand));

const br = await chromium.launch();
const p = await (await br.newContext({ viewport: { width: 1200, height: 3400 } })).newPage();
const external = [];
p.on("request", r => { if (!r.url().startsWith(base) && !r.url().startsWith("data:") && !r.url().startsWith("blob:")) external.push(r.url()); });
await p.goto(base + "app/index.html?start=leer");
await p.evaluate(() => localStorage.clear());
await p.reload();
const lines = () => p.$$eval("#results .res", e => e.map(x => x.textContent));
const compare = () => p.$$eval("#results [data-compare]", e => e.map(x => x.textContent));
const srmsg = async () => (await p.isVisible("#srmsg")) ? await p.textContent("#srmsg") : null;
const traces = () => p.evaluate(() => document.getElementById("plot").data.map(t => t.name));
const stale = () => p.$$eval(".stalemsg", e => e.length);
const sres = () => p.evaluate(() => proj.results.find(r => r.kind === "series"));
const go = async () => { await p.click("#sr_go"); await p.waitForFunction(() => !document.getElementById("sr_go").disabled); };
const DATA = "F / N;ΔL auf / mm;sΔL auf / mm;ΔL ab / mm;sΔL ab / mm\n10;0,26;0,02;0,30;0,02\n20;0,50;0,02;0,55;0,02\n30;0,77;0,02;0,81;0,02\n40;1,03;0,02;1,05;0,04\n50;1,28;0,02;1,31;0,04\n60;1,51;0,02;1,54;0,04";

eq("series fit is off before data", [await p.isDisabled("#sr_go"), await p.isDisabled("#sr_add")], [true, true]);
await p.fill("#paste", DATA); await p.click("#pastego");
await p.waitForFunction(() => !document.getElementById("sr_go").disabled, null, { timeout: 120000 });
await p.click("#sr_go");
eq("no series yet", await srmsg(), "Es gibt noch keine Reihe. Bitte mit „Reihe hinzufügen“ eine y-Spalte wählen.");

// Two series: the page guesses the y and error columns.
await p.click("#sr_add"); await p.click("#sr_add");
eq("guessed series", await p.evaluate(() => seriesSettings(proj)), [{ y: "ΔL auf / mm", err: "sΔL auf / mm", xmin: null, xmax: null }, { y: "ΔL ab / mm", err: "sΔL ab / mm", xmin: null, xmax: null }]);
eq("rows shown", await p.$$eval("#sr_rows [data-k]", e => e.length), 2);
await go();
eq("no message", await srmsg(), null);
let r = await sres();
const [f1, f2] = r.fits;
near("loading a", f1.a.value, 0.025285714286); near("loading u scaled", f1.a.uScaled, 0.000290437156); near("loading u unscaled", f1.a.uUnscaled, 0.000478091444);
near("loading b", f1.b.value, 0.006666666667); near("loading u(b) scaled", f1.b.uScaled, 0.011310902172); near("loading chi2", f1.chi2, 1.47619047619); eq("loading dof", f1.dof, 4);
near("unloading a", f2.a.value, 0.025018987342); near("unloading u scaled", f2.a.uScaled, 0.000197330702); near("unloading u unscaled", f2.a.uUnscaled, 0.000711568067);
near("unloading b", f2.b.value, 0.052172995781); near("unloading u(b) scaled", f2.b.uScaled, 0.005875906176); near("unloading chi2", f2.chi2, 0.307621308017);
eq("units", [f1.a.unit, f1.b.unit, f2.a.unit], ["mm/N", "mm", "mm/N"]);
eq("result lines in HU format", await lines(), ["a (ΔL auf) = (0,02529 ± 0,00029) mm/N", "b (ΔL auf) = (0,007 ± 0,011) mm", "a (ΔL ab) = (0,02502 ± 0,00020) mm/N", "b (ΔL ab) = (0,052 ± 0,006) mm"]);
eq("slope comparison, scaled", await compare(), ["Steigungen: a (ΔL auf) − a (ΔL ab) = (0,0003 ± 0,0004) mm/N. Das sind 0,7596 kombinierte Unsicherheiten. Die Steigungen stimmen im Rahmen ihrer Unsicherheiten überein (unter 2)."]);
// Both series in one plot, each with a named fit line; the axis titles carry quantity and unit.
eq("legend names", await traces(), ["ΔL auf / mm", "Anpassung ΔL auf / mm", "ΔL ab / mm", "Anpassung ΔL ab / mm"]);
const pl = await p.evaluate(() => { const d = document.getElementById("plot"); return { x: d.layout.xaxis.title.text, y: d.layout.yaxis.title.text, lines: [d.data[1], d.data[3]].map(t => [t.x, t.y]), err: [d.data[0].error_y.array, d.data[2].error_y.array], op: d.data[0].marker.opacity, legend: d.layout.showlegend }; });
eq("axis titles", [pl.x, pl.y, pl.legend], ["F / N", "ΔL auf, ΔL ab / mm", true]);
near("line 1 start", pl.lines[0][1][0], 0.025285714286 * 10 + 0.006666666667); near("line 1 end", pl.lines[0][1][1], 0.025285714286 * 60 + 0.006666666667);
eq("line 1 spans the data", pl.lines[0][0], [10, 60]);
near("line 2 end", pl.lines[1][1][1], 0.025018987342 * 60 + 0.052172995781);
eq("error bars of each series", pl.err, [[0.02, 0.02, 0.02, 0.02, 0.02, 0.02], [0.02, 0.02, 0.02, 0.04, 0.04, 0.04]]);
eq("all points drawn solid", pl.op, [1, 1, 1, 1, 1, 1]);
const method = await p.textContent("#results [data-how]");
eq("method on screen: scaled", method, "Jede Reihe: Gerade y = a·x + b, gewichtete Reihen mit Gewichten 1/s²; die Fehler von a und b sind mit √(χ²/DoF) skaliert (ungewichtete Reihen: aus der Streuung der Punkte).");
eq("table of series", await p.$$eval("#results [data-series] tbody tr", t => t.map(r => [...r.children].map(c => c.textContent))), [
  ["ΔL auf / mm", "Anfang bis Ende", "6", "gewichtet (Fehlerspalte „sΔL auf / mm“)", "χ²/DoF = 0,369"], ["ΔL ab / mm", "Anfang bis Ende", "6", "gewichtet (Fehlerspalte „sΔL ab / mm“)", "χ²/DoF = 0,07691"]]);
await p.screenshot({ path: "evidence/phase2-step8-series.png", fullPage: true });
await p.locator("#plot").screenshot({ path: "evidence/phase2-step8-series-plot.png" });

// Unscaled errors: other uncertainties, other z.
await p.selectOption("#errm", "unscaled");
eq("lines unscaled", (await lines()).filter((_, i) => i % 2 === 0), ["a (ΔL auf) = (0,0253 ± 0,0005) mm/N", "a (ΔL ab) = (0,0250 ± 0,0007) mm/N"]);
eq("slope comparison, unscaled", await compare(), ["Steigungen: a (ΔL auf) − a (ΔL ab) = (0,0003 ± 0,0009) mm/N. Das sind 0,3111 kombinierte Unsicherheiten. Die Steigungen stimmen im Rahmen ihrer Unsicherheiten überein (unter 2)."]);
await p.selectOption("#errm", "scaled");

// Chosen x ranges: loading 10..30, unloading 40..60. Changing a range makes the result out of date and the plot goes back to the single plot.
await p.fill('#sr_rows [data-k="0"] [data-f="xmax"]', "30");
eq("range edit makes it stale", await stale(), 1);
eq("stale result: no series lines in the plot", (await traces()).includes("Anpassung ΔL auf / mm"), false);
await p.fill('#sr_rows [data-k="1"] [data-f="xmin"]', "40");
await go();
r = await sres();
near("loading 10..30 a", r.fits[0].a.value, 0.0255); near("loading 10..30 u scaled", r.fits[0].a.uScaled, 0.000866025404); near("loading 10..30 chi2", r.fits[0].chi2, 0.375); eq("n and dof", [r.fits[0].n, r.fits[0].dof], [3, 1]);
near("unloading 40..60 a", r.fits[1].a.value, 0.0245); near("unloading 40..60 u scaled", r.fits[1].a.uScaled, 0.000866025404); near("unloading chi2", r.fits[1].chi2, 0.09375);
eq("compare ranges", await compare(), ["Steigungen: a (ΔL auf) − a (ΔL ab) = (0,0010 ± 0,0012) mm/N. Das sind 0,8165 kombinierte Unsicherheiten. Die Steigungen stimmen im Rahmen ihrer Unsicherheiten überein (unter 2)."]);
eq("range column in the table", await p.$$eval("#results [data-series] tbody tr td:nth-child(2)", t => t.map(c => c.textContent)), ["Anfang bis 30", "40 bis Ende"]);
const pl2 = await p.evaluate(() => { const d = document.getElementById("plot").data; return { op: [d[0].marker.opacity, d[2].marker.opacity], l: [d[1].x, d[3].x] }; });
eq("points outside the range are pale", pl2.op, [[1, 1, 1, 0.3, 0.3, 0.3], [0.3, 0.3, 0.3, 1, 1, 1]]);
eq("fit lines span the fitted range only", pl2.l, [[10, 30], [40, 60]]);
await p.screenshot({ path: "evidence/phase2-step8-ranges.png", fullPage: true });
await p.locator("#plot").screenshot({ path: "evidence/phase2-step8-ranges-plot.png" });

// Undo steps back: the fit, then each typed range (one step per field). With the old settings the first result is fresh again.
const ranges = () => p.evaluate(() => seriesSettings(proj).map(s => [s.xmin, s.xmax]));
await p.click("#undo");
eq("undo the fit: ranges stay, first result is out of date", [await ranges(), await stale()], [[[null, 30], [40, null]], 1]);
await p.click("#undo");
eq("undo xmin: ranges back to open", await ranges(), [[null, 30], [null, null]]);
await p.click("#undo");
eq("undo all: open ranges and the first result fresh again", [await ranges(), await stale(), (await traces()).length], [[[null, null], [null, null]], 0, 4]);
await p.click("#redo"); await p.click("#redo"); await p.click("#redo");
eq("redo all: the ranged fit is back and fresh", [await ranges(), await stale(), (await compare())[0].includes("0,8165")], [[[null, 30], [40, null]], 0, true]);

// Data edits: loading value of row 6 changed makes it stale, putting it back makes it fresh; reload and save/open keep the result.
await p.fill('input[data-r="5"][data-c="1"]', "1,6");
eq("data edit makes it stale", await stale(), 1);
await p.fill('input[data-r="5"][data-c="1"]', "1,51");
eq("old value: fresh again", await stale(), 0);
await p.reload(); await p.waitForSelector("#results .res");
eq("after reload: result and ranges", [(await compare()).length, await p.inputValue('#sr_rows [data-k="0"] [data-f="xmax"]'), await p.inputValue('#sr_rows [data-k="1"] [data-f="xmin"]')], [1, "30", "40"]);
await p.waitForFunction(() => !document.getElementById("sr_go").disabled, null, { timeout: 120000 });
const [dl] = await Promise.all([p.waitForEvent("download"), p.click("#saveproj")]);
writeFileSync(dir + "/saved.plotlab", readFileSync(await dl.path()));
await p.click("#example"); await p.setInputFiles("#openfile", dir + "/saved.plotlab"); await p.waitForSelector("#results .res");
eq("after save and open", [(await lines()).length, (await traces()).length], [4, 4]);

// Unweighted series (error column "(keine)"): ordinary least squares, loading a = 0,025285714286, b = 0,006666666667, u(a) = 0,000290437156 (reference script).
await p.selectOption('#sr_rows [data-k="0"] [data-f="err"]', "");
await p.fill('#sr_rows [data-k="0"] [data-f="xmax"]', "");
await p.click('#sr_rows [data-sdel="1"]');
await go();
r = await sres();
near("OLS a", r.fits[0].a.value, 0.025285714286); near("OLS b", r.fits[0].b.value, 0.006666666667); near("OLS u(a)", r.fits[0].a.uScaled, 0.000290437156); near("OLS SSR", r.fits[0].ssr, 0.0005904761904761905);
eq("one series: no comparison", await compare(), []);
eq("unweighted line", (await lines())[0], "a (ΔL auf) = (0,02529 ± 0,00029) mm/N");
eq("unweighted method", (await p.$$eval("#results [data-series] tbody td", t => t.map(c => c.textContent))).slice(3), ["ungewichtet", "Summe der Abweichungsquadrate = 0,0005905"]);
eq("single series: y title is the column", await p.evaluate(() => document.getElementById("plot").layout.yaxis.title.text), "ΔL auf / mm");

// A clearly different unloading slope: the verdict says so. Loading as before (weighted), unloading soft with s = 0,01.
await p.fill("#paste", "F / N;ΔL auf / mm;sΔL auf / mm;ΔL ab / mm;sΔL ab / mm\n10;0,26;0,02;0,20;0,01\n20;0,50;0,02;0,38;0,01\n30;0,77;0,02;0,58;0,01\n40;1,03;0,02;0,76;0,01\n50;1,28;0,02;0,95;0,01\n60;1,51;0,02;1,13;0,01");
await p.click("#pastego");
await p.click("#sr_add"); await p.click("#sr_add");
await go();
r = await sres();
near("soft unloading a", r.fits[1].a.value, 0.018685714286); near("soft u scaled", r.fits[1].a.uScaled, 0.000125627676); near("soft u unscaled", r.fits[1].a.uUnscaled, 0.000239045722);
eq("verdict: different", await compare(), ["Steigungen: a (ΔL auf) − a (ΔL ab) = (0,0066 ± 0,0003) mm/N. Das sind 20,86 kombinierte Unsicherheiten. Die Steigungen unterscheiden sich deutlich (2 oder mehr)."]);
await p.selectOption("#errm", "unscaled");
eq("verdict unscaled", (await compare())[0].includes("Das sind 12,35 kombinierte Unsicherheiten."), true);
await p.selectOption("#errm", "scaled");
await p.screenshot({ path: "evidence/phase2-step8-different.png", fullPage: true });

// Bad input.
await p.fill('#sr_rows [data-k="0"] [data-f="xmin"]', "50"); await p.fill('#sr_rows [data-k="0"] [data-f="xmax"]', "20");
await p.click("#sr_go"); eq("from above to", await srmsg(), "Reihe 1 („ΔL auf / mm“): Der x-Bereich ist leer, denn „x von“ (50) ist größer als „x bis“ (20).");
await p.fill('#sr_rows [data-k="0"] [data-f="xmin"]', "45"); await p.fill('#sr_rows [data-k="0"] [data-f="xmax"]', "");
await p.click("#sr_go"); eq("two points in range", await srmsg(), "Reihe 1 („ΔL auf / mm“): Im gewählten x-Bereich liegen 2 Messpunkte. Für eine Gerade braucht es mindestens drei.");
await p.fill('#sr_rows [data-k="0"] [data-f="xmin"]', "abc");
eq("text in a range field is marked", await p.$eval('#sr_rows [data-k="0"] [data-f="xmin"]', e => e.classList.contains("bad")), true);
await p.click("#sr_go"); eq("text in a range", await srmsg(), "Ein x-Bereich ist keine Zahl. Bitte eine Zahl eintragen oder das Feld leeren.");
await p.fill('#sr_rows [data-k="0"] [data-f="xmin"]', "");
await p.fill('input[data-r="2"][data-c="2"]', "0");
await p.click("#sr_go"); eq("error value 0", await srmsg(), "Reihe 1 („ΔL auf / mm“): Alle Fehlerwerte müssen größer als 0 sein (Zeile 3).");
await p.fill('input[data-r="2"][data-c="2"]', "0,02");
await p.selectOption('#sr_rows [data-k="0"] [data-f="y"]', "F / N");
await p.click("#sr_go"); eq("y is x", await srmsg(), "Reihe 1 („F / N“): Die y-Spalte ist die x-Spalte. Bitte eine andere Spalte wählen.");
await p.screenshot({ path: "evidence/phase2-step8-error.png", fullPage: true });
await p.click("#sr_add"); await p.click("#sr_add"); await p.click("#sr_add");
eq("at most 4 series", await srmsg(), "Es sind höchstens 4 Reihen möglich.");
eq("4 rows", await p.$$eval("#sr_rows [data-k]", e => e.length), 4);

// An edit while Python is working is refused instead of being attached to the new data.
await p.click('#sr_rows [data-sdel="3"]'); await p.click('#sr_rows [data-sdel="2"]'); await p.selectOption('#sr_rows [data-k="0"] [data-f="y"]', "ΔL auf / mm");
await p.evaluate(() => { document.getElementById("sr_go").click(); proj.columns[1].values[0] = 0.27; });
await p.waitForFunction(() => !document.getElementById("sr_go").disabled);
eq("edit during the calculation", await srmsg(), "Die Daten wurden während der Berechnung geändert. Bitte erneut anpassen.");

// Hand-edited project: nothing in names, settings or results runs.
await p.setInputFiles("#openfile", dir + "/hand.plotlab");
await p.waitForFunction(() => document.getElementById("openfile").value === ""); // the app clears the field once the file is read
await p.waitForSelector("#results .res");
eq("no script ran", await p.evaluate(() => window.pwn), undefined);
eq("no injected elements", await p.$$eval("#results img, #results script, #sr_rows img, #sr_rows script, #srmsg img, #plot img", e => e.length), 0);
eq("hand result is stale", await stale(), 1);
eq("no external requests", external, []);
await br.close(); close();
if (bad) process.exit(1);
console.log("phase 2 step 8: two series fitted over chosen x ranges match the hand values; slopes compared in combined uncertainties");
