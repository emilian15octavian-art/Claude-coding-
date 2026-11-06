/**
 * Mr. D.O.M.'s weekly exam 🐒: asks the LIVE chat the questions real visitors ask (fans, promoters,
 * journalists, in several languages) and checks the answers: the AI answered, in the right script,
 * every link he gives exists on the site, and he does not invent shows or Spotify links.
 * Writes reports/dom-exam.md (all questions + answers); exits 1 if any answer fails.
 */
import fs from 'node:fs';
const SITE = (process.env.SITE_URL || 'https://claude-coding.bleedingdebts316.workers.dev').replace(/\/$/, '');
const exam = [
  ['en', 'hi! who are you?'],
  ['en', 'Where can I listen to your songs?'],
  ['en', 'Are you on Spotify?'],
  ['en', "I'm a promoter in Cluj, how do I book you for a festival?"],
  ['en', "I'm a journalist, do you have photos and a bio?"],
  ['en', 'When is your next concert?'],
  ['en', 'How much is a t-shirt?'],
  ['en', 'What is Killer Maze about?'],
  ['en', 'What is the name of your drummer?'],
  ['ro', 'Salut, cine face parte din trupă?'],
  ['ro', 'Unde găsesc videoclipurile?'],
  ['fr', 'Comment je peux recevoir les nouvelles?'],
  ['it', 'Avete un negozio?'],
  ['es', '¿Puedo usar vuestra música en mi vídeo de YouTube?'],
  ['ar', 'أين يمكنني الاستماع إلى أغانيكم؟'],
  ['ru', 'Как с вами связаться?'],
  ['el', 'Ποια είναι τα τραγούδια σας;'],
];
const script = { ar: /[؀-ۿ]/, ru: /[Ѐ-ӿ]/, el: /[Ͱ-Ͽ]/ };
const sitemap = await (await fetch(`${SITE}/sitemap.xml`)).text();
const known = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname));
const out = [];
let failed = 0;
for (const [lang, q] of exam) {
  const problems = [];
  let data = {};
  try {
    const r = await fetch(`${SITE}/api/dom`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lang, messages: [{ role: 'user', content: q }] }), signal: AbortSignal.timeout(30000) });
    data = await r.json();
  } catch (e) { problems.push(`no answer (${e})`); }
  const a = data.reply || '';
  if (data.source !== 'ai') problems.push(`answered from the backup FAQ, not the AI (${data.aiError || '?'})`);
  if (script[lang] && !script[lang].test(a)) problems.push(`not answered in ${lang}`);
  for (const p of a.match(/\/(?:en|fr|ro|it|es|ar|ru|el)\/[a-z0-9\-/]*/g) || []) {
    const clean = p.endsWith('/') ? p : `${p}/`;
    if (!known.has(clean)) problems.push(`links to ${p}, which does not exist`);
  }
  if (/\b(shop|store|negozio|magazin(ul)?|boutique|tienda|matjar|магазин|κατάστημα)\b[^.!?]{0,40}?\s(is open|now open|è aperto|e deschis|este deschis|est ouverte|está abierta|открыт|είναι ανοιχτό)/i.test(a)) problems.push('said the shop is open (it is not)');
  if (/\b(I am|I'm|Eu sunt|Sunt|Eu,)\s+(Mr\. D\.I\.P|RUSH|Rush The Flow|un membru)/i.test(a)) problems.push('pretended to be a band member');
  if (/\bpoint to\b|FACTS|\[[^\]]+\]/i.test(a)) problems.push('leaked instructions or markdown');
  if (a.length > 40 && !/[.!?…)\]"»]\s*$|\/\s*$|[\u{1F300}-\u{1FAFF}]\s*$/u.test(a)) problems.push('answer looks cut off');
  if (/open\.spotify\.com|spotify\.com\/artist/i.test(a)) problems.push('gave a Spotify link');
  if (/(tickets? (are|cost)|bilete costă|\b\d{1,3} ?(lei|ron|€|eur)\b)/i.test(a)) problems.push('may have invented a price');
  if (problems.length) failed++;
  out.push(`### ${problems.length ? '❌' : '✅'} (${lang}) ${q}\n\n> ${a.replace(/\n+/g, ' ')}${data.unknown ? '\n\n_(offered to pass the question to the band)_' : ''}${problems.length ? `\n\n**Problems:** ${problems.join('; ')}` : ''}\n`);
  await new Promise((r) => setTimeout(r, 1500));
}
const head = `# 🐒 Mr. D.O.M.'s exam: ${exam.length - failed}/${exam.length} passed\n\nIf an answer is wrong, add the correct answer to the FAQ (src/content/pages/<language>/faq.md). He reads it after the next deploy.\n\n`;
fs.mkdirSync('reports', { recursive: true });
fs.writeFileSync('reports/dom-exam.md', head + out.join('\n'));
console.log(head + out.join('\n'));
process.exit(failed ? 1 : 0);
