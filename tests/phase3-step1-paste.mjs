// Phase 3 step 1: several cells pasted from Excel or a CSV fill the table from the clicked cell (own numbers into a template).
// Expected numbers are hand values: A = pi*(d/2)^2 and u(A) = (pi*d/2)*u(d) with u(d) = 0,05 (P2 template), written here, not read from the app.
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { serve } from "./serve.mjs";
const req = createRequire(import.meta.url);
const { parseBlock, pasteInto } = req("../app/parse.js");
import { chromium } from "./tools.mjs";
let bad = 0;
const eq = (name, got, want) => { got = JSON.stringify(got); want = JSON.stringify(want); if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; } };
const nearAll = (name, got, want, tol = 1e-7) => { if (!(got.length === want.length && want.every((w, i) => w === null ? got[i] === null : Math.abs(got[i] - w) <= tol * Math.abs(w)))) { console.log(`FAIL ${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`); bad++; } };
const PI = Math.PI;

// ---- Pure part: the block reader and the placement.
eq("semicolon, decimal comma, trailing newline", parseBlock("1,5;2\n3;4,5\n"), { rows: [[1.5, 2], [3, 4.5]] });
eq("tab with CRLF (Excel), empty cell, empty first cell", parseBlock("1\t\r\n\t5,25\r\n"), { rows: [[1, null], [null, 5.25]] });
eq("one column, decimal point and comma", parseBlock("1.5\n2,5"), { rows: [[1.5], [2.5]] });
eq("exponent and sign", parseBlock("-1,5e2;+3"), { rows: [[-150, 3]] });
eq("thousands separator is refused, not split", parseBlock("1.000,5\n2").error, "Eingefügter Block, Zeile 1, Spalte 1: „1.000,5“ ist keine Zahl. Es wurde nichts geändert.");
eq("empty", parseBlock(" \n \n").error, "Keine Daten eingefügt.");
eq("ragged", parseBlock("1;2\n3").error, "Eingefügter Block, Zeile 2: 1 statt 2 Spalten. Trenne Spalten mit Tab oder Semikolon. Es wurde nichts geändert.");
{
  const cols = [{ values: [1, 2] }, { formula: "a", values: [9, 9] }, { values: [5, 6] }];
  eq("placement skips the formula column and adds rows", [pasteInto(cols, 1, 0, [[10, 20], [11, 21]]), cols.map(c => c.values)], [null, [[1, 10, 11], [9, 9, null], [5, 20, 21]]]);
  const c2 = [{ values: [1] }, { values: [2] }];
  eq("too wide changes nothing", [pasteInto(c2, 0, 1, [[1, 2]]), c2.map(c => c.values)], ["Der eingefügte Block hat 2 Spalten, ab dieser Zelle gibt es aber nur 1 Spalte ohne Formel. Es wurde nichts geändert.", [[1], [2]]]);
}

// ---- Real page.
const { base, close } = await serve();
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1200, height: 2000 } })).newPage();
const errors = [];
p.on("pageerror", e => errors.push(String(e)));
await p.goto(base + "app/app.html");
await p.evaluate(() => localStorage.clear());
await p.reload();
await p.waitForFunction(() => !document.getElementById("fit").disabled || document.getElementById("fitstate").textContent === "Bereit.", null, { timeout: 120000 });
const ready = () => p.waitForFunction(() => !document.getElementById("fit").disabled, null, { timeout: 120000 });
const paste = (r, c, text) => p.evaluate(([r, c, t]) => {
  const el = document.querySelector(`#table input[data-r="${r}"][data-c="${c}"]`), dt = new DataTransfer(); dt.setData("text", t);
  const ev = new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }); el.dispatchEvent(ev); return ev.defaultPrevented;
}, [r, c, text]);
const colv = name => p.evaluate(n => proj.columns.find(c => c.name === n).values, name);
const state = () => p.evaluate(() => JSON.stringify(proj));
const undoLen = () => p.evaluate(() => undo.length);
const msg = async () => (await p.isVisible("#msg")) ? p.textContent("#msg") : null;
const stale = () => p.$$eval("#results .result.stale", e => e.length);
const tpl = () => p.evaluate(() => ({ t: proj.template, box: document.getElementById("tpl_info").hidden ? null : document.querySelector("#tpl_info h3").textContent }));
const roles = () => p.evaluate(() => proj.columns.map(c => c.role));

// P2 with its statistics result computed, so "out of date" can be seen.
await p.selectOption("#tpl_sel", "p2"); await p.click("#tpl_load"); await ready();
await p.click("#s_go"); await ready();
eq("start: fresh result", await stale(), 0);
eq("start: columns", await p.evaluate(() => proj.columns.map(c => c.name)), ["Nr / 1", "d / mm", "V / cm³", "u / cm³", "A / mm²", "u(A) / mm²"]);
const s0 = await state(), roles0 = await roles(), settings0 = await p.evaluate(() => JSON.stringify(proj.settings));
const u0 = await undoLen();

// Bad input first: each message is clear, nothing changes, no undo step is used.
eq("a letter in a number cell: stopped", await paste(0, 0, "1\t2\t3\r\nx\t3\t4\r\n"), true);
eq("a letter: message", await msg(), "Eingefügter Block, Zeile 2, Spalte 1: „x“ ist keine Zahl. Es wurde nichts geändert.");
eq("a letter: nothing changed", [await state(), await undoLen()], [s0, u0]);
await paste(0, 2, "1\t2\t3\r\n4\t5\t6");
eq("too wide from V (V and u only)", await msg(), "Der eingefügte Block hat 3 Spalten, ab dieser Zelle gibt es aber nur 2 Spalten ohne Formel. Es wurde nichts geändert.");
await p.screenshot({ path: "evidence/phase3-step1-error.png", fullPage: true });
await paste(0, 0, "1;2;3;4;5\n1;2;3;4;5");
eq("too wide from Nr (4 typed columns)", await msg(), "Der eingefügte Block hat 5 Spalten, ab dieser Zelle gibt es aber nur 4 Spalten ohne Formel. Es wurde nichts geändert.");
await paste(0, 0, "1;2\n3");
eq("ragged block", await msg(), "Eingefügter Block, Zeile 2: 1 statt 2 Spalten. Trenne Spalten mit Tab oder Semikolon. Es wurde nichts geändert.");
await paste(0, 0, "1\n".repeat(2001));
eq("more than 2000 rows", await msg(), "Die Tabelle würde 2001 Zeilen bekommen. Mehr als 2000 Zeilen sind nicht möglich. Es wurde nichts geändert.");
eq("all refused: nothing changed", [await state(), await undoLen(), await stale()], [s0, u0, 0]);
eq("one value pastes the normal way", [await paste(0, 1, "1,5"), await undoLen()], [false, u0]);

// Good paste: 5 x 3 Excel block (tab, CRLF, decimal commas, one empty cell, trailing newline) into the first cell of the table.
eq("paste is taken over", await paste(0, 0, "1\t2\t10,3\r\n2\t4\t10,5\r\n3\t6\t9,9\r\n4\t1,5\t\r\n5\t3\t10,0\r\n"), true);
eq("error message is gone", await msg(), null);
eq("Nr", await colv("Nr / 1"), [1, 2, 3, 4, 5]);
eq("d", await colv("d / mm"), [2, 4, 6, 1.5, 3]);
eq("V (empty cell stays empty)", await colv("V / cm³"), [10.3, 10.5, 9.9, null, 10]);
eq("u of V is kept", await colv("u / cm³"), [0.2, 0.3, 0.1, null, null]);
nearAll("A = pi d^2 / 4 recomputed", await colv("A / mm²"), [PI, 4 * PI, 9 * PI, 0.5625 * PI, 2.25 * PI]);
nearAll("u(A) = pi d/2 * 0,05 recomputed", await colv("u(A) / mm²"), [0.05 * PI, 0.1 * PI, 0.15 * PI, 0.0375 * PI, 0.075 * PI]);
eq("shown in the cell with a decimal comma", await p.inputValue('#table input[data-r="3"][data-c="1"]'), "1,5");
eq("template box stays", await tpl(), { t: "p2", box: "P2 Volumenmessung" });
eq("roles and settings stay", [await roles(), await p.evaluate(() => JSON.stringify(proj.settings))], [roles0, settings0]);
eq("result is out of date", await stale(), 1);
eq("one undo step", await undoLen(), u0 + 1);
await p.screenshot({ path: "evidence/phase3-step1-paste.png", fullPage: true });
const s1 = await state();

// Undo restores everything, redo brings the paste back, the result is fresh again after undo.
await p.click("#undo");
eq("undo restores the project", await state(), s0);
eq("undo: result fresh", await stale(), 0);
await p.click("#redo");
eq("redo brings the paste back", await state(), s1);
eq("redo: result out of date", await stale(), 1);

// Growth: 4 x 2 German CSV block into d, row 4: rows are added, Nr stays empty there, the formula columns follow.
await paste(3, 1, "7,5;11,1\n8;11,2\n9;11,3\n10;11,4");
eq("rows added", (await colv("d / mm")).length, 7);
eq("d grows", await colv("d / mm"), [2, 4, 6, 7.5, 8, 9, 10]);
eq("V grows", await colv("V / cm³"), [10.3, 10.5, 9.9, 11.1, 11.2, 11.3, 11.4]);
eq("Nr gets empty cells", await colv("Nr / 1"), [1, 2, 3, 4, 5, null, null]);
nearAll("A for the new rows", await colv("A / mm²"), [PI, 4 * PI, 9 * PI, 14.0625 * PI, 16 * PI, 20.25 * PI, 25 * PI]);
eq("all columns have 7 rows", await p.evaluate(() => proj.columns.map(c => c.values.length)), [7, 7, 7, 7, 7, 7]);

// Reload keeps it (autosave).
await p.reload();
await p.waitForFunction(() => !document.getElementById("fit").disabled || document.getElementById("fitstate").textContent === "Bereit.", null, { timeout: 120000 });
eq("reload keeps the pasted data", await colv("d / mm"), [2, 4, 6, 7.5, 8, 9, 10]);
eq("page errors", errors, []);
await b.close(); close();
console.log(bad ? `${bad} FAILED` : "all checks passed");
process.exit(bad ? 1 : 0);
