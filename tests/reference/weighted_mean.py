# Independent hand calculation (exact fractions) for tests/phase2-step4-wmean.mjs. Run: python3 tests/reference/weighted_mean.py
from fractions import Fraction as F
x = [F("10.3"), F("10.5"), F("9.9")]; u = [F("0.2"), F("0.3"), F("0.1")]
w = [1 / q**2 for q in u]; sw = sum(w)
print("w", [float(a) for a in w], "sum", float(sw))                      # 25, 11.111, 100 -> 136.111
print("mean", float(sum(a * b for a, b in zip(w, x)) / sw))              # 10.0224490
print("u", 1 / float(sw) ** 0.5)                                         # 0.0857143 = 3/35
for k in (1, 2):                                                         # gap > 0 means the two intervals do not touch
    print("k", k, [(i + 1, j + 1, float(abs(x[i] - x[j]) - k * (u[i] + u[j]))) for i in range(3) for j in range(i + 1, 3)])
