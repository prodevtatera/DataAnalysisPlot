// Builds app/validation-data.json for the "Geprüft" page (app/pruefung.html) from the NIST StRD files in tests/nist/.
// Certified values, data and start values are copied from the NIST files, never taken from the app's own maths.
// Run: node scripts/make-validation.mjs   (tests/phase6-validation.mjs regenerates it and fails if the committed file differs)
import { readFileSync, writeFileSync } from "node:fs";

const num = s => Number(s.replace(/[DE]/i, "e"));
const rows = L => L.slice(L.findIndex(l => /^Data:\s+y\s+x/.test(l)) + 1).filter(l => l.trim()).map(l => l.trim().split(/\s+/).map(num));
function nls(file) {
  const txt = readFileSync(`tests/nist/${file}.dat`, "utf8"), L = txt.split("\n"), pts = rows(L);
  const par = L.filter(l => /^\s*b\d\s*=/.test(l)).map(l => l.split("=")[1].trim().split(/\s+/).map(num));
  return { start2: par.map(r => r[1]), cert: par.map(r => [r[2], r[3]]), ssr: num(/Residual Sum of Squares:\s+(\S+)/.exec(txt)[1]),
    dof: Number(/Degrees of Freedom:\s+(\d+)/.exec(txt)[1]), x: pts.map(r => r[1]), y: pts.map(r => r[0]) };
}
function lls(file) {
  const L = readFileSync(`tests/nist/${file}.dat`, "utf8").split("\n"), pts = rows(L);
  const cert = L.filter(l => /^\s*B\d\s+\S+\s+\S+/.test(l)).map(l => l.trim().split(/\s+/).slice(1, 3).map(num));
  const i = L.findIndex(l => /Residual\s*$/.test(l));
  return { cert, sd: num(/Standard Deviation\s+(\S+)/.exec(L[i + 1])[1]), dof: pts.length - cert.length, x: pts.map(r => r[1]), y: pts.map(r => r[0]) };
}

// level = NIST's own rating. model "line" is the straight-line fit students use; "poly" and "free" are the curve fit tool.
const CASES = [
  { name: "Norris", kind: "lls", level: "lower", model: "line", use: "Eichgerade (Ozonmessgerät)" },
  { name: "Pontius", kind: "lls", level: "lower", model: "poly", degree: 2 },
  { name: "Wampler1", kind: "lls", level: "higher", model: "poly", degree: 5 },
  { name: "Wampler4", kind: "lls", level: "higher", model: "poly", degree: 5 },
  { name: "Wampler5", kind: "lls", level: "higher", model: "poly", degree: 5 },
  { name: "Misra1a", kind: "nls", level: "lower", model: "free", expr: "b1*(1-exp(-b2*x))" },
  { name: "Misra1d", kind: "nls", level: "average", model: "free", expr: "b1*b2*x*((1+b2*x)^(-1))" },
  { name: "BoxBOD", kind: "nls", level: "higher", model: "free", expr: "b1*(1-exp(-b2*x))" },
  { name: "Eckerle4", kind: "nls", level: "higher", model: "free", expr: "(b1/b2)*exp(-0,5*((x-b3)/b2)^2)" },
  { name: "Lanczos3", kind: "nls", level: "lower", model: "free", expr: "b1*exp(-b2*x) + b3*exp(-b4*x) + b5*exp(-b6*x)" },
  { name: "Gauss1", kind: "nls", level: "lower", model: "free", expr: "b1*exp(-b2*x) + b3*exp(-(x-b4)^2/b5^2) + b6*exp(-(x-b7)^2/b8^2)" },
  { name: "ENSO", kind: "nls", level: "average", model: "free", expr: "b1 + b2*cos(2*pi*x/12) + b3*sin(2*pi*x/12) + b5*cos(2*pi*x/b4) + b6*sin(2*pi*x/b4) + b8*cos(2*pi*x/b7) + b9*sin(2*pi*x/b7)" },
];
const out = CASES.map(c => ({ ...c, ...(c.kind === "nls" ? nls(c.name) : lls(c.name)) }));
writeFileSync("app/validation-data.json", JSON.stringify(out));
console.log(`app/validation-data.json: ${out.length} datasets`);
