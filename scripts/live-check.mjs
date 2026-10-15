// Checks the real site (or any base address) against the files in app/: every page byte for byte, the redirects, the 404, the content types and the headers.
// Usage: node scripts/live-check.mjs [baseUrl]   (default https://plot.productledlab.dev)
import { readFileSync } from "node:fs";
let bad = 0;
const yes = (name, v, extra = "") => { if (!v) { console.log(`FAIL ${name} ${extra}`); bad++; } };
const BASE = (process.argv[2] || "https://plot.productledlab.dev").replace(/\/$/, "");
const get = (path, o = {}) => fetch(BASE + path, { redirect: "manual", ...o });
const local = rel => readFileSync(new URL("../app/" + rel, import.meta.url), "utf8");
const locs = [...local("sitemap.xml").matchAll(/<loc>https:\/\/plot\.productledlab\.dev([^<]*)<\/loc>/g)].map(m => m[1]);
yes("30 pages in the sitemap", locs.length === 30);
for (const p of locs) {
  const r = await get(p), body = await r.text();
  yes(`${p}: 200 html`, r.status === 200 && /text\/html/.test(r.headers.get("content-type")), `${r.status} ${r.headers.get("content-type")}`);
  yes(`${p}: same bytes as app/`, body === local(p.endsWith("/") ? p.slice(1) + "index.html" : p.slice(1)));
}
for (const [p, type] of [["/robots.txt", /text\/plain/], ["/sitemap.xml", /xml/], ["/llms.txt", /text\/plain/], ["/og.png", /image\/png/], ["/aae30dfeca58bcb0be744b93d962e6bc.txt", /text\/plain/], ["/home.css", /css/], ["/app.html", /text\/html/]]) {
  const r = await get(p); yes(`${p}: 200 and right content type`, r.status === 200 && type.test(r.headers.get("content-type")), `${r.status} ${r.headers.get("content-type")}`);
}
for (const f of ["robots.txt", "sitemap.xml", "llms.txt"]) yes(`${f}: same bytes as app/`, (await (await get("/" + f)).text()) === local(f));
const app = await (await get("/app.html")).text(); yes("workbench has noindex", /content="noindex/.test(app));
// redirects and 404
for (const [from, to] of [["/index.html", "/"], ["/en/index.html", "/en/"], ["/en", "/en/"], ["/versuche", "/versuche/"]]) {
  const r = await get(from), loc = r.headers.get("location") || "";
  yes(`${from} redirects (301/308) to ${to}`, [301, 308].includes(r.status) && new URL(loc, BASE).pathname === to, `${r.status} ${loc}`);
}
{ const r = await get("/gibt-es-nicht/"); yes("missing page is a real 404 with the 404 page", r.status === 404 && (await r.text()).includes("Seite nicht gefunden"), String(r.status)); }
// headers
{ const r = await get("/"); for (const [k, v] of [["x-content-type-options", "nosniff"], ["referrer-policy", "strict-origin-when-cross-origin"], ["x-frame-options", "SAMEORIGIN"]]) yes(`header ${k}`, r.headers.get(k) === v, String(r.headers.get(k)));
  yes("HTML is revalidated, not cached for long", /max-age=0|no-cache|must-revalidate/.test(r.headers.get("cache-control") || ""), String(r.headers.get("cache-control"))); }
for (const p of ["/vendor/pyodide/pyodide.asm.wasm", "/fonts/barlow-latin-700-normal.woff2"]) { const r = await get(p); yes(`${p}: long cache`, r.status === 200 && /max-age=31536000/.test(r.headers.get("cache-control") || "") && /immutable/.test(r.headers.get("cache-control") || ""), `${r.status} ${r.headers.get("cache-control")}`); }
{ const r = await fetch(BASE + "/", { headers: { "accept-encoding": "br, gzip" } }); yes("home is compressed", !!r.headers.get("content-encoding"), String(r.headers.get("content-encoding"))); }
console.log(bad ? `${bad} FAILED against ${BASE}` : `live check passed against ${BASE}`);
process.exit(bad ? 1 : 0);
