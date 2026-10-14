// Phase 2 step 9: calibration line with an unknown read off, with uncertainty including the covariance of a and b (P7 refractometer, P4).
// Expected numbers come from tests/reference/calibration.py (exact fractions, textbook formulas; the unweighted case also by the classic inverse-regression formula), never from the app or SciPy:
//   weighted:   a = 0,00143481012658, b = 1,33305527426, chi2 = 0,751054852321 (dof 4), cov(a,b) = -4,05063291139e-9 unscaled, -7,60561875768e-10 scaled
//               u(a) = 3,55784033482e-5 unscaled, 1,54167307227e-5 scaled; u(b) = 1,53716271042e-4 unscaled, 6,66078894875e-5 scaled
//   y0 = 1,3405 ± 0,0003: x0 = 5,18864872813, u = 0,226561889568 unscaled, 0,212477689837 scaled (without the covariance term: 0,267859 and 0,221316)
//   y0 = 1,3372 ± 0,0002: x0 = 2,88869283929, u = 0,142877486748 scaled;  y0 = 1,3490 ± 0,0003: x0 = 11,1127775327, u = 0,227856938492 scaled (outside the standards 0 to 10)
//   unweighted: a = 0,00143285714286, b = 1,33305238095, SSR = 3,27619047619e-8, u(a) = 1,08169682777e-5, u(b) = 6,54999956726e-5, cov = -5,85034013605e-10; x0 = 5,19774011299, u = 0,210959019498
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { serve } from "./serve.mjs";
const req = createRequire(import.meta.url);
const { readOff, parseCalibValues } = req("../app/derived.js");
const { newProject, save, calibSettings, isStale, addResult } = req("../app/project.js");
const { chromium } = createRequire(resolve("testbuild/x.js"))("playwright-core");
let bad = 0;
const eq = (name, got, want) => {
  got = JSON.stringify(got); want = JSON.stringify(want);
  if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; }
};
const near = (name, got, want, tol = 1e-7) => { if (!(Math.abs(got - want) <= tol * Math.abs(want))) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; } };

// --- pure functions, by hand ---
// a = 2, b = 1, u(a) = 0,1, u(b) = 0,2, cov = -0,01, y0 = 5 ± 0,3: x0 = (5-1)/2 = 2; u² = (0,09 + 4·0,01 + 0,04 + 2·2·(-0,01))/4 = 0,13/4 = 0,0325.
let r = readOff({ a: 2, b: 1, ua: 0.1, ub: 0.2, cov: -0.01 }, 5, 0.3);
near("x0", r.x0, 2); near("u", r.u, Math.sqrt(0.0325));
near("share y0", r.parts.y0, 0.09 / 0.13); near("share a", r.parts.a, 0.04 / 0.13); near("share b", r.parts.b, 0.04 / 0.13); near("share cov", r.parts.cov, -0.04 / 0.13);
// positive covariance adds: 0,09 + 0,04 + 0,04 + 0,04 = 0,21; /4 = 0,0525
near("positive cov", readOff({ a: 2, b: 1, ua: 0.1, ub: 0.2, cov: 0.01 }, 5, 0.3).u, Math.sqrt(0.0525));
// exact y0, no uncertainty on a and b except u(a): x0 = 4, u = x0·u(a)/a = 0,2
near("only u(a)", readOff({ a: 2, b: 0, ua: 0.1, ub: 0, cov: 0 }, 8, 0).u, 0.2);
eq("slope clearly 0", readOff({ a: 0.1, b: 1, ua: 0.1, ub: 0.2, cov: 0 }, 5, 0.3).error, "Die Steigung a = 0,1 (u(a) = 0,1) ist nicht deutlich von 0 verschieden. Daraus lässt sich kein x₀ ablesen.");
eq("slope exactly 0", typeof readOff({ a: 0, b: 1, ua: 0, ub: 0, cov: 0 }, 5, 0.3).error, "string");
eq("values: list", parseCalibValues("1,3405 ± 0,0003; 1.3372 +- 0,0002 ;2").values, [{ y0: 1.3405, u: 0.0003 }, { y0: 1.3372, u: 0.0002 }, { y0: 2, u: 0 }]);
eq("values: empty", parseCalibValues("  ").error, "Bitte mindestens einen gemessenen Wert y₀ eintragen, zum Beispiel 0,45 ± 0,01. Mehrere Werte mit „;“ trennen.");
eq("values: letters", parseCalibValues("abc ± 1").error, "„abc ± 1“: „abc“ ist keine Zahl.");
eq("values: negative u", parseCalibValues("1 ± -0,1").error, "„1 ± -0,1“: Die Unsicherheit „-0,1“ ist keine Zahl größer oder gleich 0.");
eq("values: two ±", parseCalibValues("1 ± 0,1 ± 0,2").error, "„1 ± 0,1 ± 0,2“: Es darf nur ein ± vorkommen.");
eq("values: 11 entries", parseCalibValues(Array(11).fill("1").join(";")).error, "Es sind höchstens 10 gemessene Werte möglich.");
// Staleness: the read-off depends on the fit data and on its own y0 text.
const q = newProject(["x / %", "y / 1", "sy / 1"], [[0, 1, 0.1], [1, 2, 0.1], [2, 3.1, 0.1]]);
q.settings.calib = { y0: "2 ± 0,1" };
addResult(q, { kind: "calib", reads: [] });
const fresh = () => !isStale(q, q.results[0]);
eq("fresh after computing", fresh(), true);
q.settings.calib = { y0: "2,5 ± 0,1" }; eq("y0 text change makes it stale", fresh(), false); q.settings.calib = { y0: "2 ± 0,1" }; eq("and back", fresh(), true);
q.columns[1].values[0] = 1.2; eq("data change makes it stale", fresh(), false);
eq("calibSettings default", calibSettings({ settings: { calib: { y0: 5 } } }), { y0: "" });

// --- real page ---
const { base, close } = await serve();
const dir = mkdtempSync(resolve(tmpdir(), "p2s9-"));
const hand = newProject(["w / %", "n / 1", "sn / 1"], [[0, 1, 0.1], [1, 2, 0.1], [2, 3.1, 0.1]]);
hand.settings.calib = { y0: "<img src=x onerror=window.pwn=1>" };
hand.results.push({ kind: "calib", weighted: true, range: [0, "<img src=x onerror=window.pwn=2>"], used: { a: "<img src=x onerror=window.pwn=3>", b: 1, xUnit: "<img src=x onerror=window.pwn=4>", scaled: { ua: "x", ub: 1, cov: 0 } },
  reads: [{ y0: 1, u0: "<img src=x onerror=window.pwn=5>", x0: 2, uScaled: 0.1, partsScaled: { y0: "<img src=x onerror=window.pwn=6>", a: 0.5, b: 0.2, cov: 0.1 } }],
  params: [{ name: "<img src=x onerror=window.pwn=7>", unit: "<script>window.pwn=8</script>", value: 1, uScaled: 0.1 }], computedFrom: "x" });
writeFileSync(dir + "/hand.plotlab", save(hand));

const br = await chromium.launch();
const p = await (await br.newContext({ viewport: { width: 1200, height: 3600 } })).newPage();
const external = [];
p.on("request", r => { if (!r.url().startsWith(base) && !r.url().startsWith("data:") && !r.url().startsWith("blob:")) external.push(r.url()); });
await p.goto(base + "app/index.html?start=leer");
await p.evaluate(() => localStorage.clear());
await p.reload();
const lines = () => p.$$eval("#results .res", e => e.map(x => x.textContent));
const notes = () => p.$$eval("#results [data-readoff]", e => e.map(x => x.textContent));
const cmsg = async () => (await p.isVisible("#calibmsg")) ? await p.textContent("#calibmsg") : null;
const fmsg = async () => (await p.isVisible("#fitmsg")) ? await p.textContent("#fitmsg") : null;
const stale = () => p.$$eval(".stalemsg", e => e.length);
const names = () => p.evaluate(() => document.getElementById("plot").data.map(t => t.name));
const readoff = async y0 => { await p.fill("#c_y0", y0); await p.click("#c_go"); };
const fit = async () => { await p.click("#fit"); await p.waitForFunction(() => !document.getElementById("fit").disabled); };
const DATA = "w / %;n / 1;sn / 1\n0;1,3331;0,0002\n2;1,3358;0,0002\n4;1,3389;0,0002\n6;1,3416;0,0004\n8;1,3445;0,0004\n10;1,3474;0,0004";

// Bad input first: no data, then no fit.
await p.click("#c_go");
eq("no project: nothing happens", await cmsg(), null);
await p.fill("#paste", DATA); await p.click("#pastego");
await p.waitForFunction(() => !document.getElementById("fit").disabled, null, { timeout: 120000 });
await readoff("1,3405 ± 0,0003");
eq("no fit yet", await cmsg(), "Bitte zuerst „Anpassen“ drücken. Das Ergebnis der Geradenanpassung fehlt oder ist veraltet.");

// The weighted calibration line and its covariance, straight from the worker.
await fit();
const f = await p.evaluate(() => proj.results.find(r => r.kind === "fit"));
near("a", f.params[0].value, 0.00143481012658); near("b", f.params[1].value, 1.33305527426); near("chi2", f.chi2, 0.751054852321);
near("u(a) scaled", f.params[0].uScaled, 1.54167307227e-5); near("u(a) unscaled", f.params[0].uUnscaled, 3.55784033482e-5);
near("u(b) scaled", f.params[1].uScaled, 6.66078894875e-5); near("u(b) unscaled", f.params[1].uUnscaled, 1.53716271042e-4);
near("cov scaled", f.cov.scaled[1], -7.60561875768e-10); near("cov unscaled", f.cov.unscaled[1], -4.05063291139e-9);
near("var a from cov", f.cov.scaled[0], 1.54167307227e-5 ** 2); near("var b from cov", f.cov.unscaled[2], 1.53716271042e-4 ** 2);

// Read off one unknown.
await readoff("1,3405 ± 0,0003");
eq("no message", await cmsg(), null);
let c = await p.evaluate(() => proj.results.find(r => r.kind === "calib"));
near("x0", c.reads[0].x0, 5.18864872813); near("u scaled (with covariance)", c.reads[0].uScaled, 0.212477689837); near("u unscaled", c.reads[0].uUnscaled, 0.226561889568);
eq("covariance changes the result by more than 3 %", Math.abs(c.reads[0].uScaled - 0.221315550914) / 0.2124776898 > 0.03, true);
eq("result line scaled", (await lines()).slice(-1), ["x₀ (y₀ = 1,3405) = (5,19 ± 0,21) %"]);
const how = await p.textContent("#results [data-calibhow]");
eq("numbers and method named", [how.includes("a = 0,00143481, b = 1,33306, u(a) = 0,0000154167, u(b) = 0,0000666079, cov(a,b) = -7,606E-10"), how.includes("a, b und ihre Kovarianz mit χ²/DoF skaliert")], [true, true]);
const shares = (await notes())[0];
eq("shares add up in the text", shares.startsWith("y₀ = 1,3405 ± 0,0003: x₀ = 5,189 %. Anteile an u(x₀)²: y₀ 97 %, a 7 %, b 5 %, Kovarianz -8 %"), true);
eq("no extrapolation warning inside the range", shares.includes("Extrapolation"), false);
// Plot: guides, marker with horizontal uncertainty, legend entry; axes keep quantity and unit.
const pl = await p.evaluate(() => { const d = document.getElementById("plot"); return { n: d.data.map(t => t.name), g: d.data[2], m: d.data[3], yr: d.layout.yaxis.range, x: d.layout.xaxis.title.text, y: d.layout.yaxis.title.text }; });
eq("legend names", pl.n.filter(Boolean), ["Messwerte", "Anpassung", "Ablesung x₀ (± u)"]);
eq("axis titles", [pl.x, pl.y], ["w / %", "n / 1"]);
near("guide: y0 horizontal", pl.g.y[0], 1.3405); near("guide: ends at x0", pl.g.x[1], 5.18864872813); eq("guide: vertical goes to the axis bottom", [pl.g.x[2] === pl.g.x[1], pl.g.y[2] === pl.yr[0]], [true, true]);
near("marker x0", pl.m.x[0], 5.18864872813); near("marker y0", pl.m.y[0], 1.3405); near("marker error bar", pl.m.error_x.array[0], 0.212477689837);
await p.screenshot({ path: "evidence/phase2-step9-calibration.png", fullPage: true });
await p.locator("#plot").screenshot({ path: "evidence/phase2-step9-calibration-plot.png" });

// Unscaled errors: other uncertainty, same x0.
await p.selectOption("#errm", "unscaled");
eq("result line unscaled", (await lines()).slice(-1), ["x₀ (y₀ = 1,3405) = (5,19 ± 0,23) %"]);
near("marker error bar unscaled", await p.evaluate(() => document.getElementById("plot").data[3].error_x.array[0]), 0.226561889568);
await p.selectOption("#errm", "scaled");

// Three unknowns at once; the third lies above the last standard.
await readoff("1,3405 ± 0,0003; 1,3372 ± 0,0002; 1,3490 ± 0,0003");
eq("three result lines", (await lines()).slice(-3), ["x₀ (y₀ = 1,3405) = (5,19 ± 0,21) %", "x₀ (y₀ = 1,3372) = (2,89 ± 0,14) %", "x₀ (y₀ = 1,349) = (11,11 ± 0,23) %"]);
c = await p.evaluate(() => proj.results.find(r => r.kind === "calib"));
near("x0 #2", c.reads[1].x0, 2.88869283929); near("u #2", c.reads[1].uScaled, 0.142877486748); near("x0 #3", c.reads[2].x0, 11.1127775327); near("u #3", c.reads[2].uScaled, 0.227856938492);
eq("extrapolation warned for #3 only", (await notes()).map(t => t.includes("außerhalb des Kalibrierbereichs 0 bis 10 %")), [false, false, true]);
eq("three markers", await p.evaluate(() => document.getElementById("plot").data.at(-1).x.length), 3);
await p.screenshot({ path: "evidence/phase2-step9-three.png", fullPage: true });

// Staleness, undo, reload, save and open.
await p.fill('input[data-r="5"][data-c="1"]', "1,3480");
eq("data edit makes it stale; guides leave the plot", [await stale(), (await names()).includes("Ablesung x₀ (± u)")], [2, false]);
await p.fill('input[data-r="5"][data-c="1"]', "1,3474");
eq("old value: fresh again", [await stale(), (await names()).includes("Ablesung x₀ (± u)")], [0, true]);
await p.fill("#c_y0", "1,3405 ± 0,0003");
eq("typing y0 makes the read-off stale", await stale(), 1);
await p.click("#undo");
eq("undo typing: fresh again", [await stale(), await p.inputValue("#c_y0")], [0, "1,3405 ± 0,0003; 1,3372 ± 0,0002; 1,3490 ± 0,0003"]);
await p.reload(); await p.waitForSelector("#results .res");
eq("after reload", [(await lines()).length, await stale(), await p.inputValue("#c_y0")], [5, 0, "1,3405 ± 0,0003; 1,3372 ± 0,0002; 1,3490 ± 0,0003"]);
await p.waitForFunction(() => !document.getElementById("fit").disabled, null, { timeout: 120000 });
const [dl] = await Promise.all([p.waitForEvent("download"), p.click("#saveproj")]);
writeFileSync(dir + "/saved.plotlab", readFileSync(await dl.path()));
await p.click("#example"); await p.setInputFiles("#openfile", dir + "/saved.plotlab"); await p.waitForFunction(() => proj.results.some(r => r.kind === "calib"));
eq("after save and open", [(await lines()).length, await stale(), (await names()).includes("Ablesung x₀ (± u)")], [5, 0, true]);

// Unweighted line: ordinary least squares; the classic inverse-regression formula gives the same u.
await p.click("#weighted"); await fit();
const f0 = await p.evaluate(() => proj.results.find(r => r.kind === "fit"));
near("OLS a", f0.params[0].value, 0.00143285714286); near("OLS b", f0.params[1].value, 1.33305238095); near("OLS SSR", f0.ssr, 3.27619047619e-8); near("OLS cov", f0.cov.scaled[1], -5.85034013605e-10);
eq("OLS has no unscaled covariance", f0.cov.unscaled, undefined);
eq("the old read-off is out of date after refitting unweighted", await stale(), 1);
await readoff("1,3405 ± 0,0003");
c = await p.evaluate(() => proj.results.find(r => r.kind === "calib"));
near("OLS x0", c.reads[0].x0, 5.19774011299); near("OLS u (classic formula)", c.reads[0].uScaled, 0.210959019498);
eq("OLS line", (await lines()).slice(-1), ["x₀ (y₀ = 1,3405) = (5,20 ± 0,21) %"]);
eq("OLS method named", (await p.textContent("#results [data-calibhow]")).includes("ungewichtete Anpassung; a, b und ihre Kovarianz aus der Streuung"), true);

// Bad input.
await readoff(""); eq("empty", await cmsg(), "Bitte mindestens einen gemessenen Wert y₀ eintragen, zum Beispiel 0,45 ± 0,01. Mehrere Werte mit „;“ trennen.");
await readoff("abc"); eq("letters", await cmsg(), "„abc“: „abc“ ist keine Zahl.");
await readoff("1,34 ± -1"); eq("negative u", await cmsg(), "„1,34 ± -1“: Die Unsicherheit „-1“ ist keine Zahl größer oder gleich 0.");
await p.screenshot({ path: "evidence/phase2-step9-error.png", fullPage: true });
// A flat series: the slope is not clearly different from 0.
await p.fill("#paste", "x / %;y / 1;sy / 1\n0;1,50;0,02\n1;1,52;0,02\n2;1,49;0,02\n3;1,51;0,02\n4;1,50;0,02");
await p.click("#pastego"); await p.waitForFunction(() => !document.getElementById("fit").disabled);
await fit(); await readoff("1,5 ± 0,01");
// by hand: y = 1,50 1,52 1,49 1,51 1,50 against x = 0..4: a = -0,010/10 = -0,001, SSR = 5,1e-4, u(a) = sqrt(5,1e-4/3/10) = 0,004123
eq("flat line", await cmsg(), "Die Steigung a = -0,001 (u(a) = 0,00412) ist nicht deutlich von 0 verschieden. Daraus lässt sich kein x₀ ablesen.");

// An old fit result without covariance (hand-edited, fresh data fingerprint).
await p.fill("#paste", DATA); await p.click("#pastego"); await p.waitForFunction(() => !document.getElementById("fit").disabled);
await fit();
await p.evaluate(() => { delete proj.results.find(r => r.kind === "fit").cov; });
await readoff("1,3405 ± 0,0003");
eq("fit without covariance", await cmsg(), "Das Ergebnis der Anpassung enthält die Kovarianz von a und b nicht (ältere Version). Bitte „Anpassen“ erneut drücken.");

// Hand-edited project: nothing in names, settings or results runs.
await p.setInputFiles("#openfile", dir + "/hand.plotlab");
await p.waitForFunction(() => proj.results.length === 1 && proj.results[0].computedFrom === "x");
eq("no script ran", await p.evaluate(() => window.pwn), undefined);
eq("no injected elements", await p.$$eval("#results img, #results script, #calib img, #calib script, #calibmsg img, #plot img", e => e.length), 0);
eq("hand result is stale", await stale(), 1);
eq("no external requests", external, []);
await br.close(); close();
if (bad) process.exit(1);
console.log("phase 2 step 9: calibration read-off x0 with covariance matches the hand values (weighted scaled/unscaled, unweighted, three unknowns, extrapolation warning)");
