# bleeding debts316: Official Website Plan (Stage 1 of 4)

Status: **waiting for approval and band details** (see section 12).
Stages: 1. Plan ← *you are here* · 2. Build · 3. Audit and fix · 4. Deliver (zip + docs).

---

## 1. Key decisions

| Area | Decision | Why |
|---|---|---|
| Framework | Astro 5, `output: 'static'` | Every word, tag and JSON-LD block is in the HTML at build time. No JS framework shipped. |
| JavaScript | About 3 KB on all pages (theme toggle, language hint, header hide/show). Islands only where needed: video/audio facades, lightbox, contact form. | Zero JS where possible. Pages without interactive parts get only the 3 KB core. |
| Hosting | Cloudflare Pages free, `bleedingdebts316.pages.dev` | Free, global CDN, supports `_headers`, HTTPS + HSTS. |
| Deploy gate | **GitHub Actions deploys with `wrangler pages deploy`** after all checks pass. Cloudflare's own "build on push" stays **off**. | Cloudflare's Git integration deploys even when tests fail. Deploying from Actions means a failed check stops the deploy and the last good version stays live. |
| Content | `src/content/*` (Markdown + JSON), validated with Astro Content Collections + Zod schemas | You edit text files, and the build refuses bad data with a clear message. |
| i18n | Astro i18n routing, `prefixDefaultLocale: true`, translated slugs map | `/en/ /fr/ /ro/ /it/ /es/ /ar/ /ru/ /el/`. `/` shows English plus a dismissible "View in your language?" notice. It never redirects. |
| Repo visibility | **Public** repo recommended | Unlimited free Actions minutes (needed for 5-minute uptime checks and Lighthouse). No secrets live in the code. |

## 2. Brand and design tokens

The logo uses pure **#000000** and **#FFFFFF**, with an inverted-box motif ("b" and "316" sit in white boxes with black type). The type is a heavy, rounded, slightly soft geometric sans.

| Token | Dark mode (default, like logo) | Light mode | Contrast |
|---|---|---|---|
| `--bg` | `#000000` | `#FFFFFF` | — |
| `--surface` | `#141414` | `#F2F2F2` | — |
| `--text` | `#FFFFFF` | `#000000` | 21:1 |
| `--text-muted` | `#B3B3B3` | `#4D4D4D` | 10.4:1 / 8.6:1 (AA ✓) |
| `--primary` (box motif) | `#FFFFFF` box / `#000` text | `#000` box / `#FFF` text | 21:1 |
| `--accent` *(proposed, see Q2)* | `#E5383B` | `#C1121F` | 5.0:1 on black / 6.3:1 on white (AA ✓) |

- The logo has no accent colour. I propose a "bleeding" red **only** for focus rings, links and CTAs. Option B is strict monochrome. Your call.
- I'll redraw the logo as inline SVG (paths, so no font dependency) and make the favicon from the "b" box.
- Motif: section headings use the same inverted box on one word or letter.

### Fonts (all SIL OFL, self-hosted WOFF2 from `@fontsource`, no Google CDN)

| Script | Font | Loaded on |
|---|---|---|
| Latin (incl. ș ț Ș Ț ă â î, French/Spanish/Italian accents) | **Nunito** 800/900 display + 400/700 text | en, fr, ro, it, es (+ Latin fallback everywhere) |
| Cyrillic | **Nunito** Cyrillic subset (same family, so the look matches) | ru |
| Greek | **Noto Sans** Greek subset (rounded weights tuned close to Nunito) | el |
| Arabic | **Noto Sans Arabic** | ar |

Each language layout preloads only its own script subsets (`unicode-range` plus a per-locale `<link rel="preload">`), with `font-display: swap` and metric-matched fallbacks to prevent CLS.

## 3. File structure

```
/
├─ astro.config.mjs            i18n, sitemap+hreflang, image, compress
├─ package.json                scripts: dev, build, check, check:*
├─ tsconfig.json
├─ .nvmrc
├─ README.md                   plain language editing guide
├─ MAINTENANCE.md              what each check/alert means and how to fix it
├─ LAUNCH-CHECKLIST.md
├─ REPORT.md                   audit report (written in Stage 3)
├─ public/
│  ├─ _headers                 CSP, HSTS, caching, security headers
│  ├─ _redirects               / stays (no redirect); legacy paths only
│  ├─ robots.txt               allows search + AI crawlers, sitemap link
│  ├─ llms.txt                 generated band summary (built from content)
│  ├─ .well-known/security.txt
│  ├─ favicon.svg  favicon.ico  apple-touch-icon.png
│  ├─ icon-192.png  icon-512.png  icon-maskable-512.png
│  ├─ manifest.webmanifest
│  ├─ press/                   logo pack (SVG, PNG light/dark), rider.pdf, stage-plot.pdf, hi-res photos (zip)
│  └─ <indexnow-key>.txt
├─ src/
│  ├─ content.config.ts        Zod schemas for every collection
│  ├─ content/
│  │  ├─ band.json             name, genre, city, founded, email, sameAs links
│  │  ├─ members/*.json        name, role per language, photo
│  │  ├─ releases/*.md         title (never translated), date, cover, type, tracks, platform links; body per language
│  │  ├─ shows/*.json          date, time, IANA timezone, venue, address, ticket url, price, status
│  │  ├─ merch/*.json          name, photos, RON+EUR price, sizes, Stripe Payment Link per size, stock
│  │  ├─ videos/*.json         YouTube id, title, date
│  │  ├─ gallery/*.json        photo, alt per language, photographer
│  │  ├─ press/*.json          quotes (source, url, text)
│  │  ├─ links/*.json          link-in-bio entries (label per language, url, icon, order)
│  │  ├─ pages/{lang}/*.md     bios, legal pages (privacy, cookies, terms, shipping-returns)
│  │  └─ i18n/{en,fr,ro,it,es,ar,ru,el}.json   all UI strings + "_review" status per key
│  ├─ assets/
│  │  ├─ images/               originals → AVIF/WebP + srcset at build
│  │  ├─ logo.svg
│  │  └─ fonts/ (via @fontsource, subset)
│  ├─ i18n/
│  │  ├─ locales.ts            codes, native names, dir, og:locale, Intl locale
│  │  ├─ routes.ts             translated slugs map (e.g. shows → /fr/concerts/, /ro/concerte/, /ar/hafalat/)
│  │  └─ t.ts                  t() with English fallback + build-time missing-key log
│  ├─ lib/
│  │  ├─ format.ts             Intl dates/times (venue tz), numbers, RON/EUR
│  │  ├─ schema.ts             JSON-LD graph builders (MusicGroup @id constant)
│  │  ├─ seo.ts                titles, canonicals, hreflang, OG
│  │  ├─ ics.ts                .ics generator (static endpoint per show)
│  │  └─ utm.ts
│  ├─ components/              Header, Footer, LangSwitcher, ThemeToggle, SkipLink,
│  │                           ListenButtons, ShowCard, ReleaseCard, ProductCard,
│  │                           YouTubeFacade, SpotifyFacade, BandcampFacade,
│  │                           Lightbox, NewsletterForm, ContactForm, AnpcBadges,
│  │                           Seo, JsonLd, Breadcrumbs, Icon (with dir-aware flip)
│  ├─ layouts/Base.astro       lang/dir, fonts per script, View Transitions
│  ├─ styles/                  tokens.css, base.css, layout.css (logical props, nesting, container queries)
│  └─ pages/
│     ├─ index.astro           English + language hint
│     ├─ 404.astro             language-aware (reads URL prefix, static per-lang copies too)
│     ├─ health.json.ts        build date, version, content counts
│     ├─ og/[lang]/[page].png.ts   1200×630 share images (Satori, build time)
│     └─ [lang]/
│        ├─ index.astro  music/  videos/  shows/ (+ [show].ics)  shop/  about/
│        ├─ gallery/  press/  newsletter/  contact/  links/
│        └─ legal/ privacy, cookies, terms, shipping-returns
├─ functions/
│  └─ api/contact.ts           Cloudflare Pages Function: verifies Turnstile, then forwards to Web3Forms (see note 9)
├─ scripts/checks/             Node check scripts used by CI and `npm run check`
│  ├─ i18n-completeness.mjs  content-validate.mjs  jsonld-validate.mjs
│  ├─ hreflang.mjs  links-internal.mjs  links-external.mjs
│  ├─ headers-validate.mjs  tickets.mjs  report.mjs
├─ lighthouserc.cjs + budgets.json
├─ .pa11yci.json
└─ .github/
   ├─ dependabot.yml
   ├─ ISSUE_TEMPLATE/
   └─ workflows/
      ├─ ci-deploy.yml         push to main: all checks → deploy → IndexNow; on fail: issue
      ├─ pr-checks.yml         same checks on PRs (Dependabot auto-merge if green)
      ├─ daily.yml             rebuild + redeploy, ticket-link check, IndexNow if changed
      ├─ weekly.yml            external links, SSL/response check
      ├─ monthly-lighthouse.yml  all 8 languages → artifact + comparison issue
      └─ (uptime: separate public repo "bleedingdebts316-status" using Upptime)
```

## 4. Pages (×8 languages, translated slugs)

Home · Music · Videos · Shows · Shop · About · Gallery · Press kit · Newsletter · Contact/Booking · Links (link-in-bio) · Privacy · Cookies · Terms · Shipping & Returns · 404. That makes about 15 pages × 8 languages = **about 120 pages**, plus per-show `.ics` files and OG images.

## 5. Shop: platform comparison

| | Stripe Payment Links | Bandcamp merch | Ko-fi Shop |
|---|---|---|---|
| Monthly fee | 0 | 0 | 0 (free plan) |
| Cut | ~1.5% + €0.25 (EEA cards), more for non-EEA | 10% + payment fees | 5% + PayPal/Stripe fees (0% with paid Gold) |
| Stays on your brand | Yes, link from your site to Stripe checkout | No, sends fans to Bandcamp | No, sends fans to Ko-fi |
| Checkout language | Auto from browser: ro, fr, it, es, el, ru, en ✓. **Arabic not supported** (falls back to English) | Limited | English-centric |
| Romanian invoices/VAT | You issue invoices (e.g. SmartBill/Oblio free tier), Stripe gives data | Same | Same |

**Recommendation confirmed: Stripe Payment Links.** Lowest cut, your own brand, Romanian company support. I'll use one Payment Link per product with a size dropdown (Stripe "custom fields") or one link per size if you track stock per size. Prices are shown in RON and EUR; the Stripe link charges the currency you set up (I suggest RON with Stripe's adaptive pricing for EUR).

## 6. Privacy, legal, security

- Cloudflare Web Analytics (cookieless), so no banner. A ready but **disabled** consent module (Consent Mode v2, equal Accept/Reject) is included in case GA4 is ever added.
- All embeds use facades: nothing from YouTube, Spotify or Bandcamp loads before a click. YouTube uses `youtube-nocookie.com` after the click.
- Legal pages in 8 languages with `[LEGAL ENTITY]`, `[CUI]`, `[Reg. Com.]`, `[ADDRESS]` placeholders. Each translation states that **the Romanian version is legally binding**. 14-day withdrawal right (OUG 34/2014).
- ANPC **SAL** and **SOL** badges (ANPC Order 449/2022) on the shop and in the footer. Note: the EU ODR platform closed in July 2025, so I will **not** link it.
- `_headers`: strict CSP (self + Cloudflare Insights, Turnstile, Brevo, YouTube-nocookie, Spotify, Bandcamp frames only after a click), HSTS, `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `frame-ancestors 'none'`, immutable caching for `/_astro/*`.
- ⚠️ I'm not a lawyer. The legal texts are solid templates, but a Romanian lawyer or accountant should review them before the shop goes live.

## 7. SEO and schema

- One JSON-LD `@graph` per page: `MusicGroup` (`@id: https://bleedingdebts316.pages.dev/#band`, identical in every language), `WebSite` (inLanguage: all 8), `WebPage`, `BreadcrumbList`, `MusicAlbum`/`MusicRecording`, `MusicEvent`, `Product`+`Offer` (with `shippingDetails`, `hasMerchantReturnPolicy`).
- Canonical URL is each page's own language version. hreflang ×8 + x-default in `<head>` and the sitemap. OG/Twitter tags with `og:locale:alternate`. Each page gets a 1200×630 share image generated at build time.
- `robots.txt` allows Googlebot, Bingbot, GPTBot, ClaudeBot, PerplexityBot, Google-Extended and others. `llms.txt` is generated from content.
- Search Console and Bing verification placeholders are clearly commented in `Base.astro`. IndexNow runs after each deploy, only for changed URLs.

## 8. Automated checks (GitHub Actions)

On push to main, in order; any failure → **no deploy** + GitHub issue (emails you) with a plain-language fix:

1. `astro check` + build, with warnings treated as errors
2. Content schemas (Zod) plus a check that every referenced image or file exists
3. Translation completeness: missing or empty keys, untranslated English (allow-list for names and titles), report per language
4. HTML validation (`html-validate`)
5. Internal links, anchors and images (`linkinator` on `dist/`)
6. JSON-LD: parses, checks Schema.org types and Google-required fields
7. hreflang reciprocity
8. Accessibility (`pa11y-ci` with axe) on en, ar, ru, el key pages, at 320px and 1440px, in both themes
9. Lighthouse CI (mobile) with budgets: every score ≥ 95, JS ≤ 30 KB, page ≤ 500 KB, image ≤ 200 KB
10. `npm audit --audit-level=high` + `_headers` validator

Scheduled: daily rebuild/deploy + ticket-link check, weekly external links + SSL, Dependabot weekly (auto-merge when green), monthly Lighthouse for all languages (artifact + comparison issue). Uptime via **Upptime** (separate public repo, 5-minute checks, free status page on GitHub Pages, email via GitHub issues). UptimeRobot is optional as a second alert channel.

`npm run check` runs checks 1–8 and 10 locally. Lighthouse runs locally with `npm run check:lighthouse`.

## 9. Things to know up front

1. **Turnstile needs a server-side check.** A pure static page can't verify it. I'll use one tiny **Cloudflare Pages Function** (free, 100k requests/day) to verify Turnstile and forward to Web3Forms. Everything else stays static.
2. **The deploy gate** requires a Cloudflare API token stored as a GitHub secret. The README walks you through it step by step.
3. **pages.dev limits:** you can't use HSTS preload or a custom email domain. Search Console works as a "URL-prefix" property.
4. **Stripe Checkout has no Arabic**, so Arabic visitors see English checkout.
5. **Translations** are drafted by me and every key is marked `needs native review`.
6. **Lighthouse 95+** is very achievable on this stack. Third-party facades keep it so.

## 10. Build order (Stage 2)

1. Scaffold, tokens, fonts, base layout, i18n routing, header/footer/switcher
2. Content schemas + sample content (from your details)
3. All pages + components + schema/SEO
4. Legal pages, `_headers`, security.txt, llms.txt, manifest/icons, OG images
5. Check scripts + workflows + Upptime config
6. Docs: README, MAINTENANCE, LAUNCH-CHECKLIST

## 11. Stage 3 audit

Run every check, then screenshot each page at 320, 768, 1024 and 1440 in both themes for all 8 languages with Playwright (Arabic RTL reviewed by hand). Lighthouse per language goes into `REPORT.md`, which also lists anything not fixable.

## 12. Information I need from you

See the questions in chat. Anything you leave blank becomes a clearly marked `TODO` placeholder.
