/**
 * Makes the website QR code for posters, stickers and merch: public/press/bleeding-debts-316-website-qr.svg
 * Run again if the website address changes: node scripts/tools/make-qr.mjs
 */
import fs from 'node:fs';
import QRCode from 'qrcode';
const url = `${(process.env.SITE_URL || 'https://claude-coding.bleedingdebts316.workers.dev').replace(/\/$/, '')}/en/links/?utm_source=qr&utm_medium=print`;
const svg = await QRCode.toString(url, { type: 'svg', errorCorrectionLevel: 'H', margin: 2, color: { dark: '#000000', light: '#ffffff' } });
fs.writeFileSync('public/press/bleeding-debts-316-website-qr.svg', svg);
console.log(`QR code for ${url} written.`);
