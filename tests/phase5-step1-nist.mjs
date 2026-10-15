// Phase 5 step 1: the curve-fit task of the worker against NIST StRD certified values. Certified values are read from tests/nist/*.dat, never from SciPy.
//  - free formula: typed the way a student types it (decimal comma, ^, pi, parameter names found by the worker), on nonlinear NIST sets
//  - Gauss model: Eckerle4 is a Gaussian; A = b1/b2, mu = b3, sigma = b2, so mu and sigma carry the certified std errors of b3 and b2
//  - polynomial model: Pontius (quadratic) and Wampler 1, 4, 5 (degree 5)
// NIST has no single-exponential and no single-sine problem; those two are checked in phase5-step2-reference.mjs against an independent solver.
// Writes docs/nist-curve-results.md.
import { readFile, writeFile } from "node:fs/promises";
import { serve } from "./serve.mjs";
import { chromium } from "./tools.mjs";

const num = s => Number(s.replace(/[DE]/i, "e"));
const lre = (got, want) => got === want ? 9 : Math.min(9, -Math.log10(Math.abs(got - want) / Math.abs(want)));
function parseNls(txt) {
  const L = txt.split("\n");
  const par = L.filter(l => /^\s*b\d\s*=/.test(l)).map(l => l.split("=")[1].trim().split(/\s+/).map(num));
  const pts = L.slice(L.findIndex(l => /^Data:\s+y\s+x/.test(l)) + 1).filter(l => l.trim()).map(l => l.trim().split(/\s+/).map(num));
  return { par, y: pts.map(r => r[0]), x: pts.map(r => r[1]), ssr: num(/Residual Sum of Squares:\s+(\S+)/.exec(txt)[1]), dof: Number(/Degrees of Freedom:\s+(\d+)/.exec(txt)[1]) };
}
function parseLls(txt) {
  const L = txt.split("\n");
  const par = L.filter(l => /^\s*B\d\s+\S+\s+\S+/.test(l)).map(l => l.trim().split(/\s+/).slice(1, 3).map(num));
  const pts = L.slice(L.findIndex(l => /^Data:\s+y\s+x/.test(l)) + 1).filter(l => l.trim()).map(l => l.trim().split(/\s+/).map(num));
  const i = L.findIndex(l => /Residual\s*$/.test(l)), sd = num(/Standard Deviation\s+(\S+)/.exec(L[i + 1])[1]);
  return { par, y: pts.map(r => r[0]), x: pts.map(r => r[1]), sd, dof: pts.length - par.length };
}

const { base, close } = await serve(["app/"]);
const br = await chromium.launch();
const pg = await br.newPage();
await pg.goto(base + "app/index.html");
const ask = job => pg.evaluate(job => new Promise(res => {
  const w = new Worker("fit-worker.js", { type: "module" });
  w.onmessage = e => { if (e.data.ready) w.postMessage(job); else if (e.data.result || e.data.error) { res(e.data); w.terminate(); } };
}), job);

let bad = 0, md = "# NIST StRD check of the curve-fit tool\n\nThe worker's curve task (SciPy in the browser) against NIST certified values. \"Digits\" = correct significant digits (log10 of the relative error, capped at 9). Pass: values ≥ 6 digits, standard errors ≥ 4 digits, residual sum of squares ≥ 6 digits (a start that diverges with a clear message instead of a wrong number is accepted only for the sets NIST rates hard).\n\n";
const row = (n, cert, sd, got, se) => { const a = lre(got, cert), b = sd === 0 ? 9 : lre(se, sd); return { a, b, line: `| ${n} | ${cert} | ${got} | ${a.toFixed(1)} | ${sd} | ${se} | ${b.toFixed(1)} |\n` }; };
const HEAD = "\n\n| Parameter | Certified | App | Digits | Cert. std. error | App std. error | Digits |\n|---|---|---|---|---|---|---|\n";

// ---- free formula on nonlinear sets
const free = [
  { name: "Misra1a", level: "niedrig", expr: "b1*(1-exp(-b2*x))" },
  { name: "Misra1d", level: "durchschnittlich", expr: "b1*b2*x*((1+b2*x)^(-1))" },
  { name: "BoxBOD", level: "hoch", expr: "b1*(1-exp(-b2*x))" },
  { name: "Eckerle4", level: "hoch", expr: "(b1/b2)*exp(-0,5*((x-b3)/b2)^2)" },
  { name: "Lanczos3", level: "niedrig", expr: "b1*exp(-b2*x) + b3*exp(-b4*x) + b5*exp(-b6*x)" },
  { name: "Gauss1", level: "niedrig", expr: "b1*exp(-b2*x) + b3*exp(-(x-b4)^2/b5^2) + b6*exp(-(x-b7)^2/b8^2)" },
  { name: "ENSO", level: "durchschnittlich", expr: "b1 + b2*cos(2*pi*x/12) + b3*sin(2*pi*x/12) + b5*cos(2*pi*x/b4) + b6*sin(2*pi*x/b4) + b8*cos(2*pi*x/b7) + b9*sin(2*pi*x/b7)" },
];
md += "## Free formula (nonlinear)\n\n";
for (const s of free) {
  const d = parseNls(await readFile(`tests/nist/${s.name}.dat`, "utf8"));
  md += `### ${s.name} (${s.level}): \`${s.expr}\`\n\n`;
  for (const start of [0, 1]) {
    const p0 = Object.fromEntries(d.par.map((r, i) => ["b" + (i + 1), r[start]]));
    const out = await ask({ task: "curve", model: "free", expr: s.expr, p0, x: d.x, y: d.y, sy: null });
    md += `Start ${start + 1}: `;
    if (out.error) {
      const soft = s.level === "hoch" && start === 0 && out.error === "cf_noconv";
      md += soft ? `no result, with a clear message (\`${out.error}\`); accepted: NIST rates this set hard from start 1.\n\n` : `FAILED: ${out.error}\n\n`;
      console.log(`${soft ? "ok  " : "FAIL"} ${s.name} start ${start + 1}: ${out.error}`); if (!soft) bad++; continue;
    }
    const r = out.result, byName = Object.fromEntries(r.names.map((n, i) => [n, i]));
    let worst = 9, worstSd = 9; md += HEAD;
    d.par.forEach((q, i) => {
      const k = byName["b" + (i + 1)], w = row("b" + (i + 1), q[2], q[3], r.p[k], r.err_scaled[k]);
      worst = Math.min(worst, w.a); worstSd = Math.min(worstSd, w.b); md += w.line;
    });
    const sr = lre(r.ssr, d.ssr);
    md += `\nResidual sum of squares: certified ${d.ssr}, app ${r.ssr}, digits ${sr.toFixed(1)}. Degrees of freedom: ${r.dof} (certified ${d.dof}).\n\n`;
    const ok = worst >= 6 && worstSd >= 4 && sr >= 6 && r.dof === d.dof;
    console.log(`${ok ? "ok  " : "FAIL"} ${s.name} start ${start + 1}: values ${worst.toFixed(1)} digits, std errors ${worstSd.toFixed(1)}, SSR ${sr.toFixed(1)}`);
    if (!ok) bad++;
  }
}

// ---- Gauss model on Eckerle4 (A = b1/b2, mu = b3, sigma = b2)
{
  const d = parseNls(await readFile("tests/nist/Eckerle4.dat", "utf8")), [b1, b2, b3] = d.par;
  md += "## Gauss model on Eckerle4\n\nThe model is `A·exp(−(x−μ)²/(2σ²))`. Eckerle4 is `(b1/b2)·exp(−½((x−b3)/b2)²)`, so A = b1/b2, μ = b3, σ = b2. μ and σ carry the certified standard errors of b3 and b2 (A would need the covariance, so only its value is checked). No start values are given: the tool finds its own.\n\n";
  const out = await ask({ task: "curve", model: "gauss", offset: false, x: d.x, y: d.y, sy: null });
  if (out.error) { console.log("FAIL Gauss model: " + out.error); bad++; md += `FAILED: ${out.error}\n\n`; }
  else {
    const r = out.result; md += HEAD.slice(2);
    const rows = [row("A", b1[2] / b2[2], 0, r.p[0], 0), row("mu", b3[2], b3[3], r.p[1], r.err_scaled[1]), row("sigma", b2[2], b2[3], r.p[2], r.err_scaled[2])];
    rows.forEach(w => md += w.line);
    const sr = lre(r.ssr, d.ssr), worst = Math.min(...rows.map(w => w.a)), worstSd = Math.min(rows[1].b, rows[2].b);
    md += `\nResidual sum of squares: certified ${d.ssr}, app ${r.ssr}, digits ${sr.toFixed(1)}. Degrees of freedom: ${r.dof} (certified ${d.dof}).\n\n`;
    const ok = worst >= 6 && worstSd >= 4 && sr >= 6 && r.dof === d.dof;
    console.log(`${ok ? "ok  " : "FAIL"} Gauss model on Eckerle4: values ${worst.toFixed(1)} digits, std errors ${worstSd.toFixed(1)}, SSR ${sr.toFixed(1)}`);
    if (!ok) bad++;
  }
}

// ---- polynomial model
md += "## Polynomial model (linear least squares)\n\n";
for (const [name, deg] of [["Pontius", 2], ["Wampler1", 5], ["Wampler4", 5], ["Wampler5", 5]]) {
  const d = parseLls(await readFile(`tests/nist/${name}.dat`, "utf8"));
  const out = await ask({ task: "curve", model: "poly", degree: deg, x: d.x, y: d.y, sy: null });
  md += `### ${name} (degree ${deg})\n\n`;
  if (out.error) { console.log(`FAIL ${name}: ${out.error}`); bad++; md += `FAILED: ${out.error}\n\n`; continue; }
  const r = out.result; let worst = 9, worstSd = 9; md += HEAD.slice(2);
  d.par.forEach((q, i) => { const w = row("B" + i, q[0], q[1], r.p[i], r.err_scaled[i]); worst = Math.min(worst, w.a); worstSd = Math.min(worstSd, w.b); md += w.line; });
  const sd = Math.sqrt(r.ssr / r.dof), sdOk = d.sd === 0 ? sd < 1e-6 : lre(sd, d.sd) >= 6;
  md += `\nResidual standard deviation: certified ${d.sd}, app ${sd}. Degrees of freedom: ${r.dof} (certified ${d.dof}).\n\n`;
  const ok = worst >= 6 && worstSd >= 4 && sdOk && r.dof === d.dof;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: values ${worst.toFixed(1)} digits, std errors ${worstSd.toFixed(1)}, residual sd ${sdOk ? "ok" : "off"}`);
  if (!ok) bad++;
}

await writeFile("docs/nist-curve-results.md", md);
await br.close(); close();
if (bad) process.exit(1);
console.log("phase 5 step 1: the curve-fit worker matches NIST certified values");
