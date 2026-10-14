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
function fingerprint(p, usedRoles = ["x", "y", "yerr"]) {
  const s = JSON.stringify(p.columns.filter(c => usedRoles.includes(c.role)).map(c => [c.name, c.role, c.values]));
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h.toString(16);
}

function addResult(p, result) {
  p.results = p.results.filter(r => r.kind !== result.kind);
  p.results.push({ ...result, settings: { ...p.settings }, computedFrom: fingerprint(p) });
}

// Stale when the data changed, weighting was switched after the fit, or (derived results) the extra inputs changed.
const isStale = (p, r) => r.computedFrom !== fingerprint(p) || (r.settings || {}).weighted !== p.settings.weighted ||
  (r.kind === "derived" && JSON.stringify((r.settings || {}).young) !== JSON.stringify(p.settings.young));

const save = p => JSON.stringify(p, null, 1);

// Returns {project} or {error} (German message).
function open(text) {
  let p;
  try { p = JSON.parse(text); } catch { return { error: "Die Datei ist kein gültiges Projekt (kein lesbares JSON)." }; }
  if (!p || p.format !== "datenplot-projekt") return { error: "Die Datei ist kein Projekt dieser Anwendung." };
  if (p.version !== 1) return { error: `Projektversion ${p.version} wird nicht unterstützt.` };
  const ok = Array.isArray(p.columns) && p.columns.length && Array.isArray(p.results) && p.settings &&
    p.columns.every(c => typeof c.name === "string" && ROLES.includes(c.role) && Array.isArray(c.values) &&
      c.values.length === p.columns[0].values.length && c.values.every(v => v === null || Number.isFinite(v)));
  return ok ? { project: p } : { error: "Das Projekt ist beschädigt: Spalten oder Werte fehlen oder sind keine Zahlen." };
}

if (typeof module !== "undefined") module.exports = { ROLES, newProject, fingerprint, addResult, isStale, save, open };
