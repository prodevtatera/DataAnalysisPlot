// Phase 1 step 7: the app's line fit against independent references.
//  - NIST StRD Norris (certified values, unweighted): 36 points, downloaded into tests/nist/Norris.dat.
//  - Weighted case: tests/reference/weighted_line.py (exact fractions, centred formulas, no SciPy). Its output is pasted below.
//  - Identity: with equal errors, the weighted fit with scaled errors must equal the unweighted fit, so it must also match NIST.
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { writeFileSync, readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { serve } from "./serve.mjs";
const { newProject, save } = createRequire(import.meta.url)("../app/project.js");
import { chromium } from "./tools.mjs";
let bad = 0;
const digits = (got, want) => Math.min(9, -Math.log10(Math.abs(got - want) / Math.abs(want) || 1e-12));
const need = (name, got, want, min) => { const d = digits(got, want); if (!(d >= min)) { console.log(`FAIL ${name}: got ${got}, want ${want}, ${d.toFixed(1)} digits < ${min}`); bad++; } return d.toFixed(1); };
const eq = (name, got, want) => { if (JSON.stringify(got) !== JSON.stringify(want)) { console.log(`FAIL ${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`); bad++; } };

// NIST certified values for Norris (lines 31 to 46 of Norris.dat).
const N = { b0: -0.262323073774029, b1: 1.00211681802045, ub0: 0.232818234301152, ub1: 0.429796848199937e-3, ssr: 26.6173985294224, dof: 34 };
const lines = readFileSync("tests/nist/Norris.dat", "utf8").split("\n");
const rows = lines.slice(60, 96).map(l => l.trim().split(/\s+/).map(Number).reverse());   // file has "y x"; app wants [x, y]
eq("Norris: 36 rows read", [rows.length, rows[0]], [36, [0.2, 0.1]]);
eq("certified values were read from the file", ["-0.262323073774029", "0.232818234301152", "1.00211681802045", "0.429796848199937E-03", "26.6173985294224"].every(v => lines.slice(30, 46).join("\n").includes(v)), true);

// Weighted case from tests/reference/weighted_line.py (7 points, unequal errors).
const W = { x: [0.5, 1.5, 2.0, 3.5, 4.0, 6.0, 7.5], y: [1.9, 3.4, 4.2, 7.9, 8.1, 12.6, 15.2], s: [0.1, 0.2, 0.2, 0.4, 0.3, 0.5, 0.6],
  a: 1.8658850375023164, b: 0.850124435603448, ua: 0.051245731994698215, ub: 0.10534200849256145, chi2: 10.337103831511138, k: 1.4378528319345578 };
// Norris with a constant error 0.5 (same script): unscaled errors; scaled ones are NIST's.
const NW = { sigma: 0.5, ua: 0.00024287895501882604, ub: 0.1315659937787334, chi2: 106.46959411768944 };

const dir = mkdtempSync(resolve(tmpdir(), "p1s7-"));
const mk = (name, header, data, weighted) => { const p = newProject(header, data); p.settings.weighted = weighted; writeFileSync(`${dir}/${name}.plotlab`, save(p)); return `${dir}/${name}.plotlab`; };
const files = {
  nistOls: mk("nist-ols", ["x / ppb", "y / ppb"], rows, false),
  nistW: mk("nist-w", ["x / ppb", "y / ppb", "s / ppb"], rows.map(r => [...r, NW.sigma]), true),
  hand: mk("hand", ["x / s", "y / V", "sy / V"], W.x.map((v, i) => [v, W.y[i], W.s[i]]), true),
};

const { base, close } = await serve();
const br = await chromium.launch();
const p = await br.newPage({ viewport: { width: 1200, height: 1900 } });
await p.goto(base + "app/index.html");
await p.evaluate(() => localStorage.clear());
await p.reload();
const run = async f => {
  await p.setInputFiles("#openfile", f);
  await p.waitForFunction(() => !document.getElementById("fit").disabled, null, { timeout: 120000 });
  await p.click("#fit"); await p.waitForFunction(() => !document.getElementById("fit").disabled);
  await p.waitForSelector("#results .res");
  return p.evaluate(() => JSON.parse(JSON.stringify(proj.results.find(r => r.kind === "fit"))));
};
const report = [];

// 1. NIST Norris, unweighted: values >= 8 digits, standard errors >= 6 digits, sum of squares >= 8, DoF exact.
let r = await run(files.nistOls);
eq("Norris: parameter order a then b", r.params.map(q => q.name), ["a", "b"]);
report.push(["Norris OLS B1 (slope)", need("Norris B1", r.params[0].value, N.b1, 8), need("Norris u(B1)", r.params[0].uScaled, N.ub1, 6)]);
report.push(["Norris OLS B0 (intercept)", need("Norris B0", r.params[1].value, N.b0, 8), need("Norris u(B0)", r.params[1].uScaled, N.ub0, 6)]);
need("Norris SSR", r.ssr, N.ssr, 8); eq("Norris DoF", r.dof, N.dof);
// On screen: 6 significant digits in German format, and the HU result line (u to 1 digit, or 2 if it starts with 1 or 2).
eq("Norris: table shows rounded certified numbers", await p.$$eval("#results tbody tr", t => t.map(x => [...x.children].slice(1, 3).map(c => c.textContent.replace(/\u2212/g, "-")))), [["1,00212", "0,000429797"], ["-0,262323", "0,232818"]]);
eq("Norris: result lines", await p.$$eval("#results .res", e => e.map(x => x.textContent.replace(/−/g, "-").replace(/ [^ ]*$/, ""))), ["a = (1,0021 ± 0,0004)", "b = (-0,26 ± 0,23)"]);
await p.screenshot({ path: "evidence/phase1-step7-norris.png", fullPage: true });

// 2. Identity: equal errors, weighted, scaled errors = NIST; unscaled errors from the separate script.
r = await run(files.nistW);
report.push(["Norris weighted, equal errors, scaled u(B1)", need("W-Norris B1", r.params[0].value, N.b1, 8), need("scaled u(B1) = NIST", r.params[0].uScaled, N.ub1, 6)]);
need("W-Norris B0", r.params[1].value, N.b0, 8); need("scaled u(B0) = NIST", r.params[1].uScaled, N.ub0, 6);
need("W-Norris unscaled u(B1)", r.params[0].uUnscaled, NW.ua, 6); need("W-Norris unscaled u(B0)", r.params[1].uUnscaled, NW.ub, 6);
need("W-Norris chi2", r.chi2, NW.chi2, 8);
need("chi2 = SSR / sigma^2", r.chi2, N.ssr / NW.sigma ** 2, 8);

// 3. Weighted, unequal errors against the separate script.
r = await run(files.hand);
report.push(["Weighted, 7 points, slope", need("hand a", r.params[0].value, W.a, 8), need("hand u(a) scaled", r.params[0].uScaled, W.ua * W.k, 6)]);
need("hand b", r.params[1].value, W.b, 8); need("hand u(b) scaled", r.params[1].uScaled, W.ub * W.k, 6);
need("hand u(a) unscaled", r.params[0].uUnscaled, W.ua, 6); need("hand u(b) unscaled", r.params[1].uUnscaled, W.ub, 6);
need("hand chi2", r.chi2, W.chi2, 8); eq("hand DoF", r.dof, 5);
const text = await p.textContent("#results");
eq("hand: chi2/DoF on screen", /χ²\/DoF = 2,06742/.test(text), true);   // 10.3371038 / 5 = 2.0674208
// By hand: scaled u(a) = 0,05125 * 1,4379 = 0,07369 -> 0,07; a = 1,8659 -> 1,87.
eq("hand: result line (scaled)", (await p.$eval("#results .res", e => e.textContent)).replace(/ [^ ]*$/, ""), "a = (1,87 ± 0,07)");
await p.selectOption("#errm", "unscaled");
// unscaled u(a) = 0,05125 -> 0,05; a = 1,87.
eq("hand: result line (unscaled)", (await p.$eval("#results .res", e => e.textContent)).replace(/ [^ ]*$/, ""), "a = (1,87 ± 0,05)");
await p.screenshot({ path: "evidence/phase1-step7-weighted.png", fullPage: true });

await br.close(); close();
if (bad) process.exit(1);
console.log("digits correct (value, error):"); for (const l of report) console.log("  " + l.join(" | "));
console.log("phase 1 step 7: line fit matches NIST Norris and the separate weighted reference");
