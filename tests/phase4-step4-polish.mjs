// Phase 4 step 4: first-view polish. One toolbar row in groups (Datei / Bearbeiten / Versuchsvorlage), the language switch stays in the header,
// at most 15 visible buttons, helpful empty states, and nothing sticks out sideways at 1200, 800 and 375 px (tables scroll inside their box; every
// tool and every template is checked at 375 px too). Counts and positions are measured on the page; nothing here comes from the app's maths.
import { serve } from "./serve.mjs";
import { chromium, ALL_TOOLS, openTool } from "./tools.mjs";
let bad = 0;
const eq = (name, got, want) => { got = JSON.stringify(got); want = JSON.stringify(want); if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; } };
const yes = (name, v) => eq(name, !!v, true);
const { base, close } = await serve();
const b = await chromium.launch();
const errors = [];
const page = async (w, h) => {
  const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
  p.on("pageerror", e => errors.push(String(e)));
  await p.goto(base + "app/index.html");
  await p.waitForFunction(() => /E = \(201 ± 8\) GPa/.test(document.getElementById("introres").textContent), null, { timeout: 120000 });
  return p;
};
// Anything a student sees that reaches past the right edge of the window, apart from boxes that scroll inside themselves (table, results, charts).
const sticksOut = p => p.evaluate(() => ({
  doc: document.documentElement.scrollWidth - innerWidth,
  els: [...document.querySelectorAll("body *")].filter(e => e.checkVisibility({ checkVisibilityCSS: true }) && !e.closest(".scroll, #results, .js-plotly-plot, .modebar, svg") && e.getBoundingClientRect().right > innerWidth + 1)
    .map(e => `${e.tagName}#${e.id}.${e.className} right=${Math.round(e.getBoundingClientRect().right)}`).slice(0, 5),
}));
const noSideways = async (name, p) => { const s = await sticksOut(p); eq(`${name}: no sideways scroll`, s.doc <= 0, true); eq(`${name}: nothing sticks out`, s.els, []); };

// ---- 1200 x 800
let p = await page(1200, 800);
const bar = await p.evaluate(() => ({
  caps: [...document.querySelectorAll("#filebar .cap")].map(e => e.textContent),
  tops: [...document.querySelectorAll("#filebar .cap")].map(g => Math.round(g.getBoundingClientRect().top)),
  barH: document.getElementById("filebar").getBoundingClientRect().height,
  buttons: [...document.querySelectorAll("button, label.btn, summary")].filter(e => e.checkVisibility({ checkVisibilityCSS: true }) && !e.closest(".modebar")).length,
  headerLang: [...document.querySelectorAll("header [data-lang]")].map(e => e.textContent),
  groups: [...document.querySelectorAll("#filebar .grp")].map(g => [...g.querySelectorAll("button, label.btn, summary")].filter(e => !e.closest(".menuitems")).map(e => e.textContent.trim())),
}));
eq("three groups with plain captions", bar.caps, ["Datei", "Bearbeiten", "Versuchsvorlage"]);
eq("the groups sit on ONE row at 1200 px (captions at the same height)", Math.max(...bar.tops) - Math.min(...bar.tops) <= 1, true);
yes(`the toolbar is one row high (${bar.barH} px, a caption plus one button row)`, bar.barH < 90);
eq("group contents", bar.groups, [["Leere Tabelle", "Beispiele", "Öffnen", "Speichern"], ["Rückgängig", "Wiederholen"], ["Laden"]]);
eq("language switch stays in the header", bar.headerLang, ["DE", "EN"]);
yes(`at most 15 visible buttons (${bar.buttons})`, bar.buttons <= 15);
await noSideways("1200", p);
yes("the template list is still full (12 templates and the empty choice)", (await p.$$eval("#tpl_sel option", e => e.length)) === 13);
await p.screenshot({ path: "evidence/phase4-step4-1200.png" });
// Empty state: a student who starts empty is told what to do in the table and in the results.
await p.click("#blank");
yes("empty table: hint above the table says to click and type", (await p.textContent("#s_table .hint")).includes("Klicke in eine Zelle"));
eq("empty table: results say what to do", await p.textContent("#results"), "Noch keine Ergebnisse. Trage Messwerte ein und drücke „Anpassen“.");
await p.screenshot({ path: "evidence/phase4-step4-empty-1200.png" });
await p.click("#lang_en");
eq("English captions", await p.$$eval("#filebar .cap", e => e.map(x => x.textContent)), ["File", "Edit", "Experiment template"]);
eq("English file buttons", await p.$$eval("#filebar .grp:first-child .row > *", e => e.map(x => x.firstElementChild && x.matches("details") ? x.querySelector("summary").textContent.trim() : x.textContent.trim())), ["Empty table", "Examples", "Open", "Save"]);
eq("English empty results", await p.textContent("#results"), "No results yet. Enter your measured values and press “Fit”.");
await noSideways("1200 English", p);

// ---- 800 x 600 (tablet)
p = await page(800, 600);
await noSideways("800", p);
const t800 = await p.evaluate(() => ({ plotW: document.getElementById("plot").getBoundingClientRect().width, tableTop: document.getElementById("s_table").getBoundingClientRect().top, plotTop: document.getElementById("plot").getBoundingClientRect().top }));
yes("800 px: plot above the table (stacked), full width", t800.plotTop < t800.tableTop && t800.plotW > 600);
await p.screenshot({ path: "evidence/phase4-step4-800.png" });
for (const id of ALL_TOOLS) { await openTool(p, id); await noSideways(`800 tool ${id}`, p); await p.click(`[data-close="${id}"]`); }

// ---- 375 x 800 (phone)
p = await page(375, 800);
await noSideways("375", p);
yes("375 px: the table scrolls inside its own box", await p.evaluate(() => { const s = document.getElementById("table"); return s.scrollWidth > s.clientWidth && getComputedStyle(s).overflowX !== "visible"; }));
yes("375 px: the results scroll inside their own box", await p.evaluate(() => getComputedStyle(document.getElementById("results")).overflowX === "auto"));
const off = await p.evaluate(() => [...document.querySelectorAll("#filebar .row > button, #filebar .row > label.btn, #filebar summary, #filebar select")].filter(e => { const r = e.getBoundingClientRect(); return !(r.left >= 0 && r.right <= innerWidth); }).map(e => e.id || e.textContent.trim()));
eq("375 px: every toolbar button is fully on screen", off, []);

const hdr = await p.evaluate(() => document.querySelector("header").getBoundingClientRect().height);
yes(`375 px: header is lower than on a desktop (${hdr} px)`, hdr < 81);
await p.screenshot({ path: "evidence/phase4-step4-375.png" });
await p.screenshot({ path: "evidence/phase4-step4-375-full.png", fullPage: true });
// tools stack below the results; every one of the 13 fits at 375 px
for (const id of ALL_TOOLS) { await openTool(p, id); await noSideways(`375 tool ${id}`, p); await p.click(`[data-close="${id}"]`); }
// the Beispiele menu opens inside the window
await p.__raw.click("#exmenu > summary");
yes("375 px: the Beispiele menu is fully on screen", await p.evaluate(() => { const r = document.querySelector("#exmenu .menuitems").getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; }));
await p.__raw.click("#exmenu > summary");
// all 12 templates at 375 px (loaded, not fitted: the box with its steps must fit)
const ids = await p.$$eval("#tpl_sel option", e => e.map(x => x.value).filter(Boolean));
eq("12 templates", ids.length, 12);
for (const id of ids) {
  await p.selectOption("#tpl_sel", id); await p.click("#tpl_load");
  await p.waitForFunction(i => proj.template === i, id);
  await noSideways(`375 template ${id}`, p);
}
await p.click("#lang_en"); await noSideways("375 English template", p);

eq("page errors", errors, []);
await b.close(); close();
console.log(bad ? `${bad} FAILED` : "all checks passed");
process.exit(bad ? 1 : 0);
