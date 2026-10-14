# Design: a look that feels familiar to HU students

**Update 2026-10-14 (Luis's call): friendlier look.** Rounded corners (16px cards, pill buttons), indigo `#4F46E5` as the main colour, soft background `#F7F8FD`, orange `#F97316` focus ring, white header with the round logo (`app/logo.jpg`, favicon `app/favicon.jpg`). This replaces the square-corner, HU-blue tokens in the table below; the "Do not" rules still hold.

Measured on 2026-10-13 from https://www.hu-berlin.de/en (computed styles in the browser). We copy the look: colours, type sizes, spacing, square corners. We do not copy anything that says "this is HU".

## Tokens

| Token | Value | Source on hu-berlin.de |
|---|---|---|
| `--blue` | `#00376C` | header bar, footer, links |
| `--paper` | `#FAFAF5` | page background (warm off-white), also text on blue |
| `--ink` | `#000000` | body and heading text |
| Corners | `0` (square), no rounded buttons | buttons have 0 radius |
| Body text | 17px / 27px line height | body |
| Heading 1 | 36px, weight 400, line height 1.17 | h1 |
| Heading 2 | 23px, weight 700 | h2 |
| Heading 3 | 20px; heading 4: 17px | root variables |
| Gutter | 12px | `--gutter-x` |
| Header bar | 81px tall, solid blue, light icons | navbar |
| Breakpoints | 576, 768, 992, 1152px | root variables |
| Links | blue, underlined | `a` |

Chart colours are not taken from HU. Use the blue plus colour-blind-safe colours (see the `dataviz` skill) so series stay distinguishable in print and in grey.

## Fonts

HU uses two licensed web fonts (`ff-scala` for text, `hub-ddin-exp` for headings). We may not copy them. Use free fonts with a similar feel, **bundled with the app, not loaded from Google** (loading from Google Fonts sends the visitor's address to Google, which German courts have ruled against):
- Headings: Barlow (SIL Open Font License), weight 700.
- Body: Source Sans 3 (SIL Open Font License).
- Fallback: `system-ui, sans-serif`.

## Do not

- Do not use the HU name as the app's name, the HU logo, the crest, HU photos, or HU's own font files or style sheets.
- Do not make any page look like an official HU page. The footer says, in German: "Unabhängiges Studierendenwerkzeug. Nicht mit der Universität verbunden." and in English: "Independent student tool. Not affiliated with the university." (the app footer follows the language switch). We do not name the university in anything a user sees.
- Lecturers can ask HU for permission later if they want it co-branded. That is a decision for people, not the loop.
