// HU rule: round u to 1 significant digit, or 2 if that digit is 1 or 2; round the value to the same decimal place.
// Returns ["value", "u"] as German strings, or null if u is not a positive finite number.
function huRound(v, u) {
  if (!(u > 0) || !isFinite(u) || !isFinite(v)) return null;
  const e = Math.floor(Math.log10(u)), dig = Math.floor(u / 10 ** e) <= 2 ? 2 : 1;
  const q = 10 ** (e - (dig - 1)), dec = Math.max(0, -(e - (dig - 1)));
  const s = n => (Math.round(n / q) * q).toFixed(dec).replace(".", ",");
  return [s(v), s(u)];
}
