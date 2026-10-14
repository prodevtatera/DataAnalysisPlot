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
def run(s):
    d = json.loads(s)
    x, y = np.array(d["x"]), np.array(d["y"])
    sy = np.array(d["sy"]) if d["sy"] else None
    if "expr" in d:  # free formula, used by the NIST check: x plus named parameters
        f = eval("lambda x, " + ", ".join(d["names"]) + ": " + d["expr"], {"np": np})
        p0 = d["p0"]
    else:
        f, start = MODELS[d["model"]]
        p0 = start(x, y)
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
    postMessage({ error: String(e.message || e).split("\n").filter(Boolean).pop() });
  }
};
