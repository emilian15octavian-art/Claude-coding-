/**
 * Mr. D.O.M.'s newsletter secretary 🐒: when a new release, show or video file lands on main,
 * writes a ready-to-send newsletter draft (English + Romanian) to reports/newsletter-draft.md.
 * Usage: node scripts/bots/newsletter-draft.mjs <added files...>
 */
import fs from 'node:fs';
const SITE = (process.env.SITE_URL || 'https://claude-coding.bleedingdebts316.workers.dev').replace(/\/$/, '');
const files = process.argv.slice(2).filter((f) => /src\/content\/(releases|shows|videos)\/[^/]+\.json$/.test(f) && fs.existsSync(f));
if (!files.length) { console.log('Nothing new to announce.'); process.exit(0); }
const items = files.map((f) => {
  const d = JSON.parse(fs.readFileSync(f, 'utf8'));
  const id = f.split('/').pop().replace(/\.json$/, '');
  if (f.includes('/releases/')) return { en: `🎧 New ${d.type || 'release'}: **${d.title}**${d.hook ? `: ${d.hook}` : ''}\n   Listen: ${SITE}/en/music/${id}/`, ro: `🎧 Lansare nouă: **${d.title}**\n   Ascultă: ${SITE}/ro/muzica/${id}/` };
  if (f.includes('/shows/')) { const when = (d.start || '').replace('T', ' '); const where = [d.venue?.name, d.venue?.city].filter(Boolean).join(', ');
    return { en: `🤘 Live: **${where}**, ${when}${d.ticketUrl ? `\n   Tickets: ${d.ticketUrl}` : ''}`, ro: `🤘 Concert: **${where}**, ${when}${d.ticketUrl ? `\n   Bilete: ${d.ticketUrl}` : ''}` }; }
  return { en: `🎬 New video: **${d.title}**\n   Watch: https://youtu.be/${d.youtubeId}`, ro: `🎬 Videoclip nou: **${d.title}**\n   Urmărește: https://youtu.be/${d.youtubeId}` };
});
const body = `🐒 Mr. D.O.M. here! Something new was added to the site, so I wrote the newsletter for you. Copy it into Brevo (or your e-mail) and send it to the subscribers.

---

**Subject (EN):** Bleeding Debts 316: something new just dropped
**Subject (RO):** Bleeding Debts 316: ceva nou tocmai a apărut

**English**

Hey, it's Bleeding Debts 316.

${items.map((x) => x.en).join('\n\n')}

All our links: ${SITE}/en/links/
Thanks for being here. 🖤

**Română**

Salut, aici Bleeding Debts 316.

${items.map((x) => x.ro).join('\n\n')}

Toate linkurile: ${SITE}/ro/linkuri/
Mulțumim că ești aici. 🖤

---
_You get this because you subscribed on our website. Unsubscribe: reply "STOP"._
`;
fs.mkdirSync('reports', { recursive: true });
fs.writeFileSync('reports/newsletter-draft.md', body);
console.log(body);
