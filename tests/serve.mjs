// Tiny static server for browser tests: serves only app/ and testbuild/ of this repo on 127.0.0.1 (a module worker cannot start from file://).
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
const types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".wasm": "application/wasm", ".json": "application/json", ".woff2": "font/woff2", ".css": "text/css" };
const root = resolve(".");
const allowed = ["app/", "testbuild/"].map(d => resolve(d) + "/");
export async function serve() {
  const srv = createServer(async (req, res) => {
    try {
      const f = resolve(root, "." + decodeURIComponent(req.url.split("?")[0]));
      if (!allowed.some(d => f.startsWith(d))) throw new Error("outside");
      res.writeHead(200, { "content-type": types[extname(f)] || "application/octet-stream" }); res.end(await readFile(f));
    } catch { if (!res.headersSent) res.writeHead(404); res.end(); }
  }).listen(0, "127.0.0.1");
  await new Promise(r => srv.once("listening", r));
  return { base: `http://localhost:${srv.address().port}/`, close: () => srv.close() };
}
