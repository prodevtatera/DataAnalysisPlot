# Independent hand calculation (exact fractions) for tests/phase2-step9-calibration.mjs: calibration line (refractometer, P7) and an unknown read off.
# Run: python3 tests/reference/calibration.py
# Weighted line fit as in Taylor, "An Introduction to Error Analysis", ch. 8 (w = 1/s^2), with the covariance of a and b = -Sx / D (D = Sw*Sxx - Sx^2).
# Unknown: x0 = (y0 - b)/a. Propagation of u(y0), u(a), u(b) and cov(a,b):
#   u(x0)^2 = (1/a^2) * (u(y0)^2 + x0^2 u(a)^2 + u(b)^2 + 2 x0 cov(a,b))
# Second route for the UNWEIGHTED case, the classic inverse-regression formula (Miller & Miller, "Statistics and Chemometrics for Analytical Chemistry"):
#   u(x0)^2 = (u(y0)^2 + s^2 (1/n + (x0 - xbar)^2 / Sxx)) / a^2   with s^2 = SSR/(n-2)
from fractions import Fraction as F
from math import sqrt
x = [F(v) for v in (0, 2, 4, 6, 8, 10)]
y = [F(v) for v in ("1.3331", "1.3358", "1.3389", "1.3416", "1.3445", "1.3474")]
s = [F(v) for v in ("0.0002", "0.0002", "0.0002", "0.0004", "0.0004", "0.0004")]
y0, u0 = F("1.3405"), F("0.0003")

def wfit(x, y, s):
    w = [1 / q**2 for q in s]; S = sum
    Sw, Sx, Sy = S(w), S(a * b for a, b in zip(w, x)), S(a * b for a, b in zip(w, y))
    Sxx, Sxy = S(a * b * b for a, b in zip(w, x)), S(a * b * c for a, b, c in zip(w, x, y))
    D = Sw * Sxx - Sx**2
    a, b = (Sw * Sxy - Sx * Sy) / D, (Sxx * Sy - Sx * Sxy) / D
    chi2 = S(wi * (yi - a * xi - b) ** 2 for wi, xi, yi in zip(w, x, y)); dof = len(x) - 2
    var_a, var_b, cov = Sw / D, Sxx / D, -Sx / D          # unscaled (known errors)
    return a, b, var_a, var_b, cov, chi2, dof

def read_off(a, b, va, vb, cov, y0, u0):
    x0 = (y0 - b) / a
    with_cov = sqrt(float((u0**2 + x0**2 * va + vb + 2 * x0 * cov) / a**2))
    indep = sqrt(float((u0**2 + x0**2 * va + vb) / a**2))
    return float(x0), with_cov, indep

a, b, va, vb, cov, chi2, dof = wfit(x, y, s)
k = chi2 / dof                                            # scaling of the covariance matrix by chi2/DoF
print("weighted: a", float(a), "b", float(b), "chi2", float(chi2), "dof", dof, "chi2/dof", float(k))
print("  unscaled u(a)", sqrt(float(va)), "u(b)", sqrt(float(vb)), "cov", float(cov))
print("  scaled   u(a)", sqrt(float(va * k)), "u(b)", sqrt(float(vb * k)), "cov", float(cov * k))
print("  unscaled x0, u with cov, u independent:", *read_off(a, b, va, vb, cov, y0, u0))
print("  scaled   x0, u with cov, u independent:", *read_off(a, b, va * k, vb * k, cov * k, y0, u0))
# several unknowns at once
for yy, uu in ((F("1.3405"), F("0.0003")), (F("1.3372"), F("0.0002")), (F("1.3490"), F("0.0003"))):
    print("  y0", float(yy), "scaled:", *read_off(a, b, va * k, vb * k, cov * k, yy, uu))

# unweighted (ordinary least squares), all 6 points
n = len(x); mx = sum(x) / n; my = sum(y) / n; sxx = sum((v - mx) ** 2 for v in x); sxy = sum((v - mx) * (w - my) for v, w in zip(x, y))
a0 = sxy / sxx; b0 = my - a0 * mx; ssr = sum((w - a0 * v - b0) ** 2 for v, w in zip(x, y)); s2 = ssr / (n - 2)
va0, vb0, cov0 = s2 / sxx, s2 * (1 / F(n) + mx**2 / sxx), -s2 * mx / sxx
print("unweighted: a", float(a0), "b", float(b0), "ssr", float(ssr), "u(a)", sqrt(float(va0)), "u(b)", sqrt(float(vb0)), "cov", float(cov0))
x0, uc, ui = read_off(a0, b0, va0, vb0, cov0, y0, u0)
print("  x0", x0, "u with cov", uc, "u independent", ui)
# classic inverse-regression formula (second route)
x0f = (y0 - b0) / a0
print("  classic formula u", sqrt(float((u0**2 + s2 * (1 / F(n) + (x0f - mx) ** 2 / sxx)) / a0**2)))
# Extrapolation: an unknown above the last standard (x = 10)
yo = F("1.3600"); print("  outside range: x0", float((yo - b0) / a0))
