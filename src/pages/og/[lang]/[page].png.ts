/**
 * 1200×630 share images (Open Graph / Twitter), one per page and language, generated at build time
 * in the brand style. Satori cannot shape Arabic, so on Arabic pages the heading is added afterwards
 * as SVG text and drawn right-to-left by resvg (which shapes Arabic) with Noto Sans Arabic.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { locales, type Locale } from '../../../i18n/locales';
import { indexablePages, type PageKey } from '../../../i18n/routes';
import { t } from '../../../i18n/t';
import logoSvg from '../../../assets/logo.svg?raw';
import { woffToSfnt } from '../../../lib/woff';

const require = createRequire(import.meta.url);
const font = (p: string) => fs.readFileSync(require.resolve(p));
type Fonts = NonNullable<Parameters<typeof satori>[1]['fonts']>;
let fonts: Fonts | undefined;
const loadFonts = (): Fonts => (fonts ??= [
  { name: 'Nunito', data: font('@fontsource/nunito/files/nunito-latin-900-normal.woff'), weight: 900, style: 'normal' },
  { name: 'NunitoExt', data: font('@fontsource/nunito/files/nunito-latin-ext-900-normal.woff'), weight: 900, style: 'normal' },
  { name: 'NunitoCyr', data: font('@fontsource/nunito/files/nunito-cyrillic-900-normal.woff'), weight: 900, style: 'normal' },
  { name: 'Noto Sans', data: font('@fontsource/noto-sans/files/noto-sans-greek-900-normal.woff'), weight: 900, style: 'normal' },
]);
let arabicFontFile: string | undefined;
const loadArabic = () => {
  if (!arabicFontFile) {
    arabicFontFile = path.join(os.tmpdir(), 'bd316-noto-sans-arabic-700.ttf');
    fs.writeFileSync(arabicFontFile, woffToSfnt(font('@fontsource/noto-sans-arabic/files/noto-sans-arabic-arabic-700-normal.woff')));
  }
  return arabicFontFile;
};
const esc = (x: string) => x.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const logoData = `data:image/svg+xml;base64,${Buffer.from(logoSvg.replace('currentColor', '#ffffff')).toString('base64')}`;

export const getStaticPaths: GetStaticPaths = () =>
  locales.flatMap((lang) => indexablePages.map((page) => ({ params: { lang, page } })));

type El = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, children?: unknown, extra: Record<string, unknown> = {}): El =>
  ({ type, props: { style, children, ...extra } });

export const GET: APIRoute = async ({ params, site }) => {
  const lang = params.lang as Locale;
  const page = params.page as PageKey;
  const rtl = lang === 'ar';
  const heading = page === 'home' ? t(lang, 'home.tagline') : t(lang, `pages.${page}.heading`);
  const tree = h('div', { display: 'flex', position: 'relative', width: 1200, height: 630, background: '#000', fontFamily: 'Nunito, NunitoExt, NunitoCyr, Noto Sans' }, [
    h('img', { position: 'absolute', top: 60, left: 72, width: 440, height: 221 }, undefined, { src: logoData, width: 440, height: 221 }),
    h('div', { display: 'flex', flexDirection: 'column', alignItems: rtl ? 'flex-end' : 'flex-start', gap: 16, position: 'absolute', left: 72, bottom: 56, width: 1056 }, [
      h('div', { display: 'flex', width: 120, height: 10, background: '#e5383b', borderRadius: 4 }),
      rtl
        ? h('div', { display: 'flex', height: 96 }, ' ')
        : h('div', { display: 'flex', fontSize: page === 'home' ? 58 : 76, fontWeight: 900, color: '#fff', lineHeight: 1.1, maxWidth: 1050 }, heading),
      h('div', { display: 'flex', fontSize: 28, color: '#b3b3b3', fontWeight: 900 }, `${site!.host}`),
    ]),
  ]);
  let svg = await satori(tree as never, { width: 1200, height: 630, fonts: loadFonts() });
  if (rtl) {
    const size = heading.length > 22 ? 56 : 68;
    svg = svg.replace(/<\/svg>\s*$/, `<text x="1128" y="500" direction="rtl" text-anchor="end" font-family="Noto Sans Arabic" font-weight="700" font-size="${size}" fill="#ffffff">${esc(heading)}</text></svg>`);
  }
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
    font: rtl ? { fontFiles: [loadArabic()], loadSystemFonts: false, defaultFontFamily: 'Noto Sans Arabic' } : undefined,
  }).render().asPng();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
