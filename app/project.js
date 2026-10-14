// Project model: raw data, column roles, analysis settings and results in one JSON object.
// Each result stores a fingerprint of the data it was computed from, so edits make it show as out of date.
const ROLES = ["x", "y", "yerr", "unused"];

function newProject(header, rows) {
  return {
    format: "datenplot-projekt", version: 1,
    columns: header.map((name, j) => ({ name, role: ROLES[j] || "unused", values: rows.map(r => r[j] ?? null) })),
    settings: { model: "line", weighted: true },
    results: [],
  };
}

// Fingerprint (FNV-1a) of the columns a result used: names, roles and values.
const fnv = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0; return h.toString(16); };
function fingerprint(p, usedRoles = ["x", "y", "yerr"]) {
  return fnv(JSON.stringify(p.columns.filter(c => usedRoles.includes(c.role)).map(c => [c.name, c.role, c.values])));
}
// Mean and spread of one chosen column: the settings are {col, ddof, instr}; the default column is y, else the first one.
function statsSettings(p) {
  const st = p.settings.stats || {}, y = p.columns.find(c => c.role === "y") || p.columns[0];
  return { col: p.columns.some(c => c.name === st.col) ? st.col : y.name, ddof: st.ddof === 0 ? 0 : 1, instr: Number.isFinite(st.instr) ? st.instr : null };
}
// The result depends on the current settings and on that column's values.
const statsKey = p => { const st = statsSettings(p); return fnv(JSON.stringify([st, p.columns.find(c => c.name === st.col).values])); };
// Weighted mean of results (value column, uncertainty column) with the overlap factor k: defaults are the y and y-error columns.
function wmeanSettings(p) {
  const st = p.settings.wmean || {}, has = n => p.columns.some(c => c.name === n);
  const val = has(st.val) ? st.val : (p.columns.find(c => c.role === "y") || p.columns[0]).name;
  const unc = has(st.unc) ? st.unc : st.unc === null ? null : (p.columns.find(c => c.role === "yerr") || {}).name ?? null; // null = "(keine)" chosen on purpose
  return { val, unc, k: st.k > 0 ? st.k : 1 };
}
const wmeanKey = p => { const st = wmeanSettings(p), by = n => (p.columns.find(c => c.name === n) || {}).values; return fnv(JSON.stringify([st, by(st.val), by(st.unc)])); };

// Frequency table and histogram of one column (P1): column, divisor of s, class width and start (null = automatic).
function histSettings(p) {
  const st = p.settings.hist || {}, y = p.columns.find(c => c.role === "y") || p.columns[0];
  return { col: p.columns.some(c => c.name === st.col) ? st.col : y.name, ddof: st.ddof === 0 ? 0 : 1, width: st.width > 0 ? st.width : null, start: Number.isFinite(st.start) ? st.start : null };
}
const histKey = p => { const st = histSettings(p); return fnv(JSON.stringify([st, p.columns.find(c => c.name === st.col).values])); };
// Chi-square test of counts against Poisson and Gauss (P8): column of counts, class width and start as whole numbers (null = automatic).
function gofSettings(p) {
  const st = p.settings.gof || {}, y = p.columns.find(c => c.role === "y") || p.columns[0], whole = (v, min) => Number.isInteger(v) && v >= min ? v : null;
  return { col: p.columns.some(c => c.name === st.col) ? st.col : y.name, width: whole(st.width, 1), start: whole(st.start, 0) };
}
const gofKey = p => { const st = gofSettings(p); return fnv(JSON.stringify([st, p.columns.find(c => c.name === st.col).values])); };
// Derived quantity from the fit parameters (P3, P4, P5, P9): name, unit, formula over a and b, further quantities "L = 1 ± 0,002", expected unit of a (optional). All text.
function derivedSettings(p) {
  const d = p.settings.derived || {}, t = k => typeof d[k] === "string" ? d[k] : "";
  return { name: t("name"), unit: t("unit"), formula: t("formula"), vars: t("vars"), aUnit: t("aUnit") };
}
// Calibration read-off (P4, P7): the measured y0 values as text "0,45 ± 0,01; 0,62 ± 0,01".
const calibSettings = p => ({ y0: typeof ((p.settings || {}).calib || {}).y0 === "string" ? p.settings.calib.y0 : "" });
// Several y series fitted over their own x ranges (P3 loading and unloading): [{y, err, xmin, xmax}], at most 4. A series whose y column is gone is dropped.
const SERIES_MAX = 4;
function seriesSettings(p) {
  const raw = Array.isArray((p.settings || {}).series) ? p.settings.series : [], has = n => p.columns.some(c => c.name === n), num = v => Number.isFinite(v) ? v : null;
  return raw.filter(s => s && has(s.y)).slice(0, SERIES_MAX).map(s => ({ y: s.y, err: has(s.err) ? s.err : null, xmin: num(s.xmin), xmax: num(s.xmax) }));
}
const seriesKey = p => {
  const x = p.columns.find(c => c.role === "x"), by = n => (p.columns.find(c => c.name === n) || {}).values, st = seriesSettings(p);
  return fnv(JSON.stringify([st, x && [x.name, x.values], st.map(s => [by(s.y), by(s.err)])]));
};
// Results that depend on their own settings and columns instead of the x/y/error fingerprint.
const KEYS = { stats: statsKey, wmean: wmeanKey, hist: histKey, gof: gofKey, series: seriesKey };

function addResult(p, result) {
  p.results = p.results.filter(r => r.kind !== result.kind);
  p.results.push({ ...result, settings: { ...p.settings }, computedFrom: (KEYS[result.kind] || fingerprint)(p) });
}

// Stale when the data changed, weighting was switched after the fit, or (derived and calibration results) their own inputs changed.
const isStale = (p, r) => KEYS[r.kind] ? r.computedFrom !== KEYS[r.kind](p) : r.computedFrom !== fingerprint(p) || (r.settings || {}).weighted !== p.settings.weighted ||
  (r.kind === "derived" && JSON.stringify(derivedSettings({ settings: r.settings || {} })) !== JSON.stringify(derivedSettings(p))) ||
  (r.kind === "calib" && JSON.stringify(calibSettings({ settings: r.settings || {} })) !== JSON.stringify(calibSettings(p)));

const save = p => JSON.stringify(p, null, 1);

// Returns {project} or {error} (German message).
function open(text) {
  let p;
  try { p = JSON.parse(text); } catch { return { error: "Die Datei ist kein gültiges Projekt (kein lesbares JSON)." }; }
  if (!p || p.format !== "datenplot-projekt") return { error: "Die Datei ist kein Projekt dieser Anwendung." };
  if (p.version !== 1) return { error: `Projektversion ${p.version} wird nicht unterstützt.` };
  const ok = Array.isArray(p.columns) && p.columns.length && Array.isArray(p.results) && p.settings &&
    p.columns.every(c => typeof c.name === "string" && (c.formula === undefined || typeof c.formula === "string") &&
      (c.uncert === undefined || (c.uncert !== null && typeof c.uncert.formula === "string" && typeof c.uncert.map === "string")) && ROLES.includes(c.role) && Array.isArray(c.values) &&
      c.values.length === p.columns[0].values.length && c.values.every(v => v === null || Number.isFinite(v)));
  return ok ? { project: p } : { error: "Das Projekt ist beschädigt: Spalten oder Werte fehlen oder sind keine Zahlen." };
}

if (typeof module !== "undefined") module.exports = { gofSettings, calibSettings, seriesSettings, SERIES_MAX, derivedSettings, statsSettings, wmeanSettings, histSettings, ROLES, newProject, fingerprint, addResult, isStale, save, open };
