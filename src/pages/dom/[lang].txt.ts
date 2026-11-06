import type { APIRoute, GetStaticPaths } from 'astro';
import { locales, localeInfo, type Locale } from '../../i18n/locales';
import { indexablePages, path } from '../../i18n/routes';
import { pick, t } from '../../i18n/t';
import { getBand, getMembers, getPage, getReleases, getShows, getVideos, isPlaceholder } from '../../lib/data';

/**
 * Mr. D.O.M.'s knowledge, one file per language, rebuilt from the content files on every build:
 * band facts, every page with its address in that language (so he can guide visitors), songs,
 * videos, shows and the FAQ. worker/index.js reads it for each chat. Add an answer to the FAQ
 * (src/content/pages/<lang>/faq.md) and he knows it after the next deploy.
 */
export const getStaticPaths: GetStaticPaths = () => locales.map((lang) => ({ params: { lang } }));

export const GET: APIRoute = async ({ params, site }) => {
  const lang = params.lang as Locale;
  const base = site!.toString().replace(/\/$/, '');
  const [band, members, releases, shows, videos, faq] = await Promise.all([getBand(), getMembers(), getReleases(), getShows(), getVideos(), getPage(lang, 'faq')]);
  const named = members.filter((m) => !isPlaceholder(m.data.name));
  const profiles = Object.entries(band.profiles).filter(([, v]) => v);
  const lines = [
    `# Bleeding Debts 316: facts for Mr. D.O.M. (page language: ${localeInfo[lang].nativeName})`,
    `- ${pick(lang, band.shortBio)}`,
    `- Genre: ${band.genre.join(', ')}. From: ${[band.city, band.country].filter(Boolean).join(', ')}.${band.foundingYear ? ` Founded: ${band.foundingYear}.` : ''}`,
    `- Members: ${named.map((m) => `${m.data.name} (${pick(lang, m.data.role)})`).join('; ')}`,
    `- Tagline: ${pick(lang, band.tagline)}`,
    `- Booking and press e-mail: ${band.bookingEmail}`,
    `- The site is in ${locales.map((l) => localeInfo[l].nativeName).join(', ')}.`,
    '',
    '## Pages of this site in this language (give visitors these exact paths)',
    ...indexablePages.map((k) => `- ${t(lang, `pages.${k}.nav`)}: ${path(k, lang)}${k === 'shop' ? ' (NOT OPEN YET: no products, no prices; it opens soon)' : ` (${t(lang, `pages.${k}.description`)})`}`),
    '',
    '## Songs (titles are never translated)',
    ...releases.map((r) => `- ${r.data.title} (${r.data.type}, released ${r.data.date}): ${r.data.hook ? pick(lang, r.data.hook) : ''} Page: ${path('music', lang)}${r.id}/${r.data.links.soundcloud ? ` SoundCloud: ${r.data.links.soundcloud}` : ''}${r.data.youtubeId ? ` Video: https://youtu.be/${r.data.youtubeId}` : ''}`),
    '',
    '## Videos',
    ...videos.map((v) => `- ${v.data.title}: https://youtu.be/${v.data.youtubeId}`),
    '',
    '## Shows',
    ...(shows.upcoming.length
      ? shows.upcoming.map((s) => `- ${s.data.start.replace('T', ' ')}: ${s.data.venue.name}, ${s.data.venue.city}${s.data.ticketUrl ? `, tickets: ${s.data.ticketUrl}` : s.data.free ? ', free entry' : ''}`)
      : ['- No upcoming shows announced yet; fans hear first through the newsletter.']),
    '',
    '## Shop',
    '- The merch shop is NOT open yet: there are no products and no prices. It opens soon; newsletter subscribers hear first.',
    '',
    '## Official profiles',
    ...profiles.map(([k, v]) => `- ${k}: ${v}`),
    '- NOT on Spotify, on purpose.',
    '',
    '## FAQ (official answers, use them)',
    (faq.entry.body ?? '').replace(/\[([^\]]+)\]\((\/[^)]*)\)/g, '$1 ($2)').trim(),
  ];
  return new Response(lines.join('\n').replace(/\n{3,}/g, '\n\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
