if (typeof module !== "undefined") require("./i18n.js"); // t() and nf() are globals on the page; in Node this makes them globals
// A derived quantity from the fit parameters (P3, P4, P5, P9): the student writes a formula over a (slope) and b (intercept)
// and over further quantities "name = value ± u"; the uncertainty follows from Gaussian propagation u(f)² = Σ (∂f/∂xᵢ)²·u(xᵢ)².
// a and b are treated as independent (their correlation is not used). The formula text is parsed by formula.js, never run as code.
const _D = typeof module !== "undefined" ? { ...require("./formula.js"), ...require("./propagate.js") } : { parseFormula, partial };
const _NUM = /^[+-]?(\d+[.,]?\d*|[.,]\d+)([eE][+-]?\d+)?$/;
const _toNum = t => _NUM.test(t) ? Number(t.replace(",", ".")) : NaN;

// "L = 1 ± 0,002; d = 0,5" -> {vars: [{name, value, u}]} (u = 0 when missing) or {error} (message in the chosen language). ± may be written +- or +/-.
function parseDerivedVars(text) {
  const vars = [], entries = String(text).split(";").map(s => s.trim()).filter(Boolean);
  if (entries.length > 20) return { error: t("dv_max20") };
  for (const e of entries) {
    const k = e.indexOf("=");
    if (k < 0) return { error: t("dv_noeq", { e }) };
    const name = e.slice(0, k).trim(), parts = e.slice(k + 1).split(/±|\+-|\+\/-/).map(s => s.trim());
    if (!/^[\p{L}_][\p{L}\p{Nd}_]*$/u.test(name)) return { error: t("dv_badname", { name }) };
    if (["a", "b", "pi"].includes(name)) return { error: t("dv_taken", { name }) };
    if (vars.some(v => v.name === name)) return { error: t("dv_dup", { name }) };
    if (parts.length > 2) return { error: t("v_twopm", { e }) };
    const value = _toNum(parts[0]), u = parts.length === 2 ? _toNum(parts[1]) : 0;
    if (!Number.isFinite(value)) return { error: t("v_notnum", { e, v: parts[0] }) };
    if (!Number.isFinite(u) || u < 0) return { error: t("v_badu", { e, v: parts[1] }) };
    vars.push({ name, value, u });
  }
  return { vars };
}

// fit = {a: {value, u, unit}, b: {...}}; returns {value, u, parts: [{name, share}], used} or {error} (message in the chosen language). share = |∂f/∂xᵢ|·u(xᵢ) / |f|.
function deriveQuantity(formula, fit, vars) {
  const names = ["a", "b", ...vars.map(v => v.name)], row = [fit.a.value, fit.b.value, ...vars.map(v => v.value)], us = [fit.a.u, fit.b.u, ...vars.map(v => v.u)];
  const f = _D.parseFormula(formula, names.map(name => ({ name })), undefined, "quantity");
  if (f.error) return { error: f.error };
  if (!f.refs.includes(0) && !f.refs.includes(1)) return { error: t("dv_noab") };
  try {
    const value = f.fn(row);
    if (!Number.isFinite(value)) throw t("f_nonfinite");
    const parts = f.refs.filter(j => us[j] > 0).map(j => ({ name: names[j], c: Math.abs(_D.partial(f.fn, row, j)) * us[j] }));
    return {
      value, u: Math.sqrt(parts.reduce((s, p) => s + p.c * p.c, 0)), parts: parts.map(p => ({ name: p.name, share: value === 0 ? null : p.c / Math.abs(value) })),
      used: f.refs.map(j => ({ name: names[j], value: row[j], u: j < 2 ? null : us[j], unit: j === 0 ? fit.a.unit : j === 1 ? fit.b.unit : "" })),
    };
  } catch (e) {
    if (typeof e !== "string") throw e;
    return { error: t("dv_calcfail", { why: e }) };
  }
}

// Calibration line (P4, P7): measured values "0,45 ± 0,01; 0,62 ± 0,01" (u may be missing = exact) -> {values: [{y0, u}]} or {error}.
function parseCalibValues(text) {
  const entries = String(text).split(";").map(s => s.trim()).filter(Boolean), values = [];
  if (!entries.length) return { error: t("cv_none") };
  if (entries.length > 10) return { error: t("cv_max10") };
  for (const e of entries) {
    const parts = e.split(/±|\+-|\+\/-/).map(s => s.trim());
    if (parts.length > 2) return { error: t("v_twopm", { e }) };
    const y0 = _toNum(parts[0]), u = parts.length === 2 ? _toNum(parts[1]) : 0;
    if (!Number.isFinite(y0)) return { error: t("v_notnum", { e, v: parts[0] }) };
    if (!Number.isFinite(u) || u < 0) return { error: t("v_badu", { e, v: parts[1] }) };
    values.push({ y0, u });
  }
  return { values };
}
// x0 = (y0 - b)/a with u(x0)² = (u(y0)² + x0²·u(a)² + u(b)² + 2·x0·cov(a,b)) / a². fit = {a, b, ua, ub, cov} (cov = covariance of a and b).
// parts: share of each term in u(x0)² (they add up to 1; the covariance share is negative when a and b are positively correlated).
function readOff(fit, y0, u0) {
  const { a, b, ua, ub, cov } = fit;
  if (!Number.isFinite(a) || !(Math.abs(a) > 2 * ua)) { // a slope that is not clearly different from 0 gives a meaningless x0
    const g = nf({ maximumSignificantDigits: 3 });
    return { error: t("ro_slope", { a: g.format(a), ua: g.format(ua) }) };
  }
  const x0 = (y0 - b) / a, w = { y0: u0 * u0, a: x0 * x0 * ua * ua, b: ub * ub, cov: 2 * x0 * cov }, v = (w.y0 + w.a + w.b + w.cov) / (a * a);
  if (!Number.isFinite(v)) return { error: t("ro_unc") };
  const sum = w.y0 + w.a + w.b + w.cov;
  return { x0, u: Math.sqrt(Math.max(0, v)), parts: Object.fromEntries(Object.entries(w).map(([k, q]) => [k, sum > 0 ? q / sum : null])) };
}
if (typeof module !== "undefined") module.exports = { toNum: _toNum, parseDerivedVars, deriveQuantity, parseCalibValues, readOff };
