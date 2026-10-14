# Independent hand calculation for tests/phase2-step15-templates.mjs (template projects P1 to P5). No SciPy, no app code.
# Exact fractions; weighted straight line as in Bevington & Robinson ch. 6; Gaussian propagation worked out by hand in each comment.
# Run: python3 -I tests/reference/templates.py   The printed numbers are the ones pasted into the test.
from fractions import Fraction as F
from math import sqrt, pi, floor, log10

def fl(x): return float(x)
def hu(v, u):
    """HU rule: u to 1 significant digit (2 if that digit is 1 or 2), value to the same decimal place. Returns the German text."""
    u = float(u); e = floor(log10(u)); lead = int(round(u / 10 ** e, 9))
    if int(u / 10 ** e + 1e-9) in (1, 2): e -= 1
    dec = max(0, -e); ur = round(u, dec); vr = round(float(v), dec)
    return f"({vr:.{dec}f} ± {ur:.{dec}f})".replace(".", ",")

def line(x, y, s):
    x = [F(v) for v in x]; y = [F(v) for v in y]; w = [1 / F(v) ** 2 for v in s]
    Sw = sum(w); xb = sum(a * b for a, b in zip(w, x)) / Sw; yb = sum(a * b for a, b in zip(w, y)) / Sw
    Sxx = sum(a * (b - xb) ** 2 for a, b in zip(w, x)); Sxy = sum(a * (b - xb) * (c - yb) for a, b, c in zip(w, x, y))
    a = Sxy / Sxx; b = yb - a * xb
    chi2 = sum(wi * (yi - a * xi - b) ** 2 for wi, xi, yi in zip(w, x, y)); dof = len(x) - 2
    k = sqrt(chi2 / dof)                      # scale factor sqrt(chi2/DoF)
    ua = sqrt(1 / Sxx); ub = sqrt(1 / Sw + xb ** 2 / Sxx)
    return dict(a=fl(a), b=fl(b), ua0=ua, ub0=ub, ua=ua * k, ub=ub * k, chi2=fl(chi2), dof=dof, k=k)

def show(name, r):
    print(f"{name}: a = {r['a']:.9g}  u(a) scaled {r['ua']:.9g}  unscaled {r['ua0']:.9g};  b = {r['b']:.9g}  u(b) scaled {r['ub']:.9g}  unscaled {r['ub0']:.9g};  chi2/DoF = {r['chi2']/r['dof']:.6g}")
    print("   a =", hu(r['a'], r['ua']), "  b =", hu(r['b'], r['ub']))

print("== P1: 30 readings l / mm")
vals = [F(v) for v in "9.5 9.6 9.7 9.7 9.8 9.8 9.8 9.9 9.9 9.9 10.0 10.0 10.0 10.0 10.05 10.05 10.1 10.1 10.1 10.2 10.2 10.2 10.2 10.2 10.3 10.3 10.4 10.4 10.5 10.6".split()]
n = len(vals); mean = sum(vals) / n; ss = sum((v - mean) ** 2 for v in vals); s = sqrt(ss / (n - 1)); sem = s / sqrt(n)
counts = [0] * 6
for v in vals: counts[int((v - F("9.5")) // F("0.2"))] += 1
print("n", n, "mean", fl(mean), "s(n-1)", s, "sem", sem, "->", hu(mean, sem), "counts", counts)

print("== P2: d readings (5), caliper error 0,05 mm; cross-section A = pi (d/2)^2, u(A) = pi d/2 * u(d); 3 volumes")
d = [F(v) for v in "20.02 20.00 19.98 20.01 19.99".split()]
m = sum(d) / 5; sd = sqrt(sum((v - m) ** 2 for v in d) / 4); sem = sd / sqrt(5); ut = sqrt(sem ** 2 + 0.05 ** 2)
print("mean d", fl(m), "s", sd, "sem", sem, "->", hu(m, sem), " with instrument error: u =", ut, "->", hu(m, ut))
print("row 1: A =", pi * (20.02 / 2) ** 2, " u(A) =", pi * 20.02 / 2 * 0.05)
V = [F("10.3"), F("10.5"), F("9.9")]; U = [F("0.2"), F("0.3"), F("0.1")]
w = [1 / u ** 2 for u in U]; Vm = sum(a * b for a, b in zip(w, V)) / sum(w); uV = sqrt(1 / sum(w))
print("weighted mean", fl(Vm), "u", uV, "->", hu(Vm, uV), "; gaps k=1: rows 1/3", fl(abs(V[0] - V[2]) - (U[0] + U[2])), "rows 2/3", fl(abs(V[1] - V[2]) - (U[1] + U[2])), "rows 1/2", fl(abs(V[0] - V[1]) - (U[0] + U[1])))

print("== P3: loading and unloading; E = 4 L / (pi d^2 a), L = 1 +- 0,002 m, d = 0,5 +- 0,01 mm; a in mm/N gives GPa")
F_ = [10, 20, 30, 40, 50, 60]
up = line(F_, ["0.26", "0.50", "0.77", "1.03", "1.28", "1.51"], ["0.02"] * 6); show("loading", up)
dn = line(F_, ["0.30", "0.55", "0.81", "1.05", "1.31", "1.54"], ["0.02", "0.02", "0.02", "0.04", "0.04", "0.04"]); show("unloading", dn)
for nm, key in (("scaled", "ua"), ("unscaled", "ua0")):
    z = abs(up["a"] - dn["a"]) / sqrt(up[key] ** 2 + dn[key] ** 2)
    print(f"   difference of slopes {up['a']-dn['a']:.9g} +- {sqrt(up[key]**2+dn[key]**2):.9g} = {z:.4f} combined uncertainties ({nm})", hu(up['a'] - dn['a'], sqrt(up[key] ** 2 + dn[key] ** 2)))
E = 4 * 1 / (pi * 0.5 ** 2 * up["a"])
for nm, key in (("scaled", "ua"), ("unscaled", "ua0")):
    rel = sqrt((0.002 / 1) ** 2 + (2 * 0.01 / 0.5) ** 2 + (up[key] / up["a"]) ** 2)
    print(f"   E = {E:.9g} GPa, u {nm} = {E*rel:.9g}", hu(E, E * rel))

print("== P4: capillary rise h = (2 sigma / (rho g)) * (1/r); fit h against 1/r; sigma = a rho g / 2; rho = 998 +- 1 kg/m3, g = 9,81")
r = [F("0.5"), F("0.75"), F("1"), F("1.25"), F("1.5"), F("2")]; h = ["29.6", "19.9", "14.8", "11.8", "10.0", "7.4"]; sh = ["0.4", "0.3", "0.3", "0.2", "0.2", "0.2"]
p4 = line([1 / q for q in r], h, sh); show("h(1/r)", p4)
# a in mm^2 -> m^2 (1e-6), sigma in N/m -> mN/m (1e3): sigma[mN/m] = a * rho * g / 2000.  du = |d/da| ua, |d/drho| urho.
for nm, key in (("scaled", "ua"), ("unscaled", "ua0")):
    sg = p4["a"] * 998 * 9.81 / 2000; us = sqrt((998 * 9.81 / 2000 * p4[key]) ** 2 + (p4["a"] * 9.81 / 2000 * 1) ** 2)
    print(f"   sigma = {sg:.9g} mN/m, u {nm} = {us:.9g}", hu(sg, us))

print("== P5a: polarimetry alpha = [alpha] * (d c); a = specific rotation")
dd = [F(v) for v in "1 1 2 2 2 2".split()]; cc = [F(v) for v in "0.05 0.10 0.05 0.10 0.15 0.20".split()]
p5a = line([a * b for a, b in zip(dd, cc)], ["3.3", "6.6", "6.7", "13.2", "20.1", "26.5"], ["0.2", "0.2", "0.2", "0.3", "0.3", "0.4"]); show("alpha(d c)", p5a)

print("== P5b: Newton's rings, r^2 = (D/2)^2 against ring number k; slope a = lambda R; R = a * 1000 / lam (a in mm^2, lam in nm, R in m)")
k = list(range(1, 9)); D = [F(v) for v in "1.54 2.17 2.66 3.07 3.44 3.76 4.06 4.34".split()]
r2 = [(q / 2) ** 2 for q in D]; ur2 = [(q / 2) * F("0.02") for q in D]       # u(r^2) = (D/2) u(D)
p5b = line(k, r2, ur2); show("r2(k)", p5b)
print("   row 1: r2 =", fl(r2[0]), " u(r2) =", fl(ur2[0]))
for nm, key in (("scaled", "ua"), ("unscaled", "ua0")):
    R = p5b["a"] * 1000 / 589.3; uR = sqrt((1000 / 589.3 * p5b[key]) ** 2 + (p5b["a"] * 1000 / 589.3 ** 2 * 0.1) ** 2)
    print(f"   R = {R:.9g} m, u {nm} = {uR:.9g}", hu(R, uR))
