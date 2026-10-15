# Independent reference for the curve-fit tool (no SciPy, no NumPy, no app code).
# NIST has no single-exponential and no single-sine problem, so these are checked here:
#  - exp, Gauss, sine: own Levenberg-Marquardt with hand-derived partial derivatives, own Gauss-Jordan inverse; covariance (J^T J)^-1,
#    scaled by chi2/DoF (and unscaled when error values are given), as in Bevington & Robinson, "Data Reduction and Error Analysis", ch. 8.
#  - polynomial: exact rational arithmetic (normal equations solved with Fractions).
# Prints one JSON object with the data and the expected results; tests/phase5-step2-reference.mjs runs this and compares. Run: python3 -I tests/reference/curves.py
import json, math
from fractions import Fraction as F

class Lcg:                       # fixed "noise": the same numbers on every machine
    def __init__(s, seed): s.v = seed
    def u(s): s.v = (s.v * 1103515245 + 12345) % 2 ** 31; return s.v / 2 ** 31 - 0.5

def inverse(M):
    n = len(M); A = [list(map(float, r)) + [1.0 if i == j else 0.0 for j in range(n)] for i, r in enumerate(M)]
    for c in range(n):
        piv = max(range(c, n), key=lambda r: abs(A[r][c])); A[c], A[piv] = A[piv], A[c]
        d = A[c][c]; A[c] = [v / d for v in A[c]]
        for r in range(n):
            if r != c:
                f = A[r][c]; A[r] = [a - f * b for a, b in zip(A[r], A[c])]
    return [r[n:] for r in A]

def lm(model, p0, x, y, s):
    # model(x, p) -> (value, [d/dp_k]); s = error values (or all 1)
    n, m = len(x), len(p0); p = list(p0); lam = 1e-3
    def cost(q): return sum(((yi - model(xi, q)[0]) / si) ** 2 for xi, yi, si in zip(x, y, s))
    c = cost(p)
    for _ in range(2000):
        JtJ = [[0.0] * m for _ in range(m)]; Jtr = [0.0] * m
        for xi, yi, si in zip(x, y, s):
            f, d = model(xi, p); r = (yi - f) / si
            for a in range(m):
                Jtr[a] += d[a] / si * r
                for b in range(m): JtJ[a][b] += d[a] * d[b] / si ** 2
        while True:
            A = [[JtJ[a][b] * (1 + lam if a == b else 1) for b in range(m)] for a in range(m)]
            Ai = inverse(A); step = [sum(Ai[a][b] * Jtr[b] for b in range(m)) for a in range(m)]
            q = [pi + di for pi, di in zip(p, step)]; cq = cost(q)
            if cq <= c: lam = max(lam / 10, 1e-15); break
            lam *= 10
            if lam > 1e15: break
        done = abs(c - cq) <= 1e-16 * c and cq <= c
        if cq <= c: p, c = q, cq
        if done or lam > 1e15: break
    JtJ = [[sum(model(xi, p)[1][a] * model(xi, p)[1][b] / si ** 2 for xi, si in zip(x, s)) for b in range(m)] for a in range(m)]
    Ci = inverse(JtJ); dof = n - m
    return p, c, dof, [math.sqrt(Ci[a][a]) for a in range(m)], [math.sqrt(Ci[a][a] * c / dof) for a in range(m)]

def mexp(off):
    def f(x, p):
        e = math.exp(-x / p[1]); v = p[0] * e + (p[2] if off else 0)
        return v, [e, p[0] * x / p[1] ** 2 * e] + ([1.0] if off else [])
    return f
def mgauss(off):
    def f(x, p):
        g = math.exp(-(x - p[1]) ** 2 / (2 * p[2] ** 2)); v = p[0] * g + (p[3] if off else 0)
        return v, [g, p[0] * g * (x - p[1]) / p[2] ** 2, p[0] * g * (x - p[1]) ** 2 / p[2] ** 3] + ([1.0] if off else [])
    return f
def msine(off):
    def f(x, p):
        th = 2 * math.pi * x / p[1] + p[2]; v = p[0] * math.sin(th) + (p[3] if off else 0)
        return v, [math.sin(th), -p[0] * math.cos(th) * 2 * math.pi * x / p[1] ** 2, p[0] * math.cos(th)] + ([1.0] if off else [])
    return f

def poly_exact(x, y, s, deg):
    x = [F(v) for v in x]; y = [F(v) for v in y]; w = [F(1) / F(v) ** 2 for v in s]; m = deg + 1
    N = [[sum(wi * xi ** (a + b) for wi, xi in zip(w, x)) for b in range(m)] for a in range(m)]
    t = [sum(wi * xi ** a * yi for wi, xi, yi in zip(w, x, y)) for a in range(m)]
    I = [[F(int(a == b)) for b in range(m)] for a in range(m)]; A = [N[a] + I[a] for a in range(m)]
    for c in range(m):
        piv = next(r for r in range(c, m) if A[r][c] != 0); A[c], A[piv] = A[piv], A[c]
        d = A[c][c]; A[c] = [v / d for v in A[c]]
        for r in range(m):
            if r != c: f = A[r][c]; A[r] = [a - f * b for a, b in zip(A[r], A[c])]
    Ci = [r[m:] for r in A]; p = [sum(Ci[a][b] * t[b] for b in range(m)) for a in range(m)]
    chi2 = sum(wi * (yi - sum(p[k] * xi ** k for k in range(m))) ** 2 for wi, xi, yi in zip(w, x, y)); dof = len(x) - m
    return [float(v) for v in p], float(chi2), dof, [math.sqrt(float(Ci[a][a])) for a in range(m)], [math.sqrt(float(Ci[a][a] * chi2 / dof)) for a in range(m)]

cases = []
def add(name, model, off, x, y, s, fit, **kw):
    weighted = s is not None
    p, chi2, dof, se_u, se_s = fit(x, y, s if weighted else [1.0] * len(x))
    cases.append(dict(name=name, model=model, offset=off, x=x, y=y, sy=s, p=p, err_scaled=se_s, dof=dof, **kw,
                      **(dict(chi2=chi2, err_unscaled=se_u) if weighted else dict(ssr=chi2))))
def noisy(f, p, x, rel, seed, base=None):
    r = Lcg(seed); sc = rel * (base if base else max(abs(f(xi, p)[0]) for xi in x))
    return [round(f(xi, p)[0] + sc * r.u() * 2, 6) for xi in x]
X = lambda n, a, b: [round(a + (b - a) * i / (n - 1), 6) for i in range(n)]

x = X(12, 0, 10); y = noisy(mexp(False), [5.0, 3.0], x, 0.03, 1)
add("exp, unweighted", "exp", False, x, y, None, lambda x, y, s: lm(mexp(False), [4.0, 2.5], x, y, s))
x = X(14, 0, 12); t = [8.0, 2.5, 1.5]; y = noisy(mexp(True), t, x, 0.02, 2); s = [round(0.04 + 0.01 * (i % 3), 3) for i in range(14)]
add("exp with offset, weighted", "exp", True, x, y, s, lambda x, y, s: lm(mexp(True), [7.0, 3.0, 1.0], x, y, s))
x = X(10, 0, 6); y = noisy(mexp(False), [0.5, -4.0], x, 0.02, 3)
add("exp growth (tau < 0), unweighted", "exp", False, x, y, None, lambda x, y, s: lm(mexp(False), [0.6, -3.5], x, y, s))
x = X(25, 400, 440); t = [3.0, 421.0, 5.0, 0.4]; y = noisy(mgauss(True), t, x, 0.03, 4); s = [round(0.05 + 0.02 * ((i * 7) % 4), 3) for i in range(25)]
add("Gauss with offset, weighted", "gauss", True, x, y, s, lambda x, y, s: lm(mgauss(True), [2.7, 420.0, 4.5, 0.3], x, y, s))
x = X(21, -5, 5); y = noisy(mgauss(False), [-2.0, 0.4, 1.3], x, 0.03, 5)
add("Gauss dip without offset, unweighted", "gauss", False, x, y, None, lambda x, y, s: lm(mgauss(False), [-1.8, 0.5, 1.5], x, y, s))
x = X(30, 0, 9); t = [2.0, 3.0, 0.7, 0.5]; y = noisy(msine(True), t, x, 0.04, 6)
add("sine with offset, unweighted", "sine", True, x, y, None, lambda x, y, s: lm(msine(True), [1.9, 3.05, 0.6, 0.45], x, y, s))
x = [round(0.3 * i + 0.07 * ((i * 5) % 3), 6) for i in range(26)]; t = [1.5, 2.2, -1.1]; y = noisy(msine(False), t, x, 0.04, 7); s = [round(0.05 + 0.02 * (i % 2), 3) for i in range(26)]
add("sine without offset, weighted, uneven x", "sine", False, x, y, s, lambda x, y, s: lm(msine(False), [1.4, 2.25, -1.0], x, y, s))
x = X(9, 0, 8); y = [round(0.5 + 1.2 * v - 0.3 * v * v + 0.04 * v ** 3 + 0.2 * Lcg(8 + i).u(), 6) for i, v in enumerate(x)]; s = [round(0.1 + 0.05 * (i % 3), 3) for i in range(9)]
add("polynomial degree 3, weighted (exact fractions)", "poly", False, x, y, s, lambda x, y, s: poly_exact(x, y, s, 3), degree=3)
x = X(8, 1, 15); y = [round(2.0 - 0.7 * v + 0.05 * v * v + 0.3 * Lcg(20 + i).u(), 6) for i, v in enumerate(x)]
add("polynomial degree 2, unweighted (exact fractions)", "poly", False, x, y, None, lambda x, y, s: poly_exact(x, y, [1] * len(x), 2), degree=2)
print(json.dumps(cases))
