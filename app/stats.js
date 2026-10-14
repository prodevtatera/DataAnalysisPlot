// Mean, standard deviation (divisor n or n-1), standard error and random + instrument error in quadrature (P1, P2).
// ddof 1: s = √(Σ(x-x̄)²/(n-1)); ddof 0: σ = √(Σ(x-x̄)²/n). The standard error of the mean is always s(n-1)/√n:
// the divisor chosen for the standard deviation does not change the uncertainty of the mean.
// instr (optional): reading error of the instrument, same unit as the values; u_ges = √(sem² + instr²).
function describe(values, ddof, instr) {
  const n = values.length, mean = values.reduce((a, v) => a + v, 0) / n;
  const ss = values.reduce((a, v) => a + (v - mean) ** 2, 0), sem = Math.sqrt(ss / (n - 1) / n);
  return { n, mean, s: Math.sqrt(ss / (n - ddof)), sem, uTotal: instr == null ? null : Math.sqrt(sem * sem + instr * instr) };
}
// Weighted mean of results x±u (P2): w = 1/u², mean = Σwx/Σw, u(mean) = 1/√Σw (the uncertainties are taken as given, not scaled by χ²/DoF).
// Overlap: the intervals x±k·u all share a point (in one dimension that is the same as every pair overlapping).
// Returns bad: pairs (1-based positions in the input) whose intervals do not touch, with the gap between them.
function weightedMean(x, u, k) {
  const w = u.map(q => 1 / (q * q)), sw = w.reduce((a, v) => a + v, 0), n = x.length, bad = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const gap = Math.abs(x[i] - x[j]) - k * (u[i] + u[j]);
    if (gap > 0) bad.push({ i: i + 1, j: j + 1, gap });
  }
  return { n, mean: x.reduce((a, v, i) => a + w[i] * v, 0) / sw, u: 1 / Math.sqrt(sw), w, overlap: !bad.length, bad };
}
if (typeof module !== "undefined") module.exports = { describe, weightedMean };
