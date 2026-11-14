/**
 * The promo hive's own scheduler 🐝: publishes the posts waiting in social/queue/ to the Facebook Page and
 * the Instagram account when their time has come, then moves them to social/done/ with the links.
 * It talks straight to Meta's official Graph API: no scheduling service, no monthly post limit.
 *
 * A post is one JSON file in social/queue/ (copy social/examples/example-post.json):
 *   when       "2026-12-01T21:00:00+02:00"  (always with the UTC offset; +02:00 is Romanian winter time, +03:00 summer)
 *   platforms  ["facebook", "instagram"]
 *   type       "image" | "carousel" | "reel" | "text"   (text is Facebook only)
 *   media      file names inside public/social/ (JPEG for images, MP4 for reels)
 *   caption    one text, or { "facebook": "...", "instagram": "..." }
 *
 * Needs three repository secrets: META_PAGE_ID, META_PAGE_TOKEN, META_IG_USER_ID (see MAINTENANCE.md).
 * Usage: node scripts/hive/publish.mjs [--dry-run] [--now 2026-12-01T19:05:00Z]
 */
import fs from 'node:fs';
import path from 'node:path';

const SITE = (process.env.SITE_URL || 'https://claude-coding.bleedingdebts316.workers.dev').replace(/\/$/, '');
const GRAPH = (process.env.META_GRAPH_URL || 'https://graph.facebook.com/v21.0').replace(/\/$/, ''); // overridable for tests
const { META_PAGE_ID: PAGE, META_PAGE_TOKEN: TOKEN, META_IG_USER_ID: IG } = process.env;
const [QUEUE, DONE, MEDIA] = ['social/queue', 'social/done', 'public/social'];
const args = process.argv.slice(2);
const dry = args.includes('--dry-run');
const now = new Date(args.includes('--now') ? args[args.indexOf('--now') + 1] : Date.now());
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Returns the problems with a queued post, in plain words. An empty list means it can be published. */
export function problems(post) {
  const out = [];
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:\d{2})$/.test(post.when ?? '')) out.push('"when" must look like 2026-12-01T21:00:00+02:00 (with the UTC offset at the end).');
  const platforms = post.platforms ?? [];
  if (!platforms.length || platforms.some((p) => !['facebook', 'instagram'].includes(p))) out.push('"platforms" must list "facebook", "instagram" or both.');
  if (!['image', 'carousel', 'reel', 'text'].includes(post.type)) out.push('"type" must be "image", "carousel", "reel" or "text".');
  const media = post.media ?? [];
  const need = { image: [1, 1], carousel: [2, 10], reel: [1, 1], text: [0, 0] }[post.type];
  if (need && (media.length < need[0] || media.length > need[1])) out.push(`A ${post.type} post needs ${need[0] === need[1] ? need[0] : `${need[0]} to ${need[1]}`} media file(s); this one has ${media.length}.`);
  if (post.type === 'text' && platforms.includes('instagram')) out.push('Instagram cannot publish a post without a picture or video.');
  for (const m of media) {
    if (!fs.existsSync(path.join(MEDIA, m))) out.push(`Media file public/social/${m} does not exist.`);
    else if (post.type === 'reel' ? !/\.mp4$/i.test(m) : !/\.jpe?g$/i.test(m)) out.push(`public/social/${m}: ${post.type === 'reel' ? 'reels must be .mp4' : 'images must be .jpg (Instagram refuses PNG)'}.`);
  }
  for (const p of platforms) {
    const text = captionFor(post, p);
    if (!text && post.type === 'text') out.push('A text post needs a caption.');
    if (p === 'instagram' && text.length > 2200) out.push(`The Instagram caption is ${text.length} characters; the limit is 2200.`);
  }
  return out;
}
const captionFor = (post, platform) => (typeof post.caption === 'string' ? post.caption : post.caption?.[platform] ?? '');
const urlOf = (file) => `${SITE}/social/${encodeURIComponent(file)}`;

async function graph(method, endpoint, params = {}) {
  const body = new URLSearchParams({ ...params, access_token: TOKEN });
  const res = await fetch(method === 'GET' ? `${GRAPH}/${endpoint}?${body}` : `${GRAPH}/${endpoint}`, method === 'GET' ? {} : { method, body });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) throw new Error(`Meta said: ${json.error?.message ?? res.status} (${method} ${endpoint.replace(/\?.*/, '')})`);
  return json;
}

async function toFacebook(post) {
  const message = captionFor(post, 'facebook');
  const media = (post.media ?? []).map(urlOf);
  if (post.type === 'text') return (await graph('POST', `${PAGE}/feed`, { message })).id;
  if (post.type === 'reel') return (await graph('POST', `${PAGE}/videos`, { file_url: media[0], description: message })).id;
  if (post.type === 'image') { const r = await graph('POST', `${PAGE}/photos`, { url: media[0], caption: message }); return r.post_id ?? r.id; }
  const ids = [];
  for (const url of media) ids.push((await graph('POST', `${PAGE}/photos`, { url, published: 'false' })).id);
  return (await graph('POST', `${PAGE}/feed`, { message, ...Object.fromEntries(ids.map((id, i) => [`attached_media[${i}]`, JSON.stringify({ media_fbid: id })])) })).id;
}

/** Instagram publishes in two steps: make a container, wait until Meta has fetched the file, then publish it. */
async function toInstagram(post) {
  const caption = captionFor(post, 'instagram');
  const media = (post.media ?? []).map(urlOf);
  const ready = async (id) => {
    for (let i = 0; i < 60; i++) {
      const { status_code: s } = await graph('GET', id, { fields: 'status_code' });
      if (s === 'FINISHED') return id;
      if (s === 'ERROR' || s === 'EXPIRED') throw new Error(`Instagram could not process the media (${s}).`);
      await sleep(process.env.META_GRAPH_URL ? 5 : 5000);
    }
    throw new Error('Instagram was still processing the media after 5 minutes.');
  };
  let container;
  if (post.type === 'image') container = (await graph('POST', `${IG}/media`, { image_url: media[0], caption })).id;
  else if (post.type === 'reel') container = (await graph('POST', `${IG}/media`, { media_type: 'REELS', video_url: media[0], caption, share_to_feed: 'true' })).id;
  else {
    const children = [];
    for (const url of media) children.push(await ready((await graph('POST', `${IG}/media`, { image_url: url, is_carousel_item: 'true' })).id));
    container = (await graph('POST', `${IG}/media`, { media_type: 'CAROUSEL', children: children.join(','), caption })).id;
  }
  const { id } = await graph('POST', `${IG}/media_publish`, { creation_id: await ready(container) });
  return (await graph('GET', id, { fields: 'permalink' })).permalink ?? id;
}

async function reachable(post) {
  for (const m of post.media ?? []) {
    const res = await fetch(urlOf(m), { method: 'HEAD' }).catch(() => undefined);
    if (!res?.ok) return false;
  }
  return true;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const files = fs.existsSync(QUEUE) ? fs.readdirSync(QUEUE).filter((f) => f.endsWith('.json')).sort() : [];
  const configured = PAGE && TOKEN && IG;
  let failed = 0, published = 0;
  for (const f of files) {
    const file = path.join(QUEUE, f);
    let post;
    try { post = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { console.error(`❌ ${f}: not valid JSON (${e.message})`); failed++; continue; }
    const bad = problems(post);
    if (bad.length) { console.error(`❌ ${f}:\n${bad.map((b) => `   - ${b}`).join('\n')}`); failed++; continue; }
    if (new Date(post.when) > now) { console.log(`⏳ ${f}: waiting until ${post.when}`); continue; }
    const todo = post.platforms.filter((p) => !post.published?.[p]); // a platform that already went out is never repeated
    if (dry || !configured) { console.log(`📝 ${f}: would publish now to ${todo.join(' + ')}${configured || dry ? '' : ' (the META_* secrets are not set yet, so nothing was sent)'}`); continue; }
    if (!(await reachable(post))) { console.log(`⏳ ${f}: its media is not live on ${SITE}/social/ yet; trying again on the next run`); continue; }
    for (const p of todo) {
      try {
        const link = await (p === 'facebook' ? toFacebook(post) : toInstagram(post));
        post.published = { ...post.published, [p]: { at: new Date().toISOString(), id: String(link) } };
        fs.writeFileSync(file, `${JSON.stringify(post, null, 2)}\n`); // saved at once, so a later failure cannot cause a double post
        console.log(`✅ ${f}: published to ${p} (${link})`);
        published++;
      } catch (e) { console.error(`❌ ${f}: ${p} failed. ${e.message}`); failed++; }
    }
    if (post.platforms.every((p) => post.published?.[p])) { fs.mkdirSync(DONE, { recursive: true }); fs.renameSync(file, path.join(DONE, f)); }
  }
  console.log(`\n${files.length} queued, ${published} published, ${failed} problem(s).`);
  if (failed) process.exit(1);
}
