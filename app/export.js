// Figure export for every plot of the page: PNG 2400 x 1400 px (sharp in a report) and SVG (vector, text stays text).
// Each plot div gets two buttons below it; they are on only while the div holds a drawn plot.
(function () {
  const PLOTS = [["plot", "diagramm"], ["histplot", "histogramm"], ["cumplot", "summenhaeufigkeit"], ["gofplot", "chi2-test"]];
  async function exportPlot(id, name, fmt, note) {
    try {
      const url = await Plotly.toImage(document.getElementById(id), { format: fmt, width: 1200, height: 700, scale: fmt === "png" ? 2 : 1 });
      const a = document.createElement("a"); a.href = url; a.download = name + "." + fmt; a.click();
      note.hidden = true;
    } catch (e) { note.textContent = "Das Diagramm konnte nicht gespeichert werden."; note.hidden = false; }
  }
  for (const [id, name] of PLOTS) {
    const box = document.getElementById(id);
    const bar = document.createElement("div"); bar.className = "btns";
    const note = document.createElement("div"); note.className = "msg"; note.setAttribute("role", "alert"); note.hidden = true;
    const btns = [["png", "Diagramm als PNG speichern"], ["svg", "Diagramm als SVG speichern"]].map(([fmt, label]) => {
      const b = document.createElement("button"); b.className = "btn alt"; b.textContent = label; b.id = id + "_" + fmt; b.disabled = true;
      b.onclick = () => exportPlot(id, name, fmt, note); return b;
    });
    bar.append(...btns); box.after(bar, note);
    const sync = () => btns.forEach(b => { b.disabled = !box.querySelector(".main-svg"); });
    new MutationObserver(sync).observe(box, { childList: true }); sync();
  }
})();
