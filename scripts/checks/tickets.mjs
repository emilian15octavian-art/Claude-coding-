// Daily: every future show must have a working ticket link (or be free) and complete details.
import fs from 'node:fs';
import path from 'node:path';
import { result, root, walk } from './lib.mjs';

const r = result('tickets', 'Shows: future shows have working ticket links and full details');
const now = Date.now();
const files = walk(path.join(root, 'src/content/shows')).filter((f) => f.endsWith('.json') && !f.includes(`${path.sep}examples${path.sep}`));
let future = 0;
for (const f of files) {
  const s = JSON.parse(fs.readFileSync(f, 'utf8'));
  if (Date.parse(s.start) < now - 86400000) continue;
  future++;
  const rel = path.relative(root, f);
  if (['cancelled', 'postponed'].includes(s.status)) continue;
  for (const k of ['street', 'city', 'country']) if (!s.venue?.[k]) r.error(`${rel}: venue ${k} is missing`, `Add "${k}" inside "venue".`);
  if (!s.venue?.postalCode) r.note(`${rel}: venue postal code missing (recommended).`);
  if (!s.price && !s.free) r.note(`${rel}: price missing (recommended for Google event results).`);
  if (s.free) continue;
  if (!s.ticketUrl) { r.error(`${rel}: no ticket link`, 'Add "ticketUrl" or set "free": true.'); continue; }
  try {
    const res = await fetch(s.ticketUrl, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (BD316 ticket check)' }, signal: AbortSignal.timeout(20000) });
    if (res.status >= 400 && res.status !== 403 && res.status !== 429) r.error(`${rel}: ticket link answers ${res.status}: ${s.ticketUrl}`, 'Check the ticket page still exists and update "ticketUrl".');
    else if (res.status >= 400) r.note(`${rel}: ticket site answered ${res.status} (may block automated checks); open ${s.ticketUrl} by hand.`);
  } catch (e) { r.error(`${rel}: ticket link could not be reached (${e.message}): ${s.ticketUrl}`, 'Open the link in a browser; if it is down, contact the ticket seller.'); }
}
r.note(`${future} future show(s) checked.`);
r.finish();
