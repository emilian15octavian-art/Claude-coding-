// Cloudflare Worker in front of the static site. It only runs for the paths listed in
// wrangler.jsonc → assets.run_worker_first; everything else is served straight from dist/.
//  - /google…html : Google's verification file (Cloudflare would otherwise redirect "/file.html" → "/file")
//  - /api/dom     : Mr. D.O.M. 🐒, the band's monkey assistant (Cloudflare Workers AI, free daily allowance)
const VERIFY = {
  '/google853763245a87759b.html': 'google-site-verification: google853763245a87759b.html',
};

// Tried in order: if Cloudflare retires or limits one model, the next one answers.
const MODELS = ['@cf/meta/llama-3.1-8b-instruct-fast', '@cf/meta/llama-3.1-8b-instruct', '@cf/meta/llama-3.2-3b-instruct', '@cf/mistral/mistral-7b-instruct-v0.1'];
const LANGS = { en: 'English', fr: 'French', ro: 'Romanian', it: 'Italian', es: 'Spanish', ar: 'Arabic', ru: 'Russian', el: 'Greek' };

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
});

const pickOne = (list) => list[Math.floor(Math.random() * list.length)];
const JOKES = [
  '🐒 Why did the metalhead monkey get kicked out of the zoo? Too much head-banana-ing.',
  '🐒 I tried a stage dive once. Landed in a fruit bowl. Best show of my life.',
  '🐒 My favourite genre? Groove metal. Groove because I dance, metal because the banana cage is steel.',
  '🐒 RUSH asked me to tune the guitar. I peeled it instead. We do not talk about it.',
];
const HELLOS = [
  '🐒 Ooh ooh, hello! Mr. D.O.M. here. Want songs, videos, shows or booking info?',
  '🐒 Hey hey! The monkey is in. Ask me anything about Bleeding Debts 316.',
  '🐒 Salut! Banana break is over, I am all yours. What do you want to know?',
];
const DEFAULTS = [
  '🐒 Hmm, that one is above my branch. Try asking about the songs, the videos, shows, merch or booking.',
  '🐒 My banana brain did not catch that. I know about the music, the videos, shows and how to contact the band.',
  '🐒 Good question, wrong monkey! For anything special, use the contact form or write to bleedingdebts316@gmail.com.',
];

/** Answers without AI (used when Workers AI is unavailable or the daily free allowance is used up). */
export const fallback = (text, lang) => {
  const q = text.toLowerCase();
  const p = (path) => `/${lang}/${path}`;
  const topics = [
    [/spotify/, `🐒 Spotify? I searched every banana crate in the building. We are not there: not lost, just allergic. Listen on SoundCloud (soundcloud.com/bleedingdebts316) and YouTube instead!`],
    [/song|music|track|listen|soundcloud|pies|muzic|musique|musica|música|песн|музык|τραγούδ|μουσικ|أغني|موسيق/, `🎵 Four singles so far: Killer Maze, InsurREXion (MANIA), Gray Gatz Be and cornucopium. Listen on SoundCloud (soundcloud.com/bleedingdebts316) or on the Music page.`],
    [/video|clip|youtube|видео|βίντεο|فيديو/, '🎬 Two official videos are out: cornucopium and InsurREXion (MANIA). Find them on the Videos page or at youtube.com/@bleedingdebts316'],
    [/show|concert|gig|tour|ticket|bilet|billet|концерт|συναυλ|حفل/, '🎟️ No shows announced yet. Join the newsletter and you will be the first to know.'],
    [/merch|shop|buy|t-shirt|tricou|magazin|boutique|tienda|negozio|мерч|магазин|κατάστημα|متجر/, '👕 The merch shop opens soon. Bananas not included. Sign up for the newsletter to be first in line.'],
    [/book|contact|email|mail|booking|rezerv|контакт|επικοινων|حجز|اتصال/, '📩 Booking and messages: use the contact form on the site, or write to bleedingdebts316@gmail.com'],
    [/joke|funny|glum|banc|blague|barzelletta|chiste|шутк|ανέκδοτ|نكتة/, () => pickOne(JOKES)],
    [/d\.?o\.?m|monkey|maimu|singe|scimmia|mono|обезьян|μαϊμού|قرد|who are you|cine e[sș]ti/, '🐒 I am Mr. D.O.M., the band\'s monkey assistant. I know the songs, the videos, the shows and how to book the band. Ask away!'],
    [/^(hi|hey|hello|salut|buna|bună|ciao|hola|bonjour|привет|γεια|مرحبا)\b/, () => pickOne(HELLOS)],
    [/member|who|band|trup|groupe|gruppo|grupo|группа|συγκρότημα|فرقة/, '🤘 Bleeding Debts 316 is original metal from Romania, formed in 2026: Rush The Flow (RUSH) on production, mixing and composing, and Mr. D.I.P. (D\'8ONE) on vocals, lyrics and performance.'],
    [/newsletter|subscribe|abon|inscri|iscri|suscri|подпис|εγγραφ|اشترك/, '📰 The newsletter sign-up is on the home page and the Newsletter page. A few e-mails a year, never spam.'],
  ];
  for (const [rx, answer] of topics) if (rx.test(q)) return typeof answer === 'function' ? answer() : answer;
  return pickOne(DEFAULTS);
};

const domChat = async (request, env) => {
  if (request.method !== 'POST') return json({ error: 'POST only' }, 405);
  if ((request.headers.get('Content-Type') || '').indexOf('application/json') !== 0) return json({ error: 'JSON only' }, 415);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Bad JSON' }, 400); }
  const lang = LANGS[body?.lang] ? body.lang : 'en';
  const history = (Array.isArray(body?.messages) ? body.messages : [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 600) }));
  const last = history.filter((m) => m.role === 'user').pop();
  if (!last) return json({ error: 'No question' }, 400);

  if (!env.AI) return json({ reply: fallback(last.content, lang), source: 'faq', aiError: 'no AI binding' });
  let facts = '';
  try {
    const r = await env.ASSETS.fetch(new Request(new URL('/llms.txt', request.url)));
    facts = (await r.text()).slice(0, 6000);
  } catch { /* answer without facts */ }
  const system = [
    'You are Mr. D.O.M., the funny, warm monkey assistant of the Romanian metal band Bleeding Debts 316.',
    'Personality: playful, short sentences, the occasional monkey joke or banana reference, never rude, never preachy. Max 90 words.',
    `Reply in the same language as the visitor's last message (the page language is ${LANGS[lang]}).`,
    'Only state facts that appear in the FACTS below. If something is not there (prices, show dates, private info), say you do not know yet and point to the newsletter or the contact form.',
    'The band is NOT on Spotify on purpose; if asked, joke about it (you searched every banana crate) and point to SoundCloud and YouTube.',
    'Never invent shows, prices, release dates, members or quotes. Never give personal opinions on religion or politics; the band speaks for itself in its songs.',
    'Never ask for or repeat personal data. Booking/press: the contact form on the site or bleedingdebts316@gmail.com.',
    'Song titles and the band name are never translated.',
    'FACTS:', facts,
  ].join('\n');
  const errors = [];
  for (const model of MODELS) {
    try {
      const out = await env.AI.run(model, { messages: [{ role: 'system', content: system }, ...history], max_tokens: 220, temperature: 0.7 });
      const raw = typeof out === 'string' ? out : out?.response ?? out?.result?.response ?? out?.choices?.[0]?.message?.content ?? '';
      const reply = String(typeof raw === 'string' ? raw : JSON.stringify(raw)).trim();
      if (reply) return json({ reply, source: 'ai', model });
      errors.push(`${model}: empty answer`);
    } catch (e) {
      errors.push(`${model}: ${String(e?.message || e).slice(0, 160)}`);
    }
  }
  console.log('Mr. D.O.M. AI failed', errors);
  return json({ reply: fallback(last.content, lang), source: 'faq', aiError: errors.join(' | ') });
};

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (VERIFY[pathname]) {
      return new Response(VERIFY[pathname], { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
    }
    if (pathname === '/api/dom') return domChat(request, env);
    return env.ASSETS.fetch(request);
  },
};
