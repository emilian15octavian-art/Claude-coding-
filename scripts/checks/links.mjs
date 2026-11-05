// Check 5: internal links, anchors and images. Every href/src/srcset on every page must point to a real file,
// and every #anchor must exist on the target page.
import fs from 'node:fs';
import path from 'node:path';
import { fileFor, htmlFiles, requireDist, result, root, urlOf } from './lib.mjs';

const r = result('links', 'Links: no broken internal links, anchors or images');
requireDist(r);
const site = (process.env.SITE_URL || 'https://claude-coding.emilian15octavian.workers.dev').replace(/\/$/, '');
const idsCache = new Map();
const idsOf = (file) => {
  if (!idsCache.has(file)) idsCache.set(file, new Set([...fs.readFileSync(file, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  return idsCache.get(file);
};
let checked = 0;
for (const f of htmlFiles()) {
  const html = fs.readFileSync(f, 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
  const from = urlOf(f);
  const refs = [];
  for (const m of html.matchAll(/\s(href|src|imagesrcset|srcset|poster|data-full)="([^"]+)"/g)) {
    if (m[1].endsWith('srcset')) for (const part of m[2].split(',')) refs.push(part.trim().split(/\s+/)[0]);
    else refs.push(m[2]);
  }
  for (let ref of refs) {
    if (!ref || /^(mailto:|tel:|data:|javascript:)/.test(ref)) continue;
    if (ref.startsWith(site)) ref = ref.slice(site.length) || '/';
    if (/^https?:\/\//.test(ref) || ref.startsWith('//')) continue; // external: checked weekly
    const [p, hash] = ref.split('#');
    const target = p === '' ? f : fileFor(p.startsWith('/') ? p : new URL(p, `http://x${from}`).pathname);
    checked++;
    if (!target) { r.error(`${from} links to ${ref}, which does not exist`, 'Fix the link in the content file or component, or create the missing page/file.'); continue; }
    if (hash && target.endsWith('.html') && !idsOf(target).has(decodeURIComponent(hash))) r.error(`${from} links to ${ref}, but #${hash} does not exist on that page`, 'Check the anchor name (it is case-sensitive).');
  }
}
r.note(`${checked} internal links and images checked.`);
r.finish();
