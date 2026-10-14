if (typeof module !== "undefined") require("./i18n.js"); // t() and nf() are globals on the page; in Node this makes them globals
// Chi-square goodness of fit of counts against Poisson and Gauss (P8 radioactivity). Pure functions; the expected counts, chi-square and p-value
// come from SciPy in the worker, the page draws. Counts per interval are whole numbers, grouped into classes [start + i·width, start + (i+1)·width).
const _G = typeof module !== "undefined" ? require("./stats.js") : { describe, histogram };
const GOF_ALPHA = 0.05;
const GOF_MIN_EXPECTED = 5;   // below this a class makes the chi-square approximation unreliable: the page warns

// values: one column (null = empty cell); st: {width, start} (null = automatic). Returns {n, mean, s, sem, start, width, edges, counts} or {error} (message in the chosen language).
// Automatic classes: start at the smallest count, width = whole number giving about 8 classes (at least 1).
function gofPrepare(name, values, st) {
  const rows = values.map((v, i) => [i + 1, v]).filter(([, v]) => v !== null), fmt = v => nf({ maximumSignificantDigits: 6 }).format(v);
  if (rows.length < 2) return { error: t("g_few", { name, n: rows.length, word: t(rows.length === 1 ? "u_value" : "u_values") }) };
  const odd = rows.find(([, v]) => !(Number.isInteger(v) && v >= 0));
  if (odd) return { error: t("g_whole", { row: odd[0], name, v: fmt(odd[1]) }) };
  const vals = rows.map(([, v]) => v), lo = Math.min(...vals), hi = Math.max(...vals);
  if (lo === hi) return { error: t("g_equal", { name, v: fmt(lo) }) };
  const width = st.width ?? Math.max(1, Math.ceil((hi - lo + 1) / 8)), start = st.start ?? lo;
  if (start > lo) return { error: t("g_start", { start: fmt(start), lo: fmt(lo) }) };
  const k = Math.floor((hi - start) / width) + 1;
  if (k > 100) return { error: t("g_many", { w: fmt(width), k: fmt(k) }) };
  if (k < 4) return { error: t("g_fewcls", { w: fmt(width), start: fmt(start), k, word: t(k === 1 ? "u_class" : "u_classes") }) };
  const d = _G.describe(vals, 1), h = _G.histogram(vals, start, width);
  return { n: d.n, mean: d.mean, s: d.s, sem: d.sem, start, width, edges: h.edges, counts: h.counts, auto: { width: st.width === null, start: st.start === null } };
}
// One sentence per distribution: p >= 0,05 means the counts do not contradict it (that is no proof that it is the right one).
const gofVerdict = (name, p) => t(p >= GOF_ALPHA ? "g_verdict_ok" : "g_verdict_no", { name });
// 1-based numbers of the classes whose expected count is below 5.
const gofLow = expected => expected.map((e, i) => [i + 1, e]).filter(([, e]) => e < GOF_MIN_EXPECTED).map(([i]) => i);

if (typeof module !== "undefined") module.exports = { gofPrepare, gofVerdict, gofLow, GOF_ALPHA, GOF_MIN_EXPECTED };
