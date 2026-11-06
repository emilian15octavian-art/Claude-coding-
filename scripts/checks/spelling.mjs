// Spelling: checks the visible text, page titles, descriptions and image descriptions (alt) of every page,
// each page with the dictionary of its own language. Names and song titles (marked translate="no"),
// text in another language and code are skipped. Correct words that are flagged go in
// src/content/i18n/spelling-allowed.txt.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parse, ELEMENT_NODE, TEXT_NODE } from 'ultrahtml';
import { htmlFiles, langs, reportDir, requireDist, result, root, urlOf } from './lib.mjs';

const r = result('spelling', 'Spelling: every page in its own language');
requireDist(r);
// The example content (npm run check:examples) is made-up test data that is never published: skip it.
if (process.env.EXAMPLES === '1' || /examples/.test(process.env.OUT_DIR || '')) {
  r.note('Skipped for the example content (it is never published).');
  r.finish();
  process.exit(0);
}
const locale = { en: 'en-GB', fr: 'fr', ro: 'ro', it: 'it', es: 'es', ar: 'ar', ru: 'ru', el: 'el' };
const skip = new Set(['script', 'style', 'svg', 'noscript', 'template', 'code', 'pre']);
const decode = (s) => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));
const tmp = path.join(reportDir, 'spelling-text');
fs.rmSync(tmp, { recursive: true, force: true });
for (const l of langs) fs.mkdirSync(path.join(tmp, l), { recursive: true });

for (const f of htmlFiles()) {
  const page = urlOf(f);
  const lang = page.split('/')[1];
  if (!langs.includes(lang) || page.endsWith('404.html')) continue;
  const html = fs.readFileSync(f, 'utf8');
  const out = [];
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
  const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
  if (title) out.push(decode(title));
  if (desc) out.push(decode(desc));
  const body = html.slice(html.indexOf('<body'));
  const walk = (node) => {
    if (node.type === TEXT_NODE) { out.push(decode(node.value)); return; }
    if (node.type === ELEMENT_NODE) {
      const a = node.attributes ?? {};
      if (skip.has(node.name) || a.translate === 'no' || a['aria-hidden'] === 'true' || (a.lang && a.lang !== lang) || a.class?.split(' ').includes('ltr') && lang !== 'en') return;
      if (node.name === 'img' && a.alt) out.push(decode(a.alt));
    }
    for (const c of node.children ?? []) walk(c);
  };
  walk(parse(body));
  const text = out.join('\n').replace(/Bleeding Debts 316/g, ' ').replace(/[ \t]+/g, ' ');
  fs.writeFileSync(path.join(tmp, lang, `${page.replace(/\//g, '_') || 'root'}.txt`), text);
}

let total = 0;
fs.rmSync(path.join(reportDir, 'spelling-words.txt'), { force: true });
for (const l of langs) {
  const p = spawnSync('npx', ['cspell', 'lint', '--no-progress', '--no-summary', '--unique', '--locale', locale[l], '--config', path.join(root, 'cspell.json'), `${path.relative(root, path.join(tmp, l))}/**/*.txt`], { cwd: root, encoding: 'utf8', shell: process.platform === 'win32' });
  const words = new Map();
  for (const line of (p.stdout ?? '').split('\n')) {
    const m = line.match(/([^/\\]+)\.txt:\d+:\d+ - Unknown word \((.+?)\)/);
    if (m) words.set(m[2], (words.get(m[2]) ?? new Set()).add(m[1].replace(/^_/, '/').replace(/_/g, '/')));
  }
  for (const [w, pages] of words) {
    total++;
    fs.appendFileSync(path.join(reportDir, 'spelling-words.txt'), `${l}\t${w}\n`);
    r.error(`${l}: "${w}" looks misspelled (${[...pages].slice(0, 3).join(', ')}${pages.size > 3 ? ', …' : ''})`, `If it is a typo, fix it in src/content/i18n/${l}.json or the content file. If it is correct (a name or special word), add it to src/content/i18n/spelling-allowed.txt.`);
  }
}
r.note(`Checked ${fs.readdirSync(path.join(tmp, 'en')).length} pages per language.`);
r.finish();
