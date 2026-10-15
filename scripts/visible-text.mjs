// Prints the visible text of a page, one block per line (to see what a student has to read). Usage: node scripts/visible-text.mjs <path> [width]
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { serve } from "../tests/serve.mjs";
const chromium = createRequire(resolve("testbuild/x.js"))("playwright-core").chromium;
const [path, w = 1200] = process.argv.slice(2);
const { base, close } = await serve(["app/"], "app");
const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: +w, height: 800 } })).newPage();
await p.goto(new URL(path, base).href, { waitUntil: "networkidle" }); await p.waitForTimeout(3500);
console.log(await p.evaluate(() => document.body.innerText));
await b.close(); close();
