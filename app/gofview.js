// Page part of the χ² goodness-of-fit (P8): runs the SciPy job, stores the result, draws table and plot.
// Loaded before the main script and uses its globals ($, proj, esc, fmt, change, busy, pending, worker, Plotly ...) only when called.
// Every number goes through a number formatter and every text through esc(), so a hand-edited project file cannot inject markup.
const gofDist = { poisson: "Poisson", gauss: "Gauß" };
const gofNum = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const gofSig = new Intl.NumberFormat("de-DE", { maximumSignificantDigits: 3 });
const gofP = p => p < 0.001 ? "p < 0,001" : "p = " + new Intl.NumberFormat("de-DE", { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(p);
const gofOk = r => Array.isArray(r.counts) && r.counts.length >= 4 && r.counts.length <= 100 && r.counts.every(Number.isFinite) && [r.n, r.mean, r.s, r.start, r.width].every(Number.isFinite) && r.width >= 1 &&
  r.dists && Object.keys(gofDist).every(k => { const d = r.dists[k]; return d && Array.isArray(d.expected) && d.expected.length === r.counts.length && d.expected.every(Number.isFinite) && [d.chi2, d.dof, d.p].every(Number.isFinite); });
const freshGof = () => { const r = proj.results.find(q => q.kind === "gof" && !isStale(proj, q)); return r && gofOk(r) ? r : null; };
// Class label: first class reaches down, last class up (the expected counts use the open ends).
function gofLabel(r, j) {
  const lo = r.start + j * r.width, hi = lo + r.width - 1, k = r.counts.length;
  return j === 0 ? `≤ ${fmt.format(hi)}` : j === k - 1 ? `≥ ${fmt.format(lo)}` : r.width === 1 ? fmt.format(lo) : `${fmt.format(lo)} bis ${fmt.format(hi)}`;
}
function gofDetail(r) {
  if (!gofOk(r)) return '<div class="detail">Dieses Ergebnis ist unvollständig. Bitte neu berechnen.</div>';
  const i = r.inputs || {}, keys = Object.keys(gofDist), low = e => e < GOF_MIN_EXPECTED;
  const rows = r.counts.map((o, j) => `<tr><td>${gofLabel(r, j)}</td><td>${fmt.format(o)}</td>` + keys.map(k => { const e = r.dists[k].expected[j]; return `<td${low(e) ? ' class="low"' : ""}>${gofNum.format(e)}${low(e) ? " *" : ""}</td>`; }).join("") + "</tr>").join("");
  const warn = keys.map(k => ({ k, c: gofLow(r.dists[k].expected) })).filter(q => q.c.length)
    .map(q => `<div class="detail warn" data-warn>Warnung ${gofDist[q.k]}: ${q.c.length === 1 ? "In Klasse" : "In den Klassen"} ${q.c.map(fmt.format).join(", ")} ist die erwartete Anzahl kleiner als ${GOF_MIN_EXPECTED} (mit * markiert). Der χ²-Test ist dann ungenau. Wähle breitere Klassen oder fasse Klassen zusammen.</div>`).join("");
  return `<table data-gof><thead><tr><th>Klasse (Zählwert)</th><th>beobachtet</th>${keys.map(k => `<th>erwartet ${gofDist[k]}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>${warn}` +
    `<div class="detail" data-how>Spalte „${esc(i.col)}“, n = ${fmt.format(r.n)} Intervalle, ${fmt.format(r.counts.length)} Klassen der Breite ${fmt.format(r.width)}${i.width == null ? " (automatisch)" : ""}, Beginn ${fmt.format(r.start)}${i.start == null ? " (automatisch)" : ""}. ` +
    `Erwartet je Klasse = n·(Wahrscheinlichkeit der Klasse); die erste und die letzte Klasse reichen nach außen ins Unendliche, damit die erwarteten Anzahlen zusammen n ergeben. ` +
    `Poisson mit λ = x̄ = ${gofSig.format(r.mean)} (1 geschätzter Parameter: Freiheitsgrade = Klassen − 1 − 1). Gauß mit x̄ und s = ${gofSig.format(r.s)} (Teiler n−1; 2 geschätzte Parameter: Freiheitsgrade = Klassen − 1 − 2), Klassengrenzen mit Stetigkeitskorrektur −0,5. ` +
    `χ² = Σ (beobachtet − erwartet)²/erwartet; p = Wahrscheinlichkeit, bei richtiger Verteilung ein χ² mindestens so groß zu finden (χ²-Verteilung).</div>` +
    keys.map(k => `<div class="detail" data-verdict="${k}">${esc(gofVerdict(gofDist[k], r.dists[k].p))}</div>`).join("");
}
// The plot is drawn from a fresh result only; an out-of-date one is removed like the histogram.
function renderGofPlot() {
  const r = proj.results.find(q => q.kind === "gof"), ok = r && !isStale(proj, r) && gofOk(r);
  if (!ok) {
    Plotly.purge("gofplot");
    $("gofplot").innerHTML = `<div class="empty">${r && isStale(proj, r) ? "Der χ²-Test ist veraltet. Bitte neu berechnen." : "Noch kein χ²-Test. Wähle die Spalte mit den Zählwerten und drücke „Berechnen“."}</div>`; return;
  }
  $("gofplot").querySelector(".empty")?.remove();
  const mid = r.counts.map((_, j) => r.start + j * r.width + (r.width - 1) / 2), ax = t => ({ title: { text: t, standoff: 10 }, showline: true, linecolor: "#000", mirror: true, ticks: "outside", gridcolor: "#e4e4dc", zeroline: false, exponentformat: "none" });
  const bars = { type: "bar", x: mid, y: r.counts, width: r.counts.map(() => r.width), name: "Messwerte (Anzahl der Intervalle)", marker: { color: "#00376C", line: { color: "#fff", width: 1.5 } } };
  const line = (k, color, sym, dash) => ({ type: "scatter", mode: "lines+markers", x: mid, y: r.dists[k].expected, name: "Erwartet " + gofDist[k], line: { color, width: 2.5, dash }, marker: { color, size: 9, symbol: sym } });
  Plotly.react("gofplot", [bars, line("poisson", "#D55E00", "circle", "solid"), line("gauss", "#009E73", "diamond", "dash")], { font: { family: "Arial, Helvetica, sans-serif", size: 16, color: "#000" }, separators: ",.",
    margin: { l: 70, r: 20, t: 20, b: 60 }, xaxis: ax(String((r.inputs || {}).col) + " (Zählwert je Intervall)"), yaxis: ax("Anzahl der Intervalle"), paper_bgcolor: "#fff", plot_bgcolor: "#fff",
    showlegend: true, legend: { x: 0.98, xanchor: "right", y: 0.98, bgcolor: "#fff", bordercolor: "#999", borderwidth: 1 } }, { displaylogo: false, responsive: true });
}
function gofFailed(why) { $("gofmsg").textContent = why; $("gofmsg").hidden = false; }
// Button: check the counts, send the classes to the worker (SciPy), see gofStep for the answer.
function gofRun() {
  if (!proj) return;
  const st = gofSettings(proj), c = proj.columns.find(k => k.name === st.col);
  if ($("g_w").classList.contains("bad")) return gofFailed("Die Klassenbreite muss eine ganze Zahl ab 1 sein (oder leer für automatisch).");
  if ($("g_s").classList.contains("bad")) return gofFailed("Der Beginn der ersten Klasse muss eine ganze Zahl ab 0 sein (oder leer für automatisch).");
  const prep = gofPrepare(c.name, c.values, st);
  if (prep.error) return gofFailed(prep.error);
  $("gofmsg").hidden = true; busy(true);
  pending = { gof: true, fp: gofKey(proj), prep, st, unit: (c.name.split("/")[1] || "").trim() };
  worker.postMessage({ task: "gof", edges: prep.edges, counts: prep.counts, mean: prep.mean, s: prep.s });
}
function gofStep(job, m) {
  pending = null; busy(false);
  if (m.error) return gofFailed("Der χ²-Test ist fehlgeschlagen. " + m.error);
  if (gofKey(proj) !== job.fp) return gofFailed("Die Daten wurden während der Berechnung geändert. Bitte erneut berechnen.");
  const p = job.prep, d = m.result, line = k => ({ name: gofDist[k] + ": χ²", unit: "", value: d[k].chi2, text: `${gofSig.format(d[k].chi2)} bei ${fmt.format(d[k].dof)} Freiheitsgraden, ${gofP(d[k].p)}` });
  change(() => addResult(proj, {
    kind: "gof", inputs: job.st, n: p.n, mean: p.mean, s: p.s, start: p.start, width: p.width, counts: p.counts, dists: d,
    params: [{ name: "Mittelwert x̄ (= λ der Poisson-Verteilung)", unit: job.unit, value: p.mean, u: p.sem }, line("poisson"), line("gauss")],
  }));
}
