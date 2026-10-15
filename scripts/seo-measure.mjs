// Counts what a student sees. One line per page: words in the first screen, words in the whole page, headings, buttons/links that look like buttons, page height.
// "Words" = visible text only (closed <details>, hidden tools, table cells and drawings are not counted: they are data or on demand).
// Usage: node scripts/seo-measure.mjs [baseUrl] [path ...]   (no baseUrl = serves app/ locally)  --json prints JSON.
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { serve } from "../tests/serve.mjs";
const chromium = createRequire(resolve("testbuild/x.js"))("playwright-core").chromium;

export const DEFAULT_PATHS = ["/", "/app.html"];
export async function measure(base, paths, { width = 1200, height = 800, locale = "de-DE" } = {}) {
  const b = await chromium.launch(), out = [];
  for (const path of paths) {
    const c = await b.newContext({ viewport: { width, height }, locale }), p = await c.newPage();
    await p.goto(new URL(path, base).href, { waitUntil: "networkidle" });
    await p.waitForTimeout(500);
    out.push({ path, width, ...(await p.evaluate(vh => {
      const skip = el => el.closest("script,style,noscript,svg,table,textarea,select,option,[hidden]") || !el.checkVisibility?.({ checkVisibilityCSS: true });
      const w = s => (s.match(/[\p{L}\p{N}][\p{L}\p{N}'’.,%±²³√χ-]*/gu) || []).length;
      let first = 0, total = 0;
      const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n; (n = tw.nextNode());) {
        const el = n.parentElement; if (!n.nodeValue.trim() || skip(el)) continue;
        const r = document.createRange(); r.selectNodeContents(n);
        const k = w(n.nodeValue); total += k;
        if (r.getBoundingClientRect().top < vh) first += k;
      }
      const vis = sel => [...document.querySelectorAll(sel)].filter(e => !e.closest("[hidden]") && e.checkVisibility?.({ checkVisibilityCSS: true }));
      return { first, total, headings: vis("h1,h2,h3").length, buttons: vis("button,.btn,input[type=button],summary").length, height: document.documentElement.scrollHeight, overflowX: document.documentElement.scrollWidth > innerWidth };
    }, height))});
    await c.close();
  }
  await b.close();
  return out;
}
if (process.argv[1].endsWith("seo-measure.mjs")) {
  const args = process.argv.slice(2).filter(a => a !== "--json"), json = process.argv.includes("--json");
  let base = args[0]?.startsWith("http") ? args.shift() : null, close = () => {};
  if (!base) ({ base, close } = await serve(["app/"], "app"));
  const paths = args.length ? args : DEFAULT_PATHS;
  const rows = [...await measure(base, paths), ...await measure(base, paths, { width: 375, height: 800 })];
  close();
  if (json) console.log(JSON.stringify(rows));
  else for (const r of rows) console.log(`${r.path} @${r.width}: first-screen words ${r.first}, total words ${r.total}, headings ${r.headings}, buttons ${r.buttons}, height ${r.height}px`);
}
