// Phase 2 step 2: Gaussian error propagation for formula columns, without a browser.
// Expected values come from partial derivatives worked out by hand (written in each line), never from the app.
import { createRequire } from "node:module";
const req = createRequire(import.meta.url);
const { recalcFormulas } = req("../app/formula.js");
const { parseUncertainty } = req("../app/propagate.js");
let bad = 0;
const eq = (name, got, want) => {
  got = JSON.stringify(got); want = JSON.stringify(want);
  if (got !== want) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; }
};
const close = (name, got, want, tol = 1e-7) => {
  if (got.length !== want.length || got.some((g, i) => want[i] === null ? g !== null : g === null || Math.abs(g - want[i]) > tol * Math.abs(want[i]))) {
    console.log(`FAIL ${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`); bad++;
  }
};
const data = (name, values) => ({ name, role: "unused", values });
// Builds [inputs..., value column, u column] and recalculates; returns {u, f, msgs}.
const run = (inputs, formula, map) => {
  const cols = [...inputs, { name: "f", role: "unused", values: [], formula }, { name: "u(f)", role: "unused", values: [], uncert: { formula, map } }];
  const msgs = recalcFormulas({ columns: cols });
  return { f: cols[inputs.length].values, u: cols[inputs.length + 1].values, msgs };
};

// Wheatstone bridge Rx = R1·R2/R3. Partials: ∂/∂R1 = R2/R3, ∂/∂R2 = R1/R3, ∂/∂R3 = -R1·R2/R3².
const wb = [[100, 0.5, 200, 1, 400, 2], [120, 0.6, 330, 1.5, 220, 1.1], [47, 0.2, 10, 0.1, 5, 0.05]];
const wheat = run(["R1", "sR1", "R2", "sR2", "R3", "sR3"].map((n, j) => data(n, wb.map(r => r[j]))), "R1*R2/R3", "R1 = sR1; R2 = sR2; R3 = sR3");
eq("wheatstone no messages", wheat.msgs, []);
close("wheatstone Rx", wheat.f, wb.map(([a, , b, , c]) => a * b / c));
close("wheatstone u(Rx)", wheat.u, wb.map(([R1, s1, R2, s2, R3, s3]) => Math.sqrt((R2 / R3 * s1) ** 2 + (R1 / R3 * s2) ** 2 + (R1 * R2 / R3 ** 2 * s3) ** 2)));
// First row in the head: Rx = 50, each relative error is 0,5 %, so u = 50·0,005·√3 = 0,4330127.
close("wheatstone row 1 in the head", [wheat.u[0]], [0.25 * Math.sqrt(3)]);

const x = (...v) => [data("x", v)], sx = (...v) => data("sx", v);
// Square root: f = √x, f' = 1/(2√x). x = 4 ± 0,2 gives 0,2/4 = 0,05.
close("sqrt", run([...x(4, 9), sx(0.2, 0.3)], "sqrt(x)", "x = sx").u, [0.05, 0.3 / 6]);
// The same input twice is not two independent inputs: f = x·x has f' = 2x, so x = 3 ± 0,1 gives 0,6 (not 0,424).
close("x*x", run([...x(3), sx(0.1)], "x*x", "x = sx").u, [0.6]);
// r² = (D/2)²: f' = D/2 = 1,5 for D = 3, u(D) = 0,2 gives 0,3.
close("(D/2)^2", run([data("D", [3]), data("sD", [0.2])], "(D/2)^2", "D = sD").u, [0.3]);
// Sum with 3-4-5: u = √(0,3² + 0,4²) = 0,5. Difference gives the same.
const ab = [data("a", [10]), data("sa", [0.3]), data("b", [20]), data("sb", [0.4])];
close("sum", run(ab, "a+b", "a = sa; b = sb").u, [0.5]);
close("difference", run(ab, "a-b", "a = sa; b = sb").u, [0.5]);
// Quotient a/b: partials 1/b and -a/b² : (0,3/20)² + (10·0,4/400)² = 0,000225 + 0,0001 -> √ = 0,018027756.
close("quotient", run(ab, "a/b", "a = sa; b = sb").u, [Math.sqrt(0.000225 + 0.0001)]);
// Only a listed: b is exact, so u = b·u(a) = 20·0,3 = 6.
close("exact input", run(ab, "a*b", "a = sa").u, [6]);
// ln(x): f' = 1/x, x = 2 ± 0,1 gives 0,05. 2^x: f' = 2^x·ln 2, x = 3 ± 0,1 gives 8·0,693147·0,1.
close("ln", run([...x(2), sx(0.1)], "ln(x)", "x = sx").u, [0.05]);
close("power of two", run([...x(3), sx(0.1)], "2^x", "x = sx").u, [0.8 * Math.LN2]);
// Constant uncertainty, relative uncertainty, bracketed name: f = x², x = 3: constant 0,1 gives 0,6; 0,01·x = 0,03 gives 0,18.
close("constant u", run([...x(3)], "x^2", "x = 0,1").u, [0.6]);
close("relative u", run([...x(3)], "x^2", "[x] = 0,01*x").u, [0.18]);
// sqrt at the edge of its domain does not stop the calculation (one-sided slope): x = 0, f' = infinity, only a message-free finite number needed.
eq("sqrt at 0 is finite", Number.isFinite(run([...x(0), sx(1e-8)], "sqrt(x)", "x = sx").u[0]), true);
// Empty input gives empty output; zero uncertainty gives zero.
close("missing input value", run([...x(null, 2), sx(0.1, 0.1)], "x*2", "x = sx").u, [null, 0.2]);
eq("zero uncertainty", run([...x(5), sx(0)], "x*2", "x = sx").u, [0]);
// The u column follows the data: change x and recalculate.
{ const cols = [data("x", [4]), data("sx", [0.2]), { name: "f", values: [], formula: "sqrt(x)" }, { name: "u(f)", values: [], uncert: { formula: "sqrt(x)", map: "x = sx" } }];
  recalcFormulas({ columns: cols }); cols[0].values[0] = 16; recalcFormulas({ columns: cols });
  close("recalculates", cols[3].values, [0.2 / 8]); }

// Bad input: clear messages, values stay empty.
const msg = (formula, map, inputs = [...ab]) => run(inputs, formula, map).msgs[0];
eq("no equals sign", msg("a+b", "a"), "Spalte „u(f)“: „a“: Es fehlt ein „=“. Schreibe zum Beispiel D = sD (Unsicherheit von D steht in Spalte sD) oder D = 0,05.");
eq("unknown input", msg("a+b", "q = sa"), "Spalte „u(f)“: Unsicherheiten: Unbekannte Spalte „q“.");
eq("not in formula", msg("a+b", "sa = 0,1"), "Spalte „u(f)“: Unsicherheiten: „sa“ kommt in der Formel nicht vor.");
eq("twice", msg("a+b", "a = sa; a = 0,1"), "Spalte „u(f)“: Unsicherheiten: „a“ ist doppelt angegeben.");
eq("empty", msg("a+b", " ; "), "Spalte „u(f)“: Bitte die Unsicherheiten angeben, zum Beispiel D = sD; c = 0,01.");
eq("bad expression", msg("a+b", "a = sq"), "Spalte „u(f)“: Unsicherheit von „a“: Unbekannte Spalte „sq“ in der Formel. Verfügbar: a, sa, b, sb, f. Die Formel darf nur Spalten links von der neuen Spalte benutzen.");
eq("empty u side", msg("a+b", "a ="), "Spalte „u(f)“: Unsicherheit von „a“: Bitte eine Formel eingeben, zum Beispiel (D/2)^2.");
eq("negative u", run([...x(3), sx(-0.1)], "x*2", "x = sx").msgs.slice(-1)[0], "Spalte „u(f)“, Zeile 1: Die Unsicherheit ist negativ oder keine Zahl. Der Wert bleibt leer.");
eq("division by zero", run([data("a", [1]), data("sa", [0.1]), data("b", [0]), data("sb", [0.1])], "a/b", "a = sa; b = sb").msgs.slice(-1)[0], "Spalte „u(f)“, Zeile 1: Division durch 0. Der Wert bleibt leer.");
eq("bad column leaves empty values", run([...ab], "a+b", "q = sa").u, [null]);
eq("parseUncertainty needs a valid formula", parseUncertainty("a+", "a = 1", ab, 4).error.startsWith("Unerwartet"), true);
if (bad) process.exit(1);
console.log("phase 2 step 2: error propagation matches the hand-derived partial derivatives");
