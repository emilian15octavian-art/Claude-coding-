// Takes screenshots of pages for visual review.
// Usage: node scripts/tools/screens.mjs <baseUrl> <outDir> <width> <theme> <path...>
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [, , base, out, width, theme, ...paths] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +width, height: 900 }, colorScheme: theme });
for (const p of paths) {
  await page.goto(base + p, { waitUntil: 'networkidle' });
  const name = p.replace(/\//g, '_') || 'root';
  await page.screenshot({ path: `${out}/${name}-${width}-${theme}.png`, fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  console.log(p, width, theme, overflow ? 'HORIZONTAL OVERFLOW' : 'ok');
}
await browser.close();
