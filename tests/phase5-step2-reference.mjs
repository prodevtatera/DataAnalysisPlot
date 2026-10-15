// Phase 5 step 2: curve-fit worker against the independent reference tests/reference/curves.py (own solver, exact fractions, no SciPy) and its refusals.
// Exponential and sine have no NIST set, so this is their check (see docs/phase5-report.md). Also: the free formula must equal the built-in model it spells out.
import { execFileSync } from "node:child_process";
import { serve } from "./serve.mjs";
import { chromium } from "./tools.mjs";

const cases = JSON.parse(execFileSync("python3", ["-I", "tests/reference/curves.py"], { encoding: "utf8" }));
let bad = 0;
const digits = (got, want) => got === want ? 9 : Math.min(9, -Math.log10(Math.abs(got - want) / Math.abs(want)));
const eq = (name, got, want) => { if (JSON.stringify(got) !== JSON.stringify(want)) { console.log(`FAIL ${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`); bad++; } else console.log(`ok   ${name}`); };

const { base, close } = await serve(["app/"]);
const br = await chromium.launch();
const pg = await br.newPage();
await pg.goto(base + "app/index.html");
const ask = job => pg.evaluate(job => new Promise(res => {
  const w = new Worker("fit-worker.js", { type: "module" });
  w.onmessage = e => { if (e.data.ready) w.postMessage(job); else if (e.data.result || e.data.error) { res(e.data); w.terminate(); } };
}), job);

for (const c of cases) {
  const out = await ask({ task: "curve", model: c.model, offset: c.offset, degree: c.degree, x: c.x, y: c.y, sy: c.sy });
  if (out.error) { console.log(`FAIL ${c.name}: ${out.error}`); bad++; continue; }
  const r = out.result, weighted = !!c.sy;
  const dp = Math.min(...c.p.map((v, i) => digits(r.p[i], v))), ds = Math.min(...c.err_scaled.map((v, i) => digits(r.err_scaled[i], v)));
  const du = weighted ? Math.min(...c.err_unscaled.map((v, i) => digits(r.err_unscaled[i], v))) : 9, dq = digits(weighted ? r.chi2 : r.ssr, weighted ? c.chi2 : c.ssr);
  const ok = dp >= 7 && ds >= 6 && du >= 6 && dq >= 7 && r.dof === c.dof && r.curve.x.length === 500 && r.curve.y.every(Number.isFinite);
  console.log(`${ok ? "ok  " : "FAIL"} ${c.name}: values ${dp.toFixed(1)} digits, scaled errors ${ds.toFixed(1)}, unscaled ${weighted ? du.toFixed(1) : "-"}, ${weighted ? "chi2" : "SSR"} ${dq.toFixed(1)}`);
  if (!ok) bad++;
}

// A free formula that spells out a built-in model gives the same numbers as the model.
{
  const c = cases[1], viaModel = (await ask({ task: "curve", model: "exp", offset: true, x: c.x, y: c.y, sy: c.sy })).result;
  const viaFree = (await ask({ task: "curve", model: "free", expr: "a*exp(-x/tau)+c", p0: { a: 7, tau: 3, c: 1 }, x: c.x, y: c.y, sy: c.sy })).result;
  eq("free formula names found in order of appearance", viaFree.names, ["a", "tau", "c"]);
  eq("free formula = exponential model (values, errors, chi2)", Math.min(...viaModel.p.map((v, i) => digits(viaFree.p[i], v)), ...viaModel.err_scaled.map((v, i) => digits(viaFree.err_scaled[i], v)), digits(viaFree.chi2, viaModel.chi2)) >= 8, true);
  const comma = (await ask({ task: "curve", model: "free", expr: "a*exp(-x/tau)+0,0+c", p0: { a: 7, tau: 3, c: 1 }, x: c.x, y: c.y, sy: c.sy })).result;
  eq("decimal comma in a formula", digits(comma.p[1], viaFree.p[1]) >= 8, true);
}

// Refusals: each one is a key the page turns into a message in the chosen language.
const D = { x: [1, 2, 3, 4, 5, 6], y: [2.1, 3.9, 6.2, 7.8, 10.1, 12.2], sy: null };
const err = async job => (await ask({ task: "curve", x: D.x, y: D.y, sy: D.sy, ...job })).error;
eq("syntax error", await err({ model: "free", expr: "a*(x+" }), "cf_syntax");
eq("no x in formula", await err({ model: "free", expr: "a+b" }), "cf_nox");
eq("no parameter in formula", await err({ model: "free", expr: "2*x+1" }), "cf_nopar");
eq("unknown function", await err({ model: "free", expr: "a*foo(x)" }), "cf_func:foo");
eq("function with two arguments", await err({ model: "free", expr: "a*sin(x, 2)" }), "cf_func:sin");
eq("nothing but arithmetic runs (import)", await err({ model: "free", expr: "a*__import__('os').getcwd()" }), "cf_func:?");
eq("nothing but arithmetic runs (attribute)", await err({ model: "free", expr: "a*x.real" }), "cf_syntax");
eq("too many parameters", await err({ model: "free", expr: "a+b*x+c*x^2+d*x^3+e*x^4+f*x^5+g*x^6+h*x^7+i*x^8+j*x^9+k*x^10" }), "cf_manypar:10");
eq("more parameters than points", await err({ model: "free", expr: "a+b*x+c*x^2+d*x^3+e*x^4+f*x^5+g*x^6", p0: {} }), "cf_dof:7:6");
eq("polynomial of degree 5 needs 7 points", await err({ model: "poly", degree: 5 }), "cf_dof:6:6");
eq("start values give no numbers", await err({ model: "free", expr: "a*ln(x-10)", p0: { a: 1 } }), "cf_p0");
eq("huge power does not hang", await err({ model: "free", expr: "a*9^9^9*x", p0: { a: 1 } }) !== undefined, true);
eq("sine needs 4 different x", await err({ model: "sine", offset: false, x: [1, 1, 1, 2, 2], y: [1, 2, 3, 4, 5] }), "cf_sinefew");

await br.close(); close();
if (bad) process.exit(1);
console.log("phase 5 step 2: curve fits match the independent reference");
