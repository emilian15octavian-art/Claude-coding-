# Launch checklist

Work through this top to bottom. Every service here is free (Stripe only takes a fee per sale).
Tick the boxes as you go. Estimated time: one afternoon for steps 1 to 8, the rest over the following weeks.

---

## 0. Fill in the band details (15 min)

- [ ] `src/content/band/band.json`: `city`, `foundingYear`, the three e-mail addresses (booking, press, shop, contact) and every profile link under `profiles` (copy them from your Linktree).
- [ ] `src/content/members/member-1.json` and `member-2.json`: names, roles in English and Romanian (the other languages fall back to English), and real photos in `src/assets/images/members/`.
- [ ] `src/content/settings/site.json` → `legalEntity`: the name, type (PFA, II or SRL), CUI, Reg. Com. number and address of whoever sells the merch. **This is required by Romanian law before the shop opens.**
- [ ] `public/.well-known/security.txt`: replace `security@example.com` with an address you read.
- [ ] Replace the placeholder photos: `src/assets/images/hero.jpg` and `press/press-photo-1.jpg`, plus `public/press/*.pdf` (your real tech rider and stage plot).
- [ ] Run `npm run check:content`: it lists every placeholder that is left.

## 1. Free GitHub account and repository (10 min)

1. Go to <https://github.com/signup> and create an account (free plan).
2. Create a repository: **+** → **New repository** → name it `bleedingdebts316-site` → **Public** → **Create**. (Public is free with unlimited Actions minutes, and there are no secrets in the code.)
3. Upload this project. On your computer, in the project folder:
   ```bash
   git init && git add -A && git commit -m "First version"
   git branch -M main
   git remote add origin https://github.com/YOUR-NAME/bleedingdebts316-site.git
   git push -u origin main
   ```
   (Without a terminal: on the empty repository page click **uploading an existing file** and drag the project folder's contents in, but **not** the `node_modules` and `dist` folders.)
4. **Settings → Actions → General**: under *Workflow permissions* choose **Read and write permissions** and tick **Allow GitHub Actions to create and approve pull requests**. Save.
5. **Settings → General → Pull Requests**: tick **Allow auto-merge** (for automatic Dependabot updates).
6. **Settings → Branches → Add branch ruleset** (or *Add rule*) for `main`: tick **Require status checks to pass** and add the check **checks** (from *Pull request checks*). This makes sure updates only merge when every test passes.
7. **Settings → Code security**: turn on **Dependabot alerts** and **Dependabot security updates**.
8. Make sure GitHub e-mails you: your profile picture → **Settings → Notifications** → *Watching* → e-mail on. On the repository page click **Watch → All activity**.

## 2. Free Cloudflare account and Pages project (10 min)

1. Sign up at <https://dash.cloudflare.com/sign-up> (free plan; no domain needed).
2. Nothing to install: the first deploy from GitHub creates the Pages project and the free address **https://bleedingdebts316.pages.dev** automatically.
   If the name is taken (the deploy log says so), choose another (for example `bleedingdebts316-band`). Then in GitHub → **Settings → Secrets and variables → Actions → Variables** add `CF_PAGES_PROJECT` = your project name and `SITE_URL` = `https://your-name.pages.dev`.
3. **Do not connect the Git repository in Cloudflare.** Deploys come from GitHub Actions so that a failing check can block them.

## 3. Connect GitHub to Cloudflare (5 min)

1. Cloudflare dashboard → your profile icon → **My Profile → API Tokens → Create Token → Create Custom Token**.
   - Name: `GitHub deploy`
   - Permissions: **Account** → **Cloudflare Pages** → **Edit**
   - Create, then copy the token (it is shown once).
2. Copy your **Account ID**: Cloudflare dashboard → **Workers & Pages** → right-hand side *Account details*.
3. GitHub repository → **Settings → Secrets and variables → Actions → New repository secret**:
   - `CLOUDFLARE_API_TOKEN` = the token
   - `CLOUDFLARE_ACCOUNT_ID` = the account ID
   - (On a phone, the shorter names `CFTOKEN` and `CFACCOUNT` work too.)
4. GitHub → **Actions** → **Check and deploy** → **Run workflow**. After about 10 minutes it should be green and the site live.
   - [ ] Open <https://bleedingdebts316.pages.dev/> and <https://bleedingdebts316.pages.dev/health.json>.

## 4. Turn on the automatic jobs and monitoring (10 min)

- [ ] GitHub → **Actions**: if you see *"Workflows aren't being run on this repository"*, click **I understand my workflows, go ahead and enable them**.
- [ ] Run **Daily show check**, **Weekly link and SSL check** and **Uptime** once by hand (**Run workflow**) to make sure they work.
- [ ] Optional status page: follow the three steps at the top of `upptime/.upptimerc.yml`, **or** create a free UptimeRobot monitor (see MAINTENANCE.md).
- [ ] Cloudflare → **Analytics & Logs → Web Analytics → Add a site** → choose the Pages project → **Enable** (cookieless, free, no banner needed). Cloudflare adds the script automatically. Alternatively paste the token into `site.json` → `services.cloudflareAnalyticsToken`.

## 5. Contact form: Turnstile + Web3Forms (10 min)

1. **Turnstile** (spam protection): Cloudflare dashboard → **Turnstile → Add widget** → name `contact` → hostname `bleedingdebts316.pages.dev` → mode **Managed** → Create.
   - Put the **Site key** in `src/content/settings/site.json` → `services.turnstileSiteKey`.
   - Put the **Secret key** in Cloudflare → **Workers & Pages → bleedingdebts316 → Settings → Variables and secrets → Add** → type *Secret*, name `TURNSTILE_SECRET`.
2. **Web3Forms** (free, e-mails you the messages): go to <https://web3forms.com>, enter the booking e-mail address, and copy the **Access Key** from the e-mail you receive.
   - Cloudflare Pages → **Variables and secrets → Add** → secret `WEB3FORMS_KEY`.
   - If Web3Forms refuses server-side submissions on the free plan, use Formspree instead: create a free form at <https://formspree.io> and add the secret `FORMSPREE_ID` (the part after `/f/`).
3. Set `services.web3formsEnabled` to `true` in `site.json`, commit and push.
4. [ ] Send yourself a test message from `/en/contact/`.

## 6. Newsletter: Brevo (15 min)

1. Sign up at <https://www.brevo.com> (free plan: 300 e-mails/day). Choose EU data storage if asked.
2. **Contacts → Forms → Create a subscription form**. In the form settings:
   - Turn on **Double opt-in** and pick the confirmation e-mail template (make one per language if you like).
   - Add a **consent/opt-in field** (`OPT_IN`).
3. On the **Share** step choose **HTML code**, find the line `<form … action="https://…sibforms.com/serve/…"` and copy that URL.
4. Paste it into `src/content/settings/site.json` → `services.brevoFormAction`, commit and push. The forms on the home page and `/newsletter` start working.
5. [ ] Subscribe with your own address and confirm the e-mail arrives.

## 7. Shop: Stripe Payment Links (30 min)

**Why Stripe Payment Links:** no monthly fee and the lowest cut (about 1.5% + €0.25 for European cards), your own brand, and checkout in Romanian, French, Italian, Spanish, Russian, Greek and English. Bandcamp takes 10–15% on merch and Ko-fi 5% on the free plan, and both send fans to their site.

1. Create an account at <https://dashboard.stripe.com/register> → **Activate payments** with the legal entity from step 0 (Romanian PFA/SRL and a Romanian IBAN).
2. **Product catalogue → Add product** for each item (price in RON). Turn on **Stripe Tax** only if you are VAT registered.
3. **Payment Links → New**: choose the product, tick **Collect customers' addresses → Shipping** and limit the countries to the ones in `site.json` → `shipping.countries`. Add a shipping rate (the same amounts as `site.json` → `shipping`). For sizes either make one link per size, or add a **custom field → dropdown** "Size".
4. Under **After payment** set the confirmation page to *Show confirmation page* and enable **receipt e-mails** (Settings → Customer e-mails).
5. Copy each `https://buy.stripe.com/…` link into the product's `stripeLink`.
6. Romanian invoicing: Stripe is not an invoicing tool. Issue invoices with a free tier tool such as SmartBill or Oblio (ask your accountant).
7. [ ] Buy one item in **test mode** first, then switch to live.
8. [ ] Download the official **ANPC SAL** pictogram from <https://anpc.ro> and add it to `src/components/AnpcBadges.astro` (instructions inside the file).

## 8. Google Search Console and Bing (15 min)

1. <https://search.google.com/search-console> → **Add property → URL prefix** → `https://bleedingdebts316.pages.dev/` → method **HTML tag**. Copy only the `content="…"` value into `site.json` → `services.googleSiteVerification`, push, wait for the deploy, then click **Verify**.
2. In Search Console → **Sitemaps** → submit `sitemap.xml`.
3. <https://www.bing.com/webmasters> → **Import from Google Search Console** (easiest) or add the site with the HTML meta tag → `services.bingSiteVerification`. Submit the sitemap there too. (IndexNow already notifies Bing after every deploy.)
4. [ ] Test pages in the **Rich Results Test**: <https://search.google.com/test/rich-results> with `/en/shows/` (once a show exists), `/en/shop/` (once a product exists) and `/en/`.
5. [ ] Test the share preview: paste a page link into a WhatsApp or Facebook post draft.

## 9. Translations: native review (ongoing)

- [ ] Ask a native speaker to read each language, starting with **Arabic, Russian and Greek**, then French, Italian, Spanish and Romanian. They should check `src/content/i18n/<code>.json`, `src/content/pages/<code>/*.md` and the localised fields in `band.json`.
- [ ] After review, set `"status": "reviewed"` in the file's `_meta` (JSON) or `status: reviewed` (Markdown).
- [ ] Ask a Romanian lawyer or accountant to check the **Romanian** legal pages (the binding version) and `legalEntity`.

## 10. The band's identity on the web (Knowledge Panel groundwork)

Do these in order; each one links back to the website so Google sees one consistent entity.

- [ ] **Spotify for Artists**: <https://artists.spotify.com> → claim your artist profile (you need at least one release on Spotify). Add the website link and bio.
- [ ] **Apple Music for Artists**: <https://artists.apple.com> → claim.
- [ ] **YouTube Official Artist Channel**: once your music is on YouTube Music via your distributor, ask the distributor (or apply in YouTube Studio) to merge your channel into an Official Artist Channel.
- [ ] **MusicBrainz**: create a free account at <https://musicbrainz.org>, add the artist *Bleeding Debts 316* (type Group, area Romania, members, begin date) and your releases; add the official website and social links under *External links*.
- [ ] **Discogs**: <https://www.discogs.com> → add the artist and each physical/digital release.
- [ ] **Wikidata**: <https://www.wikidata.org> → *Create a new item*: label *Bleeding Debts 316*, description "Romanian metal band", instance of (P31) *musical group*, country of origin (P495) *Romania*, genre (P136), inception (P571), official website (P856), MusicBrainz artist ID (P434), Spotify artist ID (P1902), Discogs artist ID (P1953). Wikidata needs references (press articles, MusicBrainz); add them as sources.
- [ ] **Bandsintown for Artists** and **Songkick** (via Tourbox): claim the artist pages and add your shows.
- [ ] Paste every profile link into `band.json` → `profiles` (`wikidata`, `musicbrainz`, `discogs`, `bandsintown`, `songkick` too). They go into the schema `sameAs` list automatically.
- [ ] Update your Linktree (or replace it with `https://bleedingdebts316.pages.dev/en/links/` in your social bios; the outgoing links carry UTM tags so you can see visits in each platform's statistics).
- [ ] **Google Knowledge Panel**: when a panel appears when you search for *Bleeding Debts 316*, click **Claim this knowledge panel** at the bottom of it and verify with your YouTube Official Artist Channel or Search Console. (Panels usually appear only after the entity has several consistent, linked profiles and some press coverage.)

## 11. After launch

- [ ] Read MAINTENANCE.md once so you know what the e-mails mean.
- [ ] Each new show, release or product: add a content file and push. Everything else is automatic.
