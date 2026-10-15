STATUS: RUNNING
Goal: fewer words, and findable by SEO, GEO, AEO; live at https://plot.productledlab.dev
Text budget: home pages at most 60 % of the old word count per language (German 173 total / 79 first screen, English 199 / 87); workbench first screen at most 150; every other page at most 200 words. Enforced by `tests/seo-text.sh`.
Pages decided: indexable = home (DE `/`, EN `/en/`), experiment hub (`/versuche/`, `/en/experiments/`), 12 experiment pages each, method page (`/methode/`, `/en/method/`) = 30 URLs. Not indexed: the workbench `app.html` (`noindex, follow`) and `404.html`. Report: `docs/seo-report.md`.

## Steps
- [x] 1. Baseline and plan
- [x] 2. Cut the text
- [x] 3. Static, crawlable pages
- [x] 4. SEO
- [x] 5. AEO
- [x] 6. GEO
- [x] 7. Speed and quality bar
- [ ] 8. Final check
- [ ] 9. Live and validated
- [ ] 10. Hand-off to Luis

## Log
- 2026-10-15, steps 1 to 7: baseline measured (home 289 words German, 333 English; workbench 225). Home page cut to 168 and 181 words; the home page now has a collapsed block of five questions. 30 static pages are generated from `app/i18n.js` by `scripts/build-pages.mjs` (English home, experiment hub, 12 experiments, method page, each in two languages), plus `sitemap.xml`, `llms.txt`, `robots.txt`, `404.html`, `vercel.json` (trailing slash, cache and security headers, redirects), the share picture `app/og.png` and an IndexNow key file. New checks `tests/seo-site.sh` (titles, descriptions, canonical, language links, sitemap, robots, JSON-LD, fact sheet, links) and `tests/seo-text.sh` (word budget, no sideways scroll at 375 px): pass. Three old tests were adjusted on purpose, none weakened: the home page has no value points and no card subtitles any more, the language switch on the home page is now a link to `/en/`, and the workbench brand link goes to the home page of the chosen language. The numbers of the app are unchanged. Lighthouse (mobile): SEO 100, Accessibility 100, Best practices 100, Performance 99 or 100 on six pages.

## Blocked

## For Luis
Nothing in the live site needs you. To get found, do these by hand (about 20 minutes, once):
1. Google Search Console: open https://search.google.com/search-console, "Add property", choose "Domain", enter `productledlab.dev`, and add the TXT record it shows in Cloudflare (DNS). Then open "Sitemaps" and add `https://plot.productledlab.dev/sitemap.xml`. Under "URL inspection" paste `https://plot.productledlab.dev/` and press "Request indexing".
2. Bing Webmaster Tools: open https://www.bing.com/webmasters, sign in, import the site from Google Search Console (one click), submit the same sitemap. Bing matters because ChatGPT search and Copilot lean on it.
3. After about two weeks, look at "Performance" in Search Console: which searches show PlotLab.
4. The real test for AI answers: ask your daughter to type five questions a student would ask ("Wie mache ich eine Ausgleichsgerade mit Fehlerbalken?", "kostenloses Programm für Praktikumsprotokoll Diagramm", ...) into Google, Bing, ChatGPT and Perplexity and write down whether PlotLab is named. That cannot be tested from here.
5. Optional: if you have a public page about PlotLab (code repository, a post), tell me; AI assistants trust a site more when others link to it, and the structured data can list it.
