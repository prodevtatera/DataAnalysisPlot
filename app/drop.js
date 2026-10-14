if (typeof module !== "undefined") require("./i18n.js"); // t() and nf() are globals on the page; in Node this makes them globals
// A file dropped on the page: what is it? Returns {kind: "project" | "table", text} or {error} (in the chosen language, says what to do instead).
// The text is cleaned of a byte-order mark. Reading the project or the table is done by the page (open / parseTable).
function classifyDrop(name, type, text) {
  const n = String(name).toLowerCase(), ty = String(type);
  if (/\.(xlsx?|ods)$/.test(n)) return { error: t("dr_excel", { name }) };
  if (ty.startsWith("image/") || ty === "application/pdf" || /\.(png|jpe?g|gif|svg|webp|bmp|tiff?|pdf)$/.test(n) || text.includes("\0"))
    return { error: t("dr_notable", { name }) };
  text = text.replace(/^﻿/, "");
  if (/\.(plotlab|json)$/.test(n) || text.trimStart().startsWith("{")) return { kind: "project", text };
  if (!/\d/.test(text)) return { error: t("dr_nonum", { name }) };
  return { kind: "table", text };
}
if (typeof module !== "undefined") module.exports = { classifyDrop };
