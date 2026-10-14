# Independent hand calculation for tests/phase2-step5-histogram.mjs: 30 length readings l / mm, classes of width 0,2 mm from 9,5 mm,
# left-closed [a, b). Counts are made by exact fractions (so 9,7 sits in class [9,7; 9,9) for sure). Run: python3 tests/reference/histogram.py
from fractions import Fraction as F
from math import exp, pi, sqrt
vals = [F(v) for v in "9.5 9.6 9.7 9.7 9.8 9.8 9.8 9.9 9.9 9.9 10.0 10.0 10.0 10.0 10.05 10.05 10.1 10.1 10.1 10.2 10.2 10.2 10.2 10.2 10.3 10.3 10.4 10.4 10.5 10.6".split()]
n = len(vals); start, w = F("9.5"), F("0.2")
counts = [0] * 6
for v in vals: counts[int((v - start) // w)] += 1
print("n", n, "counts", counts, "sum", sum(counts))
print("relative %", [float(F(c, n) * 100) for c in counts])
cum = [sum(counts[:i + 1]) for i in range(6)]
print("cumulative", cum, [float(F(c, n) * 100) for c in cum])
mean = sum(vals) / n; ss = sum((v - mean) ** 2 for v in vals)
print("mean", float(mean), "s(n-1)", sqrt(ss / (n - 1)), "sigma(n)", sqrt(ss / n))
for name, s in (("n-1", sqrt(ss / (n - 1))), ("n", sqrt(ss / n))):
    f = lambda x: float(n * w) * exp(-(x - float(mean)) ** 2 / (2 * s * s)) / (s * sqrt(2 * pi))
    print("curve", name, "at mean", f(float(mean)), "at 9.5", f(9.5), "at 10.0", f(10.0), "at 10.7", f(10.7))
