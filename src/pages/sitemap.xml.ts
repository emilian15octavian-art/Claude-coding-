import type { APIRoute } from 'astro';
import { locales } from '../i18n/locales';
import { indexablePages, path } from '../i18n/routes';

/** sitemap.xml with hreflang alternates (all 8 languages + x-default) for every page. */
export const GET: APIRoute = ({ site }) => {
  const base = site!.toString().replace(/\/$/, '');
  const today = new Date().toISOString().slice(0, 10);
  const alt = (key: (typeof indexablePages)[number]) =>
    locales.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${base}${path(key, l)}"/>`).join('\n') +
    `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${base}${key === 'home' ? '/' : path(key, 'en')}"/>`;
  const urls = [
    `  <url>\n    <loc>${base}/</loc>\n    <lastmod>${today}</lastmod>\n${alt('home')}\n  </url>`,
    ...indexablePages.flatMap((key) => locales.map((l) => `  <url>\n    <loc>${base}${path(key, l)}</loc>\n    <lastmod>${today}</lastmod>\n${alt(key)}\n  </url>`)),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
