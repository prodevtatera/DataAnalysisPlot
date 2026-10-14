// Mean, standard deviation (divisor n or n-1), standard error and random + instrument error in quadrature (P1, P2).
// ddof 1: s = √(Σ(x-x̄)²/(n-1)); ddof 0: σ = √(Σ(x-x̄)²/n). The standard error of the mean is always s(n-1)/√n:
// the divisor chosen for the standard deviation does not change the uncertainty of the mean.
// instr (optional): reading error of the instrument, same unit as the values; u_ges = √(sem² + instr²).
function describe(values, ddof, instr) {
  const n = values.length, mean = values.reduce((a, v) => a + v, 0) / n;
  const ss = values.reduce((a, v) => a + (v - mean) ** 2, 0), sem = Math.sqrt(ss / (n - 1) / n);
  return { n, mean, s: Math.sqrt(ss / (n - ddof)), sem, uTotal: instr == null ? null : Math.sqrt(sem * sem + instr * instr) };
}
if (typeof module !== "undefined") module.exports = { describe };
