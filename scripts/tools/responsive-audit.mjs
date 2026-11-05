// Visits every page at 320/768/1024/1440 px in dark and light mode: reports horizontal scrolling,
// text overflowing its box, and images without width/height. Saves screenshots of chosen pages.
// Usage: OUT_DIR=dist-examples node scripts/tools/responsive-audit.mjs [screenshotDir]
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { htmlFiles, urlOf } from '../checks/lib.mjs';
import { startServer } from '../checks/serve.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const shotDir = process.argv[2];
const shots = new Set(['/en/', '/ar/', '/ru/', '/el/', '/fr/concerts/', '/ar/hafalat/', '/ro/magazin/', '/el/katastima/', '/ar/maarad/', '/de/missing/']);
const server = await startServer(4402);
const browser = await chromium.launch();
const urls = htmlFiles().map(urlOf).filter((u) => !u.endsWith('404.html'));
let problems = 0;
for (const scheme of ['dark', 'light']) for (const width of [320, 768, 1024, 1440]) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: scheme, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  for (const u of urls) {
    await page.goto(`http://localhost:4402${u}`, { waitUntil: 'load' });
    const res = await page.evaluate(() => {
      const out = [];
      if (document.documentElement.scrollWidth > document.documentElement.clientWidth + 1) out.push(`horizontal scroll (${document.documentElement.scrollWidth}px)`);
      for (const el of document.querySelectorAll('main *, header *, footer *')) {
        if (el.closest('.visually-hidden, .hp, [hidden], dialog:not([open]), [popover]:not(:popover-open), pre, table')) continue;
        if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflowX === 'visible' && el.clientWidth > 0 && !['svg', 'path', 'use', 'picture', 'img', 'source'].includes(el.tagName.toLowerCase())) {
          const r = el.getBoundingClientRect();
          if (r.right > window.innerWidth + 1 || r.left < -1) out.push(`overflowing: ${el.tagName.toLowerCase()}.${el.className}`);
        }
      }
      for (const img of document.querySelectorAll('img')) if (!img.getAttribute('width') || !img.getAttribute('height')) out.push(`img without size: ${img.src.slice(-40)}`);
      return [...new Set(out)];
    });
    if (res.length) { problems += res.length; console.log(`${u} @${width} ${scheme}: ${res.join('; ')}`); }
    if (shotDir && shots.has(u)) await page.screenshot({ path: `${shotDir}/${u.replace(/\//g, '_')}-${width}-${scheme}.png`, fullPage: true });
  }
  await ctx.close();
}
await browser.close();
server.close();
console.log(`${urls.length} pages × 8 viewport/theme combinations checked, ${problems} problem(s).`);
process.exit(problems ? 1 : 0);
