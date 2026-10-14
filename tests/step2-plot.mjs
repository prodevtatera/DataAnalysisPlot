// Step 2: drives the real page. Expected values are typed by hand from the example data in the input.
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
const { chromium } = createRequire(resolve("testbuild/x.js"))("playwright-core");
const url = pathToFileURL(resolve("testbuild/index.html")).href;
let bad = 0;
const eq = (name, got, want) => {
  got = JSON.stringify(got); want = JSON.stringify(want);
  if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; }
};
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 1100 } });
const external = [];
p.on("request", r => { if (!r.url().startsWith("file:")) external.push(r.url()); });
await p.goto(url);
const plotText = () => p.$$eval("#plot .xtitle, #plot .ytitle, #plot .legendtext, #plot .xtick text, #plot .ytick text", t => t.map(x => x.textContent));
const data = () => p.evaluate(() => { const d = document.getElementById("plot").data; return d && d.map(t => ({ x: t.x, y: t.y, err: t.error_y && t.error_y.array })); });

await p.click("#example");
await p.waitForSelector("#plot .scatterlayer .point");
eq("5 points drawn", await p.$$eval("#plot .scatterlayer .point", e => e.length), 5);
eq("no placeholder text next to plot", await p.$$eval("#plot .empty", e => e.length), 0);
eq("one error bar per point", await p.$$eval("#plot .errorbar", e => e.length), 5);
eq("error bar segments", await p.$$eval("#plot .errorbar path", e => e.length), 5);
eq("plotted data", await data(), [{ x: [1, 2, 3, 4, 5], y: [2.1, 4.3, 6.2, 8.4, 9.9], err: [0.2, 0.2, 0.3, 0.3, 0.4] }]);
const t = await plotText();
eq("x axis label", t.includes("t / s"), true);
eq("y axis label", t.includes("U / V"), true);
eq("legend names series", t.includes("Messwerte"), true);
eq("decimal comma on ticks", t.some(x => /^\d+,\d+$/.test(x)), true);
eq("no decimal point on ticks", t.some(x => /^\d+\.\d+$/.test(x)), false);
await p.screenshot({ path: "evidence/step2-plot.png", fullPage: true });

// Editing the input redraws the plot
await p.fill("#in", "L / cm;F / N\n1;2\n2;5");
await p.waitForFunction(() => document.getElementById("plot").data[0].x.length === 2);
eq("no error bars without third column", await p.$$eval("#plot .errorbar path", e => e.length), 0);
eq("y label follows header", (await plotText()).includes("F / N"), true);

// Bad input: plot is cleared with a plain message, no stale chart
await p.fill("#in", "x;y\n1;abc");
eq("plot removed on bad input", await p.$$eval("#plot .scatterlayer", e => e.length), 0);
eq("plot placeholder", await p.textContent("#plot"), "Noch keine Daten.");
// One column only
await p.fill("#in", "x\n1\n2");
eq("one column message", await p.textContent("#plot"), "Für ein Diagramm braucht es mindestens zwei Spalten (x und y).");
await p.screenshot({ path: "evidence/step2-plot-error.png", fullPage: true });
eq("No external requests", external, []);
await b.close();
if (bad) process.exit(1);
console.log("step 2: points, error bars, German axis format, redraw, bad input all behave");
