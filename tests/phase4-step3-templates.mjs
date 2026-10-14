// Phase 4 step 3 (part B): every template opens exactly the tools its experiment needs, and its numbered steps name the tool (and the button) to use.
// The expected tool lists are written here by hand from the lab steps (what a student presses), the expected numbers are the hand values of tests/reference/
// (the same lines phase2-step15 and phase2-step16 check), not read from the app.
import { createRequire } from "node:module";
import { serve } from "./serve.mjs";
import { chromium, ALL_TOOLS } from "./tools.mjs";
const req = createRequire(import.meta.url);
const { TEMPLATES } = req("../app/templates.js");
let bad = 0;
const eq = (name, got, want) => { got = JSON.stringify(got); want = JSON.stringify(want); if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; } };

// The tools of each experiment, in menu order.
const WANT = { p1: ["stats", "hist", "cum"], p2: ["stats", "wmean"], p3: ["series", "derived"], p4: ["derived"], p5a: [], p5b: ["derived"], p6a: ["wmean", "compare"], p6b: ["wmean", "compare"],
  p7: ["calib"], p8a: ["gof"], p8b: ["logy", "export"], p9: ["stats", "derived"] };
// The tool that holds each button a step can point at (the fit button sits in "Ergebnisse", not in a tool).
const HOLDER = { s_go: "stats", h_go: "hist", g_go: "gof", w_go: "wmean", sr_go: "series", derive: "derived", c_go: "calib", k_go: "compare", logy: "logy", plot_png: "export", fit: null };
// What pressing each step's button must show: [template, button, from-line, hand-calculated lines].
const CHECKS = {
  p1: [["s_go", 0, ["Mittelwert x̄ = (10,05 ± 0,05) mm", "Standardabweichung s (Teiler n−1) = 0,263 mm", "Standardfehler des Mittelwerts s/√n = 0,0481 mm"]]],
  p2: [["s_go", 0, ["Mittelwert x̄ = (20,000 ± 0,007) mm", "Standardabweichung s (Teiler n−1) = 0,0158 mm", "Standardfehler des Mittelwerts s/√n = 0,00707 mm", "Mittelwert x̄ mit Gerätefehler = (20,00 ± 0,05) mm"]], ["w_go", -1, ["Gewichteter Mittelwert = (10,02 ± 0,09) cm³"]]],
  p3: [["sr_go", 0, ["a (ΔL auf) = (0,02529 ± 0,00029) mm/N", "b (ΔL auf) = (0,007 ± 0,011) mm", "a (ΔL ab) = (0,02502 ± 0,00020) mm/N", "b (ΔL ab) = (0,052 ± 0,006) mm"]], ["fit", 4, ["a = (0,02529 ± 0,00029) mm/N", "b = (0,007 ± 0,011) mm"]], ["derive", -1, ["E = (201 ± 8) GPa"]]],
  p4: [["fit", 0, ["a = (14,82 ± 0,10) mm/mm⁻¹", "b = (0,02 ± 0,09) mm"]], ["derive", -1, ["σ = (72,6 ± 0,5) mN/m"]]],
  p5a: [["fit", 0, ["a = (66,6 ± 0,4) °/dm·g·mL⁻¹", "b = (-0,02 ± 0,06) °"]]],
  p5b: [["fit", 0, ["a = (0,5886 ± 0,0007) mm²/1", "b = (0,0034 ± 0,0026) mm²"]], ["derive", -1, ["R = (0,9989 ± 0,0012) m"]]],
  p6a: [["w_go", 0, ["Gewichteter Mittelwert = (219,4 ± 1,0) Ω"]], ["k_go", 1, ["Differenz Messwert − Vergleichswert = (-0,6 ± 2,4) Ω", "Abweichung in kombinierten Unsicherheiten = 0,248"]]],
  p6b: [["w_go", 0, ["Gewichteter Mittelwert = (632,1 ± 0,9) nm"]], ["k_go", 1, ["Differenz Messwert − Vergleichswert = (-0,7 ± 0,9) nm", "Abweichung in kombinierten Unsicherheiten = 0,778"]]],
  p7: [["fit", 0, ["a = (0,001560 ± 0,000005) 1/%", "b = (1,33301 ± 0,00007) 1"]], ["c_go", 2, ["x₀ (y₀ = 1,3505) = (11,21 ± 0,19) %", "x₀ (y₀ = 1,36) = (17,30 ± 0,20) %", "x₀ (y₀ = 1,378) = (28,84 ± 0,21) %"]]],
  p8a: [["g_go", 0, ["Mittelwert x̄ (= λ der Poisson-Verteilung) = (9,5 ± 0,5) 1", "Poisson: χ² = 1,43 bei 3 Freiheitsgraden, p = 0,698", "Gauß: χ² = 0,775 bei 2 Freiheitsgraden, p = 0,679"]]],
  p8b: [],
  p9: [["s_go", 0, ["Mittelwert x̄ = (9,808 ± 0,019) m/s²"]], ["fit", 4, ["a = (4,017 ± 0,023) s²/m", "b = (0,004 ± 0,011) s²"]], ["derive", -1, ["g = (9,83 ± 0,06) m/s²"]]],
};

// ---- Pure part: the lists.
eq("the 12 templates", TEMPLATES.map(t => t.id), Object.keys(WANT));
for (const t of TEMPLATES) {
  eq(`${t.id} lists its tools`, t.tools, WANT[t.id]);
  eq(`${t.id} builds a project that stores exactly that list`, t.build().settings.tools, WANT[t.id]);
  eq(`${t.id} two builds do not share one list`, t.build().settings.tools !== t.build().settings.tools, true);
  eq(`${t.id} tools are known ids in menu order`, t.tools.every(x => ALL_TOOLS.includes(x)) && JSON.stringify(ALL_TOOLS.filter(x => t.tools.includes(x))) === JSON.stringify(t.tools), true);
  const need = [...new Set(t.steps.filter(s => s.go).map(s => HOLDER[s.go]).filter(Boolean))];
  eq(`${t.id} every tool a step points at is in the list`, need.filter(x => !t.tools.includes(x)), []);
}

// ---- Real page.
const { base, close } = await serve();
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1200, height: 800 } })).newPage();
const errors = [];
p.on("pageerror", e => errors.push(String(e)));
await p.goto(base + "app/index.html");
await p.waitForFunction(() => !document.getElementById("fit").disabled, null, { timeout: 120000 });
const ready = () => p.waitForFunction(() => !document.getElementById("fit").disabled, null, { timeout: 120000 });
const load = async id => { await p.selectOption("#tpl_sel", id); await p.click("#tpl_load"); await ready(); };
const panels = () => p.evaluate(() => [...document.querySelectorAll("[data-tool-panel]")].filter(e => e.checkVisibility()).map(e => e.dataset.toolPanel));
const lines = () => p.$$eval("#results .res", e => e.map(x => x.textContent));
const toolName = id => p.textContent(`[data-tool="${id}"] > span:first-child`);
const steps = () => p.$$eval("#tpl_info li", e => e.map(li => ({ text: li.firstChild.textContent, go: li.querySelector("a.go")?.dataset.go ?? null })));
const holder = go => p.evaluate(g => document.getElementById(g).closest("[data-tool-panel]")?.dataset.toolPanel ?? null, go);

for (const t of TEMPLATES) {
  await load(t.id);
  eq(`${t.id}: the open tools are exactly the listed ones`, await panels(), WANT[t.id]);
  const st = await steps();
  eq(`${t.id}: the step count`, st.length, t.steps.length);
  // Every step that points at a button names the tool that holds it (or "Ergebnisse" for the fit button); the tool is open.
  for (const s of st.filter(x => x.go)) {
    const h = await holder(s.go);
    eq(`${t.id}: ${s.go} sits in the tool the page says (${h})`, h, HOLDER[s.go]);
    const name = h ? await toolName(h) : "Ergebnisse";
    eq(`${t.id}: the step names „${name}“`, s.text.includes(`„${name}“`), true);
    if (h) eq(`${t.id}: ${h} is open`, (await panels()).includes(h), true);
  }
  // Every listed tool is named by some step (a tool nobody mentions should not be open).
  const all = st.map(s => s.text).join(" ");
  for (const id of WANT[t.id]) eq(`${t.id}: some step names the tool „${await toolName(id)}“`, all.includes(`„${await toolName(id)}“`), true);
  // The steps still give the hand-calculated results.
  for (const [go, from, want] of CHECKS[t.id]) {
    await p.click("#" + go); await ready();
    const l = await lines();
    eq(`${t.id}: ${go} shows the hand values`, from < 0 ? l.slice(from) : l.slice(from, from + want.length), want);
  }
  eq(`${t.id}: pressing buttons does not close or open other tools`, await panels(), WANT[t.id]);
}
// P1 plots, P8b semi-log and the export buttons.
await load("p1"); await p.click("#h_go"); await ready();
eq("P1 histogram and cumulative plot both drawn", await p.$$eval("#histplot.js-plotly-plot, #cumplot.js-plotly-plot", e => e.length), 2);
eq("P1 counts (hand count of the 30 readings)", await p.evaluate(() => proj.results.find(r => r.kind === "hist").counts), [2, 5, 9, 8, 4, 2]);
await load("p8b");
eq("P8b semi-log is on and the save buttons are in the open tool", await p.evaluate(() => [document.getElementById("logy").checked, document.getElementById("plot").layout.yaxis.type, document.querySelector('[data-tool-panel="export"]').checkVisibility(), document.getElementById("plot_png").checkVisibility()]), [true, "log", true, true]);
await p.screenshot({ path: "evidence/phase4-step3-p8b.png", fullPage: true });

// ---- Own numbers pasted into a template keep its tools open (and the template box).
await load("p2");
const pasted = await p.evaluate(() => {
  const el = document.querySelector('#table input[data-r="0"][data-c="1"]'), dt = new DataTransfer(); dt.setData("text", "20,10;10,0\n20,20;10,4\n20,30;10,2");
  const ev = new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }); el.dispatchEvent(ev); return ev.defaultPrevented;
});
eq("the paste was taken", pasted, true);
eq("p2 pasted: column d has the new numbers", await p.evaluate(() => proj.columns[1].values.slice(0, 3)), [20.1, 20.2, 20.3]);
eq("p2 pasted: tools unchanged", await panels(), ["stats", "wmean"]);
eq("p2 pasted: template box stays", await p.evaluate(() => [proj.template, !document.getElementById("tpl_info").hidden]), ["p2", true]);
await p.click("#s_go"); await ready();
eq("p2 pasted: mean of d = (20,1 + 20,2 + 20,3 + 20,01 + 19,99) / 5 = 20,12 (hand)", (await lines())[0].startsWith("Mittelwert x̄ = (20,12 ± "), true);
// Closing one of its tools and reloading keeps the choice (it is saved with the project like any tool).
await p.click('[data-close="wmean"]');
await p.reload(); await ready();
eq("after reload the same tools", await panels(), ["stats"]);
await p.screenshot({ path: "evidence/phase4-step3-p2.png", fullPage: true });

// ---- English: the steps name the English tool buttons.
await p.click("#lang_en"); await load("p6a");
const en = await steps();
eq("English P6a: the open tools", await panels(), ["wmean", "compare"]);
for (const s of en.filter(x => x.go)) {
  const h = await holder(s.go);
  const name = h ? await toolName(h) : "Results";
  eq(`English P6a: ${s.go} step names “${name}”`, s.text.includes(`“${name}”`), true);
}
await load("p3");
for (const s of (await steps()).filter(x => x.go)) {
  const h = await holder(s.go); const name = h ? await toolName(h) : "Results";
  eq(`English P3: ${s.go} step names “${name}”`, s.text.includes(`“${name}”`), true);
}
eq("English P3: Fit step names the Fit button under Results", (await steps())[1].text.startsWith("Under “Results” press “Fit”"), true);
await p.click("#lang_de");
eq("page errors", errors, []);
await b.close(); close();
console.log(bad ? `${bad} FAILED` : "all checks passed");
process.exit(bad ? 1 : 0);
