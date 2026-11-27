/* Velvet & Strings — music theory engine (no DOM). Works in the browser (window.VT) and in Node (module.exports). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.VT = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const SHARPS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const FLATS  = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
  const PC = {C:0,'B#':0,'C#':1,Db:1,D:2,'D#':3,Eb:3,E:4,Fb:4,F:5,'E#':5,'F#':6,Gb:6,G:7,'G#':8,Ab:8,A:9,'A#':10,Bb:10,B:11,Cb:11};
  const mod = (n, m) => ((n % m) + m) % m;

  /* chord qualities: intervals, required tones (for voicing), roman suffix, minor-ish flag */
  const QUAL = {
    '':     { iv:[0,4,7],        req:[0,4],     sfx:'',     minor:false, label:'Major' },
    'm':    { iv:[0,3,7],        req:[0,3],     sfx:'',     minor:true,  label:'Minor' },
    '7':    { iv:[0,4,7,10],     req:[0,4,10],  sfx:'7',    minor:false, label:'Dominant 7' },
    'maj7': { iv:[0,4,7,11],     req:[0,4,11],  sfx:'maj7', minor:false, label:'Major 7' },
    'm7':   { iv:[0,3,7,10],     req:[0,3,10],  sfx:'7',    minor:true,  label:'Minor 7' },
    'm7b5': { iv:[0,3,6,10],     req:[0,3,6,10],sfx:'ø7',   minor:true,  label:'Half-diminished' },
    'dim':  { iv:[0,3,6],        req:[0,3,6],   sfx:'°',    minor:true,  label:'Diminished' },
    'dim7': { iv:[0,3,6,9],      req:[0,3,6,9], sfx:'°7',   minor:true,  label:'Diminished 7' },
    'aug':  { iv:[0,4,8],        req:[0,4,8],   sfx:'+',    minor:false, label:'Augmented' },
    'sus2': { iv:[0,2,7],        req:[0,2],     sfx:'sus2', minor:false, label:'Sus 2' },
    'sus4': { iv:[0,5,7],        req:[0,5],     sfx:'sus4', minor:false, label:'Sus 4' },
    '7sus4':{ iv:[0,5,7,10],     req:[0,5,10],  sfx:'7sus4',minor:false, label:'7 sus 4' },
    'add9': { iv:[0,4,7,14],     req:[0,4,2],   sfx:'add9', minor:false, label:'Add 9' },
    'madd9':{ iv:[0,3,7,14],     req:[0,3,2],   sfx:'add9', minor:true,  label:'Minor add 9' },
    '6':    { iv:[0,4,7,9],      req:[0,4,9],   sfx:'6',    minor:false, label:'Major 6' },
    'm6':   { iv:[0,3,7,9],      req:[0,3,9],   sfx:'6',    minor:true,  label:'Minor 6' },
    '9':    { iv:[0,4,7,10,14],  req:[0,4,10,2],sfx:'9',    minor:false, label:'Dominant 9' },
    'm9':   { iv:[0,3,7,10,14],  req:[0,3,10,2],sfx:'9',    minor:true,  label:'Minor 9' },
    'maj9': { iv:[0,4,7,11,14],  req:[0,4,11,2],sfx:'maj9', minor:false, label:'Major 9' },
    'mmaj7':{ iv:[0,3,7,11],     req:[0,3,11],  sfx:'(maj7)',minor:true, label:'Minor-major 7' },
    '5':    { iv:[0,7],          req:[0,7],     sfx:'5',    minor:false, label:'Power chord' }
  };
  const QUAL_ORDER = ['', 'm', '7', 'maj7', 'm7', 'sus2', 'sus4', '7sus4', 'add9', 'madd9', '6', 'm6', '9', 'm9', 'maj9', 'm7b5', 'dim', 'dim7', 'aug', 'mmaj7', '5'];

  const FLAT_MAJOR = new Set([5, 10, 3, 8, 1]);         // F Bb Eb Ab Db (F# preferred over Gb)
  const FLAT_MINOR = new Set([2, 7, 0, 5, 10, 3]);      // Dm Gm Cm Fm Bbm Ebm
  const useFlats = key => key.minor ? FLAT_MINOR.has(mod(key.tonic, 12)) : FLAT_MAJOR.has(mod(key.tonic, 12));
  const noteName = (pc, flats) => (flats ? FLATS : SHARPS)[mod(pc, 12)];
  const midiName = (m, flats) => noteName(m, flats) + (Math.floor(m / 12) - 1);
  const midiHz = m => 440 * Math.pow(2, (m - 69) / 12);
  const keyName = (key, flats) => noteName(key.tonic, flats === undefined ? useFlats(key) : flats) + (key.minor ? ' minor' : ' major');

  function parseSym(sym) {
    const r = /^([A-G][#b]?)(.*?)(?:\/([A-G][#b]?))?$/.exec(String(sym).trim());
    if (!r || !(r[2] in QUAL)) return null;
    return { pc: PC[r[1]], q: r[2], bass: r[3] ? PC[r[3]] : null };
  }
  /* chord item: { r: semitones above song tonic, q: quality, b: bass semitones above tonic | null, d: bars } */
  const itemFromSym = (sym, tonic, d) => { const p = parseSym(sym); if (!p) return null; return { r: mod(p.pc - tonic, 12), q: p.q, b: p.bass === null ? null : mod(p.bass - tonic, 12), d: d || 1 }; };
  /* spell by key signature, but borrowed flat degrees (bII bIII bVI bVII) with flats and #IV with sharps */
  function spell(key, deg, shift) {
    const sig = useFlats({ tonic: key.tonic + shift, minor: key.minor });
    const d = mod(deg, 12);
    const fl = d === 6 ? false : ([1, 3, 8, 10].includes(d) && !key.minor) || (key.minor && d === 1) ? true : sig;
    return noteName(key.tonic + deg + shift, fl);
  }
  function symOf(item, key, shift) {
    shift = shift || 0;
    let s = spell(key, item.r, shift) + item.q;
    if (item.b !== null && item.b !== undefined && mod(item.b, 12) !== mod(item.r, 12)) s += '/' + spell(key, item.b, shift);
    return s;
  }
  const DEG = ['I','bII','II','bIII','III','IV','#IV','V','bVI','VI','bVII','VII'];
  function roman(item) {
    const q = QUAL[item.q] || QUAL[''];
    let base = DEG[mod(item.r, 12)];
    if (q.minor) base = base.replace(/[IV]+/, x => x.toLowerCase());
    let s = base + q.sfx;
    if (item.b !== null && item.b !== undefined && mod(item.b - item.r, 12) !== 0) {
      const iv = mod(item.b - item.r, 12);
      s += '/' + ({ 3: '3', 4: '3', 7: '5', 10: '7', 11: '7', 2: '9', 9: '6' }[iv] || DEG[mod(item.b, 12)]);
    }
    return s;
  }
  /* Roman parser: accidental + numeral (case = quality) + suffix + optional /inversion */
  function parseRoman(str) {
    const m = /^([b#]?)(VII|VI|IV|V|III|II|I|vii|vi|iv|v|iii|ii|i)(.*?)(?:\/(\d|b7))?$/.exec(str);
    if (!m) return null;
    const idx = ['I','II','III','IV','V','VI','VII'].indexOf(m[2].toUpperCase());
    let r = [0, 2, 4, 5, 7, 9, 11][idx] + (m[1] === 'b' ? -1 : m[1] === '#' ? 1 : 0);
    const lower = m[2] === m[2].toLowerCase();
    const sfx = m[3];
    let q;
    if (sfx === '°' || sfx === 'o') q = 'dim';
    else if (sfx === '°7' || sfx === 'o7') q = 'dim7';
    else if (sfx === 'ø' || sfx === 'ø7') q = 'm7b5';
    else if (sfx === '+') q = 'aug';
    else if (lower) q = ({ '': 'm', '7': 'm7', '9': 'm9', '6': 'm6', 'add9': 'madd9', '(maj7)': 'mmaj7' })[sfx];
    else q = ({ '': '', '7': '7', 'maj7': 'maj7', '9': '9', 'maj9': 'maj9', '6': '6', 'sus4': 'sus4', 'sus2': 'sus2', '7sus4': '7sus4', 'add9': 'add9', '5': '5' })[sfx];
    if (q === undefined) return null;
    let b = null;
    if (m[4]) {
      const third = QUAL[q].minor ? 3 : 4;
      b = mod(r + ({ '3': third, '5': 7, '7': q === 'maj7' ? 11 : 10, 'b7': 10 })[m[4]], 12);
    }
    return { r: mod(r, 12), q, b, d: 1 };
  }

  const chordPcs = (item, tonic) => [...new Set(QUAL[item.q].iv.map(i => mod(tonic + item.r + i, 12)))];
  /* piano voicing: bass in octave 3, close upper structure in octave 4 (MIDI 48..71) */
  function pianoVoicing(item, tonic) {
    const q = QUAL[item.q];
    const root = mod(tonic + item.r, 12);
    const bass = 48 + mod(tonic + (item.b === null || item.b === undefined ? item.r : item.b), 12);
    const upper = [...new Set(q.iv.map(i => 60 + mod(root + i, 12)))].sort((a, b) => a - b);
    return [bass, ...upper];
  }
  const SCALES = {
    major:      { name: 'Major (Ionian)',     iv: [0,2,4,5,7,9,11] },
    minor:      { name: 'Natural minor',      iv: [0,2,3,5,7,8,10] },
    harmonic:   { name: 'Harmonic minor',     iv: [0,2,3,5,7,8,11] },
    dorian:     { name: 'Dorian',             iv: [0,2,3,5,7,9,10] },
    mixolydian: { name: 'Mixolydian',         iv: [0,2,4,5,7,9,10] },
    phrygian:   { name: 'Phrygian',           iv: [0,1,3,5,7,8,10] },
    lydian:     { name: 'Lydian',             iv: [0,2,4,6,7,9,11] },
    pentMaj:    { name: 'Major pentatonic',   iv: [0,2,4,7,9] },
    pentMin:    { name: 'Minor pentatonic',   iv: [0,3,5,7,10] },
    blues:      { name: 'Blues',              iv: [0,3,5,6,7,10] }
  };
  const scalePcs = (tonic, scale) => SCALES[scale].iv.map(i => mod(tonic + i, 12));
  const keyScale = key => scalePcs(key.tonic, key.minor ? 'minor' : 'major');

  /* chord palettes relative to the key */
  function palette(key) {
    const R = s => parseRoman(s);
    const major = { diatonic: ['I','ii','iii','IV','V','vi','vii°'], sevenths: ['Imaj7','ii7','iii7','IVmaj7','V7','vi7','viiø7'],
      borrowed: ['iv','bVII','bVI','bIII','ii°','v','iv6'], secondary: ['V7/V','V7/vi','V7/ii','V7/IV','V7/iii'] };
    const minor = { diatonic: ['i','ii°','bIII','iv','v','bVI','bVII'], sevenths: ['i7','iiø7','bIIImaj7','iv7','v7','bVImaj7','bVII7'],
      borrowed: ['V','V7','IV','bII','i(maj7)','iv6','vii°7'], secondary: ['V7/iv','V7/bVI','V7/bIII','V7/bVII','V7/V'] };
    const src = key.minor ? minor : major;
    const fix = s => s === 'i(maj7)' ? { r: 0, q: 'mmaj7', b: null, d: 1 } : s === 'vii°7' ? { r: 11, q: 'dim7', b: null, d: 1 } : R(s);
    const sec = s => { const [, target] = s.split('/'); const t = R(target); return { r: mod(t.r + 7, 12), q: '7', b: null, d: 1, label: s }; };
    return {
      diatonic: src.diatonic.map(fix), sevenths: src.sevenths.map(fix),
      borrowed: src.borrowed.map(fix), secondary: src.secondary.map(sec)
    };
  }
  /* functional label used by the guide and chord editor */
  function functionOf(item, key) {
    const r = mod(item.r, 12), q = QUAL[item.q];
    if (r === 0) return 'Tonic — home, rest';
    if (r === 7) return q.minor ? 'Minor v — soft, modal pull' : 'Dominant — tension that wants home';
    if (r === 5) return q.minor && !key.minor ? 'Borrowed iv — bittersweet heartbreak' : 'Subdominant — lift away from home';
    if (r === 2) return q.minor ? 'Predominant ii — sets up the V' : 'Major II — bright, secondary-dominant lift';
    if (r === 9) return q.minor ? 'Relative minor — tender, wistful' : 'Major VI — surprise brightness';
    if (r === 4) return q.minor ? 'Mediant iii — soft link, nostalgic' : 'Major III — pulls hard to vi';
    if (r === 10) return 'bVII — rock/Mixolydian swagger';
    if (r === 8) return 'bVI — epic, cinematic borrowed colour';
    if (r === 3) return key.minor ? 'Relative major — light in the dark' : 'bIII — bold borrowed colour';
    if (r === 11) return 'Leading-tone chord — restless, wants tonic';
    if (r === 1) return 'Neapolitan bII — dramatic, exotic';
    return 'Chromatic colour';
  }

  /* ---------- seeded RNG ---------- */
  function rng(seed) {
    let a = (seed >>> 0) || 1;
    return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }

  /* ---------- fretted voicing generator ---------- */
  const TUNINGS = {
    guitar: [40, 45, 50, 55, 59, 64],
    ukulele: [67, 60, 64, 69]
  };
  const vcache = new Map();
  function voicings(item, tonic, instrument, max) {
    instrument = instrument || 'guitar';
    const open = TUNINGS[instrument];
    const key = instrument + '|' + mod(tonic + item.r, 12) + item.q + '|' + (item.b === null || item.b === undefined ? '' : mod(tonic + item.b, 12));
    if (vcache.has(key)) return vcache.get(key).slice(0, max || 12);
    const q = QUAL[item.q];
    const root = mod(tonic + item.r, 12);
    const pcs = [...new Set(q.iv.map(i => mod(root + i, 12)))];
    const req = [...new Set(q.req.map(i => mod(root + i, 12)))];
    const bassPc = item.b === null || item.b === undefined ? root : mod(tonic + item.b, 12);
    const isUke = instrument === 'ukulele';
    const n = open.length, results = [], seen = new Set();
    for (let pos = 0; pos <= 12; pos++) {
      const opts = open.map(o => {
        const list = [-1];
        for (let f = Math.max(1, pos); f <= pos + 3; f++) if (pcs.includes(mod(o + f, 12))) list.push(f);
        if (pos <= 7 && pcs.includes(mod(o, 12))) list.push(0);
        return list;
      });
      const cur = new Array(n);
      const rec = s => {
        if (s === n) { evaluate(cur.slice()); return; }
        for (const f of opts[s]) { cur[s] = f; rec(s + 1); }
      };
      const evaluate = fr => {
        const sounding = fr.map((f, i) => f < 0 ? null : open[i] + f);
        const idx = fr.map((f, i) => f >= 0 ? i : -1).filter(i => i >= 0);
        if (idx.length < (isUke ? 3 : 4)) return;
        // mutes: leading allowed; at most one inner and one trailing
        const first = idx[0], last = idx[idx.length - 1];
        let inner = 0; for (let i = first; i <= last; i++) if (fr[i] < 0) inner++;
        if (inner > 1 || (n - 1 - last) > 1) return;
        if (inner === 1 && pos === 0) return;
        const notes = sounding.filter(x => x !== null);
        const have = new Set(notes.map(x => mod(x, 12)));
        if (!req.every(p => have.has(p))) return;
        if (!isUke) {
          const low = Math.min(...notes);
          if (mod(low, 12) !== bassPc) return;
        }
        const fretted = fr.filter(f => f > 0);
        if (fretted.length) {
          const mn = Math.min(...fretted), mx = Math.max(...fretted);
          if (mx - mn > 3) return;
          const atMin = fretted.filter(f => f === mn).length;
          const fingers = (atMin >= 2 ? 1 : atMin) + fretted.filter(f => f > mn).length;
          if (fingers > 4) return;
        }
        const sig = fr.join(',');
        if (seen.has(sig)) return; seen.add(sig);
        const missingOpt = pcs.filter(p => !have.has(p)).length;
        const minF = fretted.length ? Math.min(...fretted) : 0;
        const mutes = fr.filter(f => f < 0).length;
        const opens = fr.filter(f => f === 0).length;
        const maxF = fretted.length ? Math.max(...fretted) : 0;
        const stretch = opens && maxF >= 5 ? 2.5 + (maxF - 5) * 0.5 : 0;   // open strings mixed with high frets
        const bassOnTop = !isUke && fr[0] > 0 && fr[0] >= minF + 2 ? 1 : 0;
        const score = mutes * 1.1 + missingOpt * 2 + minF * 0.45 + inner * 1.5 - opens * 0.35 + (maxF - minF) * 0.3 + stretch + bassOnTop;
        results.push({ frets: fr, score, pos: minF });
      };
      rec(0);
    }
    results.sort((a, b) => a.score - b.score);
    // keep variety: best per position band first, then the rest
    const out = [], bands = new Set();
    for (const r of results) { const band = r.pos <= 3 ? 0 : Math.floor(r.pos / 3); if (!bands.has(band)) { bands.add(band); out.push(r); } }
    for (const r of results) if (!out.includes(r) && out.length < 16) out.push(r);
    const sorted = out.slice(0, 16).sort((a, b) => a.pos - b.pos || a.score - b.score).map(r => r.frets);
    // put the overall best first
    const best = results[0] ? results[0].frets : null;
    const final = best ? [best, ...sorted.filter(f => f !== best)] : sorted;
    vcache.set(key, final);
    return final.slice(0, max || 12);
  }

  /* ---------- melody generator ---------- */
  const RHYTHMS4 = [[1,1,2],[0.5,0.5,1,2],[1.5,0.5,2],[2,1,1],[1,0.5,0.5,2],[0.5,1,0.5,2],[1,1,1,1],[-0.5,0.5,1,2],[-1,1,0.5,1.5],[0.5,0.5,0.5,0.5,2]];
  const RHYTHMS3 = [[1.5,1.5],[1,0.5,1.5],[0.5,0.5,0.5,1.5],[-0.5,1,1.5],[1,1,1]];
  const CONTOURS = [[0,1,1,-1],[0,-1,-1,2],[0,2,-1,-1],[0,1,2,-2],[0,0,1,-1],[0,-2,1,1],[0,1,-1,1]];
  /* prog: [{r,q,b,d}], key {tonic,minor}; beatsPerBar 4 or 3; returns [{t,d,m}] in written pitch (before section shift / sounding offset) */
  function melody(prog, key, seed, beatsPerBar, lo, hi) {
    lo = lo || 62; hi = hi || 76; beatsPerBar = beatsPerBar || 4;
    const R = rng(seed || 1);
    const scale = keyScale(key);
    const total = prog.reduce((a, c) => a + c.d * beatsPerBar, 0);
    const chordAt = t => { let acc = 0; for (const c of prog) { acc += c.d * beatsPerBar; if (t < acc - 1e-6) return c; } return prog[prog.length - 1]; };
    const tonesOf = c => { const pcs = chordPcs(c, key.tonic); const out = []; for (let m = lo; m <= hi; m++) if (pcs.includes(mod(m, 12))) out.push(m); return out; };
    const scaleNotes = []; for (let m = lo - 2; m <= hi + 2; m++) if (scale.includes(mod(m, 12))) scaleNotes.push(m);
    const stepScale = (m, steps) => {
      let i = scaleNotes.findIndex(x => x >= m); if (i < 0) i = scaleNotes.length - 1;
      i = Math.max(0, Math.min(scaleNotes.length - 1, i + steps));
      return scaleNotes[i];
    };
    const nearest = (list, m) => list.reduce((best, x) => Math.abs(x - m) < Math.abs(best - m) ? x : best, list[0]);
    const lib = beatsPerBar === 3 ? RHYTHMS3 : RHYTHMS4;
    const motifR = lib[Math.floor(R() * lib.length)], motifR2 = lib[Math.floor(R() * lib.length)];
    const contour = CONTOURS[Math.floor(R() * CONTOURS.length)];
    const notes = [];
    let prev = Math.round((lo + hi) / 2) + (R() < 0.5 ? -2 : 2);
    const bars = Math.ceil(total / beatsPerBar - 1e-6);
    for (let bar = 0; bar < bars; bar++) {
      const phrasePos = bar % 4;
      const isCadence = phrasePos === 3 || bar === bars - 1;
      let rhythm = (phrasePos === 1 ? motifR2 : motifR);
      if (isCadence) rhythm = beatsPerBar === 3 ? [1, 2] : (R() < 0.5 ? [1, 3] : [2, 2]);
      let t = bar * beatsPerBar, k = 0;
      for (const dur of rhythm) {
        const d = Math.abs(dur);
        if (t >= total - 1e-6) break;
        if (dur < 0) { t += d; continue; }
        const c = chordAt(t);
        const tones = tonesOf(c);
        let m;
        const strong = Math.abs((t % beatsPerBar)) < 1e-6 || (beatsPerBar === 4 && Math.abs((t % beatsPerBar) - 2) < 1e-6);
        if (k === 0) {
          // phrase answer (bars 3-4) leans lower/higher than the call
          const target = phrasePos >= 2 ? prev + (phrasePos === 2 ? -1 : 1) : prev;
          m = nearest(tones.length ? tones : scaleNotes, target);
        } else {
          m = stepScale(prev, contour[k % contour.length] || (R() < 0.5 ? 1 : -1));
          if (strong && tones.length) m = nearest(tones, m);
        }
        if (isCadence && dur === rhythm[rhythm.length - 1] && tones.length) {
          const rootish = tones.filter(x => mod(x, 12) === mod(key.tonic + c.r, 12) || mod(x - (key.tonic + c.r), 12) === (QUAL[c.q].minor ? 3 : 4));
          m = nearest(rootish.length ? rootish : tones, m);
        }
        m = Math.max(lo, Math.min(hi, m));
        notes.push({ t, d: Math.min(d, total - t) * 0.95, m });
        prev = m; t += d; k++;
      }
    }
    return notes;
  }

  /* ---------- lyrics helpers ---------- */
  function syllables(word) {
    let w = String(word).toLowerCase().replace(/[^a-z]/g, '');
    if (!w) return 0;
    if (w.length <= 3) return 1;
    w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
    const m = w.match(/[aeiouy]{1,2}/g);
    return Math.max(1, m ? m.length : 1);
  }
  const lineSyllables = line => String(line).split(/\s+/).reduce((a, w) => a + syllables(w), 0);
  function rhymeKey(line) {
    const words = String(line).toLowerCase().replace(/[^a-z\s']/g, ' ').trim().split(/\s+/);
    const w = (words[words.length - 1] || '').replace(/'/g, '');
    if (!w) return '';
    const m = /[aeiouy]+[^aeiouy]*$/.exec(w.replace(/e$/, '') || w);
    return m ? m[0].replace(/y$/, 'ee') : w;
  }
  function rhymeScheme(lines) {
    const map = {}; let next = 0;
    return lines.map(l => {
      if (!l.trim()) return '';
      const k = rhymeKey(l);
      if (!(k in map)) map[k] = String.fromCharCode(65 + (next++ % 26));
      return map[k];
    });
  }

  /* ---------- intervals (ear training) ---------- */
  const INTERVALS = ['Unison','Minor 2nd','Major 2nd','Minor 3rd','Major 3rd','Perfect 4th','Tritone','Perfect 5th','Minor 6th','Major 6th','Minor 7th','Major 7th','Octave'];

  return { spell, SHARPS, FLATS, PC, QUAL, QUAL_ORDER, SCALES, TUNINGS, INTERVALS, mod, useFlats, noteName, midiName, midiHz, keyName,
    parseSym, itemFromSym, symOf, roman, parseRoman, chordPcs, pianoVoicing, scalePcs, keyScale, palette, functionOf,
    rng, voicings, melody, syllables, lineSyllables, rhymeKey, rhymeScheme };
});
