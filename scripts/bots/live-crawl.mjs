/**
 * Mr. D.O.M.'s night patrol 🐒: opens EVERY page listed in the live sitemap (all 8 languages),
 * plus robots.txt, llms.txt, the Google verification file and the chat endpoint, and reports
 * anything that does not answer correctly. Writes reports/live-crawl.md; exits 1 on problems.
 */
import fs from 'node:fs';
const SITE = (process.env.SITE_URL || 'https://claude-coding.bleedingdebts316.workers.dev').replace(/\/$/, '');
const problems = [];
const get = async (url, init) => {
  for (let i = 0; i < 3; i++) {
    try { return await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(20000), ...init }); }
    catch (e) { if (i === 2) return { status: 0, error: String(e), text: async () => '' }; await new Promise((r) => setTimeout(r, 3000)); }
  }
};
const sm = await get(`${SITE}/sitemap.xml`);
const xml = sm.status === 200 ? await sm.text() : '';
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (!urls.length) problems.push(`sitemap.xml did not load (status ${sm.status})`);
const extra = ['/robots.txt', '/llms.txt', '/health.json', '/google853763245a87759b.html'].map((p) => SITE + p);
let i = 0;
const check = async () => {
  while (i < urls.length + extra.length) {
    const u = [...urls, ...extra][i++];
    const r = await get(u);
    if (r.status !== 200) problems.push(`${u} answered ${r.status || r.error}`);
  }
};
await Promise.all(Array.from({ length: 6 }, check));
const chat = await get(`${SITE}/api/dom`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lang: 'en', messages: [{ role: 'user', content: 'hi' }] }) });
let reply = '';
try { reply = (await chat.json()).reply || ''; } catch {}
if (chat.status !== 200 || !reply) problems.push(`Mr. D.O.M. chat (/api/dom) did not answer (status ${chat.status})`);
const total = urls.length + extra.length + 1;
fs.mkdirSync('reports', { recursive: true });
fs.writeFileSync('reports/live-crawl.md', problems.length
  ? `🐒 Mr. D.O.M. here. I checked ${total} addresses on the live site and ${problems.length} did not answer correctly:\n\n${problems.map((p) => `- ${p}`).join('\n')}\n\n**How to fix:** open the address yourself. If it is really broken, look at the latest Cloudflare build (dash.cloudflare.com → Workers & Pages → claude-coding → Deployments) and roll back if needed. A one-off timeout is usually a glitch; this issue closes itself on the next good patrol.\n`
  : `🐒 All ${total} live addresses answered correctly.\n`);
console.log(fs.readFileSync('reports/live-crawl.md', 'utf8'));
process.exit(problems.length ? 1 : 0);
