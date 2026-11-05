# Maintenance: what the automatic checks do and what to do when one fails

The site watches itself. You only need to act when you get an e-mail from GitHub about an **issue**.
Every issue says what broke and has a **How to fix** line for each problem.

> **The golden rule:** a failed check never breaks the live site. When something fails, the deploy is blocked and visitors keep seeing the last working version until you fix it.

## The automatic jobs

| When | Workflow (GitHub → Actions) | What it does | If it fails |
|---|---|---|---|
| Every push to `main` | **Check and deploy** | Builds the site, runs all checks below, deploys to Cloudflare, confirms the live site shows the new version, tells search engines (IndexNow) which pages changed | Nothing is deployed. Issue **"Site check failed: deploy blocked"** (label `site-check`). It closes itself when a later run passes. |
| Every day 04:23 UTC | **Check and deploy** (scheduled) | Rebuilds so past shows move to *Past shows* and the © year stays current | Same as above |
| Every day 05:41 UTC | **Daily show check** | Opens every future show's ticket link and checks the show has full details | Issue **"Upcoming show needs attention"** (label `shows`) |
| Every Monday | **Weekly link and SSL check** | Opens every external link (Spotify, Apple Music, YouTube, socials, ticket shops, Stripe, Linktree) and checks the HTTPS certificate, HSTS and that `http://` redirects to `https://` | Issue **"Weekly check: broken links or SSL problem"** (label `links`) |
| Every 10 minutes | **Uptime** | Loads `/en/` and `/health.json` | Issue **"🔴 Site is down"** (label `downtime`), closed automatically when it is back |
| Every Monday | **Dependabot** | Opens pull requests to update libraries | The update is merged **automatically** only if every check passes. Otherwise it waits for you. |
| 1st of every month | **Monthly Lighthouse report** | Speed/accessibility/SEO scores for 5 pages in each of the 8 languages on the live site; full reports as a downloadable artifact | Issue **"Lighthouse report YYYY-MM"** comparing with last month (informational) |

## The checks (run on every push, and with `npm run check` on your computer)

| # | Check | What it makes sure of | Command |
|---|---|---|---|
| 1 | **Build** | The site builds with zero errors **and zero warnings**; types are correct | `npm run check:build` |
| 2 | **Content** | Every content file matches its rules (required fields, valid dates, prices, `https://` links, photos that exist). Lists placeholders and missing details | `npm run check:content` |
| 3 | **Translations** | Every text key exists in all 8 languages, nothing is empty, nothing is accidentally left in English, `{placeholders}` are kept. Lists content that falls back to English | `npm run check:i18n` |
| 4 | **HTML** | Every page is valid HTML | `npm run check:html` |
| 5 | **Links** | No broken internal link, anchor or image in any language | `npm run check:links` |
| 6 | **Structured data** | Every JSON-LD block parses, uses real Schema.org types and has the fields Google needs for the band, events and products; the band is one entity in all languages | `npm run check:jsonld` |
| 7 | **hreflang** | Every page lists all 8 languages + x-default, each pointing to a real page that links back; canonical URLs; the sitemap matches | `npm run check:hreflang` |
| 8 | **Accessibility** | axe-core WCAG 2.2 AA tests on key pages in English, Arabic (right-to-left), Russian and Greek, at phone and desktop width, dark and light mode; no sideways scrolling; touch targets at least 44×44 px | `npm run check:a11y` |
| 8b | **Interactive parts** | Menu, language suggestion, theme toggle, click-to-load videos, lightbox keys (also mirrored in Arabic), 404 language; and **no request to another website before the visitor clicks** (GDPR) | `npm run check:interactive` |
| 9 | **Lighthouse** | Mobile scores ≥ 95 in Performance, Accessibility, Best Practices and SEO; LCP < 2.5 s, CLS < 0.1; budgets: JS ≤ 30 KB, CSS ≤ 40 KB, fonts ≤ 185 KB, images ≤ 400 KB, page ≤ 700 KB, zero third-party requests | `npm run check:lighthouse` |
| 10 | **Security** | No high/critical vulnerable dependencies, the `_headers` file has HSTS, CSP, nosniff, Referrer-Policy, Permissions-Policy and frame protection, security.txt is valid, no secret keys in the files | `npm run check:security` |

Reports are written to the `reports/` folder (and attached to each GitHub run as **check-reports**).

## Common alerts and how to fix them

**"… data does not match collection schema" / "Expected …"**
A content file has a wrong or missing field. The message names the file and the field. Typical causes: a date not in `YYYY-MM-DD` format, a link without `https://`, a price written as `"50 lei"` instead of `50`, a missing comma.

**"image not found" / "Could not find requested image"**
The path in the content file does not match the photo's file name. Paths are case-sensitive: `Photo.JPG` ≠ `photo.jpg`.

**"… is not valid JSON"**
Usually a missing or extra comma, or a missing quote. Paste the file into <https://jsonlint.com> to see the exact spot.

**"fr.json: missing key …" / "still in English"**
A new text was added to `en.json` but not to another language. Add the translation to that language's file. If the text really is the same (a name or an international word), add it to `src/content/i18n/_allowed-identical.json`.

**"links to /fr/… which does not exist"**
A link in a text or content file points to a page that does not exist. Fix the address. Page addresses per language are in `src/i18n/routes.ts`.

**"MusicEvent … is missing …"**
A show is missing a detail Google needs (venue street, city, country, ticket link or price). Fill it in the show's file.

**"Lighthouse … failure"**
Usually a photo that is too large or a new embed. Use photos straight from the camera (the site resizes them), and use the built-in video and player components. Open the HTML report in *check-reports* to see which file is too big.

**"npm audit: … high vulnerabilities"**
A library has a security fix. Wait for the Dependabot pull request (Mondays) or run `npm audit fix` and push.

**"future show without a ticket link" / ticket link answers 404**
The ticket shop changed its address or the event sold out and was removed. Update `ticketUrl`, set `"status": "soldout"`, or set `"free": true`.

**Weekly: "… is broken (404)"**
A streaming or social link no longer works. Update the address in `band.json` → `profiles` or in the release file. Social networks sometimes block checkers (403/429); those are listed as notes and only need a quick manual check.

**"🔴 Site is down"**
1. Open the site yourself. If it works, it was a short glitch and the issue closes itself.
2. Check <https://www.cloudflarestatus.com>.
3. Cloudflare dashboard → **Workers & Pages** → **bleedingdebts316** → **Deployments**. If the latest deploy is broken, choose the previous one → **Rollback**.

**"Cloudflare secrets are not set yet, so nothing was deployed"** (a warning, not a failure)
Finish step 3 of LAUNCH-CHECKLIST.md.

**SSL certificate expires soon**
Cloudflare renews `pages.dev` certificates automatically. If this appears for more than a week, contact Cloudflare support (free plan has community support).

## Things to remember

- **GitHub pauses scheduled jobs after 60 days without any commit** in a public repository. The weekly Dependabot merges usually count as activity. If you get an e-mail from GitHub saying a workflow was disabled, open **Actions**, pick the workflow and click **Enable workflow**.
- **Keep the repository public** for unlimited free Actions minutes. In a private repository the free plan gives 2,000 minutes per month, which the 10-minute uptime check alone would use up. If you make the repository private, delete `.github/workflows/uptime.yml` and use UptimeRobot (below) instead.
- **Every year:** update `Expires:` in `public/.well-known/security.txt` (the security check warns 30 days before). Review the legal pages and the `updated:` dates.
- **Dependabot merges do not deploy immediately** (GitHub does not let automatic merges start another workflow). They go live with the next daily rebuild.

## Optional: status page and faster uptime alerts

- **Upptime** (free, 5-minute checks, public status page): see `upptime/.upptimerc.yml` for the 3 setup steps.
- **UptimeRobot** (free plan, 5-minute checks, e-mail alerts): <https://uptimerobot.com> → Add New Monitor → HTTP(s) → `https://bleedingdebts316.pages.dev/health.json` → keyword monitor for `"status": "ok"` → add your e-mail as alert contact.

## Run the checks on your computer

```bash
npm install
npx playwright install chromium   # once, for the accessibility and interaction checks
npm run check                     # everything except Lighthouse
npm run check:all                 # including Lighthouse (uses your Chrome; set CHROME_PATH if not found)
```
