// Step 3: drives the real page; SciPy runs in a Web Worker (needs http, not file://).
// Expected values come from textbook closed-form formulas typed here, never from SciPy.
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
const { chromium } = createRequire(resolve("testbuild/x.js"))("playwright-core");
let bad = 0;
const eq = (name, got, want) => {
  got = JSON.stringify(got); want = JSON.stringify(want);
  if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; }
};
const near = (name, got, want, tol) => {
  if (!(Math.abs(got - want) <= tol * Math.abs(want))) { console.log(`FAIL ${name}: got ${got}, want ${want} (rel tol ${tol})`); bad++; }
};
const num = s => Number(s.replace(/\./g, "").replace(",", "."));

// Weighted straight line, closed form (Taylor, "An Introduction to Error Analysis", ch. 8).
const x = [1, 2, 3, 4, 5], y = [2.1, 4.3, 6.2, 8.4, 9.9], sy = [0.2, 0.2, 0.3, 0.3, 0.4];
const w = sy.map(s => 1 / (s * s)), S = a => a.reduce((p, q) => p + q, 0);
const Sw = S(w), Sx = S(w.map((v, i) => v * x[i])), Sy = S(w.map((v, i) => v * y[i]));
const Sxx = S(w.map((v, i) => v * x[i] ** 2)), Sxy = S(w.map((v, i) => v * x[i] * y[i]));
const D = Sw * Sxx - Sx ** 2;
const a = (Sw * Sxy - Sx * Sy) / D, b = (Sxx * Sy - Sx * Sxy) / D;
const ua = Math.sqrt(Sw / D), ub = Math.sqrt(Sxx / D);
const chi2 = S(w.map((v, i) => v * (y[i] - a * x[i] - b) ** 2)), k = Math.sqrt(chi2 / 3);

// Server: tiny static file server for testbuild/
const types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".wasm": "application/wasm", ".json": "application/json", ".woff2": "font/woff2", ".css": "text/css" };
const srv = createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(req.url.split("?")[0]);
    if (path === "/") path = "/index.html";
    const f = await readFile(resolve("testbuild", "." + path));
    res.writeHead(200, { "content-type": types[extname(path)] || "application/octet-stream" }); res.end(f);
  } catch { res.writeHead(404); res.end(); }
}).listen(0);
await new Promise(r => srv.once("listening", r));
const base = `http://localhost:${srv.address().port}/`;

const br = await chromium.launch();
const p = await br.newPage({ viewport: { width: 1200, height: 1100 } });
const external = [];
p.on("request", r => { if (!r.url().startsWith(base) && !r.url().startsWith("blob:") && !r.url().startsWith("data:")) external.push(r.url()); });
await p.goto(base);
await p.click("#example");
await p.waitForFunction(() => !document.getElementById("fit").disabled, null, { timeout: 120000 });

// 1. Weighted line, scaled errors (default)
await p.click("#fit");
await p.waitForSelector("#fitres .res");
let rows = await p.$$eval("#fitres tbody tr", t => t.map(r => [...r.children].map(c => c.textContent)));
near("slope a", num(rows[0][1]), a, 1e-6);
near("intercept b", num(rows[1][1]), b, 1e-6);
near("slope error scaled", num(rows[0][2]), ua * k, 1e-5);
near("slope error unscaled", num(rows[0][3]), ua, 1e-5);
near("intercept error unscaled", num(rows[1][3]), ub, 1e-5);
const text = await p.textContent("#fitres");
near("chi2/DoF shown", num(/χ²\/DoF = ([\d.,]+)/.exec(text)[1]), chi2 / 3, 1e-5);
eq("method named (scaled)", text.includes("skaliert (absolute_sigma=False)"), true);
// Hand-rounded result line: u(a) is about 0.13 -> two digits (leading digit 1)
const line = await p.$eval("#fitres .res", e => e.textContent);
eq("result line shape", /^a = \(\d+,\d+ ± 0,\d+\) V\/s$/.test(line), true);
console.log("result line:", line);
eq("fit curve drawn", await p.evaluate(() => document.getElementById("plot").data.map(t => t.name)), ["Messwerte", "Anpassung"]);
await p.screenshot({ path: "evidence/step3-fit.png", fullPage: true });

// 2. Switch to unscaled errors: result line uses the other error and says so
await p.selectOption("#errm", "unscaled");
eq("method named (unscaled)", (await p.textContent("#fitres")).includes("unskaliert (absolute_sigma=True)"), true);

// 3. Editing data marks the result as out of date and removes the fit curve
await p.fill("#in", "t / s;U / V;sU / V\n1;2;0,2\n2;4;0,2\n3;6,5;0,3\n4;8;0,3");
eq("stale message", (await p.textContent("#fitres")).includes("veraltet"), true);
eq("stale: fit curve gone", await p.evaluate(() => document.getElementById("plot").data.length), 1);

// 4. Michaelis-Menten on exact data v = 2 x / (0.5 + x): must recover Vmax=2, Km=0.5
const xs = [0.1, 0.25, 0.5, 1, 2, 4];
await p.fill("#in", "S / mM;v / µmol/min\n" + xs.map(s => `${s};${(2 * s / (0.5 + s)).toFixed(10)}`.replace(/\./g, ",")).join("\n"));
await p.selectOption("#model", "mm");
await p.click("#fit");
await p.waitForFunction(() => document.getElementById("fitres").textContent.includes("Vmax"));
rows = await p.$$eval("#fitres tbody tr", t => t.map(r => [...r.children].map(c => c.textContent)));
near("Vmax", num(rows[0][1]), 2, 1e-6);
near("Km", num(rows[1][1]), 0.5, 1e-6);
eq("unweighted method named", (await p.textContent("#fitres")).includes("ungewichtet"), true);

// 5. Bad input: error bars of 0, too few points, and a model that cannot fit
await p.fill("#in", "x;y;sy\n1;2;0\n2;4;0,1\n3;6;0,1");
await p.selectOption("#model", "line");
await p.click("#fit");
eq("zero error message", (await p.textContent("#fitres")).includes("größer als 0"), true);
await p.fill("#in", "x;y\n1;2\n2;4");
await p.click("#fit");
eq("too few points message", (await p.textContent("#fitres")).includes("mindestens drei Messpunkte"), true);
await p.fill("#in", "x;y\n1;1\n2;1\n3;1\n4;1");
await p.selectOption("#model", "mm");
await p.click("#fit");
await p.waitForFunction(() => document.getElementById("fitres").textContent.length > 20 && !document.getElementById("fit").disabled);
const flat = await p.textContent("#fitres");
console.log("flat-data MM result:", flat.slice(0, 160));
eq("flat MM data gives a clear message", (flat.includes("Sättigungskurve") || flat.includes("nicht konvergiert")), true);
eq("no raw Python traceback", /Traceback|File "/.test(flat), false);
await p.screenshot({ path: "evidence/step3-fit-error.png", fullPage: true });
eq("No external requests", external, []);
await br.close(); srv.close();
if (bad) process.exit(1);
console.log("step 3: SciPy fits in the browser match closed-form values; method named; stale and bad input handled");
