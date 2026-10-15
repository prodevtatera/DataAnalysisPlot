// Cookie strip, copied from islescout.com: one line at the foot of the window until it is answered, then gone for good.
// The answer is kept under "plotlab-consent" ("1" allow, "0" no); "0" makes storageOK() (i18n.js) stop the autosave and the language memory.
(() => {
  const KEY = "plotlab-consent";
  let answered = false;
  try { answered = localStorage.getItem(KEY) !== null; } catch {}
  if (answered) return;
  const css = document.createElement("style");
  css.textContent = `.consent{position:sticky;bottom:0;z-index:40;display:flex;flex-wrap:wrap;align-items:center;gap:8px 16px;padding:10px 24px;background:#fff;border-top:1px solid var(--line,#E2E5F3);box-shadow:0 -2px 12px rgba(30,33,64,.08)}
.consent p{flex:1 1 320px;margin:0;font-size:14px;line-height:21px;color:var(--muted,#565B7A)}
.consent .btn{padding:6px 16px;font-size:15px;line-height:22px}
@media print{.consent{display:none}}`;
  const bar = document.createElement("div");
  bar.className = "consent"; bar.setAttribute("role", "region"); bar.setAttribute("aria-label", "Cookies");
  bar.innerHTML = `<p data-i18n="consent_q"></p><button class="btn small" data-v="1" data-i18n="consent_yes"></button><button class="btn alt small" data-v="0" data-i18n="consent_no"></button>`;
  bar.onclick = e => {
    const v = e.target.dataset && e.target.dataset.v;
    if (v === undefined) return;
    try {
      localStorage.setItem(KEY, v);
      if (v === "0") { localStorage.removeItem("plotlab-autosave"); localStorage.removeItem("plotlab-lang"); }
    } catch {}
    bar.remove();
  };
  document.head.append(css); document.body.append(bar);
  applyStatic();
})();
