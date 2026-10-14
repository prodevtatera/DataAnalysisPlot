// Phase 2 step 1: the formula parser, on its own (no browser). Expected values are worked out by hand.
import { createRequire } from "node:module";
const { parseFormula, recalcFormulas } = createRequire(import.meta.url)("../app/formula.js");
let bad = 0;
const eq = (name, got, want) => {
  got = JSON.stringify(got); want = JSON.stringify(want);
  if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; }
};
const cols = [{ name: "D / mm", values: [] }, { name: "d / dm", values: [] }, { name: "c / g/mL", values: [] }];
// Evaluate one formula on one row [D, d, c].
const ev = (f, row = [4, 2, 0.5]) => { const r = parseFormula(f, cols); return r.error ? "ERR:" + r.error : r.fn(row); };

// Operators and precedence (checked in the head): 2+3*4 = 14, (2+3)*4 = 20, 2^3^2 = 2^9 = 512, -2^2 = -4, 8/4/2 = 1, 2^-1 = 0,5.
eq("precedence", [ev("2+3*4"), ev("(2+3)*4"), ev("2^3^2"), ev("-2^2"), ev("8/4/2"), ev("2^-1"), ev("10-4-3")], [14, 20, 512, -4, 1, 0.5, 3]);
// Decimal comma and point, exponent, German operator signs, superscript two.
eq("numbers", [ev("1,5*2"), ev("1.5*2"), ev("2e3/1000"), ev("3 · 2"), ev("7 − 2"), ev("9 ÷ 3"), ev(".5+,5")], [3, 3, 2, 6, 5, 3, 1]);
eq("squared sign", ev("D²"), 16);
// Column names: short name (before " / "), full name in brackets.
eq("short names", [ev("D/2"), ev("(D/2)^2"), ev("d*c"), ev("[D / mm]+[d / dm]")], [2, 4, 1, 6]);
// Functions and pi: sqrt(16) = 4, wurzel(9) = 3, ln(1) = 0, log10(1000) = 3, exp(0) = 1, abs(-2,5) = 2,5, pi*D^2/4 for D = 4 is 4 pi.
eq("functions", [ev("sqrt(D)"), ev("wurzel(9)"), ev("ln(1)"), ev("log10(1000)"), ev("exp(0)"), ev("abs(0-2,5)"), ev("sin(0)+cos(0)")], [2, 3, 0, 3, 1, 2.5, 1]);
eq("pi", Math.abs(ev("pi*D^2/4") - 12.566370614359172) < 1e-12, true);

// Clear messages for bad formulas (and nothing is run).
eq("unknown column", ev("D*foo"), "ERR:Unbekannte Spalte „foo“ in der Formel. Verfügbar: D, d, c. Die Formel darf nur Spalten links von der neuen Spalte benutzen.");
eq("unknown function", ev("foo(D)"), "ERR:Unbekannte Funktion „foo“. Erlaubt: sqrt, ln, log10, exp, abs, sin, cos, tan, wurzel.");
eq("missing bracket", ev("(D+1"), "ERR:Eine Klammer wurde nicht geschlossen.");
eq("missing operand", ev("D+"), "ERR:Unerwartet: das Ende der Formel. Hier fehlt eine Zahl, ein Spaltenname oder eine Klammer.");
eq("missing operator", ev("D d"), "ERR:Unerwartet: „d“. Fehlt ein Operator (+ − * / ^)?");
eq("empty", ev("  "), "ERR:Bitte eine Formel eingeben, zum Beispiel (D/2)^2.");
eq("too long", ev("1+".repeat(200) + "1").startsWith("ERR:Die Formel ist zu lang"), true);
// Code is not run: every one of these is only text that fails to parse as a formula.
for (const f of ["alert(1)", "constructor", "constructor(1)", "__proto__", "toString()", "D.constructor", "process.exit()", "this", "`1`", "1;2", "D=1", "'a'", "globalThis"]) {
  globalThis.pwn = 0;
  eq("no code: " + f, ev(f).toString().startsWith("ERR:"), true);
}
eq("ambiguous short name", parseFormula("D", [{ name: "D / mm" }, { name: "D / cm" }]).error.startsWith("Der Spaltenname „D“ ist nicht eindeutig"), true);

// Recalculation on a project: formula column, a formula on a formula column, missing inputs, division by zero, bad formula.
const col = (name, values, formula) => ({ name, role: "unused", values, ...(formula !== undefined ? { formula } : {}) });
const p = { columns: [col("D / mm", [2, 3, null, 5]), col("c / g/mL", [0.5, 0.25, 1, 0]),
  col("r2 / mm2", [], "(D/2)^2"), col("q", [], "r2/c"), col("kaputt", [], "D*foo"), col("links", [], "später")] };
const msgs = recalcFormulas(p);
// r2: 1; 2,25; empty (D missing); 6,25. q = r2/c: 2; 9; empty; division by zero in row 4.
eq("r2", p.columns[2].values, [1, 2.25, null, 6.25]);
eq("q", p.columns[3].values, [2, 9, null, null]);
eq("messages", msgs, ["Spalte „q“, Zeile 4: Division durch 0. Der Wert bleibt leer.",
  "Spalte „kaputt“: Unbekannte Spalte „foo“ in der Formel. Verfügbar: D, c, r2, q. Die Formel darf nur Spalten links von der neuen Spalte benutzen.",
  "Spalte „links“: Unbekannte Spalte „später“ in der Formel. Verfügbar: D, c, r2, q, kaputt. Die Formel darf nur Spalten links von der neuen Spalte benutzen."]);
eq("failed formula leaves empty column", p.columns[4].values, [null, null, null, null]);
// sqrt of a negative number and ln(0): named per row.
const p2 = { columns: [col("x", [4, -1, 0]), col("s", [], "sqrt(x)"), col("l", [], "ln(x)")] };
eq("domain messages", recalcFormulas(p2), ["Spalte „s“, Zeile 2: Wurzel aus einer negativen Zahl. Der Wert bleibt leer.",
  "Spalte „l“, Zeile 2: Logarithmus von 0 oder einer negativen Zahl. Der Wert bleibt leer. Weitere betroffene Zeilen: 3."]);
eq("domain values", [p2.columns[1].values, p2.columns[2].values.map(v => v === null ? v : Math.round(v * 1e9) / 1e9)], [[2, null, 0], [1.386294361, null, null]]);
if (bad) process.exit(1);
console.log("phase 2 step 1: formula parser and recalculation behave");
