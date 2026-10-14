# Independent hand calculation for tests/phase2-step16-templates.mjs (template projects P6 to P9). No SciPy, no app code.
# Exact fractions for fits and means; Gaussian propagation worked out by hand in each comment; chi-square p-values from closed formulas.
# Run: python3 -I tests/reference/templates2.py   The printed numbers are the ones pasted into the test.
from fractions import Fraction as F
from math import sqrt, pi, floor, log10, exp, erf, erfc, factorial

def hu(v, u):
    """HU rule: u to 1 significant digit (2 if that digit is 1 or 2), value to the same decimal place. German text."""
    u = float(u); e = floor(log10(u))
    if int(u / 10 ** e + 1e-9) in (1, 2): e -= 1
    dec = max(0, -e); return f"({round(float(v), dec):.{dec}f} ± {round(u, dec):.{dec}f})".replace(".", ",")

def line(x, y, s):
    x = [F(v) for v in x]; y = [F(v) for v in y]; w = [1 / F(v) ** 2 for v in s]
    Sw = sum(w); xb = sum(a * b for a, b in zip(w, x)) / Sw; yb = sum(a * b for a, b in zip(w, y)) / Sw
    Sxx = sum(a * (b - xb) ** 2 for a, b in zip(w, x)); Sxy = sum(a * (b - xb) * (c - yb) for a, b, c in zip(w, x, y))
    a = Sxy / Sxx; b = yb - a * xb
    chi2 = sum(wi * (yi - a * xi - b) ** 2 for wi, xi, yi in zip(w, x, y)); dof = len(x) - 2
    k = sqrt(chi2 / dof)
    return dict(a=float(a), b=float(b), ua0=sqrt(1 / Sxx), ub0=sqrt(1 / Sw + xb ** 2 / Sxx), k=k, cov0=float(-xb / Sxx), chi2dof=float(chi2) / dof)

def wmean(v, u):
    w = [1 / F(q) ** 2 for q in u]; m = sum(a * F(b) for a, b in zip(w, v)) / sum(w); return float(m), sqrt(1 / sum(w))

def compare(m, um, r, ur):
    d = m - r; u = sqrt(um ** 2 + ur ** 2); return d, u, abs(d) / u, 100 * d / r

print("== P6a Wheatstone bridge: Rx = R1 R2 / R3; (u/Rx)^2 = (u1/R1)^2 + (u2/R2)^2 + (u3/R3)^2 (partial derivatives of a product and quotient)")
W = [(100, .5, 330, 1, 150, .5), (100, .5, 220, 1, 101.5, .5), (47, .2, 470, 2, 100, .5)]
rx = []; urx = []
for (r1, s1, r2, s2, r3, s3) in W:
    R = r1 * r2 / r3; rel = sqrt((s1 / r1) ** 2 + (s2 / r2) ** 2 + (s3 / r3) ** 2); rx.append(R); urx.append(R * rel)
    print(f"   Rx = {R!r}  u = {R*rel!r}")
mw, uw = wmean([repr(q) for q in rx], [repr(q) for q in urx])   # repr floats are exact decimal strings of the doubles
print("   weighted mean", mw, "u", uw, "->", hu(mw, uw))
for k in (1, 2):
    print(f"   overlap k={k}: gaps", [(i + 1, j + 1, abs(rx[i] - rx[j]) - k * (urx[i] + urx[j])) for i in range(3) for j in range(i + 1, 3)])
mt = "219,4 ± 1,0"      # typed in the template (the weighted mean as the page shows it: see hu() above)
d, u, z, pc = compare(219.4, 1.0, 220.0, 2.2); print(f"   compare {mt} vs 220 ± 2,2: diff {d!r} u {u!r} -> {hu(d, u)}  z = {z!r}  {pc!r} %")

print("== P6b grating: d = 1e6/300 nm; lam = d x / (k sqrt(x^2 + L^2)); dlam/dx = d L^2 / (k (x^2+L^2)^1.5); dlam/dL = -d x L / (k (x^2+L^2)^1.5)")
d0 = 1e6 / 300; G = [(1, 193.5), (2, 410.0), (3, 691.5)]; sx = 1.0; L = 1000.0; sL = 2.0
lam = []; ulam = []
for k, x in G:
    r = sqrt(x * x + L * L); l_ = d0 * x / (k * r); dx = d0 * L * L / (k * r ** 3); dL = -d0 * x * L / (k * r ** 3)
    lam.append(l_); ulam.append(sqrt((dx * sx) ** 2 + (dL * sL) ** 2)); print(f"   k={k}: lam = {l_!r}  u = {ulam[-1]!r}")
mw, uw = wmean([repr(q) for q in lam], [repr(q) for q in ulam]); print("   weighted mean", mw, "u", uw, "->", hu(mw, uw))
print("   overlap k=1 gaps", [(i + 1, j + 1, abs(lam[i] - lam[j]) - (ulam[i] + ulam[j])) for i in range(3) for j in range(i + 1, 3)])
d, u, z, pc = compare(632.1, 0.9, 632.8, 0); print(f"   compare 632,1 ± 0,9 vs 632,8: diff {d!r} u {u!r} -> {hu(d, u)}  z = {z!r}  {pc!r} %")

print("== P7 refractometer: calibration n(w), weighted line with cov(a,b) = -xbar/Sxx; x0 = (y0 - b)/a; u^2 = (u_y0^2 + u_b^2 + x0^2 u_a^2 + 2 x0 cov)/a^2")
w_ = [0, 5, 10, 15, 20, 25]; n_ = ["1.3330", "1.3409", "1.3485", "1.3565", "1.3641", "1.3721"]; sn = ["0.0002", "0.0002", "0.0002", "0.0003", "0.0003", "0.0003"]
c = line(w_, n_, sn); print("   a", c["a"], "b", c["b"], "chi2/dof", c["chi2dof"], "k", c["k"]); print("   u(a) scaled", c["ua0"] * c["k"], "unscaled", c["ua0"], " u(b) scaled", c["ub0"] * c["k"], "unscaled", c["ub0"], hu(c["a"], c["ua0"] * c["k"]), hu(c["b"], c["ub0"] * c["k"]))
for y0, uy in ((1.3505, 0.0003), (1.3600, 0.0003), (1.3780, 0.0003)):
    for nm, f in (("scaled", c["k"]), ("unscaled", 1)):
        ua, ub, cov = c["ua0"] * f, c["ub0"] * f, c["cov0"] * f * f; x0 = (y0 - c["b"]) / c["a"]
        u = sqrt(uy ** 2 + ub ** 2 + x0 ** 2 * ua ** 2 + 2 * x0 * cov) / c["a"]
        print(f"   y0 = {y0} ± {uy}: x0 = {x0!r}  u {nm} = {u!r}", hu(x0, u))

print("== P8a counts: chi-square against Poisson and Gauss, width 3 from 3")
A = [9,12,8,10,7,11,9,6,10,13, 8,9,15,7,14,9,12,5,6,10, 9,11,8,4,14,9,7,12,10,3, 9,10,11,7,9,13,8,17,9,11]
n = len(A); mean = sum(A) / n; s = sqrt(sum((v - mean) ** 2 for v in A) / (n - 1)); print("   n", n, "mean", mean, "s(n-1)", s)
def prod_odd(j):
    p = 1
    for i in range(1, j + 1): p *= 2 * i - 1
    return p
def sf(x, k):
    if k % 2 == 0: return exp(-x / 2) * sum((x / 2) ** j / factorial(j) for j in range(k // 2))
    t = sqrt(x); return erfc(t / sqrt(2)) + 2 * exp(-x / 2) / sqrt(2 * pi) * sum(t ** (2 * j - 1) / prod_odd(j) for j in range(1, (k - 1) // 2 + 1))
for x, k, p in ((3.841, 1, .05), (5.991, 2, .05), (7.815, 3, .05), (9.488, 4, .05), (6.635, 1, .01), (11.345, 3, .01)): assert abs(sf(x, k) - p) < 6e-4   # printed chi-square table
pois = lambda e: sum(exp(-mean) * mean ** k / factorial(k) for k in range(0, e)); gauss = lambda e: 0.5 * (1 + erf((e - 0.5 - mean) / (s * sqrt(2))))
start, width = 3, 3; K = (max(A) - start) // width + 1; edges = [start + i * width for i in range(K + 1)]
obs = [sum(1 for v in A if edges[i] <= v < edges[i + 1]) for i in range(K)]; print("   classes", K, "observed", obs)
for name, Fn, npar in (("Poisson", pois, 1), ("Gauss", gauss, 2)):
    cum = [0.0] + [Fn(e) for e in edges[1:-1]] + [1.0]; ex = [n * (cum[i + 1] - cum[i]) for i in range(K)]
    chi2 = sum((o - e) ** 2 / e for o, e in zip(obs, ex)); dof = K - 1 - npar
    print(f"   {name}: expected {ex}  chi2 = {chi2!r}  dof {dof}  p = {sf(chi2, dof)!r}  E<5 in classes {[i + 1 for i, e in enumerate(ex) if e < 5]}")

print("== P8b decay: no calculation; counts N and sN = sqrt(N) rounded to 0,1")
N = [1000, 766, 586, 449, 344, 263, 201, 154]; print("   sN", [round(sqrt(q), 1) for q in N])

print("== P9 pendulum: g_i = 4 pi^2 l / T^2; T^2 with u = 2 T sT; slope a of T^2 against l; g = 4 pi^2 / a, u(g) = g u(a)/a")
l9 = ["0.30", "0.45", "0.60", "0.80", "1.00"]; T = [1.101, 1.343, 1.556, 1.790, 2.009]; sT = [0.005, 0.005, 0.005, 0.008, 0.01]
gi = [4 * pi ** 2 * float(a) / b ** 2 for a, b in zip(l9, T)]; print("   g_i", gi)
m = sum(gi) / 5; sd = sqrt(sum((q - m) ** 2 for q in gi) / 4); t = 2.776; print("   mean", m, "s", sd, "s/sqrt5", sd / sqrt(5), "t(0,975;4) = 2,776 -> u", t * sd / sqrt(5), hu(m, t * sd / sqrt(5)), "interval", m - t * sd / sqrt(5), m + t * sd / sqrt(5))
T2 = [repr(b * b) for b in T]; uT2 = [repr(2 * b * s_) for b, s_ in zip(T, sT)]; print("   T2", T2, "u(T2)", uT2)
c = line(l9, T2, uT2)
print("   a", c["a"], "b", c["b"], "chi2/dof", c["chi2dof"], "u(a) scaled", c["ua0"] * c["k"], "unscaled", c["ua0"], "u(b) scaled", c["ub0"] * c["k"], hu(c["a"], c["ua0"] * c["k"]), hu(c["b"], c["ub0"] * c["k"]))
for nm, f in (("scaled", c["k"]), ("unscaled", 1)):
    g = 4 * pi ** 2 / c["a"]; ug = g * c["ua0"] * f / c["a"]; print(f"   g = {g!r}  u {nm} = {ug!r}", hu(g, ug))
