// Fan wall 🐒: the band posts messages (and photos); fans react and comment.
// Storage: Cloudflare KV (binding WALL, free plan). Moderation: Mr. D.O.M. checks every comment
// (word filter in 8 languages + Llama Guard safety model + a toxicity check) and drops bad ones.
// Admin actions need the secret ADMIN_KEY (Cloudflare → Worker → Settings → Variables and Secrets).

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
});
const REACTIONS = ['🤘', '🔥', '🖤', '😂'];
const MAX_POSTS = 30;
const MAX_COMMENTS = 200;
const id = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

// ---------- moderation ----------
// Roots of slurs and strong insults in the site's 8 languages (matched after normalising
// accents, leetspeak and repeated letters). Kept short on purpose; the AI checks catch the rest.
// ROOTS are matched anywhere (they never occur inside innocent words); WORDS only as whole words
// (plus up to 3 extra letters for plurals/endings), so "spicy", "putere" or "future" stay allowed.
const ROOTS = [
  'nigg', 'faggot', 'motherfuck', 'fuck', 'cunt', 'killyourself', 'sugipula', 'pizda', 'labagiu', 'poponar', 'futut', 'futel',
  'vaffanculo', 'gilipollas', 'хуй', 'пизд', 'бляд', 'ебат', 'μαλακ', 'πουστ', 'شرموط', 'منيوك',
];
const WORDS = [
  'fag', 'kike', 'tranny', 'whore', 'slut', 'bitch', 'dickhead', 'asshole', 'retard', 'kys',
  'muie', 'pula', 'curva', 'tarfa', 'bozgor', 'jidan', 'connard', 'salope', 'encule', 'stronzo', 'puttana', 'frocio', 'cabron', 'maricon', 'sudaca',
  'blyat', 'bljad', 'suka', 'pidor', 'pidar', 'сука', 'пидор', 'malaka', 'γαμω',
];
const normalise = (s) => s.toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '')
  .replace(/[0@]/g, (c) => (c === '0' ? 'o' : 'a')).replace(/1|!|\|/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5|\$/g, 's').replace(/7/g, 't').replace(/\*/g, 'u')
  .replace(/(.)\1{2,}/g, '$1$1');
const squash = (s) => normalise(s).replace(/[^\p{L}\p{N}]+/gu, '');
const wordRes = WORDS.map((w) => new RegExp(`(^|[^\\p{L}])${normalise(w)}\\p{L}{0,3}([^\\p{L}]|$)`, 'u'));

export const wordFilter = (text) => {
  const plain = normalise(text);
  const tight = squash(text);
  return ROOTS.some((r) => tight.includes(squash(r))) || wordRes.some((re) => re.test(plain));
};

const aiCheck = async (env, text) => {
  if (!env.AI) return { ok: true, why: 'no-ai' };
  // 1) Llama Guard: hate, harassment, threats, sexual content, self-harm…
  try {
    const g = await env.AI.run('@cf/meta/llama-guard-3-8b', { messages: [{ role: 'user', content: text }] });
    const out = String(g?.response ?? g?.result?.response ?? '').toLowerCase();
    if (out.includes('unsafe')) return { ok: false, why: 'unsafe' };
  } catch { /* model unavailable: continue with the next check */ }
  // 2) Toxicity / trolling: insults, mocking, hostile negativity aimed at the band or other fans
  try {
    const r = await env.AI.run('@cf/meta/llama-3.1-8b-instruct-fast', {
      messages: [
        { role: 'system', content: 'You moderate comments on a metal band\'s website, in any language. Reply with exactly one word: TOXIC or OK. TOXIC means: insults, slurs, harassment, hate, threats, mocking or demeaning the band or other people, trolling meant to provoke, spam or scams. Honest criticism said politely, dark song themes and metal slang like "brutal" or "heavy as hell" are OK.' },
        { role: 'user', content: text },
      ],
      max_tokens: 3, temperature: 0,
    });
    const out = String(r?.response ?? r?.choices?.[0]?.message?.content ?? '').toUpperCase();
    if (out.includes('TOXIC')) return { ok: false, why: 'toxic' };
  } catch { /* fall through */ }
  return { ok: true, why: 'clean' };
};

export const moderate = async (env, text) => {
  if (/https?:\/\/|www\.|\.(com|ru|xyz|top|ro)\b/i.test(text)) return { ok: false, why: 'link' };
  if (wordFilter(text)) return { ok: false, why: 'words' };
  return aiCheck(env, text);
};

// ---------- helpers ----------
const ipKey = async (request, scope) => {
  const ip = request.headers.get('CF-Connecting-IP') || 'local';
  const day = new Date().toISOString().slice(0, 10);
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${ip}|${day}|bd316`));
  return `https://ratelimit.invalid/${scope}/${[...new Uint8Array(hash)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('')}`;
};
// Rate limits live in the free Cache API (no KV writes, nothing stored about the visitor beyond a day).
const limited = async (request, scope, seconds) => {
  const key = await ipKey(request, scope);
  const cache = caches.default;
  if (await cache.match(key)) return true;
  await cache.put(key, new Response('1', { headers: { 'Cache-Control': `max-age=${seconds}` } }));
  return false;
};
const isAdmin = (request, env) => {
  const key = env.ADMIN_KEY;
  const got = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!key || got.length !== key.length) return false;
  let diff = 0;
  for (let i = 0; i < key.length; i++) diff |= key.charCodeAt(i) ^ got.charCodeAt(i);
  return diff === 0;
};
const readIndex = async (env) => (await env.WALL.get('index', 'json')) ?? [];
const publicPost = (p) => ({
  id: p.id, date: p.date, text: p.text, image: p.image ? `/api/wall/img/${p.id}` : null,
  reactions: p.reactions, comments: (p.comments ?? []).map(({ id: cid, name, text, date }) => ({ id: cid, name, text, date })),
});

// ---------- routes ----------
export const wall = async (request, env, pathname) => {
  if (!env.WALL) return json({ posts: [], disabled: true });
  const method = request.method;

  if (pathname === '/api/wall' && method === 'GET') {
    const ids = (await readIndex(env)).slice(0, 10);
    const posts = (await Promise.all(ids.map((i) => env.WALL.get(`post:${i}`, 'json')))).filter(Boolean);
    return json({ posts: posts.map(publicPost) });
  }

  const img = pathname.match(/^\/api\/wall\/img\/([a-z0-9]+)$/);
  if (img && method === 'GET') {
    const data = await env.WALL.get(`img:${img[1]}`, 'arrayBuffer');
    if (!data) return new Response('Not found', { status: 404 });
    return new Response(data, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' } });
  }

  if (method !== 'POST' && method !== 'DELETE') return json({ error: 'Method not allowed' }, 405);
  if (method === 'POST' && (request.headers.get('Content-Type') || '').indexOf('application/json') !== 0) return json({ error: 'JSON only' }, 415);
  let body = {};
  if (method === 'POST') { try { body = await request.json(); } catch { return json({ error: 'Bad JSON' }, 400); } }

  // Fans: react
  if (pathname === '/api/wall/react') {
    if (!REACTIONS.includes(body.emoji)) return json({ error: 'Unknown reaction' }, 400);
    const post = await env.WALL.get(`post:${body.postId}`, 'json');
    if (!post) return json({ error: 'Not found' }, 404);
    if (await limited(request, `react-${post.id}-${REACTIONS.indexOf(body.emoji)}`, 86400)) return json({ ok: true, reactions: post.reactions, already: true });
    post.reactions[body.emoji] = (post.reactions[body.emoji] ?? 0) + 1;
    await env.WALL.put(`post:${post.id}`, JSON.stringify(post));
    return json({ ok: true, reactions: post.reactions });
  }

  // Fans: comment (checked by Mr. D.O.M. before it is saved)
  if (pathname === '/api/wall/comment') {
    const name = String(body.name ?? '').trim().slice(0, 40);
    const text = String(body.text ?? '').trim().slice(0, 400);
    if (body.website) return json({ ok: true }); // honeypot: bots fill hidden fields
    if (name.length < 2 || text.length < 2) return json({ error: 'empty' }, 400);
    const post = await env.WALL.get(`post:${body.postId}`, 'json');
    if (!post) return json({ error: 'Not found' }, 404);
    if (await limited(request, 'comment', 30)) return json({ error: 'slow' }, 429);
    const verdict = await moderate(env, `${name}: ${text}`);
    if (!verdict.ok) return json({ error: 'rejected', why: verdict.why }, 422);
    const comment = { id: id(), name, text, date: new Date().toISOString() };
    post.comments = [...(post.comments ?? []), comment].slice(-MAX_COMMENTS);
    await env.WALL.put(`post:${post.id}`, JSON.stringify(post));
    return json({ ok: true, comment });
  }

  // Admin
  if (pathname.startsWith('/api/wall/admin/')) {
    if (!env.ADMIN_KEY) return json({ error: 'ADMIN_KEY is not set yet' }, 503);
    if (!isAdmin(request, env)) return json({ error: 'Wrong admin key' }, 401);
    if (pathname === '/api/wall/admin/check') return json({ ok: true });
    if (pathname === '/api/wall/admin/post' && method === 'POST') {
      const text = String(body.text ?? '').trim().slice(0, 2000);
      if (!text && !body.image) return json({ error: 'empty' }, 400);
      const post = { id: id(), date: new Date().toISOString(), text, image: false, reactions: Object.fromEntries(REACTIONS.map((r) => [r, 0])), comments: [] };
      if (typeof body.image === 'string' && body.image.startsWith('data:image/jpeg;base64,')) {
        const bin = Uint8Array.from(atob(body.image.split(',')[1]), (c) => c.charCodeAt(0));
        if (bin.length > 3_000_000) return json({ error: 'Photo too large' }, 413);
        await env.WALL.put(`img:${post.id}`, bin);
        post.image = true;
      }
      await env.WALL.put(`post:${post.id}`, JSON.stringify(post));
      const ids = [post.id, ...(await readIndex(env))];
      for (const old of ids.slice(MAX_POSTS)) { await env.WALL.delete(`post:${old}`); await env.WALL.delete(`img:${old}`); }
      await env.WALL.put('index', JSON.stringify(ids.slice(0, MAX_POSTS)));
      return json({ ok: true, post: publicPost(post) });
    }
    const delPost = pathname.match(/^\/api\/wall\/admin\/post\/([a-z0-9]+)$/);
    if (delPost && method === 'DELETE') {
      await env.WALL.delete(`post:${delPost[1]}`); await env.WALL.delete(`img:${delPost[1]}`);
      await env.WALL.put('index', JSON.stringify((await readIndex(env)).filter((i) => i !== delPost[1])));
      return json({ ok: true });
    }
    const delComment = pathname.match(/^\/api\/wall\/admin\/comment\/([a-z0-9]+)\/([a-z0-9]+)$/);
    if (delComment && method === 'DELETE') {
      const post = await env.WALL.get(`post:${delComment[1]}`, 'json');
      if (!post) return json({ error: 'Not found' }, 404);
      post.comments = (post.comments ?? []).filter((c) => c.id !== delComment[2]);
      await env.WALL.put(`post:${post.id}`, JSON.stringify(post));
      return json({ ok: true });
    }
  }
  return json({ error: 'Not found' }, 404);
};
