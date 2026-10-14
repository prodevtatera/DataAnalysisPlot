// Phase 4 step 2 (part A): the calmer workbench. A first visit shows only the table, the plot, the results and the "Werkzeuge" menu; every other tool
// opens on demand, one panel per tool, and the open tools are saved with the project (but are not an undo step).
// Expected values are hand values: the P3 line through the loading data has E = (201 ± 8) GPa (see phase3-step2-firstminute.mjs for the hand calculation).
import { createRequire } from "node:module";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { serve } from "./serve.mjs";
import { chromium, ALL_TOOLS } from "./tools.mjs";
const req = createRequire(import.meta.url);
const { TOOLS, toolUsed, toolsUsed, toolsOpen, toolsStart } = req("../app/tools.js");
const { newProject } = req("../app/project.js");
let bad = 0;
const eq = (name, got, want) => { got = JSON.stringify(got); want = JSON.stringify(want); if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; } };
const yes = (name, v) => eq(name, !!v, true);

// ---- Pure part: the list of tools in a project.
eq("the 13 tools", TOOLS, ["paste", "formula", "stats", "hist", "cum", "gof", "wmean", "series", "derived", "calib", "compare", "logy", "export"]);
eq("the page tests know the same list", ALL_TOOLS, TOOLS);
const pr = newProject(["x", "y"], [[1, 2], [2, 3]]);
eq("a new project has no stored list", toolsOpen(pr), null);
eq("nothing used, nothing to open", toolsStart(pr), []);
pr.results.push({ kind: "hist" }, { kind: "fit" }, { kind: "derived" });
eq("a histogram result marks histogram and cumulative plot, a fit marks no tool", toolsUsed(pr), ["hist", "cum", "derived"]);
eq("a project without a list opens the tools it has results in", toolsStart(pr), ["hist", "cum", "derived"]);
pr.settings.tools = ["gof", "nonsense", 5, "gof", "export"];
eq("stored list: unknown names and repeats dropped, in menu order", toolsOpen(pr), ["gof", "export"]);
eq("stored list wins over the results", toolsStart(pr), ["gof", "export"]);
pr.settings.tools = "stats";
eq("a stored list that is not a list is ignored", toolsOpen(pr), null);
pr.settings.tools = [];
eq("an empty stored list means all closed", toolsStart(pr), []);
pr.columns.push({ name: "f", role: "unused", values: [1, 2], formula: "x*2" });
pr.settings.logy = true;
yes("a formula column and the log axis count as used", toolUsed(pr, "formula") && toolUsed(pr, "logy") && !toolUsed(pr, "stats"));

// ---- Real page, fresh profile, 1200 x 800.
const { base, close } = await serve();
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1200, height: 800 } });
const p = await ctx.newPage();
const errors = [];
p.on("pageerror", e => errors.push(String(e)));
const ready = () => p.waitForFunction(() => /E = \(201 ± 8\) GPa/.test(document.getElementById("introres").textContent), null, { timeout: 120000 });
const visiblePanels = () => p.evaluate(() => [...document.querySelectorAll("[data-tool-panel]")].filter(e => e.checkVisibility()).map(e => e.dataset.toolPanel));
const stored = () => p.evaluate(() => proj.settings.tools);
// Visible = what a student sees: not hidden, not in a closed menu, not under visibility:hidden; Plotly's own chart toolbar is not counted.
const count = () => p.evaluate(() => ({
  sections: [...document.querySelectorAll("main section")].filter(e => e.checkVisibility({ checkVisibilityCSS: true })).map(e => e.id || e.dataset.toolPanel),
  buttons: [...document.querySelectorAll("button, label.btn, summary")].filter(e => e.checkVisibility({ checkVisibilityCSS: true }) && !e.closest(".modebar")).map(e => e.id || e.textContent.trim()),
  plot: document.getElementById("plot").getBoundingClientRect().toJSON(), intro: document.getElementById("introres").getBoundingClientRect().toJSON(),
  pageHeight: document.documentElement.scrollHeight, pageWidth: document.documentElement.scrollWidth, windowWidth: innerWidth,
}));
await p.goto(base + "app/app.html");
await ready();

// 1. First view.
const c = await count();
console.log(`first view at 1200 x 800: sections ${c.sections.length} (${c.sections.join(", ")}), buttons ${c.buttons.length}, page height ${c.pageHeight} px, plot ${Math.round(c.plot.top)} to ${Math.round(c.plot.bottom)} px`);
console.log("visible buttons: " + c.buttons.join(" | "));
yes("at most 4 visible sections", c.sections.length <= 4);
eq("the four: plot, table, results, tools", [...c.sections].sort(), ["s_plot", "s_results", "s_table", "s_tools"]);
yes("at most 15 visible buttons", c.buttons.length <= 15);
yes("the plot is fully inside the window without scrolling", c.plot.top >= 0 && c.plot.bottom <= 800 && c.plot.height > 300);
yes("the E result is inside the window without scrolling", c.intro.top >= 0 && c.intro.bottom <= 800);
eq("the E result", await p.textContent("#introres"), "E = (201 ± 8) GPa");
yes("the plot really is drawn", await p.evaluate(() => document.querySelectorAll("#plot .scatterlayer .trace").length > 0));
eq("no tool is open", await visiblePanels(), []);
eq("no sideways scroll", c.pageWidth <= c.windowWidth, true);
eq("first-visit project stores an empty tool list", await stored(), []);
eq("the table is there with its 6 rows", await p.$$eval("#table tbody tr", e => e.length), 6);
await p.screenshot({ path: "evidence/phase4-step2-first.png" });

// The row delete buttons show on the row under the pointer only.
eq("row delete button is hidden", await p.isVisible('[data-del="2"]'), false);
await p.__raw.hover("#table tbody tr:nth-child(3)");
eq("row delete button shows on the row under the pointer", await p.isVisible('[data-del="2"]'), true);
await p.mouse.move(5, 5);

// 2. The menu: marks and counts, then each tool opens alone.
yes("menu text counts the tools with a result", (await p.textContent("#toolcount")).includes("2"));
await p.click("#toolmenu > summary");
eq("menu marks: derived and series used, the others not", await p.$$eval("[data-tool] .mark", e => e.filter(m => !m.hidden).map(m => m.parentElement.dataset.tool)), ["series", "derived"]);
yes("all 13 tool buttons are in the menu", (await p.$$("[data-tool]")).length === 13 && (await p.$$eval("[data-tool]", e => e.every(x => x.checkVisibility())) === true));
await p.screenshot({ path: "evidence/phase4-step2-menu.png" });
await p.click("#toolmenu > summary");
for (const id of ALL_TOOLS) {
  await p.click("#toolmenu > summary");
  await p.click(`[data-tool="${id}"]`);
  eq(`opening ${id} shows exactly that tool`, await visiblePanels(), [id]);
  eq(`${id}: menu closed after the pick`, await p.evaluate(() => document.getElementById("toolmenu").open), false);
  yes(`${id}: its heading is readable`, (await p.textContent(`[data-tool-panel="${id}"] h2`)).length > 3);
  yes(`${id}: the panel is on screen`, await p.evaluate(i => { const r = document.querySelector(`[data-tool-panel="${i}"]`).getBoundingClientRect(); return r.height > 40 && r.width > 300; }, id));
  await p.click(`[data-close="${id}"]`);
  eq(`closing ${id} leaves no tool open`, await visiblePanels(), []);
}
// Two tools can be open together; the panels keep the menu order whatever order they were opened in.
await p.click("#toolmenu > summary"); await p.click('[data-tool="hist"]');
await p.click("#toolmenu > summary"); await p.click('[data-tool="stats"]');
eq("two tools open, in menu order", await visiblePanels(), ["stats", "hist"]);
eq("stored list", await stored(), ["stats", "hist"]);
await p.screenshot({ path: "evidence/phase4-step2-two-tools.png", fullPage: true });

// 3. Saved with the project: after a reload the same tools are open; opening a tool is no undo step.
await p.reload(); await p.waitForFunction(() => !document.getElementById("fit").disabled, null, { timeout: 120000 });
eq("after reload the same tools are open", await visiblePanels(), ["stats", "hist"]);
eq("after reload: open tools in the menu are marked pressed", await p.$$eval("[data-tool].open", e => e.map(x => x.dataset.tool)), ["stats", "hist"]);
eq("after the reload undo is empty", await p.isDisabled("#undo"), true);
await p.click("#toolmenu > summary"); await p.click('[data-tool="calib"]'); await p.click('[data-close="calib"]');
eq("opening and closing a tool alone is no undo step", [await p.isDisabled("#undo"), await p.isDisabled("#redo")], [true, true]);
await p.fill('#table input[data-r="0"][data-c="1"]', "0,27");
eq("a cell edit enables undo", await p.isDisabled("#undo"), false);
await p.click("#toolmenu > summary"); await p.click('[data-tool="gof"]');
await p.click("#undo");
eq("undo takes back the edit", await p.evaluate(() => proj.columns[1].values[0]), 0.26);
eq("undo leaves the tool open", await visiblePanels(), ["stats", "hist", "gof"]);
await p.click("#redo");
eq("redo brings the edit back and keeps the tools", [await p.evaluate(() => proj.columns[1].values[0]), await visiblePanels()], [0.27, ["stats", "hist", "gof"]]);
await p.reload(); await p.waitForFunction(() => !document.getElementById("fit").disabled, null, { timeout: 120000 });
eq("autosave with results still shows the tools it stored (not the ones with results)", await visiblePanels(), ["stats", "hist", "gof"]);

// 4. Files. A project file from before the tools (no list) opens the tools it has results in; one with a list uses it.
const dir = mkdtempSync(resolve(tmpdir(), "p4s2-"));
const fresh = await p.evaluate(() => { const q = JSON.parse(save(proj)); return q; });
await p.click("#blank");                                   // a different project, then open the file
const old = JSON.parse(JSON.stringify(fresh)); delete old.settings.tools; old.results = [{ kind: "derived", weighted: true, params: [{ name: "E", unit: "GPa", value: 201, uScaled: 8 }], computedFrom: "x", settings: {} },
  { kind: "gof", params: [], computedFrom: "x", settings: {} }];
writeFileSync(dir + "/old.plotlab", JSON.stringify(old));
const withList = JSON.parse(JSON.stringify(old)); withList.settings.tools = ["compare", "nonsense", "compare"];
writeFileSync(dir + "/list.plotlab", JSON.stringify(withList));
const badList = JSON.parse(JSON.stringify(old)); badList.settings.tools = "stats";
writeFileSync(dir + "/badlist.plotlab", JSON.stringify(badList));
const formulaFile = JSON.parse(JSON.stringify(fresh)); delete formulaFile.settings.tools; formulaFile.results = [];
formulaFile.columns.push({ name: "F2 / N", role: "unused", values: formulaFile.columns[0].values.map(() => null), formula: "F*2" }); formulaFile.settings.logy = true;
writeFileSync(dir + "/formula.plotlab", JSON.stringify(formulaFile));
await p.setInputFiles("#openfile", dir + "/old.plotlab");
await p.waitForFunction(() => proj.results.length === 2);
eq("old file with results opens exactly those tools", await visiblePanels(), ["gof", "derived"]);
await p.setInputFiles("#openfile", dir + "/list.plotlab");
await p.waitForFunction(() => proj.settings.tools?.[0] === "compare");
eq("file with a stored list uses it; unknown names are dropped", await visiblePanels(), ["compare"]);
await p.setInputFiles("#openfile", dir + "/badlist.plotlab");
await p.waitForFunction(() => Array.isArray(proj.settings.tools) && proj.settings.tools.includes("gof"));
eq("file with a list that is not a list falls back to the results", await visiblePanels(), ["gof", "derived"]);
await p.setInputFiles("#openfile", dir + "/formula.plotlab");
await p.waitForFunction(() => proj.columns.some(c => c.formula === "F*2") && proj.settings.tools?.includes("logy"));
eq("a formula column and the log axis open their tools", await visiblePanels(), ["formula", "logy"]);
eq("no message, no error", [await p.isVisible("#msg"), errors], [false, []]);
// a template: p2 has a formula column, p8b has the log axis
await p.selectOption("#tpl_sel", "p8b"); await p.click("#tpl_load");
await p.waitForFunction(() => proj.template === "p8b");
eq("template with the log axis opens it", (await visiblePanels()).includes("logy"), true);

// 5. A template step names a button in a tool that is closed: "Zeigen" opens the tool and focuses the button.
await p.click("#blank");
await p.selectOption("#tpl_sel", "p3"); await p.click("#tpl_load");
await p.waitForFunction(() => proj.template === "p3");
eq("p3 loaded: it opens its own tools (step 3)", await visiblePanels(), ["series", "derived"]);
await p.click('[data-close="series"]'); await p.click('[data-close="derived"]');   // close them: Zeigen must open a closed tool again
eq("both closed", await visiblePanels(), []);
await p.click('#tpl_info a[data-go="derive"]');
eq("Zeigen opens the tool that holds the button", await visiblePanels(), ["derived"]);
eq("and focuses the button", await p.evaluate(() => document.activeElement.id), "derive");
await p.click('#tpl_info a[data-go="sr_go"]');
eq("Zeigen for a second tool opens it too", await visiblePanels(), ["series", "derived"]);

// 6. English: the menu follows the language switch.
await p.click("#lang_en");
eq("English menu button", await p.textContent("#toolmenu > summary span"), "Choose a tool");
await p.click("#toolmenu > summary");
eq("English tool names", await p.$$eval("[data-tool] > span:first-child", e => e.map(x => x.textContent)),
  ["Paste data", "Formula column", "Mean and spread", "Histogram", "Cumulative plot", "χ² test", "Weighted mean", "Several series", "Derived quantity", "Calibration line", "Comparison", "Logarithmic axis", "Save plot"]);
await p.click("#lang_de");
eq("German menu button again", await p.textContent("#toolmenu > summary span"), "Werkzeug wählen");

eq("page errors", errors, []);
await b.close(); close();
console.log(bad ? `${bad} FAILED` : "all checks passed");
process.exit(bad ? 1 : 0);
