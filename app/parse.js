// Parses pasted text into a table. Handles ";" or tab (decimal comma allowed) and "," (decimal point).
// Returns {header, rows} or {error} with a German message a student can act on.
function parseTable(text) {
  const lines = String(text).split(/\r?\n/).filter(l => l.trim() !== "");
  if (!lines.length) return { error: "Keine Daten eingefügt. Füge Zahlen ein oder lade das Beispiel." };
  const first = lines[0];
  const delim = first.includes(";") ? ";" : first.includes("\t") ? "\t" : first.includes(",") ? "," : null;
  // ponytail: a single column of decimal commas ("1,5") reads as two columns; paste with ";" for that.
  const cells = lines.map(l => (delim ? l.split(delim) : [l]).map(c => c.trim()));
  const num = c => {
    const t = delim === "," ? c : c.replace(",", ".");
    return /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(t) ? Number(t) : NaN;
  };
  const hasHeader = cells[0].some(c => c !== "" && isNaN(num(c)));
  const header = hasHeader ? cells[0] : cells[0].map((_, i) => "Spalte " + (i + 1));
  const body = hasHeader ? cells.slice(1) : cells;
  if (!body.length) return { error: "Nur eine Kopfzeile gefunden, aber keine Messwerte." };
  const n = header.length, off = hasHeader ? 2 : 1;
  const rows = [];
  for (let i = 0; i < body.length; i++) {
    if (body[i].length !== n)
      return { error: `Zeile ${i + off} hat ${body[i].length} statt ${n} Spalten. Prüfe das Trennzeichen (; oder Tab).` };
    const row = [];
    for (let j = 0; j < n; j++) {
      const c = body[i][j];
      if (c === "") { row.push(null); continue; }
      const v = num(c);
      if (isNaN(v)) return { error: `Zeile ${i + off}, Spalte ${j + 1}: „${c}“ ist keine Zahl.` };
      row.push(v);
    }
    rows.push(row);
  }
  return { header, rows };
}
if (typeof module !== "undefined") module.exports = { parseTable };
