// Compare a measured value with a calculated or literature value, both with an uncertainty (P6 Wheatstone bridge, grating).
// d = measured - reference, u(d) = √(u₁² + u₂²) (independent values), z = |d|/u(d). Pure functions; the page does the display.
const COMPARE_K = 2; // same limit as the slope comparison: under 2 combined uncertainties counts as agreement
const _cmpNum = typeof module !== "undefined" ? require("./derived.js").toNum : _toNum;

// "100,2 ± 0,3" (the uncertainty may be missing = exact, ± may be written +- or +/-) -> {value, u} or {error} (German message). what = "Messwert" or "Vergleichswert".
function parseValue(text, what) {
  const t = String(text).trim();
  if (!t) return { error: `Bitte den ${what} eintragen, zum Beispiel 100,2 ± 0,3.` };
  const parts = t.split(/±|\+-|\+\/-/).map(s => s.trim());
  if (parts.length > 2) return { error: `${what}: Es darf nur ein ± vorkommen.` };
  const value = _cmpNum(parts[0]), u = parts.length === 2 ? _cmpNum(parts[1]) : 0;
  if (!Number.isFinite(value)) return { error: `${what}: „${parts[0]}“ ist keine Zahl.` };
  if (!Number.isFinite(u) || u < 0) return { error: `${what}: Die Unsicherheit „${parts[1]}“ ist keine Zahl größer oder gleich 0.` };
  return { value, u };
}

// m, c = {value, u}. rel = difference in % of |c| (null when c is 0). z is rounded to 12 digits so that exactly 2,0 is not read as 1,9999999999999996.
function compareValues(m, c) {
  const diff = m.value - c.value, u = Math.hypot(m.u, c.u);
  if (!(u > 0)) return { error: "Beide Unsicherheiten sind 0. Ohne Unsicherheit lässt sich der Unterschied nicht in Unsicherheiten messen." };
  const z = Number((Math.abs(diff) / u).toPrecision(12));
  return { diff, u, z, rel: c.value === 0 ? null : diff / Math.abs(c.value) * 100, agree: z < COMPARE_K };
}
if (typeof module !== "undefined") module.exports = { parseValue, compareValues, COMPARE_K };
