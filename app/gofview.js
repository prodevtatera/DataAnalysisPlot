// Page part of the χ² goodness-of-fit (P8): runs the SciPy job, stores the result, draws table and plot.
// Loaded before the main script and uses its globals ($, proj, esc, fmt, change, busy, pending, worker, Plotly ...) only when called.
// Every number goes through a number formatter and every text through esc(), so a hand-edited project file cannot inject markup.
const gofDist = { poisson: "Poisson", gauss: "Gauß" };
const gofNum = nf({ minimumFractionDigits: 2, maximumFractionDigits: 2 });
const gofSig = nf({ maximumSignificantDigits: 3 });
const gofName = k => t("dist_" + k);
// "3,05 bei 3 Freiheitsgraden, p = 0,384": the result line of one distribution, in the language asked for (the stored text is German, the raw numbers are kept as tv).
const gofP = (p, lang = LANG) => p < 0.001 ? "p < 0" + (lang === "en" ? "." : ",") + "001" : "p = " + numFmt(lang, { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(p);
const gofLineText = (v, lang = LANG) => t("gof_line", { chi2: numFmt(lang, { maximumSignificantDigits: 3 }).format(Number(v.chi2)), dof: numFmt(lang, { maximumFractionDigits: 10 }).format(Number(v.dof)), p: gofP(Number(v.p), lang) }, lang);
const gofOk = r => Array.isArray(r.counts) && r.counts.length >= 4 && r.counts.length <= 100 && r.counts.every(Number.isFinite) && [r.n, r.mean, r.s, r.start, r.width].every(Number.isFinite) && r.width >= 1 &&
  r.dists && Object.keys(gofDist).every(k => { const d = r.dists[k]; return d && Array.isArray(d.expected) && d.expected.length === r.counts.length && d.expected.every(Number.isFinite) && [d.chi2, d.dof, d.p].every(Number.isFinite); });
const freshGof = () => { const r = proj.results.find(q => q.kind === "gof" && !isStale(proj, q)); return r && gofOk(r) ? r : null; };
// Class label: first class reaches down, last class up (the expected counts use the open ends).
function gofLabel(r, j) {
  const lo = r.start + j * r.width, hi = lo + r.width - 1, k = r.counts.length;
  return j === 0 ? `≤ ${fmt.format(hi)}` : j === k - 1 ? `≥ ${fmt.format(lo)}` : r.width === 1 ? fmt.format(lo) : t("gof_to", { lo: fmt.format(lo), hi: fmt.format(hi) });
}
function gofDetail(r) {
  if (!gofOk(r)) return `<div class="detail">${t("gof_incomplete")}</div>`;
  const i = r.inputs || {}, keys = Object.keys(gofDist), low = e => e < GOF_MIN_EXPECTED;
  const rows = r.counts.map((o, j) => `<tr><td>${gofLabel(r, j)}</td><td>${fmt.format(o)}</td>` + keys.map(k => { const e = r.dists[k].expected[j]; return `<td${low(e) ? ' class="low"' : ""}>${gofNum.format(e)}${low(e) ? " *" : ""}</td>`; }).join("") + "</tr>").join("");
  const warn = keys.map(k => ({ k, c: gofLow(r.dists[k].expected) })).filter(q => q.c.length)
    .map(q => `<div class="detail warn" data-warn>${t(q.c.length === 1 ? "gof_warn1" : "gof_warnn", { dist: gofName(q.k), list: q.c.map(fmt.format).join(", "), min: GOF_MIN_EXPECTED })}</div>`).join("");
  return `<table data-gof><thead><tr><th>${t("th_gclass")}</th><th>${t("th_gobs")}</th>${keys.map(k => `<th>${t("th_gexp", { dist: gofName(k) })}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>${warn}` +
    `<div class="detail" data-how>${t("gof_how", { col: esc(i.col), n: fmt.format(r.n), k: fmt.format(r.counts.length), w: fmt.format(r.width), wa: i.width == null ? t("auto_par") : "", s0: fmt.format(r.start), sa: i.start == null ? t("auto_par") : "", mean: gofSig.format(r.mean), s: gofSig.format(r.s) })}</div>` +
    keys.map(k => `<div class="detail" data-verdict="${k}">${esc(gofVerdict(gofDist[k], r.dists[k].p))}</div>`).join("");
}
// The plot is drawn from a fresh result only; an out-of-date one is removed like the histogram.
function renderGofPlot() {
  const r = proj.results.find(q => q.kind === "gof"), ok = r && !isStale(proj, r) && gofOk(r);
  if (!ok) {
    Plotly.purge("gofplot");
    $("gofplot").innerHTML = `<div class="empty">${t(r && isStale(proj, r) ? "gof_stale" : "gof_none")}</div>`; return;
  }
  $("gofplot").querySelector(".empty")?.remove();
  const mid = r.counts.map((_, j) => r.start + j * r.width + (r.width - 1) / 2), ax = t => ({ title: { text: t, standoff: 10 }, showline: true, linecolor: "#000", mirror: true, ticks: "outside", gridcolor: "#e4e4dc", zeroline: false, exponentformat: "none" });
  const bars = { type: "bar", x: mid, y: r.counts, width: r.counts.map(() => r.width), name: t("tr_gbars"), marker: { color: "#00376C", line: { color: "#fff", width: 1.5 } } };
  const line = (k, color, sym, dash) => ({ type: "scatter", mode: "lines+markers", x: mid, y: r.dists[k].expected, name: t("tr_gexp", { dist: gofName(k) }), line: { color, width: 2.5, dash }, marker: { color, size: 9, symbol: sym } });
  Plotly.react("gofplot", [bars, line("poisson", "#D55E00", "circle", "solid"), line("gauss", "#009E73", "diamond", "dash")], { font: { family: "Arial, Helvetica, sans-serif", size: 16, color: "#000" }, separators: plotSeparators(),
    margin: { l: 70, r: 20, t: 20, b: 60 }, xaxis: ax(t("ax_gx", { col: String((r.inputs || {}).col) })), yaxis: ax(t("ax_gy")), paper_bgcolor: "#fff", plot_bgcolor: "#fff",
    showlegend: true, legend: { x: 0.98, xanchor: "right", y: 0.98, bgcolor: "#fff", bordercolor: "#999", borderwidth: 1 } }, { displaylogo: false, responsive: true });
}
function gofFailed(why) { $("gofmsg").textContent = why; $("gofmsg").hidden = false; }
// Button: check the counts, send the classes to the worker (SciPy), see gofStep for the answer.
function gofRun() {
  if (!proj) return;
  const st = gofSettings(proj), c = proj.columns.find(k => k.name === st.col);
  if ($("g_w").classList.contains("bad")) return gofFailed(t("gof_wbad"));
  if ($("g_s").classList.contains("bad")) return gofFailed(t("gof_sbad"));
  const prep = gofPrepare(c.name, c.values, st);
  if (prep.error) return gofFailed(prep.error);
  $("gofmsg").hidden = true; busy(true);
  pending = { gof: true, fp: gofKey(proj), prep, st, unit: colUnit(c.name) };
  worker.postMessage({ task: "gof", edges: prep.edges, counts: prep.counts, mean: prep.mean, s: prep.s });
}
function gofStep(job, m) {
  pending = null; busy(false);
  if (m.error) return gofFailed(t("gof_failed", { why: m.error }));
  if (gofKey(proj) !== job.fp) return gofFailed(t("gof_changed"));
  const p = job.prep, d = m.result, line = k => ({ ...stored("n_gchi_" + k), unit: "", value: d[k].chi2, text: gofLineText(d[k], "de"), tk: "gof_line", tv: { chi2: d[k].chi2, dof: d[k].dof, p: d[k].p } });
  change(() => addResult(proj, {
    kind: "gof", inputs: job.st, n: p.n, mean: p.mean, s: p.s, start: p.start, width: p.width, counts: p.counts, dists: d,
    params: [{ ...stored("n_gmean"), unit: job.unit, value: p.mean, u: p.sem }, line("poisson"), line("gauss")],
  }));
}
