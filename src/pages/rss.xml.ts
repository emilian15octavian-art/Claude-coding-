import type { APIRoute } from 'astro';
import { path } from '../i18n/routes';
import { getBand, getReleases, getShows, getVideos } from '../lib/data';

/** RSS feed of new releases, videos and shows, so fans, apps and music blogs can follow the band automatically. */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const GET: APIRoute = async ({ site }) => {
  const base = site!.toString().replace(/\/$/, '');
  const [band, releases, videos, shows] = await Promise.all([getBand(), getReleases(), getVideos(), getShows()]);
  const items = [
    ...releases.map((r) => ({ title: `New ${r.data.type}: ${r.data.title}`, link: `${base}${path('music', 'en')}${r.id}/`, date: r.data.date, text: r.data.hook?.en ?? '' })),
    ...videos.map((v) => ({ title: `New video: ${v.data.title}`, link: `https://youtu.be/${v.data.youtubeId}`, date: v.data.date, text: v.data.title })),
    ...shows.upcoming.map((s) => ({ title: `Live: ${s.data.venue.name}, ${s.data.venue.city}`, link: `${base}${path('shows', 'en')}`, date: s.data.start.slice(0, 10), text: `${s.data.start.replace('T', ' ')} at ${s.data.venue.name}, ${s.data.venue.city}` })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Bleeding Debts 316</title>
  <link>${base}/en/</link>
  <description>${esc(band.shortBio.en)}</description>
  <language>en</language>
  <atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml"/>
${items.map((i) => `  <item>
    <title>${esc(i.title)}</title>
    <link>${i.link}</link>
    <guid isPermaLink="false">${esc(i.title)}</guid>
    <pubDate>${new Date(`${i.date}T12:00:00Z`).toUTCString()}</pubDate>
    <description>${esc(i.text)}</description>
  </item>`).join('\n')}
</channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
