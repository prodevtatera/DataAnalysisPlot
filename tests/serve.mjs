// Tiny static server for browser tests: serves only app/ (or the folders given) of this repo on 127.0.0.1 (a module worker cannot start from file://).
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
const types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".wasm": "application/wasm", ".json": "application/json", ".woff2": "font/woff2", ".css": "text/css" };
const root = resolve(".");
// Default: app/ only, so every app test fails if app/ still reads a file from testbuild/. Phase 0 tests also pass "testbuild/".
// webroot: serve that folder as the web root instead (the way a host serves app/): "/" then shows its index.html.
export async function serve(dirs = ["app/"], webroot = null) {
  const allowed = dirs.map(d => resolve(d) + "/");
  const srv = createServer(async (req, res) => {
    try {
      let path = decodeURIComponent(req.url.split("?")[0]);
      if (webroot && path.endsWith("/")) path += "index.html";
      const f = resolve(webroot || root, "." + path);
      if (!allowed.some(d => f.startsWith(d))) throw new Error("outside");
      res.writeHead(200, { "content-type": types[extname(f)] || "application/octet-stream" }); res.end(await readFile(f));
    } catch { if (!res.headersSent) res.writeHead(404); res.end(); }
  }).listen(0, "127.0.0.1");
  await new Promise(r => srv.once("listening", r));
  return { base: `http://localhost:${srv.address().port}/`, close: () => srv.close() };
}
