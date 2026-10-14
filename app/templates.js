if (typeof module !== "undefined") require("./i18n.js"); // t() is a global on the page; in Node this makes them globals
// Template projects, one per experiment (Phase 2 step 15: P1 to P5). Each one is a finished project with INVENTED example data
// (the page says so): columns, formula columns, roles and settings are set, the student presses the listed steps and replaces the numbers.
// The id is stored in the project (project.template); the title and texts always come from this table (title, note and step texts are getters on the chosen language, texts in i18n.js), never from a project file.
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
  p.settings.tools = [...TEMPLATES.find(q => q.id === id).tools]; // the tools this experiment needs; the page opens only these
  return p;
}

const P1_L = [9.5, 9.6, 9.7, 9.7, 9.8, 9.8, 9.8, 9.9, 9.9, 9.9, 10.0, 10.0, 10.0, 10.0, 10.05, 10.05, 10.1, 10.1, 10.1, 10.2, 10.2, 10.2, 10.2, 10.2, 10.3, 10.3, 10.4, 10.4, 10.5, 10.6];
const P3_ROWS = [[10, 0.26, 0.02, 0.30, 0.02], [20, 0.50, 0.02, 0.55, 0.02], [30, 0.77, 0.02, 0.81, 0.02], [40, 1.03, 0.02, 1.05, 0.04], [50, 1.28, 0.02, 1.31, 0.04], [60, 1.51, 0.02, 1.54, 0.04]];
const P4_ROWS = [[0.5, 29.6, 0.4], [0.75, 19.9, 0.3], [1, 14.8, 0.3], [1.25, 11.8, 0.2], [1.5, 10.0, 0.2], [2, 7.4, 0.2]];
const P5A_ROWS = [[1, 0.05, 3.3, 0.2], [1, 0.10, 6.6, 0.2], [2, 0.05, 6.7, 0.2], [2, 0.10, 13.2, 0.3], [2, 0.15, 20.1, 0.3], [2, 0.20, 26.5, 0.4]];
const P5B_ROWS = [[1, 1.54, 0.02], [2, 2.17, 0.02], [3, 2.66, 0.02], [4, 3.07, 0.02], [5, 3.44, 0.02], [6, 3.76, 0.02], [7, 4.06, 0.02], [8, 4.34, 0.02]];

const P6A_ROWS = [[1, 100, 0.5, 330, 1, 150, 0.5], [2, 100, 0.5, 220, 1, 101.5, 0.5], [3, 47, 0.2, 470, 2, 100, 0.5]];
const P6B_ROWS = [[1, 193.5, 1, 1000, 2], [2, 410.0, 1, 1000, 2], [3, 691.5, 1, 1000, 2]];
const P7_ROWS = [[0, 1.3330, 0.0002], [5, 1.3409, 0.0002], [10, 1.3485, 0.0002], [15, 1.3565, 0.0003], [20, 1.3641, 0.0003], [25, 1.3721, 0.0003]];
const P8A_N = [9, 12, 8, 10, 7, 11, 9, 6, 10, 13, 8, 9, 15, 7, 14, 9, 12, 5, 6, 10, 9, 11, 8, 4, 14, 9, 7, 12, 10, 3, 9, 10, 11, 7, 9, 13, 8, 17, 9, 11];
const P8B_ROWS = [[0, 1000, 31.6], [1, 766, 27.7], [2, 586, 24.2], [3, 449, 21.2], [4, 344, 18.5], [5, 263, 16.2], [6, 201, 14.2], [7, 154, 12.4]];
const P9_ROWS = [[0.30, 1.101, 0.005], [0.45, 1.343, 0.005], [0.60, 1.556, 0.005], [0.80, 1.790, 0.008], [1.00, 2.009, 0.010]];

// tools = the tool ids (app/tools.js) the experiment needs, in menu order. go = id of the button the step is about (the page offers "Zeigen" to jump to it); a step without go is information only.
const TEMPLATES = [
  { id: "p1", tools: ["stats", "hist", "cum"], get title() { return t("tpl_p1_title"); },
    get note() { return t("tpl_p1_note"); },
    steps: [
      { go: "s_go", get text() { return t("tpl_p1_s1"); } },
      { go: "h_go", get text() { return t("tpl_p1_s2"); } },
    ],
    build: () => _make(["Nr / 1", "l / mm"], P1_L.map((_, i) => [i + 1, P1_L[(i * 7) % P1_L.length]]), // 7 and 30 share no factor: the same 30 readings in a mixed order, like a real sheet
       { id: "p1", x: "Nr / 1", y: "l / mm",
      settings: { stats: { col: "l / mm", ddof: 1, instr: null }, hist: { col: "l / mm", ddof: 1, width: 0.2, start: 9.5 } } }) },
  { id: "p2", tools: ["stats", "wmean"], get title() { return t("tpl_p2_title"); },
    get note() { return t("tpl_p2_note"); },
    steps: [
      { go: "s_go", get text() { return t("tpl_p2_s1"); } },
      { get text() { return t("tpl_p2_s2"); } },
      { go: "w_go", get text() { return t("tpl_p2_s3"); } },
    ],
    build: () => _make(["Nr / 1", "d / mm", "V / cm³", "u / cm³"], [[1, 20.02, 10.3, 0.2], [2, 20.00, 10.5, 0.3], [3, 19.98, 9.9, 0.1], [4, 20.01, null, null], [5, 19.99, null, null]],
      { id: "p2", x: "Nr / 1", y: "V / cm³", yerr: "u / cm³", calc: [["A / mm²", "pi*(d/2)^2", "d = 0,05"]],
        settings: { stats: { col: "d / mm", ddof: 1, instr: 0.05 }, wmean: { val: "V / cm³", unc: "u / cm³", k: 1 } } }) },
  { id: "p3", tools: ["series", "derived"], get title() { return t("tpl_p3_title"); },
    get note() { return t("tpl_p3_note"); },
    steps: [
      { go: "sr_go", get text() { return t("tpl_p3_s1"); } },
      { go: "fit", get text() { return t("tpl_p3_s2"); } },
      { go: "derive", get text() { return t("tpl_p3_s3"); } },
    ],
    build: () => _make(["F / N", "ΔL auf / mm", "sΔL auf / mm", "ΔL ab / mm", "sΔL ab / mm"], P3_ROWS, { id: "p3", x: "F / N", y: "ΔL auf / mm", yerr: "sΔL auf / mm",
      settings: { derived: { ...DERIVED_TEMPLATES.E }, series: [{ y: "ΔL auf / mm", err: "sΔL auf / mm", xmin: null, xmax: null }, { y: "ΔL ab / mm", err: "sΔL ab / mm", xmin: null, xmax: null }] } }) },
  { id: "p4", tools: ["derived"], get title() { return t("tpl_p4_title"); },
    get note() { return t("tpl_p4_note"); },
    steps: [
      { go: "fit", get text() { return t("tpl_p4_s1"); } },
      { go: "derive", get text() { return t("tpl_p4_s2"); } },
    ],
    build: () => _make(["r / mm", "h / mm", "sh / mm"], P4_ROWS, { id: "p4", x: "r⁻¹ / mm⁻¹", y: "h / mm", yerr: "sh / mm", calc: [["r⁻¹ / mm⁻¹", "1/r", ""]],
      settings: { derived: { ...DERIVED_TEMPLATES.sigma } } }) },
  { id: "p5a", tools: [], get title() { return t("tpl_p5a_title"); },
    get note() { return t("tpl_p5a_note"); },
    steps: [
      { go: "fit", get text() { return t("tpl_p5a_s1"); } },
    ],
    build: () => _make(["d / dm", "c / g·mL⁻¹", "α / °", "sα / °"], P5A_ROWS, { id: "p5a", x: "d·c / dm·g·mL⁻¹", y: "α / °", yerr: "sα / °", calc: [["d·c / dm·g·mL⁻¹", "d*c", ""]] }) },
  { id: "p5b", tools: ["derived"], get title() { return t("tpl_p5b_title"); },
    get note() { return t("tpl_p5b_note"); },
    steps: [
      { go: "fit", get text() { return t("tpl_p5b_s1"); } },
      { go: "derive", get text() { return t("tpl_p5b_s2"); } },
    ],
    build: () => _make(["k / 1", "D / mm", "sD / mm"], P5B_ROWS, { id: "p5b", x: "k / 1", y: "r² / mm²", yerr: "u(r²) / mm²", calc: [["r² / mm²", "(D/2)^2", "D = sD"]],
      settings: { derived: { ...DERIVED_TEMPLATES.R } } }) },
  { id: "p6a", tools: ["wmean", "compare"], get title() { return t("tpl_p6a_title"); },
    get note() { return t("tpl_p6a_note"); },
    steps: [
      { get text() { return t("tpl_p6a_s1"); } },
      { go: "w_go", get text() { return t("tpl_p6a_s2"); } },
      { go: "k_go", get text() { return t("tpl_p6a_s3"); } },
    ],
    build: () => _make(["Nr / 1", "R1 / Ω", "sR1 / Ω", "R2 / Ω", "sR2 / Ω", "R3 / Ω", "sR3 / Ω"], P6A_ROWS,
      { id: "p6a", x: "Nr / 1", y: "Rx / Ω", yerr: "u(Rx) / Ω", calc: [["Rx / Ω", "R1*R2/R3", "R1 = sR1; R2 = sR2; R3 = sR3"]],
        settings: { wmean: { val: "Rx / Ω", unc: "u(Rx) / Ω", k: 1 }, compare: { meas: "219,4 ± 1,0", ref: "220 ± 2,2", unit: "Ω" } } }) },
  { id: "p6b", tools: ["wmean", "compare"], get title() { return t("tpl_p6b_title"); },
    get note() { return t("tpl_p6b_note"); },
    steps: [
      { get text() { return t("tpl_p6b_s1"); } },
      { go: "w_go", get text() { return t("tpl_p6b_s2"); } },
      { go: "k_go", get text() { return t("tpl_p6b_s3"); } },
    ],
    build: () => _make(["k / 1", "x / mm", "sx / mm", "L / mm", "sL / mm"], P6B_ROWS,
      { id: "p6b", x: "k / 1", y: "λ / nm", yerr: "u(λ) / nm", calc: [["λ / nm", "(1000000/300)*x/(k*sqrt(x^2+L^2))", "x = sx; L = sL"]],
        settings: { wmean: { val: "λ / nm", unc: "u(λ) / nm", k: 1 }, compare: { meas: "632,1 ± 0,9", ref: "632,8", unit: "nm" } } }) },
  { id: "p7", tools: ["calib"], get title() { return t("tpl_p7_title"); },
    get note() { return t("tpl_p7_note"); },
    steps: [
      { go: "fit", get text() { return t("tpl_p7_s1"); } },
      { go: "c_go", get text() { return t("tpl_p7_s2"); } },
    ],
    build: () => _make(["w / %", "n / 1", "sn / 1"], P7_ROWS, { id: "p7", x: "w / %", y: "n / 1", yerr: "sn / 1",
      settings: { calib: { y0: "1,3505 ± 0,0003; 1,3600 ± 0,0003; 1,3780 ± 0,0003" } } }) },
  { id: "p8a", tools: ["gof"], get title() { return t("tpl_p8a_title"); },
    get note() { return t("tpl_p8a_note"); },
    steps: [
      { go: "g_go", get text() { return t("tpl_p8a_s1"); } },
    ],
    build: () => _make(["Nr / 1", "N / 1"], P8A_N.map((n, i) => [i + 1, n]), { id: "p8a", x: "Nr / 1", y: "N / 1",
      settings: { gof: { col: "N / 1", width: 3, start: 3 } } }) },
  { id: "p8b", tools: ["logy", "export"], get title() { return t("tpl_p8b_title"); },
    get note() { return t("tpl_p8b_note"); },
    steps: [
      { go: "logy", get text() { return t("tpl_p8b_s1"); } },
      { go: "plot_png", get text() { return t("tpl_p8b_s2"); } },
    ],
    build: () => _make(["t / min", "N / 1", "sN / 1"], P8B_ROWS, { id: "p8b", x: "t / min", y: "N / 1", yerr: "sN / 1", settings: { logy: true } }) },
  { id: "p9", tools: ["stats", "derived"], get title() { return t("tpl_p9_title"); },
    get note() { return t("tpl_p9_note"); },
    steps: [
      { go: "s_go", get text() { return t("tpl_p9_s1"); } },
      { go: "fit", get text() { return t("tpl_p9_s2"); } },
      { go: "derive", get text() { return t("tpl_p9_s3"); } },
    ],
    build: () => _make(["l / m", "T / s", "sT / s"], P9_ROWS, { id: "p9", x: "l / m", y: "T² / s²", yerr: "u(T²) / s²",
      calc: [["T² / s²", "T^2", "T = sT"], ["gi / m/s²", "4*pi^2*l/T^2", ""]],
      settings: { stats: { col: "gi / m/s²", ddof: 1, instr: null, conf: 0.95 }, derived: { ...DERIVED_TEMPLATES.g } } }) },
];

if (typeof module !== "undefined") module.exports = { TEMPLATES, DERIVED_TEMPLATES };
