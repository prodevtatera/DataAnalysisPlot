// The text budget (docs/seo-report.md): students are overwhelmed by text, so each page has a word limit.
// Baseline before the cut (git commit 0c24cf2, visible words, 1200x800): home German 289 total / 133 first screen, English 333 / 146, workbench 225 / 88.
// Budget: home pages at most 60 % of the baseline in each language (total and first screen), workbench first screen at most 150, every other page at most 200 words.
import { serve } from "./serve.mjs";
import { measure } from "../scripts/seo-measure.mjs";
let bad = 0;
const yes = (name, v, extra = "") => { if (!v) { console.log(`FAIL ${name} ${extra}`); bad++; } };
const { base, close } = await serve(["app/"], "app");
const pages = ["/", "/en/", "/app.html", "/versuche/", "/en/experiments/", "/methode/", "/en/method/", ...["elastizitaet", "pendel", "radioaktivitaet-zaehlraten", "gitter"].map(s => `/versuche/${s}/`), "/en/experiments/elasticity/", "/en/experiments/diffraction-grating/"];
for (const [width, height] of [[1200, 800], [375, 800]]) {
  for (const r of await measure(base, pages, { width, height })) {
    const tag = `${r.path} @${width}`;
    console.log(`${tag}: first screen ${r.first}, total ${r.total}`);
    if (r.path === "/") { yes(tag + " total <= 173", r.total <= 173, r.total); if (width === 1200) yes(tag + " first screen <= 79", r.first <= 79, r.first); }
    else if (r.path === "/en/") { yes(tag + " total <= 199", r.total <= 199, r.total); if (width === 1200) yes(tag + " first screen <= 87", r.first <= 87, r.first); }
    else if (r.path === "/app.html") yes(tag + " first screen <= 150", r.first <= 150, r.first);
    else yes(tag + " total <= 200", r.total <= 200, r.total);
    yes(tag + " no horizontal scroll", !r.overflowX);
  }
}
close();
console.log(bad ? `${bad} FAILED` : "text budget holds");
process.exit(bad ? 1 : 0);
