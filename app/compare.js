if (typeof module !== "undefined") require("./i18n.js"); // t() and nf() are globals on the page; in Node this makes them globals
// Compare a measured value with a calculated or literature value, both with an uncertainty (P6 Wheatstone bridge, grating).
// d = measured - reference, u(d) = √(u₁² + u₂²) (independent values), z = |d|/u(d). Pure functions; the page does the display.
const COMPARE_K = 2; // same limit as the slope comparison: under 2 combined uncertainties counts as agreement
const _cmpNum = typeof module !== "undefined" ? require("./derived.js").toNum : _toNum;

// "100,2 ± 0,3" (the uncertainty may be missing = exact, ± may be written +- or +/-) -> {value, u} or {error} (message in the chosen language). what = "Messwert" or "Vergleichswert" (the page and the tests pass these two words; the message names them in the chosen language).
function parseValue(text, what) {
  const s = String(text).trim(), w = what === "Messwert" ? t("l_kmeas") : what === "Vergleichswert" ? t("l_kref") : what;
  if (!s) return { error: t("cp_enter", { what: what === "Messwert" ? t("cp_meas_l") : what === "Vergleichswert" ? t("cp_ref_l") : what }) };
  const parts = s.split(/±|\+-|\+\/-/).map(s => s.trim());
  if (parts.length > 2) return { error: t("cp_twopm", { what: w }) };
  const value = _cmpNum(parts[0]), u = parts.length === 2 ? _cmpNum(parts[1]) : 0;
  if (!Number.isFinite(value)) return { error: t("cp_notnum", { what: w, v: parts[0] }) };
  if (!Number.isFinite(u) || u < 0) return { error: t("cp_badu", { what: w, v: parts[1] }) };
  return { value, u };
}

// m, c = {value, u}. rel = difference in % of |c| (null when c is 0). z is rounded to 12 digits so that exactly 2,0 is not read as 1,9999999999999996.
function compareValues(m, c) {
  const diff = m.value - c.value, u = Math.hypot(m.u, c.u);
  if (!(u > 0)) return { error: t("cp_u0") };
  const z = Number((Math.abs(diff) / u).toPrecision(12));
  return { diff, u, z, rel: c.value === 0 ? null : diff / Math.abs(c.value) * 100, agree: z < COMPARE_K };
}
if (typeof module !== "undefined") module.exports = { parseValue, compareValues, COMPARE_K };
