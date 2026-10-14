// A derived quantity from the fit parameters (P3, P4, P5, P9): the student writes a formula over a (slope) and b (intercept)
// and over further quantities "name = value ± u"; the uncertainty follows from Gaussian propagation u(f)² = Σ (∂f/∂xᵢ)²·u(xᵢ)².
// a and b are treated as independent (their correlation is not used). The formula text is parsed by formula.js, never run as code.
const _D = typeof module !== "undefined" ? { ...require("./formula.js"), ...require("./propagate.js") } : { parseFormula, partial };
const _NUM = /^[+-]?(\d+[.,]?\d*|[.,]\d+)([eE][+-]?\d+)?$/;
const _toNum = t => _NUM.test(t) ? Number(t.replace(",", ".")) : NaN;

// "L = 1 ± 0,002; d = 0,5" -> {vars: [{name, value, u}]} (u = 0 when missing) or {error} (German message). ± may be written +- or +/-.
function parseDerivedVars(text) {
  const vars = [], entries = String(text).split(";").map(s => s.trim()).filter(Boolean);
  if (entries.length > 20) return { error: "Es sind höchstens 20 weitere Größen möglich." };
  for (const e of entries) {
    const k = e.indexOf("=");
    if (k < 0) return { error: `„${e}“: Es fehlt ein „=“. Schreibe zum Beispiel L = 1 ± 0,002.` };
    const name = e.slice(0, k).trim(), parts = e.slice(k + 1).split(/±|\+-|\+\/-/).map(s => s.trim());
    if (!/^[\p{L}_][\p{L}\p{Nd}_]*$/u.test(name)) return { error: `„${name}“ ist kein gültiger Name. Erlaubt sind Buchstaben, Ziffern und _, der Name beginnt mit einem Buchstaben.` };
    if (["a", "b", "pi"].includes(name)) return { error: `Der Name „${name}“ ist schon vergeben (a und b sind die Fit-Parameter, pi die Kreiszahl). Bitte einen anderen Namen wählen.` };
    if (vars.some(v => v.name === name)) return { error: `Die Größe „${name}“ ist doppelt angegeben.` };
    if (parts.length > 2) return { error: `„${e}“: Es darf nur ein ± vorkommen.` };
    const value = _toNum(parts[0]), u = parts.length === 2 ? _toNum(parts[1]) : 0;
    if (!Number.isFinite(value)) return { error: `„${e}“: „${parts[0]}“ ist keine Zahl.` };
    if (!Number.isFinite(u) || u < 0) return { error: `„${e}“: Die Unsicherheit „${parts[1]}“ ist keine Zahl größer oder gleich 0.` };
    vars.push({ name, value, u });
  }
  return { vars };
}

// fit = {a: {value, u, unit}, b: {...}}; returns {value, u, parts: [{name, share}], used} or {error}. share = |∂f/∂xᵢ|·u(xᵢ) / |f|.
function deriveQuantity(formula, fit, vars) {
  const names = ["a", "b", ...vars.map(v => v.name)], row = [fit.a.value, fit.b.value, ...vars.map(v => v.value)], us = [fit.a.u, fit.b.u, ...vars.map(v => v.u)];
  const f = _D.parseFormula(formula, names.map(name => ({ name })));
  if (f.error) return { error: f.error.replace("Unbekannte Spalte", "Unbekannte Größe").replace(/ Die Formel darf nur Spalten.*$/, " Erlaubt sind a, b und die weiteren Größen.") };
  if (!f.refs.includes(0) && !f.refs.includes(1)) return { error: "Die Formel muss a oder b (die Fit-Parameter) enthalten." };
  try {
    const value = f.fn(row);
    if (!Number.isFinite(value)) throw "Das Ergebnis ist keine endliche Zahl";
    const parts = f.refs.filter(j => us[j] > 0).map(j => ({ name: names[j], c: Math.abs(_D.partial(f.fn, row, j)) * us[j] }));
    return {
      value, u: Math.sqrt(parts.reduce((s, p) => s + p.c * p.c, 0)), parts: parts.map(p => ({ name: p.name, share: value === 0 ? null : p.c / Math.abs(value) })),
      used: f.refs.map(j => ({ name: names[j], value: row[j], u: j < 2 ? null : us[j], unit: j === 0 ? fit.a.unit : j === 1 ? fit.b.unit : "" })),
    };
  } catch (e) {
    if (typeof e !== "string") throw e;
    return { error: `Die Formel lässt sich nicht berechnen: ${e}.` };
  }
}
if (typeof module !== "undefined") module.exports = { parseDerivedVars, deriveQuantity };
