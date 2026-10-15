// Makes app/og.png (1200x630, the picture shown when a link to the site is shared) from the real example plot on the home page.
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { serve } from "../tests/serve.mjs";
const chromium = createRequire(resolve("testbuild/x.js"))("playwright-core").chromium;
const { base, close } = await serve(["app/"], "app");
const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1200, height: 630 } })).newPage();
await p.goto(base, { waitUntil: "networkidle" });
const svg = await p.evaluate(() => document.getElementById("plot").outerHTML);
const res = await p.textContent("#res");
await p.setContent(`<link rel="stylesheet" href="${base}home.css"><style>body{margin:0;width:1200px;height:630px;display:grid;grid-template-columns:1fr 520px;gap:40px;align-items:center;padding:0 64px;box-sizing:border-box;background:linear-gradient(135deg,#EEF0FF 0%,#F3EEFF 55%,#FFF1E6 100%)}
h1{font-size:56px;margin:0 0 20px}p{font-size:28px;line-height:38px;margin:0;color:#565B7A}.logo{display:flex;align-items:center;gap:14px;font:700 34px Barlow;margin-bottom:28px}.logo img{width:64px;height:64px;border-radius:50%}
.card{background:#fff;border-radius:24px;padding:16px;box-shadow:0 6px 24px rgba(79,70,229,.18)}.res{font:700 30px Barlow;color:#4F46E5;background:#EEF0FF;border-radius:12px;padding:8px 14px;margin-top:10px}</style>
<div><div class="logo"><img src="${base}logo.jpg">PlotLab</div><h1>Vom Messwert zum fertigen Protokoll-Diagramm</h1><p>Kostenlos, im Browser, ohne Anmeldung.</p></div>
<div class="card">${svg}<div class="res">${res}</div></div>`, { waitUntil: "networkidle" });
await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: "app/og.png" });
await b.close(); close();
