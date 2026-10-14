# Independent hand calculation for P9: g = 4*pi^2 / a from the slope a of T^2 against l (no SciPy, no app code).
# Exact fractions, weighted straight line (Bevington & Robinson ch. 6), then u(g) = g * u(a)/a  (g ~ 1/a, so |dg/da|*u(a) = g*u(a)/a).
# Prints the numbers pasted into tests/phase2-step7-derived.mjs. Run: python3 -I tests/reference/derived_g.py
from fractions import Fraction as F
from decimal import Decimal, getcontext
getcontext().prec = 40
PI = Decimal("3.141592653589793238462643383279502884197")
def D(q): return Decimal(q.numerator) / Decimal(q.denominator)
def line(x, y, s):
    w = [1 / (F(v) ** 2) for v in s]; x = [F(v) for v in x]; y = [F(v) for v in y]
    Sw = sum(w); xb = sum(a * b for a, b in zip(w, x)) / Sw; yb = sum(a * b for a, b in zip(w, y)) / Sw
    Sxx = sum(a * (b - xb) ** 2 for a, b in zip(w, x)); Sxy = sum(a * (b - xb) * (c - yb) for a, b, c in zip(w, x, y))
    a = Sxy / Sxx; b = yb - a * xb
    chi2 = sum(wi * (yi - a * xi - b) ** 2 for wi, xi, yi in zip(w, x, y)); dof = len(x) - 2
    ub = D(1 / Sw + xb ** 2 / Sxx).sqrt()
    return a, D(1 / Sxx).sqrt(), D(chi2 / dof).sqrt(), D(b), ub   # slope, unscaled error, sqrt(chi2/dof), intercept, its unscaled error
l = ["0.25", "0.50", "0.75", "1.00", "1.25"]; T2 = ["1.02", "2.01", "3.05", "3.98", "5.03"]; s = ["0.04", "0.04", "0.05", "0.05", "0.06"]
for label, sig in (("weighted", s), ("unweighted (all sigma = 1)", ["1"] * 5)):
    a, ua, k, b, ub = line(l, T2, sig)
    a = D(a); g = 4 * PI ** 2 / a
    for name, u in (("unscaled", ua), ("scaled", ua * k)):
        print(f"{label:28} {name:9} a = {float(a):.9f}  u(a) = {float(u):.9f}  g = {float(g):.9f}  u(g) = {float(g * u / a):.9f}")
    # Also the zero crossing x0 = -b/a with a and b treated as independent: u^2 = (b/a^2 * u(a))^2 + (u(b)/a)^2
    for name, f in (("unscaled", 1), ("scaled", k)):
        x0 = -b / a; u0 = ((b / a ** 2 * ua * f) ** 2 + (ub * f / a) ** 2).sqrt()
        print(f"{label:28} {name:9} b = {float(b):.9f}  u(b) = {float(ub * f):.9f}  x0 = {float(x0):.9f}  u(x0) = {float(u0):.9f}")
