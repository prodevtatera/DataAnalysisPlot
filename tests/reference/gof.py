# Independent hand calculation for tests/phase2-step11-gof.mjs (P8 radioactivity): 40 counts per interval, chi-square test against Poisson and Gauss.
# Plain math only (exp, erf, factorial; the p-value from closed formulas), never SciPy. Run: python3 tests/reference/gof.py
from math import exp, erf, erfc, sqrt, pi, factorial, floor, ceil
A = [4,7,9,6,8,5,10,7,6,8, 9,3,7,11,6,8,7,5,9,6, 8,10,4,7,6,12,7,5,8,9, 6,7,8,3,9,7,10,6,5,8]
B = [19] * 10 + [20] * 10 + [21] * 10        # far too narrow for Poisson (variance 20) : must be rejected
counts = A; n = 0; mean = 0.0; s = 0.0
def setdata(c):
    global counts, n, mean, s
    counts = c; n = len(c); mean = sum(c) / n; s = sqrt(sum((v - mean) ** 2 for v in c) / (n - 1))
    print("\nn", n, "mean", mean, "s(n-1)", s)

def pois_cdf(e):      # P(X < e) for integer e: sum of pmf for k = 0 .. e-1
    return sum(exp(-mean) * mean ** k / factorial(k) for k in range(0, e))
def gauss_cdf(e):     # P(X < e) for integer-valued X: continuity correction, Phi((e - 0,5 - mean)/s)
    return 0.5 * (1 + erf((e - 0.5 - mean) / (s * sqrt(2))))
def sf(x, k):         # chi-square survival function from closed forms (even k: finite sum; odd k: erfc plus finite sum)
    if k % 2 == 0:
        return exp(-x / 2) * sum((x / 2) ** j / factorial(j) for j in range(k // 2))
    t = sqrt(x); r = erfc(t / sqrt(2))
    r += 2 * exp(-x / 2) / sqrt(2 * pi) * sum(t ** (2 * j - 1) / prod_odd(j) for j in range(1, (k - 1) // 2 + 1))
    return r
def prod_odd(j):
    p = 1
    for i in range(1, j + 1): p *= 2 * i - 1
    return p
# The p-value formula is checked against the printed table (critical values of chi-square, p = 0,05 and p = 0,01):
for x, k, p in ((3.841, 1, .05), (5.991, 2, .05), (7.815, 3, .05), (9.488, 4, .05), (11.070, 5, .05), (12.592, 6, .05), (14.067, 7, .05), (6.635, 1, .01), (11.345, 3, .01), (13.277, 4, .01)):
    assert abs(sf(x, k) - p) < 6e-4, (x, k, sf(x, k))
print("p-value formula agrees with the table at 10 critical values")

def test(start, width):
    lo = min(counts); k = (max(counts) - start) // width + 1
    edges = [start + i * width for i in range(k + 1)]
    obs = [sum(1 for c in counts if edges[i] <= c < edges[i + 1]) for i in range(k)]
    print("\nstart", start, "width", width, "classes", k, "observed", obs, sum(obs))
    for name, F, npar in (("Poisson", pois_cdf, 1), ("Gauss", gauss_cdf, 2)):
        cum = [0.0] + [F(e) for e in edges[1:-1]] + [1.0]     # open tails: first class from -inf, last class to +inf
        exp_ = [n * (cum[i + 1] - cum[i]) for i in range(k)]
        chi2 = sum((o - e) ** 2 / e for o, e in zip(obs, exp_)); dof = k - 1 - npar
        print(name, "expected", exp_, "sum", sum(exp_))
        print(name, "chi2", repr(chi2), "dof", dof, "p", repr(sf(chi2, dof)), "classes with E<5:", [i + 1 for i, e in enumerate(exp_) if e < 5])
setdata(A); test(3, 1); test(3, 2)
setdata(B); test(16, 1)
