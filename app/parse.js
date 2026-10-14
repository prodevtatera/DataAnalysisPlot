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

// A block of cells pasted into the table (Excel copy: tab; German CSV: ";"). Numbers only, no header; "," is a decimal comma.
// ponytail: "," never separates columns here, because "1.000,5" would silently become two numbers.
// Returns {rows} (rectangular, null = empty cell) or {error}. Trailing empty lines (Excel adds one) are dropped.
function parseBlock(text) {
  const lines = String(text).replace(/\r/g, "").split("\n");
  while (lines.length && lines[lines.length - 1].trim() === "") lines.pop();
  if (!lines.length) return { error: "Keine Daten eingefügt." };
  const delim = text.includes("\t") ? "\t" : ";";
  const cells = lines.map(l => l.split(delim).map(c => c.trim()));
  const w = cells[0].length, rows = [];
  for (let i = 0; i < cells.length; i++) {
    if (cells[i].length !== w) return { error: `Eingefügter Block, Zeile ${i + 1}: ${cells[i].length} statt ${w} Spalten. Trenne Spalten mit Tab oder Semikolon. Es wurde nichts geändert.` };
    const row = [];
    for (let j = 0; j < w; j++) {
      const c = cells[i][j], t = c.replace(",", ".");
      if (c !== "" && !/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(t)) return { error: `Eingefügter Block, Zeile ${i + 1}, Spalte ${j + 1}: „${c}“ ist keine Zahl. Es wurde nichts geändert.` };
      row.push(c === "" ? null : Number(t));
    }
    rows.push(row);
  }
  return { rows };
}
// Writes rows into columns (the project's column list) from row r0, first cell in column c0, going right over the
// columns that hold typed numbers (formula columns are skipped). Adds rows when needed. Returns a German message
// and changes nothing when the block does not fit; on success returns null.
const MAX_PASTE_ROWS = 2000;
function pasteInto(columns, r0, c0, rows) {
  const typed = [];
  columns.forEach((c, j) => { if (j >= c0 && c.formula === undefined && c.uncert === undefined) typed.push(j); });
  if (rows[0].length > typed.length) return `Der eingefügte Block hat ${rows[0].length} Spalten, ab dieser Zelle gibt es aber nur ${typed.length} Spalte${typed.length === 1 ? "" : "n"} ohne Formel. Es wurde nichts geändert.`;
  const n = r0 + rows.length;
  if (n > MAX_PASTE_ROWS) return `Die Tabelle würde ${n} Zeilen bekommen. Mehr als ${MAX_PASTE_ROWS} Zeilen sind nicht möglich. Es wurde nichts geändert.`;
  columns.forEach(c => { while (c.values.length < n) c.values.push(null); });
  rows.forEach((row, i) => row.forEach((v, k) => { columns[typed[k]].values[r0 + i] = v; }));
  return null;
}
if (typeof module !== "undefined") module.exports = { parseTable, parseBlock, pasteInto };
