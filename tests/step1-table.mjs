// Step 1: drives the real page. Expected values are typed by hand from the input text.
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
const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
const external = [];
p.on("request", r => { if (!r.url().startsWith("file:")) external.push(r.url()); });
await p.goto(url);
const cells = () => p.$$eval("#table tbody tr", rs => rs.map(r => [...r.children].map(c => c.textContent)));
const msg = async () => (await p.isVisible("#msg")) ? await p.textContent("#msg") : "";

// German format: semicolon + decimal comma
await p.fill("#in", "x;y\n1,5;2,25\n2;4,5");
eq("German header", await p.$$eval("#table th", t => t.map(x => x.textContent)), ["x", "y"]);
eq("German rows", await cells(), [["1,5", "2,25"], ["2", "4,5"]]);
// English format: comma + decimal point
await p.fill("#in", "a,b\n1.5,2\n3,4.25");
eq("English rows", await cells(), [["1,5", "2"], ["3", "4,25"]]);
// Tab (Excel paste), no header
await p.fill("#in", "1,5\t2\n3\t4");
eq("Tab rows", await cells(), [["1,5", "2"], ["3", "4"]]);
// Example button, then screenshot
await p.click("#example");
eq("Example row count", (await cells()).length, 5);
await p.screenshot({ path: "evidence/step1-table.png", fullPage: true });
// Bad inputs
await p.fill("#in", "x;y\n1;abc");
eq("Letters", await msg(), "Zeile 2, Spalte 2: „abc“ ist keine Zahl.");
await p.fill("#in", "x;y\n1;2\n3");
eq("Ragged", await msg(), "Zeile 3 hat 1 statt 2 Spalten. Prüfe das Trennzeichen (; oder Tab).");
await p.fill("#in", "x;y");
eq("Header only", await msg(), "Nur eine Kopfzeile gefunden, aber keine Messwerte.");
await p.screenshot({ path: "evidence/step1-table-error.png", fullPage: true });
// File upload
await p.setInputFiles("#file", { name: "d.csv", mimeType: "text/csv", buffer: Buffer.from("t;v\n1;2,5\n") });
await p.waitForSelector("#table tbody");
eq("File rows", await cells(), [["1", "2,5"]]);
// Fonts are bundled: no request left the machine
eq("No external requests", external, []);
await b.close();
if (bad) process.exit(1);
console.log("step 1: paste, German format, tab, file, bad input all behave");
