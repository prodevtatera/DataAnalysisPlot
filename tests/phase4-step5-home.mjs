// Phase 4 step 5: the home page (app/index.html) at the root address, and the workbench (app/app.html) behind it.
// Expected numbers: the weighted-line example is checked against values computed another way (exact fractions, centred sums; the same reference as tests/draft.mjs);
// everything else is read off the page or counted. Nothing here takes a value from the app's own maths.
import { readFileSync } from "node:fs";
import { serve } from "./serve.mjs";
import { chromium } from "./tools.mjs";
let bad = 0;
const eq = (name, got, want) => { got = JSON.stringify(got); want = JSON.stringify(want); if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; } };
const yes = (name, v) => eq(name, !!v, true);

// ---- the example picture on the home page: fit and rounding against the reference values
{
  const js = readFileSync("app/home.js", "utf8"), r = readFileSync("app/round.js", "utf8");
  const { fit, huRound } = new Function(r + js.slice(js.indexOf("const D ="), js.indexOf("// ---- end of the part")) + "; return {fit, huRound};")();
  const F = fit(), near = (n, g, w) => yes(`${n}: ${g} vs ${w}`, Math.abs(g - w) < 1e-9);
  near("slope", F.m, 2.3190476190476192); near("intercept", F.b, 0.039285714285714285);
  near("slope error (unscaled)", F.um, 0.04629100498862757); near("intercept error (unscaled)", F.ub, 0.23375811674219388); near("chi2", F.chi2, 3.1084656084656084);
  eq("scaled slope rounds to (2,32 ± 0,03)", huRound(F.m, F.um * F.f), ["2,32", "0,03"]);
  eq("unscaled slope rounds to (2,32 ± 0,05)", huRound(F.m, F.um), ["2,32", "0,05"]);
}

// ---- the real pages, served the way a host serves app/: the root address is the home page
const { base, close } = await serve(["app/"], "app");
const b = await chromium.launch();
const errors = [], outside = [], sizes = [];
const fresh = async (w = 1200, h = 800, locale = "de-DE") => {
  const c = await b.newContext({ viewport: { width: w, height: h }, locale });
  const p = await c.newPage();
  p.on("pageerror", e => errors.push(String(e)));
  p.on("request", r => { if (!r.url().startsWith(base) && !r.url().startsWith("data:") && !r.url().startsWith("blob:")) outside.push(r.url()); });
  p.on("response", async r => { try { sizes.push([r.url().replace(base, "/"), (await r.body()).length]); } catch {} });
  return p;
};
const home = async (p, path = "") => { await p.goto(base + path); await p.waitForFunction(() => /^D = \(/.test(document.getElementById("res").textContent)); };
const ready = p => p.waitForFunction(() => /E = \(201 ± 8\) GPa/.test(document.getElementById("introres").textContent), null, { timeout: 120000 });
const sticksOut = p => p.evaluate(() => ({ doc: document.documentElement.scrollWidth - innerWidth,
  els: [...document.querySelectorAll("body *")].filter(e => e.checkVisibility({ checkVisibilityCSS: true }) && e.getBoundingClientRect().right > innerWidth + 1).map(e => `${e.tagName}#${e.id}.${e.className}`).slice(0, 5) }));
const noSideways = async (name, p) => { const s = await sticksOut(p); yes(`${name}: no sideways scroll`, s.doc <= 0); eq(`${name}: nothing sticks out`, s.els, []); };

// 1. Root address = home page, German first, nothing from outside, no Python engine.
let p = await fresh();
await home(p);
eq("root address shows the home page", [await p.title(), await p.textContent("h1")], ["Messdaten auswerten und plotten: Ausgleichsgerade | PlotLab", "Vom Messwert zum fertigen Protokoll-Diagramm"]);
eq("language is German by default", await p.evaluate(() => document.documentElement.lang), "de");
eq("the footer sentence", await p.textContent("footer [data-i18n=foot]"), "Unabhängiges Studierendenwerkzeug. Nicht mit der Universität verbunden.");
eq("example result line", await p.textContent("#res"), "D = (2,32 ± 0,03) N/cm");
await p.click("input[value=unscaled]");
eq("unscaled result line", await p.textContent("#res"), "D = (2,32 ± 0,05) N/cm");
await p.click("input[value=scaled]");
eq("the first screen offers the three buttons", await p.$$eval(".hero .btn", e => e.map(x => x.textContent.trim())), ["Beispiel öffnen", "Leeres Projekt", "Datei wählen"]);
eq("twelve template cards with their titles", await p.$$eval(".card strong", e => e.map(x => x.textContent)), ["P1 Fehlerverteilung", "P2 Volumenmessung", "P3 Elastizität", "P4 Oberflächenspannung", "P5 Polarimetrie (Saccharose)", "P5 Newtonsche Ringe", "P6 Wheatstone-Brücke", "P6 Gitter", "P7 Refraktometer", "P8 Radioaktivität: Zählraten", "P8 Radioaktivität: Zerfallskurve", "P9 Pendel"]);
// (SEO round: the cards show only the title; the one-line descriptions moved to the experiment hub page /versuche/, checked in tests/seo-site.sh)
eq("five common questions, collapsed", await p.$$eval(".faq details", e => [e.length, e.filter(x => x.open).length]), [5, 0]); // SEO round: the three value points were cut (less text); the questions say the same
yes("no placeholder or empty text anywhere", await p.evaluate(() => [...document.querySelectorAll("[data-i18n]")].every(e => e.textContent.trim() && !e.textContent.startsWith("["))));
eq("no continue link without a saved project", await p.$eval("#cont", e => e.hidden), true);
yes("no request left the machine", outside.length === 0);
yes("the home page does not load Python or Plotly", sizes.every(([u]) => !/vendor|worker|pyodide/i.test(u)));
const bytes = sizes.reduce((s, [, n]) => s + n, 0);
console.log(`home page: ${sizes.length} files, ${Math.round(bytes / 1024)} KB uncompressed`);
await noSideways("1200", p);
await p.evaluate(() => scrollTo(0, 0));
await p.screenshot({ path: "evidence/phase4-step5-home-1200.png" });
await p.screenshot({ path: "evidence/phase4-step5-home-1200-full.png", fullPage: true });

// 2. English: everything switches, the choice is kept, and the workbench opens in English too.
await p.click('[data-home-lang="en"]'); await p.waitForURL(/\/en\/$/); await p.waitForFunction(() => /^D = \(/.test(document.getElementById("res").textContent)); // the language is the address now: /en/
eq("English headline", await p.textContent("h1"), "From measurements to a finished lab-report plot");
eq("English footer", await p.textContent("footer [data-i18n=foot]"), "Independent student tool. Not affiliated with the university.");
eq("English buttons", await p.$$eval(".hero .btn", e => e.map(x => x.textContent.trim())), ["Open example", "Empty project", "Choose file"]);
eq("English result line (decimal point)", await p.textContent("#res"), "D = (2.32 ± 0.03) N/cm");
yes("English cards", (await p.$$eval(".card strong", e => e.map(x => x.textContent))).every(x => !/[äöüÄÖÜ]/.test(x)) && (await p.textContent(".card strong")) === "P1 Error distribution");
yes("English page: no placeholder or empty text", await p.evaluate(() => [...document.querySelectorAll("[data-i18n]")].every(e => e.textContent.trim() && !e.textContent.startsWith("["))));
await p.screenshot({ path: "evidence/phase4-step5-home-en-1200.png" });
await p.reload(); await p.waitForFunction(() => /^D = \(/.test(document.getElementById("res").textContent));
eq("the language survives a reload", await p.textContent("h1"), "From measurements to a finished lab-report plot");
await Promise.all([p.waitForURL(/app\.html/), p.click("#go_example")]);
await ready(p);
eq("workbench is English and shows the finished example", [await p.evaluate(() => document.documentElement.lang), await p.textContent("h1"), await p.textContent("#introres")].map(x => String(x).slice(0, 20)), ["en", "Measurement data", "E = (201 ± 8) GPa"].map(x => x.slice(0, 20)));
eq("the address is cleaned after the start", new URL(p.url()).search, "");
// the workbench brand leads back to the home page
await p.click("header .brand");
await p.waitForFunction(() => /^D = \(/.test(document.getElementById("res").textContent));
eq("brand link in the workbench goes to the home page of the chosen language (English: /en/)", new URL(p.url()).pathname, "/en/");
// a saved project exists now: the home page offers to continue and says a new one replaces it
eq("continue link shows with a saved project", await p.$eval("#cont", e => e.hidden), false);
await p.click("#cont a");
await p.waitForFunction(() => document.getElementById("note") && !document.getElementById("note").hidden);
eq("continue restores the saved project", await p.textContent("#note"), "Restored: your last state was loaded automatically.");
await p.close();

// 3. Buttons: the example, an empty project.
p = await fresh(); await home(p);
await Promise.all([p.waitForURL(/app\.html/), p.click("#go_example")]);
await ready(p);
eq("example: P3 template fitted", await p.evaluate(() => [proj.template, proj.results.length > 0]), ["p3", true]);
await p.goto(base); await p.waitForFunction(() => /^D = \(/.test(document.getElementById("res").textContent));
await Promise.all([p.waitForURL(/app\.html/), p.click("#go_blank")]);
await p.waitForFunction(() => typeof proj !== "undefined" && proj && proj.columns.length === 3 && proj.columns[0].values.every(v => v === null));
eq("empty project: three columns x, y, sy and eight empty rows", await p.evaluate(() => [proj.columns.map(c => c.name), proj.columns[0].values.length, proj.results.length]), [["x", "y", "sy"], 8, 0]);
await p.reload();
await p.waitForFunction(() => typeof proj !== "undefined" && proj);
eq("a reload keeps the empty project (the start is not applied twice)", await p.evaluate(() => [proj.columns.map(c => c.name), proj.results.length]), [["x", "y", "sy"], 0]);
await p.close();

// 4. Each template card lands in the workbench with exactly that template and its tools.
const TOOLS = { p1: ["stats", "hist", "cum"], p2: ["stats", "wmean"], p3: ["series", "derived"], p4: ["derived"], p5a: [], p5b: ["derived"], p6a: ["wmean", "compare"], p6b: ["wmean", "compare"], p7: ["calib"], p8a: ["gof"], p8b: ["logy", "export"], p9: ["stats", "derived"] };
const hrefs = await (async () => { p = await fresh(); await home(p); const h = await p.$$eval(".card", e => e.map(x => x.getAttribute("href"))); await p.close(); return h; })();
eq("card links", hrefs, Object.keys(TOOLS).map(id => `/app.html?start=${id}`));
for (const id of Object.keys(TOOLS)) {
  p = await fresh(); await home(p);
  await Promise.all([p.waitForURL(/app\.html/), p.click(`.card[href$="=${id}"]`)]);
  await p.waitForFunction(() => typeof proj !== "undefined" && proj && proj.template);
  const got = await p.evaluate(() => [proj.template, proj.settings.tools, document.getElementById("tpl_info").hidden, document.querySelector("#tpl_info h3")?.textContent]);
  eq(`card ${id}: template loaded, box visible`, [got[0], got[2]], [id, false]);
  eq(`card ${id}: its tools are the open ones`, [...got[1]].sort(), [...TOOLS[id]].sort());
  await p.close();
}

// 5. A file: dropped, chosen, pasted; a picture and an Excel file are refused on the home page and nothing changes.
const drop = (p, name, type, content) => p.evaluate(([n, t, c]) => {
  const dt = new DataTransfer(); dt.items.add(new File([c], n, { type: t }));
  document.body.dispatchEvent(new DragEvent("dragover", { dataTransfer: dt, bubbles: true, cancelable: true }));
  const ev = new DragEvent("drop", { dataTransfer: dt, bubbles: true, cancelable: true }); document.body.dispatchEvent(ev); return ev.defaultPrevented;
}, [name, type, content]);
const csv = "﻿F / N;ΔL / mm;sΔL / mm\r\n10;0,26;0,02\r\n20;0,50;0,02\r\n30;0,77;0,02\r\n";
const table = p => p.evaluate(() => [proj.columns.map(c => c.name), proj.columns.map(c => c.values.slice(0, 3)), proj.results.length]);
const WANT = [["F / N", "ΔL / mm", "sΔL / mm"], [[10, 20, 30], [0.26, 0.5, 0.77], [0.02, 0.02, 0.02]], 0];
p = await fresh(); await home(p);
eq("a dragged file is taken over", await drop(p, "messung.csv", "text/csv", csv), true);
await p.waitForURL(/app\.html/);
await p.waitForFunction(() => typeof proj !== "undefined" && proj && proj.columns[0].name === "F / N");
eq("dropped German CSV arrives as a table (decimal commas read)", await table(p), WANT);
eq("the file is not left in storage", await p.evaluate(() => sessionStorage.getItem("plotlab-handoff")), null);
await p.screenshot({ path: "evidence/phase4-step5-dropped-1200.png" });
await p.close();
p = await fresh(); await home(p);
await p.setInputFiles("#picker", { name: "messung.csv", mimeType: "text/csv", buffer: Buffer.from(csv) });
await p.waitForURL(/app\.html/);
await p.waitForFunction(() => typeof proj !== "undefined" && proj && proj.columns[0].name === "F / N");
eq("a chosen file arrives as a table", await table(p), WANT);
await p.close();
p = await fresh(); await home(p);
await p.evaluate(t => { const dt = new DataTransfer(); dt.setData("text", t); document.body.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true })); }, csv.slice(1));
await p.waitForURL(/app\.html/);
await p.waitForFunction(() => typeof proj !== "undefined" && proj && proj.columns[0].name === "F / N");
eq("a table pasted from Excel arrives as a table", await table(p), WANT);
await p.close();
// bad files: stay on the home page, say why in plain words, store nothing
p = await fresh(); await home(p);
await p.evaluate(() => localStorage.setItem("plotlab-autosave", "SAVED-BEFORE"));
const msg = () => p.$eval("#homemsg", e => e.hidden ? "" : e.textContent);
await drop(p, "foto.png", "image/png", "\x89PNG\0\0");
await p.waitForFunction(() => !document.getElementById("homemsg").hidden);
eq("a dropped picture is refused with a clear message", await msg(), "„foto.png“ ist keine Tabelle. Bitte eine CSV- oder Textdatei mit Zahlen oder ein PlotLab-Projekt (.plotlab) auf die Seite ziehen.");
await p.screenshot({ path: "evidence/phase4-step5-badfile-1200.png" });
eq("the page did not move and nothing was stored", await p.evaluate(() => [location.pathname, sessionStorage.getItem("plotlab-handoff"), localStorage.getItem("plotlab-autosave")]), ["/", null, "SAVED-BEFORE"]);
await drop(p, "tabelle.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "PK");
await p.waitForFunction(() => document.getElementById("homemsg").textContent.includes("tabelle.xlsx"));
yes("an Excel file says to save as CSV", (await msg()).includes("CSV"));
await drop(p, "notizen.txt", "text/plain", "Hallo Welt");
await p.waitForFunction(() => document.getElementById("homemsg").textContent.includes("notizen.txt"));
yes("a text without numbers is refused", (await msg()).includes("keine Zahlen"));
await p.click('[data-home-lang="en"]'); await p.waitForURL(/\/en\/$/); await p.waitForFunction(() => /^D = \(/.test(document.getElementById("res").textContent)); // the language is the address now: /en/
eq("the message goes away with the language switch", await msg(), "");
await p.close();
// a file that looks fine but has a letter in a number cell: the workbench says so and keeps what it had
p = await fresh(); await home(p);
await drop(p, "falsch.csv", "text/csv", "a;b\n1;2\n3;x\n");
await p.waitForURL(/app\.html/);
await p.waitForFunction(() => document.getElementById("msg") && !document.getElementById("msg").hidden);
eq("a damaged table: clear message in the workbench", await p.textContent("#msg"), "Zeile 3, Spalte 2: „x“ ist keine Zahl.");
await ready(p);
eq("... and the workbench still shows the example", await p.evaluate(() => proj.template), "p3");
await p.close();
// the workbench opened for a file that never arrived
p = await fresh();
await p.goto(base + "app.html?start=file");
await p.waitForFunction(() => document.getElementById("msg") && !document.getElementById("msg").hidden);
eq("start=file without a file: clear message", await p.textContent("#msg"), "Die Datei ist nicht angekommen. Zieh sie bitte noch einmal auf die Seite.");
await p.close();

// 6. Layout: 800 and 375 px, no sideways scroll; the cards and points stack.
p = await fresh(800, 600); await home(p);
await noSideways("800", p);
await p.screenshot({ path: "evidence/phase4-step5-home-800.png" });
await p.close();
p = await fresh(375, 800); await home(p);
await noSideways("375", p);
await p.screenshot({ path: "evidence/phase4-step5-home-375.png" });
await p.screenshot({ path: "evidence/phase4-step5-home-375-full.png", fullPage: true });
yes("375 px: the three buttons are fully on screen", await p.$$eval(".hero .btn", e => e.every(x => x.getBoundingClientRect().right <= innerWidth && x.getBoundingClientRect().left >= 0)));
await p.click('[data-home-lang="en"]'); await p.waitForURL(/\/en\/$/); await p.waitForFunction(() => /^D = \(/.test(document.getElementById("res").textContent)); // the language is the address now: /en/
await noSideways("375 English", p);
await p.close();

// 7. The whole run: no request left the machine, no script error.
yes(`no request left the machine (${outside.join(", ")})`, outside.length === 0);
eq("no script errors", errors, []);
await b.close(); close();
if (bad) process.exit(1);
console.log("phase 4 step 5: home page, hand-over to the workbench, templates, files, languages OK");
