// "Geprüft" page (pruefung.html): the NIST datasets of validation-data.json are recalculated in this browser by the same worker (fit-worker.js) that serves the app,
// and compared with NIST's certified values. Needs i18n.js. The data file is generated from tests/nist/*.dat by scripts/make-validation.mjs; the maths is not copied anywhere.
// Pass rule (same as tests/phase5-step1-nist.mjs): values >= 6 correct digits, errors >= 4, residual >= 6, degrees of freedom equal.

// ---- the part tests/phase6-validation.mjs loads: comparison logic, no page needed
const lre = (got, want) => got === want ? 9 : Math.min(9, -Math.log10(Math.abs(got - want) / Math.abs(want)));
// d: a dataset of validation-data.json, r: the worker's result for it. Returns the digits and the verdict.
function judge(d, r) {
  const idx = d.model === "line" ? [1, 0] : d.model === "poly" ? d.cert.map((_, i) => i) : d.cert.map((_, i) => r.names.indexOf("b" + (i + 1)));
  const pars = d.cert.map(([v, se], i) => {
    const k = idx[i], a = lre(r.p[k], v), b = se === 0 ? 9 : lre(r.err_scaled[k], se);
    return { cert: v, app: r.p[k], certSe: se, appSe: r.err_scaled[k], dv: a, ds: b };
  });
  const dv = Math.min(...pars.map(p => p.dv)), ds = Math.min(...pars.map(p => p.ds));
  let resOk, certRes, appRes, ssrKind = d.kind === "nls";
  if (ssrKind) { certRes = d.ssr; appRes = r.ssr; resOk = lre(r.ssr, d.ssr) >= 6; }
  else { certRes = d.sd; appRes = Math.sqrt(r.ssr / r.dof); resOk = d.sd === 0 ? appRes < 1e-6 : lre(appRes, d.sd) >= 6; }
  return { pars, dv, ds, certRes, appRes, ssrKind, ok: dv >= 6 && ds >= 4 && resOk && r.dof === d.dof };
}
// The job the worker gets for a dataset (nonlinear sets start from NIST's start 2).
function job(d) {
  if (d.model === "line") return { x: d.x, y: d.y, sy: null, model: "line" };
  if (d.model === "poly") return { task: "curve", model: "poly", degree: d.degree, x: d.x, y: d.y, sy: null };
  return { task: "curve", model: "free", expr: d.expr, p0: Object.fromEntries(d.start2.map((v, i) => ["b" + (i + 1), v])), x: d.x, y: d.y, sy: null };
}
// ---- end of the part the test loads

if (typeof document !== "undefined") {
  const $ = id => document.getElementById(id);
  const fmt = nf({ maximumSignificantDigits: 12 }), fdig = nf({ minimumFractionDigits: 1, maximumFractionDigits: 1 });
  let data = [], out = [], state = "idle", running = "", worker = null;   // out[i]: undefined (waiting) | {judge} | {error}

  function what(d) {
    if (d.model === "line") return t("val_what_line");
    if (d.model === "poly") return t("val_what_poly", { d: d.degree });
    return t("val_what_free", { expr: d.expr.replace(/,/g, decSep()) });
  }
  function detail(d, o) {
    if (!o || o.error) return o ? `<div class="inner">${esc(t("val_err_msg", { msg: o.error }))}</div>` : "";
    const j = o.j, f = x => fmt.format(x);
    const rows = j.pars.map((p, i) => `<tr><td>${d.kind === "lls" ? "B" + i : "b" + (i + 1)}</td><td class="n">${f(p.cert)}</td><td class="n">${f(p.app)}</td><td class="n">${fdig.format(p.dv)}</td><td class="n">${f(p.certSe)}</td><td class="n">${f(p.appSe)}</td><td class="n">${fdig.format(p.ds)}</td></tr>`).join("");
    return `<div class="inner"><table><tr><th>${t("val_par")}</th><th class="n">${t("val_cert")}</th><th class="n">${t("val_app")}</th><th class="n">${t("val_dig")}</th><th class="n">${t("val_certse")}</th><th class="n">${t("val_appse")}</th><th class="n">${t("val_dig")}</th></tr>${rows}</table>` +
      `<div class="sub">${esc(t(j.ssrKind ? "val_resid_ssr" : "val_resid", { c: f(j.certRes), a: f(j.appRes), dof: o.dof, cdof: d.dof }))}</div></div>`;
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function render() {
    $("rows").innerHTML = data.map((d, i) => {
      const o = out[i], res = !o ? `<span class="res wait">${t("val_wait")}</span>` : o.error ? `<span class="res bad">${t("val_fail")}</span>` : o.j.ok ? `<span class="res ok">${t("val_pass")}</span>` : `<span class="res bad">${t("val_fail")}</span>`;
      const dv = o && o.j ? fdig.format(o.j.dv) : "–", ds = o && o.j ? fdig.format(o.j.ds) : "–";
      return `<tr><td><strong>${d.name}</strong><div class="sub">${t("val_level_" + d.level)}</div></td><td>${esc(what(d))}<details><summary>${t("val_par")}</summary>${detail(d, o)}</details></td><td class="n">${d.x.length}</td><td class="n">${dv}</td><td class="n">${ds}</td><td>${res}</td></tr>`;
    }).join("");
    const st = $("status"), done = out.filter(Boolean).length, bad = out.filter(o => o && (o.error || !o.j.ok)).length;
    st.className = "status";
    if (state === "loading") st.textContent = t("val_loading");
    else if (state === "running") st.textContent = running;
    else if (state === "loadfail") { st.className = "status bad"; st.textContent = t("val_loadfail"); }
    else if (state === "done") {
      st.className = "status " + (bad ? "bad" : "ok");
      st.innerHTML = bad ? `<strong>${t("val_sum_bad", { n: bad, m: data.length })}</strong>` : `<strong>${t("val_sum_ok", { m: data.length })}</strong>${t("val_sum_ok2")}`;
    } else st.textContent = t("val_idle");
    $("run").textContent = state === "done" ? t("val_again") : t("val_run");
  }
  const ask = j => new Promise((res, rej) => {
    worker.onmessage = e => { if (e.data.result) res({ result: e.data.result }); else if (e.data.error) res({ error: e.data.error }); };
    worker.onerror = () => rej(new Error("worker"));
    worker.postMessage(j);
  });
  async function run() {
    $("run").disabled = true; out = []; state = "loading"; render();
    try {
      if (!worker) {
        worker = new Worker("fit-worker.js", { type: "module" });
        await new Promise((res, rej) => { worker.onmessage = e => e.data.ready ? res() : e.data.loadError && rej(new Error(e.data.loadError)); worker.onerror = () => rej(new Error("worker")); });
      }
      for (let i = 0; i < data.length; i++) {
        state = "running"; running = t("val_running", { n: i + 1, m: data.length, name: data[i].name }); render();
        const a = await ask(job(data[i]));
        out[i] = a.error ? { error: a.error } : { j: judge(data[i], a.result), dof: a.result.dof };
        // BoxBOD-like refusals count as failures here on purpose: start 2 is the easy start, so a refusal would mean something broke.
      }
      state = "done";
    } catch (e) { state = "loadfail"; worker = null; }
    $("run").disabled = false; render();
  }
  async function init() {
    initLang();
    for (const b of document.querySelectorAll("[data-lang]")) b.onclick = () => { setLang(b.dataset.lang); render(); };
    data = await (await fetch("validation-data.json")).json();
    $("run").onclick = run;
    render();
  }
  init();
}
