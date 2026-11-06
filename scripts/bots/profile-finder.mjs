/**
 * Mr. D.O.M.'s profile hunter 🐒 (weekly): looks for "Bleeding Debts 316" on music platforms using their
 * free public search APIs and the band's usual handle, and lists every profile that is NOT yet on the
 * website (src/content/band/band.json → profiles). Nothing is added automatically: a fake or fan
 * account must never be attached to the band's Google identity. Writes reports/profile-finder.md;
 * exits 1 when there is something new to confirm.
 */
import fs from 'node:fs';
const NAME = 'Bleeding Debts 316';
const HANDLE = 'bleedingdebts316';
const UA = 'BleedingDebts316-site-bot/1.0 (+https://github.com/emilian15octavian-art/Claude-coding-)';
const band = JSON.parse(fs.readFileSync('src/content/band/band.json', 'utf8'));
const known = new Set(Object.values(band.profiles).filter(Boolean).map((u) => u.toLowerCase().replace(/\/+$/, '').replace('://www.', '://')));
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const same = (s) => norm(s) === norm(NAME) || norm(s) === HANDLE;
const found = [];
const notes = [];
const get = async (url, as = 'json') => {
  const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: as === 'json' ? 'application/json' : 'text/html' }, redirect: 'follow', signal: AbortSignal.timeout(20000) });
  return { status: r.status, url: r.url, body: r.ok ? (as === 'json' ? await r.json() : await r.text()) : null };
};
const add = (platform, url, how) => {
  const key = url.toLowerCase().replace(/\/+$/, '').replace('://www.', '://');
  if (![...known].some((k) => key.startsWith(k) || k.startsWith(key))) found.push({ platform, url, how });
};
const tasks = {
  'Apple Music': async () => { const { body } = await get(`https://itunes.apple.com/search?term=${encodeURIComponent(NAME)}&entity=musicArtist&limit=10`); for (const a of body?.results ?? []) if (same(a.artistName)) add('Apple Music', a.artistLinkUrl.split('?')[0], 'Apple search'); },
  Deezer: async () => { const { body } = await get(`https://api.deezer.com/search/artist?q=${encodeURIComponent(NAME)}`); for (const a of body?.data ?? []) if (same(a.name)) add('Deezer', a.link, 'Deezer search'); },
  MusicBrainz: async () => { const { body } = await get(`https://musicbrainz.org/ws/2/artist/?query=${encodeURIComponent(`artist:"${NAME}"`)}&fmt=json`); for (const a of body?.artists ?? []) if (same(a.name)) add('MusicBrainz', `https://musicbrainz.org/artist/${a.id}`, 'MusicBrainz search'); },
  Bandcamp: async () => {
    const { body } = await get(`https://bandcamp.com/search?q=${encodeURIComponent(NAME)}&item_type=b`, 'html');
    for (const m of (body ?? '').matchAll(/<div class="heading">\s*<a href="([^"?]+)[^"]*">\s*([^<]+?)\s*<\/a>/g)) if (same(m[2])) add('Bandcamp', m[1], 'Bandcamp search');
  },
  'Last.fm': async () => { const r = await get(`https://www.last.fm/music/${encodeURIComponent(NAME).replace(/%20/g, '+')}`, 'html'); if (r.status === 200 && /scrobbl/i.test(r.body ?? '')) add('Last.fm', `https://www.last.fm/music/${NAME.replace(/ /g, '+')}`, 'Last.fm page exists'); },
};
const handles = {
  Bandcamp: `https://${HANDLE}.bandcamp.com`, Audiomack: `https://audiomack.com/${HANDLE}`, Mixcloud: `https://www.mixcloud.com/${HANDLE}/`,
  Twitch: `https://www.twitch.tv/${HANDLE}`, Reddit: `https://www.reddit.com/user/${HANDLE}/`, Bluesky: `https://bsky.app/profile/${HANDLE}.bsky.social`,
  Pinterest: `https://www.pinterest.com/${HANDLE}/`, Tumblr: `https://${HANDLE}.tumblr.com`, Kick: `https://kick.com/${HANDLE}`,
};
for (const [p, fn] of Object.entries(tasks)) { try { await fn(); } catch (e) { notes.push(`${p}: could not search (${String(e).slice(0, 80)})`); } }
for (const [p, url] of Object.entries(handles)) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'manual', signal: AbortSignal.timeout(15000) });
    if (r.status === 200) add(p, url, `the handle "${HANDLE}" exists (check it is really you)`);
  } catch { /* not reachable: skip */ }
}
fs.mkdirSync('reports', { recursive: true });
const report = found.length
  ? `🐒 Mr. D.O.M. found ${found.length} possible Bleeding Debts 316 profile(s) that are not on the website yet:\n\n${found.map((f) => `- **${f.platform}**: ${f.url} _(${f.how})_`).join('\n')}\n\n**If one is really yours:** add it to \`src/content/band/band.json\` → \`profiles\` (or tell Claude), and it appears in the footer, on the Links page and in Google's data.\n**If it is a fake or someone else:** ignore it, or report it to that platform.\n${notes.length ? `\nNotes: ${notes.join('; ')}\n` : ''}`
  : `🐒 No new profiles found this week.${notes.length ? ` Notes: ${notes.join('; ')}` : ''}\n`;
fs.writeFileSync('reports/profile-finder.md', report);
console.log(report);
process.exit(found.length ? 1 : 0);
