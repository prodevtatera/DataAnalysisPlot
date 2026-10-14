if (typeof module !== "undefined") require("./i18n.js"); // t() and nf() are globals on the page; in Node this makes them globals
// Parses pasted text into a table. Handles ";" or tab (decimal comma allowed) and "," (decimal point).
// Returns {header, rows} or {error} with a message in the chosen language that a student can act on (texts in i18n.js).
function parseTable(text) {
  const lines = String(text).split(/\r?\n/).filter(l => l.trim() !== "");
  if (!lines.length) return { error: t("pt_none") };
  const first = lines[0];
  const delim = first.includes(";") ? ";" : first.includes("\t") ? "\t" : first.includes(",") ? "," : null;
  // ponytail: a single column of decimal commas ("1,5") reads as two columns; paste with ";" for that.
  const cells = lines.map(l => (delim ? l.split(delim) : [l]).map(c => c.trim()));
  const num = c => {
    const t = delim === "," ? c : c.replace(",", ".");
    return /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(t) ? Number(t) : NaN;
  };
  const hasHeader = cells[0].some(c => c !== "" && isNaN(num(c)));
  const header = hasHeader ? cells[0] : cells[0].map((_, i) => t("col_default", { n: i + 1 }));
  const body = hasHeader ? cells.slice(1) : cells;
  if (!body.length) return { error: t("pt_head") };
  const n = header.length, off = hasHeader ? 2 : 1;
  const rows = [];
  for (let i = 0; i < body.length; i++) {
    if (body[i].length !== n)
      return { error: t("pt_cols", { r: i + off, a: body[i].length, n }) };
    const row = [];
    for (let j = 0; j < n; j++) {
      const c = body[i][j];
      if (c === "") { row.push(null); continue; }
      const v = num(c);
      if (isNaN(v)) return { error: t("not_number", { r: i + off, c: j + 1, v: c }) };
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
  if (!lines.length) return { error: t("pb_none") };
  const delim = text.includes("\t") ? "\t" : ";";
  const cells = lines.map(l => l.split(delim).map(c => c.trim()));
  const w = cells[0].length, rows = [];
  for (let i = 0; i < cells.length; i++) {
    if (cells[i].length !== w) return { error: t("pb_cols", { r: i + 1, a: cells[i].length, w }) };
    const row = [];
    for (let j = 0; j < w; j++) {
      const c = cells[i][j], d = c.replace(",", ".");
      if (c !== "" && !/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(d)) return { error: t("pb_num", { r: i + 1, c: j + 1, v: c }) };
      row.push(c === "" ? null : Number(d));
    }
    rows.push(row);
  }
  return { rows };
}
// Writes rows into columns (the project's column list) from row r0, first cell in column c0, going right over the
// columns that hold typed numbers (formula columns are skipped). Adds rows when needed. Returns a message
// and changes nothing when the block does not fit; on success returns null.
const MAX_PASTE_ROWS = 2000;
function pasteInto(columns, r0, c0, rows) {
  const typed = [];
  columns.forEach((c, j) => { if (j >= c0 && c.formula === undefined && c.uncert === undefined) typed.push(j); });
  if (rows[0].length > typed.length) return t("pi_cols", { a: rows[0].length, have: t(typed.length === 1 ? "u_col" : "u_cols", { n: typed.length }) });
  const n = r0 + rows.length;
  if (n > MAX_PASTE_ROWS) return t("pi_rows", { n, max: MAX_PASTE_ROWS });
  columns.forEach(c => { while (c.values.length < n) c.values.push(null); });
  rows.forEach((row, i) => row.forEach((v, k) => { columns[typed[k]].values[r0 + i] = v; }));
  return null;
}
if (typeof module !== "undefined") module.exports = { parseTable, parseBlock, pasteInto };
