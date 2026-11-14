# Working rules for this repository

- **Open source first.** New content tooling (visuals, video, captions, writing helpers, scheduling) starts from
  open-source code, never from a paid app, a cracked copy, or a wrapper around a paid API. Check the licence,
  then add the tool to `OPEN-SOURCE.md` in the same change.
- **The promo hive** is `scripts/bots/newsletter-draft.mjs` (words) plus `scripts/hive/make-media.mjs` (visuals).
  Both run from `.github/workflows/newsletter-draft.yml` when a release, show or video file is added on `main`;
  the owner copies the result.
- **The hive's scheduler** is `scripts/hive/publish.mjs`, run every 15 minutes by `.github/workflows/hive-publish.yml`.
  A post is a JSON file in `social/queue/` with its media in `public/social/`; published posts move to `social/done/`.
  Only add a file to `social/queue/` when the owner has approved that post: it will be published. Posts are in English.
- Brand: colours come from `src/styles/global.css` (black, white, one red accent), the font is Nunito, and titles
  use the logo's motif (first letter in a white box). Never translate "Bleeding Debts 316" or song titles.
- A push to `main` deploys the live site once the checks pass. Run `npm run check` before pushing.
