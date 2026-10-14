# Independent hand calculation (exact fractions) for tests/phase2-step8-series.mjs: P3 loading and unloading, weighted line fits and slope comparison.
# Run: python3 tests/reference/series_fit.py. Formulas: Taylor, "An Introduction to Error Analysis", ch. 8 (weights w = 1/s^2).
from fractions import Fraction as F
from math import sqrt
x = [F(v) for v in (10, 20, 30, 40, 50, 60)]
auf = [F(v) for v in ("0.26", "0.50", "0.77", "1.03", "1.28", "1.51")]; s_auf = [F("0.02")] * 6
ab = [F(v) for v in ("0.30", "0.55", "0.81", "1.05", "1.31", "1.54")]; s_ab = [F("0.02")] * 3 + [F("0.04")] * 3

def wfit(x, y, s):
    w = [1 / q**2 for q in s]; S = lambda l: sum(l)
    Sw, Sx, Sy = S(w), S(a * b for a, b in zip(w, x)), S(a * b for a, b in zip(w, y))
    Sxx, Sxy = S(a * b * b for a, b in zip(w, x)), S(a * b * c for a, b, c in zip(w, x, y))
    D = Sw * Sxx - Sx**2
    a, b = (Sw * Sxy - Sx * Sy) / D, (Sxx * Sy - Sx * Sxy) / D
    chi2 = S(wi * (yi - a * xi - b) ** 2 for wi, xi, yi in zip(w, x, y)); dof = len(x) - 2
    ua, ub = sqrt(float(Sw / D)), sqrt(float(Sxx / D)); k = sqrt(float(chi2) / dof)
    return dict(a=float(a), b=float(b), ua_unscaled=ua, ua_scaled=ua * k, ub_unscaled=ub, ub_scaled=ub * k, chi2=float(chi2), dof=dof)

def show(name, r): print(name, {k: (round(v, 12) if isinstance(v, float) else v) for k, v in r.items()})
r1, r2 = wfit(x, auf, s_auf), wfit(x, ab, s_ab)
show("auf, all 6", r1); show("ab, all 6", r2)
for nm, key in (("scaled", "ua_scaled"), ("unscaled", "ua_unscaled")):
    d = r1["a"] - r2["a"]; u = sqrt(r1[key] ** 2 + r2[key] ** 2)
    print("compare", nm, "diff", d, "u", u, "z", abs(d) / u)
# chosen x ranges: loading 10..30 (3 points) against unloading 40..60 (3 points)
r3 = wfit(x[:3], auf[:3], s_auf[:3]); r4 = wfit(x[3:], ab[3:], s_ab[3:]); show("auf, x 10..30", r3); show("ab, x 40..60", r4)
for nm, key in (("scaled", "ua_scaled"), ("unscaled", "ua_unscaled")):
    d = r3["a"] - r4["a"]; u = sqrt(r3[key] ** 2 + r4[key] ** 2); print("compare ranges", nm, "diff", d, "u", u, "z", abs(d) / u)
# loading all 6 against unloading 10..40
r5 = wfit(x[:4], ab[:4], s_ab[:4]); show("ab, x 10..40", r5)
# a clearly different unloading slope (soft material): s = 0.01 everywhere
ab2 = [F(v) for v in ("0.20", "0.38", "0.58", "0.76", "0.95", "1.13")]; s_ab2 = [F("0.01")] * 6
r6 = wfit(x, ab2, s_ab2); show("ab2, all 6", r6)
for nm, key in (("scaled", "ua_scaled"), ("unscaled", "ua_unscaled")):
    d = r1["a"] - r6["a"]; u = sqrt(r1[key] ** 2 + r6[key] ** 2); print("compare auf vs ab2", nm, "diff", d, "u", u, "z", abs(d) / u)
# unweighted (ordinary least squares) loading series, all 6 points: a = Sxy/Sxx, s^2 = SSR/(n-2), u(a) = s/sqrt(Sxx)
n = 6; mx = sum(x) / n; my = sum(auf) / n; sxx = sum((v - mx) ** 2 for v in x); sxy = sum((v - mx) * (w - my) for v, w in zip(x, auf))
a0 = sxy / sxx; b0 = my - a0 * mx; ssr = sum((w - a0 * v - b0) ** 2 for v, w in zip(x, auf))
print("auf unweighted a", float(a0), "b", float(b0), "ssr", float(ssr), "u(a)", sqrt(float(ssr / (n - 2) / sxx)))
