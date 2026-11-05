// Builds a Markdown summary of a Lighthouse run per language and compares it with last month.
// Usage: node scripts/lighthouse-summary.mjs <reportDir> [previousSummary.json] > summary.md
import fs from 'node:fs';
import path from 'node:path';

const [, , dir = 'reports/lighthouse-live', prevFile] = process.argv;
const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
const cats = ['performance', 'accessibility', 'best-practices', 'seo'];
const now = {};
for (const run of manifest) {
  const u = new URL(run.url).pathname;
  const lhr = JSON.parse(fs.readFileSync(run.jsonPath, 'utf8'));
  now[u] = { ...Object.fromEntries(cats.map((c) => [c, Math.round(run.summary[c] * 100)])), lcp: Math.round(lhr.audits['largest-contentful-paint'].numericValue), cls: +lhr.audits['cumulative-layout-shift'].numericValue.toFixed(3), kb: Math.round(lhr.audits['total-byte-weight'].numericValue / 1024) };
}
let prev = {};
try { prev = JSON.parse(fs.readFileSync(prevFile, 'utf8')); } catch {}
const delta = (a, b) => (b === undefined ? '' : a > b ? ` (+${a - b})` : a < b ? ` (${a - b})` : '');
const rows = Object.entries(now).sort().map(([u, s]) => `| ${u} | ${cats.map((c) => `${s[c]}${delta(s[c], prev[u]?.[c])}`).join(' | ')} | ${s.lcp} ms | ${s.cls} | ${s.kb} KB |`);
const low = Object.entries(now).filter(([, s]) => cats.some((c) => s[c] < 95));
console.log([
  `Monthly Lighthouse report (mobile, live site). Full HTML reports are attached to the workflow run as the *lighthouse-live* artifact.`,
  '',
  low.length ? `⚠️ ${low.length} page(s) scored below 95 in at least one category: ${low.map(([u]) => u).join(', ')}` : '✅ Every page scored 95 or more in all four categories.',
  '',
  '| Page | Performance | Accessibility | Best practices | SEO | LCP | CLS | Weight |',
  '|---|---|---|---|---|---|---|---|',
  ...rows,
  '',
  Object.keys(prev).length ? '(Numbers in brackets: change since last month.)' : '(First report: next month will show the changes.)',
  '',
  `<!-- lighthouse-data ${JSON.stringify(now)} -->`,
].join('\n'));
