// The "Werkzeuge" (tools) of the workbench: which ones are open is stored in the project settings (settings.tools, a list of ids).
// Pure functions, so Node tests can load them. A tool is "used" when the project holds something made with it.
const TOOLS = ["paste", "formula", "stats", "hist", "cum", "gof", "wmean", "series", "derived", "calib", "compare", "logy", "export"];
// Result kinds that belong to a tool (the cumulative plot is drawn from the histogram result).
const TOOL_KINDS = { stats: ["stats"], hist: ["hist"], cum: ["hist"], gof: ["gof"], wmean: ["wmean"], series: ["series"], derived: ["derived"], calib: ["calib"], compare: ["compare"] };

function toolUsed(p, id) {
  if (id === "formula") return p.columns.some(c => c.formula !== undefined || c.uncert !== undefined);
  if (id === "logy") return (p.settings || {}).logy === true;
  return (TOOL_KINDS[id] || []).some(k => p.results.some(r => r.kind === k));
}
const toolsUsed = p => TOOLS.filter(id => toolUsed(p, id));
// The stored list (unknown names dropped, no repeats), or null when the project has none (a file from before the tools existed).
function toolsOpen(p) {
  const l = (p.settings || {}).tools;
  return Array.isArray(l) ? TOOLS.filter(id => l.includes(id)) : null;
}
// A project without a stored list opens the tools it already has something in.
const toolsStart = p => toolsOpen(p) ?? toolsUsed(p);

if (typeof module !== "undefined") module.exports = { TOOLS, toolUsed, toolsUsed, toolsOpen, toolsStart };
