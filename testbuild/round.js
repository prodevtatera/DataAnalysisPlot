// HU rule: round u to 1 significant digit, or 2 if that digit is 1 or 2; round the value to the same decimal place.
// Returns ["value", "u"] as German strings, or null if u is not a positive finite number.
function huRound(v, u) {
  if (!(u > 0) || !isFinite(u) || !isFinite(v)) return null;
  // toExponential, not u / 10 ** e: 0,3 / 0,1 is 2,9999999999999996 in floating point and would count as leading digit 2.
  const [m, ex] = u.toExponential(11).split("e"), e = Number(ex), dig = Number(m[0]) <= 2 ? 2 : 1;
  const q = 10 ** (e - (dig - 1)), dec = Math.max(0, -(e - (dig - 1)));
  const s = n => (Math.round(n / q) * q).toFixed(dec).replace(".", ",");
  return [s(v), s(u)];
}
