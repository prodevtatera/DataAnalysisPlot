# SEO, GEO, AEO and less text: report

Date: 2026-10-15. Prompt: `docs/loop-prompt-seo.md`. State: `docs/seo-progress.md`.

**Verdict.** The home page shows 42 % fewer words in German and 46 % fewer in English. Search engines and AI assistants now get 30 complete pages (home, experiment hub, 12 experiments and a method page, each in German and English) that they can read without running JavaScript. All of it is checked by `bash scripts/check.sh` (two new checks, `tests/seo-site.sh` and `tests/seo-text.sh`) and by Lighthouse. The live check is at the end of this file.

## 1. Less text

Counted by `scripts/seo-measure.mjs`: visible words only. Closed question boxes, hidden tools, table cells and drawings are not counted. Measured at 1200 x 800 on a MacBook with headless Chromium, local server.

| Page | Words before (first screen / total) | Words after (first screen / total) | Cut |
|---|---|---|---|
| Home, German | 133 / 289 | 74 / 168 | 42 % of the total |
| Home, English | 146 / 333 | 83 / 181 | 46 % of the total |
| Workbench (first example) | 88 / 225 | 85 / 211 | 6 %, it was already light |
| Experiment pages (new) | none | 104 to 179 words each | |

Budget (`tests/seo-text.sh` fails above it): home at most 60 % of the old count, in each language, total and first screen. Workbench first screen at most 150. Every other page at most 200 words. Also checked: no sideways scrolling at 375 px.

Cookie bar (added to `main` while this round ran): its text was shortened from 31 to 18 words in German; `tests/seo-text.sh` counts the page after the bar was answered and limits the bar itself to 20 words. The generated pages respect "Nein danke": they save their language only when the answer is not "no".

What was cut on the home page: the three value points (the questions block now answers them, collapsed), the subtitle on each of the 12 experiment cards (they moved to the experiment hub page), and the long sentences of the hero, the drop box and the template lead.

Not enforced: "no sentence over 20 words". The step texts of the experiment templates are longer and every one of them is an instruction a student needs, so they stayed.

## 2. What search engines and AI assistants find now

| Item | Before | After |
|---|---|---|
| Pages a crawler can read | 1 German page (202 words of text); English only after JavaScript ran | 30 pages, text in the HTML, each language on its own address |
| Titles and descriptions | one generic title, no description | unique for every page; titles 50 to 60 characters, descriptions 110 to 160 (tested) |
| Canonical, language links (hreflang), x-default | none | on every page, partner pages link back (tested) |
| Share tags (Open Graph, Twitter) and a 1200 x 630 picture | none | every page, picture made from the real example plot |
| `robots.txt`, `sitemap.xml`, 404 page | none | all three; robots names GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended and allows them |
| Structured data (JSON-LD) | none | WebSite, WebApplication (free, no rating), FAQ on the home pages; breadcrumbs on all inner pages |
| Short answers for question boxes and voice | none | first paragraph of each experiment page answers the question; 5 collapsed questions on each home page, mirrored in JSON-LD |
| AI summary file | none | `llms.txt` |
| One set of facts | none | the same sentences on the home page, the method page, `llms.txt` and the JSON-LD (tested) |
| Evidence page | none | "Methode und Prüfung": NIST checks, rounding rule, what is not checked yet (R). Every number on it comes from the phase reports (tested) |
| Bing and IndexNow | none | key file and `scripts/indexnow.sh` |
| Headers | defaults | long cache for the Python engine and fonts, security headers, redirects from `/index.html` |

The workbench `app.html` is a tool and is marked `noindex, follow` so that search results show the content pages, not an empty tool. It stays readable for crawlers.

Decisions made on the way: German is the default and English lives under `/en/`; experiment pages are generated from the same texts the app uses (`app/i18n.js`) by `scripts/build-pages.mjs`, so nothing is written twice; the QtiPlot name and the university's name appear nowhere; no ratings, student numbers or instructor claims; no tracking and no outside request.

## 3. Speed and quality (Lighthouse 12.6.1, mobile profile, local server)

| Page | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|
| / | 99 | 100 | 100 | 100 |
| /en/ | 99 | 100 | 100 | 100 |
| /versuche/ | 100 | 100 | 100 | 100 |
| /versuche/elastizitaet/ | 100 | 100 | 100 | 100 |
| /en/experiments/pendulum/ | 100 | 100 | 100 | 100 |
| /methode/ | 100 | 100 | 100 | 100 |

The home page and the experiment pages load no Python engine. Re-run with `bash scripts/lighthouse.sh [address]`.

## 4. Not verified

- Google and Bing have not indexed the new pages yet; that takes days to weeks. Nothing here promises a ranking.
- Whether ChatGPT, Perplexity or Google AI Overviews name PlotLab when a student asks cannot be tested alone. Steps for Luis are in `docs/seo-progress.md`.
- The R cross-check of the numbers is still open (the method page says so).
- No real student has read the shortened pages.

## 5. Live check

Deployed to production on 2026-10-15 (Vercel, project `data-analysis-plot`, `bash app/setup.sh && cd app && vercel deploy --prod --yes`), then checked against https://plot.productledlab.dev, not the local copy:

- `node scripts/live-check.mjs`: passed. All 30 pages return 200 and are byte for byte the files in `app/`; `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/og.png`, the IndexNow key file and `/app.html` return 200 with the right content type; `/index.html`, `/en/index.html`, `/en` and `/versuche` redirect (301 or 308) to the address with a slash; a missing page gives a real 404 with the 404 page; security headers, HTML revalidation, one-year cache for the Python engine and fonts, and compression are as written in `app/vercel.json`.
- Word counts on the live site: home 168 words (74 on the first screen), English home 181 (83), workbench 211 (85): the same as local.
- Lighthouse on the live site (mobile): performance 100, accessibility 100, best practices 100, SEO 100 on all six pages in the table above.
- Walk in a real browser on the live site: the home page fits the example (D = (2,32 ± 0,03) N/cm), "Beispiel öffnen" opens the workbench with E = (201 ± 8) GPa, an English card opens the English workbench with the template, and the button on a German experiment page opens the German workbench even after English was chosen before. No script errors.
- IndexNow: the 30 addresses were sent to Bing (answer HTTP 202, accepted).

A small bug was found on the way and fixed before the final deploy: a student who had chosen English earlier would open the English workbench from a German experiment page. The generated pages now remember their own language (`tests/seo-handover.sh`).
