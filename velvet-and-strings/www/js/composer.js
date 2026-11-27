/* Velvet & Strings — composer: section generators and the song -> event timeline renderer (shared by audio + MIDI). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./theory.js'));
  else root.VC = factory(root.VT);
})(typeof self !== 'undefined' ? self : this, function (VT) {
  'use strict';
  const mod = VT.mod;
  const clone = o => JSON.parse(JSON.stringify(o));
  const R = s => VT.parseRoman(s);

  /* ---------- section generators ---------- */
  function rotateTo(prog, pred) {
    const i = prog.findIndex(pred);
    if (i <= 0) return clone(prog.length > 1 ? prog.slice(2).concat(prog.slice(0, 2)) : prog);
    return clone(prog.slice(i).concat(prog.slice(0, i)));
  }
  function twist(prog, key, kind) {
    const p = clone(prog);
    const ivIdx = p.findIndex(c => c.r === 5);
    const idx = ivIdx >= 0 ? ivIdx : Math.min(2, p.length - 1);
    const cur = p[idx];
    const minorish = VT.QUAL[cur.q].minor;
    if (kind === 'heart') {
      if (cur.r === 5 && minorish) { const j = idx === 0 ? 1 : idx - 1; p[j] = { r: 8, q: '', b: null, d: p[j].d, tw: true }; }
      else p[idx] = { r: 5, q: 'm', b: null, d: cur.d, tw: true };
    } else if (kind === 'dorian') {
      if (cur.r === 5 && !minorish) { const j = idx === 0 ? 1 : idx - 1; p[j] = { r: 2, q: '', b: null, d: p[j].d, tw: true }; }
      else p[idx] = { r: 5, q: '', b: null, d: cur.d, tw: true };
    } else if (kind === 'relative') {
      // swap every chord for its relative (major <-> minor) — a quick reharmonisation
      return p.map(c => VT.QUAL[c.q].minor ? { r: mod(c.r + 3, 12), q: '', b: null, d: c.d, tw: true } : { r: mod(c.r + 9, 12), q: 'm', b: null, d: c.d, tw: true });
    } else if (kind === 'secondary') {
      // insert the secondary dominant of the following chord on the last half of each other chord
      const out = [];
      p.forEach((c, i) => {
        const next = p[(i + 1) % p.length];
        if (i % 2 === 1 && c.d >= 1 && next.r !== 0 || i === p.length - 1 && c.d >= 1) {
          out.push({ ...c, d: c.d / 2 }); out.push({ r: mod(next.r + 7, 12), q: '7', b: null, d: c.d / 2, tw: true });
        } else out.push(c);
      });
      return out;
    }
    return p;
  }
  function fromRoman(list, d) { return list.map(s => { const c = R(s); if (!c) throw new Error('bad roman ' + s); c.d = d || 1; return c; }); }

  /* gen: intro | verse | pre | chorus | bridge | climax | outro | solo | a | b | blues */
  function generate(gen, base, key) {
    const minor = key.minor;
    switch (gen) {
      case 'verse': case 'a': case 'solo': return { prog: clone(base), shift: 0 };
      case 'intro': return { prog: clone(base.slice(0, Math.min(2, base.length))).concat(clone(base.slice(0, Math.min(2, base.length)))), shift: 0 };
      case 'chorus': {
        const p = rotateTo(base, c => c.r === 5 || c.r === 8 || c.r === 9);
        return { prog: p, shift: 0 };
      }
      case 'climax': { const c = generate('chorus', base, key).prog; return { prog: c, shift: 1 }; }
      case 'pre': return { prog: fromRoman(minor ? ['iv', 'bVI', 'V', 'V'] : ['ii', 'IV', 'V', 'V']), shift: 0 };
      case 'bridge': case 'b': return { prog: twist(fromRoman(minor ? ['bVI', 'bVII', 'bIII', 'V'] : ['vi', 'IV', 'I', 'V']), key, minor ? 'none' : 'heart'), shift: 0 };
      case 'outro': { const p = clone(base); p.push({ r: 0, q: minor ? 'm' : '', b: null, d: 2 }); return { prog: p, shift: 0 }; }
      case 'blues': return { prog: fromRoman(minor ? ['i7','i7','i7','i7','iv7','iv7','i7','i7','bVI7','V7','i7','V7'] : ['I7','I7','I7','I7','IV7','IV7','I7','I7','V7','IV7','I7','V7']), shift: 0 };
      default: return { prog: clone(base), shift: 0 };
    }
  }

  /* ---------- timeline renderer ---------- */
  const DRUMS = {
    ballad:  { k: [0, 5], s: [2, 6], h: [0, 1, 2, 3, 4, 5, 6, 7] },
    disco:   { k: [0, 2, 4, 6], s: [2, 6], h: [1, 3, 5, 7], open: true },
    half:    { k: [0, 3], s: [4], h: [0, 2, 4, 6] },
    shuffle: { k: [0, 4], s: [2, 6], h: [0, 1, 2, 3, 4, 5, 6, 7] },
    train:   { k: [0, 4], s: [0, 1, 2, 3, 4, 5, 6, 7], h: [], brush: true },
    '68':    { k: [0], s: [3], h: [0, 1, 2, 3, 4, 5] }
  };

  /* song: { key, sections, groove, swing, drumStyle, drums, voice, metro, tempo } ; opts: { section, offset, countIn, guitarMidis(item, shift) } */
  function render(song, opts) {
    opts = opts || {};
    const off = opts.offset || 0;
    const key = song.key;
    const six8 = song.groove === '68';
    const bpb = six8 ? 3 : 4;              // quarter beats per bar
    const steps = six8 ? 6 : 8;            // eighth-note steps per bar
    const swing = !six8 && (song.swing || song.groove === 'shuffle');
    const drumStyle = six8 ? '68' : (song.groove === 'shuffle' ? 'shuffle' : song.groove === 'boom' && song.drumStyle === 'ballad' ? 'train' : (song.drumStyle || 'ballad'));
    const loopMode = opts.section !== undefined && opts.section !== null;
    const secIdx = loopMode ? [opts.section] : song.sections.map((_, i) => i);
    const events = [], segs = [];
    let t = 0;
    if (opts.countIn) {
      for (let s = 0; s < steps; s++) if (six8 ? s % 3 === 0 : s % 2 === 0) events.push({ k: 'click', t: s * 0.5, v: 1, acc: s === 0 });
      t = bpb;
    }
    // build segments
    secIdx.forEach(si => {
      const sec = song.sections[si];
      if (!sec || !sec.prog || !sec.prog.length) return;
      const loops = loopMode ? 1 : (sec.loops || 1);
      for (let l = 0; l < loops; l++) {
        const passStart = t;
        sec.prog.forEach((c, ci) => { const len = Math.max(0.5, c.d || 1) * bpb; segs.push({ t, len, c, si, ci, pass: l, sec, passStart }); t += len; });
      }
    });
    const total = t;
    const segAt = time => { for (let i = 0; i < segs.length; i++) { const s = segs[i]; if (time >= s.t - 1e-6 && time < s.t + s.len - 1e-6) return s; } return null; };
    const guitar = (c, sh) => (opts.guitarMidis ? opts.guitarMidis(c, sh) : null) || VT.pianoVoicing(c, key.tonic + sh).map(m => m - 12);
    const sw = (time, step) => swing && step % 2 === 1 ? time + 1 / 6 : time;
    // per-section derived values
    const secInfo = sec => {
      const inten = loopMode ? 1 : (sec.intensity || 70) / 100;
      let voice = song.voice;
      if (!loopMode && (sec.type === 'Solo' || inten < 0.4)) voice = 'off';
      else if (!loopMode && inten >= 0.95 && voice !== 'off') voice = 'choir';
      return { vel: loopMode ? 1 : 0.45 + 0.55 * inten, voice, drums: song.drums && (loopMode || inten >= 0.5), solo: sec.type === 'Solo' };
    };
    const bars = Math.round((total - (opts.countIn ? bpb : 0)) / bpb);
    for (let b = 0; b < bars; b++) {
      const barT = (opts.countIn ? bpb : 0) + b * bpb;
      for (let st = 0; st < steps; st++) {
        const time = barT + st * 0.5;
        const seg = segAt(time); if (!seg) continue;
        const info = secInfo(seg.sec), v = info.vel;
        const sh = (seg.sec.shift || 0);
        const c = seg.c;
        const segStart = Math.abs(seg.t - time) < 1e-6;
        const tt = sw(time, st);
        const pv = VT.pianoVoicing(c, key.tonic + sh).map(m => m + off);
        const upper = pv.slice(1);
        const bass = 36 + mod(pv[0], 12);
        const fifth = bass + 7 <= 52 ? bass + 7 : bass - 5;
        const gt = guitar(c, sh).map(m => m + off).sort((a, b2) => a - b2);
        if (segStart) events.push({ k: 'seg', t: time, si: seg.si, ci: seg.ci });
        const g = song.groove;
        if (g === 'arp') {
          const pat = [0, 2, 3, 4, 5, 3, 4, 2];
          const m = gt[Math.min(gt.length - 1, pat[st] % gt.length)];
          events.push({ k: 'pluck', t: tt, m: st === 0 || segStart ? gt[0] : m, v: (st % 2 ? 0.6 : 0.8) * v, d: 1.2 });
          if (st === 0 || segStart) events.push({ k: 'bass', t: tt, m: bass, v: 0.85 * v, d: 1.6 });
          else if (st === 4) events.push({ k: 'bass', t: tt, m: fifth, v: 0.65 * v, d: 1.6 });
        } else if (g === 'strum') {
          const pat = { 0: 'D', 2: 'D', 3: 'U', 5: 'U', 6: 'D', 7: 'U' };
          if (pat[st] || segStart) {
            const dir = pat[st] || 'D';
            events.push({ k: 'strum', t: tt, ms: dir === 'U' ? gt.slice(-4) : gt, dir, v: (st === 0 ? 0.9 : dir === 'U' ? 0.55 : 0.7) * v, d: 1.4 });
          }
          if (st === 0 || segStart) events.push({ k: 'bass', t: tt, m: bass, v: 0.7 * v, d: 1.8 });
        } else if (g === 'pad') {
          if (segStart) { events.push({ k: 'pad', t: time, ms: upper, v, d: seg.len }); events.push({ k: 'bass', t: time, m: bass, v: 0.8 * v, d: seg.len * 0.9 }); }
          if (st === 2 || st === 6) upper.forEach((m, k) => events.push({ k: 'keys', t: tt + k * 0.01, m: m + 12 > 84 ? m : m + 12, v: 0.3 * v, d: 0.6 }));
        } else if (g === '68') {
          const acc = st === 0 || st === 3;
          if (acc || segStart) events.push({ k: 'bass', t: time, m: st === 3 ? fifth : bass, v: 0.85 * v, d: 1.3 });
          upper.forEach((m, k) => events.push({ k: 'keys', t: time + k * 0.01, m, v: (acc ? 0.5 : 0.26) * v, d: 0.8 }));
        } else if (g === 'boom') {
          if (st % 4 === 0 || segStart) events.push({ k: 'bass', t: tt, m: st % 8 === 4 ? fifth : bass, v: 0.85 * v, d: 0.9 });
          if (st % 4 === 2) events.push({ k: 'strum', t: tt, ms: gt.slice(-4), dir: 'D', v: 0.6 * v, d: 0.5 });
          if (st % 4 === 3) events.push({ k: 'strum', t: tt, ms: gt.slice(-3), dir: 'U', v: 0.4 * v, d: 0.3 });
        } else if (g === 'shuffle') {
          const third = VT.QUAL[c.q].minor ? 3 : 4;
          const line = [0, third, 7, 9, 10, 9, 7, third];
          events.push({ k: 'bass', t: tt, m: bass + line[st], v: (st % 2 ? 0.6 : 0.85) * v, d: 0.45 });
          if (st === 2 || st === 6) events.push({ k: 'strum', t: tt, ms: gt.slice(-4), dir: 'D', v: 0.5 * v, d: 0.35 });
        }
        if (info.drums) {
          const D = DRUMS[drumStyle] || DRUMS.ballad;
          if (D.k.includes(st)) events.push({ k: 'kick', t: tt, v });
          if (D.s.includes(st)) events.push({ k: 'snare', t: tt, v: (D.brush ? (st % 4 === 2 ? 0.55 : 0.25) : 1) * v, brush: !!D.brush });
          if (D.h.includes(st)) events.push({ k: 'hat', t: tt, v: (D.open ? 1.2 : st % 2 ? 0.6 : 1) * v });
        }
        if (song.metro && (six8 ? st % 3 === 0 : st % 2 === 0)) events.push({ k: 'click', t: time, v: 1, acc: st === 0 });
      }
    }
    // voices: melody per section pass, or held chord tones per segment
    const passes = new Map();
    segs.forEach(s => { const k = s.si + ':' + s.pass + ':' + s.passStart; if (!passes.has(k)) passes.set(k, s); });
    passes.forEach(s => {
      const sec = s.sec, info = secInfo(sec), sh = sec.shift || 0;
      const k2 = { tonic: key.tonic + sh, minor: key.minor };
      const tonesBelow = (m, time) => {
        const seg = segAt(time) || s;
        const pcs = VT.chordPcs(seg.c, key.tonic + sh);
        const out = []; for (let x = m - 3; x >= m - 14; x--) if (pcs.includes(mod(x, 12))) out.push(x);
        return out;
      };
      if (info.solo || (sec.mel && info.voice !== 'off')) {
        const mel = VT.melody(sec.prog, k2, (sec.melSeed || 1) + (info.solo ? 7919 : 0), bpb, info.solo ? 64 : 62, info.solo ? 81 : 76);
        mel.forEach(n => {
          const nt = s.passStart + n.t, m = n.m + off;
          if (info.solo) { events.push({ k: 'lead', t: nt, m: m - 12, v: 0.8 * info.vel, d: n.d }); return; }
          events.push({ k: 'voice', t: nt, m, v: info.vel, d: n.d, part: 0 });
          if (info.voice === 'harm' || info.voice === 'choir') {
            const below = tonesBelow(n.m, nt).map(x => x + off);
            if (below[0] !== undefined) events.push({ k: 'voice', t: nt, m: below[0], v: 0.7 * info.vel, d: n.d, part: 1, choir: info.voice === 'choir' });
            if (info.voice === 'choir' && below[1] !== undefined) events.push({ k: 'voice', t: nt, m: below[1], v: 0.6 * info.vel, d: n.d, part: 2, choir: true });
          }
        });
      }
    });
    // sections without melody: one sustained chord-tone lead (plus harmony/choir) per chord
    let prevLead = 67;
    segs.forEach(s => {
      const info = secInfo(s.sec); if (info.voice === 'off' || s.sec.mel || info.solo) return;
      const v = heldVoices(s.c, key.tonic + (s.sec.shift || 0), prevLead); prevLead = v.lead;
      const parts = info.voice === 'lead' ? [v.lead] : info.voice === 'harm' ? v.harmony : v.choir;
      parts.forEach((m, i) => { if (m !== undefined) events.push({ k: 'voice', t: s.t + 0.02, m: m + off, v: (i ? 0.7 : 1) * info.vel, d: s.len * 0.92, part: i, choir: parts.length >= 3 }); });
    });
    events.sort((a, b) => a.t - b.t);
    return { events, total, bpb, steps, segs: segs.map(s => ({ t: s.t, len: s.len, si: s.si, ci: s.ci })) };
  }
  /* sustained chord-tone lead + harmony/choir (written pitch) */
  function heldVoices(c, tonic, prevLead) {
    const pcs = VT.chordPcs(c, tonic);
    const tones = []; for (let m = 48; m <= 81; m++) if (pcs.includes(mod(m, 12))) tones.push(m);
    let best = null;
    for (const t of tones) { if (t < 62 || t > 74) continue; const s = Math.abs(t - prevLead) + (mod(t, 12) === mod(tonic + c.r, 12) ? 0.5 : 0); if (!best || s < best.s) best = { t, s }; }
    const lead = best ? best.t : tones[Math.floor(tones.length / 2)];
    const k = tones.indexOf(lead);
    return { lead, harmony: [lead, tones[k - 1]], choir: [lead, tones[k - 1], tones[k - 2]] };
  }

  return { generate, twist, fromRoman, render, heldVoices, rotateTo };
});
