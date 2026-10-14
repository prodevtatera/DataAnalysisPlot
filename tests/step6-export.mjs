// Step 6: export the figure as PNG and SVG and check the files themselves.
import { createRequire } from "node:module";
import { serve } from "./serve.mjs";
import { readFile, writeFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
const { chromium } = createRequire(resolve("testbuild/x.js"))("playwright-core");
let bad = 0;
const eq = (name, got, want) => { got = JSON.stringify(got); want = JSON.stringify(want); if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; } };
const { base, close: closeSrv } = await serve(["app/", "testbuild/"]);
const br = await chromium.launch();
const ctx = await br.newContext({ acceptDownloads: true, viewport: { width: 1200, height: 1100 } });
const p = await ctx.newPage();
await p.goto(base + "testbuild/index.html");
eq("export buttons off without data", await p.$$eval("#png:disabled, #svg:disabled", e => e.length), 2);
await p.waitForFunction(() => !document.getElementById("fit").disabled, null, { timeout: 120000 });
await p.click("#example"); await p.click("#fit"); await p.waitForSelector("#fitres .res");
eq("export buttons on with data", await p.$$eval("#png:disabled, #svg:disabled", e => e.length), 0);

const grab = async sel => { const [d] = await Promise.all([p.waitForEvent("download"), p.click(sel)]); const f = `evidence/step6-export.${d.suggestedFilename().split(".")[1]}`; await d.saveAs(f); eq("file name", d.suggestedFilename().startsWith("diagramm."), true); return f; };
const png = await readFile(await grab("#png"));
eq("PNG signature", [...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
eq("PNG size 2400 x 1400", [png.readUInt32BE(16), png.readUInt32BE(20)], [2400, 1400]);
const svg = (await readFile(await grab("#svg"))).toString("utf8");
eq("SVG starts with <svg", svg.trimStart().startsWith("<svg"), true);
for (const t of ["t / s", "U / V", "Messwerte", "Anpassung"]) eq(`SVG text "${t}" is real text`, svg.includes(`>${t}</text>`) || svg.includes(`>${t}<`), true);
eq("SVG has no embedded raster image", /<image\b/.test(svg), false);
eq("SVG has error bars and fit line as paths", (svg.match(/<path\b/g) || []).length > 10, true);
// Look at the SVG the way a report would: open the saved file alone in the browser.
const q = await ctx.newPage(); await q.setViewportSize({ width: 1200, height: 700 });
await q.goto("file://" + resolve("evidence/step6-export.svg")); await q.screenshot({ path: "evidence/step6-export-svg-view.png" });
await br.close(); closeSrv();
if (bad) process.exit(1);
console.log(`step 6: PNG ${png.length} bytes (2400x1400), SVG ${svg.length} bytes with real text`);
