You are one round of a loop. Each round is a fresh session with no memory, so everything you need is in files. Do exactly one step, then stop.

# Goal

Make https://plot.productledlab.dev (PlotLab, the free data-analysis and plotting page for first and second-year biology students in Germany) do two things, and put both live:

A. **Less text.** No page shows more words than a student needs at that moment. Too much text overwhelms students.
B. **Findable by people, search engines and AI answer engines.** three things, each with its own step below:
   - **SEO**: the pages rank in Google and Bing (step 4).
   - **AEO** (answer engine optimisation): a question typed into a search box, a featured snippet or a voice assistant gets a short answer taken from the site (step 5).
   - **GEO** (generative engine optimisation): AI assistants such as ChatGPT, Perplexity, Gemini and Google AI Overviews know what PlotLab is, trust it, and name or cite it when they answer (step 6).
   All pages, all content.

The two goals pull against each other. The rule that settles it: **visible text stays short; the findable detail lives in markup that students do not have to read** (title, description, headings, structured data, short collapsed questions, sitemap, `llms.txt`). Never add a paragraph to a page just for a search engine.

# Round procedure

0. Sync. `git fetch origin`. If `origin/main` has commits your branch lacks and `git status` is clean, `git rebase origin/main`. If it conflicts, `git rebase --abort`, set `STATUS: BLOCKED` in `docs/seo-progress.md`, name the files, stop.
1. Read `CLAUDE.md`, `docs/design.md`, `docs/seo-progress.md` (create it from the template below if missing). If it says `STATUS: DONE` or `STATUS: BLOCKED`, stop and change nothing. If `git status` shows uncommitted changes, they belong to the first unchecked step: inspect, finish or fix, do not start over.
2. Do only the first unchecked step under "Steps". If it is too big for one session, split it in `docs/seo-progress.md` and do the first piece.
3. Prove it works. Luis cannot test the product, so you must:
   - Write `tests/seo-<step>.sh` (exit 0 pass, non-zero fail, runs without you). `bash scripts/check.sh` runs all tests; every old test runs again each round. Adjust an old test only when text was shortened on purpose, say so in the Log, and never weaken a number check (the numeric results of the app must not change).
   - For anything a student sees, drive the real page in Playwright at 1200x800 and 375x800, save a screenshot to `evidence/seo-<step>.png`, open it with Read, and judge it as a first-year student: is it clear what to do next, is anything crowded, does it still look finished. Fix and re-shoot, up to 3 times. Write your verdict in the Log.
   - Run `bash scripts/check.sh` and read the real output. Fix failures, up to 3 tries. Never call a step done without showing it working: paste the real numbers (word counts, validator output) into the Log.
4. Update `docs/seo-progress.md`: tick the step only if `bash scripts/check.sh` passes; one Log line for a reader who cannot read code (what changed, what was measured, pass or fail).
5. Ship. Run the ship skill with `--no-merge` (this repo's rule: never push to main). If ship does not report Shipped or Pushed, PR open, fix the cause and run ship again, up to 3 times, then `STATUS: BLOCKED`.
6. Only in the Live step (step 9): deploy.

# Rules that decide things for you

- **Language.** German first and default. The English version must be a real separate address (`/en/`), not only a JavaScript switch, because search engines and AI crawlers read the HTML they are given and many do not run JavaScript. Each language page needs its text already in the HTML (not filled in by `i18n.js` after load), `<html lang>` correct, and `hreflang` links between them plus `x-default` (German).
- **One canonical address per page**, absolute, with `https://plot.productledlab.dev`. Keep `.html` out of public links if Vercel `cleanUrls` makes that safe; otherwise be consistent. Redirect the other form to the canonical one.
- **Which pages get indexed.** Home (DE and EN) and one short page per experiment template (12 templates in `app/templates.js`) are worth indexing: a student searches for the experiment ("Michaelis-Menten", "Eichgerade", "Lambert-Beer", "Halbwertszeit" and so on; take the real list from `app/templates.js` and the checklist, do not invent experiments). The workbench `app.html` and the Python engine files are tools, not content: `noindex` for the workbench states that are not a landing page, but the workbench must stay crawlable (no robots block) so scripts and styles render for Google. Decide the exact set in step 1 and write it in the Log.
- **Truth only.** Nothing that is not true or not measured: no instructor claims, no student counts, no ratings, no `aggregateRating`, no "used by", no fake reviews, no invented dates. Numbers (download size, speed, "no signup") must come from a measurement or from the code. Do not name the university (the product wording is "university"). Do not use the QtiPlot name or logo, in text, keywords or alt text (trademark rule in `CLAUDE.md`). No claim that PlotLab is more correct than another tool unless a test in `tests/` shows it.
- **Free fonts, no outside requests, no tracking.** Do not add analytics, tag managers, cookie banners or any request to another host. Everything stays bundled. Privacy is a selling point ("Daten bleiben auf deinem Rechner"), keep it true.
- **Design.** Everything a student sees follows `docs/design.md` and the current look. Added elements must look finished on mobile.
- **Accessibility counts as SEO.** One `h1` per page, headings in order, descriptive `alt` text on every meaningful image (empty `alt` on decoration), link text that makes sense alone, labels on inputs, enough contrast.

# Steps

Work through in order. The loop writes the exact list (10 steps) into `docs/seo-progress.md` in round 1 (step 1 below) and keeps it accurate.

1. **Baseline and plan (no site change yet).** Measure and record in `docs/seo-report.md`: for every page (`app/index.html`, `app/app.html`, and whatever the DE/EN and template pages will be) the visible word count at first view and in total, the number of headings, buttons and sections, page height at 1200x800, the HTML size and what a crawler without JavaScript sees (fetch with `curl` and strip tags: is the German text there or empty?). List what is missing for SEO/GEO/AEO from this list: title, meta description, canonical, hreflang, Open Graph and Twitter tags, social image, `robots.txt`, `sitemap.xml`, `llms.txt`, JSON-LD, FAQ, heading structure, alt text, `lang`, 404 page, headers, redirects. Set the text budget: first view of the home page at most 60% of its current visible words, no sentence over 20 words, no paragraph over 3 sentences; workbench first view at most 150 visible words outside the user's own data. Write the page set and the budget into the Log. Test: `tests/seo-1.sh` checks that `docs/seo-report.md` has the table and that the baseline numbers are re-measurable by a script `scripts/seo-measure.mjs` (this script is reused by every later test; it must print one line per page: words visible at first view, total words, headings, buttons).
2. **Cut the text.** Home page, workbench and every template page: delete or shorten until the budget holds. Prefer deleting over rewording. Long explanations move into a collapsed `<details>` or a tool's own panel that opens on demand (what is hidden still reads in the HTML for crawlers, which is fine). Keep every instruction a student needs to finish an experiment: the numbered steps of a template stay, shortened. Test: `seo-measure.mjs` stays under budget on every page in German and English; every old test passes (numbers unchanged); screenshots judged.
3. **Static, crawlable pages.** Put the German text into the HTML itself and make the English version an own page at `/en/`; `i18n.js` still drives the workbench, but a page that should be indexed must be complete without running JavaScript. Add the per-experiment pages decided in step 1 (a short page each: the question, the 3 to 5 steps, one example result line, a button "In PlotLab öffnen" that opens the workbench with that template). Reuse the template texts from `app/templates.js`; do not write them twice (generate the pages from that file with a small script in `scripts/`, run by `app/setup.sh` or committed output, whichever keeps the Vercel deploy simple). Test: `curl` each page without JavaScript and check the main text, the `h1` and the language are present; the "open in PlotLab" links land in the workbench with the right template.
4. **SEO (be ranked in Google and Bing).** For every indexable page: unique `<title>` (50 to 60 characters, keyword first, brand last), unique meta description (120 to 155 characters, says what the student gets), canonical, `hreflang` set (DE, EN, x-default), Open Graph and Twitter card tags with a real social image (1200x630, made from a true screenshot or a clean graphic in the app's look, in `app/`), `theme-color`, correct `lang`. Add `robots.txt` (allow all, link the sitemap; also decide per AI crawler: allow `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, `OAI-SearchBot` explicitly, because the site wants to be cited), `sitemap.xml` with all indexable URLs and `xhtml:link` alternates, a real `404.html`, `vercel.json` with `cleanUrls`, redirects, and cache headers: long cache for the big files, short cache for HTML (this also closes the open hosting item in `CLAUDE.md`). Test: `tests/seo-4.sh` checks every one of those per page with a script (lengths, uniqueness across pages, canonical equals own URL, hreflang pairs point back to each other, sitemap lists exactly the indexable pages, robots.txt has no block of the home page, no `noindex` on indexable pages, `noindex` where decided).
5. **AEO (give the short answer).** Every indexable page answers its question in the first 40 words, in plain sentences that make sense alone. Headings on the experiment pages are the questions students type ("Wie bestimme ich die Halbwertszeit?"), each followed by a 40 to 60 word answer, then the steps as a real numbered list. A `FAQPage` block on the home page: 5 to 6 real questions ("Ist PlotLab kostenlos?", "Muss ich mich anmelden?", "Bleiben meine Daten auf meinem Rechner?", "Kann ich Kommas als Dezimaltrenner nutzen?", "Welche Fitarten gibt es?", "Wie runde ich das Ergebnis (Wert ± u) richtig?"), 1 to 2 sentences each, visible in collapsed `<details>` and mirrored in JSON-LD. `HowTo` JSON-LD on an experiment page only if the page really shows those steps. Use the exact words students search for (Ausgleichsgerade, Fehlerbalken, gewichteter Fit, Messunsicherheit, Eichgerade) where they are true. Test: a script checks the first 40 words of every page, that each question heading has an answer under it, and that every JSON-LD answer also appears in the visible text.
6. **GEO (be known, trusted and cited by AI assistants).** AI assistants quote sources that are clear, consistent and checkable.
   - **One fact sheet, same everywhere.** Write the facts once (name, what it is, who it is for, price 0 EUR, languages, no signup, data stays in the browser, which browsers) and use the identical wording in the home page, `llms.txt`, the JSON-LD and the FAQ, so engines see one consistent entity.
   - **JSON-LD entities** on each indexable page, valid and matching visible text: `WebSite` (name, URL, `inLanguage`), `WebApplication`/`SoftwareApplication` (`applicationCategory` EducationalApplication, free `offers`, `isAccessibleForFree`, no rating), `BreadcrumbList` on experiment pages. Add `Organization` or `Person` as publisher only if a real, named publisher exists; `sameAs` only with real profile links (for example the public code repository, if there is one). Never invent.
   - **A short "Methode und Prüfung" page** (and its English twin) with checkable facts: results are checked against NIST reference values and hand calculations, how uncertainty is reported, how rounding follows the (value ± u) unit rule, the list of fit types. Take every number from `docs/nist-results.md`, `docs/nist-curve-results.md` and the phase reports; cite where it comes from. This is the page an AI can cite to justify trusting the tool. Keep it short.
   - **`llms.txt`** (short Markdown: what PlotLab is, who it is for, what it does and does not do, key pages one line each, language, price, privacy) and optionally `llms-full.txt`.
   - **Crawler access:** `robots.txt` explicitly allows the AI crawlers named in step 4. Keep text in HTML, not images, so they can read it.
   - **Bing and IndexNow.** ChatGPT search and Copilot lean on Bing's index, so Bing matters as much as Google. Add an IndexNow key file and a small script `scripts/indexnow.sh` that pings Bing with all indexable URLs (run it in the Live step).
   - **Freshness:** `lastmod` in the sitemap from the real git date of each page, and a visible "Stand: <date>" on the methods page only if kept true.
   Test: JSON-LD validates (parses, required properties present, types right); the fact sheet values are identical in every place that states them (script compares); the methods page numbers match the reports; every claim in JSON-LD appears in visible text; `llms.txt` links all return 200 locally.
7. **Speed and quality bar.** Search engines rank on it and students leave without it. Measure with Lighthouse (`npx lighthouse`, mobile and desktop, home and one experiment page) and record scores in `docs/seo-report.md`. Targets: SEO 100, Accessibility at least 95, Best Practices at least 95, and Performance at least 90 on the home page (the Python engine must not load on the home page or on the experiment landing pages). Fix what is cheap; for what is not, write why. Check Core Web Vitals proxies: no layout shift from images or fonts (set `width`/`height`, `font-display: swap`, preload the main font), images in modern format and sized. Test: `tests/seo-6.sh` fails if the home page Lighthouse SEO or Accessibility score is below target.
8. **Final check.** Run the whole `bash scripts/check.sh`; run the full local walk-through in a real browser (home DE, home EN, three experiment pages, example opens in the workbench, a dropped CSV works, text budget holds on every page); judge screenshots at 1200x800 and 375x800; write `docs/seo-report.md` (before and after numbers, what was measured, what is not verified, e.g. "Google has not indexed it yet"); update the Documents list and the Live line in `CLAUDE.md`.
9. **Live and validated.** Deploy exactly as `CLAUDE.md` says: `bash app/setup.sh && cd app && vercel deploy --prod --yes`. Then check the real live site, not the local one, with `curl` and Playwright against `https://plot.productledlab.dev`: every indexable URL returns 200 with the right canonical, `hreflang`, `title`, JSON-LD and visible text without JavaScript; `/robots.txt`, `/sitemap.xml` and `/llms.txt` return 200 with the right content type; the old address forms redirect to the canonical one with 301; a missing page returns the real 404; the headers (cache, security) are as written; the live text budget (`seo-measure.mjs` against the live URL) holds; Lighthouse against the live home page meets the targets. Add the results to `docs/seo-report.md` with the date. If the live check finds a problem, fix it, redeploy and re-check, up to 3 times, then `STATUS: BLOCKED` with the evidence. Do the deploy only after steps 1 to 8 are ticked and `bash scripts/check.sh` passes.
10. **Hand-off to Luis.** Things only a person can do, written under "For Luis" in `docs/seo-progress.md` in plain language and with exact clicks: add the site in Google Search Console and Bing Webmaster Tools (verify by the DNS record in Cloudflare), submit `sitemap.xml`, request indexing for the home page, wait about two weeks, then look at which searches show it; ask Luis's daughter to type five real student questions into Google and ChatGPT and check if PlotLab is named. Also in this step: run `scripts/indexnow.sh`, and ask Luis's daughter to type five real student questions into Google, Bing, ChatGPT and Perplexity and note whether PlotLab is named (that is the real GEO/AEO test; it cannot be run alone). Then `STATUS: DONE`.

# State file template (`docs/seo-progress.md`)

```
STATUS: RUNNING
Goal: fewer words, and findable by SEO, GEO, AEO; live at https://plot.productledlab.dev
Text budget: (filled in step 1)
Pages decided: (filled in step 1)

## Steps
- [ ] 1. Baseline and plan
- [ ] 2. Cut the text
- [ ] 3. Static, crawlable pages
- [ ] 4. SEO
- [ ] 5. AEO
- [ ] 6. GEO
- [ ] 7. Speed and quality bar
- [ ] 8. Final check
- [ ] 9. Live and validated
- [ ] 10. Hand-off to Luis

## Log
## Blocked
## For Luis
```

# STATUS rules

- `STATUS: RUNNING` while there is work you can do alone.
- `STATUS: BLOCKED` when you need something only Luis can give (a decision, a login, a package not allowed), or the same check failed in 3 rounds in a row. Write the exact question under "Blocked", still run ship so the work is saved, stop.
- `STATUS: DONE` only after step 9 passed against the live site and step 10 is written.

# Safety

Do not push to main. Do not delete files you did not create. Do not weaken or delete an existing test to make something pass. Install packages only with `npm install` when a step needs them and name them in the Log. Deploy only in step 9. Do not change any numeric result of the app. Do not add third-party scripts, fonts or tracking.
