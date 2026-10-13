# Ship settings for this project

- The project check is `bash scripts/check.sh`. Run it before every commit. It runs every test in `tests/`. Any failure stops the ship; fix it, do not skip it.
- In the report, say in plain words what the tests cover and what passed.
- Changelog: every ship adds an entry to `CHANGELOG.md` before the commit, so it ships in the same commit. Create the file on the first ship with the heading `# Changelog` and a one-line note that it is written in plain language. Newest entry on top, under a heading with the date and a short title. Each entry has: what a student can now do (or what was fixed), what was tested and the result, and what is not covered yet. No code terms. Skip the entry only if nothing a user could notice changed (docs or tooling only), and say so in the report.
- The unattended loop (scripts/loop.sh) works on one long-lived branch, `loop/work`, and ships with `--no-merge`.
  If a PR for the branch already exists, push to update it. Do not open a second PR.
- No deploy exists. `--stage` and `--prod` do not apply.
