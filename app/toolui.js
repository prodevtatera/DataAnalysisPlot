// Page part of the tools: shows the panels listed in proj.settings.tools and handles the menu. Opening or closing a tool is saved with the project
// but is not an undo step (see restore() in index.html). Needs proj, $ and autosave() from the page.
// Before any project exists (only the test address ?start=leer) the choice waits in noProject and goes into the first project.
let noProject = [];
const toolsNow = () => proj ? toolsOpen(proj) ?? [] : noProject;
function syncTools() {
  const open = toolsNow();
  for (const el of document.querySelectorAll("[data-tool-panel]")) el.hidden = !open.includes(el.dataset.toolPanel);
  for (const b of document.querySelectorAll("[data-tool]")) {
    b.classList.toggle("open", open.includes(b.dataset.tool));
    b.setAttribute("aria-pressed", String(open.includes(b.dataset.tool)));
    b.querySelector(".mark").hidden = !proj || !toolUsed(proj, b.dataset.tool);
  }
  const n = proj ? toolsUsed(proj).length : 0;
  $("toolcount").textContent = n ? "(" + t("tool_nres", { n }) + ")" : "";
}
function setTools(list) {
  list = TOOLS.filter(id => list.includes(id));
  if (proj) { proj.settings.tools = list; autosave(); } else noProject = list;
  syncTools();
}
// Opens a tool (the menu closes) and brings its panel into view; a tool that is already open is just shown.
function openTool(id) {
  if (!TOOLS.includes(id)) return;
  if (!toolsNow().includes(id)) setTools([...toolsNow(), id]);
  $("toolmenu").open = false;
  document.querySelector(`[data-tool-panel="${id}"]`).scrollIntoView({ block: "start", behavior: "smooth" });
}
const closeTool = id => setTools(toolsNow().filter(x => x !== id));
document.addEventListener("click", e => {
  const o = e.target.closest("[data-tool]"), c = e.target.closest("[data-close]");
  if (o) openTool(o.dataset.tool);
  else if (c) closeTool(c.dataset.close);
});
