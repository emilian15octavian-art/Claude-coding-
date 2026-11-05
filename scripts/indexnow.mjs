/**
 * Tells search engines (Bing, Yandex, Seznam, Naver… via IndexNow) which pages changed in this deploy.
 * Usage: node scripts/indexnow.mjs <previous-page-hashes.json | -> [dist]
 * Compares the live site's previous page-hashes.json with the new build and submits only changed URLs.
 */
import fs from 'node:fs';
import path from 'node:path';

const [, , prevFile = '-', dist = 'dist'] = process.argv;
const site = (process.env.SITE_URL || 'https://claude-coding.emilian15octavian.workers.dev').replace(/\/$/, '');
const key = fs.readdirSync('public').find((f) => /^[0-9a-f]{32}\.txt$/.test(f))?.replace('.txt', '');
if (!key) { console.log('No IndexNow key file in public/. Skipping.'); process.exit(0); }
const next = JSON.parse(fs.readFileSync(path.join(dist, 'page-hashes.json'), 'utf8'));
let prev = {};
try { if (prevFile !== '-') prev = JSON.parse(fs.readFileSync(prevFile, 'utf8')); } catch { prev = {}; }
const changed = Object.keys(next).filter((u) => prev[u] !== next[u]).map((u) => site + u);
if (!changed.length) { console.log('IndexNow: no page changed, nothing to submit.'); process.exit(0); }
const body = { host: new URL(site).host, key, keyLocation: `${site}/${key}.txt`, urlList: changed.slice(0, 10000) };
const res = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(body) });
console.log(`IndexNow: submitted ${changed.length} changed URL(s), response ${res.status}`);
if (res.status >= 400 && res.status !== 429) process.exitCode = 1;
