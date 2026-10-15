// Screenshot helper: node scripts/shot.mjs <path> <out.png> [width] [height] (serves app/ locally)
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { serve } from "../tests/serve.mjs";
const chromium = createRequire(resolve("testbuild/x.js"))("playwright-core").chromium;
const [path, out, w = 1200, h = 800] = process.argv.slice(2);
const { base, close } = await serve(["app/"], "app");
const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: +w, height: +h } })).newPage();
await p.goto(new URL(path, base).href, { waitUntil: "networkidle" }); await p.waitForTimeout(400);
await p.screenshot({ path: out, fullPage: true }); await b.close(); close();
