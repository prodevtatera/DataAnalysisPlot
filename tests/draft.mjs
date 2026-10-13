// Checks the draft page's fit and HU rounding against values computed another way
// (exact fractions, centred sums), not by the page's own formulas.
import { readFileSync } from "node:fs";
const html = readFileSync(new URL("../draft/index.html", import.meta.url), "utf8");
const code = html.slice(html.indexOf("const comma="), html.indexOf("function render(){"))
  + html.slice(html.indexOf("const D="), html.indexOf("const comma="));
const { fit, huRound } = new Function(code + "; return {fit, huRound};")();

let bad = 0;
const near = (name, got, want, tol = 1e-9) => {
  if (Math.abs(got - want) > tol) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; }
};
const same = (name, got, want) => {
  if (JSON.stringify(got) !== JSON.stringify(want)) { console.log(`FAIL ${name}: got ${got}, want ${want}`); bad++; }
};

const F = fit();
near("slope", F.m, 2.3190476190476192);
near("intercept", F.b, 0.039285714285714285);
near("slope error (unscaled)", F.um, 0.04629100498862757);
near("intercept error (unscaled)", F.ub, 0.23375811674219388);
near("chi2", F.chi2, 3.1084656084656084);

same("round 2.3190 ± 0.0333", huRound(F.m, F.um * F.f), ["2,32", "0,03"]);
same("two digits when first is 1", huRound(0.0393, 0.168), ["0,04", "0,17"]);
same("two digits when first is 2", huRound(1234, 25), ["1234", "25"]);
same("one decimal", huRound(15.234, 0.9), ["15,2", "0,9"]);
same("uncertainty above 10", huRound(1234, 400), ["1200", "400"]);
same("three decimals", huRound(0.98765, 0.0123), ["0,988", "0,012"]);

if (bad) process.exit(1);
console.log("draft page: fit and rounding match the reference");
