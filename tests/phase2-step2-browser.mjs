// Phase 2 step 2: uncertainty columns for formula columns in the real page (P6 Wheatstone bridge Rx = R1·R2/R3).
// Expected values by hand: row 1 Rx = 50, u = 0,4330127; row 2 Rx = 180, u = 1,5130834 (partial derivatives, separate calculation).
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { writeFileSync, readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
const { chromium } = createRequire(resolve("testbuild/x.js"))("playwright-core");
const { newProject, save } = createRequire(import.meta.url)("../app/project.js");
let bad = 0;
const eq = (name, got, want) => {
  got = JSON.stringify(got); want = JSON.stringify(want);
  if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; }
};
const near = (name, got, want) => eq(name, got.map(v => v === null ? v : Math.round(v * 1e7) / 1e7), want);
const dir = mkdtempSync(resolve(tmpdir(), "p2s2-"));
// Hand-edited project: text that must never run, in the uncertainty fields.
const hand = newProject(["D / mm", "sD / mm"], [[2, 0.1]]);
hand.columns.push({ name: "r2", role: "unused", values: [0], formula: "(D/2)^2" });
hand.columns.push({ name: "<img src=x onerror=window.pwn=1>", role: "unused", values: [0], uncert: { formula: "(D/2)^2", map: "<script>window.pwn=2</script> = sD" } });
writeFileSync(dir + "/hand.plotlab", save(hand));

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1200, height: 1900 } });
const p = await ctx.newPage();
const external = [];
p.on("request", r => { if (!r.url().startsWith("file:")) external.push(r.url()); });
await p.goto(pathToFileURL(resolve("app/index.html")).href);
const vals = j => p.evaluate(j => proj.columns[j].values, j);
const cellsText = j => p.$$eval(`td[data-calc="${j}"]`, e => e.map(x => x.textContent));
const addF = async (name, expr, unc = "") => { await p.fill("#f_name", name); await p.fill("#f_expr", expr); await p.fill("#f_unc", unc); await p.click("#f_add"); };

await p.fill("#paste", "R1 / Ω;sR1 / Ω;R2 / Ω;sR2 / Ω;R3 / Ω;sR3 / Ω\n100;0,5;200;1;400;2\n120;0,6;330;1,5;220;1,1");
await p.click("#pastego");
await p.waitForSelector("#plot .scatterlayer .point");
await addF("Rx / Ω", "R1*R2/R3", "R1 = sR1; R2 = sR2; R3 = sR3");
eq("no message", await p.isHidden("#fmsg"), true);
eq("two columns added", await p.evaluate(() => proj.columns.map(c => c.name).slice(6)), ["Rx / Ω", "u(Rx) / Ω"]);
near("Rx", await vals(6), [50, 180]);
near("u(Rx)", await vals(7), [0.4330127, 1.5130834]);
eq("u shown with decimal comma", await cellsText(7), ["0,43301270", "1,5130834"].map(t => t.replace(/0+$/, "")));
eq("header says how", await p.textContent("th:nth-child(9) .fx"), "Gauß-Fortpflanzung von R1*R2/R3: R1 = sR1; R2 = sR2; R3 = sR3");

// u(Rx) as the y error: the plot gets error bars of that size.
await p.selectOption('select[data-role="6"]', "y");
await p.selectOption('select[data-role="0"]', "x");
await p.selectOption('select[data-role="7"]', "yerr");
near("plot error bars", await p.evaluate(() => document.getElementById("plot").data[0].error_y.array), [0.4330127, 1.5130834]);
eq("axis label", await p.evaluate(() => document.getElementById("plot").layout.yaxis.title.text), "Rx / Ω");
await p.evaluate(() => { document.getElementById("table").scrollLeft = 1e5; });
await p.screenshot({ path: "evidence/phase2-step2-propagate.png", fullPage: true });

// Changing R3 in row 1 from 400 to 500 recalculates: Rx = 40, u = 40·0,005·√(1+1+(500·... in the head: rel(R3) = 2/500 = 0,004:
// rel² = 0,005² + 0,005² + 0,004² = 6,6e-5, u = 40·√6,6e-5 = 0,3249615.
await p.fill('input[data-r="0"][data-c="4"]', "500");
near("Rx after edit", (await vals(6)), [40, 180]);
near("u after edit", (await vals(7)), [0.3249615, 1.5130834]);
await p.click("#undo");
near("u after undo", (await vals(7)), [0.4330127, 1.5130834]);
// Reload and save/open keep the uncertainty column.
await p.reload(); await p.waitForSelector("td.calc");
near("after reload", await vals(7), [0.4330127, 1.5130834]);
const [dl] = await Promise.all([p.waitForEvent("download"), p.click("#saveproj")]);
const text = readFileSync(await dl.path(), "utf8");
eq("saved spec", JSON.parse(text).columns[7].uncert, { formula: "R1*R2/R3", map: "R1 = sR1; R2 = sR2; R3 = sR3" });
writeFileSync(dir + "/saved.plotlab", text);
await p.click("#example"); await p.setInputFiles("#openfile", dir + "/saved.plotlab"); await p.waitForSelector("td.calc");
near("after open", await vals(7), [0.4330127, 1.5130834]);
// Remove the u column.
await p.click('[data-delcol="7"]');
eq("u column removed", await p.evaluate(() => proj.columns.length), 7);

// Bad input: nothing is added, the message says what is wrong.
const n0 = 7;
const fails = [
  ["zz", "R1*R2", "R1 = sR1; Q = 1", "Unsicherheiten: Unbekannte Spalte „Q“."],
  ["zz", "R1*R2", "R3 = sR3", "Unsicherheiten: „R3“ kommt in der Formel nicht vor."],
  ["zz", "R1*R2", "R1", "„R1“: Es fehlt ein „=“. Schreibe zum Beispiel D = sD (Unsicherheit von D steht in Spalte sD) oder D = 0,05."],
  ["zz", "R1*R2", "R1 = sR1; R1 = 1", "Unsicherheiten: „R1“ ist doppelt angegeben."],
  ["Rx / Ω", "R1*R2", "R1 = sR1", "Es gibt schon eine Spalte „Rx / Ω“. Bitte einen anderen Namen wählen."],
];
for (const [name, f, u, want] of fails) {
  await addF(name, f, u);
  eq("message: " + u, await p.textContent("#fmsg"), want);
  eq("nothing added: " + u, await p.evaluate(() => proj.columns.length), n0);
}
// Negative uncertainty in the data: the column is added, the cell stays empty, the message names the row.
await p.fill('input[data-r="1"][data-c="1"]', "-0,6");
await addF("Rneg / Ω", "R1*R2/R3", "R1 = sR1");
eq("negative message", await p.textContent("#fmsg"), "Spalte „u(Rneg) / Ω“, Zeile 2: Die Unsicherheit ist negativ oder keine Zahl. Der Wert bleibt leer.");
eq("negative cell empty", (await cellsText(8))[1], "");
await p.screenshot({ path: "evidence/phase2-step2-error.png", fullPage: true });

// A hand-edited project file: nothing in names or specs runs.
await p.setInputFiles("#openfile", dir + "/hand.plotlab");
await p.waitForFunction(() => proj.columns.length === 4);
eq("no script ran", await p.evaluate(() => window.pwn), undefined);
eq("no injected elements", await p.$$eval("#table img, #table script, #fmsg img, #fmsg script", e => e.length), 0);
eq("hand project message is text", (await p.textContent("#fmsg")).startsWith("Spalte „<img src=x onerror=window.pwn=1>“: Unsicherheiten: Unbekannte Spalte „<script>"), true);
eq("no external requests", external, []);
await b.close();
if (bad) process.exit(1);
console.log("phase 2 step 2: uncertainty columns propagate, plot, undo, save and report errors in the real page");
