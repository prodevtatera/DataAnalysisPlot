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
import ast, re
FREE_FUNCS = {"exp": np.exp, "ln": np.log, "log": np.log, "log10": np.log10, "sqrt": np.sqrt, "sin": np.sin, "cos": np.cos, "tan": np.tan,
              "arctan": np.arctan, "sinh": np.sinh, "cosh": np.cosh, "tanh": np.tanh, "abs": np.abs}
CF_MAXPAR = 10
def free_model(expr):
    # The student's formula in x and named parameters. It is parsed to a tree and only numbers, + - * / ^, x, parameter names and one-argument functions
    # from FREE_FUNCS pass; nothing else is ever run. Errors are keys of TEXTS (cf_*), the page shows them in the chosen language.
    s = re.sub(r"(?<=\\d),(?=\\d)", ".", str(expr)).replace("^", "**").replace("\\u2212", "-").replace("\\u00b7", "*").replace("\\u00d7", "*").strip()
    try:
        tree = ast.parse(s, mode="eval")
    except SyntaxError:
        raise ValueError("cf_syntax")
    called, names = set(), {}
    for n in ast.walk(tree):
        if isinstance(n, ast.Call):
            if not (isinstance(n.func, ast.Name) and n.func.id in FREE_FUNCS and len(n.args) == 1 and not n.keywords):
                raise ValueError("cf_func:" + (n.func.id if isinstance(n.func, ast.Name) else "?"))
            called.add(id(n.func))
        elif isinstance(n, ast.Constant):
            if type(n.value) not in (int, float):
                raise ValueError("cf_syntax")
            n.value = float(n.value)          # floats only: 9**9**9 then overflows at once instead of running for ever
        elif not isinstance(n, (ast.Expression, ast.BinOp, ast.UnaryOp, ast.Name, ast.Load, ast.Add, ast.Sub, ast.Mult, ast.Div, ast.Pow, ast.USub, ast.UAdd)):
            raise ValueError("cf_syntax")
    for n in sorted((n for n in ast.walk(tree) if isinstance(n, ast.Name) and id(n) not in called), key=lambda n: n.col_offset):
        if n.id != "x" and n.id != "pi":
            names.setdefault(n.id, None)
    if "x" not in {n.id for n in ast.walk(tree) if isinstance(n, ast.Name)}:
        raise ValueError("cf_nox")
    if not names:
        raise ValueError("cf_nopar")
    if len(names) > CF_MAXPAR:
        raise ValueError("cf_manypar:" + str(CF_MAXPAR))
    names = list(names)
    # eval is safe here: it only sees the tree checked above (numbers, x, parameter names, FREE_FUNCS) and has no builtins.
    f = eval("lambda x, " + ", ".join(names) + ": " + ast.unparse(tree), {"__builtins__": {}, "pi": np.pi, **FREE_FUNCS})
    return f, names, not any(isinstance(n, ast.Name) and n.id == "abs" for n in ast.walk(tree))
def lin_poly_fit(x, y, sy, deg):
    # Polynomial: linear in the coefficients, so solve it directly (SVD least squares on the error-weighted design matrix, columns scaled to length 1 first).
    s = np.ones_like(y) if sy is None else sy
    V = np.vander(x, deg + 1, increasing=True)
    nrm = np.linalg.norm(V, axis=0)
    A = V / nrm / s[:, None]
    q = np.linalg.lstsq(A, y / s, rcond=None)[0]
    _, sv, vt = np.linalg.svd(A, full_matrices=False)
    if sv[-1] < 1e-12 * sv[0]:
        raise ValueError("cf_singular")
    c = ((vt.T / sv ** 2) @ vt) / np.outer(nrm, nrm)      # (A^T A)^-1 in the original coefficients
    p = q / nrm
    r = y - V @ p; chi2 = float(np.sum((r / s) ** 2)); dof = len(x) - deg - 1
    out = {"p": p.tolist(), "err_scaled": np.sqrt(np.diag(c) * chi2 / dof).tolist(), "dof": dof}
    if sy is None:
        out["ssr"] = chi2
    else:
        out["err_unscaled"] = np.sqrt(np.diag(c)).tolist(); out["chi2"] = chi2
    return out, (lambda xs, p=p: np.vander(xs, deg + 1, increasing=True) @ p)
def cs_jac(f):
    # Jacobian by the complex-step trick: Im f(p + i*h*e_k) / h is the exact derivative (no subtraction), so ill-conditioned sets such as NIST Lanczos3 keep
    # 6 to 8 digits where finite differences keep 5. Works for every function in FREE_FUNCS except abs.
    def jac(x, *p):
        h = 1e-30; J = np.empty((len(x), len(p)))
        for k in range(len(p)):
            q = np.array(p, dtype=complex); q[k] += 1j * h
            J[:, k] = np.imag(f(x, *q)) / h
        return J
    return jac
def nl_fit(f, x, y, sy, p0, analytic=True):
    # Nonlinear least squares (Levenberg-Marquardt): errors from the covariance (J^T J)^-1, scaled by chi2/DoF or, with error values, also unscaled.
    from scipy.optimize import OptimizeWarning
    import warnings
    kw = dict(maxfev=20000, ftol=1e-15, xtol=1e-15)
    jacs = [None]
    if analytic:
        try:
            J0 = cs_jac(f)(x, *p0)
            if np.all(np.isfinite(J0)) and np.all(np.any(J0 != 0, axis=0)):
                jacs.insert(0, cs_jac(f))
        except Exception:
            pass
    for jac in jacs:
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore", OptimizeWarning)
                p, c = curve_fit(f, x, y, p0=p0, sigma=sy, absolute_sigma=False, jac=jac, **kw)
                se = np.sqrt(np.diag(c))
                # A parameter whose error is a hundred million times its value is not determined at all (the fit stalled where the curve no longer depends on it,
                # NIST BoxBOD from start 1): a clear message is better than that number.
                if not (np.all(np.isfinite(p)) and np.all(np.isfinite(c)) and np.all((p == 0) | (se <= 1e8 * np.abs(p)))):
                    raise ValueError("cf_noconv")
                out = {"p": p.tolist(), "err_scaled": se.tolist(), "dof": len(x) - len(p)}
                r = y - f(x, *p)
                if sy is None:
                    out["ssr"] = float(np.sum(r ** 2))
                else:
                    _, c2 = curve_fit(f, x, y, p0=p, sigma=sy, absolute_sigma=True, jac=jac, **kw)
                    out["err_unscaled"] = np.sqrt(np.diag(c2)).tolist()
                    out["chi2"] = float(np.sum((r / sy) ** 2))
            return out, (lambda xs, p=p: f(xs, *p))
        except (RuntimeError, FloatingPointError, ValueError):
            if jac is None:
                raise ValueError("cf_noconv")
def sine_start(x, y, sy, offset):
    # Grid over the frequency; at each one the sine, cosine (and constant) are linear, so the best frequency comes from least squares. curve_fit then polishes it.
    s = np.ones_like(y) if sy is None else sy
    xs = np.unique(x); rng = xs[-1] - xs[0]; step = np.median(np.diff(xs))
    best = None
    for fr in np.linspace(0.5 / rng, 0.5 / step, int(np.clip(20 * len(x), 400, 4000))):
        cols = [np.sin(2 * np.pi * fr * x), np.cos(2 * np.pi * fr * x)] + ([np.ones_like(x)] if offset else [])
        A = np.column_stack(cols) / s[:, None]
        q = np.linalg.lstsq(A, y / s, rcond=None)[0]
        ssr = float(np.sum((A @ q - y / s) ** 2))
        if best is None or ssr < best[0]:
            best = (ssr, fr, q)
    _, fr, q = best
    return [float(np.hypot(q[0], q[1])), 1 / fr, float(np.arctan2(q[1], q[0]))] + ([float(q[2])] if offset else [])
def curve(d):
    x, y = np.array(d["x"], dtype=float), np.array(d["y"], dtype=float)
    sy = np.array(d["sy"], dtype=float) if d["sy"] else None
    model, off, analytic = d["model"], bool(d.get("offset")), True
    xo = np.argsort(x); xsort, ysort = x[xo], y[xo]
    if model == "poly":
        deg = int(d["degree"]); names = ["a" + str(k) for k in range(deg + 1)]
        npar = deg + 1
    elif model == "free":
        f, names, analytic = free_model(d["expr"]); npar = len(names)
    else:
        names = {"exp": ["a", "tau"], "gauss": ["A", "mu", "sigma"], "sine": ["A", "T", "phi"]}[model] + (["c"] if off else [])
        npar = len(names)
    if len(x) <= npar:
        raise ValueError("cf_dof:" + str(npar) + ":" + str(len(x)))
    if model == "poly":
        out, ev = lin_poly_fit(x, y, sy, deg)
    else:
        if model == "exp":
            f = (lambda x, a, tau, c: a * np.exp(-x / tau) + c) if off else (lambda x, a, tau: a * np.exp(-x / tau))
            c0 = (ysort[-1] if ysort[0] > ysort[-1] else ysort[0]) if off else 0.0   # the level it levels off to
            a0 = ysort[0] - c0
            pos = (ysort - c0) / a0 > 0 if a0 != 0 else np.zeros(len(x), bool)
            tau0 = (xsort[-1] - xsort[0]) / 3 or 1.0
            if pos.sum() >= 3 and np.ptp(xsort[pos]) > 0:                              # log-linear start where the data allow it
                sl = np.polyfit(xsort[pos], np.log((ysort[pos] - c0) / a0), 1)[0]
                if sl != 0: tau0 = -1 / sl
            p0 = [a0 if a0 != 0 else 1.0, tau0] + ([c0] if off else [])
        elif model == "gauss":
            f = (lambda x, A, mu, sg, c: A * np.exp(-(x - mu) ** 2 / (2 * sg ** 2)) + c) if off else (lambda x, A, mu, sg: A * np.exp(-(x - mu) ** 2 / (2 * sg ** 2)))
            base = float(np.median(y)) if off else 0.0
            k = int(np.argmax(np.abs(y - base))); a0 = float(y[k] - base)
            near = x[np.abs(y - base) >= abs(a0) / 2]
            sg0 = (np.ptp(near) / 2.355) if len(near) > 1 and np.ptp(near) > 0 else (np.ptp(x) / 10 or 1.0)
            p0 = [a0, float(x[k]), float(sg0)] + ([base] if off else [])
        elif model == "sine":
            f = (lambda x, A, T, ph, c: A * np.sin(2 * np.pi * x / T + ph) + c) if off else (lambda x, A, T, ph: A * np.sin(2 * np.pi * x / T + ph))
            if len(np.unique(x)) < 4: raise ValueError("cf_sinefew")
            p0 = sine_start(x, y, sy, off)
        else:
            p0 = [float(d["p0"].get(n, 1.0)) for n in names]
            if not np.all(np.isfinite(f(x, *p0))): raise ValueError("cf_p0")
        out, ev = nl_fit(f, x, y, sy, p0, analytic)
        p = out["p"]
        if model == "gauss": p[2] = abs(p[2])
        if model == "sine":
            if p[1] < 0: p[1], p[0], p[2] = -p[1], -p[0], -p[2]
            if p[0] < 0: p[0], p[2] = -p[0], p[2] + np.pi
            p[2] = (p[2] + np.pi) % (2 * np.pi) - np.pi
    xs = np.linspace(float(x.min()), float(x.max()), 500)
    with np.errstate(all="ignore"):
        ys = np.asarray(ev(xs), dtype=float)
    out["names"] = names
    out["curve"] = {"x": xs.tolist(), "y": [float(v) if np.isfinite(v) else None for v in ys]}
    return json.dumps(out)
def run(s):
    d = json.loads(s)
    if d.get("task") == "gof":
        return gof(d)
    if d.get("task") == "curve":
        return curve(d)
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
