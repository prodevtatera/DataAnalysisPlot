// Chi-square goodness of fit of counts against Poisson and Gauss (P8 radioactivity). Pure functions; the expected counts, chi-square and p-value
// come from SciPy in the worker, the page draws. Counts per interval are whole numbers, grouped into classes [start + i·width, start + (i+1)·width).
const _G = typeof module !== "undefined" ? require("./stats.js") : { describe, histogram };
const GOF_ALPHA = 0.05;
const GOF_MIN_EXPECTED = 5;   // below this a class makes the chi-square approximation unreliable: the page warns

// values: one column (null = empty cell); st: {width, start} (null = automatic). Returns {n, mean, s, sem, start, width, edges, counts} or {error} (German).
// Automatic classes: start at the smallest count, width = whole number giving about 8 classes (at least 1).
function gofPrepare(name, values, st) {
  const rows = values.map((v, i) => [i + 1, v]).filter(([, v]) => v !== null), fmt = v => new Intl.NumberFormat("de-DE", { maximumSignificantDigits: 6 }).format(v);
  if (rows.length < 2) return { error: `Die Spalte „${name}“ hat ${rows.length} Wert${rows.length === 1 ? "" : "e"}. Für den χ²-Test braucht es viele Zählwerte.` };
  const odd = rows.find(([, v]) => !(Number.isInteger(v) && v >= 0));
  if (odd) return { error: `Zählwerte sind ganze Zahlen ab 0. In Zeile ${odd[0]} der Spalte „${name}“ steht ${fmt(odd[1])}.` };
  const vals = rows.map(([, v]) => v), lo = Math.min(...vals), hi = Math.max(...vals);
  if (lo === hi) return { error: `Alle Werte der Spalte „${name}“ sind gleich (${fmt(lo)}). Mit Standardabweichung 0 gibt es keine Gauß-Verteilung und keine Klassen.` };
  const width = st.width ?? Math.max(1, Math.ceil((hi - lo + 1) / 8)), start = st.start ?? lo;
  if (start > lo) return { error: `Der Beginn ${fmt(start)} liegt über dem kleinsten Wert ${fmt(lo)}. Bitte einen Beginn kleiner oder gleich dem kleinsten Wert wählen.` };
  const k = Math.floor((hi - start) / width) + 1;
  if (k > 100) return { error: `Mit Klassenbreite ${fmt(width)} gäbe es ${fmt(k)} Klassen. Das sind zu viele (höchstens 100). Bitte eine größere Klassenbreite wählen.` };
  if (k < 4) return { error: `Mit Klassenbreite ${fmt(width)} ab ${fmt(start)} gibt es nur ${k} Klasse${k === 1 ? "" : "n"}. Für die Gauß-Verteilung (2 geschätzte Parameter) braucht es mindestens 4, sonst bleibt kein Freiheitsgrad. Bitte eine kleinere Klassenbreite wählen.` };
  const d = _G.describe(vals, 1), h = _G.histogram(vals, start, width);
  return { n: d.n, mean: d.mean, s: d.s, sem: d.sem, start, width, edges: h.edges, counts: h.counts, auto: { width: st.width === null, start: st.start === null } };
}
// One sentence per distribution: p >= 0,05 means the counts do not contradict it (that is no proof that it is the right one).
const gofVerdict = (name, p) => p >= GOF_ALPHA
  ? `${name}: Die Zählwerte widersprechen der ${name}-Verteilung nicht (p ≥ 0,05).`
  : `${name}: Die ${name}-Verteilung passt nicht zu den Zählwerten (p < 0,05), sie wird bei 5 % Signifikanzniveau verworfen.`;
// 1-based numbers of the classes whose expected count is below 5.
const gofLow = expected => expected.map((e, i) => [i + 1, e]).filter(([, e]) => e < GOF_MIN_EXPECTED).map(([i]) => i);

if (typeof module !== "undefined") module.exports = { gofPrepare, gofVerdict, gofLow, GOF_ALPHA, GOF_MIN_EXPECTED };
