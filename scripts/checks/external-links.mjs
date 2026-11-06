// Weekly: checks every external link (streaming, social, tickets, Stripe Payment Links, Linktree…).
// Broken links are errors; redirects are listed so you can update them.
import fs from 'node:fs';
import { htmlFiles, requireDist, result } from './lib.mjs';

const r = result('external-links', 'External links: streaming, social, tickets, shop');
requireDist(r);
const site = (process.env.SITE_URL || 'https://claude-coding.bleedingdebts316.workers.dev').replace(/\/$/, '');
const urls = new Map();
for (const f of htmlFiles()) {
  const html = fs.readFileSync(f, 'utf8');
  for (const m of html.matchAll(/<a [^>]*href="(https?:\/\/[^"]+)"/g)) {
    const u = m[1].replace(/&amp;/g, '&');
    if (u.startsWith(site)) continue;
    const clean = u.replace(/([?&])utm_[^&]+/g, '$1').replace(/[?&]+$/, '').replace(/[?&]locale=\w+/, '');
    if (!urls.has(clean)) urls.set(clean, f);
  }
}
const ua = 'Mozilla/5.0 (compatible; BD316-LinkCheck/1.0; +' + site + '/)';
const check = async (url) => {
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(url, { method, redirect: 'manual', headers: { 'User-Agent': ua, Accept: 'text/html,*/*' }, signal: AbortSignal.timeout(15000) });
      if (method === 'HEAD' && (res.status === 405 || res.status === 403 || res.status === 404)) continue;
      return { status: res.status, location: res.headers.get('location') };
    } catch (e) { if (method === 'GET') return { status: 0, error: e.message }; }
  }
};
const entries = [...urls.keys()];
const results = [];
for (let i = 0; i < entries.length; i += 6) results.push(...(await Promise.all(entries.slice(i, i + 6).map(async (u) => ({ u, ...(await check(u)) })))));
const botBlocking = /instagram\.com|facebook\.com|tiktok\.com|x\.com|twitter\.com|linkedin\.com|threads\.net/;
for (const x of results) {
  if (x.status >= 200 && x.status < 300) continue;
  if (x.status >= 300 && x.status < 400) { r.note(`${x.u} redirects (${x.status}) to ${x.location}`); continue; }
  if ((x.status === 403 || x.status === 429 || x.status === 999) && botBlocking.test(x.u)) { r.note(`${x.u} answered ${x.status} (social sites often block link checkers; open it by hand to confirm).`); continue; }
  r.error(`${x.u} is broken (${x.status || x.error})`, 'Open the link. If the page moved, update the URL in the content file (src/content/…); if it is gone, remove it.');
}
r.note(`${results.length} external links checked.`);
r.finish();
