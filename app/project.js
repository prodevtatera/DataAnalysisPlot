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

function addResult(p, result) {
  p.results = p.results.filter(r => r.kind !== result.kind);
  p.results.push({ ...result, settings: { ...p.settings }, computedFrom: result.kind === "stats" ? statsKey(p) : fingerprint(p) });
}

// Stale when the data changed, weighting was switched after the fit, or (derived results) the extra inputs changed.
const isStale = (p, r) => r.kind === "stats" ? r.computedFrom !== statsKey(p) : r.computedFrom !== fingerprint(p) || (r.settings || {}).weighted !== p.settings.weighted ||
  (r.kind === "derived" && JSON.stringify((r.settings || {}).young) !== JSON.stringify(p.settings.young));

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

if (typeof module !== "undefined") module.exports = { statsSettings, ROLES, newProject, fingerprint, addResult, isStale, save, open };
