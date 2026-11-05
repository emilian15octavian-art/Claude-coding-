// Check 7: hreflang. Every indexable page lists all 8 languages + x-default; each target exists,
// is indexable, and links back (reciprocal). Canonical points to the page itself.
import fs from 'node:fs';
import { fileFor, htmlFiles, langs, requireDist, result, urlOf } from './lib.mjs';

const r = result('hreflang', 'hreflang: all 8 languages + x-default, reciprocal');
requireDist(r);
const site = (process.env.SITE_URL || 'https://bleedingdebts316.pages.dev').replace(/\/$/, '');
const strip = (u) => (u.startsWith(site) ? u.slice(site.length) || '/' : u);
const alts = new Map();
for (const f of htmlFiles()) {
  const html = fs.readFileSync(f, 'utf8');
  if (/name="robots" content="noindex/.test(html)) continue;
  const page = urlOf(f);
  const a = Object.fromEntries([...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => [m[1], strip(m[2])]));
  alts.set(page, a);
  const canon = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if (!canon) r.error(`${page}: no canonical link`);
  else if (strip(canon) !== page) r.error(`${page}: canonical points to ${strip(canon)} instead of itself`);
  const lang = html.match(/<html lang="([^"]+)"/)?.[1];
  if (!langs.includes(lang)) r.error(`${page}: <html lang> is "${lang}"`);
  if (lang === 'ar' && !/<html lang="ar" dir="rtl"/.test(html)) r.error(`${page}: Arabic page without dir="rtl"`);
  for (const l of [...langs, 'x-default']) {
    if (!a[l]) r.error(`${page}: missing hreflang="${l}"`, 'Alternates are added by src/layouts/Base.astro from src/i18n/routes.ts; check the page has a slug for every language.');
    else if (!fileFor(a[l])) r.error(`${page}: hreflang="${l}" points to ${a[l]}, which does not exist`);
  }
}
for (const [page, a] of alts) for (const l of langs) {
  const back = a[l] && alts.get(a[l]);
  if (a[l] && back && !Object.values(back).includes(page)) r.error(`${page} → ${a[l]} (${l}) does not link back`, 'Both pages must list each other as alternates.');
}
// Sitemap must contain the same alternates
const sitemap = fs.existsSync(fileFor('/sitemap.xml') ?? '') ? fs.readFileSync(fileFor('/sitemap.xml'), 'utf8') : '';
if (!sitemap) r.error('sitemap.xml is missing');
else {
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => strip(m[1]));
  for (const page of alts.keys()) if (!locs.includes(page)) r.error(`sitemap.xml does not list ${page}`);
  const perUrl = (sitemap.match(/<url>/g) ?? []).length;
  const altCount = (sitemap.match(/xhtml:link/g) ?? []).length;
  if (altCount !== perUrl * 9) r.error(`sitemap.xml: expected 9 alternates per URL, found ${altCount} for ${perUrl} URLs`);
}
r.note(`${alts.size} indexable pages checked.`);
r.finish();
