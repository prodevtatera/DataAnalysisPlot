// Builds the pages that search engines and AI assistants read: the English home page, the experiment hub, one page per experiment template,
// the method page (each in German and English), sitemap.xml and llms.txt. It also keeps the head tags, the language switch, the question-and-answer
// block and every fixed text of app/index.html in step with app/i18n.js (German is the source file, English is generated from it).
// All texts come from app/i18n.js (templates) and from the tables below, so nothing is written twice. Run: node scripts/build-pages.mjs
// Check that the files on disk are current (used by tests/seo-3-pages.sh): node scripts/build-pages.mjs --check
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
const { TEXTS } = createRequire(import.meta.url)("../app/i18n.js");
const APP = resolve(import.meta.dirname, "../app");
export const SITE = "https://plot.productledlab.dev";
const LASTMOD = "2026-10-15"; // ponytail: bump by hand when a page's content changes; a computed date would change on every rebuild
const BRAND = "PlotLab";

// ---- the fact sheet: one wording, used by the page head, the JSON-LD, the question block, the method page and llms.txt
export const FACTS = {
  de: {
    what: "PlotLab ist ein kostenloses Werkzeug zum Auswerten und Plotten von Praktikumsdaten im Browser.",
    who: "Für Studierende im Praktikum, zum Beispiel in Biologie und Physik im ersten und zweiten Studienjahr.",
    price: "Kostenlos, ohne Anmeldung, ohne Installation.",
    privacy: "Alles wird in deinem Browser gerechnet. Deine Messwerte werden nicht hochgeladen.",
    langs: "Deutsch und Englisch.",
    fits: "Gerade (gewichtet und ungewichtet), Exponentialfunktion, Polynom bis Grad 6, Sinus, Gauß-Kurve und freie Formel.",
    round: "Das Ergebnis steht als (Wert ± u) Einheit da: u wird auf eine signifikante Stelle gerundet, auf zwei, wenn diese Stelle 1 oder 2 ist, und der Wert passend dazu.",
    nist: "Die Anpassungen sind gegen NIST-StRD-Referenzwerte geprüft: Parameter stimmen auf 6,5 bis 9 Stellen.",
  },
  en: {
    what: "PlotLab is a free tool for evaluating and plotting lab data in your browser.",
    who: "For students in lab courses, for example in biology and physics in the first and second year.",
    price: "Free, no signup, no install.",
    privacy: "Everything is calculated in your browser. Your measurements are not uploaded.",
    langs: "German and English.",
    fits: "Straight line (weighted and unweighted), exponential, polynomial up to degree 6, sine, Gaussian and free formula.",
    round: "The result reads (value ± u) unit: u is rounded to one significant digit, or two if that digit is 1 or 2, and the value to match.",
    nist: "The fits are checked against NIST StRD reference values: parameters agree to 6.5 to 9 digits.",
  },
};

// ---- fixed words of the generated pages
const W = {
  de: { proof: "✓ NIST-geprüft", how: "So geht es in PlotLab", invented: "Die Zahlen in der Vorlage sind erfunden. Du ersetzt sie durch deine Messwerte.", open: "Vorlage in PlotLab öffnen", all: "Alle Versuche", crumbHub: "Versuche", crumbs: "Brotkrumen", sw: "Sprache / Language", home: "PlotLab",
    hubTitle: "Praktikumsversuche auswerten: 12 Vorlagen", hubDesc: "12 Vorlagen für Praktikumsversuche: Tabelle, Diagramm und Auswertung mit Fehlerbalken und Unsicherheit. Kostenlos im Browser, ohne Anmeldung.",
    hubH1: "Versuchsvorlagen für Praktikum und Protokoll", hubLead: "Wähle deinen Versuch. Die Vorlage legt Tabelle, Diagramm und Werkzeuge an. Die Zahlen darin sind erfunden.",
    mTitle: "Rechenmethoden und Prüfung gegen NIST-Werte", mDesc: "Wie PlotLab rechnet: Fehlerangabe, Rundung nach Praktikumsregel und Prüfung der Anpassungen gegen NIST-Referenzwerte. Kostenlos im Browser.",
    mH1: "Methode und Prüfung", mLead: "PlotLab rechnet im Browser mit Python (SciPy). Jede Rechnung wird gegen unabhängige Referenzwerte geprüft, nicht gegen die eigene Bibliothek.",
    mItems: ["Fehlerangabe: Bei gewichteten Fits gibt PlotLab beide Angaben an, skaliert mit √(χ²/DoF) oder nicht skaliert (aus den Einzelunsicherheiten). Das Ergebnis nennt, welche Methode gilt.",
      "Geradenanpassung: Gegen den NIST-Datensatz Norris (36 Punkte) stimmen Steigung, Achsenabschnitt, ihre Fehler und die Residuensumme auf 9 oder mehr Stellen.",
      "Weitere Anpassungen: Gegen NIST-Datensätze (Misra1a, Misra1d, BoxBOD, Eckerle4, Lanczos3, Gauss1, ENSO, Pontius, Wampler 1, 4 und 5) stimmen die Parameter auf 6,5 bis 9 Stellen. Ein Start, bei dem die Anpassung stecken bleibt, zeigt eine Meldung statt einer falschen Zahl.",
      "Rundung: " + FACTS.de.round,
      "Beispiele: Die Zahlen in den Versuchsvorlagen sind erfunden."],
    mNot: "Noch nicht geprüft: Der Vergleich mit R steht aus." },
  en: { proof: "✓ NIST-verified", how: "How it works in PlotLab", invented: "The numbers in the template are invented. You replace them with your own measurements.", open: "Open the template in PlotLab", all: "All experiments", crumbHub: "Experiments", crumbs: "Breadcrumb", sw: "Sprache / Language", home: "PlotLab",
    hubTitle: "Evaluate Lab Experiments: 12 Free Templates", hubDesc: "12 templates for lab experiments: table, plot and evaluation with error bars and uncertainty. Free in your browser, no signup.",
    hubH1: "Experiment templates for lab courses and reports", hubLead: "Choose your experiment. The template sets up table, plot and tools. The numbers in it are invented.",
    mTitle: "Methods and Checks Against NIST Reference Values", mDesc: "How PlotLab calculates: uncertainty options, rounding by the lab rule and checks of the fits against NIST reference values. Free in your browser.",
    mH1: "Methods and checks", mLead: "PlotLab calculates in your browser with Python (SciPy). Every calculation is checked against independent reference values, not against the library itself.",
    mItems: ["Uncertainty: for weighted fits PlotLab gives both options, scaled by √(χ²/DoF) or unscaled (from the individual uncertainties). The result says which method applies.",
      "Straight-line fit: against the NIST data set Norris (36 points) slope, intercept, their errors and the residual sum of squares agree to 9 or more digits.",
      "Other fits: against NIST data sets (Misra1a, Misra1d, BoxBOD, Eckerle4, Lanczos3, Gauss1, ENSO, Pontius, Wampler 1, 4 and 5) the parameters agree to 6.5 to 9 digits. A start where the fit gets stuck shows a message instead of a wrong number.",
      "Rounding: " + FACTS.en.round,
      "Examples: the numbers in the experiment templates are invented."],
    mNot: "Not yet checked: the comparison with R is still open." },
};

// ---- questions of the home page (also in the JSON-LD); answers repeat the fact sheet
const FAQ = {
  de: [
    ["Ist PlotLab kostenlos?", `Ja. ${FACTS.de.price}`],
    ["Bleiben meine Daten auf meinem Rechner?", `Ja. ${FACTS.de.privacy}`],
    ["Kann ich Excel-Tabellen und Dezimalkomma nutzen?", "Ja. PlotLab liest CSV-Dateien mit Dezimalkomma oder Punkt und Semikolon oder Komma. Eine Tabelle aus Excel fügst du mit Strg/Cmd+V ein."],
    ["Welche Anpassungen gibt es?", FACTS.de.fits],
    ["Wie wird das Ergebnis gerundet?", FACTS.de.round],
  ],
  en: [
    ["Is PlotLab free?", `Yes. ${FACTS.en.price}`],
    ["Does my data stay on my computer?", `Yes. ${FACTS.en.privacy}`],
    ["Can I paste from Excel?", "Yes. PlotLab reads CSV files with decimal comma or point and semicolon or comma. Paste a table from Excel with Ctrl/Cmd+V."],
    ["Which fits are there?", FACTS.en.fits],
    ["How is the result rounded?", FACTS.en.round],
  ],
};

// ---- per experiment: slugs, title (also the h1) and meta description, German then English
const EXP = [
  ["p1", "fehlerverteilung", "error-distribution", ["Mittelwert, Streuung und Histogramm auswerten", "Mean, Spread and Histogram of a Measurement Series"],
    ["30 Ablesungen auswerten: Mittelwert, Streuung, Häufigkeitstabelle und Histogramm mit Normalverteilung. Kostenlose Vorlage im Browser.", "Evaluate 30 readings: mean, spread, frequency table and histogram with normal curve. Free template in your browser, no signup."]],
  ["p2", "volumenmessung", "volume-measurement", ["Volumenmessung mit Fehlerfortpflanzung auswerten", "Volume Measurement with Error Propagation"],
    ["Durchmesser mit Schieblehre, Querschnittsfläche mit Fehlerfortpflanzung und drei Volumenergebnisse gewichtet mitteln. Kostenlose Vorlage im Browser.", "Caliper diameter, cross-section with error propagation and three volume results combined by weighted mean. Free template in your browser."]],
  ["p3", "elastizitaet", "elasticity", ["Elastizitätsmodul aus Belastung und Entlastung", "Young's Modulus from Loading and Unloading a Wire"],
    ["Stahldraht belasten und entlasten: Steigungen vergleichen und den Elastizitätsmodul E mit Unsicherheit bestimmen. Kostenlose Vorlage im Browser.", "Load and unload a steel wire: compare the slopes and find Young's modulus E with uncertainty. Free template in your browser, no signup."]],
  ["p4", "oberflaechenspannung", "surface-tension", ["Oberflächenspannung (Kapillarmethode) auswerten", "Evaluate Surface Tension by the Capillary Method"],
    ["Steighöhe gegen 1/r plotten und die Oberflächenspannung σ aus der Steigung bestimmen. Kostenlose Vorlage mit Fehlerbalken, direkt im Browser.", "Plot rise height against 1/r and find the surface tension σ from the slope. Free template with error bars, right in your browser."]],
  ["p5a", "polarimetrie", "polarimetry", ["Polarimetrie: spezifische Drehung aus der Steigung", "Polarimetry: Specific Rotation from the Slope"],
    ["Drehwinkel gegen Schichtdicke mal Konzentration plotten; die Steigung ist die spezifische Drehung. Kostenlose Vorlage, direkt im Browser.", "Plot the rotation angle against path length times concentration; the slope is the specific rotation. Free template in your browser."]],
  ["p5b", "newtonsche-ringe", "newtons-rings", ["Newtonsche Ringe: Krümmungsradius der Linse", "Newton's Rings: Radius of Curvature of a Lens"],
    ["Ringdurchmesser auswerten: Aus r² gegen k folgt der Krümmungsradius R der Linse mit Unsicherheit. Kostenlose Vorlage, direkt im Browser.", "Evaluate ring diameters: r² against k gives the radius of curvature R of the lens with uncertainty. Free template in your browser."]],
  ["p6a", "wheatstone-bruecke", "wheatstone-bridge", ["Wheatstone-Brücke: Widerstand mit Unsicherheit", "Wheatstone Bridge: Resistance with Uncertainty"],
    ["Unbekannten Widerstand aus drei Brückenabgleichen berechnen, gewichtet mitteln und mit dem Nennwert vergleichen. Kostenlose Vorlage im Browser.", "Calculate an unknown resistance from three bridge balances, take the weighted mean and compare it with the rating. Free template."]],
  ["p6b", "gitter", "diffraction-grating", ["Beugung am Gitter: Wellenlänge des Lasers", "Diffraction Grating: Wavelength of a Laser"],
    ["Beugung am Gitter auswerten: Wellenlänge des Lasers aus den Maxima berechnen und mit dem Literaturwert vergleichen. Kostenlose Vorlage im Browser.", "Evaluate diffraction at a grating: calculate the laser wavelength from the maxima and compare it with the literature value. Free template."]],
  ["p7", "refraktometer", "refractometer", ["Refraktometer: Eichgerade und unbekannte Proben", "Refractometer: Calibration Line, Unknown Samples"],
    ["Eichgerade aus Brechungsindex und Konzentration anlegen und die Konzentration unbekannter Proben mit Unsicherheit ablesen. Kostenlose Vorlage.", "Build a calibration line from refractive index and concentration and read off unknown samples with uncertainty. Free template in your browser."]],
  ["p8a", "radioaktivitaet-zaehlraten", "radioactivity-count-rates", ["Zählraten: Poisson oder Gauß mit χ²-Test", "Count Rates: Poisson or Gaussian with χ² Test"],
    ["Zählraten prüfen: Passt die Verteilung zu Poisson oder Gauß? χ²-Test bei 5 % Niveau. Kostenlose Vorlage, direkt im Browser, ohne Anmeldung.", "Check count rates: does the distribution fit Poisson or Gaussian? χ² test at the 5 % level. Free template in your browser, no signup."]],
  ["p8b", "radioaktivitaet-zerfallskurve", "radioactivity-decay-curve", ["Zerfallskurve halblogarithmisch plotten und fitten", "Radioactive Decay Curve on a Semi-Log Axis"],
    ["Zerfallskurve mit Fehlerbalken auf halblogarithmischer Achse plotten, sodass der Zerfall zur Geraden wird. Kostenlose Vorlage im Browser.", "Plot a decay curve with error bars on a semi-log axis so the decay becomes a straight line. Free template in your browser."]],
  ["p9", "pendel", "pendulum", ["Fadenpendel: Fallbeschleunigung g bestimmen", "String Pendulum: Determine the Acceleration g"],
    ["Fadenpendel auswerten: g aus jeder Zeile mit Konfidenzintervall und aus der Steigung von T² gegen l. Kostenlose Vorlage, direkt im Browser.", "Evaluate a string pendulum: g from each row with a confidence interval and from the slope of T² against l. Free template in your browser."]],
];
const HOME = {
  de: { title: "Messdaten auswerten und plotten: Ausgleichsgerade", desc: "Kostenloses Werkzeug für Praktikumsdaten: Messwerte einfügen, Ausgleichsgerade mit Fehlerbalken fitten, Ergebnis als (Wert ± u) Einheit runden. Im Browser." },
  en: { title: "Plot and Analyse Lab Data: Fit Line, Error Bars", desc: "Free tool for lab data: paste measurements, fit a line with error bars and get the result as (value ± u) unit, correctly rounded. In your browser." },
};

// ---- helpers
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escA = s => esc(s).replace(/"/g, "&quot;");
const OTHER = { de: "en", en: "de" };
const idLang = l => l === "de" ? "de_DE" : "en_US";
const expPath = (l, i) => l === "de" ? `/versuche/${EXP[i][1]}/` : `/en/experiments/${EXP[i][2]}/`;
const hubPath = l => l === "de" ? "/versuche/" : "/en/experiments/";
const methodPath = l => l === "de" ? "/methode/" : "/en/method/";
const homePath = l => l === "de" ? "/" : "/en/";
const T = (key, lang) => TEXTS[key][lang];

// Fills every fixed text of a page from i18n.js (data-i18n = text, data-i18n-aria = aria-label), like the browser does at run time.
export function applyI18n(html, lang) {
  html = html.replace(/(<([a-z][a-z0-9]*)\b[^>]*?\sdata-i18n="([^"]+)"[^>]*>)([\s\S]*?)(<\/\2>)/g, (m, open, tag, key, _old, close) => {
    if (!TEXTS[key]) throw new Error("unknown text key " + key);
    return open + esc(T(key, lang)) + close;
  });
  return html.replace(/<[a-z][^>]*\sdata-i18n-aria="([^"]+)"[^>]*>/g, (m, key) => {
    if (!TEXTS[key]) throw new Error("unknown text key " + key);
    const v = ` aria-label="${escA(T(key, lang))}"`;
    return /\saria-label="/.test(m) ? m.replace(/\saria-label="[^"]*"/, v) : m.replace(/^<[a-z][a-z0-9]*/, s => s + v);
  });
}

function page(o) { return o; } // {lang, path, title, desc, alt:{de,en}, jsonld:[], index:true}
function seoHead(p) {
  const url = SITE + p.path, t = `${p.title} | ${BRAND}`, o = OTHER[p.lang];
  const line = s => "  " + s;
  return [
    `<title>${esc(t)}</title>`,
    `<meta name="description" content="${escA(p.desc)}">`,
    p.index === false ? `<meta name="robots" content="noindex, follow">` : `<meta name="robots" content="index, follow, max-image-preview:large">`,
    `<link rel="canonical" href="${url}">`,
    ...(p.alt ? [`<link rel="alternate" hreflang="de" href="${SITE + p.alt.de}">`, `<link rel="alternate" hreflang="en" href="${SITE + p.alt.en}">`, `<link rel="alternate" hreflang="x-default" href="${SITE + p.alt.de}">`] : []),
    `<meta property="og:type" content="website">`, `<meta property="og:site_name" content="${BRAND}">`,
    `<meta property="og:title" content="${escA(t)}">`, `<meta property="og:description" content="${escA(p.desc)}">`, `<meta property="og:url" content="${url}">`,
    `<meta property="og:locale" content="${idLang(p.lang)}">`, `<meta property="og:locale:alternate" content="${idLang(o)}">`,
    `<meta property="og:image" content="${SITE}/og.png">`, `<meta property="og:image:width" content="1200">`, `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="${escA(p.lang === "de" ? "PlotLab: Ausgleichsgerade mit Fehlerbalken und Ergebnis" : "PlotLab: fit line with error bars and result")}">`,
    `<meta name="twitter:card" content="summary_large_image">`, `<meta name="twitter:title" content="${escA(t)}">`, `<meta name="twitter:description" content="${escA(p.desc)}">`, `<meta name="twitter:image" content="${SITE}/og.png">`,
    `<meta name="theme-color" content="#4F46E5">`,
    `<link rel="icon" type="image/jpeg" href="/favicon.jpg">`,
    `<link rel="preload" href="/fonts/source-sans-3-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>`,
    `<link rel="preload" href="/fonts/barlow-latin-700-normal.woff2" as="font" type="font/woff2" crossorigin>`,
    `<link rel="stylesheet" href="/home.css">`,
    ...(p.jsonld || []).map(j => `<script type="application/ld+json">${JSON.stringify(j)}</script>`),
  ].map(line).join("\n").trimStart().replace(/^/, "");
}
function langSwitch(p) {
  const a = (l, label) => `<a href="${p.alt[l]}" hreflang="${l}" lang="${l}" data-home-lang="${l}"${p.lang === l ? ' aria-current="true"' : ""}>${label}</a>`;
  return `<a class="proof" href="/pruefung.html">${W[p.lang].proof}</a><span class="lang" role="navigation" aria-label="${escA(W[p.lang].sw)}">${a("de", "DE")}${a("en", "EN")}</span>`;
}
const crumbsJson = (lang, items) => ({ "@type": "BreadcrumbList", itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: SITE + path })) });
const faqHtml = lang => FAQ[lang].map(([q, a]) => `    <details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("\n");

function shell(p, main) {
  const l = p.lang;
  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${seoHead(p)}
</head>
<body>
<header><a class="brand" href="${homePath(l)}"><img src="/logo.jpg" alt="" width="40" height="40">${BRAND}</a>${langSwitch(p)}</header>
<main class="page">
${main}
</main>
<footer>${esc(T("foot", l))}</footer>
<script>try{if(localStorage.getItem("plotlab-consent")!=="0")localStorage.setItem("plotlab-lang","${l}")}catch(e){}</script>
</body>
</html>
`;
}

// ---- the pages
const out = new Map();
const pages = []; // {path, lang, alt, title, desc} for the sitemap and llms.txt

function homeJson(lang, path) {
  const f = FACTS[lang];
  return [{ "@context": "https://schema.org", "@graph": [
    { "@type": "WebSite", "@id": SITE + "/#website", url: SITE + "/", name: BRAND, description: f.what, inLanguage: ["de", "en"] },
    { "@type": "WebApplication", "@id": SITE + "/#app", name: BRAND, url: SITE + path, description: `${f.what} ${f.price}`, applicationCategory: "EducationalApplication",
      operatingSystem: "Any (web browser)", isAccessibleForFree: true, inLanguage: ["de", "en"], offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" }, featureList: f.fits },
    { "@type": "FAQPage", mainEntity: FAQ[lang].map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  ] }];
}

// home: German file is edited in place; English is the same file with English texts
{
  const src = readFileSync(resolve(APP, "index.html"), "utf8");
  for (const lang of ["de", "en"]) {
    const path = homePath(lang), alt = { de: "/", en: "/en/" };
    const p = page({ lang, path, alt, title: HOME[lang].title, desc: HOME[lang].desc, jsonld: homeJson(lang, path) });
    let h = applyI18n(src, lang).replace(/<html lang="\w+">/, `<html lang="${lang}">`);
    h = h.replace(/<!--seo:start-->[\s\S]*?<!--seo:end-->/, `<!--seo:start-->\n  ${seoHead(p)}\n<!--seo:end-->`);
    h = h.replace(/(?:<a class="proof"[^>]*>[^<]*<\/a>)?<span class="lang"[\s\S]*?<\/span>/, langSwitch(p));
    h = h.replace(/<!--faq:start-->[\s\S]*?<!--faq:end-->/, `<!--faq:start-->\n${faqHtml(lang)}\n<!--faq:end-->`);
    out.set(lang === "de" ? "index.html" : "en/index.html", h);
    pages.push({ path, lang, alt, title: HOME[lang].title, desc: HOME[lang].desc });
  }
}

// hub + experiments + method
for (const lang of ["de", "en"]) {
  const w = W[lang], k = lang === "de" ? 0 : 1;
  const alt = (dePath, enPath) => ({ de: dePath, en: enPath });
  // hub
  {
    const path = hubPath(lang), a = alt(hubPath("de"), hubPath("en"));
    const p = page({ lang, path, alt: a, title: w.hubTitle, desc: w.hubDesc,
      jsonld: [{ "@context": "https://schema.org", "@graph": [{ "@type": "CollectionPage", name: w.hubTitle, description: w.hubDesc, url: SITE + path, inLanguage: lang, isPartOf: { "@id": SITE + "/#website" } }, crumbsJson(lang, [[BRAND, homePath(lang)], [w.crumbHub, path]])] }] });
    const items = EXP.map((e, i) => `  <li><a href="${expPath(lang, i)}"><strong>${esc(e[3][k])}</strong><span>${esc(T("home_" + e[0], lang))}</span></a></li>`).join("\n");
    out.set(path.slice(1) + "index.html", shell(p, `<nav class="crumbs" aria-label="${w.crumbs}"><a href="${homePath(lang)}">${BRAND}</a> › ${esc(w.crumbHub)}</nav>\n<h1>${esc(w.hubH1)}</h1>\n<p class="answer">${esc(w.hubLead)}</p>\n<ul class="links">\n${items}\n</ul>`));
    pages.push({ path, lang, alt: a, title: w.hubTitle, desc: w.hubDesc });
  }
  // experiments
  EXP.forEach((e, i) => {
    const id = e[0], path = expPath(lang, i), a = alt(expPath("de", i), expPath("en", i)), title = e[3][k], desc = e[4][k];
    const steps = Object.keys(TEXTS).filter(key => new RegExp(`^tpl_${id}_s\\d+$`).test(key)).sort((x, y) => +x.split("_s")[1] - +y.split("_s")[1]);
    const p = page({ lang, path, alt: a, title, desc,
      jsonld: [{ "@context": "https://schema.org", "@graph": [{ "@type": "WebPage", name: title, description: desc, url: SITE + path, inLanguage: lang, isPartOf: { "@id": SITE + "/#website" } }, crumbsJson(lang, [[BRAND, homePath(lang)], [w.crumbHub, hubPath(lang)], [title, path]])] }] });
    out.set(path.slice(1) + "index.html", shell(p, [
      `<nav class="crumbs" aria-label="${w.crumbs}"><a href="${homePath(lang)}">${BRAND}</a> › <a href="${hubPath(lang)}">${esc(w.crumbHub)}</a></nav>`,
      `<h1>${esc(title)}</h1>`, `<p class="answer">${esc(T(`tpl_${id}_note`, lang))}</p>`,
      `<h2>${esc(w.how)}</h2>`, `<ol>\n${steps.map(s => `  <li>${esc(T(s, lang))}</li>`).join("\n")}\n</ol>`,
      `<p class="sub">${esc(w.invented)}</p>`,
      `<p><a class="btn" href="/app.html?start=${id}">${esc(w.open)}</a> <a class="btn alt" href="${hubPath(lang)}">${esc(w.all)}</a></p>`,
    ].join("\n")));
    pages.push({ path, lang, alt: a, title, desc });
  });
  // method
  {
    const path = methodPath(lang), a = alt(methodPath("de"), methodPath("en"));
    const p = page({ lang, path, alt: a, title: w.mTitle, desc: w.mDesc,
      jsonld: [{ "@context": "https://schema.org", "@graph": [{ "@type": "WebPage", name: w.mTitle, description: w.mDesc, url: SITE + path, inLanguage: lang, isPartOf: { "@id": SITE + "/#website" } }, crumbsJson(lang, [[BRAND, homePath(lang)], [w.mH1, path]])] }] });
    out.set(path.slice(1) + "index.html", shell(p, [
      `<nav class="crumbs" aria-label="${w.crumbs}"><a href="${homePath(lang)}">${BRAND}</a> › ${esc(w.mH1)}</nav>`,
      `<h1>${esc(w.mH1)}</h1>`, `<p class="answer">${esc(w.mLead)}</p>`,
      `<ul>\n${w.mItems.map(s => `  <li>${esc(s)}</li>`).join("\n")}\n</ul>`, `<p class="sub">${esc(w.mNot)}</p>`,
      `<p><a class="btn" href="${homePath(lang)}">${esc(w.home)}</a></p>`,
    ].join("\n")));
    pages.push({ path, lang, alt: a, title: w.mTitle, desc: w.mDesc });
  }
}

// sitemap: every page that may be indexed, with its language partner
out.set("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${pages.map(p => `  <url>
    <loc>${SITE}${p.path}</loc>
    <lastmod>${LASTMOD}</lastmod>
    <xhtml:link rel="alternate" hreflang="de" href="${SITE}${p.alt.de}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${SITE}${p.alt.en}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${p.alt.de}"/>
  </url>`).join("\n")}
</urlset>
`);

// llms.txt: what an AI assistant needs to describe PlotLab correctly, from the same fact sheet
{
  const f = FACTS.en, g = FACTS.de, u = path => SITE + path;
  out.set("llms.txt", `# ${BRAND}

> ${f.what} ${f.price} ${f.langs}

${f.who} ${f.privacy}

## Facts
- Price: free. No account, no install. Works in a current web browser.
- Languages: German (default) and English, as separate pages.
- Fits: ${f.fits}
- Results: ${f.round}
- Checks: ${f.nist}
- Examples: the numbers in the experiment templates are invented.
- Not affiliated with any university.

## Pages
- [Home, German](${u("/")}): ${HOME.de.desc}
- [Home, English](${u("/en/")}): ${HOME.en.desc}
- [Experiment templates, German](${u("/versuche/")}): ${W.de.hubDesc}
- [Experiment templates, English](${u("/en/experiments/")}): ${W.en.hubDesc}
- [Methods and checks, German](${u("/methode/")}): ${W.de.mDesc}
- [Methods and checks, English](${u("/en/method/")}): ${W.en.mDesc}

## Experiment templates (English pages)
${EXP.map((e, i) => `- [${e[3][1]}](${u(expPath("en", i))}): ${e[4][1]}`).join("\n")}

## Auf Deutsch
${g.what} ${g.price} ${g.who} ${g.privacy}
`);
}

// ---- write or check
let bad = 0;
for (const [rel, content] of out) {
  const file = resolve(APP, rel);
  if (process.argv.includes("--check")) {
    if (!existsSync(file) || readFileSync(file, "utf8") !== content) { console.log("OUT OF DATE: app/" + rel); bad++; }
  } else { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, content); }
}
if (process.argv.includes("--check")) { console.log(bad ? `${bad} generated file(s) out of date: run node scripts/build-pages.mjs` : `all ${out.size} generated files are current`); process.exit(bad ? 1 : 0); }
else console.log(`wrote ${out.size} files`);
