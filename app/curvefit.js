if (typeof module !== "undefined") require("./i18n.js"); // t() and nf() are globals on the page; in Node this makes them globals
// Curve fit tool (exponential, polynomial, sine, Gauss, free formula): the page part. The numbers come from the worker (task "curve" in fit-worker.js, SciPy).
// Loaded before the main script; the functions at the bottom use its globals ($, proj, col, esc, change, busy, pending, worker, fmt ...) only when called.
const CF_NUM = /^[+-]?(\d+[.,]?\d*|[.,]\d+)([eE][+-]?\d+)?$/;
const CF_SUB = "₀₁₂₃₄₅₆₇₈₉", CF_SUP = ["", "", "²", "³", "⁴", "⁵", "⁶"];
const cfSub = n => String(n).replace(/\d/g, d => CF_SUB[d]);
// The worker names the parameters in plain letters; the page shows the usual symbols.
const CF_SYMBOL = { tau: "τ", mu: "μ", sigma: "σ", phi: "φ" };
const cfShow = (model, n) => model === "poly" ? "a" + cfSub(n.slice(1)) : model === "free" ? n : CF_SYMBOL[n] || n;

// "a = 1; tau = 0,5" -> {p0: {a: 1, tau: 0.5}} or {error} (message in the chosen language). Empty text is fine: every parameter then starts at 1.
function parseStarts(text) {
  const p0 = {};
  for (const e of String(text).split(";").map(s => s.trim()).filter(Boolean)) {
    const k = e.indexOf("="), name = k < 0 ? "" : e.slice(0, k).trim(), v = k < 0 ? "" : e.slice(k + 1).trim();
    if (!/^[\p{L}_][\p{L}\p{Nd}_]*$/u.test(name) || !CF_NUM.test(v)) return { error: t("cf_p0bad", { e }) };
    p0[name] = Number(v.replace(",", "."));
  }
  return { p0 };
}
// Unit of each parameter from the units of the x and y columns (poly: a_k has y/x^k; the phase is in rad; a free formula has no known units).
function cfUnits(model, names, ux, uy) {
  const per = k => !k ? uy : (ux ? (uy || "1") + "/" + ux + CF_SUP[k] : uy);
  return names.map((n, i) => model === "poly" ? per(i) : model === "free" ? "" : n === "tau" || n === "mu" || n === "sigma" || n === "T" ? ux : n === "phi" ? "rad" : uy);
}
// The model as a formula, for the result and the plot legend.
function cfEquation(model, st) {
  const c = CF_OFFSET.includes(model) && st.offset ? " + c" : "";
  return "y = " + ({ exp: "a·exp(−x/τ)", gauss: "A·exp(−(x−μ)²/(2σ²))", sine: "A·sin(2π·x/T + φ)",
    poly: Array.from({ length: st.degree + 1 }, (_, k) => k === 0 ? "a₀" : "a" + cfSub(k) + "·x" + CF_SUP[k]).join(" + "), free: st.expr.trim() }[model] || "") + c;
}
// A worker error "cf_dof:7:6" is a key of TEXTS with up to two values; anything else (SciPy's own text) is shown as it is.
function cfMessage(err) {
  const m = /^(cf_[a-z0-9]+)(?::(.*))?$/.exec(String(err));
  if (!m || !Object.hasOwn(TEXTS, m[1])) return String(err);
  const [a, b] = (m[2] || "").split(":");
  return t(m[1], { a, b });
}
if (typeof module !== "undefined") module.exports = { parseStarts, cfUnits, cfEquation, cfShow, cfMessage };

// ---- page part
const cfOk = r => Array.isArray(r.params) && r.params.length > 0 && r.params.every(q => q && [q.value, q.uScaled].every(Number.isFinite)) && r.curve && Array.isArray(r.curve.x) &&
  Array.isArray(r.curve.y) && r.curve.x.length === r.curve.y.length && r.curve.x.every(Number.isFinite) && r.curve.y.every(v => v === null || Number.isFinite(v));
const freshCf = () => { const r = proj.results.find(q => q.kind === "curvefit" && !isStale(proj, q)); return r && cfOk(r) ? r : null; };
const cfLabel = (model, lang) => t("cf_m_" + model, undefined, lang);
function cfFailed(why) { $("cfmsg").textContent = why; $("cfmsg").hidden = false; }
// Button: check the table, send the points and the chosen model to the worker, see cfStep for the answer.
function cfRun() {
  if (!proj) return;
  const st = curvefitSettings(proj), x = col("x"), y = col("y"), e = col("yerr");
  if (!x || !y) return cfFailed(t("fit_needxy"));
  const weighted = proj.settings.weighted && !!e;
  const idx = x.values.map((_, i) => i).filter(i => x.values[i] !== null && y.values[i] !== null);
  if (idx.length < 3) return cfFailed(t("fit_min3"));
  const badRow = weighted ? idx.find(i => !(e.values[i] > 0)) : undefined;
  if (badRow !== undefined) return cfFailed(t("fit_err0", { row: badRow + 1 }));
  let p0 = {};
  if (st.model === "free") {
    if (!st.expr.trim()) return cfFailed(t("cf_needexpr"));
    const s = parseStarts(st.p0);
    if (s.error) return cfFailed(s.error);
    p0 = s.p0;
  }
  $("cfmsg").hidden = true; busy(true);
  pending = { curvefit: true, fp: curvefitKey(proj), weighted, st, n: idx.length, ux: colUnit(x.name), uy: colUnit(y.name) };
  worker.postMessage({ task: "curve", model: st.model, degree: st.degree, offset: st.offset, expr: st.expr, p0, x: idx.map(i => x.values[i]), y: idx.map(i => y.values[i]), sy: weighted ? idx.map(i => e.values[i]) : null });
}
function cfStep(job, m) {
  pending = null; busy(false);
  if (m.error) return cfFailed(t("cf_failed", { why: cfMessage(m.error) }));
  if (curvefitKey(proj) !== job.fp) return cfFailed(t("fit_changed"));
  const out = m.result, st = job.st, units = cfUnits(st.model, out.names, job.ux, job.uy);
  change(() => addResult(proj, {
    kind: "curvefit", model: st.model, label: cfLabel(st.model, "de"), equation: cfEquation(st.model, st), nonlinear: st.model !== "poly", weighted: job.weighted, dof: out.dof, n: job.n,
    ...(job.weighted ? { chi2: out.chi2 } : { ssr: out.ssr }), curve: out.curve,
    params: out.names.map((n, i) => ({ name: cfShow(st.model, n), unit: units[i], value: out.p[i], uScaled: out.err_scaled[i], ...(job.weighted ? { uUnscaled: out.err_unscaled[i] } : {}) })),
  }));
}
// The result under the result lines: the model, the table of parameters with both errors, the method.
function cfDetail(r) {
  if (!cfOk(r)) return `<div class="detail">${t("cf_incomplete")}</div>`;
  const un = proj.settings.errMethod === "unscaled" && r.weighted;
  const how = t(r.nonlinear ? "cf_how_nl" : "cf_how_lin") + "; " + t(!r.weighted ? "cf_how_u" : un ? "cf_how_wun" : "cf_how_wsc");
  return `<div class="detail" data-cfmodel>${t("cf_model_is", { label: esc(cfLabel(r.model)), eq: esc(r.equation) })}</div>` + fitDetail(r, how) +
    (r.nonlinear ? `<div class="detail" data-cfnote>${t("cf_note_nl")}</div>` : "");
}
// Settings of the panel shown in the controls (called from syncControls).
function cfSync() {
  const st = curvefitSettings(proj);
  $("cf_model").value = st.model; $("cf_deg").value = String(st.degree); $("cf_off").checked = st.offset;
  if (document.activeElement !== $("cf_expr")) $("cf_expr").value = st.expr;
  if (document.activeElement !== $("cf_p0")) $("cf_p0").value = st.p0;
  $("cf_degl").hidden = st.model !== "poly"; $("cf_offl").hidden = !CF_OFFSET.includes(st.model);
  $("cf_exprl").hidden = $("cf_p0l").hidden = st.model !== "free";
  $("cf_eq").textContent = st.model === "free" && !st.expr.trim() ? t("cf_free_hint") : cfEquation(st.model, st);
}
