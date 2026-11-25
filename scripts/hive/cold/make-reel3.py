#!/usr/bin/env python3
"""
Cold-view Reel engine (v3) for Bleeding Debts 316.

Built for people who have never heard of the band (the "cold" audience Instagram tests every Reel on first).
What changed from v2, and why (from our own Metricool data, 19-24 Nov 2026):
  v2 = one dark, tinted, still photo + logo + spectrum bars + boxed text. Skip rate 64-88 %, watch time ~3 s.
  Our Reels that got pushed (31 Oct - 4 Nov) had skip rates of 26-42 %.
So v3:
  * the hook is fully readable on frame 0 (no fade-in, no build-up), big, high contrast, keyword in red
  * something moves all the time: hard cut to a new photo on every card, zoom-punch + white flash on cuts,
    continuous push-in, shake on the song's hits
  * black-and-white, bright enough to see faces (no teal tint, no 85 % darkening)
  * no logo, no spectrum bars, no countdown banner, no "link in bio" inside the video
  * text stays out of the bottom 25 % and the right edge, where Instagram/TikTok put their buttons
  * the last card leads back into the hook, so the Reel loops
  * the song starts on energy (or on a deliberate silence that drops within 2.5 s)

Usage: python3 make-reel3.py spec.json out.mp4
spec = {"song": "...mp3", "start": 40.0, "photos": ["...jpg", ...],
        "cards": [{"kind": "hook", "text": "Why your song got *12 plays*", "sec": 1.9},
                  {"kind": "beat", "n": 1, "text": "...", "sec": 2.0}, ...,
                  {"kind": "payoff", "text": "...", "loop": "Why your song got...", "sec": 2.4}]}
Words wrapped in *stars* are drawn in the brand red.
Open-source parts: OpenCV (Apache-2.0), NumPy (BSD), Pillow (HPND), FFmpeg (LGPL/GPL), Nunito font (OFL).
"""
import json, re, subprocess, sys, os
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont

W, H, FPS, SR = 1080, 1920, 30, 22050
HERE = os.path.dirname(os.path.abspath(__file__))
F_BLACK = os.path.join(HERE, 'fonts/Nunito-Black.ttf')
F_XB = os.path.join(HERE, 'fonts/Nunito-ExtraBold.ttf')
RED = (213, 18, 32)          # RGB brand accent
SAFE_L, SAFE_R = 80, 150     # right edge holds the like/comment buttons
SAFE_TOP, SAFE_BOT = int(H * 0.14), int(H * 0.75)


def tokens(text):
    """Split 'Why your song got *12 plays*' into [(word, is_red), ...]."""
    out, red = [], False
    for part in re.split(r'(\*)', text):
        if part == '*': red = not red; continue
        for w in part.split():
            if out and re.fullmatch(r'[.,!?:;)…]+', w): out[-1] = (out[-1][0] + w, out[-1][1])  # glue punctuation
            else: out.append((w, red))
    return out


def layout(toks, font, max_w):
    lines, cur = [], []
    d = ImageDraw.Draw(Image.new('RGB', (1, 1)))
    for t in toks:
        trial = ' '.join(w for w, _ in cur + [t])
        if cur and d.textlength(trial, font=font) > max_w:
            lines.append(cur); cur = [t]
        else: cur.append(t)
    if cur: lines.append(cur)
    return lines


def text_layer(text, size, y_center, font_path=F_BLACK, upto=None, badge=None):
    """RGBA layer with centred, stroked text. upto = number of words revealed (None = all)."""
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    font = ImageFont.truetype(font_path, size)
    toks = tokens(text)
    lines = layout(toks, font, W - SAFE_L - SAFE_R)
    lh = int(size * 1.12)
    total_h = lh * len(lines) + (int(size * 1.25) if badge else 0)
    y = int(y_center - total_h / 2)
    if badge:  # numbered card: red square with a white number (brand motif)
        bs = int(size * 1.05); bx = SAFE_L + (W - SAFE_L - SAFE_R - bs) // 2
        d.rectangle([bx, y, bx + bs, y + bs], fill=RED + (255,))
        bf = ImageFont.truetype(F_BLACK, int(size * 0.8)); tw = d.textlength(badge, font=bf)
        d.text((bx + (bs - tw) / 2, y + bs * 0.02), badge, font=bf, fill=(255, 255, 255, 255))
        y += int(size * 1.25)
    shown = 0
    for line in lines:
        widths = [d.textlength(w + ' ', font=font) for w, _ in line]
        x = SAFE_L + (W - SAFE_L - SAFE_R - (sum(widths) - d.textlength(' ', font=font))) / 2
        for (w, red), ww in zip(line, widths):
            if upto is not None and shown >= upto: break
            d.text((x, y), w, font=font, fill=(RED if red else (255, 255, 255)) + (255,),
                   stroke_width=max(4, size // 14), stroke_fill=(0, 0, 0, 255))
            x += ww; shown += 1
        y += lh
    return cv2.cvtColor(np.array(im), cv2.COLOR_RGBA2BGRA)


def over(frame, layer, a=1.0):
    al = layer[..., 3:4].astype(np.float32) / 255 * a
    frame[:] = (frame * (1 - al) + layer[..., :3] * al).astype(np.uint8)


def prep_photo(path):
    img = cv2.imread(path)
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    g = cv2.createCLAHE(clipLimit=2.2, tileGridSize=(8, 8)).apply(g)
    sh, sw = g.shape; s = max(W * 1.3 / sw, H * 1.3 / sh)
    g = cv2.resize(g, (int(sw * s) + 2, int(sh * s) + 2), interpolation=cv2.INTER_LANCZOS4)
    g = (g.astype(np.float32) * 0.62).astype(np.uint8)  # dim enough for white text, bright enough to read faces
    return cv2.cvtColor(g, cv2.COLOR_GRAY2BGR)


def audio_env(song, start, secs):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-ss', str(start), '-t', str(secs), '-i', song,
                          '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True).stdout
    x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
    spf = SR // FPS; n = int(secs * FPS)
    e = np.array([np.sqrt(np.mean(x[i * spf:(i + 1) * spf] ** 2) + 1e-9) for i in range(n)])
    e = (e - e.min()) / (e.max() - e.min() + 1e-9)
    onset = np.clip(np.diff(np.r_[e[0], e]) * 4, 0, 1)
    return e, onset


def main(spec_path, out):
    spec = json.load(open(spec_path))
    cards = spec['cards']; secs = sum(c['sec'] for c in cards); n = int(secs * FPS)
    env, onset = audio_env(spec['song'], spec['start'], secs)
    photos = [prep_photo(p) for p in spec['photos']]
    # card timeline
    bounds, t0 = [], 0.0
    for c in cards: bounds.append((t0, t0 + c['sec'])); t0 += c['sec']
    enc = subprocess.Popen(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}',
                            '-r', str(FPS), '-i', '-', '-ss', str(spec['start']), '-t', str(secs), '-i', spec['song'],
                            '-filter_complex', f'[1:a]afade=t=in:d=0.04,afade=t=out:st={secs - 0.35}:d=0.35,loudnorm=I=-11:TP=-1.0[a]',
                            '-map', '0:v', '-map', '[a]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p',
                            '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest', out], stdin=subprocess.PIPE)
    cache = {}
    for i in range(n):
        t = i / FPS
        ci = next(k for k, (a, b) in enumerate(bounds) if t < b or k == len(bounds) - 1)
        c = cards[ci]; a, b = bounds[ci]; lt = t - a; prog = lt / (b - a)
        bg = photos[ci % len(photos)]
        if c['kind'] == 'hook' and lt >= c['sec'] / 2:                 # second shot inside the hook: a cut in the first 3 s
            bg = photos[-1]; lt_cut = lt - c['sec'] / 2
        else: lt_cut = lt
        bh, bw = bg.shape[:2]
        punch = max(0.0, 1 - lt_cut / 0.18) * 0.07                   # zoom punch on every cut
        if c['kind'] == 'hook': punch += 0.22 * max(0.0, 1 - lt_cut / 0.55)  # fast pull-out: motion from frame 0
        push = 0.24 if c['kind'] == 'hook' else 0.12                   # the hook card moves hardest (first 3 s decide)
        z = 1.0 + push * prog + punch + 0.03 * env[i]
        cw, ch = int(W * 1.3 / z), int(H * 1.3 / z)
        drift = int((prog - 0.5) * (220 if c['kind'] == 'hook' else 90) * (1 if ci % 2 else -1))
        shake = int((np.random.rand() - 0.5) * 22 * onset[i]) if onset[i] > 0.3 else 0
        x0 = int(np.clip(bw / 2 - cw / 2 + drift + shake, 0, bw - cw)); y0 = int(np.clip(bh * 0.42 - ch / 2 + shake, 0, bh - ch))
        frame = cv2.resize(bg[y0:y0 + ch, x0:x0 + cw], (W, H), interpolation=cv2.INTER_LINEAR)
        if lt_cut < 2 / FPS and (ci > 0 or lt > 0.5):                                    # 2-frame white flash on cuts
            frame = cv2.addWeighted(frame, 0.45, np.full_like(frame, 255), 0.55, 0)
        # text
        if c['kind'] == 'hook':
            key = ('h', ci)
            if key not in cache: cache[key] = text_layer(c['text'], 112, int(H * 0.40))
            over(frame, cache[key])                                    # fully visible on frame 0
        elif c['kind'] == 'beat':
            words = len(tokens(c['text'])); upto = min(words, 1 + int(lt / 0.09))
            key = ('b', ci, upto)
            if key not in cache: cache[key] = text_layer(c['text'], 92, int(H * 0.42), F_XB if False else F_BLACK, upto, str(c.get('n', '')))
            over(frame, cache[key])
        else:  # payoff, then the loop line that leads back into the hook
            loop_at = c['sec'] - 0.9
            txt = c.get('loop') if (c.get('loop') and lt >= loop_at) else c['text']
            key = ('p', ci, txt)
            if key not in cache: cache[key] = text_layer(txt, 100, int(H * 0.42))
            over(frame, cache[key])
        # small brand tag (top, inside the safe zone)
        if 'tag' not in cache: cache['tag'] = text_layer('BLEEDING DEBTS 316', 34, int(H * 0.165), F_XB)
        over(frame, cache['tag'], 0.75)
        enc.stdin.write(frame.tobytes())
    enc.stdin.close(); enc.wait()
    print('written', out)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
