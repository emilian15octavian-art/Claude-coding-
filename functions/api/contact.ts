/**
 * Cloudflare Pages Function: POST /api/contact
 * The only server-side code of the site (free: 100,000 requests/day).
 *  1. rejects bots (honeypot field + Cloudflare Turnstile check)
 *  2. forwards the message to Web3Forms (or Formspree) which e-mails it to you.
 * Secrets are set in Cloudflare → Pages → Settings → Variables and secrets (never in the repository):
 *   TURNSTILE_SECRET   Turnstile secret key
 *   WEB3FORMS_KEY      Web3Forms access key   (or FORMSPREE_ID: the id from https://formspree.io/f/<id>)
 */
interface Env { TURNSTILE_SECRET?: string; WEB3FORMS_KEY?: string; FORMSPREE_ID?: string }
type Ctx = { request: Request; env: Env };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export const onRequestPost = async ({ request, env }: Ctx): Promise<Response> => {
  const wantsJson = (request.headers.get('Accept') ?? '').includes('application/json');
  const form = await request.formData();
  const get = (k: string) => String(form.get(k) ?? '').trim();
  const rawRedirect = get('redirect');
  const back = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/en/contact/';
  const done = (ok: boolean, status = ok ? 200 : 400) =>
    wantsJson ? json({ success: ok }, status) : Response.redirect(new URL(`${back}?sent=${ok ? 1 : 0}`, request.url).toString(), 303);

  // Honeypot: real people never fill in the hidden "website" field. Pretend success for bots.
  if (get('website')) return done(true);

  const name = get('name').slice(0, 120);
  const email = get('email').slice(0, 200);
  const message = get('message').slice(0, 5000);
  const subject = get('subject').slice(0, 40) || 'Other';
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !message) return done(false);

  // Cloudflare Turnstile
  if (env.TURNSTILE_SECRET) {
    const body = new FormData();
    body.append('secret', env.TURNSTILE_SECRET);
    body.append('response', get('cf-turnstile-response'));
    const ip = request.headers.get('CF-Connecting-IP');
    if (ip) body.append('remoteip', ip);
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const outcome = (await r.json()) as { success: boolean };
    if (!outcome.success) return done(false, 403);
  }

  const payload = { name, email, subject: `[Website · ${subject}] ${name}`, message, language: get('lang'), from_name: 'Bleeding Debts 316 website', replyto: email };
  let ok = false;
  if (env.WEB3FORMS_KEY) {
    const r = await fetch('https://api.web3forms.com/submit', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ access_key: env.WEB3FORMS_KEY, ...payload }),
    });
    ok = r.ok;
  } else if (env.FORMSPREE_ID) {
    const r = await fetch(`https://formspree.io/f/${encodeURIComponent(env.FORMSPREE_ID)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ ...payload, _replyto: email }),
    });
    ok = r.ok;
  }
  return done(ok, ok ? 200 : 502);
};

export const onRequest = (): Response => new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
