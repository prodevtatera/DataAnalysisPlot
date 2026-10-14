// Runs SciPy in a Web Worker so the page stays usable while Python loads and fits.
import { loadPyodide } from "./vendor/pyodide/pyodide.mjs";
const ready = (async () => {
  const py = await loadPyodide({ indexURL: new URL("vendor/pyodide/", self.location).href });
  await py.loadPackage(["numpy", "scipy"]);
  await py.runPythonAsync(`
import json, numpy as np
from scipy.optimize import curve_fit
MODELS = {
  "line": (lambda x, a, b: a * x + b, lambda x, y: [1.0, 0.0]),
  "mm":   (lambda x, v, k: v * x / (k + x), lambda x, y: [float(np.max(y)), float(np.median(x))]),
}
def line_fit(x, y, sy):
    # A straight line is linear in a and b: solve it directly (SVD least squares on the error-weighted design matrix).
    # curve_fit iterates and only reaches about 6 digits on NIST Norris; this reaches 9 or more.
    s = np.ones_like(y) if sy is None else sy
    A = np.column_stack([x, np.ones_like(x)]) / s[:, None]
    p = np.linalg.lstsq(A, y / s, rcond=None)[0]
    _, sv, vt = np.linalg.svd(A, full_matrices=False)
    if sv[-1] < 1e-12 * sv[0]:
        raise ValueError("Die Anpassung ist nicht konvergiert. Andere Startwerte oder ein anderes Modell versuchen.")
    c = (vt.T / sv ** 2) @ vt                     # (A^T A)^-1 = covariance for known errors
    r = y - (p[0] * x + p[1]); chi2 = float(np.sum((r / s) ** 2)); dof = len(x) - 2
    out = {"p": p.tolist(), "err_scaled": np.sqrt(np.diag(c) * chi2 / dof).tolist(), "dof": dof,
           "cov_scaled": [float(c[0, 0] * chi2 / dof), float(c[0, 1] * chi2 / dof), float(c[1, 1] * chi2 / dof)]}  # [var a, cov a b, var b], for calibration read-off
    if sy is None:
        out["ssr"] = chi2
    else:
        out["err_unscaled"] = np.sqrt(np.diag(c)).tolist(); out["chi2"] = chi2
        out["cov_unscaled"] = [float(c[0, 0]), float(c[0, 1]), float(c[1, 1])]
    return json.dumps(out)
def gof(d):
    # Chi-square goodness of fit of counts in integer classes against Poisson(mean) and Gauss(mean, s). edges: lower limits of the classes plus the upper limit of the last one.
    # The first class reaches down to minus infinity and the last up to plus infinity, so the expected counts add up to n. A count k is in class [e_i, e_i+1) when e_i <= k < e_i+1.
    from scipy import stats
    edges, obs = d["edges"], np.array(d["counts"], dtype=float)
    n = obs.sum(); out = {}
    cdfs = {"poisson": (lambda e: stats.poisson.cdf(e - 1, d["mean"]), 1),                      # P(X < e) for whole numbers
            "gauss": (lambda e: stats.norm.cdf((e - 0.5 - d["mean"]) / d["s"]), 2)}           # same with the continuity correction
    for name, (F, npar) in cdfs.items():
        cum = np.array([0.0] + [float(F(e)) for e in edges[1:-1]] + [1.0])
        exp = n * np.diff(cum)
        if not np.all(exp > 0):
            raise ValueError("gof_exp0")   # a key of TEXTS: the page shows it in the chosen language
        chi2 = float(np.sum((obs - exp) ** 2 / exp)); dof = len(obs) - 1 - npar
        out[name] = {"expected": exp.tolist(), "chi2": chi2, "dof": dof, "p": float(stats.chi2.sf(chi2, dof))}
    return json.dumps(out)
def run(s):
    d = json.loads(s)
    if d.get("task") == "gof":
        return gof(d)
    x, y = np.array(d["x"]), np.array(d["y"])
    sy = np.array(d["sy"]) if d["sy"] else None
    if "expr" in d:  # free formula, used by the NIST check: x plus named parameters
        f = eval("lambda x, " + ", ".join(d["names"]) + ": " + d["expr"], {"np": np})
        p0 = d["p0"]
    else:
        f, start = MODELS[d["model"]]
        p0 = start(x, y)
    if "expr" not in d and d["model"] == "line":
        return line_fit(x, y, sy)
    p, c = curve_fit(f, x, y, p0=p0, sigma=sy, absolute_sigma=False, maxfev=5000, ftol=1e-14, xtol=1e-14)
    if not (np.all(np.isfinite(p)) and np.all(np.isfinite(c))):
        raise ValueError("Die Anpassung ist nicht konvergiert. Andere Startwerte oder ein anderes Modell versuchen.")
    out = {"p": p.tolist(), "err_scaled": np.sqrt(np.diag(c)).tolist(), "dof": len(x) - len(p)}
    r = y - f(x, *p)
    if sy is None:
        out["ssr"] = float(np.sum(r ** 2))
    else:
        _, c2 = curve_fit(f, x, y, p0=p, sigma=sy, absolute_sigma=True, maxfev=5000, ftol=1e-14, xtol=1e-14)
        out["err_unscaled"] = np.sqrt(np.diag(c2)).tolist()
        out["chi2"] = float(np.sum((r / sy) ** 2))
    return json.dumps(out)
`);
  return py;
})();
ready.then(() => postMessage({ ready: true }), e => postMessage({ loadError: String(e) }));
onmessage = async ev => {
  try {
    const py = await ready;
    py.globals.set("job", JSON.stringify(ev.data));
    postMessage({ result: JSON.parse(await py.runPythonAsync("run(job)")) });
  } catch (e) {
    postMessage({ error: String(e.message || e).split("\n").filter(Boolean).pop().replace(/^\w*Error: /, "") });
  }
};
