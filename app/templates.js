// Template projects, one per experiment (Phase 2 step 15: P1 to P5). Each one is a finished project with INVENTED example data
// (the page says so): columns, formula columns, roles and settings are set, the student presses the listed steps and replaces the numbers.
// The id is stored in the project (project.template); the title and texts always come from this table, never from a project file.
const _TP = typeof module !== "undefined" ? require("./project.js") : { newProject };

// Templates for the derived quantity. E: L in m, d in mm, a in mm/N gives GPa (1 m, 1 mm, 1 mm/N is 4/π GPa). g: a = T²/l in s²/m gives m/s².
const DERIVED_TEMPLATES = {
  E: { name: "E", unit: "GPa", formula: "4*L/(pi*d^2*a)", vars: "L = 1 ± 0,002; d = 0,5 ± 0,01", aUnit: "mm/N" },
  g: { name: "g", unit: "m/s²", formula: "4*pi^2/a", vars: "", aUnit: "s²/m" },
  // M5: h = 2σ/(ρ·g) · (1/r), so σ = a·ρ·g/2. a in mm² (= mm/mm⁻¹) is 1e-6 m², σ in mN/m is 1e3 N/m: σ = a·ρ·g/2000.
  sigma: { name: "σ", unit: "mN/m", formula: "a*rho*g/2000", vars: "rho = 998 ± 1; g = 9,81", aUnit: "mm/mm⁻¹" },
  // O6: r² = k·λ·R, so R = a/λ. a in mm², λ in nm (1e-6 mm), R in m (1e3 mm): R = a·1000/λ.
  R: { name: "R", unit: "m", formula: "a*1000/lam", vars: "lam = 589,3 ± 0,1", aUnit: "mm²/1" },
};

// Calculated columns are listed as [name, formula, uncertainty map or ""]; the uncertainty column is named like the page does: u(short) / unit.
const _uName = name => { const [s, ...u] = name.split(" / "); return `u(${s.trim()})` + (u.length ? " / " + u.join(" / ") : ""); };
function _make(header, rows, { x, y, yerr, calc = [], settings = {}, id }) {
  const p = _TP.newProject(header, rows), n = rows.length, blank = () => Array(n).fill(null);
  for (const [name, formula, unc] of calc) {
    p.columns.push({ name, role: "unused", values: blank(), formula });
    if (unc) p.columns.push({ name: _uName(name), role: "unused", values: blank(), uncert: { formula, map: unc } });
  }
  p.columns.forEach(c => { c.role = c.name === x ? "x" : c.name === y ? "y" : c.name === yerr ? "yerr" : "unused"; });
  Object.assign(p.settings, settings);
  p.template = id;
  return p;
}

const P1_L = [9.5, 9.6, 9.7, 9.7, 9.8, 9.8, 9.8, 9.9, 9.9, 9.9, 10.0, 10.0, 10.0, 10.0, 10.05, 10.05, 10.1, 10.1, 10.1, 10.2, 10.2, 10.2, 10.2, 10.2, 10.3, 10.3, 10.4, 10.4, 10.5, 10.6];
const P3_ROWS = [[10, 0.26, 0.02, 0.30, 0.02], [20, 0.50, 0.02, 0.55, 0.02], [30, 0.77, 0.02, 0.81, 0.02], [40, 1.03, 0.02, 1.05, 0.04], [50, 1.28, 0.02, 1.31, 0.04], [60, 1.51, 0.02, 1.54, 0.04]];
const P4_ROWS = [[0.5, 29.6, 0.4], [0.75, 19.9, 0.3], [1, 14.8, 0.3], [1.25, 11.8, 0.2], [1.5, 10.0, 0.2], [2, 7.4, 0.2]];
const P5A_ROWS = [[1, 0.05, 3.3, 0.2], [1, 0.10, 6.6, 0.2], [2, 0.05, 6.7, 0.2], [2, 0.10, 13.2, 0.3], [2, 0.15, 20.1, 0.3], [2, 0.20, 26.5, 0.4]];
const P5B_ROWS = [[1, 1.54, 0.02], [2, 2.17, 0.02], [3, 2.66, 0.02], [4, 3.07, 0.02], [5, 3.44, 0.02], [6, 3.76, 0.02], [7, 4.06, 0.02], [8, 4.34, 0.02]];

// go = id of the button the step is about (the page offers "Zeigen" to jump to it); a step without go is information only.
const TEMPLATES = [
  { id: "p1", title: "P1 Fehlerverteilung",
    note: "30 Ablesungen einer Länge l. Gesucht: Mittelwert, Streuung, Häufigkeitstabelle, Histogramm mit Normalverteilung und die Ablesung bei 16 % und 84 %.",
    steps: [
      { go: "s_go", text: "Unter „Mittelwert und Streuung einer Spalte“ ist die Spalte „l / mm“ mit dem Teiler n−1 gewählt. Auf „Berechnen“ drücken: x̄ ± s/√n und s." },
      { go: "h_go", text: "Unter „Häufigkeitstabelle und Histogramm“ sind Klassenbreite 0,2 mm und Beginn 9,5 mm eingetragen. Auf „Berechnen“ drücken: Tabelle, Histogramm mit Normalverteilung und Summenhäufigkeit mit der Ablesung bei 16 % und 84 %." },
    ],
    build: () => _make(["Nr / 1", "l / mm"], P1_L.map((_, i) => [i + 1, P1_L[(i * 7) % P1_L.length]]), // 7 and 30 share no factor: the same 30 readings in a mixed order, like a real sheet
       { id: "p1", x: "Nr / 1", y: "l / mm",
      settings: { stats: { col: "l / mm", ddof: 1, instr: null }, hist: { col: "l / mm", ddof: 1, width: 0.2, start: 9.5 } } }) },
  { id: "p2", title: "P2 Volumenmessung",
    note: "Zuerst fünf Ablesungen des Durchmessers d mit der Schieblehre (Gerätefehler 0,05 mm), daraus die Querschnittsfläche A mit Fehlerfortpflanzung. Dann drei Ergebnisse für das Volumen V aus drei Verfahren.",
    steps: [
      { go: "s_go", text: "Unter „Mittelwert und Streuung einer Spalte“ sind die Spalte „d / mm“ und der Gerätefehler 0,05 eingetragen. Auf „Berechnen“ drücken: Mittelwert mit Standardfehler und mit Gerätefehler (quadratisch addiert)." },
      { text: "Die Spalten „A / mm²“ und „u(A) / mm²“ sind schon berechnet: A = π·(d/2)², u(A) aus der Gaußschen Fehlerfortpflanzung mit u(d) = 0,05 mm (siehe Kopf der Spalten)." },
      { go: "w_go", text: "Unter „Gewichteter Mittelwert und Überlappung“ sind V und u mit k = 1 gewählt. Auf „Berechnen“ drücken: gewichteter Mittelwert mit Unsicherheit und die Überlappungsprüfung." },
    ],
    build: () => _make(["Nr / 1", "d / mm", "V / cm³", "u / cm³"], [[1, 20.02, 10.3, 0.2], [2, 20.00, 10.5, 0.3], [3, 19.98, 9.9, 0.1], [4, 20.01, null, null], [5, 19.99, null, null]],
      { id: "p2", x: "Nr / 1", y: "V / cm³", yerr: "u / cm³", calc: [["A / mm²", "pi*(d/2)^2", "d = 0,05"]],
        settings: { stats: { col: "d / mm", ddof: 1, instr: 0.05 }, wmean: { val: "V / cm³", unc: "u / cm³", k: 1 } } }) },
  { id: "p3", title: "P3 Elastizität",
    note: "Ein Stahldraht wird belastet und entlastet (Verlängerung ΔL gegen Kraft F). Gesucht: die Steigung beider Reihen, ihr Vergleich und der Elastizitätsmodul E aus der Belastung.",
    steps: [
      { go: "sr_go", text: "Unter „Mehrere Messreihen in einem Diagramm“ sind Belastung und Entlastung eingetragen. Auf „Reihen anpassen“ drücken: zwei Geraden und der Vergleich der Steigungen." },
      { go: "fit", text: "Unter „Anpassung“ auf „Anpassen“ drücken: Gerade durch die Belastungsreihe, gewichtet mit 1/s²." },
      { go: "derive", text: "Unter „Abgeleitete Größe“ sind E = 4·L/(π·d²·a), L = 1 ± 0,002 m und d = 0,5 ± 0,01 mm eingetragen. Auf „Berechnen“ drücken." },
    ],
    build: () => _make(["F / N", "ΔL auf / mm", "sΔL auf / mm", "ΔL ab / mm", "sΔL ab / mm"], P3_ROWS, { id: "p3", x: "F / N", y: "ΔL auf / mm", yerr: "sΔL auf / mm",
      settings: { derived: { ...DERIVED_TEMPLATES.E }, series: [{ y: "ΔL auf / mm", err: "sΔL auf / mm", xmin: null, xmax: null }, { y: "ΔL ab / mm", err: "sΔL ab / mm", xmin: null, xmax: null }] } }) },
  { id: "p4", title: "P4 Oberflächenspannung",
    note: "Kapillarmethode mit Wasser: Steighöhe h gegen den Kehrwert des Röhrenradius r. Aus h = (2σ/(ρ·g))·(1/r) folgt die Oberflächenspannung σ aus der Steigung.",
    steps: [
      { go: "fit", text: "Die Spalte „r⁻¹ / mm⁻¹“ (= 1/r) ist eine Formelspalte und die x-Achse. Unter „Anpassung“ auf „Anpassen“ drücken: Gerade h = a·(1/r) + b." },
      { go: "derive", text: "Unter „Abgeleitete Größe“ sind σ = a·ρ·g/2000 (a in mm², σ in mN/m), ρ = 998 ± 1 kg/m³ und g = 9,81 m/s² eingetragen. Auf „Berechnen“ drücken." },
    ],
    build: () => _make(["r / mm", "h / mm", "sh / mm"], P4_ROWS, { id: "p4", x: "r⁻¹ / mm⁻¹", y: "h / mm", yerr: "sh / mm", calc: [["r⁻¹ / mm⁻¹", "1/r", ""]],
      settings: { derived: { ...DERIVED_TEMPLATES.sigma } } }) },
  { id: "p5a", title: "P5 Polarimetrie (Saccharose)",
    note: "Drehwinkel α gegen das Produkt aus Schichtdicke d und Konzentration c. Die Steigung ist die spezifische Drehung [α].",
    steps: [
      { go: "fit", text: "Die Spalte „d·c / dm·g·mL⁻¹“ (= d·c) ist eine Formelspalte und die x-Achse. Unter „Anpassung“ auf „Anpassen“ drücken: a ist die spezifische Drehung in °/(dm·g·mL⁻¹), gewichtet mit 1/s²." },
    ],
    build: () => _make(["d / dm", "c / g·mL⁻¹", "α / °", "sα / °"], P5A_ROWS, { id: "p5a", x: "d·c / dm·g·mL⁻¹", y: "α / °", yerr: "sα / °", calc: [["d·c / dm·g·mL⁻¹", "d*c", ""]] }) },
  { id: "p5b", title: "P5 Newtonsche Ringe",
    note: "Durchmesser D der dunklen Ringe k = 1 bis 8 (Natriumlicht). Aus r² = k·λ·R folgt der Krümmungsradius R der Linse aus der Steigung von r² gegen k.",
    steps: [
      { go: "fit", text: "Die Spalten „r² / mm²“ = (D/2)² und „u(r²) / mm²“ (Fehlerfortpflanzung aus u(D)) sind schon berechnet. Unter „Anpassung“ auf „Anpassen“ drücken: a = λ·R." },
      { go: "derive", text: "Unter „Abgeleitete Größe“ sind R = a·1000/λ (a in mm², λ in nm, R in m) und λ = 589,3 ± 0,1 nm eingetragen. Auf „Berechnen“ drücken." },
    ],
    build: () => _make(["k / 1", "D / mm", "sD / mm"], P5B_ROWS, { id: "p5b", x: "k / 1", y: "r² / mm²", yerr: "u(r²) / mm²", calc: [["r² / mm²", "(D/2)^2", "D = sD"]],
      settings: { derived: { ...DERIVED_TEMPLATES.R } } }) },
];

if (typeof module !== "undefined") module.exports = { TEMPLATES, DERIVED_TEMPLATES };
