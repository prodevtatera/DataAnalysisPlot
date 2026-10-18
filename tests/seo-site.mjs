// SEO / AEO / GEO checks of the built site (static, no browser): head tags, language links, sitemap, robots, llms.txt, JSON-LD, fact sheet, internal links.
// Nothing here is a number of the app. Expected values are the rules written in docs/loop-prompt-seo.md.
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
let bad = 0;
const yes = (name, v, extra = "") => { if (!v) { console.log(`FAIL ${name} ${extra}`); bad++; } };
const APP = resolve("app"), SITE = "https://plot.productledlab.dev";
const read = rel => readFileSync(resolve(APP, rel), "utf8");
const { spawnSync } = await import("node:child_process");
const chk = spawnSync("node", ["scripts/build-pages.mjs", "--check"], { encoding: "utf8" });
yes("generated pages are current", chk.status === 0, chk.stdout);
const { FACTS } = await import("../scripts/build-pages.mjs"); // (loading it rebuilds the files; the check above ran first)

// pages = the URLs of the sitemap
const sitemap = read("sitemap.xml");
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
yes("sitemap has the 32 expected pages", locs.length === 32, String(locs.length));
const fileOf = u => { const p = u.replace(SITE, ""); return p.endsWith("/") ? p.slice(1) + "index.html" : p.slice(1); };
const html = {}; for (const u of locs) { yes("page file exists " + u, existsSync(resolve(APP, fileOf(u)))); html[u] = read(fileOf(u)); }

// every index.html under app/ except the workbench is in the sitemap, and nothing else is
const found = []; (function walk(d, rel = "") { for (const n of readdirSync(d)) { if (n === "vendor" || n === "fonts" || n.startsWith(".")) continue; const f = resolve(d, n), r = rel + n; if (statSync(f).isDirectory()) walk(f, r + "/"); else if (n === "index.html") found.push(r); } })(APP);
yes("sitemap lists exactly the index.html pages", JSON.stringify(found.sort()) === JSON.stringify(locs.map(fileOf).sort()), JSON.stringify(found));

const titles = new Set(), descs = new Set();
const attr = (h, re) => (h.match(re) || [])[1];
const textOf = h => h.replace(/<(script|style)[\s\S]*?<\/\1>/g, " ").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/\s+/g, " ");
const outOf50to60 = [];
for (const u of locs) {
  const h = html[u], path = u.replace(SITE, ""), en = path.startsWith("/en/");
  const title = attr(h, /<title>([^<]*)<\/title>/), desc = attr(h, /<meta name="description" content="([^"]*)"/);
  yes("title 40-65 chars " + path, title && title.length >= 40 && title.length <= 65, `${title?.length}`);
  if (title && (title.length < 50 || title.length > 60)) outOf50to60.push(path + " " + title.length);
  yes("description 110-160 chars " + path, desc && desc.length >= 110 && desc.length <= 160, `${desc?.length}`);
  yes("unique title " + path, !titles.has(title)); titles.add(title); yes("unique description " + path, !descs.has(desc)); descs.add(desc);
  yes("title ends with brand " + path, title?.endsWith("| PlotLab"));
  yes("canonical is own address " + path, attr(h, /<link rel="canonical" href="([^"]*)"/) === u);
  yes("html lang " + path, attr(h, /<html lang="(\w+)"/) === (en ? "en" : "de"));
  yes("one h1 " + path, (h.match(/<h1[ >]/g) || []).length === 1);
  yes("indexable (no noindex) " + path, !/content="noindex/.test(h));
  yes("og:image and twitter card " + path, h.includes(`<meta property="og:image" content="${SITE}/og.png">`) && h.includes('name="twitter:card"'));
  yes("viewport meta " + path, h.includes('name="viewport"'));
  // hreflang: both languages and x-default, and the partner page points back
  const alt = l => attr(h, new RegExp(`<link rel="alternate" hreflang="${l}" href="([^"]*)"`));
  yes("hreflang de/en/x-default " + path, alt("de") && alt("en") && alt("x-default") === alt("de"));
  const partner = html[en ? alt("de") : alt("en")];
  yes("partner page exists and links back " + path, partner && attr(partner, /hreflang="en" href="([^"]*)"/) === alt("en") && attr(partner, /hreflang="de" href="([^"]*)"/) === alt("de"));
  // crawlable without JavaScript: real text in the HTML
  yes("text present without JavaScript " + path, textOf(h.slice(h.indexOf("<body"))).split(" ").length > 80);
  // images have alt; no address outside the site in src/href
  yes("every img has alt " + path, [...h.matchAll(/<img\b[^>]*>/g)].every(m => /\balt=/.test(m[0])));
  const ext = [...h.matchAll(/\b(?:src|href)="(https?:\/\/[^"]*)"/g)].map(m => m[1]).filter(x => !x.startsWith(SITE));
  yes("no outside address in src/href " + path, ext.length === 0, ext.join(" "));
  // internal links resolve
  for (const m of h.matchAll(/\bhref="(\/[^"#?]*)/g)) { const f = m[1].endsWith("/") ? m[1].slice(1) + "index.html" : m[1].slice(1); yes(`link ${m[1]} resolves (${path})`, existsSync(resolve(APP, f))); }
  // JSON-LD parses; has the right types
  const ld = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
  yes("JSON-LD present " + path, ld.length >= 1);
  const types = ld.flatMap(x => (x["@graph"] || [x]).map(n => n["@type"]));
  const crumbs = ld.flatMap(x => (x["@graph"] || [x])).find(n => n["@type"] === "BreadcrumbList");
  if (path !== "/" && path !== "/en/") yes("breadcrumb JSON-LD " + path, crumbs && crumbs.itemListElement.at(-1).item === u);
  if (path === "/" || path === "/en/") {
    yes("home JSON-LD types " + path, ["WebSite", "WebApplication", "FAQPage"].every(t => types.includes(t)), types.join());
    const g = ld[0]["@graph"], app = g.find(n => n["@type"] === "WebApplication"), faq = g.find(n => n["@type"] === "FAQPage");
    yes("app is free (offer 0 EUR) and the page says free " + path, app.offers.price === "0" && app.offers.priceCurrency === "EUR" && app.isAccessibleForFree === true && /kostenlos|free/i.test(textOf(h)));
    yes("no rating or review invented " + path, !/aggregateRating|"review"/.test(h));
    yes("FAQ: 5 questions, each question and answer is on the page " + path, faq.mainEntity.length === 5 && faq.mainEntity.every(q => textOf(h).includes(q.name) && textOf(h).includes(q.acceptedAnswer.text)));
    yes("featureList is in the visible FAQ " + path, textOf(h).includes(app.featureList));
    yes("both languages are offered by links " + path, h.includes('hreflang="de"') && h.includes('hreflang="en"') && (h.match(/data-home-lang/g) || []).length === 2);
  }
}
yes("noindex pages: workbench and 404", /content="noindex/.test(read("app.html")) && /content="noindex/.test(read("404.html")));

// robots.txt, llms.txt
const robots = read("robots.txt");
yes("robots: sitemap line", robots.includes(`Sitemap: ${SITE}/sitemap.xml`));
yes("robots: nothing blocked", !/^\s*Disallow:\s*\S/m.test(robots));
for (const bot of ["GPTBot", "OAI-SearchBot", "ClaudeBot", "PerplexityBot", "Google-Extended"]) yes("robots allows " + bot, new RegExp(`User-agent: ${bot}\\nAllow: /`).test(robots));
const llms = read("llms.txt");
yes("llms.txt starts with # PlotLab and has a summary", llms.startsWith("# PlotLab\n\n> "));
for (const m of llms.matchAll(/\]\((https:[^)]+)\)/g)) yes("llms.txt link is a sitemap page " + m[1], locs.includes(m[1]));

// the fact sheet is worded the same everywhere
const home = { de: html[SITE + "/"], en: html[SITE + "/en/"] }, method = { de: html[SITE + "/methode/"], en: html[SITE + "/en/method/"] };
for (const l of ["de", "en"]) {
  for (const k of ["price", "privacy", "fits", "round"]) yes(`fact "${k}" (${l}) is on the home page`, textOf(home[l]).includes(FACTS[l][k]));
  yes(`fact "round" (${l}) is on the method page`, textOf(method[l]).includes(FACTS[l].round));
  yes(`fact "what" (${l}) is in the home JSON-LD description and llms.txt`, home[l].includes(FACTS[l].what.replace(/"/g, '\\"')) && llms.includes(FACTS[l].what));
}
yes("llms.txt carries the English facts", ["price", "privacy", "fits", "round", "nist"].every(k => llms.includes(FACTS.en[k])));
// the numbers on the method page come from the reports
const r5 = readFileSync("docs/phase5-report.md", "utf8"), r1 = readFileSync("docs/phase1-report.md", "utf8");
yes("method page: '6,5 bis 9 Stellen' is in the phase 5 report as 6.5 to 9 digits", r5.includes("6.5 to 9 digits") && textOf(method.de).includes("6,5 bis 9 Stellen") && textOf(method.en).includes("6.5 to 9 digits"));
yes("method page: Norris 36 points, 9 digits is in the phase 1 report", /Norris \(36 points\)/.test(r1) && /9 or more digits/.test(r1) && textOf(method.en).includes("Norris (36 points)"));
// each experiment page has a first paragraph and a way into the workbench
for (const u of locs.filter(u => /\/(versuche|experiments)\/[^/]+\/$/.test(u))) {
  const h = html[u], id = attr(h, /href="\/app\.html\?start=(\w+)"/);
  yes("experiment page opens its template " + u, id && /^p\d[ab]?$/.test(id));
  yes("experiment page: answer paragraph and numbered steps " + u, /<p class="answer">[^<]{40,}<\/p>/.test(h) && (h.match(/<li>/g) || []).length >= 1);
}
// vercel.json: parses, trailing slash, long cache for the big files
const vj = JSON.parse(read("vercel.json"));
yes("vercel.json: trailingSlash and cache headers", vj.trailingSlash === true && JSON.stringify(vj.headers).includes("/vendor/(.*)") && JSON.stringify(vj.headers).includes("immutable"));
console.log(`titles outside 50-60 characters (allowed 40-65): ${outOf50to60.length ? outOf50to60.join("; ") : "none"}`);
console.log(bad ? `${bad} FAILED` : "all SEO site checks passed");
process.exit(bad ? 1 : 0);
