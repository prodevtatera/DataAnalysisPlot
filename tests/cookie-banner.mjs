// Cookie strip on both pages: shows once, "Allow" keeps saving, "No thanks" stops it and clears what was saved.
import { serve } from "./serve.mjs";
import { chromium } from "./tools.mjs";
let bad = 0;
const eq = (name, got, want) => {
  got = JSON.stringify(got); want = JSON.stringify(want);
  if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; }
};
// served like the real site (the pages use root-absolute addresses such as /i18n.js, which a file:// page cannot load)
const { base, close } = await serve(["app/"], "app");
const home = base, app = base + "app.html";
const b = await chromium.launch();
const bar = p => p.locator(".consent").count();

// Allow: bar on home, gone after the click and after a reload, also gone on the workbench; autosave works.
let ctx = await b.newContext(), p = await ctx.newPage();
await p.goto(home);
eq("home shows the strip", await bar(p), 1);
eq("german text", (await p.textContent(".consent p")).startsWith("Dürfen wir"), true);
await p.click('.consent [data-v="1"]');
eq("strip gone after Allow", await bar(p), 0);
await p.reload(); eq("still gone after reload", await bar(p), 0);
await p.goto(app); eq("workbench: no second question", await bar(p), 0);
await p.waitForFunction(() => localStorage.getItem("plotlab-autosave") !== null);
eq("autosave kept", await p.evaluate(() => localStorage.getItem("plotlab-consent")), "1");
await ctx.close();

// No thanks: workbench shows the strip in English, nothing is saved, saved data is removed.
ctx = await b.newContext(); p = await ctx.newPage();
await p.addInitScript(() => { if (!localStorage.getItem("plotlab-lang")) localStorage.setItem("plotlab-lang", "en"); });
await p.goto(app);
eq("workbench shows the strip", await bar(p), 1);
eq("english text", (await p.textContent(".consent p")).startsWith("May we remember"), true);
await p.waitForFunction(() => localStorage.getItem("plotlab-autosave") !== null); // undecided: saves as before
await p.click('.consent [data-v="0"]');
eq("strip gone after No thanks", await bar(p), 0);
eq("saved project and language removed", await p.evaluate(() => [localStorage.getItem("plotlab-autosave"), localStorage.getItem("plotlab-lang")]), [null, null]);
await p.click("#example"); await p.waitForTimeout(500);
eq("nothing saved after No thanks", await p.evaluate(() => localStorage.getItem("plotlab-autosave")), null);
await ctx.close();
await b.close(); close();
if (bad) { console.log(`${bad} failed`); process.exit(1); }
console.log("cookie banner: all checks passed");
