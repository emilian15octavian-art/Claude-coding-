import type { APIRoute } from 'astro';
import { locales, localeInfo } from '../i18n/locales';
import { indexablePages, path } from '../i18n/routes';
import { t } from '../i18n/t';
import { getBand, getMembers, getReleases, getShows, isPlaceholder } from '../lib/data';

/** llms.txt: a plain-text summary of the band for AI assistants (https://llmstxt.org). */
export const GET: APIRoute = async ({ site }) => {
  const base = site!.toString().replace(/\/$/, '');
  const [band, members, releases, shows] = await Promise.all([getBand(), getMembers(), getReleases(), getShows()]);
  const named = members.filter((m) => !isPlaceholder(m.data.name));
  const profiles = Object.entries(band.profiles).filter(([, v]) => v);
  const lines = [
    '# Bleeding Debts 316',
    '',
    `> ${band.shortBio.en}`,
    '',
    `- Name: Bleeding Debts 316 (never translated; also written ${band.alternateName.join(', ')})`,
    `- Genre: ${band.genre.join(', ')}`,
    `- From: ${[band.city, band.country].filter(Boolean).join(', ')}`,
    ...(band.foundingYear ? [`- Founded: ${band.foundingYear}`] : []),
    `- Members: ${named.length ? named.map((m) => `${m.data.name} (${m.data.role.en})`).join(', ') : `${members.length} (names to be announced)`}`,
    `- Tagline: ${band.tagline.en}`,
    `- Official website: ${base}/ (available in ${locales.map((l) => localeInfo[l].nativeName).join(', ')})`,
    ...(isPlaceholder(band.bookingEmail) ? [] : [`- Booking: ${band.bookingEmail}`]),
    '',
    '## Pages',
    ...indexablePages.filter((k) => k !== 'home').map((k) => `- [${t('en', `pages.${k}.nav`)}](${base}${path(k, 'en')}): ${t('en', `pages.${k}.description`)}`),
    '',
    ...(releases.length ? ['## Songs', ...releases.map((r) => `- [${r.data.title}](${base}${path('music', 'en')}${r.id}/) (${r.data.type}, ${r.data.date})${r.data.hook ? `: ${r.data.hook.en}` : ''}${r.data.links.soundcloud ? ` Listen: ${r.data.links.soundcloud}` : ''}`), ''] : []),
    ...(shows.upcoming.length ? ['## Upcoming shows', ...shows.upcoming.map((s) => `- ${s.data.start.slice(0, 10)}: ${s.data.venue.name}, ${s.data.venue.city}`), ''] : []),
    ...(profiles.length ? ['## Official profiles', ...profiles.map(([k, v]) => `- ${k}: ${v}`), ''] : []),
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
