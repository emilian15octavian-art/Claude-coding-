# Audit report (Stage 3)

Date: 5 November 2026 · Build: Astro 7.4, 130 HTML pages (16 pages × 8 languages + root + root 404), 120 share images.

## Result of every automatic check

Run on the real content (`npm run check`) **and** on the example content (`npm run check:examples`, which fills in shows, products, releases, videos, gallery and press quotes so every feature and schema type is tested).

| # | Check | Real content | Example content |
|---|---|---|---|
| 1 | Build, zero errors and zero warnings (incl. `astro check`) | ✅ | ✅ |
| 2 | Content schemas | ✅ | ✅ |
| 3 | Translations (8 languages, no missing/empty/English leftovers) | ✅ | ✅ |
| 4 | HTML validation (html-validate, 130 pages) | ✅ | ✅ |
| 5 | Internal links, anchors, images (≈10,000 references) | ✅ | ✅ |
| 6 | Structured data (MusicGroup, WebSite, WebPage, BreadcrumbList, MusicAlbum, MusicEvent, Product…) | ✅ | ✅ |
| 7 | hreflang (8 + x-default, reciprocal, sitemap) | ✅ | ✅ |
| 8 | Accessibility: axe-core WCAG 2.2 AA, 23 pages in EN/AR/RU/EL × 320/1280 px × dark/light = 92 page views | ✅ 0 violations | ✅ 0 violations |
| 8b | Interactive parts (menu, language notice, theme, embeds, lightbox LTR/RTL, 404 language, no third-party requests before a click) | ✅ | ✅ |
| 9 | Lighthouse CI with budgets (mobile) | ✅ | ✅ |
| 10 | Security (audit, headers, CSP, security.txt, secrets) | ✅ | ✅ |

**Responsive audit:** all 121 pages at **320, 768, 1024 and 1440 px in dark and light mode** (968 page views): 0 horizontal scrolling, 0 overflowing elements, 0 images without width/height. Screenshots were reviewed by eye for EN, AR (RTL), RU, EL, FR and RO.

## Lighthouse (mobile, simulated slow 4G)

| Page | Perf. | Access. | Best pr. | SEO | LCP | CLS | TBT | Weight |
|---|---|---|---|---|---|---|---|---|
| / | 100 | 100 | 100 | 100 | 1670 ms | 0.000 | 0 ms | 114 KB |
| /en/ | 100 | 100 | 100 | 100 | 1659 ms | 0.000 | 0 ms | 114 KB |
| /fr/ | 100 | 100 | 100 | 100 | 1678 ms | 0.000 | 0 ms | 114 KB |
| /ro/ | 100 | 100 | 100 | 100 | 1659 ms | 0.000 | 0 ms | 114 KB |
| /it/ | 100 | 100 | 100 | 100 | 1656 ms | 0.000 | 0 ms | 114 KB |
| /es/ | 100 | 100 | 100 | 100 | 1655 ms | 0.000 | 0 ms | 114 KB |
| /ar/ | 99 | 100 | 100 | 100 | 2114 ms | 0.000 | 0 ms | 212 KB |
| /ru/ | 100 | 100 | 100 | 100 | 1816 ms | 0.000 | 0 ms | 136 KB |
| /el/ | 100 | 100 | 100 | 100 | 1804 ms | 0.000 | 0 ms | 137 KB |
| /en/shows/ | 100 | 100 | 100 | 100 | 906 ms | 0.000 | 0 ms | 100 KB |
| /en/shop/ | 100 | 100 | 100 | 100 | 906 ms | 0.000 | 0 ms | 101 KB |
| /ar/hafalat/ | 100 | 100 | 100 | 100 | 1028 ms | 0.000 | 6 ms | 198 KB |
| /ar/matjar/ | 100 | 100 | 100 | 100 | 910 ms | 0.001 | 0 ms | 199 KB |
| /en/gallery/ (example photos) | 100 | 100 | 100 | 100 | 1738 ms | 0.000 | 0 ms | — |
| /ar/maarad/ (example photos) | 98 | 100 | 100 | 100 | 2348 ms | 0.000 | 0 ms | — |
| /en/shop/, /el/katastima/, /en/videos/ (examples) | 100 | 100 | 100 | 100 | ≤ 1804 ms | 0.000 | 0 ms | ≤ 130 KB |

JavaScript on any page: **≈ 3 KB** (theme, header, language notice; lightbox/embeds/form only where used). Arabic pages are heavier because Arabic needs its own font (two weights, ≈ 100 KB). Scores were measured locally; real-world numbers after deploy are in the monthly Lighthouse issue.

## Brand colours and contrast (WCAG 2.2 AA)

The logo is pure **#000000 / #FFFFFF**, and those are kept exactly as the main colours (dark mode is the default, like the logo; light mode inverts them, like the logo's white boxes). Nothing in the logo needed adjusting.

**What I added or changed:**
- A single accent red, used sparingly (focus rings, active page, badges): **#E5383B** in dark mode and the darker **#C1121F** in light mode, because #E5383B only reaches 4.2:1 on white.
- Grey text (**#B3B3B3** dark / **#4D4D4D** light) chosen to stay above 7:1.
- Form field borders now use the grey text colour (≥ 8:1), because the first border grey (#3D3D3D) was only 1.9:1, below the 3:1 required for input boundaries.

| Pair | Dark | Light |
|---|---|---|
| Text on background | 21.0:1 | 21.0:1 |
| Text on surface (cards) | 18.4:1 | 18.8:1 |
| Grey text on background | 10.0:1 | 8.5:1 |
| Grey text on surface | 8.8:1 | 7.6:1 |
| Button text on primary button | 21.0:1 | 21.0:1 |
| Badge text on accent | 5.0:1 | 6.2:1 |
| Focus ring (accent) on background / surface | 5.0 / 4.4:1 | 6.2 / 5.6:1 |
| Form field border on background | 10.0:1 | 8.5:1 |

## Fonts

- **Nunito** (rounded, heavy; the closest free match to the logo): Latin, including ș ț Ș Ț ă â î, plus French/Spanish/Italian accents and Cyrillic.
- **Noto Sans** for Greek (Nunito has no Greek letters).
- **Noto Sans Arabic** for Arabic.
- All are self-hosted WOFF2 files with `font-display: swap` and a metric-matched fallback (no layout shift). Each language preloads only the script it needs.

## What I could not do, or what needs you

1. **Linktree links:** linktr.ee is blocked from my build environment, so I could not copy your links. Only the Linktree link itself is in the site. Paste your profile links into `band.json` → `profiles` (5 minutes), or allow linktr.ee in the session's network settings and I will do it.
2. **Band facts:** you haven't given me the city, founding year, member names/roles, e-mails or legal entity yet, so these are clearly marked placeholders. Pages hide what is missing; nothing fake is published.
3. **Photos and PDFs** are brand-style placeholders. The tech rider and stage plot are templates.
4. **Translations are drafts**, marked `needs native review`, especially Arabic, Russian and Greek. **Legal texts need a lawyer's review**, the Romanian version first.
5. **Arabic share images** show the page name in English, because the image generator (Satori) cannot shape Arabic text. The Arabic `og:title` and description are in Arabic.
6. **Stripe Checkout has no Arabic**, so Arabic visitors see an English checkout. All other languages are passed with `?locale=`.
7. **Turnstile needs a server-side check**, so the contact form uses one tiny Cloudflare Pages Function (free). Everything else is static. Web3Forms may restrict server-side submissions on its free plan, so the function also supports Formspree.
8. **The ANPC SAL badge** is a text badge. Download the official pictogram from anpc.ro (instructions are in the component). The SOL/ODR link is intentionally left out because the EU ODR platform closed on 20 July 2025.
9. **GitHub Actions workflows** were validated (YAML syntax) and every script they call was run locally. They have not run on GitHub yet: that happens on your first push to `main`. I could not run actionlint because downloading it was not permitted here.
10. **Uptime:** GitHub's scheduler runs at most every 5–10 minutes and is sometimes late. For exact 5-minute checks and a status page, set up Upptime or UptimeRobot (both free, described in MAINTENANCE.md).
11. **npm audit:** 2 *moderate* issues remain in a build-time library (satori → fflate, ZIP parsing that the site never uses). Nothing vulnerable is shipped to visitors. Dependabot will update it when a fix is released. The high-severity issue (basic-ftp via Lighthouse CI) was fixed with an override.
12. **pages.dev:** HSTS is sent, but HSTS *preload* and a custom e-mail domain need your own domain (paid), so they are not included.
