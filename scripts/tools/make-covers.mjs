// One-time tool: builds square 1400×1400 release covers in the logo's style:
// black background, the logo, and the song title in a heavy rounded font, with the first letter
// in the logo's white-box motif. Usage: node scripts/tools/make-covers.mjs (edit the list below)
import fs from 'node:fs';
import { createRequire } from 'node:module';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
const require = createRequire(import.meta.url);
const font = fs.readFileSync(require.resolve('@fontsource/nunito/files/nunito-latin-900-normal.woff'));
const logo = fs.readFileSync('src/assets/logo.svg', 'utf8').replace('currentColor', '#ffffff');
const logoData = `data:image/svg+xml;base64,${Buffer.from(logo).toString('base64')}`;
const covers = [
  ['cornucopium', 'cornucopium'],
  ['gray-gatz-be', 'Gray Gatz Be'],
  ['insurrexion-mania', 'InsurREXion (MANIA)'],
  ['killer-maze', 'Killer Maze'],
];
const h = (type, style, children, extra = {}) => ({ type, props: { style, children, ...extra } });
for (const [slug, title] of covers) {
  const size = title.length > 16 ? 100 : title.length > 11 ? 150 : 180;
  const [first, rest] = [title[0], title.slice(1)];
  const tree = h('div', { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 90, width: 1400, height: 1400, background: '#000000', fontFamily: 'Nunito' }, [
    h('img', { width: 780, height: 393 }, undefined, { src: logoData, width: 780, height: 393 }),
    h('div', { display: 'flex', alignItems: 'center', color: '#ffffff', fontWeight: 900, fontSize: size, lineHeight: 1, letterSpacing: -2, maxWidth: 1260 }, [
      h('div', { display: 'flex', flexShrink: 0, background: '#ffffff', color: '#000000', padding: `4px ${/[IiljtfJr1!]/.test(first) ? Math.round(size * 0.2) : 10}px 14px`, marginRight: 6 }, first),
      h('div', { display: 'flex', flexShrink: 0, whiteSpace: 'nowrap', paddingBottom: 10 }, rest),
    ]),
  ]);
  const svg = await satori(tree, { width: 1400, height: 1400, fonts: [{ name: 'Nunito', data: font, weight: 900, style: 'normal' }] });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1400 } }).render().asPng();
  await sharp(png).jpeg({ quality: 92 }).toFile(`src/assets/images/covers/${slug}.jpg`);
  console.log('cover', slug);
}
