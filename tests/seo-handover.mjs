// From a finished experiment page, the button must open the workbench in the page's own language, even if the student chose the other language earlier.
import { serve } from "./serve.mjs";
import { chromium } from "./tools.mjs";
let bad = 0;
const eq = (name, got, want) => { got = JSON.stringify(got); want = JSON.stringify(want); if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; } };
const { base, close } = await serve(["app/"], "app");
const b = await chromium.launch(), errors = [];
const p = await (await b.newContext({ viewport: { width: 1200, height: 800 } })).newPage();
p.on("pageerror", e => errors.push(String(e)));
const open = async path => { await p.goto(base + path); await Promise.all([p.waitForURL(/app\.html/), p.click(".btn")]); await p.waitForFunction(() => document.getElementById("tpl_info") && !document.getElementById("tpl_info").hidden, null, { timeout: 120000 }); return p.evaluate(() => [document.documentElement.lang, document.getElementById("tpl_info").textContent.slice(0, 12)]); };
eq("German page opens the German workbench", await open("versuche/elastizitaet/"), ["de", "P3 Elastizit"]);
eq("English page opens the English workbench", await open("en/experiments/elasticity/"), ["en", "P3 Elasticit"]);
eq("German page again, after English was chosen", await open("versuche/pendel/"), ["de", "P9 PendelErf"]);
eq("no script errors", errors, []);
await b.close(); close();
console.log(bad ? `${bad} FAILED` : "experiment pages hand over to the workbench in the right language");
process.exit(bad ? 1 : 0);
