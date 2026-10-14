// Shared helper for the browser tests (Phase 4 step 2). Since the workbench keeps most tools hidden until they are opened, a test that clicks or types into
// a tool first has to open it, like a student would: through the "Werkzeug wählen" menu and the tool's button (and through the "Beispiele" menu for the
// example buttons, and by pointing at the row for a row's delete button). `chromium` here is Playwright's, but every page it makes does that first.
// Reading a hidden element (textContent, $eval, evaluate) needs no opening, only actions do. Nothing else about the pages changes.
import { createRequire } from "node:module";
import { resolve } from "node:path";
const raw = createRequire(resolve("testbuild/x.js"))("playwright-core").chromium;
const ACTIONS = ["click", "dblclick", "fill", "selectOption", "check", "uncheck", "press", "type", "hover", "focus"];

// Opens the tool with this id through the page's own menu (a no-op when it is open).
export async function openTool(p, id) {
  if (!(await p.evaluate(i => document.querySelector(`[data-tool-panel="${i}"]`).hidden, id))) return;
  if (!(await p.evaluate(() => document.getElementById("toolmenu").open))) await p.__raw.click("#toolmenu > summary");
  await p.__raw.click(`[data-tool="${id}"]`);
}
export const openTools = async (p, ...ids) => { for (const id of ids) await openTool(p, id); };
export const ALL_TOOLS = ["paste", "formula", "stats", "hist", "cum", "gof", "wmean", "series", "derived", "calib", "compare", "logy", "export"];

async function prepare(p, sel) {
  if (typeof sel !== "string") return;
  let info;
  try {
    info = await p.evaluate(s => {
      let el; try { el = document.querySelector(s); } catch { return null; }
      if (!el) return null;
      const m = el.closest("details.menu"), panel = el.closest("[data-tool-panel]");
      return { menu: m && !m.open ? m.id : null, tool: panel && panel.hidden ? panel.dataset.toolPanel : null, del: el.matches("td > [data-del]") };
    }, sel);
  } catch { return; }          // the page is loading or the selector is not CSS: let Playwright wait as usual
  if (!info) return;
  if (info.tool) await openTool(p, info.tool);
  if (info.menu) await p.__raw.click(`#${info.menu} > summary`);
  if (info.del) await p.__raw.hover(`tr:has(${sel})`);   // the row's delete button shows while the pointer is on the row
}
function wrapPage(p) {
  if (p.__raw) return p;
  p.__raw = {};
  for (const m of ACTIONS) {
    p.__raw[m] = p[m].bind(p);
    p[m] = async (sel, ...rest) => { await prepare(p, sel); return p.__raw[m](sel, ...rest); };
  }
  return p;
}
function wrapContext(c) {
  const np = c.newPage.bind(c);
  c.newPage = async (...a) => wrapPage(await np(...a));
  return c;
}
function wrapBrowser(b) {
  const nc = b.newContext.bind(b), np = b.newPage.bind(b);
  b.newContext = async (...a) => wrapContext(await nc(...a));
  b.newPage = async (...a) => wrapPage(await np(...a));
  return b;
}
export const chromium = {
  launch: async (...a) => wrapBrowser(await raw.launch(...a)),
  launchPersistentContext: async (...a) => wrapContext(await raw.launchPersistentContext(...a)),
};
