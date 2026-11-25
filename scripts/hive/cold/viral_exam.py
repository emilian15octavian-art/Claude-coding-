#!/usr/bin/env python3
"""
Viral exam for Bleeding Debts 316 posts. Nothing gets scheduled unless it passes.

Every post must come with at least 3 hook variants. Each variant is rendered with make-reel3.py and scored out of
100 in five areas of 20 points each:
  VISUAL       measured from the video: hook readable on frame 0, motion in the first 3 s, cuts, brightness,
               nothing important in the bottom zone the app covers
  AUDIO        measured with FFmpeg: loudness, energy in the first second (or a drop within 2.5 s), no dead air, length
  TEXT         the hook itself: short, plain words, a curiosity trigger, something specific, an open loop, no self-promo
  CAPTIONS     the on-screen text system: words per card, reading time, hook on frame 0, loop back to the hook
  DESCRIPTION  the post copy: first line, niche keywords for search, one-word-answer question, hashtags, rules
A variant PASSES with 80+ total and at least 12/20 in every area. The best passing variant is the one posted.
If no variant passes, the post is BLOCKED.

Why these checks: Instagram ranks Reels mainly on watch time and sends, after testing them on people who don't
follow you. Our own data (19-24 Nov 2026): Reels with 64-88 % skip rate in the first 3 s got 35-190 views; Reels with
26-42 % skip rate got 760-2,546. The visual and hook checks target exactly that first-3-seconds decision.
These are rules of thumb, not a guarantee: re-tune the thresholds every Sunday against Metricool numbers.

Open-source parts: OpenCV (Apache-2.0), NumPy (BSD), FFmpeg (LGPL/GPL). No paid API.
Usage:
  python3 viral_exam.py plan.json            render + examine every post in the plan, write exam/<id>.json and report
  python3 viral_exam.py --video file.mp4 "hook text"   examine an existing video (visual + audio + hook text only)
"""
import json, os, re, subprocess, sys
import numpy as np, cv2

HERE = os.path.dirname(os.path.abspath(__file__))
H = 1920
TRIGGERS = r"\b(why|how|nobody|stop|mistake|truth|actually|never|wrong|secret|reason|because|vs|before|after|didn'?t|don'?t|won'?t|isn'?t|quit|lie|myth)\b"
CONCRETE = r"(\d|song|plays|band|church|voice|riff|drop|job|rent|metal|scream|album|fans|label|studio|guitar|drum|prayer|god)"
PROMO = r"(bleeding debts|our band|link in bio|follow us|our new song|out now|website|10 december|stream (it|now|us))"
NICHE = r"(metal|christian metal|musician|band|scream|riff|songwriting|independent artist)"


def ffprobe_dur(p):
    return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p],
                                capture_output=True, text=True).stdout.strip() or 0)


# ---------- VISUAL ----------
def exam_visual(video):
    cap = cv2.VideoCapture(video); frames = []
    while True:
        ok, f = cap.read()
        if not ok: break
        frames.append(cv2.resize(f, (270, 480)))
    cap.release()
    notes, pts = [], 0
    if not frames: return 0, ['video unreadable']
    f0 = frames[0]; mid = f0[int(480 * 0.2):int(480 * 0.6)]
    white = np.mean(np.all(mid > 235, axis=2)); red = np.mean((mid[..., 2] > 170) & (mid[..., 1] < 70) & (mid[..., 0] < 80))
    if white + red >= 0.012: pts += 5; notes.append(f'hook readable on frame 0 ({(white + red) * 100:.1f}% text pixels) +5')
    else: notes.append(f'hook NOT clearly readable on frame 0 ({(white + red) * 100:.2f}%) +0')
    g = [cv2.cvtColor(f, cv2.COLOR_BGR2GRAY).astype(np.float32) for f in frames]
    # Scene content only: text/bars are masked out (middle band holds the text), frames are blurred, shrunk and
    # normalised, so white flashes and flickering bars don't count as motion or cuts.
    def scene(x):
        x = x.copy(); x[int(480 * 0.25):int(480 * 0.62)] = np.mean(x); x[int(480 * 0.78):] = np.mean(x)
        s = cv2.resize(cv2.GaussianBlur(x, (0, 0), 3), (36, 64)); return (s - s.mean()) / (s.std() + 1e-6)
    sc = [scene(x) for x in g]
    corr = np.array([float(np.mean(sc[i] * sc[i - 1])) for i in range(1, len(sc))])
    cut = corr < 0.55
    mov = (1 - corr[~cut]) * 1000
    m3 = float(np.mean(mov[:85])) if len(mov) else 0
    if m3 >= 6: pts += 4; notes.append(f'scene motion in first 3 s {m3:.1f} +4')
    elif m3 >= 3: pts += 2; notes.append(f'scene motion in first 3 s {m3:.1f} (low) +2')
    else: notes.append(f'scene motion in first 3 s {m3:.1f} (static, looks like a slideshow) +0')
    cuts = int(np.sum(cut)); per10 = cuts / (len(frames) / 30) * 10
    if per10 >= 3: pts += 6; notes.append(f'{per10:.1f} scene cuts per 10 s +6')
    elif per10 >= 1.5: pts += 3; notes.append(f'{per10:.1f} scene cuts per 10 s +3')
    else: notes.append(f'{per10:.1f} cuts per 10 s +0')
    luma = float(np.mean([np.mean(x) for x in g[::10]]))
    if luma >= 38: pts += 2; notes.append(f'brightness {luma:.0f} +2')
    else: notes.append(f'too dark ({luma:.0f}) +0')
    bottom = np.mean([np.mean(np.all(f[int(480 * 0.8):] > 235, axis=2)) for f in frames[::10]])
    if bottom < 0.01: pts += 3; notes.append('bottom zone clear of text +3')
    else: notes.append(f'text in the bottom zone the app covers ({bottom * 100:.1f}%) +0')
    return pts, notes


# ---------- AUDIO ----------
def exam_audio(video):
    notes, pts = [], 0
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', video, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    m = re.findall(r'I:\s+(-?[\d.]+) LUFS', r); lufs = float(m[-1]) if m else -70
    if -14 <= lufs <= -7: pts += 6; notes.append(f'loudness {lufs} LUFS +6')
    elif -18 <= lufs < -14: pts += 3; notes.append(f'loudness {lufs} LUFS (quiet) +3')
    else: notes.append(f'loudness {lufs} LUFS +0')
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', video, '-ac', '1', '-ar', '8000', '-f', 's16le', '-'], capture_output=True).stdout
    x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
    if len(x) < 8000: return pts, notes + ['no audio']
    win = np.array([np.sqrt(np.mean(x[i:i + 800] ** 2)) for i in range(0, len(x) - 800, 800)])  # 0.1 s windows
    first, overall = float(np.mean(win[:10])), float(np.mean(win))
    drop = next((i / 10 for i in range(1, min(len(win), 26)) if win[i] > 2.2 * np.mean(win[:max(1, i)]) and win[i] > overall), None)
    if first >= 0.6 * overall: pts += 7; notes.append(f'starts with energy (first second {first / overall:.0%} of average) +7')
    elif drop is not None: pts += 7; notes.append(f'deliberate quiet start, drop at {drop:.1f} s +7')
    else: notes.append(f'weak start (first second {first / overall:.0%} of average, no drop by 2.5 s) +0')
    s = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', video, '-af', 'silencedetect=n=-40dB:d=0.8', '-f', 'null', '-'], capture_output=True, text=True).stderr
    if 'silence_start' not in s: pts += 4; notes.append('no dead air +4')
    else: notes.append('dead air over 0.8 s +0')
    d = ffprobe_dur(video)
    if 7 <= d <= 15: pts += 3; notes.append(f'length {d:.1f} s (loops well) +3')
    elif d <= 30: pts += 1; notes.append(f'length {d:.1f} s +1')
    else: notes.append(f'length {d:.1f} s (too long for a cold viewer) +0')
    return pts, notes


# ---------- TEXT (the hook) ----------
def exam_text(hook):
    h = re.sub(r'\*', '', hook); words = h.split(); notes, pts = [], 0
    if len(words) <= 9: pts += 4; notes.append(f'{len(words)} words +4')
    elif len(words) <= 11: pts += 2; notes.append(f'{len(words)} words (long) +2')
    else: notes.append(f'{len(words)} words (too long to read in 2 s) +0')
    if re.search(TRIGGERS, h, re.I): pts += 4; notes.append('curiosity trigger +4')
    else: notes.append('no curiosity trigger (why/how/nobody/mistake/truth/never/because...) +0')
    if re.search(CONCRETE, h, re.I): pts += 3; notes.append('specific detail +3')
    else: notes.append('nothing specific (number, song, band, job...) +0')
    if h.strip().endswith('?') or re.search(r"\b(why|what|how|here'?s|nobody tells|it'?s not|the real)\b|\b\d+\s+(reasons?|mistakes?|things|signs|ways)\b", h, re.I): pts += 3; notes.append('open loop +3')
    else: notes.append('no open loop +0')
    if not re.search(PROMO, h, re.I): pts += 3; notes.append('no self-promo in the hook +3')
    else: notes.append('self-promo in the hook (cold viewers skip ads) +0')
    clean = [re.sub(r'[^\w]', '', w) for w in words]
    if clean and np.mean([len(w) for w in clean]) <= 6 and max(len(w) for w in clean) <= 12: pts += 3; notes.append('plain words +3')
    else: notes.append('hard words +0')
    return pts, notes


# ---------- CAPTIONS (on-screen text system) ----------
def exam_captions(cards, hook):
    notes, pts = [], 0
    wc = [len(re.sub(r'\*', '', c['text']).split()) for c in cards]
    if max(wc) <= 10: pts += 5; notes.append(f'max {max(wc)} words per card +5')
    else: notes.append(f'a card has {max(wc)} words +0')
    slow = [i for i, c in enumerate(cards) if c['sec'] < 0.28 * wc[i] + 0.4]
    if not slow: pts += 5; notes.append('every card stays long enough to read +5')
    else: notes.append(f'cards {slow} flash by too fast +0')
    if cards[0]['kind'] == 'hook': pts += 4; notes.append('hook is the first frame +4')
    else: notes.append('video does not open on the hook +0')
    loop = cards[-1].get('loop', '')
    hw = set(re.sub(r'[^\w\s]', '', hook.lower().replace('*', '')).split()); lw = set(re.sub(r'[^\w\s]', '', loop.lower()).split())
    if len(hw & lw) >= 2: pts += 3; notes.append('ending loops back into the hook +3')
    else: notes.append('ending does not loop to the hook +0')
    if all(c.get('kind') in ('hook', 'beat', 'payoff') for c in cards): pts += 3; notes.append('big text in the safe zone (engine layout) +3')
    return pts, notes


# ---------- DESCRIPTION ----------
def exam_description(caption, hook):
    notes, pts = [], 0
    first = caption.strip().split('\n')[0]
    if len(first) <= 125 and first.lower().strip(' .!?') != re.sub(r'\*', '', hook).lower().strip(' .!?'): pts += 4; notes.append('first line short and adds to the hook +4')
    else: notes.append('first line too long or just repeats the hook +0')
    if re.search(NICHE, caption, re.I): pts += 3; notes.append('niche keywords for Instagram search +3')
    else: notes.append('no niche keywords +0')
    if '?' in caption and re.search(r'(comment|drop|reply|which|yes or no|1-10|1 to 10|one word|emoji|agree)', caption, re.I): pts += 4; notes.append('one-word-answer question +4')
    else: notes.append('no easy question for comments +0')
    tags = re.findall(r'#\w+', caption)
    if 3 <= len(tags) <= 5 and any(re.search(r'metal', t, re.I) for t in tags): pts += 3; notes.append(f'{len(tags)} hashtags incl. niche +3')
    else: notes.append(f'{len(tags)} hashtags (want 3-5 incl. a metal tag) +0')
    if 'spotify' not in caption.lower() and 'link in bio' not in first.lower(): pts += 3; notes.append('rules ok (no Spotify, no link-first) +3')
    else: notes.append('breaks a rule (Spotify link or link-in-bio first) +0')
    if 80 <= len(caption) <= 700: pts += 3; notes.append(f'{len(caption)} characters +3')
    else: notes.append(f'{len(caption)} characters (want 80-700) +0')
    return pts, notes


def verdict(scores):
    total = sum(s for s, _ in scores.values())
    ok = total >= 80 and all(s >= 12 for s, _ in scores.values())
    return total, ok


def examine_post(p, render=True):
    assert len(p['hooks']) >= 3, f"{p['id']}: needs at least 3 hook variants"
    os.makedirs(os.path.join(HERE, 'out'), exist_ok=True); os.makedirs(os.path.join(HERE, 'exam'), exist_ok=True)
    results = []
    for k, hook in enumerate(p['hooks']):
        cards = [{'kind': 'hook', 'text': hook, 'sec': p.get('hook_sec', 1.9)}] + \
                [{'kind': 'beat', 'n': i + 1, 'text': b, 'sec': p.get('beat_sec', 2.1)} for i, b in enumerate(p['beats'])] + \
                [{'kind': 'payoff', 'text': p['payoff'], 'loop': p['loop'], 'sec': p.get('payoff_sec', 2.6)}]
        spec = {'song': p['song'], 'start': p['start'], 'photos': p['photos'], 'cards': cards}
        sp = os.path.join(HERE, 'out', f"{p['id']}_v{k + 1}.json"); vid = sp[:-5] + '.mp4'
        json.dump(spec, open(sp, 'w'))
        if render or not os.path.exists(vid):
            subprocess.run(['python3', os.path.join(HERE, 'make-reel3.py'), sp, vid], check=True, capture_output=True)
        scores = {'visual': exam_visual(vid), 'audio': exam_audio(vid), 'text': exam_text(hook),
                  'captions': exam_captions(cards, hook), 'description': exam_description(p['caption'], hook)}
        total, ok = verdict(scores)
        results.append({'variant': k + 1, 'hook': hook, 'video': vid, 'total': total, 'pass': ok,
                        'scores': {a: {'points': s, 'notes': n} for a, (s, n) in scores.items()}})
    passing = sorted([r for r in results if r['pass']], key=lambda r: -r['total'])
    report = {'id': p['id'], 'date': p['date'], 'time': p['time'], 'status': 'PASS' if passing else 'BLOCKED',
              'winner': passing[0] if passing else None, 'variants': results}
    json.dump(report, open(os.path.join(HERE, 'exam', f"{p['id']}.json"), 'w'), indent=1)
    return report


if __name__ == '__main__':
    if sys.argv[1] == '--video':
        v, hook = sys.argv[2], sys.argv[3]
        sc = {'visual': exam_visual(v), 'audio': exam_audio(v), 'text': exam_text(hook)}
        for a, (s, n) in sc.items(): print(f'{a.upper():8} {s:2}/20  ' + ' | '.join(n))
        print('partial total', sum(s for s, _ in sc.values()), '/ 60')
        sys.exit()
    plan = json.load(open(sys.argv[1])); only = sys.argv[2:]
    for p in plan:
        if only and p['id'] not in only: continue
        r = examine_post(p)
        print(f"{r['id']} {r['status']}", *[f"v{v['variant']}={v['total']}{'✓' if v['pass'] else '✗'}" for v in r['variants']],
              f"→ posting v{r['winner']['variant']}: {r['winner']['hook']}" if r['winner'] else '→ NOT POSTED', flush=True)
