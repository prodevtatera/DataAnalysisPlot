// Logarithmic y axis (P8): only values above 0 can be drawn. Pure functions, also loaded by the Node tests.
const fmtNum = v => new Intl.NumberFormat("de-DE", { maximumSignificantDigits: 6 }).format(v);

// cols: [{name, values}] that the plot would draw. Returns a German message naming column, rows and values, or null when the axis is fine.
function logYProblem(cols) {
  for (const c of cols) {
    const bad = c.values.map((v, i) => [i, v]).filter(([, v]) => v !== null && !(v > 0));
    if (!bad.length) continue;
    const shown = bad.slice(0, 3).map(([i, v]) => `Zeile ${i + 1} (y = ${fmtNum(v)})`).join(", ") + (bad.length > 3 ? ` und ${bad.length - 3} weitere` : "");
    return `Die logarithmische y-Achse braucht Werte größer als 0. In Spalte „${c.name}“ ${bad.length === 1 ? "steht ein Wert" : "stehen " + bad.length + " Werte"} von 0 oder darunter: ${shown}. Korrigiere die Werte oder schalte die logarithmische Achse aus.`;
  }
  return null;
}

// Number of points whose lower error bar reaches 0 or below (y - err <= 0). It cannot be drawn on a log axis, only the upper bar is.
const clippedBars = (y, err) => y.reduce((n, v, i) => n + (v !== null && err[i] != null && v - err[i] <= 0 ? 1 : 0), 0);

if (typeof module !== "undefined") module.exports = { logYProblem, clippedBars };
