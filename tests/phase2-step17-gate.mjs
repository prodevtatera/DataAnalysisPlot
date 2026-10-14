// Phase 2 gate: every experiment P1 to P9 (twelve templates) is run from "Vorlage laden" to its last result in the real page, with the
// user actions counted and the machine time measured. The expected result texts are the hand-calculated numbers that tests/phase2-step15-*
// and -step16-* check digit by digit against tests/reference/templates.py and templates2.py (exact fractions, no SciPy, no app code).
// An "action" = one click on a button or list (focusing is not counted). Entering the student's own numbers is not counted, in the app or in Excel.
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { serve } from "./serve.mjs";
const { chromium } = createRequire(resolve("testbuild/x.js"))("playwright-core");
let bad = 0;
const eq = (name, got, want) => { got = JSON.stringify(got); want = JSON.stringify(want); if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; } };

// id, experiment, steps pressed after loading (button ids), texts that must be in the results
const RUNS = [
  ["p1", "P1 Fehlerverteilung", ["s_go", "h_go"], ["Mittelwert x̄ = (10,05 ± 0,05) mm", "x bei 16 % = 9,812 mm, x bei 84 % = 10,36 mm"]],
  ["p2", "P2 Volumenmessung", ["s_go", "w_go"], ["Mittelwert x̄ mit Gerätefehler = (20,00 ± 0,05) mm", "Gewichteter Mittelwert = (10,02 ± 0,09) cm³"]],
  ["p3", "P3 Elastizität", ["sr_go", "fit", "derive"], ["a (ΔL auf) = (0,02529 ± 0,00029) mm/N", "0,7596 kombinierte Unsicherheiten", "E = (201 ± 8) GPa"]],
  ["p4", "P4 Oberflächenspannung", ["fit", "derive"], ["a = (14,82 ± 0,10) mm/mm⁻¹", "σ = (72,6 ± 0,5) mN/m"]],
  ["p5a", "P5 Polarimetrie", ["fit"], ["a = (66,6 ± 0,4) °/dm·g·mL⁻¹"]],
  ["p5b", "P5 Newtonsche Ringe", ["fit", "derive"], ["a = (0,5886 ± 0,0007) mm²/1", "R = (0,9989 ± 0,0012) m"]],
  ["p6a", "P6 Wheatstone", ["w_go", "k_go"], ["Gewichteter Mittelwert = (219,4 ± 1,0) Ω", "Abweichung in kombinierten Unsicherheiten = 0,248"]],
  ["p6b", "P6 Gitter", ["w_go", "k_go"], ["Gewichteter Mittelwert = (632,1 ± 0,9) nm", "Abweichung in kombinierten Unsicherheiten = 0,778"]],
  ["p7", "P7 Refraktometer", ["fit", "c_go"], ["a = (0,001560 ± 0,000005) 1/%", "x₀ (y₀ = 1,3505) = (11,21 ± 0,19) %", "x₀ (y₀ = 1,378) = (28,84 ± 0,21) %"]],
  ["p8a", "P8 Zählraten", ["g_go"], ["Poisson: χ² = 1,43 bei 3 Freiheitsgraden, p = 0,698", "Gauß: χ² = 0,775 bei 2 Freiheitsgraden, p = 0,679"]],
  ["p8b", "P8 Zerfallskurve", [], []],   // semi-log plot with error bars is set by the template; checked below
  ["p9", "P9 Pendel", ["s_go", "fit", "derive"], ["Mittelwert x̄ mit 95 %-Vertrauensintervall = (9,81 ± 0,05) m/s²", "a = (4,017 ± 0,023) s²/m", "g = (9,83 ± 0,06) m/s²"]],
];

const { base, close } = await serve();
const br = await chromium.launch();
const p = await (await br.newContext({ viewport: { width: 1200, height: 2600 } })).newPage();
const errors = [];
p.on("pageerror", e => errors.push(String(e)));
await p.goto(base + "app/index.html");
await p.evaluate(() => localStorage.clear());
const t0 = Date.now();
await p.reload();
await p.waitForFunction(() => document.getElementById("fitstate").textContent === "Bereit.", null, { timeout: 120000 });
const loadMs = Date.now() - t0;
const ready = () => p.waitForFunction(() => !document.getElementById("fit").disabled, null, { timeout: 120000 });

// Bad input: "Vorlage laden" with nothing chosen says so and changes nothing.
await p.click("#tpl_load");
eq("nothing chosen", await p.textContent("#tplmsg"), "Bitte zuerst einen Versuch in der Liste wählen.");

const rows = [];
for (const [id, name, steps, want] of RUNS) {
  const t = Date.now();
  let actions = 0;
  await p.selectOption("#tpl_sel", id); actions++;
  await p.click("#tpl_load"); actions++; await ready();
  for (const s of steps) { await p.click("#" + s); actions++; await ready(); }
  const ms = Date.now() - t;
  const text = await p.textContent("#results");
  for (const w of want) if (!text.includes(w)) { console.log(`FAIL ${id}: results lack "${w}"`); bad++; }
  eq(`${id} no stale result`, await p.$$eval(".stalemsg", e => e.length), 0);
  eq(`${id} no message`, await p.evaluate(() => ["msg", "fmsg", "plotmsg"].filter(i => { const e = document.getElementById(i); return e && !e.hidden && e.textContent; })), []);
  if (id === "p8b") {
    const pl = await p.evaluate(() => ({ type: $("plot").layout.yaxis.type, n: $("plot").data[0].y.length }));
    eq("p8b semi-log, 8 points, 8 error bars", [pl.type, pl.n, await p.$$eval("#plot .errorbar", e => e.length)], ["log", 8, 8]);
  }
  rows.push({ id, name, actions, ms });
  if (ms > 15000) { console.log(`FAIL ${id}: ${ms} ms`); bad++; }
  if (id === "p9") await p.screenshot({ path: "evidence/phase2-step17-gate.png", fullPage: true });
}
eq("action counts", rows.map(r => r.actions), [4, 4, 5, 4, 3, 4, 4, 4, 4, 3, 2, 5]);
console.log(`Python ready once per visit: ${loadMs} ms (local server). Per experiment, template load to last result:`);
for (const r of rows) console.log(`  ${r.name.padEnd(24)} ${String(r.actions).padStart(2)} actions  ${String(r.ms).padStart(5)} ms`);
eq("no page errors", errors, []);
await br.close(); close();
console.log(bad ? `${bad} FAILED` : "gate: all twelve templates (P1 to P9) reach their hand-calculated results");
process.exit(bad ? 1 : 0);
