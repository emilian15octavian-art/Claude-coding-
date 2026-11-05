/**
 * Runs after `astro build`:
 *  1. Moves each language's 404 page to /xx/404.html (Cloudflare Pages serves the closest 404.html).
 *  2. Builds the Content-Security-Policy with hashes of the few inline scripts/styles and writes _headers.
 *  3. Writes page-hashes.json (used to tell search engines only about pages that changed, via IndexNow).
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const dist = process.env.OUT_DIR || 'dist';
const langs = ['en', 'fr', 'ro', 'it', 'es', 'ar', 'ru', 'el'];

// 1. Language 404 pages
for (const l of langs) {
  const dir = path.join(dist, l, '404');
  if (fs.existsSync(path.join(dir, 'index.html'))) {
    fs.renameSync(path.join(dir, 'index.html'), path.join(dist, l, '404.html'));
    fs.rmSync(dir, { recursive: true });
  }
}

// Collect all HTML files
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const htmlFiles = walk(dist).filter((f) => f.endsWith('.html'));

// 2. CSP hashes for inline <script> (executable only) and <style>
const sha = (s) => `'sha256-${crypto.createHash('sha256').update(s).digest('base64')}'`;
const scriptHashes = new Set();
const styleHashes = new Set();
for (const f of htmlFiles) {
  const html = fs.readFileSync(f, 'utf8');
  for (const m of html.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
    const attrs = m[1] ?? '';
    if (/\bsrc=/.test(attrs)) continue;
    if (/type="application\/(ld\+)?json"/.test(attrs)) continue; // data blocks are not executed
    if (m[2].trim()) scriptHashes.add(sha(m[2]));
  }
  for (const m of html.matchAll(/<style(\s[^>]*)?>([\s\S]*?)<\/style>/g)) styleHashes.add(sha(m[2]));
}

const CSP = {
  'default-src': ["'self'"],
  'script-src': ["'self'", ...scriptHashes, 'https://challenges.cloudflare.com', 'https://static.cloudflareinsights.com'],
  'style-src': ["'self'", ...styleHashes],
  'style-src-attr': ["'unsafe-inline'"], // Cloudflare Turnstile sets inline style attributes on its widget
  'img-src': ["'self'", 'data:'],
  'font-src': ["'self'"],
  'connect-src': ["'self'", 'https://cloudflareinsights.com', 'https://challenges.cloudflare.com', 'https://api.web3forms.com'],
  'frame-src': ['https://www.youtube-nocookie.com', 'https://open.spotify.com', 'https://bandcamp.com', 'https://challenges.cloudflare.com'],
  'form-action': ["'self'", 'https://*.sibforms.com', 'https://api.web3forms.com'],
  'media-src': ["'self'"],
  'manifest-src': ["'self'"],
  'worker-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': [],
};
const csp = Object.entries(CSP).map(([k, v]) => [k, ...v].join(' ')).join('; ');
if (csp.length > 1900) {
  console.error(`✖ CSP is ${csp.length} characters; Cloudflare allows about 2000. Reduce inline scripts/styles.`);
  process.exit(1);
}
const headersFile = path.join(dist, '_headers');
fs.writeFileSync(headersFile, fs.readFileSync(headersFile, 'utf8').replace('__CSP__', csp));

// 3. Per-page content hashes (for IndexNow change detection)
const hashes = {};
for (const f of htmlFiles) {
  const rel = '/' + path.relative(dist, f).replace(/\\/g, '/').replace(/index\.html$/, '');
  if (rel.endsWith('404.html')) continue;
  hashes[rel] = crypto.createHash('sha1').update(fs.readFileSync(f)).digest('hex').slice(0, 16);
}
fs.writeFileSync(path.join(dist, 'page-hashes.json'), JSON.stringify(hashes, null, 0));

console.log(`postbuild: ${htmlFiles.length} HTML files, ${scriptHashes.size} inline script(s), ${styleHashes.size} inline style(s), CSP ${csp.length} chars`);
