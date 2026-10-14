if (typeof module !== "undefined") require("./i18n.js"); // t() and nf() are globals on the page; in Node this makes them globals
// Logarithmic y axis (P8): only values above 0 can be drawn. Pure functions, also loaded by the Node tests.
const fmtNum = v => nf({ maximumSignificantDigits: 6 }).format(v);

// cols: [{name, values}] that the plot would draw. Returns a message (in the chosen language) naming column, rows and values, or null when the axis is fine.
function logYProblem(cols) {
  for (const c of cols) {
    const bad = c.values.map((v, i) => [i, v]).filter(([, v]) => v !== null && !(v > 0));
    if (!bad.length) continue;
    const shown = bad.slice(0, 3).map(([i, v]) => t("ly_row", { i: i + 1, v: fmtNum(v) })).join(", ") + (bad.length > 3 ? t("ly_more", { n: bad.length - 3 }) : "");
    return t("ly_msg", { name: c.name, which: bad.length === 1 ? t("ly_one") : t("ly_many", { n: bad.length }), shown });
  }
  return null;
}

// Number of points whose lower error bar reaches 0 or below (y - err <= 0). It cannot be drawn on a log axis, only the upper bar is.
const clippedBars = (y, err) => y.reduce((n, v, i) => n + (v !== null && err[i] != null && v - err[i] <= 0 ? 1 : 0), 0);

if (typeof module !== "undefined") module.exports = { logYProblem, clippedBars };
