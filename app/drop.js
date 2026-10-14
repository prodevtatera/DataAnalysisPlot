// A file dropped on the page: what is it? Returns {kind: "project" | "table", text} or {error} (German, says what to do instead).
// The text is cleaned of a byte-order mark. Reading the project or the table is done by the page (open / parseTable).
function classifyDrop(name, type, text) {
  const n = String(name).toLowerCase(), t = String(type);
  if (/\.(xlsx?|ods)$/.test(n)) return { error: `„${name}“ ist eine Excel-Datei, die PlotLab nicht lesen kann. Speichere die Tabelle in Excel als „CSV (Trennzeichen-getrennt)“ oder kopiere die Zellen und füge sie in die Tabelle ein.` };
  if (t.startsWith("image/") || t === "application/pdf" || /\.(png|jpe?g|gif|svg|webp|bmp|tiff?|pdf)$/.test(n) || text.includes("\0"))
    return { error: `„${name}“ ist keine Tabelle. Bitte eine CSV- oder Textdatei mit Zahlen oder ein PlotLab-Projekt (.plotlab) auf die Seite ziehen.` };
  text = text.replace(/^﻿/, "");
  if (/\.(plotlab|json)$/.test(n) || text.trimStart().startsWith("{")) return { kind: "project", text };
  if (!/\d/.test(text)) return { error: `In „${name}“ stehen keine Zahlen. Bitte eine CSV- oder Textdatei mit Messwerten auf die Seite ziehen.` };
  return { kind: "table", text };
}
if (typeof module !== "undefined") module.exports = { classifyDrop };
