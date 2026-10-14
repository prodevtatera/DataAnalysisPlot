// Phase 2 step 13: compare a measured and a calculated value with their uncertainties (P6 Wheatstone bridge, grating).
// Hand values (d = measured - reference, u = sqrt(u1² + u2²), z = |d|/u; all by hand, not from the app):
//  A agree:    100,2 ± 0,3 Ω vs 100,0 ± 0,4 Ω -> d = 0,2, u = 0,5, z = 0,4, 0,2 % of the reference
//  B disagree: 30,0 ± 0,3 µm vs 31,2 ± 0,4 µm -> d = -1,2, u = 0,5, z = 2,4, -1,2/31,2 = -3,846 %
//  C boundary: 10,1 ± 0,03 vs 10,0 ± 0,04     -> d = 0,1, u = 0,05 (0,03² + 0,04² = 0,0025 = 0,05²), z = 2 exactly -> "2 or more" = disagree
//  D exact reference: 9,81 ± 0,05 m/s² vs 9,80665 -> d = 0,00335, u = 0,05, z = 0,067, 0,034 %
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { writeFileSync, readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
const req = createRequire(import.meta.url);
const { chromium } = createRequire(resolve("testbuild/x.js"))("playwright-core");
const { parseValue, compareValues } = req("../app/compare.js");
const { newProject, save, compareSettings } = req("../app/project.js");
let bad = 0;
const eq = (name, got, want) => {
  got = JSON.stringify(got); want = JSON.stringify(want);
  if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; }
};
const near = (name, got, want, tol = 1e-9) => {
  if (!(Math.abs(got - want) <= tol * Math.abs(want))) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; }
};

// Parser.
eq("parse comma", parseValue("100,2 ± 0,3", "Messwert"), { value: 100.2, u: 0.3 });
eq("parse point", parseValue("1.5", "Messwert"), { value: 1.5, u: 0 });
eq("parse +-", parseValue("1,5 +- 0,1", "Messwert"), { value: 1.5, u: 0.1 });
eq("parse +/-", parseValue("1,5 +/- 0,1", "Messwert"), { value: 1.5, u: 0.1 });
eq("parse exponent", parseValue("2e-3 ± 1e-4", "Messwert"), { value: 0.002, u: 0.0001 });
eq("parse empty", parseValue("  ", "Messwert").error, "Bitte den Messwert eintragen, zum Beispiel 100,2 ± 0,3.");
eq("parse text", parseValue("abc ± 1", "Vergleichswert").error, "Vergleichswert: „abc“ ist keine Zahl.");
eq("parse negative u", parseValue("5 ± -1", "Messwert").error, "Messwert: Die Unsicherheit „-1“ ist keine Zahl größer oder gleich 0.");
eq("parse two ±", parseValue("5 ± 1 ± 2", "Messwert").error, "Messwert: Es darf nur ein ± vorkommen.");
eq("parse code", typeof parseValue("alert(1)", "Messwert").error, "string");

// Pure numbers.
const A = compareValues({ value: 100.2, u: 0.3 }, { value: 100, u: 0.4 });
near("A d", A.diff, 0.2, 1e-9); near("A u", A.u, 0.5); near("A z", A.z, 0.4); near("A rel", A.rel, 0.2); eq("A agree", A.agree, true);
const B = compareValues({ value: 30, u: 0.3 }, { value: 31.2, u: 0.4 });
near("B d", B.diff, -1.2, 1e-9); near("B u", B.u, 0.5); near("B z", B.z, 2.4); near("B rel", B.rel, -1.2 / 31.2 * 100); eq("B agree", B.agree, false);
const raw = Math.abs(10.1 - 10) / Math.hypot(0.03, 0.04);
eq("C precondition: raw floating point z is below 2", raw < 2, true); // so the test has teeth against a missing rounding guard
const C = compareValues({ value: 10.1, u: 0.03 }, { value: 10, u: 0.04 });
near("C z", C.z, 2); eq("C agree", C.agree, false);
const D = compareValues({ value: 9.81, u: 0.05 }, { value: 9.80665, u: 0 });
near("D d", D.diff, 0.00335, 1e-9); near("D u", D.u, 0.05); near("D z", D.z, 0.067); near("D rel", D.rel, 0.00335 / 9.80665 * 100);
eq("both exact", typeof compareValues({ value: 1, u: 0 }, { value: 1, u: 0 }).error, "string");
eq("reference 0 has no percent", compareValues({ value: 1, u: 1 }, { value: 0, u: 0 }).rel, null);

// Real page.
const dir = mkdtempSync(resolve(tmpdir(), "p2s13-"));
const hand = newProject(["x / mL", "u / mL"], [[1, 0.1], [2, 0.1]]);
hand.settings.compare = { meas: "<img src=x onerror=window.pwn=1>", ref: "<script>window.pwn=2</script>", unit: "<img src=x onerror=window.pwn=3>" };
hand.results.push({ kind: "compare", unit: "<img src=x onerror=window.pwn=4>", m: { value: "<img src=x onerror=window.pwn=5>", u: "<img src=x onerror=window.pwn=6>" }, c: "<img src=x onerror=window.pwn=7>",
  z: "<img src=x onerror=window.pwn=8>", rel: "<script>window.pwn=9</script>", verdict: "<img src=x onerror=window.pwn=10>",
  params: [{ name: "<img src=x onerror=window.pwn=11>", unit: "<script>window.pwn=12</script>", value: 1, u: 0.1 }], computedFrom: "x" });
writeFileSync(dir + "/hand.plotlab", save(hand));
eq("settings are text only", compareSettings({ settings: { compare: { meas: 5, ref: null, unit: {} } } }), { meas: "", ref: "", unit: "" });

const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1200, height: 2700 } })).newPage();
const external = [];
p.on("request", r => { if (!r.url().startsWith("file:")) external.push(r.url()); });
await p.goto(pathToFileURL(resolve("app/index.html")).href);
const lines = () => p.$$eval("#results .res", e => e.map(x => x.textContent));
const how = () => p.textContent("#results [data-how]");
const verdict = () => p.textContent("#results [data-verdict]");
const msg = () => p.textContent("#comparemsg");
const go = () => p.click("#k_go");
const enter = async (m, r, u) => { await p.fill("#k_meas", m); await p.fill("#k_ref", r); await p.fill("#k_unit", u); await go(); };

await p.click("#example");
await enter("100,2 ± 0,3", "100,0 ± 0,4", "Ω");
eq("A lines", await lines(), ["Differenz Messwert − Vergleichswert = (0,2 ± 0,5) Ω", "Abweichung in kombinierten Unsicherheiten = 0,4"]);
eq("A how", await how(), "Messwert (100,2 ± 0,3) Ω, Vergleichswert (100,0 ± 0,4) Ω. Unsicherheit des Unterschieds √(u₁² + u₂²). Abweichung vom Vergleichswert: 0,2 %.");
eq("A verdict", await verdict(), "Der Unterschied beträgt 0,4 kombinierte Unsicherheiten (unter 2). Messwert und Vergleichswert stimmen im Rahmen ihrer Unsicherheiten überein.");
await p.screenshot({ path: "evidence/phase2-step13-agree.png", fullPage: true });

await enter("30,0 ± 0,3", "31,2 ± 0,4", "µm");
eq("B lines", await lines(), ["Differenz Messwert − Vergleichswert = (-1,2 ± 0,5) µm", "Abweichung in kombinierten Unsicherheiten = 2,4"]);
eq("B how", await how(), "Messwert (30,0 ± 0,3) µm, Vergleichswert (31,2 ± 0,4) µm. Unsicherheit des Unterschieds √(u₁² + u₂²). Abweichung vom Vergleichswert: -3,85 %.");
eq("B verdict", await verdict(), "Der Unterschied beträgt 2,4 kombinierte Unsicherheiten (2 oder mehr). Messwert und Vergleichswert unterscheiden sich deutlich. Prüfe Einheiten, Rechnung und mögliche systematische Fehler.");
await p.screenshot({ path: "evidence/phase2-step13-disagree.png", fullPage: true });
eq("one result at a time", await p.$$eval("#results .result", e => e.length), 1);

await enter("10,1 ± 0,03", "10,0 ± 0,04", "");
eq("C lines", await lines(), ["Differenz Messwert − Vergleichswert = (0,10 ± 0,05)", "Abweichung in kombinierten Unsicherheiten = 2"]);
eq("C verdict", (await verdict()).includes("(2 oder mehr)"), true);

await enter("9,81 ± 0,05", "9,80665", "m/s²");
eq("D lines", await lines(), ["Differenz Messwert − Vergleichswert = (0,00 ± 0,05) m/s²", "Abweichung in kombinierten Unsicherheiten = 0,067"]);
eq("D how", (await how()).includes("Vergleichswert 9,80665 m/s²"), true);

// Editing an input makes the result out of date; undo makes it fresh; reload and save/open keep it.
await enter("30,0 ± 0,3", "31,2 ± 0,4", "µm");
await p.fill("#k_ref", "31,2 ± 0,5");
eq("stale after edit", await p.textContent(".stalemsg"), "Die Daten wurden geändert. Dieses Ergebnis ist veraltet. Bitte neu berechnen.");
await p.click("#undo");
eq("fresh after undo", await p.$$eval(".stalemsg", e => e.length), 0);
eq("undo restored the input", await p.inputValue("#k_ref"), "31,2 ± 0,4");
await p.reload(); await p.waitForSelector("#results .res");
eq("after reload", [await lines(), await p.inputValue("#k_meas")], [["Differenz Messwert − Vergleichswert = (-1,2 ± 0,5) µm", "Abweichung in kombinierten Unsicherheiten = 2,4"], "30,0 ± 0,3"]);
const [dl] = await Promise.all([p.waitForEvent("download"), p.click("#saveproj")]);
writeFileSync(dir + "/saved.plotlab", readFileSync(await dl.path()));
await p.click("#example"); await p.setInputFiles("#openfile", dir + "/saved.plotlab"); await p.waitForSelector("#results .res");
eq("after save and open", [(await lines())[1], await p.inputValue("#k_unit")], ["Abweichung in kombinierten Unsicherheiten = 2,4", "µm"]);

// Bad input: a clear message and no new result.
await p.click("#example");
const bads = [["", "1 ± 0,1", "Bitte den Messwert eintragen, zum Beispiel 100,2 ± 0,3."], ["1 ± 0,1", "", "Bitte den Vergleichswert eintragen, zum Beispiel 100,2 ± 0,3."],
  ["abc", "1", "Messwert: „abc“ ist keine Zahl."], ["1", "2 ± x", "Vergleichswert: Die Unsicherheit „x“ ist keine Zahl größer oder gleich 0."],
  ["5", "5", "Beide Unsicherheiten sind 0. Ohne Unsicherheit lässt sich der Unterschied nicht in Unsicherheiten messen."]];
for (const [m, r, want] of bads) { await enter(m, r, "Ω"); eq("bad " + m + "|" + r, await msg(), want); }
eq("no result for bad input", await p.evaluate(() => proj.results.length), 0);
await p.screenshot({ path: "evidence/phase2-step13-error.png", fullPage: true });

// Hand-edited project: nothing in the settings or the result runs.
await p.setInputFiles("#openfile", dir + "/hand.plotlab");
await p.waitForSelector("#results .res");
eq("no script ran", await p.evaluate(() => window.pwn), undefined);
eq("no injected elements", await p.$$eval("#results img, #results script, #compare img, #compare script, #comparemsg img", e => e.length), 0);
eq("hand result is stale", await p.$$eval(".stalemsg", e => e.length), 1);
eq("no external requests", external, []);
await b.close();
if (bad) process.exit(1);
console.log("phase 2 step 13: agreeing (z = 0,4), disagreeing (z = 2,4) and boundary (z = 2) pairs match the hand values in the real page");
