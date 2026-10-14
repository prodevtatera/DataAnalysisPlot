// Home page (index.html): the example picture, the DE / EN switch and the hand-over of a file to the workbench (app.html).
// Light on purpose: no Python engine, no Plotly. Needs i18n.js, round.js and drop.js. The links on the page carry the start (?start=example | blank | p1 ... p9);
// a file travels in this tab's session storage ("plotlab-handoff") and app.html reads it from there (?start=file).

// ---- the example (invented data): extension s in cm, force F in N, u(F) = 0,3 N; weighted straight line y = b + m*x with weights 1/u^2 (fit() is checked in tests/phase4-step5-home.mjs)
const D = [[1, 2.4], [2, 4.5], [3, 7.1], [4, 9.2], [5, 11.8], [6, 13.9], [7, 16.6], [8, 18.3]], U = 0.3;
function fit() {
  const w = 1 / (U * U); let S = 0, Sx = 0, Sy = 0, Sxx = 0, Sxy = 0;
  for (const [x, y] of D) { S += w; Sx += w * x; Sy += w * y; Sxx += w * x * x; Sxy += w * x * y; }
  const d = S * Sxx - Sx * Sx, m = (S * Sxy - Sx * Sy) / d, b = (Sxx * Sy - Sx * Sxy) / d;
  let chi2 = 0; for (const [x, y] of D) chi2 += w * (y - b - m * x) ** 2;
  const dof = D.length - 2;
  return { m, b, um: Math.sqrt(S / d), ub: Math.sqrt(Sxx / d), chi2, dof, f: Math.sqrt(chi2 / dof) };
}
// ---- end of the part the test loads

if (typeof document !== "undefined") {
  const $ = id => document.getElementById(id);
  let method = "scaled";
  const f1 = nf({ minimumFractionDigits: 1, maximumFractionDigits: 1 }), f2 = nf({ minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const sep = n => String(n).replace(".", decSep());
  function renderExample() {
    const F = fit(), k = method === "scaled" ? F.f : 1;
    const [mv, mu] = huRound(F.m, F.um * k), [bv, bu] = huRound(F.b, F.ub * k);
    $("res").textContent = `D = (${mv} ± ${mu}) N/cm`;
    $("kv").innerHTML = `<div><span>${t("home_icpt")}</span><span>(${bv} ± ${bu}) N</span></div><div><span>${t("home_chi")}</span><span>${f2.format(F.chi2 / F.dof)}</span></div>` +
      `<div><span>${t("home_method")}</span><span>${method === "scaled" ? "√(χ²/DoF)" : "u(F)"}</span></div>`;
    $("tbl").innerHTML = "<tr><th>s / cm</th><th>F / N</th><th>u(F) / N</th></tr>" + D.map(([x, y]) => `<tr><td>${f1.format(x)}</td><td>${f1.format(y)}</td><td>${f1.format(U)}</td></tr>`).join("");
    const W = 560, H = 400, L = 62, R = 16, Tp = 16, B = 64, X1 = 9, Y1 = 21;
    const px = x => L + x / X1 * (W - L - R), py = y => H - B - y / Y1 * (H - B - Tp);
    let s = `<rect width="${W}" height="${H}" fill="#fff"/>`;
    for (let x = 0; x <= 9; x++) s += `<line x1="${px(x)}" x2="${px(x)}" y1="${Tp}" y2="${H - B}" stroke="#e6e6de"/><text x="${px(x)}" y="${H - B + 20}" text-anchor="middle" font-size="14">${x}</text>`;
    for (let y = 0; y <= 20; y += 5) s += `<line y1="${py(y)}" y2="${py(y)}" x1="${L}" x2="${W - R}" stroke="#e6e6de"/><text x="${L - 8}" y="${py(y) + 5}" text-anchor="end" font-size="14">${y}</text>`;
    s += `<rect x="${L}" y="${Tp}" width="${W - L - R}" height="${H - B - Tp}" fill="none" stroke="#000"/>`;
    s += `<line x1="${px(0)}" y1="${py(F.b)}" x2="${px(9)}" y2="${py(F.b + F.m * 9)}" stroke="#4F46E5" stroke-width="2.5"/>`;
    for (const [x, y] of D) s += `<line x1="${px(x)}" x2="${px(x)}" y1="${py(y - U)}" y2="${py(y + U)}" stroke="#000" stroke-width="1.5"/><line x1="${px(x) - 4}" x2="${px(x) + 4}" y1="${py(y - U)}" y2="${py(y - U)}" stroke="#000"/><line x1="${px(x) - 4}" x2="${px(x) + 4}" y1="${py(y + U)}" y2="${py(y + U)}" stroke="#000"/><circle cx="${px(x)}" cy="${py(y)}" r="4" fill="#000"/>`;
    s += `<text x="${(L + W - R) / 2}" y="${H - 22}" text-anchor="middle" font-size="16">${t("home_ax_x")}</text>`;
    s += `<text transform="translate(16 ${(Tp + H - B) / 2}) rotate(-90)" text-anchor="middle" font-size="16">${t("home_ax_y")}</text>`;
    s += `<g font-size="14"><circle cx="${L + 16}" cy="${Tp + 18}" r="4"/><text x="${L + 28}" y="${Tp + 23}">${t("home_pts")}</text><line x1="${L + 10}" x2="${L + 22}" y1="${Tp + 40}" y2="${Tp + 40}" stroke="#4F46E5" stroke-width="2.5"/><text x="${L + 28}" y="${Tp + 45}">${t("home_fit")}</text></g>`;
    $("plot").innerHTML = s;
  }
  document.querySelectorAll("input[name=m]").forEach(r => r.onchange = () => { method = r.value; renderExample(); });
  for (const b of document.querySelectorAll("[data-lang]")) b.onclick = () => { setLang(b.dataset.lang); renderExample(); $("homemsg").hidden = true; };

  // ---- a file for the workbench: checked here with the workbench's own rules (classifyDrop), so a picture or an Excel file is refused here and nothing changes
  const msg = text => { $("homemsg").textContent = text; $("homemsg").hidden = false; };
  function give(name, type, size, text) {
    if (size > 5e6) return msg(t("too_big", { name }));
    const d = classifyDrop(name, type, text);
    if (d.error) return msg(d.error);
    try { sessionStorage.setItem("plotlab-handoff", JSON.stringify({ name, type, text })); } catch { return msg(t("too_big", { name })); }
    location.href = "app.html?start=file";
  }
  const dragFiles = e => e.dataTransfer?.types?.includes("Files");
  addEventListener("dragover", e => { if (dragFiles(e)) { e.preventDefault(); $("drop").classList.add("over"); } });
  addEventListener("dragleave", e => { if (!e.relatedTarget) $("drop").classList.remove("over"); });
  addEventListener("drop", async e => {
    if (!dragFiles(e)) return;
    e.preventDefault(); $("drop").classList.remove("over");
    const f = e.dataTransfer.files[0];
    if (f) give(f.name, f.type, f.size, f.size > 5e6 ? "" : await f.text());
  });
  $("pick").onclick = () => $("picker").click();
  $("picker").onchange = async e => {
    const f = e.target.files[0]; e.target.value = "";
    if (f) give(f.name, f.type, f.size, f.size > 5e6 ? "" : await f.text());
  };
  // Cells copied from Excel and pasted anywhere on the page.
  addEventListener("paste", e => {
    const text = e.clipboardData?.getData("text") || "";
    if (text.trim()) { e.preventDefault(); give(t("home_pasted"), "text/plain", text.length, text); }
  });
  // A saved project in this browser: offer to go on with it.
  try { $("cont").hidden = localStorage.getItem("plotlab-autosave") === null; } catch {}
  initLang();
  renderExample();
}
