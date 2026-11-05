// Check 8b: the few interactive parts work (with a real browser): mobile menu, language notice,
// theme toggle (remembered), click-to-load embeds (nothing loads before the click), lightbox keyboard
// support in LTR and RTL, and that no third-party request happens before the visitor interacts.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { dist, result, requireDist } from './lib.mjs';
import { startServer } from './serve.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');

const r = result('interactive', 'Interactive parts: menu, language notice, theme, embeds, lightbox');
requireDist(r);
const port = 4403;
const base = `http://localhost:${port}`;
const server = await startServer(port);
const browser = await chromium.launch();
const expect = (cond, msg, fix) => { if (!cond) r.error(msg, fix); };

// No third-party requests before interaction, on every key page
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const external = new Set();
  page.on('request', (req) => { const u = new URL(req.url()); if (u.hostname !== 'localhost') external.add(u.hostname); });
  for (const p of ['/', '/en/', '/en/music/', '/en/videos/', '/en/shop/', '/en/gallery/', '/en/newsletter/', '/ar/', '/el/']) await page.goto(base + p, { waitUntil: 'networkidle' });
  const allowed = new Set(['static.cloudflareinsights.com', 'cloudflareinsights.com']);
  const bad = [...external].filter((h) => !allowed.has(h));
  expect(!bad.length, `Third-party requests before any click: ${bad.join(', ')}`, 'Embeds must use the click-to-load facade (src/components/Embed.astro). Nothing may load from other sites before consent.');
  await ctx.close();
}
// Mobile menu (popover), Escape closes it
{
  const ctx = await browser.newContext({ viewport: { width: 360, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(base + '/en/');
  await page.click('.menu-btn');
  expect(await page.locator('#site-menu').evaluate((el) => el.matches(':popover-open')), 'Mobile menu does not open', 'Check the popover button in src/components/Header.astro.');
  await page.keyboard.press('Escape');
  expect(!(await page.locator('#site-menu').evaluate((el) => el.matches(':popover-open'))), 'Mobile menu does not close with Escape');
  // Theme toggle remembered across pages
  const before = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.click('[data-theme-toggle]');
  const after = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(before !== after, 'Theme toggle does not change the colours');
  await page.goto(base + '/en/music/');
  expect((await page.evaluate(() => getComputedStyle(document.body).backgroundColor)) === after, 'Theme choice is not remembered on the next page');
  await ctx.close();
}
// Language notice on "/" with a French browser; never on /en/
{
  const ctx = await browser.newContext({ locale: 'fr-FR' });
  const page = await ctx.newPage();
  await page.goto(base + '/');
  const notice = page.locator('[data-lang-notice]');
  expect(await notice.isVisible(), 'Root page does not suggest French to a French browser', 'Check the script in src/pages/index.astro.');
  expect((await page.locator('[data-ln-link]').getAttribute('href')) === '/fr/', 'Language notice does not link to /fr/');
  expect(page.url() === base + '/', 'Root page redirected automatically (it must never redirect)');
  await page.click('[data-ln-dismiss]');
  await page.reload();
  expect(!(await notice.isVisible()), 'Dismissed language notice comes back after reload');
  await ctx.close();
}
// Embeds load only on click (needs example content with a video or release)
const hasVideo = fs.readFileSync(path.join(dist, 'en/videos/index.html'), 'utf8').includes('data-embed');
if (hasVideo) {
  const page = await browser.newPage();
  await page.route(/youtube-nocookie|spotify|bandcamp/, (route) => route.fulfill({ status: 200, body: 'ok' }));
  await page.goto(base + '/en/videos/');
  expect((await page.locator('iframe').count()) === 0, 'A video iframe exists before the click');
  await page.click('[data-embed-play]');
  expect((await page.locator('[data-embed] iframe').count()) === 1, 'Clicking the video facade does not load the player', 'Check the script in src/components/Embed.astro.');
  await page.close();
} else r.note('No videos yet: embed click test skipped (runs with `npm run check:examples`).');
// Lightbox: opens, arrow keys (mirrored in Arabic), Escape closes and returns focus
const hasGallery = fs.readFileSync(path.join(dist, 'en/gallery/index.html'), 'utf8').includes('data-lightbox');
if (hasGallery) {
  for (const [p, rtl] of [['/en/gallery/', false], ['/ar/maarad/', true]]) {
    const page = await browser.newPage();
    await page.goto(base + p);
    const first = page.locator('[data-gallery] a').first();
    await first.focus();
    await page.keyboard.press('Enter');
    expect(await page.locator('dialog[data-lightbox]').evaluate((d) => d.open), `${p}: lightbox does not open with Enter`);
    const n1 = await page.locator('[data-lb-count]').textContent();
    await page.keyboard.press(rtl ? 'ArrowLeft' : 'ArrowRight');
    const n2 = await page.locator('[data-lb-count]').textContent();
    expect(n1 !== n2 && /2/.test(n2 ?? ''), `${p}: ${rtl ? 'ArrowLeft (next in RTL)' : 'ArrowRight'} does not show the next photo (${n1} → ${n2})`);
    await page.keyboard.press('Escape');
    expect(!(await page.locator('dialog[data-lightbox]').evaluate((d) => d.open)), `${p}: Escape does not close the lightbox`);
    expect(await first.evaluate((el) => el === document.activeElement), `${p}: focus does not return to the photo after closing`);
    await page.close();
  }
} else r.note('No gallery photos yet: lightbox test skipped (runs with `npm run check:examples`).');
// The 404 page answers in the visitor's language
{
  const page = await browser.newPage();
  const res = await page.goto(base + '/ro/nu-exista/');
  expect(res.status() === 404 && (await page.getAttribute('html', 'lang')) === 'ro', 'A missing Romanian URL does not show the Romanian 404 page');
  await page.close();
}
await browser.close();
server.close();
r.finish();
