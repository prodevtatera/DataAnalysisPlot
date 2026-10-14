// Step 1 (Phase 1): save and reopen a project; results go stale when data changes.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const { newProject, addResult, isStale, save, open } = createRequire(import.meta.url)("../app/project.js");

const p = newProject(["t / s", "U / V", "sU / V"], [[1, 2.5, 0.1], [2, 4.5, 0.1], [3, null, 0.2]]);
assert.deepEqual(p.columns.map(c => c.role), ["x", "y", "yerr"]);
p.settings.weighted = false;
addResult(p, { kind: "fit", model: "line", params: [{ name: "a", value: 2.01, u: 0.06, unit: "V/s", method: "skaliert" }] });
assert.equal(isStale(p, p.results[0]), false);

const back = open(save(p));
assert.deepEqual(back.project, p, "save then open must give identical data, roles, settings, results");
assert.equal(back.project.columns[1].values[2], null, "empty cell survives");
assert.equal(back.project.results[0].settings.weighted, false, "result remembers its settings");
assert.equal(isStale(back.project, back.project.results[0]), false, "still fresh after reopening");

back.project.columns[1].values[0] = 2.6;
assert.equal(isStale(back.project, back.project.results[0]), true, "edit makes the fit out of date");
back.project.columns[1].values[0] = 2.5;
assert.equal(isStale(back.project, back.project.results[0]), false, "undoing the edit makes it fresh again");

// bad files give a clear German message
const badValue = save({ ...p, columns: [{ name: "a", role: "x", values: ["x"] }] });
for (const bad of ["", "nicht json", "{}", '{"format":"datenplot-projekt","version":2}', badValue])
  assert.match(open(bad).error, /Projekt|Datei|beschädigt/, "bad file: " + bad.slice(0, 20));
console.log("step1-project OK");
