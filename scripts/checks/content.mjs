// Check 2: content files. The Zod schemas (src/content.config.ts) already validate every field during
// the build (required fields, dates, prices, https links, image paths). This check adds plain-language
// warnings about placeholders and missing details that are not errors.
import fs from 'node:fs';
import path from 'node:path';
import { root, result, walk } from './lib.mjs';

const r = result('content', 'Content: every content file is valid and complete');
const content = path.join(root, 'src/content');
const jsonFiles = walk(content).filter((f) => f.endsWith('.json') && !f.includes(`${path.sep}examples${path.sep}`) && !f.includes(`${path.sep}i18n${path.sep}`));
for (const f of jsonFiles) {
  const rel = path.relative(root, f);
  let data;
  try { data = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { r.error(`${rel} is not valid JSON: ${e.message}`, 'Check for a missing comma or quote near the position shown. Paste the file into jsonlint.com to find it.'); continue; }
  const text = JSON.stringify(data);
  for (const m of text.matchAll(/"\[([^\]"]{2,80})\]"/g)) r.note(`${rel}: placeholder still to fill in: [${m[1]}]`);
  if (/example\.com/.test(text)) r.note(`${rel}: contains an example.com address (replace with your real one).`);
  // Images referenced in content must exist (also enforced by the build)
  for (const m of text.matchAll(/"(\.\.\/[^"]+\.(?:jpe?g|png|webp|avif))"/g)) {
    if (!fs.existsSync(path.resolve(path.dirname(f), m[1]))) r.error(`${rel}: image not found: ${m[1]}`, 'Put the photo in src/assets/images/ and check the spelling of the path (it is case-sensitive).');
  }
}
// Shows: flag missing details for future shows
const now = Date.now();
for (const f of walk(path.join(content, 'shows')).filter((f) => f.endsWith('.json') && !f.includes('examples'))) {
  const s = JSON.parse(fs.readFileSync(f, 'utf8'));
  const rel = path.relative(root, f);
  if (Date.parse(s.start) < now - 86400000) continue;
  if (!s.ticketUrl && !s.free) r.error(`${rel}: future show without a ticket link`, 'Add "ticketUrl": "https://…" or set "free": true.');
  if (!s.price && !s.free) r.note(`${rel}: no price given (Google prefers a price for events).`);
  if (!s.venue?.postalCode) r.note(`${rel}: no postal code for the venue (recommended for Google event results).`);
  if (!s.image) r.note(`${rel}: no show image; the default band image is used.`);
}
const band = JSON.parse(fs.readFileSync(path.join(content, 'band/band.json'), 'utf8'));
const missing = Object.entries(band.profiles).filter(([, v]) => !v).map(([k]) => k);
if (missing.length) r.note(`band.json: profiles not filled in yet (they are hidden until you add them): ${missing.join(', ')}`);
if (!band.city) r.note('band.json: "city" is empty (shown as just "Romania").');
if (!band.foundingYear) r.note('band.json: "foundingYear" is empty (hidden from the About page and schema).');
const site = JSON.parse(fs.readFileSync(path.join(content, 'settings/site.json'), 'utf8'));
for (const [k, v] of Object.entries(site.services)) if (v === null || v === false) r.note(`settings/site.json: services.${k} is not set up yet.`);
r.finish();
