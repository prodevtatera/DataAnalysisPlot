// Formula columns: a small parser for + - * / ^, parentheses, numbers (decimal comma or point), column names
// and a fixed list of functions. The text is never run as code (no eval, no new Function): it becomes a tree of closures.
// A formula may use only columns to its left, so recalculating in column order cannot loop.
const FORMULA_FUNCTIONS = {
  sqrt: x => { if (x < 0) throw "Wurzel aus einer negativen Zahl"; return Math.sqrt(x); },
  ln: x => { if (!(x > 0)) throw "Logarithmus von 0 oder einer negativen Zahl"; return Math.log(x); },
  log10: x => { if (!(x > 0)) throw "Logarithmus von 0 oder einer negativen Zahl"; return Math.log10(x); },
  exp: Math.exp, abs: Math.abs, sin: Math.sin, cos: Math.cos, tan: Math.tan,
};
FORMULA_FUNCTIONS.wurzel = FORMULA_FUNCTIONS.sqrt;
const FORMULA_CONSTANTS = { pi: Math.PI };
const FORMULA_MAX_LENGTH = 300;
const shortName = n => n.split(" / ")[0].trim();

// Returns {fn, refs} (fn(valuesOfRow) -> number, refs = column indexes it reads) or {error} (German message).
// ponytail: names are looked up among columns 0..upto-1 only.
function parseFormula(text, columns, upto = columns.length) {
  const src = String(text).replace(/[·×]/g, "*").replace(/−/g, "-").replace(/÷/g, "/");
  if (src.trim() === "") return { error: "Bitte eine Formel eingeben, zum Beispiel (D/2)^2." };
  if (src.length > FORMULA_MAX_LENGTH) return { error: `Die Formel ist zu lang (höchstens ${FORMULA_MAX_LENGTH} Zeichen).` };

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
  const show = t => t.t === "end" ? "das Ende der Formel" : `„${t.v}“`;

  const column = name => {
    const j = lookup(name);
    if (j === -1) fail(`Der Spaltenname „${name}“ ist nicht eindeutig. Schreibe den vollen Namen in eckigen Klammern, zum Beispiel [${columns.find(c => shortName(c.name) === name).name}].`);
    if (j === undefined) fail(`Unbekannte Spalte „${name}“ in der Formel.` + (available() ? ` Verfügbar: ${available()}.` : "") + " Die Formel darf nur Spalten links von der neuen Spalte benutzen.");
    refs.add(j);
    return v => v[j];
  };
  function primary() {
    const t = peek();
    if (t.t === "num") { pos++; return () => t.v; }
    if (t.t === "ref") { pos++; return column(t.v); }
    if (t.t === "id") {
      pos++;
      if (isOp("(")) {
        if (!Object.hasOwn(FORMULA_FUNCTIONS, t.v)) fail(`Unbekannte Funktion „${t.v}“. Erlaubt: ${Object.keys(FORMULA_FUNCTIONS).join(", ")}.`);
        pos++; const a = expr(); if (!isOp(")")) fail("Eine Klammer wurde nicht geschlossen."); pos++;
        const f = FORMULA_FUNCTIONS[t.v]; return v => f(a(v));
      }
      if (Object.hasOwn(FORMULA_CONSTANTS, t.v)) return () => FORMULA_CONSTANTS[t.v];
      return column(t.v);
    }
    if (isOp("(")) { pos++; const a = expr(); if (!isOp(")")) fail("Eine Klammer wurde nicht geschlossen."); pos++; return a; }
    return fail(`Unerwartet: ${show(t)}. Hier fehlt eine Zahl, ein Spaltenname oder eine Klammer.`);
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
      a = div ? v => { const d = r(v); if (d === 0) throw "Division durch 0"; return l(v) / d; } : v => l(v) * r(v);
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
    if (peek().t !== "end") fail(`Unerwartet: ${show(peek())}. Fehlt ein Operator (+ − * / ^)?`);
    return { fn, refs: [...refs] };
  } catch (e) {
    if (e && typeof e.parse === "string") return { error: e.parse };
    throw e;
  }
}

// Recomputes every formula column of project p in place (columns left to right).
// Returns a list of German messages for formulas that failed or rows that could not be calculated.
function recalcFormulas(p) {
  const msgs = [], n = p.columns[0].values.length;
  p.columns.forEach((c, j) => {
    if (typeof c.formula !== "string") return;
    const r = parseFormula(c.formula, p.columns, j);
    if (r.error) { c.values = Array(n).fill(null); msgs.push(`Spalte „${c.name}“: ${r.error}`); return; }
    const bad = [];
    c.values = Array.from({ length: n }, (_, i) => {
      const row = p.columns.map(k => k.values[i]);
      if (r.refs.some(k => row[k] === null || row[k] === undefined)) return null;
      try {
        const v = r.fn(row);
        if (!Number.isFinite(v)) throw "Das Ergebnis ist keine endliche Zahl";
        return v;
      } catch (e) {
        if (typeof e !== "string") throw e;
        bad.push([i + 1, e]); return null;
      }
    });
    if (bad.length) msgs.push(`Spalte „${c.name}“, Zeile ${bad[0][0]}: ${bad[0][1]}. Der Wert bleibt leer.` + (bad.length > 1 ? ` Weitere betroffene Zeilen: ${bad.slice(1).map(b => b[0]).join(", ")}.` : ""));
  });
  return msgs;
}

if (typeof module !== "undefined") module.exports = { parseFormula, recalcFormulas };
