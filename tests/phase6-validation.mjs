// Phase 6: the "Geprüft" page (app/pruefung.html). It must show NIST's certified values, recalculate them in the browser and turn green only when every dataset passes.
// Expected numbers come from tests/nist/*.dat (through scripts/make-validation.mjs), never from the app's own maths.
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { serve } from "./serve.mjs";
import { chromium } from "./tools.mjs";
let bad = 0;
const eq = (name, got, want) => { got = JSON.stringify(got); want = JSON.stringify(want); if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; } else console.log(`ok   ${name}`); };
const yes = (name, v) => eq(name, !!v, true);

// ---- the data file is exactly what the NIST files give (a hand edit would be caught here)
const before = readFileSync("app/validation-data.json", "utf8");
execFileSync("node", ["scripts/make-validation.mjs"]);
yes("validation-data.json equals a fresh build from tests/nist/*.dat", before === readFileSync("app/validation-data.json", "utf8"));
const data = JSON.parse(before);
eq("12 NIST datasets", data.length, 12);
eq("Norris certified slope B1 (NIST file)", data[0].cert[1][0], 1.00211681802045);
eq("Misra1a certified b1 (NIST file)", data[5].cert[0][0], 238.94212918);

// ---- the verdict logic: right numbers pass, wrong numbers fail (so the page cannot be green by default)
const js = readFileSync("app/pruefung.js", "utf8");
const { judge } = new Function(js.slice(0, js.indexOf("// ---- end of the part")) + "; return {judge};")();
const m = data[5];   // Misra1a
const good = { names: ["b1", "b2"], p: m.cert.map(c => c[0]), err_scaled: m.cert.map(c => c[1]), ssr: m.ssr, dof: m.dof };
yes("Misra1a with NIST's own numbers passes", judge(m, good).ok);
yes("a value off in the 4th digit fails", !judge(m, { ...good, p: [good.p[0] * 1.0001, good.p[1]] }).ok);
yes("an error off in the 2nd digit fails", !judge(m, { ...good, err_scaled: [good.err_scaled[0] * 1.05, good.err_scaled[1]] }).ok);
yes("a wrong degrees of freedom fails", !judge(m, { ...good, dof: m.dof + 1 }).ok);
yes("a wrong sum of squares fails", !judge(m, { ...good, ssr: m.ssr * 1.001 }).ok);

// ---- the real page
const { base, close } = await serve(["app/"], "app");
const b = await chromium.launch(), pg = await b.newPage(), errors = [];
pg.on("pageerror", e => errors.push(String(e))); pg.on("console", m => m.type() === "error" && errors.push(m.text()));
await pg.goto(base + "pruefung.html");
await pg.waitForSelector("#rows tr");
eq("12 rows before any calculation", await pg.locator("#rows > tr").count(), 12);
yes("all rows say 'wartet' at first", (await pg.locator("#rows .res").allTextContents()).every(s => s === "wartet"));
yes("no green banner before the check has run", !(await pg.locator("#status.ok").count()));
await pg.click("#run");
await pg.waitForSelector("#status.ok, #status.bad", { timeout: 180000 });
eq("banner is green", await pg.locator("#status.ok").count(), 1);
eq("banner text", (await pg.locator("#status strong").textContent()), "✓ Alle 12 Prüfungen bestanden");
const res = await pg.locator("#rows .res").allTextContents();
eq("every row is '✓ bestanden'", res.filter(s => s === "✓ bestanden").length, 12);
const digits = await pg.locator("#rows > tr").evaluateAll(trs => trs.map(tr => [tr.cells[3].textContent, tr.cells[4].textContent]));
yes("value digits shown are numbers >= 6 in every row", digits.every(([v]) => Number(v.replace(",", ".")) >= 6));
yes("error digits shown are numbers >= 4 in every row", digits.every(([, s]) => Number(s.replace(",", ".")) >= 4));
const norris = await pg.locator("#rows > tr").first().innerText();
yes("Norris row names the straight-line tool", norris.includes("Ausgleichsgerade"));
await pg.click("#lang_en");
eq("English banner", await pg.locator("#status strong").textContent(), "✓ All 12 checks passed");
eq("no page errors", errors, []);

// ---- the badge on the two other pages leads here
for (const page of ["index.html", "app.html"]) {
  await pg.goto(base + page);
  const a = pg.locator("a.proof");
  eq(`${page}: badge present`, await a.count(), 1);
  eq(`${page}: badge points to /pruefung.html`, await a.getAttribute("href"), "/pruefung.html");
}
await b.close(); close();
if (bad) process.exit(1);
console.log("phase 6: the Geprüft page shows NIST values, recalculates them in the browser and is green only when all pass");
