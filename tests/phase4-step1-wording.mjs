// Phase 4 step 1: no page names the university; the footer says the same sentence in both languages and follows the switch.
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { readFileSync, readdirSync } from "node:fs";
import { serve } from "./serve.mjs";
import { chromium } from "./tools.mjs";
let bad = 0;
const eq = (name, got, want) => { got = JSON.stringify(got); want = JSON.stringify(want); if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; } };
const DE = "Unabhängiges Studierendenwerkzeug. Nicht mit der Universität verbunden.";
const EN = "Independent student tool. Not affiliated with the university.";

// Everything a user can see lives in these files (the vendor and font folders are other people's files).
const files = [...readdirSync("app").filter(f => /\.(html|js)$/.test(f)).map(f => "app/" + f), "testbuild/index.html", "draft/index.html"];
for (const f of files) eq(`${f}: no "Humboldt"`, /Humboldt/i.test(readFileSync(f, "utf8")), false);

const { base, close } = await serve(["app/", "draft/"]);
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1200, height: 800 } })).newPage();
const errors = [];
p.on("pageerror", e => errors.push(String(e)));
const foot = () => p.textContent("footer");

// The workbench, German first, then English, then German again.
await p.goto(base + "app/app.html");
eq("app footer, German", await foot(), DE);
await p.click("#lang_en");
eq("app footer, English", await foot(), EN);
await p.reload();
eq("app footer, English after reload", await foot(), EN);
await p.screenshot({ path: "evidence/phase4-step1-footer-en.png", fullPage: true });
await p.click("#lang_de");
eq("app footer, German again", await foot(), DE);

// The draft page: both languages.
await p.goto(base + "draft/index.html");
eq("draft footer, German", await foot(), DE);
await p.click('[data-lang="en"]');
eq("draft footer, English", await foot(), EN);

await b.close(); close();
eq("no page errors", errors, []);
if (bad) { console.log(`${bad} check(s) failed`); process.exit(1); }
console.log("phase4-step1-wording: all checks passed");
