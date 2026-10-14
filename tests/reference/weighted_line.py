# Independent reference for weighted straight-line fits (no SciPy, no app code). Exact rational arithmetic,
# centred form (weighted means) as in Bevington & Robinson, "Data Reduction and Error Analysis", ch. 6.
# Prints the numbers pasted into tests/phase1-step7-reference.mjs. Run: python3 -I tests/reference/weighted_line.py
from fractions import Fraction as F
from decimal import Decimal, getcontext
getcontext().prec = 40
def sqrt(q): return (Decimal(q.numerator) / Decimal(q.denominator)).sqrt()
def line(x, y, s):
    w = [1 / (F(v) ** 2) for v in s]; x = [F(v) for v in x]; y = [F(v) for v in y]
    Sw = sum(w); xb = sum(a * b for a, b in zip(w, x)) / Sw; yb = sum(a * b for a, b in zip(w, y)) / Sw
    Sxx = sum(a * (b - xb) ** 2 for a, b in zip(w, x)); Sxy = sum(a * (b - xb) * (c - yb) for a, b, c in zip(w, x, y))
    a = Sxy / Sxx; b = yb - a * xb
    chi2 = sum(wi * (yi - a * xi - b) ** 2 for wi, xi, yi in zip(w, x, y)); dof = len(x) - 2
    ua = 1 / sqrt(Sxx); ub = sqrt(1 / Sw + xb ** 2 / Sxx); k = sqrt(chi2 / dof)
    return dict(a=Decimal(a.numerator) / Decimal(a.denominator), b=Decimal(b.numerator) / Decimal(b.denominator),
                ua=ua, ub=ub, chi2=Decimal(chi2.numerator) / Decimal(chi2.denominator), dof=dof, k=k)
if __name__ == "__main__":
    x = ["0.5", "1.5", "2.0", "3.5", "4.0", "6.0", "7.5"]; y = ["1.9", "3.4", "4.2", "7.9", "8.1", "12.6", "15.2"]
    s = ["0.1", "0.2", "0.2", "0.4", "0.3", "0.5", "0.6"]
    print("weighted 7 points", {k: float(v) for k, v in line(x, y, s).items()})
    # Norris with a constant error 0.5: scaled errors must equal NIST's certified ones (OLS), unscaled = 0.5/sqrt(Sxx) etc.
    rows = [l.split() for l in open("tests/nist/Norris.dat").read().splitlines()[60:96]]
    ny = [r[0] for r in rows]; nx = [r[1] for r in rows]
    print("Norris sigma=0.5", {k: float(v) for k, v in line(nx, ny, ["0.5"] * 36).items()})
