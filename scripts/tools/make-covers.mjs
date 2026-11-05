// One-time tool: builds square 1400×1400 cover images for releases without artwork:
// a video still, darkened, with the logo and the title in the logo's white-box style.
// Usage: node scripts/tools/make-covers.mjs   (edit the list below)
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
  ['cornucopium', 'src/assets/images/gallery/bd316-04.jpg', 'cornucopium'],
  ['gray-gatz-be', 'src/assets/images/gallery/bd316-01.jpg', 'Gray Gatz Be'],
  ['insurrexion-mania', 'src/assets/images/gallery/bd316-09.jpg', 'InsurREXion (MANIA)'],
  ['killer-maze', 'src/assets/images/gallery/bd316-14.jpg', 'Killer Maze'],
];
const h = (type, style, children, extra = {}) => ({ type, props: { style, children, ...extra } });
for (const [slug, photo, title] of covers) {
  const sq = await sharp(photo).resize(1400, 1400, { fit: 'cover', position: 'attention' }).jpeg({ quality: 92 }).toBuffer();
  const bg = `data:image/jpeg;base64,${sq.toString('base64')}`;
  const tree = h('div', { display: 'flex', position: 'relative', width: 1400, height: 1400, background: '#000' }, [
    h('img', { position: 'absolute', top: 0, left: 0, width: 1400, height: 1400 }, undefined, { src: bg, width: 1400, height: 1400 }),
    h('div', { position: 'absolute', top: 0, left: 0, width: 1400, height: 1400, display: 'flex', backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.7))' }),
    h('img', { position: 'absolute', top: 70, left: 80, width: 440, height: 221 }, undefined, { src: logoData, width: 440, height: 221 }),
    h('div', { position: 'absolute', left: 80, bottom: 90, display: 'flex', maxWidth: 1240 }, [
      h('div', { display: 'flex', background: '#ffffff', color: '#000000', fontFamily: 'Nunito', fontWeight: 900, fontSize: title.length > 14 ? 104 : 132, lineHeight: 1.05, padding: '6px 22px 14px' }, title),
    ]),
  ]);
  const svg = await satori(tree, { width: 1400, height: 1400, fonts: [{ name: 'Nunito', data: font, weight: 900, style: 'normal' }] });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1400 } }).render().asPng();
  await sharp(png).jpeg({ quality: 90 }).toFile(`src/assets/images/covers/${slug}.jpg`);
  console.log('cover', slug);
}
