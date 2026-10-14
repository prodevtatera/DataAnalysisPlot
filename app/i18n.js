// Two languages, German first. Every fixed text of a translated page section is one entry here: { de, en }.
// {name} marks a value that the caller fills in. A text that is not in this table is still German in the page (see "Noch nicht übersetzt" in docs/progress.md).
const TEXTS = {
  // header, note
  lang_note: { de: "Die deutsche Fassung ist vollständig.", en: "The English version is built section by section. Not translated yet: the sections from “Formelspalte” on (formulas, statistics, histogram, chi-square, weighted mean, series, derived quantity, calibration, comparison), the texts of the templates and some messages. Numbers already follow the English format (decimal point); the result format (value ± u) unit is the same." },
  // data section
  h_data: { de: "Messdaten", en: "Measurement data" },
  hint_data: { de: "Klicke in eine Zelle und tippe. Dezimalkomma ist in Ordnung. Das Diagramm folgt sofort.", en: "Click into a cell and type. A decimal comma or point both work. The plot follows at once." },
  b_blank: { de: "Leere Tabelle", en: "Empty table" },
  b_example: { de: "Beispiel laden", en: "Load example" },
  b_example2: { de: "Beispiel Elastizität laden", en: "Load elasticity example" },
  b_example3: { de: "Beispiel Belastung und Entlastung laden", en: "Load loading and unloading example" },
  b_example4: { de: "Beispiel Kalibriergerade laden", en: "Load calibration line example" },
  b_open: { de: "Projekt öffnen", en: "Open project" },
  b_save: { de: "Projekt speichern", en: "Save project" },
  b_undo: { de: "Rückgängig", en: "Undo" },
  b_redo: { de: "Wiederholen", en: "Redo" },
  k_undo: { de: "Strg/Cmd+Z", en: "Ctrl/Cmd+Z" },
  k_redo: { de: "Umschalt+Strg/Cmd+Z", en: "Shift+Ctrl/Cmd+Z" },
  intro: { de: "Das ist ein fertiges Beispiel (P3 Elastizität, erfundene Daten), schon angepasst und ausgewertet. Ziehe deine eigene Datei auf diese Seite (CSV mit Semikolon oder Tab, Dezimalkomma ist in Ordnung, oder ein .plotlab-Projekt) oder beginne mit „Leere Tabelle“.",
           en: "This is a finished example (P3 elasticity, invented data), already fitted and evaluated. Drag your own file onto this page (CSV with semicolon or tab, a decimal comma is fine, or a .plotlab project) or start with “Empty table”." },
  // plot
  h_plot: { de: "Diagramm", en: "Plot" },
  logy: { de: "Logarithmische y-Achse (halblogarithmisch)", en: "Logarithmic y axis (semi-log)" },
  logy_hint: { de: "Es sind nur y-Werte größer als 0 möglich. Eine Anpassung y = a·x + b erscheint auf dieser Achse gekrümmt.", en: "Only y values above 0 are possible. A fit y = a·x + b looks curved on this axis." },
  plot_none: { de: "Noch keine Daten.", en: "No data yet." },
  plot_need: { de: "Für ein Diagramm braucht es eine x- und eine y-Spalte.", en: "A plot needs an x column and a y column." },
  plot_cut1: { de: "Bei 1 Messpunkt reicht der Fehlerbalken nach unten bis 0 oder darunter. Auf der logarithmischen Achse ist nur der obere Teil sichtbar.", en: "For 1 data point the error bar reaches down to 0 or below. Only the upper part is visible on the logarithmic axis." },
  plot_cutn: { de: "Bei {n} Messpunkten reichen der Fehlerbalken nach unten bis 0 oder darunter. Auf der logarithmischen Achse ist nur der obere Teil sichtbar.", en: "For {n} data points the error bars reach down to 0 or below. Only the upper part is visible on the logarithmic axis." },
  tr_data: { de: "Messwerte", en: "Data" },
  tr_fit: { de: "Anpassung", en: "Fit" },
  tr_read: { de: "Ablesung x₀ (± u)", en: "Read-off x₀ (± u)" },
  // results
  h_results: { de: "Ergebnisse", en: "Results" },
  res_none: { de: "Noch keine Ergebnisse.", en: "No results yet." },
  stale: { de: "Die Daten wurden geändert. Dieses Ergebnis ist veraltet. Bitte neu {verb}.", en: "The data have changed. This result is out of date. Please {verb}." },
  verb_calc: { de: "berechnen", en: "recalculate" },
  verb_fit: { de: "anpassen", en: "fit again" },
  th_param: { de: "Parameter", en: "Parameter" },
  th_value: { de: "Wert", en: "Value" },
  th_uscaled: { de: "Fehler skaliert", en: "Error scaled" },
  th_uunscaled: { de: "Fehler unskaliert", en: "Error unscaled" },
  how_ols: { de: "Methode der kleinsten Quadrate, ungewichtet; Fehler aus der Streuung der Messpunkte um die Gerade", en: "least squares, unweighted; errors from the scatter of the points around the line" },
  how_wun: { de: "gewichtete Methode der kleinsten Quadrate (Gewichte 1/s²); Fehler unskaliert, direkt aus den Fehlerwerten", en: "weighted least squares (weights 1/s²); errors unscaled, taken directly from the error values" },
  how_wsc: { de: "gewichtete Methode der kleinsten Quadrate (Gewichte 1/s²); Fehler mit √(χ²/DoF) skaliert", en: "weighted least squares (weights 1/s²); errors scaled with √(χ²/DoF)" },
  fit_method: { de: "Methode: {how}. Freiheitsgrade: {dof}. ", en: "Method: {how}. Degrees of freedom: {dof}. " },
  fit_chi2: { de: "χ² = {chi2}, χ²/DoF = {red}.", en: "χ² = {chi2}, χ²/DoF = {red}." },
  fit_ssr: { de: "Summe der Abweichungsquadrate = {ssr}.", en: "Sum of squared residuals = {ssr}." },
  // fit section
  h_fit: { de: "Anpassung (Gerade y = a·x + b)", en: "Fit (straight line y = a·x + b)" },
  weighted: { de: "Mit den Fehlerwerten gewichten", en: "Weight with the error values" },
  weighted_need: { de: "Dafür braucht es eine Spalte mit der Rolle „Fehler von y“.", en: "This needs a column with the role “Error of y”." },
  errm_scaled: { de: "Fehler skaliert mit √(χ²/DoF)", en: "Errors scaled with √(χ²/DoF)" },
  errm_unscaled: { de: "Fehler unskaliert (aus den Fehlerwerten)", en: "Errors unscaled (from the error values)" },
  b_fit: { de: "Anpassen", en: "Fit" },
  fs_loading: { de: "Rechenmodul (SciPy) wird geladen …", en: "Loading the calculation module (SciPy) …" },
  fs_ready: { de: "Bereit.", en: "Ready." },
  fs_nofile: { de: "Die Anpassung braucht die Seite von einem Webserver (nicht als Datei geöffnet).", en: "The fit needs the page from a web server (not opened as a file)." },
  fs_err: { de: "Das Rechenmodul konnte nicht geladen werden. Bitte die Seite neu laden.", en: "The calculation module could not be loaded. Please reload the page." },
  fit_failed: { de: "Die Anpassung ist fehlgeschlagen. {why}", en: "The fit failed. {why}" },
  fit_needxy: { de: "Für die Anpassung braucht es eine x- und eine y-Spalte. Wähle die Rollen in der Tabelle.", en: "The fit needs an x column and a y column. Choose the roles in the table." },
  fit_min3: { de: "Es braucht mindestens drei Messpunkte mit x und y.", en: "At least three data points with x and y are needed." },
  fit_err0: { de: "Alle Fehlerwerte müssen größer als 0 sein (Zeile {row}).", en: "All error values must be above 0 (row {row})." },
  fit_changed: { de: "Die Daten wurden während der Berechnung geändert. Bitte erneut anpassen.", en: "The data changed during the calculation. Please fit again." },
  // template chooser (the template texts themselves are still German)
  h_tpl: { de: "Vorlage laden", en: "Load template" },
  hint_tpl: { de: "Eine fertige Vorlage pro Versuch mit erfundenen Beispieldaten, den passenden Spalten und Einstellungen. Du drückst die Schritte der Reihe nach und ersetzt dann die Zahlen durch deine Messung. Das ersetzt das aktuelle Projekt.",
              en: "One finished template per experiment with invented example data, the matching columns and settings. You press the steps in order and then replace the numbers with your measurement. This replaces the current project." },
  tpl_exp: { de: "Versuch", en: "Experiment" },
  tpl_choose: { de: "(bitte wählen)", en: "(please choose)" },
  tpl_aria: { de: "Vorlage wählen", en: "Choose a template" },
  b_tpl: { de: "Vorlage laden", en: "Load template" },
  tpl_pick: { de: "Bitte zuerst einen Versuch in der Liste wählen.", en: "Please choose an experiment from the list first." },
  // paste
  h_paste: { de: "Daten einfügen", en: "Paste data" },
  b_paste: { de: "Als Tabelle übernehmen", en: "Use as table" },
  hint_paste: { de: "Aus Excel oder einer CSV-Datei kopieren. Trennzeichen ; oder Tab, Dezimalkomma ist in Ordnung. Die ersten drei Spalten sind x, y und Fehler von y.", en: "Copy from Excel or a CSV file. Separator ; or tab, a decimal comma is fine. The first three columns are x, y and error of y." },
  // messages
  store_warn: { de: "Automatisches Speichern ist in diesem Browser nicht möglich. Bitte speichere das Projekt mit „Projekt speichern“.", en: "Automatic saving is not possible in this browser. Please save the project with “Save project”." },
  restored: { de: "Wiederhergestellt: Dein letzter Stand wurde automatisch geladen.", en: "Restored: your last state was loaded automatically." },
  autosave_bad: { de: "Der automatisch gespeicherte Stand war beschädigt und wurde verworfen.", en: "The automatically saved state was damaged and has been discarded." },
  too_big: { de: "„{name}“ ist größer als 5 MB und zu groß für PlotLab.", en: "“{name}” is larger than 5 MB and too big for PlotLab." },
  not_number: { de: "Zeile {r}, Spalte {c}: „{v}“ ist keine Zahl.", en: "Row {r}, column {c}: “{v}” is not a number." },
  // table
  h_table: { de: "Tabelle", en: "Table" },
  hint_table: { de: "Mehrere Zellen aus Excel oder einer CSV-Datei kannst du mit Strg/Cmd+V in eine Zelle einfügen. Sie füllen die Tabelle ab dieser Zelle nach unten und rechts; Formelspalten werden übersprungen.",
                en: "You can paste several cells from Excel or a CSV file into a cell with Ctrl/Cmd+V. They fill the table from that cell downwards and to the right; formula columns are skipped." },
  table_none: { de: "Noch keine Daten. Lade das Beispiel oder öffne ein Projekt.", en: "No data yet. Load the example or open a project." },
  b_addrow: { de: "Zeile hinzufügen", en: "Add row" },
  role_x: { de: "x-Werte", en: "x values" },
  role_y: { de: "y-Werte", en: "y values" },
  role_yerr: { de: "Fehler von y", en: "Error of y" },
  role_unused: { de: "nicht verwendet", en: "not used" },
  delcol: { de: "Spalte entfernen", en: "Remove column" },
  fx_prop: { de: "Gauß-Fortpflanzung von {f}: {m}", en: "Gaussian propagation of {f}: {m}" },
};

let LANG = "de";
const LANG_KEY = "plotlab-lang";
// t("key", { name: value }): the text in the chosen language. An unknown key is a bug, so it shows itself as [key].
function t(key, vars) {
  const e = TEXTS[key];
  if (!e) return "[" + key + "]";
  return e[LANG].replace(/\{(\w+)\}/g, (m, k) => vars && k in vars ? vars[k] : m);
}
// Number formats follow the chosen language (German: decimal comma; English: decimal point and no thousands separator, so a shown number can be typed back).
const nf = o => { const c = {}; return { format: v => (c[LANG] ??= new Intl.NumberFormat(LANG === "en" ? "en-US" : "de-DE", LANG === "en" ? { useGrouping: false, ...o } : o)).format(v) }; };
const decSep = () => LANG === "en" ? "." : ",";
const plotSeparators = () => LANG === "en" ? ".," : ",.";
function setLang(l) {
  LANG = l === "en" ? "en" : "de";
  try { localStorage.setItem(LANG_KEY, LANG); } catch {}
  if (typeof document === "undefined") return;
  document.documentElement.lang = LANG;
  applyStatic();
}
function initLang() {
  let l = "de";
  try { l = localStorage.getItem(LANG_KEY) === "en" ? "en" : "de"; } catch {}
  LANG = l;
  if (typeof document !== "undefined") { document.documentElement.lang = LANG; applyStatic(); }
}
// Fixed texts in the HTML: data-i18n (text), data-i18n-title, data-i18n-ph (placeholder), data-i18n-aria (aria-label) hold keys.
function applyStatic() {
  for (const [attr, set] of [["i18n", (el, s) => { el.textContent = s; }], ["i18n-title", (el, s) => { el.title = s; }],
    ["i18n-ph", (el, s) => { el.placeholder = s; }], ["i18n-aria", (el, s) => { el.setAttribute("aria-label", s); }]]) {
    document.querySelectorAll(`[data-${attr}]`).forEach(el => set(el, t(el.getAttribute(`data-${attr}`))));
  }
  const n = document.getElementById("langnote");
  if (n) n.hidden = LANG === "de";
  document.querySelectorAll("[data-lang]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === LANG)));
}
if (typeof module !== "undefined") module.exports = { TEXTS };
