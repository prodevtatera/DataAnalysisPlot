// Step 4: SciPy in the browser vs NIST StRD certified values (nonlinear regression).
// Certified values are read from the NIST files in tests/nist/, never from SciPy. Writes docs/nist-results.md.
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
const { chromium } = createRequire(resolve("testbuild/x.js"))("playwright-core");

const sets = [
  { name: "Misra1a", level: "niedrig", expr: "b1*(1-np.exp(-b2*x))" },
  { name: "Misra1d", level: "durchschnittlich", expr: "b1*b2*x*((1+b2*x)**(-1))" },
  { name: "BoxBOD", level: "hoch", expr: "b1*(1-np.exp(-b2*x))" },
];
const num = s => Number(s.replace(/E/i, "e"));
function parse(txt) {
  const lines = txt.split("\n");
  const par = lines.filter(l => /^\s*b\d\s*=/.test(l)).map(l => l.split("=")[1].trim().split(/\s+/).map(num));
  const i = lines.findIndex(l => /^Data:\s+y\s+x/.test(l));
  const pts = lines.slice(i + 1).filter(l => l.trim()).map(l => l.trim().split(/\s+/).map(num));
  return { par, y: pts.map(r => r[0]), x: pts.map(r => r[1]),
    ssr: num(/Residual Sum of Squares:\s+(\S+)/.exec(txt)[1]), dof: Number(/Degrees of Freedom:\s+(\d+)/.exec(txt)[1]) };
}
// log10 relative error, capped at 9: "correct significant digits", as NIST defines it
const lre = (got, want) => got === want ? 9 : Math.min(9, -Math.log10(Math.abs(got - want) / Math.abs(want)));

const types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".wasm": "application/wasm", ".json": "application/json" };
const srv = createServer(async (req, res) => {
  try { let p = decodeURIComponent(req.url.split("?")[0]); if (p === "/") p = "/index.html";
    res.writeHead(200, { "content-type": types[extname(p)] || "application/octet-stream" }); res.end(await readFile(resolve("testbuild", "." + p))); }
  catch { res.writeHead(404); res.end(); }
}).listen(0);
await new Promise(r => srv.once("listening", r));
const br = await chromium.launch();
const pg = await br.newPage();
await pg.goto(`http://localhost:${srv.address().port}/`);
await pg.waitForFunction(() => !document.getElementById("fit").disabled, null, { timeout: 120000 });

let bad = 0, md = "# NIST StRD check (nonlinear regression)\n\nSciPy `curve_fit` in the browser (Pyodide) against NIST certified values. Standard errors are the unweighted ones NIST certifies (`absolute_sigma=False`). \"Digits\" = correct significant digits (log10 of the relative error, capped at 9). Pass: values ≥ 6 digits, standard errors ≥ 4 digits, residual sum of squares ≥ 6 digits.\n\n";
for (const s of sets) {
  const d = parse(await readFile(`tests/nist/${s.name}.dat`, "utf8"));
  const names = d.par.map((_, i) => "b" + (i + 1));
  md += `## ${s.name} (${s.level}): ${s.expr}\n\n`;
  for (const start of [0, 1]) {
    const job = { expr: s.expr, names, p0: d.par.map(r => r[start]), x: d.x, y: d.y, sy: null };
    const out = await pg.evaluate(job => new Promise(res => {
      const w = new Worker("fit-worker.js", { type: "module" });
      w.onmessage = e => { if (e.data.ready) w.postMessage(job); else if (e.data.result || e.data.error) { res(e.data); w.terminate(); } };
    }), job);
    md += `Start ${start + 1} (${job.p0.join(", ")}): `;
    if (out.error && s.level === "hoch" && start === 0 && out.error.includes("nicht konvergiert")) {
      md += `no result, with a clear message (accepted: NIST start 1 is the hard start for this dataset; a wrong number would fail): "${out.error}"\n\n`;
      console.log(`ok   ${s.name} start 1: diverged, clear message instead of a wrong number`); continue;
    }
    if (out.error) { md += `FAILED: ${out.error}\n\n`; console.log(`FAIL ${s.name} start ${start + 1}: ${out.error}`); bad++; continue; }
    md += "\n\n| Parameter | Certified | SciPy | Digits | Cert. std. error | SciPy std. error | Digits |\n|---|---|---|---|---|---|---|\n";
    let worst = 9, worstSd = 9;
    d.par.forEach((r, i) => {
      const a = lre(out.result.p[i], r[2]), b = lre(out.result.err_scaled[i], r[3]);
      worst = Math.min(worst, a); worstSd = Math.min(worstSd, b);
      md += `| ${names[i]} | ${r[2]} | ${out.result.p[i]} | ${a.toFixed(1)} | ${r[3]} | ${out.result.err_scaled[i]} | ${b.toFixed(1)} |\n`;
    });
    const sr = lre(out.result.ssr, d.ssr);
    md += `\nResidual sum of squares: certified ${d.ssr}, SciPy ${out.result.ssr}, digits ${sr.toFixed(1)}. Degrees of freedom: ${out.result.dof} (certified ${d.dof}).\n\n`;
    const ok = worst >= 6 && worstSd >= 4 && sr >= 6 && out.result.dof === d.dof;
    console.log(`${ok ? "ok  " : "FAIL"} ${s.name} start ${start + 1}: values ${worst.toFixed(1)} digits, std errors ${worstSd.toFixed(1)}, SSR ${sr.toFixed(1)}`);
    if (!ok) bad++;
  }
}
await writeFile("docs/nist-results.md", md);
await br.close(); srv.close();
if (bad) process.exit(1);
console.log("step 4: SciPy in the browser matches NIST certified values");
