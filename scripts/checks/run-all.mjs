/**
 * `npm run check`: runs every check, one after another, exactly like GitHub Actions does
 * before a deploy. Writes reports/summary.md. Exit code 1 if anything failed.
 *   npm run check              all checks except Lighthouse
 *   npm run check -- --lighthouse   also run Lighthouse CI
 *   npm run check -- --skip-build   reuse the existing dist/ folder
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { reportDir, root } from './lib.mjs';

const args = process.argv.slice(2);
const steps = [
  ...(args.includes('--skip-build') ? [] : [['build', 'Build (zero errors, zero warnings)']]),
  ['content', 'Content files'],
  ['i18n', 'Translations'],
  ['html', 'HTML validation'],
  ['links', 'Internal links'],
  ['jsonld', 'Structured data'],
  ['hreflang', 'hreflang'],
  ['security', 'Security'],
  ['a11y', 'Accessibility'],
  ['interactive', 'Interactive parts'],
  ...(args.includes('--lighthouse') ? [['lighthouse', 'Lighthouse']] : []),
];
const results = [];
for (const [name, title] of steps) {
  console.log(`\n━━━ ${title} ━━━`);
  const p = name === 'lighthouse'
    ? spawnSync('npx', ['lhci', 'autorun', '--config=./lighthouserc.cjs'], { stdio: 'inherit', cwd: root, shell: process.platform === 'win32' })
    : spawnSync(process.execPath, [path.join(root, 'scripts/checks', `${name}.mjs`)], { stdio: 'inherit', cwd: root });
  results.push({ name, title, ok: p.status === 0 });
  if (name === 'build' && p.status !== 0) { console.log('\nBuild failed: skipping the other checks.'); break; }
}
const failed = results.filter((r) => !r.ok);
const body = [
  `# Site check: ${failed.length ? `${failed.length} check(s) failed` : 'everything passed'}`,
  '',
  ...results.map((r) => `- ${r.ok ? '✅' : '❌'} ${r.title}`),
  '',
  ...results.filter((r) => r.name !== 'lighthouse').map((r) => (fs.existsSync(path.join(reportDir, `${r.name}.md`)) ? fs.readFileSync(path.join(reportDir, `${r.name}.md`), 'utf8') : '')),
].join('\n');
fs.writeFileSync(path.join(reportDir, 'summary.md'), body);
console.log(`\n${failed.length ? '❌' : '✅'} ${results.length - failed.length}/${results.length} checks passed. Full report: reports/summary.md`);
process.exit(failed.length ? 1 : 0);
