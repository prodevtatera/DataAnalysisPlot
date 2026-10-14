if (typeof module !== "undefined") require("./i18n.js"); // t() and nf() are globals on the page; in Node this makes them globals
// Error propagation for formula columns (Gaussian, independent inputs): u(f)² = Σ (∂f/∂xᵢ)² · u(xᵢ)².
// A column {name, uncert: {formula, map}} holds u(f) for the formula text `formula`; `map` is "D = sD; c = 0,01":
// per input column an expression for its uncertainty (a column, a number, or e.g. 0,01*D). Inputs not listed are exact.
// The partial derivatives are central differences of the parsed formula (no eval), good to about 1e-9 relative.
const _F = typeof module !== "undefined" ? require("./formula.js") : { parseFormula, FORMULA_HOOKS, rowMessage };

// Returns {fn, refs, terms: [{j, refs, u}]} or {error}. Only columns left of `upto` can be used.
function parseUncertainty(formula, map, columns, upto) {
  const f = _F.parseFormula(formula, columns, upto);
  if (f.error) return f;
  const entries = String(map).split(";").map(e => e.trim()).filter(Boolean);
  if (!entries.length) return { error: t("u_enter") };
  const terms = [];
  for (const e of entries) {
    const k = e.indexOf("=");
    if (k < 0) return { error: t("u_noeq", { e }) };
    const key = e.slice(0, k).trim().replace(/^\[(.*)\]$/, "$1"), j = f.lookup(key);
    if (j === undefined) return { error: t("u_unknown", { key }) };
    if (j === -1) return { error: t("u_ambig", { key }) };
    if (!f.refs.includes(j)) return { error: t("u_notin", { key }) };
    if (terms.some(t => t.j === j)) return { error: t("u_dupe", { key }) };
    const u = _F.parseFormula(e.slice(k + 1), columns, upto);
    if (u.error) return { error: t("u_of", { key, why: u.error }) };
    terms.push({ j, refs: u.refs, u: u.fn });
  }
  return { fn: f.fn, refs: f.refs, terms };
}

// ∂f/∂x_j at `row`: central difference; at the edge of the domain (sqrt at 0) one-sided.
function partial(fn, row, j) {
  const x = row[j], h = 1e-6 * (Math.abs(x) || 1), f0 = () => fn(row);
  const at = d => { const r = row.slice(); r[j] = x + d; const v = fn(r); if (!Number.isFinite(v)) throw t("f_nonfinite"); return v; };
  let last = t("u_noderiv");
  for (const d of [() => (at(h) - at(-h)) / (2 * h), () => (at(h) - f0()) / h, () => (f0() - at(-h)) / h]) {
    try { return d(); } catch (e) { if (typeof e !== "string") throw e; last = e; }
  }
  throw last;
}

// Fills column c (index j of columns, n rows) with u(f); returns messages (in the chosen language) like recalcFormulas does.
function propagateColumn(c, columns, j, n) {
  const r = parseUncertainty(c.uncert.formula, c.uncert.map, columns, j);
  if (r.error) { c.values = Array(n).fill(null); return [t("f_col", { name: c.name, why: r.error })]; }
  const need = [...new Set([...r.refs, ...r.terms.flatMap(t => t.refs)])], bad = [];
  c.values = Array.from({ length: n }, (_, i) => {
    const row = columns.map(k => k.values[i]);
    if (need.some(k => row[k] === null || row[k] === undefined)) return null;
    try {
      let s = 0;
      for (const term of r.terms) {
        const u = term.u(row);
        if (!Number.isFinite(u) || u < 0) throw t("u_neg");
        s += (partial(r.fn, row, term.j) * u) ** 2;
      }
      return Math.sqrt(s);
    } catch (e) {
      if (typeof e !== "string") throw e;
      bad.push([i + 1, e]); return null;
    }
  });
  return bad.length ? [_F.rowMessage(c.name, bad)] : [];
}
_F.FORMULA_HOOKS.uncert = propagateColumn;

if (typeof module !== "undefined") module.exports = { parseUncertainty, propagateColumn, partial };
