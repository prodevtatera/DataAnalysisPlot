# Hand calculation for phase 2 step 12 (confidence interval of a mean, t distribution). Plain Python, exact fractions,
# t values typed from the printed two-sided Student table (6 digits), not from any program the app uses.
from fractions import Fraction as F
from math import sqrt
T = {(0.90, 4): 2.131847, (0.95, 4): 2.776445, (0.99, 4): 4.604095, (0.95, 9): 2.262157}
x = [F(98, 10), F(101, 10), F(100, 10), F(103, 10), F(99, 10)]   # 9,8 10,1 10,0 10,3 9,9
n = len(x); mean = sum(x) / n; ss = sum((v - mean) ** 2 for v in x)
s = sqrt(ss / (n - 1)); sem = sqrt(ss / (n - 1) / n)
print("mean", float(mean), "sum sq", float(ss), "s", s, "sem", sem)
for lvl in (0.90, 0.95, 0.99):
    t = T[(lvl, 4)]; u = t * sem
    print(lvl, "t", t, "u", u, "lo", float(mean) - u, "hi", float(mean) + u)
