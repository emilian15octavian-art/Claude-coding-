// Check 8: accessibility with axe-core (WCAG 2.2 A/AA rules) on key pages in English, Arabic (RTL),
// Russian (Cyrillic) and Greek, at 320 px and 1280 px, in dark and light mode.
import { createRequire } from 'node:module';
import { result, requireDist } from './lib.mjs';
import { startServer } from './serve.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');

const r = result('a11y', 'Accessibility: WCAG 2.2 AA (axe) in EN, AR (RTL), RU and EL');
requireDist(r);
const port = 4401;
const server = await startServer(port);
const pages = (process.env.A11Y_PAGES ?? [
  '/', '/en/', '/en/music/', '/en/shows/', '/en/shop/', '/en/about/', '/en/gallery/', '/en/press/', '/en/contact/', '/en/links/', '/en/privacy/', '/en/does-not-exist/',
  '/ar/', '/ar/hafalat/', '/ar/matjar/', '/ar/ittisal/', '/ar/man-nahnu/',
  '/ru/', '/ru/kontserty/', '/ru/magazin/',
  '/el/', '/el/synavlies/', '/el/katastima/',
].join(',')).split(',');
const browser = await chromium.launch();
let n = 0;
for (const scheme of ['dark', 'light']) for (const width of [320, 1280]) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: scheme, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  for (const p of pages) {
    await page.goto(`http://localhost:${port}${p}`, { waitUntil: 'load' });
    const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).disableRules(['region']).analyze();
    for (const v of res.violations) {
      if (v.impact === 'minor' && v.tags.includes('best-practice')) { r.note(`${p} (${width}px, ${scheme}): ${v.id}: ${v.help}`); continue; }
      r.error(`${p} (${width}px, ${scheme}): ${v.help} [${v.id}] on ${v.nodes.length} element(s), e.g. ${v.nodes[0]?.target.join(' ')}`, v.helpUrl);
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    if (overflow) r.error(`${p} (${width}px, ${scheme}): page scrolls horizontally`, 'Something is wider than the screen. Open the page at that width and look for long words, wide tables or fixed widths.');
    // Touch targets: interactive elements at least 44×44 px (inline text links are exempt)
    const small = await page.evaluate(() => [...document.querySelectorAll('a.btn, button, summary, input[type=checkbox], .socials a, .menu-btn, .theme-toggle')]
      .filter((el) => { const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0 && (b.width < 43.5 || b.height < 43.5) && getComputedStyle(el).visibility !== 'hidden' && !el.closest('.hp'); })
      .map((el) => `${el.tagName.toLowerCase()}${el.className ? '.' + String(el.className).split(' ')[0] : ''} (${Math.round(el.getBoundingClientRect().width)}×${Math.round(el.getBoundingClientRect().height)})`));
    for (const s of [...new Set(small)].filter((s) => !s.startsWith('input'))) r.error(`${p} (${width}px): touch target smaller than 44×44 px: ${s}`, 'Give the element min-block-size and min-inline-size of 44px.');
    n++;
  }
  await ctx.close();
}
await browser.close();
server.close();
r.note(`${n} page views tested with axe-core.`);
r.finish();
