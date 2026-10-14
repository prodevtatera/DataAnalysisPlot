// P3 Elasticity: Young's modulus from the slope a (mm/N) of extension against load, E = 4·L / (π·d²·a).
// L in m, d in mm: E comes out in GPa (1 m, 1 mm, 1 mm/N gives 4/π GPa). L, d and a are independent, so the
// relative uncertainties add in quadrature: (uE/E)² = (uL/L)² + (2·ud/d)² + (ua/a)².
function youngModulus({ a, ua, L, uL, d, ud }) {
  const E = 4 * L / (Math.PI * d * d * a);
  const rel = [uL / L, 2 * ud / d, ua / a];
  return { E, uE: E * Math.sqrt(rel.reduce((s, r) => s + r * r, 0)), rel };
}
if (typeof module !== "undefined") module.exports = { youngModulus };
