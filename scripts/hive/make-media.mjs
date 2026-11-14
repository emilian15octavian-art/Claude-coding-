/**
 * The promo hive's media kit 🐝: for every release, show or video file it is given, builds
 * ready-to-post visuals in the logo's style into reports/hive/:
 *   <id>-post.jpg   1080×1350 feed post (Instagram / Facebook)
 *   <id>-story.jpg  1080×1920 story
 *   <id>-reel.mp4   1080×1920 short video: hook on the first frame, then the pitch, then the link
 * Everything here is open source (see OPEN-SOURCE.md): satori + resvg + sharp draw the frames,
 * ffmpeg turns them into the video. No paid service and no API key.
 * Usage: node scripts/hive/make-media.mjs <content files...> [--audio song.mp3 --audio-start 40]
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
const SITE = (process.env.SITE_URL || 'https://claude-coding.bleedingdebts316.workers.dev').replace(/\/$/, '');
const HOST = SITE.replace(/^https?:\/\//, '');
const OUT = 'reports/hive';
const [BG, TEXT, MUTED, ACCENT] = ['#000000', '#ffffff', '#b3b3b3', '#e5383b']; // src/styles/global.css tokens

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i === -1 ? undefined : args.splice(i, 2)[1]; };
const audio = opt('--audio');
const audioStart = Number(opt('--audio-start') ?? 0);
const files = args.filter((f) => /src\/content\/(releases|shows|videos)\/[^/]+\.json$/.test(f) && fs.existsSync(f));
if (!files.length) { console.log('Nothing new to make media for.'); process.exit(0); }

// Latin first, then Latin Extended as the fallback for ș ț ă and friends (satori picks per glyph).
const fonts = ['latin', 'latin-ext'].flatMap((subset) => [700, 900].map((weight) => ({ name: subset === 'latin' ? 'Nunito' : 'Nunito Ext', weight, style: 'normal', data: fs.readFileSync(require.resolve(`@fontsource/nunito/files/nunito-${subset}-${weight}-normal.woff`)) })));
const logo = fs.readFileSync('src/assets/logo.svg', 'utf8').replace('currentColor', TEXT);
const logoData = `data:image/svg+xml;base64,${Buffer.from(logo).toString('base64')}`;
const h = (type, style, children, extra = {}) => ({ type, props: { style, children, ...extra } });
// Nunito's Latin subset has no emoji and no non-Latin scripts, so the frames carry plain Latin text only.
const latin = (s) => String(s ?? '').replace(/[^ -ɏ‘-”]/g, '').replace(/\s+/g, ' ').trim();
const firstSentence = (s) => (latin(s).match(/^.*?[.!?](?=\s|$)/)?.[0] ?? latin(s));

/** What the hive says about one content file: a kicker, a title, one line of pitch and a call to action. */
async function describe(file) {
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const id = path.basename(file, '.json');
  const img = async (rel, w, hgt) => {
    const p = rel && path.resolve(path.dirname(file), rel);
    if (!p || !fs.existsSync(p)) return undefined;
    const buf = await sharp(p).resize(w, hgt, { fit: 'cover' }).jpeg({ quality: 88 }).toBuffer();
    return { src: `data:image/jpeg;base64,${buf.toString('base64')}`, w, h: hgt };
  };
  if (file.includes('/releases/')) return { id, kicker: `New ${d.type || 'release'}`, title: latin(d.title), pitch: firstSentence(d.hook?.en ?? d.hook ?? d.description?.en), rest: latin(d.hook?.en ?? '').replace(firstSentence(d.hook?.en ?? ''), '').trim(), cta: 'Listen now', image: await img(d.cover, 640, 640) };
  if (file.includes('/shows/')) {
    const when = new Date(`${d.start}:00Z`);
    const date = when.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    return { id, kicker: d.status === 'soldout' ? 'Sold out' : 'Live', title: latin(d.venue?.city ?? d.venue?.name), pitch: `${date}, ${d.start.split('T')[1]}`, rest: latin(d.venue?.name), cta: d.free ? 'Free entry' : d.ticketUrl ? 'Tickets' : 'See you there' };
  }
  return { id, kicker: 'New video', title: latin(d.title), pitch: firstSentence(d.description?.en), rest: '', cta: 'Watch now', image: await img(d.thumbnail, 900, 506) };
}

/** The title in the logo's motif: first letter in a white box, the rest in white. Shrinks to fit the width. */
function titleBlock(title, maxWidth, base) {
  const size = Math.min(base, Math.floor((maxWidth / Math.max(title.length, 4)) * 1.75));
  return h('div', { display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT, fontWeight: 900, fontSize: size, lineHeight: 1, letterSpacing: -2, maxWidth }, [
    h('div', { display: 'flex', flexShrink: 0, background: TEXT, color: BG, padding: `4px ${/[IiljtfJr1!]/.test(title[0]) ? Math.round(size * 0.2) : 10}px 12px`, marginRight: 6 }, title[0]),
    h('div', { display: 'flex', flexShrink: 0, whiteSpace: 'nowrap', paddingBottom: 8 }, title.slice(1)),
  ]);
}
const kicker = (s, size) => h('div', { display: 'flex', color: ACCENT, fontWeight: 900, fontSize: size, letterSpacing: 8, textTransform: 'uppercase' }, s);
const line = (s, size, color = TEXT, weight = 700) => h('div', { display: 'flex', textAlign: 'center', justifyContent: 'center', color, fontWeight: weight, fontSize: size, lineHeight: 1.25, maxWidth: 900 }, s);
const button = (s, size) => h('div', { display: 'flex', background: ACCENT, color: BG, fontWeight: 900, fontSize: size, padding: '18px 44px', borderRadius: 12 }, s);
const logoImg = (w) => h('img', { width: w, height: Math.round(w * 0.504) }, undefined, { src: logoData, width: w, height: Math.round(w * 0.504) });
const picture = (im, scale = 1) => im && h('img', { width: im.w * scale, height: im.h * scale, borderRadius: 8 }, undefined, { src: im.src, width: im.w * scale, height: im.h * scale });
const frame = (width, height, gap, children) => h('div', { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap, width, height, padding: 70, background: BG, fontFamily: 'Nunito, Nunito Ext' }, children.filter(Boolean));

async function render(tree, width, height, file) {
  const svg = await satori(tree, { width, height, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();
  await (file.endsWith('.png') ? sharp(png).png() : sharp(png).jpeg({ quality: 90 })).toFile(file);
}

/** Three scenes, each a still that ffmpeg pushes in on slowly. Scene 1 must read with the sound off. */
function reelScenes(x) {
  return [
    frame(1080, 1920, 70, [kicker(x.kicker, 52), titleBlock(x.title, 940, 150), line(x.pitch, 76, TEXT, 900)]),
    frame(1080, 1920, 60, [picture(x.image, x.image?.w > 700 ? 1 : 1.25), line(x.rest || x.pitch, x.image ? 56 : 84, x.image ? MUTED : TEXT, x.image ? 700 : 900)]),
    frame(1080, 1920, 70, [logoImg(620), button(x.cta, 64), line(HOST, 40, MUTED)]),
  ];
}

function makeReel(x, stills) {
  if (spawnSync('ffmpeg', ['-version']).status !== 0) { console.log(`  (no ffmpeg here, skipped ${x.id}-reel.mp4)`); return; }
  const secs = [3, 3, 2.5], fps = 30;
  const inputs = stills.flatMap((s) => ['-loop', '1', '-i', s]);
  const zoom = stills.map((_, i) => `[${i}:v]scale=2160:3840,zoompan=z='1+0.04*on/${secs[i] * fps}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${secs[i] * fps}:s=1080x1920:fps=${fps},trim=duration=${secs[i]},setpts=PTS-STARTPTS[v${i}]`);
  const total = secs.reduce((a, b) => a + b, 0);
  const sound = audio && fs.existsSync(audio)
    ? ['-ss', String(audioStart), '-t', String(total), '-i', audio]
    : ['-f', 'lavfi', '-t', String(total), '-i', 'anullsrc=r=44100:cl=stereo']; // silent track: some platforms reject video without audio
  const out = `${OUT}/${x.id}-reel.mp4`;
  const r = spawnSync('ffmpeg', ['-v', 'error', '-y', ...inputs, ...sound,
    '-filter_complex', `${zoom.join(';')};${stills.map((_, i) => `[v${i}]`).join('')}concat=n=${stills.length}:v=1:a=0,format=yuv420p[v];[${stills.length}:a]afade=t=out:st=${total - 0.8}:d=0.8[a]`,
    '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-c:a', 'aac', '-b:a', '160k', '-t', String(total), '-movflags', '+faststart', out], { encoding: 'utf8' });
  if (r.status !== 0) { console.error(r.stderr); process.exit(1); }
  console.log(`  ${out}`);
}

fs.mkdirSync(OUT, { recursive: true });
for (const file of files) {
  const x = await describe(file);
  console.log(`🐝 ${x.id}`);
  await render(frame(1080, 1350, 44, [kicker(x.kicker, 40), picture(x.image, x.image?.w > 700 ? 1 : 0.9), titleBlock(x.title, 940, 120), line(x.pitch, 50), h('div', { display: 'flex', alignItems: 'center', gap: 28 }, [logoImg(150), line(HOST, 28, MUTED)])]), 1080, 1350, `${OUT}/${x.id}-post.jpg`);
  console.log(`  ${OUT}/${x.id}-post.jpg`);
  await render(frame(1080, 1920, 60, [kicker(x.kicker, 48), picture(x.image, x.image?.w > 700 ? 1 : 1.2), titleBlock(x.title, 940, 140), line(x.pitch, 60), button(x.cta, 54), logoImg(260)]), 1080, 1920, `${OUT}/${x.id}-story.jpg`);
  console.log(`  ${OUT}/${x.id}-story.jpg`);
  const stills = [];
  for (const [i, tree] of reelScenes(x).entries()) { const f = `${OUT}/.${x.id}-scene${i}.png`; await render(tree, 1080, 1920, f); stills.push(f); }
  makeReel(x, stills);
  stills.forEach((f) => fs.rmSync(f));
}
