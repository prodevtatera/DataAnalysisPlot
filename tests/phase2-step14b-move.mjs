// Phase 2 step 14b: app/ stands alone. Nothing in app/ may name testbuild/, every file it needs is inside app/,
// and the page, the fonts and the SciPy worker load when the server shows app/ and nothing else.
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { serve } from "./serve.mjs";
import { chromium } from "./tools.mjs";
let bad = 0;
const eq = (name, got, want) => { got = JSON.stringify(got); want = JSON.stringify(want); if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; } };

// 1. no text file in app/ (outside vendor/) names testbuild
const walk = d => readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? (e.name === "vendor" ? [] : walk(d + "/" + e.name)) : [d + "/" + e.name]);
const text = walk("app").filter(f => /\.(html|js|mjs|sh|css|json)$/.test(f));
eq("app text files checked", text.length > 10, true);
eq("no 'testbuild' in app/", text.filter(f => readFileSync(f, "utf8").includes("testbuild")), []);

// 2. the borrowed files are in app/ and Pyodide came from app/setup.sh
for (const f of ["fit-worker.js", "parse.js", "round.js", "vendor/plotly.min.js", "fonts/barlow-latin-400-normal.woff2", "fonts/barlow-latin-700-normal.woff2",
  "fonts/source-sans-3-latin-400-normal.woff2", "fonts/source-sans-3-latin-600-normal.woff2", "vendor/pyodide/pyodide.mjs", "vendor/pyodide/pyodide.asm.wasm",
  "vendor/pyodide/pyodide-lock.json", "vendor/pyodide/python_stdlib.zip"]) eq("app/" + f + " exists and is not empty", existsSync("app/" + f) && statSync("app/" + f).size > 100, true);
eq("old copies are gone from testbuild/", ["fit-worker.js", "parse.js", "round.js", "fonts", "vendor", "setup.sh"].filter(f => existsSync("testbuild/" + f)), []);

// 3. the page works with a server that shows only app/ (a file from testbuild/ would be a 404)
const { base, close } = await serve(["app/"]);
const br = await chromium.launch();
const p = await br.newPage({ viewport: { width: 1200, height: 1300 } });
const external = [], failed = [];
p.on("request", r => { if (!r.url().startsWith(base) && !r.url().startsWith("blob:") && !r.url().startsWith("data:")) external.push(r.url()); });
p.on("response", r => { if (r.status() >= 400) failed.push(r.status() + " " + r.url()); });
await p.goto(base + "app/app.html");
await p.evaluate(() => localStorage.clear());
await p.reload();
await p.click("#example");
await p.waitForFunction(() => !document.getElementById("fit").disabled, null, { timeout: 120000 });
await p.click("#fit"); await p.waitForSelector("#results .res, #results tbody tr");
eq("Plotly drawn", await p.evaluate(() => !!document.getElementById("plot").data), true);
eq("fit gave a slope row", (await p.$$eval("#results tbody tr", t => t.length)) >= 2, true);
eq("fonts loaded from app/fonts", await p.evaluate(async () => { await document.fonts.ready; return ["Barlow", "Source Sans 3"].map(f => document.fonts.check(`16px "${f}"`)); }), [true, true]);
eq("no failed requests", failed, []);
eq("no request leaves the machine", external, []);
await p.screenshot({ path: "evidence/phase2-step14b-move.png", fullPage: true });

// 4. bad case: a missing worker file must not break the page (the page still shows data, the fit says why)
const q = await br.newPage({ viewport: { width: 1200, height: 900 } });
await q.route("**/fit-worker.js", r => r.abort());
await q.goto(base + "app/app.html");
await q.click("#example");
await q.waitForSelector("#plot .point");
eq("plot drawn without worker", await q.$$eval("#plot .point", e => e.length > 0), true);
eq("fit stays off without worker", await q.isDisabled("#fit"), true);
await br.close(); close();
if (bad) process.exit(1);
console.log("PASS phase2 step 14b");
