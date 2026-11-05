// One-time tool: builds favicon set, manifest icons and logo pack from src/assets/*.svg
// Usage: node scripts/tools/make-icons.mjs
import fs from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';

const mark = fs.readFileSync('src/assets/brand/mark.svg', 'utf8');
const markPath = mark.match(/<path[^>]+>/)[0];
const logo = fs.readFileSync('src/assets/logo.svg', 'utf8');
const logoPath = logo.match(/<path[^>]+>/)[0];

// Square icon: black background, white "b" mark centred. scale = share of the square the mark's height uses.
const squareIcon = (scale, radius = 0) => {
  const S = 1264 / scale; const x = (S - 792) / 2; const y = (S - 1264) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}"><rect width="${S}" height="${S}" rx="${radius * S}" fill="#000"/><g transform="translate(${x} ${y})" color="#fff">${markPath}</g></svg>`;
};
const png = (svg, size, out) => fs.writeFileSync(out, new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng());

fs.writeFileSync('public/favicon.svg', squareIcon(0.8, 0.12));
png(squareIcon(0.8), 180, 'public/apple-touch-icon.png');
png(squareIcon(0.8, 0.12), 192, 'public/icon-192.png');
png(squareIcon(0.8, 0.12), 512, 'public/icon-512.png');
png(squareIcon(0.55), 512, 'public/icon-maskable-512.png');
png(squareIcon(0.82), 32, '/tmp/claude-0/fav32.png');
png(squareIcon(0.82), 16, '/tmp/claude-0/fav16.png');

// Logo pack for the press kit
fs.mkdirSync('public/press/logo', { recursive: true });
const pad = (fg, bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-80 -80 1384 776">${bg ? `<rect x="-80" y="-80" width="1384" height="776" fill="${bg}"/>` : ''}<g color="${fg}">${logoPath}</g></svg>`;
fs.writeFileSync('public/press/logo/bleeding-debts-316-logo-white.svg', pad('#fff'));
fs.writeFileSync('public/press/logo/bleeding-debts-316-logo-black.svg', pad('#000'));
png(pad('#fff', '#000'), 3000, 'public/press/logo/bleeding-debts-316-logo-on-black.png');
png(pad('#000', '#fff'), 3000, 'public/press/logo/bleeding-debts-316-logo-on-white.png');
png(pad('#fff'), 3000, 'public/press/logo/bleeding-debts-316-logo-white-transparent.png');
png(pad('#000'), 3000, 'public/press/logo/bleeding-debts-316-logo-black-transparent.png');

// Sprite so every page can reuse the cached logo via <use href="/logo.svg#logo">
fs.writeFileSync('public/logo.svg', `<svg xmlns="http://www.w3.org/2000/svg"><symbol id="logo" viewBox="0 0 1224 616">${logoPath}</symbol></svg>`);
await sharp('/tmp/claude-0/fav32.png').toFile('/tmp/claude-0/fav32b.png');
console.log('icons done');
