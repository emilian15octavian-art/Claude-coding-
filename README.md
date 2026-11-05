# Bleeding Debts 316: official website

The official website of **Bleeding Debts 316** in 8 languages (English, Français, Română, Italiano, Español, العربية, Русский, Ελληνικά).
It is free to run: the code lives on GitHub, it is hosted on Cloudflare Pages at `https://bleedingdebts316.pages.dev`, and it checks and maintains itself with GitHub Actions.

- First time? Follow **[LAUNCH-CHECKLIST.md](LAUNCH-CHECKLIST.md)** step by step.
- Got an e-mail about a failed check? Read **[MAINTENANCE.md](MAINTENANCE.md)**.
- Scores and audit results: **[REPORT.md](REPORT.md)**.

---

## How it works in one minute

1. You change a text file in `src/content/` (for example add a show).
2. You save it to GitHub (commit + push to the `main` branch).
3. GitHub Actions builds the site and runs every check (content, translations, links, accessibility, speed, security…).
4. If everything passes, the new version goes live on Cloudflare in about 5 minutes. If something fails, **nothing changes on the live site** and you get a GitHub issue (by e-mail) that says what to fix.

You never have to touch the code to update content.

## Editing without installing anything

You can do everything on github.com:

1. Open the repository on GitHub and click the file you want to change (for example `src/content/shows/`).
2. Click the pencil icon ✏️ to edit, or **Add file → Create new file** to add one.
3. Click **Commit changes** and choose *Commit directly to the main branch*.
4. Watch the **Actions** tab: green ✅ means it is live, red ❌ means an issue was opened with the fix.

## Editing on your computer (optional, recommended for photos)

1. Install **Node.js 22** (LTS) from <https://nodejs.org> and **Git** from <https://git-scm.com>.
2. In a terminal:
   ```bash
   git clone https://github.com/YOUR-NAME/YOUR-REPO.git
   cd YOUR-REPO
   npm install
   npm run dev            # opens the site at http://localhost:4321
   npm run dev:examples   # same, with example shows/products/releases so you can see every feature
   ```
3. Before you push, run **`npm run check`**. It runs the same tests as GitHub (about 3 minutes).
4. `git add -A && git commit -m "Add Cluj show" && git push`

---

## Where everything lives

| What | File(s) |
|---|---|
| Band facts, bio, tagline, social profiles | `src/content/band/band.json` |
| Members | `src/content/members/*.json` |
| Releases (albums, EPs, singles) | `src/content/releases/*.json` |
| Shows | `src/content/shows/*.json` |
| Merch | `src/content/merch/*.json` |
| Videos | `src/content/videos/*.json` |
| Gallery photos | `src/content/gallery/*.json` + images in `src/assets/images/gallery/` |
| Press quotes | `src/content/press/*.json` |
| Link-in-bio page (`/links`) | `src/content/links/*.json` |
| Long bio and legal pages, per language | `src/content/pages/<language>/*.md` |
| All interface text (buttons, menus, page titles) | `src/content/i18n/<language>.json` |
| Legal entity, services (Brevo, Turnstile…), shipping costs | `src/content/settings/site.json` |
| Press kit downloads (rider, stage plot, logos) | `public/press/` |
| Colours and fonts | `src/styles/global.css` (top of the file) |

Every folder has an **`examples/`** subfolder with a complete example file. **Copy it one level up and edit it.** Files in `examples/` are never published.

**Rules for all `.json` files:** text goes in "double quotes", items are separated by commas, and there is no comma after the last item. If you break the format, the check tells you the file and line.

Text in **[square brackets]** is a placeholder still to fill in (the content check lists them all).

**Never translate:** *Bleeding Debts 316*, song titles and album titles. Write them the same in every language.

---

## Add a show

Create `src/content/shows/2027-03-14-bucharest.json` (the name is up to you; date first keeps them sorted):

```json
{
  "start": "2027-03-14T20:30",
  "doors": "19:30",
  "timeZone": "Europe/Bucharest",
  "status": "scheduled",
  "venue": {
    "name": "Club Name",
    "street": "Strada Exemplu 10",
    "city": "București",
    "postalCode": "010101",
    "country": "RO"
  },
  "ticketUrl": "https://www.iabilet.ro/your-event",
  "price": { "amount": 50, "currency": "RON" },
  "lineup": ["Bleeding Debts 316", "Support band"]
}
```

- `start` is the **local time at the venue** (`YYYY-MM-DDTHH:MM`). `timeZone` is the venue's zone, for example `Europe/Bucharest`, `Europe/Athens`, `Europe/Rome`, `Europe/Paris`.
- `status`: `scheduled`, `soldout`, `cancelled`, `postponed` or `rescheduled`.
- Free entry: remove `ticketUrl` and `price`, add `"free": true`.
- Optional: `"end"`, `"name"` (festival name), `"image"` (a poster in `src/assets/images/`), `"notes": { "en": "…", "ro": "…" }`.

After the show, do nothing: the daily rebuild moves it to **Past shows** automatically. Visitors get an **Add to calendar** (.ics) button, and Google gets the event data for rich results.

## Add a release

1. Put the cover (square, at least 1400×1400 px, JPG) in `src/assets/images/covers/`.
2. Create `src/content/releases/my-album.json`. Copy `src/content/releases/examples/example-ep.json` and change:
   - `title` (never translated), `type` (`album`, `ep` or `single`), `date` (`YYYY-MM-DD`)
   - `cover`: `"../../assets/images/covers/my-cover.jpg"`
   - `tracks`: title and optional `duration` like `"PT3M45S"` (3 min 45 s) and `isrc`
   - `links`: paste each platform link; leave `null` for platforms you are not on
   - optional `spotifyEmbed`: `"album/<id>"` (the id from the Spotify link) for the click-to-play player

The newest release automatically appears on the home page.

## Add a product (merch)

1. Create a **Payment Link** in Stripe (see LAUNCH-CHECKLIST.md, Stripe section). Copy its `https://buy.stripe.com/...` address.
2. Put a square photo in `src/assets/images/merch/`.
3. Copy `src/content/merch/examples/example-tshirt.json` to `src/content/merch/` and edit it:
   - `name`, `description`, `imageAlt`: one entry per language (English required, the others fall back to English)
   - `priceRON` and `priceEUR` (numbers, no currency sign)
   - `sizes`: `["S","M","L","XL"]` or `[]`
   - `stripeLink`: one link, **or** one per size: `{ "S": "https://buy.stripe.com/…", "M": "https://buy.stripe.com/…" }`
   - `inStock`: `false` shows "Out of stock"

## Add a video

Create `src/content/videos/song-name.json`:

```json
{ "youtubeId": "dQw4w9WgXcQ", "title": "Song Name (Official Video)", "date": "2027-01-20" }
```

The id is the part after `v=` in the YouTube link. The thumbnail is downloaded at build time and served from your own site, so YouTube loads nothing until the visitor presses play.

## Change photos

- **Hero (home page background):** replace `src/assets/images/hero.jpg` (landscape, at least 2400 px wide, dark).
- **Members:** replace `src/assets/images/members/member-1.jpg` etc. (portrait 4:5) and edit `src/content/members/member-1.json` (name, role in each language, photo description).
- **Gallery:** add the photo to `src/assets/images/gallery/`, then create `src/content/gallery/photo-name.json` with `image`, `alt` (description per language), `photographer` and optional `photographerUrl`.
- **Press photo:** replace `src/assets/images/press/press-photo-1.jpg` (high resolution).
- Use JPG or PNG straight from the camera or phone. The site makes AVIF/WebP versions in every size automatically.
- **Describe every photo** in `alt`: who and what is in it, for example *"Bleeding Debts 316 on stage at Quantic, red lights"*. This helps blind visitors and Google.

## Add or correct a translation

- Interface text: `src/content/i18n/<code>.json` (`fr`, `ro`, `it`, `es`, `ar`, `ru`, `el`). Find the same key as in `en.json` and change only the text after the colon. Keep `{words in curly brackets}` exactly as they are.
- When a native speaker has reviewed a file, change `"status": "needs native review"` to `"status": "reviewed"` in its `_meta` block.
- Long texts: `src/content/pages/<code>/bio.md`, `privacy.md`, etc. Change `status:` at the top when reviewed.
- If something is missing in a language, the English text is shown and `npm run check:i18n` lists it.
- A text that is genuinely the same as English (a name, "EP", "Newsletter"…) can be allowed in `src/content/i18n/_allowed-identical.json`.

## Add your social profiles and Linktree links

Open `src/content/band/band.json` → `profiles` and replace `null` with the full `https://` address. Each profile automatically appears as a footer icon, on the `/links` page and in the Google `sameAs` data (this is important for the Knowledge Panel). Extra buttons for the `/links` page go in `src/content/links/` (copy an existing file; `order` controls the position).

## Redeploy

Any push to `main` redeploys. To redeploy without changing anything: GitHub → **Actions** → **Check and deploy** → **Run workflow**.

To roll back to an earlier version: Cloudflare dashboard → **Workers & Pages** → **bleedingdebts316** → **Deployments** → choose an earlier one → **Rollback**.

---

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Local preview with live reload |
| `npm run dev:examples` | Same, including the example content |
| `npm run build` | Build the site into `dist/` |
| `npm run check` | All checks (same as GitHub, without Lighthouse) |
| `npm run check:all` | All checks including Lighthouse (needs Chrome) |
| `npm run check:examples` | All checks on the example content (tests shows, shop and schema) |
| `npm run check:i18n` / `check:links` / `check:a11y` … | One check at a time |

## Technology (for developers)

Astro 7 (static output, no server), plain CSS (custom properties, nesting, container queries, logical properties, cross-document View Transitions), about 3 KB of JavaScript, self-hosted fonts (Nunito, Noto Sans Greek, Noto Sans Arabic; SIL OFL), Zod content schemas, a single Cloudflare Pages Function for the contact form, Playwright + axe-core, html-validate and Lighthouse CI for checks. Fonts © their authors under the SIL Open Font License; brand icons from Simple Icons (CC0).
