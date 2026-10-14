// Several y series against one x column, each fitted over its own x range (P3 loading and unloading), and the comparison of two slopes.
// Pure functions: the page does the SciPy call and the drawing.
const _colUnit = typeof module !== "undefined" ? require("./project.js").colUnit : colUnit; // project.js is loaded first on the page
const SERIES_K = 2; // slopes count as equal when they differ by less than this many combined uncertainties

// Is the x value inside the series' range? Empty ends are open; the tolerance keeps 0,1 + 0,2 inside a range that ends at 0,3.
const inRange = (v, s) => (s.xmin === null || v >= s.xmin - 1e-9 * Math.max(1, Math.abs(s.xmin))) && (s.xmax === null || v <= s.xmax + 1e-9 * Math.max(1, Math.abs(s.xmax)));

// Checks the series settings against the data. Returns {jobs} (one per series: the points to fit) or {error} (German message).
function prepareSeries(p, list) {
  const x = p.columns.find(c => c.role === "x");
  if (!x) return { error: "Für die Anpassung braucht es eine x-Spalte. Wähle die Rolle „x-Werte“ in der Tabelle." };
  if (!list.length) return { error: "Es gibt noch keine Reihe. Bitte mit „Reihe hinzufügen“ eine y-Spalte wählen." };
  const de = v => String(v).replace(".", ","), unit = c => _colUnit(c.name), by = n => p.columns.find(c => c.name === n), jobs = [];
  for (const [k, s] of list.entries()) {
    const yc = by(s.y), ec = s.err === null ? null : by(s.err), who = `Reihe ${k + 1} („${s.y}“)`;
    if (yc === x) return { error: `${who}: Die y-Spalte ist die x-Spalte. Bitte eine andere Spalte wählen.` };
    if (ec && (ec === yc || ec === x)) return { error: `${who}: Die Fehlerspalte muss eine andere Spalte sein als x und y.` };
    if (s.xmin !== null && s.xmax !== null && s.xmin > s.xmax) return { error: `${who}: Der x-Bereich ist leer, denn „x von“ (${de(s.xmin)}) ist größer als „x bis“ (${de(s.xmax)}).` };
    const idx = x.values.map((_, i) => i).filter(i => x.values[i] !== null && yc.values[i] !== null && inRange(x.values[i], s));
    if (idx.length < 3) return { error: `${who}: Im gewählten x-Bereich liegen ${idx.length} Messpunkt${idx.length === 1 ? "" : "e"}. Für eine Gerade braucht es mindestens drei.` };
    const bad = ec ? idx.find(i => !(ec.values[i] > 0)) : undefined;
    if (bad !== undefined) return { error: `${who}: Alle Fehlerwerte müssen größer als 0 sein (Zeile ${bad + 1}).` };
    const xs = idx.map(i => x.values[i]);
    if (Math.min(...xs) === Math.max(...xs)) return { error: `${who}: Alle x-Werte im Bereich sind gleich. Eine Gerade ist so nicht bestimmt.` };
    const ux = unit(x), uy = unit(yc);
    jobs.push({ y: s.y, err: s.err, xmin: s.xmin, xmax: s.xmax, idx, x: xs, yv: idx.map(i => yc.values[i]), sy: ec ? idx.map(i => ec.values[i]) : null,
      weighted: !!ec, xlo: Math.min(...xs), xhi: Math.max(...xs), unit: ux ? (uy ? uy + "/" + ux : "1/" + ux) : uy, yunit: uy });
  }
  return { jobs };
}

// Two slopes with their uncertainties: difference, its uncertainty (independent series) and the difference in units of that uncertainty.
function compareSlopes(a1, u1, a2, u2) {
  const diff = a1 - a2, u = Math.sqrt(u1 * u1 + u2 * u2);
  return { diff, u, z: u > 0 ? Math.abs(diff) / u : null };
}

// y axis title for several series: "ΔL auf, ΔL ab / mm" when they share the unit, else the full names.
function seriesAxisTitle(names) {
  const split = names.map(n => n.split(" / ")), units = new Set(split.map(s => s.slice(1).join(" / ")));
  return units.size === 1 && [...units][0] ? [...new Set(split.map(s => s[0]))].join(", ") + " / " + [...units][0] : names.join(", ");
}

if (typeof module !== "undefined") module.exports = { inRange, prepareSeries, compareSlopes, seriesAxisTitle, SERIES_K };
