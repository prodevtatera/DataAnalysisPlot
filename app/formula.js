if (typeof module !== "undefined") require("./i18n.js"); // t() and nf() are globals on the page; in Node this makes them globals
// Formula columns: a small parser for + - * / ^, parentheses, numbers (decimal comma or point), column names
// and a fixed list of functions. The text is never run as code (no eval, no new Function): it becomes a tree of closures.
// A formula may use only columns to its left, so recalculating in column order cannot loop.
const FORMULA_FUNCTIONS = {
  // a thrown string is the message (in the chosen language); the callers catch strings and show them
  sqrt: x => { if (x < 0) throw t("f_sqrt"); return Math.sqrt(x); },
  ln: x => { if (!(x > 0)) throw t("f_log"); return Math.log(x); },
  log10: x => { if (!(x > 0)) throw t("f_log"); return Math.log10(x); },
  exp: Math.exp, abs: Math.abs, sin: Math.sin, cos: Math.cos, tan: Math.tan,
};
FORMULA_FUNCTIONS.wurzel = FORMULA_FUNCTIONS.sqrt;
const FORMULA_CONSTANTS = { pi: Math.PI };
const FORMULA_MAX_LENGTH = 300;
const shortName = n => n.split(" / ")[0].trim();
// Other files (propagate.js) register how to recalculate special columns here: FORMULA_HOOKS.uncert(column, columns, index, rows).
const FORMULA_HOOKS = {};

// Returns {fn, refs, lookup} (fn(valuesOfRow) -> number, refs = column indexes it reads, lookup(name) -> column index,
// undefined if unknown, -1 if ambiguous) or {error} (message in the chosen language).
// what = "quantity" is for the derived quantity: the names are then called quantities, not columns.
// ponytail: names are looked up among columns 0..upto-1 only.
function parseFormula(text, columns, upto = columns.length, what = "column") {
  const src = String(text).replace(/[·×]/g, "*").replace(/−/g, "-").replace(/÷/g, "/");
  if (src.trim() === "") return { error: t("f_enter") };
  if (src.length > FORMULA_MAX_LENGTH) return { error: t("f_long", { max: FORMULA_MAX_LENGTH }) };

  // Names a formula may use: full column name, or the part before " / " when that is unique.
  const full = new Map(), shorts = new Map();
  for (let j = 0; j < upto; j++) {
    full.set(columns[j].name, j);
    const s = shortName(columns[j].name);
    shorts.set(s, shorts.has(s) ? -1 : j);
  }
  const lookup = n => full.has(n) ? full.get(n) : shorts.has(n) ? shorts.get(n) : undefined;
  const available = () => [...new Set(columns.slice(0, upto).map(c => shortName(c.name)))].slice(0, 8).join(", ");

  const toks = [], re = /\s*(?:(\d+(?:[.,]\d+)?(?:[eE][+-]?\d+)?|[.,]\d+)|([\p{L}_][\p{L}\p{Nd}_]*)|\[([^\]]+)\]|(.))/uy;
  for (let m; re.lastIndex < src.length && (m = re.exec(src));) {
    if (m[1] !== undefined) toks.push({ t: "num", v: Number(m[1].replace(",", ".")) });
    else if (m[2] !== undefined) toks.push({ t: "id", v: m[2] });
    else if (m[3] !== undefined) toks.push({ t: "ref", v: m[3].trim() });
    else if (m[4] !== undefined && m[4].trim() !== "") toks.push({ t: "op", v: m[4] });
  }
  toks.push({ t: "end" });
  let pos = 0;
  const refs = new Set();
  const fail = msg => { throw { parse: msg }; };
  const peek = () => toks[pos];
  const isOp = v => peek().t === "op" && peek().v === v;
  const show = k => k.t === "end" ? t("f_end") : t("f_tok", { v: k.v });

  const column = name => {
    const j = lookup(name);
    if (j === -1) fail(t("f_ambig", { name, full: columns.find(c => shortName(c.name) === name).name }));
    if (j === undefined) {
      const vars = { name, avail: available() ? t("f_avail", { list: available() }) : "" };
      fail(what === "quantity" ? t("f_unknownq", vars) : t("f_unknown", vars));
    }
    refs.add(j);
    return v => v[j];
  };
  function primary() {
    const k = peek();
    if (k.t === "num") { pos++; return () => k.v; }
    if (k.t === "ref") { pos++; return column(k.v); }
    if (k.t === "id") {
      pos++;
      if (isOp("(")) {
        if (!Object.hasOwn(FORMULA_FUNCTIONS, k.v)) fail(t("f_unkfun", { name: k.v, list: Object.keys(FORMULA_FUNCTIONS).join(", ") }));
        pos++; const a = expr(); if (!isOp(")")) fail(t("f_paren")); pos++;
        const f = FORMULA_FUNCTIONS[k.v]; return v => f(a(v));
      }
      if (Object.hasOwn(FORMULA_CONSTANTS, k.v)) return () => FORMULA_CONSTANTS[k.v];
      return column(k.v);
    }
    if (isOp("(")) { pos++; const a = expr(); if (!isOp(")")) fail(t("f_paren")); pos++; return a; }
    return fail(t("f_unexp1", { tok: show(k) }));
  }
  function power() {
    let a = primary();
    while (isOp("²") || isOp("³")) { const k = peek().v === "²" ? 2 : 3, l = a; pos++; a = v => l(v) ** k; }
    if (isOp("^")) { pos++; const l = a, b = unary(); return v => l(v) ** b(v); }
    return a;
  }
  function unary() {
    if (isOp("-")) { pos++; const a = unary(); return v => -a(v); }
    if (isOp("+")) { pos++; return unary(); }
    return power();
  }
  function term() {
    let a = unary();
    while (isOp("*") || isOp("/")) {
      const div = peek().v === "/"; pos++;
      const l = a, r = unary();
      a = div ? v => { const d = r(v); if (d === 0) throw t("f_div0"); return l(v) / d; } : v => l(v) * r(v);
    }
    return a;
  }
  function expr() {
    let a = term();
    while (isOp("+") || isOp("-")) {
      const minus = peek().v === "-"; pos++;
      const l = a, r = term();
      a = minus ? v => l(v) - r(v) : v => l(v) + r(v);
    }
    return a;
  }
  try {
    const fn = expr();
    if (peek().t !== "end") fail(t("f_unexp2", { tok: show(peek()) }));
    return { fn, refs: [...refs], lookup };
  } catch (e) {
    if (e && typeof e.parse === "string") return { error: e.parse };
    throw e;
  }
}

// "Column q, row 4: Division by 0. The value stays empty. Other affected rows: 6, 9." bad = [[row, reason], ...]
const rowMessage = (name, bad) => t("f_row", { name, row: bad[0][0], why: bad[0][1], more: bad.length > 1 ? t("f_more", { list: bad.slice(1).map(b => b[0]).join(", ") }) : "" });

// Recomputes every formula column of project p in place (columns left to right).
// Returns a list of messages (in the chosen language) for formulas that failed or rows that could not be calculated.
function recalcFormulas(p) {
  const msgs = [], n = p.columns[0].values.length;
  p.columns.forEach((c, j) => {
    if (c.uncert && FORMULA_HOOKS.uncert) { msgs.push(...FORMULA_HOOKS.uncert(c, p.columns, j, n)); return; }
    if (typeof c.formula !== "string") return;
    const r = parseFormula(c.formula, p.columns, j);
    if (r.error) { c.values = Array(n).fill(null); msgs.push(t("f_col", { name: c.name, why: r.error })); return; }
    const bad = [];
    c.values = Array.from({ length: n }, (_, i) => {
      const row = p.columns.map(k => k.values[i]);
      if (r.refs.some(k => row[k] === null || row[k] === undefined)) return null;
      try {
        const v = r.fn(row);
        if (!Number.isFinite(v)) throw t("f_nonfinite");
        return v;
      } catch (e) {
        if (typeof e !== "string") throw e;
        bad.push([i + 1, e]); return null;
      }
    });
    if (bad.length) msgs.push(rowMessage(c.name, bad));
  });
  return msgs;
}

if (typeof module !== "undefined") module.exports = { parseFormula, recalcFormulas, rowMessage, shortName, FORMULA_HOOKS };
