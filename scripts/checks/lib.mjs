// Shared helpers for the check scripts.
import fs from 'node:fs';
import path from 'node:path';

export const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
export const dist = path.join(root, process.env.OUT_DIR || 'dist');
export const langs = ['en', 'fr', 'ro', 'it', 'es', 'ar', 'ru', 'el'];
export const reportDir = path.join(root, 'reports');
fs.mkdirSync(reportDir, { recursive: true });

export const walk = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
// Search-engine verification files (e.g. google1234abcd.html) are not web pages, so they are not checked.
export const htmlFiles = () => walk(dist).filter((f) => f.endsWith('.html') && !/(^|[\\/])google[0-9a-f]+\.html$/.test(f));
/** URL path of an HTML file in dist, e.g. dist/fr/concerts/index.html → /fr/concerts/ */
export const urlOf = (file) => '/' + path.relative(dist, file).replace(/\\/g, '/').replace(/index\.html$/, '');
/** File in dist for a site URL path, or null. Mirrors how Cloudflare Pages resolves paths. */
export const fileFor = (urlPath) => {
  const p = decodeURIComponent(urlPath.split('#')[0].split('?')[0]);
  const candidates = p.endsWith('/') ? [p + 'index.html'] : [p, p + '.html', p + '/index.html'];
  for (const c of candidates) { const f = path.join(dist, c); if (fs.existsSync(f) && fs.statSync(f).isFile()) return f; }
  return null;
};

/**
 * A check result. `errors` fail the build; `notes` are shown in the report but do not fail.
 * Each problem has a plain-language `fix` so the GitHub issue explains what to do.
 */
export const result = (name, title) => {
  const r = { name, title, errors: [], notes: [] };
  r.error = (msg, fix) => r.errors.push({ msg, fix });
  r.note = (msg) => r.notes.push(msg);
  r.finish = () => {
    const lines = [`## ${r.errors.length ? '❌' : '✅'} ${title}`, ''];
    if (r.errors.length) {
      lines.push(`**${r.errors.length} problem(s):**`, '');
      for (const e of r.errors.slice(0, 200)) lines.push(`- ${e.msg}${e.fix ? `\n  - How to fix: ${e.fix}` : ''}`);
      if (r.errors.length > 200) lines.push(`- …and ${r.errors.length - 200} more`);
      lines.push('');
    }
    if (r.notes.length) { lines.push('<details><summary>Notes (not errors)</summary>', '', ...r.notes.map((n) => `- ${n}`), '', '</details>', ''); }
    if (!r.errors.length && !r.notes.length) lines.push('All good.', '');
    fs.writeFileSync(path.join(reportDir, `${name}.md`), lines.join('\n'));
    console.log(lines.join('\n'));
    if (r.errors.length) process.exitCode = 1;
  };
  return r;
};

export const requireDist = (r) => {
  if (!fs.existsSync(path.join(dist, 'index.html'))) { r.error(`No built site found in ${dist}.`, 'Run `npm run build` first.'); r.finish(); process.exit(1); }
};
