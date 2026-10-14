// Step 5: first-load time and download size, then a repeat visit. Writes docs/phase0-timing.md.
// The server sends the long cache header that the real hosting must also send; without it a repeat visit downloads everything again.
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { gzipSync } from "node:zlib";
import os from "node:os";
const { chromium } = createRequire(resolve("testbuild/x.js"))("playwright-core");
const types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".wasm": "application/wasm", ".json": "application/json", ".woff2": "font/woff2", ".css": "text/css", ".zip": "application/zip", ".whl": "application/octet-stream" };
const root = resolve("testbuild");
const safe = u => { const f = resolve(root, "." + u); if (!f.startsWith(root + "/")) throw new Error("outside"); return f; };
let served = 0; // bytes the server sent: the true download, including files the Python worker fetches
const srv = createServer(async (req, res) => {
  try { let p = decodeURIComponent(req.url.split("?")[0]); if (p === "/") p = "/index.html";
    res.writeHead(200, { "content-type": types[extname(p)] || "application/octet-stream", "cache-control": "public, max-age=3600" }); const f = await readFile(safe(p)); served += f.length; res.end(f); }
  catch { res.writeHead(404); res.end(); }
}).listen(0, "127.0.0.1");
await new Promise(r => srv.once("listening", r));
const url = `http://127.0.0.1:${srv.address().port}/`;
// A persistent profile gives a real on-disk cache, like a student's browser; a throw-away context only has a small memory cache.
import { mkdtempSync, rmSync } from "node:fs";
const profile = mkdtempSync(os.tmpdir() + "/plotlab-");
const ctx = await chromium.launchPersistentContext(profile);
const br = { version: () => ctx.browser().version(), close: async () => { await ctx.close(); rmSync(profile, { recursive: true, force: true }); } };
let bad = 0;
const visit = async () => {
  const p = await ctx.newPage();
  const files = new Map();
  p.on("response", async r => { try { const b = await r.body(); files.set(r.url(), b); } catch {} });
  served = 0;
  const t0 = Date.now();
  await p.goto(url);
  await p.waitForFunction(() => !document.getElementById("fit").disabled, null, { timeout: 180000 });
  const ready = Date.now() - t0;
  const net = served;
  await p.click("#example"); await p.waitForSelector("#plot .point");
  const t1 = Date.now(); await p.click("#fit"); await p.waitForSelector("#fitres .res");
  const fit = Date.now() - t1;
  await p.close();
  return { ready, net, fit, files };
};
const first = await visit();
const second = await visit();
let raw = 0, gz = 0; for (const b of first.files.values()) { raw += b.length; gz += gzipSync(b, { level: 6 }).length; }
const mb = n => (n / 1e6).toFixed(1) + " MB";
const secs = ms => (ms / 1000).toFixed(1) + " s";
const msf = ms => ms + " ms";
const md = `# Load time and download size (test build)

Measured by \`tests/step5-load.sh\` on: ${os.cpus()[0].model}, ${os.cpus().length} cores, ${(os.totalmem() / 2 ** 30).toFixed(0)} GB RAM, ${os.type()} ${os.release()}, Chromium ${br.version()} (headless, Playwright). Local web server, so there is no network delay: the times are the browser's own work (download from disk, unpack, start Python). Dataset: the 5-point example, weighted straight line.

| | First visit | Repeat visit (cache) |
|---|---|---|
| Ready to fit (button enabled) | ${secs(first.ready)} | ${secs(second.ready)} |
| Bytes loaded from the network | ${mb(first.net)} | ${mb(second.net)} |
| Time for one fit (press "Anpassen" to result) | ${msf(first.fit)} | ${msf(second.fit)} |

Files loaded on a first visit: ${first.files.size}. Total size: ${mb(raw)} as stored, about ${mb(gz)} gzip-compressed (what a real server would send).
Estimated first-visit download time: about ${secs(gz * 8 / 50e6 * 1000)} at 50 Mbit/s, about ${secs(gz * 8 / 10e6 * 1000)} at 10 Mbit/s (university Wi-Fi in a crowded lecture hall), plus the browser's own ${secs(first.ready)}.

The repeat visit works only because the server sends \`cache-control: public, max-age=3600\` (or longer). The real hosting must do the same, and must also compress (gzip or brotli). Measured once with a throw-away in-memory browser profile (like a private window): the two largest files (the SciPy package and the Python engine, together 23.6 MB as stored) were downloaded again on the repeat visit. A normal window with a disk cache did not.
`;
await writeFile("docs/phase0-timing.md", md);
console.log(md);
// Gate: a repeat visit must not download the engine again.
if (second.net > 1e6) { console.log(`FAIL repeat visit loaded ${mb(second.net)} from the network`); bad++; }
if (first.ready > 120000) { console.log("FAIL first load took over 2 minutes"); bad++; }
await br.close(); srv.close();
if (bad) process.exit(1);
console.log("step 5: measured, repeat visit is served from cache");
