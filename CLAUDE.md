# Read this first: this repository is NOT the live site

The live Bleeding Debts 316 website moved to **GitLab** on 6 November 2026:

- Live code: `gitlab.com/bleedingdebts316-group/bleedingdebts316-website` (private, branch `main`)
- Cloudflare builds and deploys the live site from that GitLab project on every push to `main`.
- This GitHub repository is an **outdated copy**. Changes made here never reach the live site.
  Its "Check and deploy" workflow fails at the live-site smoke test for that reason; that is expected.

## Before changing anything for the site

1. Work in the GitLab project, not here. From a cloud session without a GitLab checkout, GitLab is
   reachable through the Composio connector (GitLab toolkit).
2. Check the latest commits on GitLab `main` first: other Claude sessions work there too, and the
   site there is far ahead of this copy (14 languages, photo sessions in the gallery, more pages).
3. After a push to GitLab `main`, confirm the commit's Cloudflare pipeline finished with `success`.

## Gallery facts (GitLab)

- Photos: `src/assets/images/gallery/bd316-NN.jpg`, one entry each in `src/content/gallery/bd316-NN.json`.
- Each entry has `order` (integer) and `set` (`artisfree`, `wall`, `night`, `rooftop`); the gallery page groups by `set`.
