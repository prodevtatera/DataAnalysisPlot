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

// Calibration line (P4, P7): measured values "0,45 ± 0,01; 0,62 ± 0,01" (u may be missing = exact) -> {values: [{y0, u}]} or {error}.
function parseCalibValues(text) {
  const entries = String(text).split(";").map(s => s.trim()).filter(Boolean), values = [];
  if (!entries.length) return { error: "Bitte mindestens einen gemessenen Wert y₀ eintragen, zum Beispiel 0,45 ± 0,01. Mehrere Werte mit „;“ trennen." };
  if (entries.length > 10) return { error: "Es sind höchstens 10 gemessene Werte möglich." };
  for (const e of entries) {
    const parts = e.split(/±|\+-|\+\/-/).map(s => s.trim());
    if (parts.length > 2) return { error: `„${e}“: Es darf nur ein ± vorkommen.` };
    const y0 = _toNum(parts[0]), u = parts.length === 2 ? _toNum(parts[1]) : 0;
    if (!Number.isFinite(y0)) return { error: `„${e}“: „${parts[0]}“ ist keine Zahl.` };
    if (!Number.isFinite(u) || u < 0) return { error: `„${e}“: Die Unsicherheit „${parts[1]}“ ist keine Zahl größer oder gleich 0.` };
    values.push({ y0, u });
  }
  return { values };
}
// x0 = (y0 - b)/a with u(x0)² = (u(y0)² + x0²·u(a)² + u(b)² + 2·x0·cov(a,b)) / a². fit = {a, b, ua, ub, cov} (cov = covariance of a and b).
// parts: share of each term in u(x0)² (they add up to 1; the covariance share is negative when a and b are positively correlated).
function readOff(fit, y0, u0) {
  const { a, b, ua, ub, cov } = fit;
  if (!Number.isFinite(a) || !(Math.abs(a) > 2 * ua)) { // a slope that is not clearly different from 0 gives a meaningless x0
    const g = new Intl.NumberFormat("de-DE", { maximumSignificantDigits: 3 });
    return { error: `Die Steigung a = ${g.format(a)} (u(a) = ${g.format(ua)}) ist nicht deutlich von 0 verschieden. Daraus lässt sich kein x₀ ablesen.` };
  }
  const x0 = (y0 - b) / a, t = { y0: u0 * u0, a: x0 * x0 * ua * ua, b: ub * ub, cov: 2 * x0 * cov }, v = (t.y0 + t.a + t.b + t.cov) / (a * a);
  if (!Number.isFinite(v)) return { error: "Die Unsicherheit von x₀ lässt sich nicht berechnen." };
  const sum = t.y0 + t.a + t.b + t.cov;
  return { x0, u: Math.sqrt(Math.max(0, v)), parts: Object.fromEntries(Object.entries(t).map(([k, q]) => [k, sum > 0 ? q / sum : null])) };
}
if (typeof module !== "undefined") module.exports = { parseDerivedVars, deriveQuantity, parseCalibValues, readOff };
