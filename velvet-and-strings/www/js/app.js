/* Velvet & Strings 3.0 — UI controller: Styles, Studio, Write, Library, sheets and playback wiring. */
(function (root) {
  'use strict';
  const T = root.VT, D = root.VD, C = root.VC, X = root.VX, A = root.VA, ST = root.VS;
  const $ = id => document.getElementById(id);
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const rand = n => Math.floor(Math.random() * n);
  const pick = arr => arr[rand(arr.length)];
  const clone = o => JSON.parse(JSON.stringify(o));
  const VERSION = '3.0';

  const TUNINGS = [
    { id: 'std',   label: 'Standard E',             shift: 0,  drop: false, strings: ['E','A','D','G','B','e'], midi: [40,45,50,55,59,64] },
    { id: 'dstd',  label: 'D Standard (−2)',        shift: -2, drop: false, strings: ['D','G','C','F','A','d'], midi: [38,43,48,53,57,62] },
    { id: 'dropd', label: 'Drop D (low string −2)', shift: 0,  drop: true,  strings: ['D','A','D','G','B','e'], midi: [38,45,50,55,59,64] },
    { id: 'dropc', label: 'Drop C (−2, low −2)',    shift: -2, drop: true,  strings: ['C','G','C','F','A','d'], midi: [36,43,48,53,57,62] }
  ];
  const UKE = { id: 'uke', label: 'Ukulele GCEA', shift: 0, drop: false, strings: ['G','C','E','A'], midi: [67,60,64,69] };
  const GROOVES = [['arp','Arpeggio + Bass'],['strum','Strummed guitar'],['pad','Lush Pad'],['68','6/8 Ballad'],['boom','Boom-chicka'],['shuffle','Blues shuffle']];
  const DRUMSTYLES = [['ballad','Ballad'],['disco','Four-on-floor'],['half','Half-time'],['shuffle','Shuffle'],['train','Train beat']];
  const VOICES = [['off','Off'],['lead','Lead'],['harm','Harmony'],['choir','Choir']];
  const INSTS = [['chord','Chord'],['tab','Tab'],['piano','Piano'],['voices','Voices'],['tuner','Tuner']];
  const STATUSES = [['sketch','Sketch'],['demo','Demo'],['done','Finished'],['practice','Practice']];
  const QSHORT = { '':'maj', m:'m', '7':'7', maj7:'maj7', m7:'m7', m7b5:'ø7', dim:'°', dim7:'°7', aug:'+', sus2:'sus2', sus4:'sus4', '7sus4':'7sus4', add9:'add9', madd9:'m add9', '6':'6', m6:'m6', '9':'9', m9:'m9', maj9:'maj9', mmaj7:'m(maj7)', '5':'5' };

  /* ============================ song model ============================ */
  const STY = id => D.STYLES.find(s => s.id === id) || D.STYLES[0];
  const styleKey = st => ({ tonic: T.PC[st.key], minor: !!st.minor });
  const styleBase = st => st.chords.map(([sym]) => T.itemFromSym(sym, T.PC[st.key], 1));
  const isVocal = type => !['Intro', 'Outro', 'Solo'].includes(type);
  function mkSec(type, prog, shift, loops) {
    return { id: uid(), type, prog: prog || [], shift: shift || 0, loops: loops || 1, intensity: D.SEC_DEF[type][0], notes: D.SEC_DEF[type][1], lyrics: '', mel: isVocal(type), melSeed: 1 + rand(99999) };
  }
  function buildSections(st, formId) {
    const base = styleBase(st), key = styleKey(st);
    return D.FORMS[formId].secs.map(([type, gen, loops]) => { const g = C.generate(gen, base, key); return mkSec(type, g.prog, g.shift, loops); });
  }
  function newSong(styleId, o) {
    o = o || {};
    const st = STY(styleId);
    return { id: uid(), title: o.title || '', status: o.status || 'sketch', tags: o.tags || [], styleId: st.id, key: styleKey(st),
      tuning: 'std', capo: 0, instrument: 'guitar', lefty: false, groove: st.groove, swing: !!st.swing, drumStyle: st.beat === 'shuffle' && st.groove !== 'shuffle' ? 'shuffle' : st.beat,
      drums: true, voice: 'lead', metro: false, countIn: false, tempo: st.bpm, created: Date.now(), updated: Date.now(),
      challenge: o.challenge || '', sections: buildSections(st, o.form || st.form || 'pop') };
  }
  const validItem = c => c && Number.isFinite(c.r) && (c.q in T.QUAL) ? { r: T.mod(Math.round(c.r), 12), q: c.q, b: Number.isFinite(c.b) ? T.mod(Math.round(c.b), 12) : null, d: [0.5, 1, 2, 4].includes(c.d) ? c.d : 1, ...(c.tw ? { tw: true } : {}) } : null;
  function sanitize(s) {
    const d = newSong(s && s.styleId);
    if (!s || typeof s !== 'object') return d;
    const o = { ...d, ...s };
    if (!D.STYLES.some(x => x.id === o.styleId)) o.styleId = d.styleId;
    if (!o.key || !Number.isFinite(o.key.tonic)) o.key = d.key; else o.key = { tonic: T.mod(o.key.tonic, 12), minor: !!o.key.minor };
    if (!TUNINGS.some(x => x.id === o.tuning)) o.tuning = 'std';
    if (!['guitar', 'ukulele'].includes(o.instrument)) o.instrument = 'guitar';
    if (!GROOVES.some(g => g[0] === o.groove)) o.groove = 'arp';
    if (!DRUMSTYLES.some(g => g[0] === o.drumStyle)) o.drumStyle = 'ballad';
    if (!VOICES.some(g => g[0] === o.voice)) o.voice = 'lead';
    if (!STATUSES.some(g => g[0] === o.status)) o.status = 'sketch';
    o.capo = Math.max(0, Math.min(9, +o.capo || 0));
    o.tempo = Math.max(50, Math.min(160, +o.tempo || 90));
    o.title = String(o.title || '').slice(0, 80);
    o.tags = Array.isArray(o.tags) ? o.tags.map(String).slice(0, 12) : [];
    o.sections = (Array.isArray(o.sections) ? o.sections : d.sections).filter(x => x && D.SECTION_TYPES.includes(x.type)).map(x => ({
      id: x.id || uid(), type: x.type, prog: (Array.isArray(x.prog) ? x.prog.map(validItem).filter(Boolean) : []),
      shift: Math.max(-6, Math.min(6, +x.shift || 0)), loops: [1, 2, 3, 4].includes(x.loops) ? x.loops : 1,
      intensity: Math.max(30, Math.min(100, +x.intensity || 60)), notes: String(x.notes || ''), lyrics: String(x.lyrics || ''),
      mel: x.mel !== undefined ? !!x.mel : isVocal(x.type), melSeed: +x.melSeed || 1 + rand(99999) }));
    if (!o.id) o.id = uid();
    if (!o.created) o.created = o.updated || Date.now();
    return o;
  }
  /* migrate songs saved by 2.x (and the single song of 1.x) */
  function migrateLegacy() {
    const parse = k => { try { const v = ST.kv.raw(k); return v === null ? null : JSON.parse(v); } catch (e) { return null; } };
    let legacy = parse('vs2_songs');
    if (!Array.isArray(legacy) || !legacy.length) {
      const secs = parse('vs_sections');
      legacy = Array.isArray(secs) && secs.length ? [{ title: parse('vs_title') || '', styleId: parse('vs_preset') || 'isaak', tuning: parse('vs_tuning') || 'std', twist: parse('vs_twist') || 'orig', groove: parse('vs_groove'), voice: parse('vs_voice') || 'lead', sections: secs.map(x => ({ ...x, loops: 2 })) }] : null;
    }
    if (!legacy) return null;
    return legacy.map(o => {
      const st = STY(o.styleId), key = styleKey(st), base = styleBase(st);
      const main = o.twist && o.twist !== 'orig' ? C.twist(base, key, o.twist) : base;
      const bridge = C.twist(base, key, o.twist && o.twist !== 'orig' ? o.twist : 'heart');
      return sanitize({ id: o.id, title: o.title, styleId: st.id, key, tuning: o.tuning, capo: o.capo, groove: o.groove || st.groove, voice: o.voice,
        drums: o.drums !== false, metro: !!o.metro, countIn: !!o.countIn, tempo: o.tempo || st.bpm, drumStyle: st.beat, created: o.updated, updated: o.updated,
        sections: (o.sections || []).map(x => ({ type: x.type, prog: clone(x.type === 'Bridge (Twist)' ? bridge : main), loops: x.loops || 1, intensity: x.intensity, notes: x.notes, lyrics: x.lyrics || '', mel: false })) });
    });
  }

  /* ============================ state ============================ */
  let songs = (ST.kv.get('songs', null) || []).map(sanitize);
  if (!songs.length) songs = migrateLegacy() || [];
  if (!songs.length) songs = [newSong('isaak', { form: 'pop' })];
  const S = {
    song: null, view: ST.kv.get('view', 'studio'), inst: ST.kv.get('inst', 'chord'), sec: 0, sel: 0,
    favs: ST.kv.get('favs', []), cat: 'all', tempoF: 'any', q: '', learn: ST.kv.get('learn', 'path'),
    open: {}, lastLyric: null, rhymeKey: 'heart', vIdx: {}, libFilter: 'all', libQ: '', playSi: -1, playCi: -1, mode: null
  };
  S.song = songs.find(s => s.id === ST.kv.get('current', '')) || songs[0];
  const P = Object.assign({ drills: {}, played: {}, practice: {}, ear: { best: 0 }, quiz: { best: 0 }, fret: { best: 0 }, voicings: {}, goal: 7, created: {} }, ST.kv.get('progress', {}));
  const saveProgress = () => ST.kv.set('progress', P);
  let saveT = null;
  function save() {
    S.song.updated = Date.now();
    clearTimeout(saveT);
    saveT = setTimeout(flush, 300);
  }
  function flush() { ST.kv.set('songs', songs); ST.kv.set('current', S.song.id); ST.mirrorSongs(songs); }
  const undoStack = [];
  function snap() { undoStack.push(JSON.stringify(S.song)); if (undoStack.length > 50) undoStack.shift(); $('undoBtn').disabled = false; }
  function undo() {
    const j = undoStack.pop(); if (!j) { toast('Nothing to undo'); return; }
    const s = JSON.parse(j), i = songs.findIndex(x => x.id === s.id);
    if (i >= 0) songs[i] = s; S.song = s; save(); renderAll(); toast('Undone');
    $('undoBtn').disabled = !undoStack.length;
  }

  /* ============================ derived helpers ============================ */
  const style = () => STY(S.song.styleId);
  const tuning = () => S.song.instrument === 'ukulele' ? UKE : (TUNINGS.find(t => t.id === S.song.tuning) || TUNINGS[0]);
  const off = () => (S.song.instrument === 'ukulele' ? 0 : tuning().shift) + S.song.capo;
  const sec = i => S.song.sections[i === undefined ? S.sec : i];
  const secShift = s => (s && s.shift) || 0;
  const symS = (item, s) => T.symOf(item, S.song.key, secShift(s) + off());       // sounding chord name
  const symW = (item, s) => T.symOf(item, S.song.key, secShift(s));               // written shape name
  const romanOf = item => T.roman(item);
  const keyName = () => T.keyName({ tonic: S.song.key.tonic + off(), minor: S.song.key.minor });
  function shapesFor(item, shift) {
    const name = T.symOf(item, S.song.key, shift);
    const uke = S.song.instrument === 'ukulele';
    const curated = (uke ? D.UKE_SHAPES : D.SHAPES)[name];
    const gen = T.voicings(item, S.song.key.tonic + shift, uke ? 'ukulele' : 'guitar', 10);
    const list = curated ? [curated, ...gen.filter(f => f.join() !== curated.join())] : gen;
    return list.length ? list : [uke ? [0, 0, 0, 0] : [-1, -1, -1, -1, -1, -1]];
  }
  const vKey = (item, shift) => S.song.instrument + '|' + T.symOf(item, S.song.key, shift);
  function shapeOf(item, shift) { const list = shapesFor(item, shift); return list[Math.min(list.length - 1, S.vIdx[vKey(item, shift)] || 0)]; }
  const dropFrets = f => S.song.instrument === 'guitar' && tuning().drop ? f.map((x, i) => i === 0 && x >= 0 ? x + 2 : x) : f;
  function guitarMidis(item, shift) {
    const open = S.song.instrument === 'ukulele' ? UKE.midi : TUNINGS[0].midi;
    const notes = shapeOf(item, shift).map((f, i) => f < 0 ? null : open[i] + f).filter(x => x !== null);
    return notes.length ? notes : null;
  }
  const secChordsText = s => s.prog.map(c => symS(c, s)).join(' ');
  const totalBars = song => song.sections.reduce((a, s) => a + s.loops * s.prog.reduce((b, c) => b + c.d, 0), 0);

  /* ============================ UI utilities ============================ */
  function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2400); }
  const haptic = k => ST.haptic(k);
  function chips(container, items, cur, onPick, cls) {
    container.innerHTML = '';
    items.forEach(([id, label]) => { const b = el('button', 'chip' + (cls ? ' ' + cls : '') + (id === cur ? ' on' : ''), label); b.addEventListener('click', () => { haptic(); onPick(id); }); container.appendChild(b); });
  }
  function seg(container, items, cur, onPick) {
    container.innerHTML = '';
    items.forEach(([id, label]) => { const b = el('button', id === cur ? 'on' : '', label); b.addEventListener('click', () => { haptic(); onPick(id); }); container.appendChild(b); });
  }
  function openSheet(build) { const b = $('sheetBody'); b.innerHTML = ''; build(b); $('scrim').classList.add('on'); $('sheet').classList.add('on'); $('sheet').scrollTop = 0; }
  function closeSheet() { $('scrim').classList.remove('on'); $('sheet').classList.remove('on'); }
  const sheetOpen = () => $('sheet').classList.contains('on');
  function btn(txt, cls, fn) { const b = el('button', 'btn ' + (cls || ''), txt); b.addEventListener('click', () => { haptic(); fn(); }); return b; }
  function confirmSheet(title, text, yes, fn) {
    openSheet(b => { b.append(el('h3', null, title), el('p', 'small muted', text)); const g = el('div', 'grid2'); g.append(btn('Cancel', '', closeSheet), btn(yes, 'rose', () => { closeSheet(); fn(); })); b.appendChild(g); });
  }

  /* chord diagram (4 or 6 strings, optional left-handed mirror) */
  function chordSVG(frets, opts) {
    opts = opts || {};
    const n = frets.length, f = opts.lefty ? frets.slice().reverse() : frets;
    const played = f.filter(x => x > 0), maxF = played.length ? Math.max(...played) : 0, minF = played.length ? Math.min(...played) : 0;
    const base = maxF <= 4 ? 1 : minF;
    const W = 140, H = 176, sx = n === 4 ? 30 : 20, L = (W - sx * (n - 1)) / 2 - (base > 1 ? 8 : 0), T0 = 34, fy = 27;
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Chord diagram">';
    if (base === 1) s += '<rect x="' + L + '" y="' + (T0 - 4) + '" width="' + sx * (n - 1) + '" height="5" rx="1" fill="#f5eaee"/>';
    else s += '<text x="' + (L + sx * (n - 1) + 8) + '" y="' + (T0 + fy * 0.65) + '" fill="#a88d98" font-size="12" font-weight="700">' + base + 'fr</text>';
    for (let k = 0; k <= 5; k++) s += '<line x1="' + L + '" x2="' + (L + sx * (n - 1)) + '" y1="' + (T0 + k * fy) + '" y2="' + (T0 + k * fy) + '" stroke="#6f5762" stroke-width="1.2"/>';
    for (let i = 0; i < n; i++) s += '<line x1="' + (L + i * sx) + '" x2="' + (L + i * sx) + '" y1="' + T0 + '" y2="' + (T0 + fy * 5) + '" stroke="#a88d98" stroke-width="' + (n === 4 ? 1.4 : (opts.lefty ? 0.9 + i * 0.18 : 1.8 - i * 0.18)) + '"/>';
    const fp = f.findIndex(x => x >= 0), lp = f.length - 1 - f.slice().reverse().findIndex(x => x >= 0);
    if (minF > 0 && f.filter(x => x === minF).length >= 3 && f[fp] === minF && f[lp] === minF) {
      const y = T0 + (minF - base + 0.5) * fy;
      s += '<rect x="' + (L + fp * sx - 8) + '" y="' + (y - 8) + '" width="' + ((lp - fp) * sx + 16) + '" height="16" rx="8" fill="#e6b85c"/>';
    }
    f.forEach((x, i) => {
      const cx = L + i * sx;
      if (x < 0) s += '<text x="' + cx + '" y="' + (T0 - 12) + '" text-anchor="middle" fill="#e0517a" font-size="13" font-weight="700">×</text>';
      else if (x === 0) s += '<circle cx="' + cx + '" cy="' + (T0 - 16) + '" r="5" fill="none" stroke="#3fd0c0" stroke-width="2"/>';
      else if (x - base < 5) s += '<circle cx="' + cx + '" cy="' + (T0 + (x - base + 0.5) * fy) + '" r="8" fill="#e6b85c"/>';
    });
    return s + '</svg>';
  }

  /* ============================ navigation & header ============================ */
  function go(view) {
    if (!['styles', 'studio', 'write', 'learn', 'library'].includes(view)) view = 'studio';
    if (S.view === 'learn' && view !== 'learn' && App.leaveLearn) App.leaveLearn();
    S.view = view; ST.kv.set('view', view);
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('on', v.id === 'v-' + view));
    document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.v === view));
    window.scrollTo(0, 0);
    renderView(); renderNow();
  }
  function renderView() {
    if (S.view === 'styles') renderStyles();
    if (S.view === 'studio') renderStudio();
    if (S.view === 'write') renderWrite();
    if (S.view === 'learn' && App.renderLearn) App.renderLearn();
    if (S.view === 'library') renderLibrary();
  }
  function renderTop() {
    const p = style(), s = S.song;
    $('topTitle').textContent = s.title || p.artist;
    $('topMeta').textContent = (s.title ? p.artist + ' · ' : '') + p.style + ' · ' + s.tempo + ' BPM' + (s.capo ? ' · capo ' + s.capo : '');
    $('keyPill').textContent = keyName();
    $('undoBtn').disabled = !undoStack.length;
  }
  function renderAll() { renderTop(); renderView(); renderNow(); }

  /* ============================ Styles ============================ */
  function styleMatches(p) {
    if (S.cat === 'fav' && !S.favs.includes(p.id)) return false;
    if (S.cat !== 'all' && S.cat !== 'fav' && p.cat !== S.cat) return false;
    if (S.tempoF === 'slow' && p.bpm >= 75) return false;
    if (S.tempoF === 'mid' && (p.bpm < 75 || p.bpm > 100)) return false;
    if (S.tempoF === 'up' && p.bpm <= 100) return false;
    if (S.q) { const hay = (p.artist + ' ' + p.style + ' ' + p.mood + ' ' + p.vibe + ' ' + D.CATS.find(c => c.id === p.cat).name).toLowerCase(); if (!S.q.toLowerCase().split(/\s+/).every(w => hay.includes(w))) return false; }
    return true;
  }
  function renderStyles() {
    chips($('catChips'), [['all', 'All'], ['fav', '★ Favorites'], ...D.CATS.map(c => [c.id, c.name])], S.cat, id => { S.cat = id; renderStyles(); });
    chips($('tempoChips'), [['any', 'Any tempo'], ['slow', 'Slow < 75'], ['mid', 'Mid 75–100'], ['up', 'Upbeat > 100']], S.tempoF, id => { S.tempoF = id; renderStyles(); });
    const list = $('styleList'); list.innerHTML = ''; let total = 0;
    D.CATS.forEach(cat => {
      const items = D.STYLES.filter(p => p.cat === cat.id && styleMatches(p)); if (!items.length) return;
      total += items.length;
      const wrap = el('div', 'cat'), h = el('h3', null, cat.name); h.appendChild(el('small', null, items.length + (items.length === 1 ? ' style' : ' styles')));
      const grid = el('div', 'grid');
      items.forEach(p => {
        const b = el('button', 'sty' + (p.id === S.song.styleId ? ' on' : '')); b.style.setProperty('--acc', cat.acc);
        b.append(el('b', null, p.artist), el('span', 'st', p.style), el('span', 'bp', p.bpm + ' BPM · ' + p.key + (p.minor ? 'm' : '') + ' · ' + p.mood));
        const fav = el('span', 'fav' + (S.favs.includes(p.id) ? ' on' : ''), S.favs.includes(p.id) ? '★' : '☆'); fav.setAttribute('role', 'button'); fav.setAttribute('aria-label', 'Favorite');
        fav.addEventListener('click', e => { e.stopPropagation(); haptic(); S.favs = S.favs.includes(p.id) ? S.favs.filter(x => x !== p.id) : [...S.favs, p.id]; ST.kv.set('favs', S.favs); renderStyles(); });
        b.appendChild(fav);
        b.addEventListener('click', () => { haptic(); styleSheet(p); });
        grid.appendChild(b);
      });
      wrap.append(h, grid); list.appendChild(wrap);
    });
    if (!total) list.appendChild(el('p', 'empty', S.cat === 'fav' ? 'No favorites yet — tap ☆ on any style.' : 'No styles match. Try another search.'));
  }
  function styleSheet(p) {
    openSheet(b => {
      b.appendChild(el('h3', null, p.artist));
      b.appendChild(el('p', 'small muted', p.style + ' · ' + p.bpm + ' BPM · ' + p.key + (p.minor ? ' minor' : ' major') + ' · form: ' + D.FORMS[p.form].name));
      b.appendChild(el('p', 'serif', p.vibe)).style.cssText = 'font-style:italic;color:#e9d3dc;margin:8px 0';
      b.appendChild(el('p', 'tip', '★ ' + p.secret));
      const strip = el('div', 'strip'); const key = styleKey(p);
      styleBase(p).forEach(c => { const x = el('button', 'ch'); x.append(el('b', null, T.symOf(c, key)), el('i', null, T.roman(c))); x.addEventListener('click', () => { A.ensure(); A.strumNow(guitarMidisFor(c, key)); }); strip.appendChild(x); });
      b.appendChild(strip);
      const g = el('div', 'grid2'); g.style.marginTop = '12px';
      g.append(btn('New song in this style', 'gold', () => { closeSheet(); createSong(newSong(p.id, { form: p.form })); go('studio'); toast('New ' + p.artist + ' song'); }),
        btn('Apply to current song', '', () => { closeSheet(); snap(); applyStyle(p); toast('Style applied: chords kept, sound changed'); }));
      b.appendChild(g);
      b.appendChild(btn('Rebuild current song from this style', 'ghost full', () => { closeSheet(); snap(); const s = S.song; s.styleId = p.id; s.key = styleKey(p); s.tempo = p.bpm; s.groove = p.groove; s.swing = !!p.swing; s.drumStyle = p.beat; s.sections = carryLyrics(s.sections, buildSections(p, p.form)); S.sec = 0; S.sel = 0; save(); renderAll(); go('studio'); })).style.marginTop = '8px';
    });
  }
  function guitarMidisFor(item, key) {
    const name = T.symOf(item, key), f = D.SHAPES[name] || T.voicings(item, key.tonic, 'guitar', 1)[0];
    return f.map((x, i) => x < 0 ? null : TUNINGS[0].midi[i] + x).filter(x => x !== null);
  }
  function applyStyle(p) { const s = S.song; s.styleId = p.id; s.tempo = p.bpm; s.groove = p.groove; s.swing = !!p.swing; s.drumStyle = p.beat; save(); renderAll(); }
  function carryLyrics(oldSecs, newSecs) {
    const pool = {}; oldSecs.forEach(s => { if (s.lyrics.trim()) (pool[s.type] = pool[s.type] || []).push(s.lyrics); });
    newSecs.forEach(s => { if (pool[s.type] && pool[s.type].length) s.lyrics = pool[s.type].shift(); });
    return newSecs;
  }
  function createSong(sg) { if (A.playing) A.stop(); songs.push(sg); S.song = sg; S.sec = 0; S.sel = 0; S.open = {}; undoStack.length = 0; P.created[sg.id] = sg.created; saveProgress(); save(); flush(); renderTop(); }

  /* ============================ Studio ============================ */
  function renderStudio() {
    renderTop();
    const p = style(), s = S.song;
    if (S.sec >= s.sections.length) S.sec = Math.max(0, s.sections.length - 1);
    $('vibe').textContent = p.vibe; $('secret').textContent = p.secret;
    chips($('secChips'), s.sections.map((x, i) => [i, (i + 1) + ' ' + x.type + (x.loops > 1 ? ' ×' + x.loops : '')]), S.sec, i => { S.sec = i; S.sel = 0; if (A.playing && S.mode === 'loop') playLoop(); renderStudio(); });
    renderStrip(); renderActions(); renderInst();
    seg($('instSeg'), INSTS, S.inst, id => { if (S.inst === 'tuner' && id !== 'tuner') A.stopTuner(); S.inst = id; ST.kv.set('inst', id); renderStudio(); });
    $('tempo').value = s.tempo; $('tempoVal').textContent = s.tempo;
    chips($('grooveChips'), GROOVES, s.groove, id => { s.groove = id; if (id === 'shuffle') s.swing = true; save(); refreshPlayback(); renderStudio(); });
    chips($('drumChips'), DRUMSTYLES, s.drumStyle, id => { s.drumStyle = id; save(); refreshPlayback(); renderStudio(); }, 'teal');
    seg($('voiceSeg'), VOICES, s.voice, id => { s.voice = id; save(); refreshPlayback(); renderStudio(); });
    [['swingTog', 'swing'], ['drumTog', 'drums'], ['metroTog', 'metro'], ['countTog', 'countIn'], ['leftyTog', 'lefty']].forEach(([id, k]) => $(id).classList.toggle('on', !!s[k]));
    seg($('instrSeg'), [['guitar', 'Guitar'], ['ukulele', 'Ukulele']], s.instrument, id => { s.instrument = id; save(); refreshPlayback(); renderStudio(); });
    const ts = $('tuningSel'); ts.disabled = s.instrument === 'ukulele'; ts.value = s.tuning;
    $('capoVal').textContent = s.capo ? 'Capo ' + s.capo : 'No capo';
    $('vol').value = Math.round(A.volume * 100);
  }
  function renderStrip() {
    const s = sec(), box = $('strip'); box.innerHTML = '';
    if (!s) { box.appendChild(el('p', 'small muted', 'No sections — add one in Write.')); return; }
    if (S.sel >= s.prog.length) S.sel = Math.max(0, s.prog.length - 1);
    s.prog.forEach((c, i) => {
      const b = el('button', 'ch' + (c.d >= 2 ? ' w2' : c.d < 1 ? ' wh' : '') + (c.tw ? ' tw' : ''));
      b.append(el('b', null, symS(c, s)), el('i', null, romanOf(c)));
      if (c.d !== 1) b.appendChild(el('span', 'dur', c.d === 0.5 ? '½' : c.d + ' bars'));
      b.addEventListener('click', () => {
        haptic();
        if (S.sel === i && !A.playing) { chordEditor(S.sec, i); return; }
        S.sel = i; highlight(); renderInst(); renderNow();
        if (!A.playing) { A.ensure(); A.strumNow(guitarMidis(c, secShift(s)).map(m => m + off())); }
      });
      box.appendChild(b);
    });
    const add = el('button', 'ch add', '+'); add.setAttribute('aria-label', 'Add chord'); add.addEventListener('click', () => chordEditor(S.sec, null)); box.appendChild(add);
    highlight();
  }
  function highlight() {
    const playing = A.playing && S.playSi === S.sec;
    document.querySelectorAll('#strip .ch:not(.add)').forEach((b, k) => { b.classList.toggle('sel', k === S.sel); b.classList.toggle('play', playing && k === S.playCi); });
  }
  function renderActions() {
    const box = $('studioActions'); box.innerHTML = '';
    const s = sec(); if (!s) return;
    box.append(
      btn('✎ Edit chord', 'sm', () => chordEditor(S.sec, s.prog.length ? S.sel : null)),
      btn('▤ Library', 'sm', () => librarySheet(S.sec)),
      btn('↯ Twist', 'sm', () => twistSheet(S.sec)),
      btn(s.mel ? '🎲 New melody' : '♪ Melody off', 'sm', () => { snap(); s.mel = true; s.melSeed = 1 + rand(99999); save(); refreshPlayback(); renderStudio(); toast('New melody idea for ' + s.type); }),
      btn('Key −', 'sm', () => transpose(-1)), btn('Key +', 'sm', () => transpose(1)));
  }
  function transpose(n) { snap(); S.song.key.tonic = T.mod(S.song.key.tonic + n, 12); save(); refreshPlayback(); renderAll(); toast('Key: ' + keyName()); }
  function curChord() { const s = sec(); if (!s || !s.prog.length) return null; const i = A.playing && S.playSi === S.sec && S.playCi >= 0 ? S.playCi : S.sel; return s.prog[Math.min(i, s.prog.length - 1)]; }
  function renderInst() {
    const box = $('instPanel'); box.innerHTML = '';
    const s = sec(), c = curChord(), t = tuning(), song = S.song;
    if (S.inst === 'tuner') { renderTuner(box); return; }
    if (!c) { box.appendChild(el('p', 'empty', 'Add a chord with + to see it here.')); return; }
    const sh = secShift(s);
    if (S.inst === 'chord') {
      const list = shapesFor(c, sh), k = vKey(c, sh), idx = Math.min(list.length - 1, S.vIdx[k] || 0);
      const d = el('div', 'diag'); d.innerHTML = chordSVG(dropFrets(list[idx]), { lefty: song.lefty });
      const info = el('div', 'info');
      info.append(el('b', null, symS(c, s)), el('div', null, romanOf(c) + ' — ' + T.functionOf(c, song.key)));
      if (off() !== 0) info.appendChild(el('div', 'tiny', 'Shape: ' + symW(c, s) + (song.capo ? ' · capo ' + song.capo : '') + ' · ' + t.label));
      d.appendChild(info); box.appendChild(d);
      const nav = el('div', 'vnav');
      const prev = btn('‹', 'sm', () => { S.vIdx[k] = (idx - 1 + list.length) % list.length; seenVoicing(k, S.vIdx[k]); renderInst(); refreshPlayback(); });
      const next = btn('›', 'sm', () => { S.vIdx[k] = (idx + 1) % list.length; seenVoicing(k, S.vIdx[k]); renderInst(); refreshPlayback(); });
      const lab = el('span', 'small muted grow', 'Voicing ' + (idx + 1) + ' of ' + list.length + (idx === 0 ? ' · easiest' : '')); lab.style.textAlign = 'center';
      nav.append(prev, lab, next, btn('Strum', 'sm', () => { A.ensure(); A.strumNow(guitarMidis(c, sh).map(m => m + off())); }));
      box.appendChild(nav);
    } else if (S.inst === 'tab') {
      const fr = dropFrets(shapeOf(c, sh)), lines = [];
      for (let i = fr.length - 1; i >= 0; i--) { const f = fr[i] < 0 ? 'x' : String(fr[i]); const cell = ('---' + f + '---').slice(f.length > 1 ? 1 : 0); lines.push((t.strings[i] + ' ').slice(0, 2) + '|' + cell + '|' + cell + '|' + cell + '|'); }
      box.appendChild(el('pre', 'tab', lines.join('\n')));
      const p = el('p', 'small muted', symS(c, s) + ' · ' + t.label + (song.capo ? ' · frets relative to capo ' + song.capo : '')); p.style.cssText = 'text-align:center;margin:8px 0 0'; box.appendChild(p);
    } else if (S.inst === 'piano') {
      const wrap = el('div', 'pianowrap'), pn = el('div', 'piano'), whites = [];
      for (let m = 48; m <= 76; m++) if (!T.SHARPS[m % 12].includes('#')) whites.push(m);
      const w = 100 / whites.length;
      whites.forEach(m => { const kk = el('div', 'wk', m % 12 === 0 ? T.midiName(m) : ''); kk.dataset.m = m; pn.appendChild(kk); });
      for (let m = 49; m <= 76; m++) { if (!T.SHARPS[m % 12].includes('#')) continue; const kk = el('div', 'bk'); kk.dataset.m = m; kk.style.left = ((whites.indexOf(m - 1) + 1) * w - w * 0.32) + '%'; kk.style.width = (w * 0.64) + '%'; pn.appendChild(kk); }
      const fold = m => { while (m < 48) m += 12; while (m > 76) m -= 12; return m; };
      const ct = new Set(T.pianoVoicing(c, song.key.tonic + sh).map(m => fold(m + off())));
      const vc = new Set(chordVoiceNotes(s, c).map(m => fold(m + off())));
      pn.querySelectorAll('[data-m]').forEach(kk => { const m = +kk.dataset.m; kk.classList.toggle('ct', ct.has(m)); kk.classList.toggle('vc', vc.has(m)); });
      pn.addEventListener('pointerdown', e => { const kk = e.target.closest('[data-m]'); if (!kk) return; e.preventDefault(); kk.classList.add('dn'); setTimeout(() => kk.classList.remove('dn'), 160); A.tap(+kk.dataset.m); });
      wrap.appendChild(pn); box.appendChild(wrap);
      const lg = el('div', 'legend'); lg.innerHTML = '<span><i class="dot" style="background:var(--gold)"></i>Chord tones</span><span><i class="dot" style="background:var(--teal)"></i>Melody / vocal notes</span>'; box.appendChild(lg);
      requestAnimationFrame(() => { wrap.scrollLeft = (wrap.scrollWidth - wrap.clientWidth) * 0.35; });
    } else if (S.inst === 'voices') {
      const hv = C.heldVoices(c, song.key.tonic + sh, 67);
      const tb = el('table', 'voc');
      [['Lead (held)', hv.lead], ['Harmony', hv.harmony[1]], ['Choir low', hv.choir[2]]].forEach(([part, m]) => { if (m === undefined) return; const n = m + off(); const tr = el('tr'); tr.append(el('td', null, part), el('td', 'n', T.midiName(n, T.useFlats(song.key))), el('td', 'hz', T.midiHz(n).toFixed(1) + ' Hz')); tb.appendChild(tr); });
      box.appendChild(tb);
      if (s.mel) {
        const mel = sectionMelody(s);
        const line = el('div', 'melline');
        line.textContent = 'Melody: ' + mel.map(n => T.midiName(n.m + off(), T.useFlats(song.key)).replace(/\d/, '')).join(' ');
        box.appendChild(line);
      } else box.appendChild(el('p', 'small muted', 'Melody is off for this section — tap 🎲 to generate one.'));
      const g = el('div', 'grid2'); g.style.marginTop = '10px';
      g.append(btn('♫ Sing chord', '', () => singCue()), btn('▶ Melody', '', () => playMelodyPreview(s)));
      box.appendChild(g);
    }
  }
  const bpb = () => S.song.groove === '68' ? 3 : 4;
  function sectionMelody(s) { return T.melody(s.prog, { tonic: S.song.key.tonic + secShift(s), minor: S.song.key.minor }, s.melSeed, bpb()); }
  function chordVoiceNotes(s, c) {
    if (s.mel) {
      const ci = s.prog.indexOf(c); let t0 = 0; for (let i = 0; i < ci; i++) t0 += s.prog[i].d * bpb();
      const t1 = t0 + c.d * bpb();
      const notes = sectionMelody(s).filter(n => n.t >= t0 - 1e-6 && n.t < t1 - 1e-6).map(n => n.m);
      if (notes.length) return notes;
    }
    const hv = C.heldVoices(c, S.song.key.tonic + secShift(s), 67);
    const parts = S.song.voice === 'harm' ? hv.harmony : S.song.voice === 'choir' ? hv.choir : [hv.lead];
    return parts.filter(x => x !== undefined);
  }
  function playMelodyPreview(s) {
    A.ensure();
    const r = C.render({ ...S.song, voice: 'lead', drums: false, metro: false, sections: [{ ...s, mel: true, intensity: 100 }] }, { section: 0, offset: off(), guitarMidis });
    r.events = r.events.filter(e => e.k === 'voice' || e.k === 'seg' || e.k === 'bass');
    playRender(r, 'preview', false);
  }
  function singCue() {
    A.ensure();
    const s = sec(), c = curChord(); if (!c) return;
    const hv = C.heldVoices(c, S.song.key.tonic + secShift(s), 67);
    const parts = (S.song.voice === 'harm' ? hv.harmony : S.song.voice === 'lead' ? [hv.lead] : hv.choir).filter(x => x !== undefined).map(m => m + off());
    A.sing(parts, 1.8, parts.length > 2);
    toast('Sing ' + parts.map(m => T.midiName(m, T.useFlats(S.song.key))).join(' · '));
  }
  function seenVoicing(k, i) { P.voicings[k] = Math.max(P.voicings[k] || 0, i + 1); saveProgress(); }

  /* tuner */
  let tunerOn = false;
  function renderTuner(box) {
    const t = tuning();
    const disp = el('div'); disp.innerHTML = '<div class="tnote" id="tNote">–<small>Tap Start and play a string</small></div><div class="needle"><div class="scale"></div><div class="mid"></div><div class="ptr" id="tPtr" style="left:50%"></div></div>';
    box.appendChild(disp);
    const go2 = btn(tunerOn ? 'Stop mic tuner' : '🎤 Start mic tuner', tunerOn ? '' : 'teal', async () => {
      if (tunerOn) { tunerOn = false; A.stopTuner(); renderInst(); return; }
      try {
        await A.startTuner(f => {
          const n = $('tNote'), p = $('tPtr'); if (!n || !p) return;
          if (f < 0) return;
          const m = 69 + 12 * Math.log2(f / 440), r = Math.round(m), cents = Math.round((m - r) * 100);
          n.innerHTML = T.midiName(r) + '<small>' + f.toFixed(1) + ' Hz · ' + (cents > 0 ? '+' : '') + cents + ' cents' + (Math.abs(cents) <= 5 ? ' · in tune ✓' : '') + '</small>';
          p.style.left = (50 + Math.max(-50, Math.min(50, cents)) * 0.84) + '%';
          p.style.background = Math.abs(cents) <= 5 ? 'var(--teal)' : 'var(--gold)';
          document.querySelectorAll('.tuner button').forEach(b => b.classList.toggle('hit', +b.dataset.m === r));
        });
        tunerOn = true; renderInst();
      } catch (e) { toast('Microphone permission is needed for the tuner'); }
    });
    go2.classList.add('full'); box.appendChild(go2);
    const g = el('div', 'tuner' + (t.midi.length === 4 ? ' uke' : ''));
    t.midi.forEach((m, i) => { const b = el('button'); b.dataset.m = m; b.append(el('b', null, t.strings[i]), el('span', null, T.midiName(m))); b.addEventListener('click', () => { haptic(); A.pluckNow(m, 2.6); }); g.appendChild(b); });
    box.appendChild(g);
    const p = el('p', 'tiny muted', 'Tap a string for a reference tone. ' + t.label + (S.song.capo ? ' (tune open strings, then add the capo)' : '')); p.style.cssText = 'text-align:center;margin:8px 0 0'; box.appendChild(p);
  }

  /* ============================ chord editor ============================ */
  function chordEditor(si, ci) {
    const s = sec(si); if (!s) return;
    const key = S.song.key, sh = secShift(s);
    const adding = ci === null || ci === undefined;
    let draft = adding ? clone(s.prog[s.prog.length - 1] || { r: 0, q: key.minor ? 'm' : '', b: null, d: 1 }) : clone(s.prog[ci]);
    if (adding) { draft.tw = false; draft.d = draft.d || 1; }
    const preview = () => { A.ensure(); const ms = guitarMidis(draft, sh); if (ms) A.strumNow(ms.map(m => m + off())); };
    const draw = () => openSheet(b => {
      const head = el('div', 'row');
      const nm = el('div', 'grow'); nm.append(el('h3', null, T.symOf(draft, key, sh + off()) + '  ·  ' + T.roman(draft)), el('p', 'tiny muted', T.functionOf(draft, key)));
      head.append(nm, btn('▶', 'sm', preview)); b.appendChild(head);
      const pal = T.palette(key);
      [['In key', pal.diatonic], ['Sevenths', pal.sevenths], ['Borrowed colour', pal.borrowed], ['Secondary dominants', pal.secondary]].forEach(([label, list]) => {
        b.appendChild(el('div', 'lbl', label));
        const g = el('div', 'pal');
        list.forEach(it => {
          const x = el('button', it.r === draft.r && it.q === draft.q ? 'on' : '');
          x.append(el('b', null, T.symOf(it, key, sh + off())), el('i', null, it.label || T.roman(it)));
          x.addEventListener('click', () => { draft = { ...draft, r: it.r, q: it.q, b: null }; preview(); draw(); });
          g.appendChild(x);
        });
        b.appendChild(g);
      });
      b.appendChild(el('div', 'lbl', 'Root'));
      const rg = el('div', 'pal'); rg.style.gridTemplateColumns = 'repeat(6,1fr)';
      for (let r = 0; r < 12; r++) { const x = el('button', r === draft.r ? 'on' : ''); x.append(el('b', null, T.spell(key, r, sh + off())), el('i', null, T.roman({ r, q: '', b: null }))); x.addEventListener('click', () => { draft = { ...draft, r, b: null }; preview(); draw(); }); rg.appendChild(x); }
      b.appendChild(rg);
      b.appendChild(el('div', 'lbl', 'Quality'));
      const qc = el('div', 'chips wrap');
      T.QUAL_ORDER.forEach(q => { const x = el('button', 'chip' + (q === draft.q ? ' on' : ''), QSHORT[q]); x.addEventListener('click', () => { draft = { ...draft, q }; preview(); draw(); }); qc.appendChild(x); });
      b.appendChild(qc);
      const row = el('div', 'row'); row.style.marginTop = '10px';
      const bassSel = el('select', 'sel grow'); bassSel.setAttribute('aria-label', 'Bass note');
      const o0 = el('option', null, 'Bass: root'); o0.value = ''; bassSel.appendChild(o0);
      for (let r = 0; r < 12; r++) { const o = el('option', null, 'Bass: ' + T.spell(key, r, sh + off())); o.value = r; bassSel.appendChild(o); }
      bassSel.value = draft.b === null || draft.b === undefined ? '' : draft.b;
      bassSel.addEventListener('change', () => { draft = { ...draft, b: bassSel.value === '' ? null : +bassSel.value }; preview(); draw(); });
      const lenSeg = el('div', 'seg'); lenSeg.style.flex = '1';
      seg(lenSeg, [[0.5, '½ bar'], [1, '1 bar'], [2, '2'], [4, '4']], draft.d, d => { draft = { ...draft, d }; draw(); });
      row.append(bassSel); b.appendChild(row);
      const row2 = el('div', 'row'); row2.style.marginTop = '8px'; row2.append(el('span', 'small muted', 'Length'), lenSeg); b.appendChild(row2);
      const acts = el('div', 'grid2'); acts.style.marginTop = '14px';
      const commit = fn => { snap(); fn(); s.prog.forEach(x => delete x.tw); save(); closeSheet(); refreshPlayback(); renderView(); };
      if (adding) {
        acts.append(btn('Add chord', 'gold', () => commit(() => { s.prog.push(clean(draft)); S.sel = s.prog.length - 1; })), btn('Cancel', '', closeSheet));
      } else {
        acts.append(btn('Save', 'gold', () => commit(() => { s.prog[ci] = clean(draft); })),
          btn('Insert after', '', () => commit(() => { s.prog.splice(ci + 1, 0, clean(draft)); S.sel = ci + 1; })),
          btn('Duplicate', '', () => commit(() => { s.prog.splice(ci + 1, 0, clone(s.prog[ci])); })),
          btn('Delete', '', () => commit(() => { s.prog.splice(ci, 1); S.sel = Math.max(0, ci - 1); })));
      }
      b.appendChild(acts);
    });
    const clean = d => ({ r: d.r, q: d.q, b: d.b === undefined ? null : d.b, d: d.d || 1 });
    draw();
  }

  /* ============================ library / twist / form sheets ============================ */
  function librarySheet(si) {
    const key = S.song.key, sh = secShift(sec(si));
    openSheet(b => {
      b.append(el('h3', null, 'Progression library'), el('p', 'small muted', 'Famous chord patterns in Roman numerals, played in ' + keyName() + '. Example titles only — no lyrics.'));
      const list = D.LIB.slice().sort((a, c) => (a.mode === (key.minor ? 'minor' : 'major') || a.mode === 'any' ? 0 : 1) - (c.mode === (key.minor ? 'minor' : 'major') || c.mode === 'any' ? 0 : 1));
      list.forEach(l => {
        const it = el('div', 'libitem');
        const prog = C.fromRoman(l.roman.map(r => r === 'i(maj7)' ? 'i' : r));
        if (l.roman.includes('i(maj7)')) prog[l.roman.indexOf('i(maj7)')] = { r: 0, q: 'mmaj7', b: null, d: 1 };
        const top = el('div', 'row'); const nm = el('b', 'grow', l.name); top.append(nm, el('span', 'badge', l.mode === 'any' ? 'any key' : l.mode));
        it.append(top, el('div', 'rn', l.roman.join(' – ') + '   →   ' + prog.map(c => T.symOf(c, key, sh + off())).join(' ')), el('p', null, l.desc));
        if (l.ex.length) it.appendChild(el('p', null, 'e.g. ' + l.ex.join(' · '))).style.color = 'var(--gold2)';
        const g = el('div', 'row'); g.style.marginTop = '8px';
        g.append(btn('▶ Hear', 'sm', () => previewProg(prog, sh)), btn('Use in ' + sec(si).type, 'sm gold', () => { snap(); sec(si).prog = clone(prog); S.sel = 0; save(); closeSheet(); refreshPlayback(); renderView(); toast(l.name + ' → ' + sec(si).type); }),
          btn('Append', 'sm', () => { snap(); sec(si).prog.push(...clone(prog)); save(); closeSheet(); refreshPlayback(); renderView(); }));
        it.appendChild(g); b.appendChild(it);
      });
    });
  }
  function previewProg(prog, sh) {
    const s = { type: 'Verse', prog, shift: sh || 0, loops: 1, intensity: 100, mel: false };
    playRender(C.render({ ...S.song, voice: 'off', metro: false, sections: [s] }, { section: 0, offset: off(), guitarMidis }), 'preview', false);
  }
  function twistSheet(si) {
    const s = sec(si);
    openSheet(b => {
      b.append(el('h3', null, 'Harmonic twist · ' + s.type), el('p', 'small muted', 'Reharmonise this section. Undo (↶) brings back the original.'));
      [['heart', 'IV → iv Heartbreak', 'The major IV turns minor (or a borrowed bVI appears): a smile that breaks.'],
       ['dorian', 'Dorian major IV lift', 'Minor iv becomes major IV — the raised 6th lifts sadness into hope.'],
       ['relative', 'Relative swap', 'Every major chord becomes its relative minor and vice versa — same melody, new mood.'],
       ['secondary', 'Secondary dominants', 'Adds the V7 of the next chord on the second half of some bars — pull and drive.']].forEach(([id, name, desc]) => {
        const it = el('button', 'libitem'); it.append(el('b', null, name), el('p', null, desc));
        it.addEventListener('click', () => { snap(); s.prog = C.twist(s.prog, S.song.key, id); save(); closeSheet(); refreshPlayback(); renderView(); toast(name + ' applied'); });
        b.appendChild(it);
      });
    });
  }
  function formSheet() {
    openSheet(b => {
      b.append(el('h3', null, 'Song form'), el('p', 'small muted', 'Rebuild the structure from the style’s chords. Lyrics are carried over by section type; undo (↶) restores everything.'));
      Object.entries(D.FORMS).forEach(([id, f]) => {
        const it = el('button', 'libitem'); it.append(el('b', null, f.name), el('p', null, f.secs.map(x => x[0].replace(' (Twist)', '')).join(' · ')));
        it.addEventListener('click', () => { snap(); S.song.sections = carryLyrics(S.song.sections, buildSections(style(), id)); S.sec = 0; S.open = {}; save(); closeSheet(); refreshPlayback(); renderView(); toast(f.name); });
        b.appendChild(it);
      });
    });
  }

  /* ============================ playback ============================ */
  function renderFor(mode) {
    return C.render(S.song, { section: mode === 'loop' ? S.sec : undefined, offset: off(), countIn: S.song.countIn, guitarMidis });
  }
  let speedHook = null;
  function playRender(r, mode, loop) {
    A.ensure();
    S.mode = mode; S.playSi = -1; S.playCi = -1;
    A.play(r, {
      loop, tempo: S.song.tempo,
      onSeg: (si, ci) => {
        const realSi = mode === 'loop' ? S.sec : mode === 'song' ? si : -1;
        S.playCi = ci;
        if (mode === 'song' && realSi !== S.playSi) {
          S.playSi = realSi;
          if (S.view === 'studio' && S.sec !== realSi) { S.sec = realSi; renderStudio(); }
          document.querySelectorAll('.sec').forEach(e => e.classList.toggle('play', +e.dataset.i === realSi));
          const cur = document.querySelector('.sec.play'); if (cur && S.view === 'write') cur.scrollIntoView({ block: 'center', behavior: 'smooth' });
        } else S.playSi = realSi;
        highlight(); renderNow(); if (S.view === 'studio' && S.inst !== 'tuner') renderInst();
      },
      onLoop: k => { if (speedHook) speedHook(k); if (mode === 'loop') trackPlayed(); },
      onEnd: () => { toast(mode === 'song' ? 'End of song' : 'Done'); },
      onStop: () => { setPlayUI(false); }
    });
    setPlayUI(true);
  }
  function playLoop() { if (!sec() || !sec().prog.length) { toast('This section has no chords yet'); return; } playRender(renderFor('loop'), 'loop', true); }
  function playSong() { if (!S.song.sections.some(s => s.prog.length)) { toast('Add chords first'); return; } playRender(renderFor('song'), 'song', false); }
  function stopAll() { A.stop(); }
  function refreshPlayback() { if (A.playing && (S.mode === 'loop' || S.mode === 'song')) { const m = S.mode; if (m === 'loop') playLoop(); } }
  function setPlayUI(on) {
    $('playIco').innerHTML = on ? '<rect x="6" y="6" width="12" height="12" rx="2"/>' : '<path d="M7 4l13 8-13 8z"/>';
    $('playBtn').setAttribute('aria-label', on ? 'Stop' : 'Play');
    $('playSongBtn').innerHTML = on && S.mode === 'song' ? '&#9632; Stop song' : '&#9654; Play whole song';
    ST.keepAwake(on || $('perf').classList.contains('on'));
    if (!on) { S.playSi = -1; S.playCi = -1; document.querySelectorAll('.sec.play').forEach(e => e.classList.remove('play')); highlight(); renderNow(); }
  }
  function renderNow() {
    const s = sec(), c = curChord();
    const nc = $('nowChord');
    if (c) { nc.textContent = symS(c, s); nc.appendChild(el('i', null, romanOf(c))); } else nc.textContent = '–';
    let sub;
    if (A.playing && S.mode === 'song' && S.playSi >= 0) sub = (S.playSi + 1) + '/' + S.song.sections.length + ' · ' + S.song.sections[S.playSi].type;
    else sub = (s ? s.type + ' · ' : '') + S.song.tempo + ' BPM' + (A.playing && S.mode === 'loop' ? ' · looping' : '');
    $('nowSub').textContent = sub;
  }
  function trackPlayed() {
    // a practice song from the learning path counts as "played" after 4 clean loops at its tempo
    const tag = (S.song.tags || []).find(t => /^lvl\d+:/.test(t)); if (!tag) return;
    S.loopCount = (S.loopCount || 0) + 1;
    if (S.loopCount >= 4 && !P.played[tag]) { P.played[tag] = Date.now(); saveProgress(); toast('Practice song complete ✓'); }
  }
  setInterval(() => { if (A.playing || (App.practiceActive && App.practiceActive())) { const d = new Date().toISOString().slice(0, 10); P.practice[d] = (P.practice[d] || 0) + 5; saveProgress(); } }, 5000);

  /* ============================ Write ============================ */
  function renderWrite() {
    renderTop();
    const s = S.song;
    $('songTitle').value = s.title;
    chips($('statusChips'), STATUSES, s.status, id => { s.status = id; save(); renderWrite(); });
    const box = $('sections'); box.innerHTML = '';
    if (s.challenge) { const ch = el('div', 'tip', '🎲 Challenge: ' + s.challenge); ch.style.margin = '0 0 10px'; box.appendChild(ch); }
    const bars = totalBars(s), secs = Math.round(bars * bpb() * 60 / s.tempo);
    $('secCount').textContent = s.sections.length + ' sections · ' + bars + ' bars · ' + Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0');
    s.sections.forEach((x, i) => box.appendChild(sectionCard(x, i)));
    if (!s.sections.length) box.appendChild(el('p', 'empty', 'No sections yet — add one below or pick a Form.'));
    renderRhymes();
  }
  function sectionCard(x, i) {
    const s = S.song;
    const d = el('div', 'sec' + (S.open[x.id] ? ' open' : '') + (A.playing && S.mode === 'song' && S.playSi === i ? ' play' : '')); d.dataset.i = i;
    const hd = el('div', 'hd'); hd.appendChild(el('span', 'num', String(i + 1)));
    const nm = el('button', 'nm'); const title = el('b', null, x.type);
    if (x.shift) title.appendChild(el('em', null, 'key ' + (x.shift > 0 ? '+' : '') + x.shift));
    if (x.mel) title.appendChild(el('em', null, '♪'));
    nm.append(title, el('span', null, secChordsText(x) || 'no chords'));
    nm.addEventListener('click', () => { S.open[x.id] = !S.open[x.id]; renderWrite(); });
    const mt = el('span', 'meter'); const mi = el('i'); mi.style.width = x.intensity + '%'; mt.appendChild(mi);
    const lp = el('button', 'ib', '×' + x.loops); lp.setAttribute('aria-label', 'Repeats');
    lp.addEventListener('click', () => { snap(); x.loops = x.loops >= 4 ? 1 : x.loops + 1; save(); renderWrite(); });
    hd.append(nm, mt, lp); d.appendChild(hd);
    const bd = el('div', 'bd');
    const sel = el('select'); D.SECTION_TYPES.forEach(t => { const o = el('option', null, t); o.value = t; sel.appendChild(o); }); sel.value = x.type; sel.style.marginTop = '10px';
    sel.addEventListener('change', () => { snap(); x.type = sel.value; save(); renderWrite(); });
    bd.appendChild(sel);
    const strip = el('div', 'strip');
    x.prog.forEach((c, ci) => { const b = el('button', 'ch' + (c.d >= 2 ? ' w2' : c.d < 1 ? ' wh' : '')); b.append(el('b', null, symS(c, x)), el('i', null, romanOf(c))); b.addEventListener('click', () => chordEditor(i, ci)); strip.appendChild(b); });
    const add = el('button', 'ch add', '+'); add.addEventListener('click', () => chordEditor(i, null)); strip.appendChild(add);
    bd.appendChild(strip);
    const acts = el('div', 'actions');
    acts.append(btn('▤ Library', 'sm', () => librarySheet(i)), btn('↯ Twist', 'sm', () => twistSheet(i)),
      btn('↻ Loop in Studio', 'sm', () => { S.sec = i; S.sel = 0; go('studio'); playLoop(); }),
      btn(x.mel ? '♪ Melody on' : '♪ Melody off', 'sm', () => { snap(); x.mel = !x.mel; save(); renderWrite(); }),
      btn('🎲', 'sm', () => { snap(); x.mel = true; x.melSeed = 1 + rand(99999); save(); renderWrite(); playMelodyPreview(x); }));
    bd.appendChild(acts);
    const kr = el('div', 'row'); kr.style.marginTop = '10px';
    const stp = el('div', 'step'); const dn = el('button', null, '−'), lab = el('span', null, x.shift ? 'Key ' + (x.shift > 0 ? '+' : '') + x.shift : 'Same key'), up = el('button', null, '+');
    dn.addEventListener('click', () => { snap(); x.shift = Math.max(-6, x.shift - 1); save(); renderWrite(); });
    up.addEventListener('click', () => { snap(); x.shift = Math.min(6, x.shift + 1); save(); renderWrite(); });
    stp.append(dn, lab, up);
    const rng = el('input'); rng.type = 'range'; rng.min = 30; rng.max = 100; rng.step = 5; rng.value = x.intensity; rng.setAttribute('aria-label', 'Intensity');
    const rv = el('span', 'small', x.intensity + '%'); rv.style.cssText = 'width:40px;text-align:right;font-weight:700;color:var(--gold2)';
    rng.addEventListener('input', () => { x.intensity = +rng.value; rv.textContent = rng.value + '%'; mi.style.width = rng.value + '%'; save(); });
    kr.append(stp, rng, rv); bd.appendChild(kr);
    const notes = el('textarea'); notes.placeholder = 'Vocal delivery notes'; notes.value = x.notes; notes.rows = 1; notes.style.marginTop = '8px';
    notes.addEventListener('focus', snap, { once: true });
    notes.addEventListener('input', () => { x.notes = notes.value; save(); });
    bd.appendChild(notes);
    const lw = el('div', 'lyrwrap'), lyr = el('textarea'), gut = el('div', 'gutter');
    lyr.placeholder = 'Lyrics…'; lyr.value = x.lyrics;
    const updGut = () => {
      const lines = lyr.value.split('\n'), sch = T.rhymeScheme(lines);
      gut.innerHTML = ''; lines.forEach((l, k) => { const row = el('div'); row.style.height = '24px'; if (l.trim()) { row.appendChild(el('b', null, sch[k])); row.appendChild(document.createTextNode(' ' + T.lineSyllables(l))); } gut.appendChild(row); });
    };
    lyr.style.lineHeight = '24px'; lyr.style.fontSize = '16px';
    lyr.addEventListener('focus', () => { S.lastLyric = i; snap(); }, { once: false });
    lyr.addEventListener('input', () => { x.lyrics = lyr.value; save(); updGut(); });
    lw.append(lyr, gut); bd.appendChild(lw); updGut();
    bd.appendChild(el('div', 'tip', '💡 ' + D.SECTION_TIPS[x.type]));
    const tools = el('div', 'tools');
    const move = (a, b2) => { snap(); const arr = s.sections, t = arr[a]; arr[a] = arr[b2]; arr[b2] = t; save(); renderWrite(); };
    tools.append(btn('↑', '', () => { if (i > 0) move(i, i - 1); }), btn('↓', '', () => { if (i < s.sections.length - 1) move(i, i + 1); }),
      btn('Duplicate', '', () => { snap(); const c = clone(x); c.id = uid(); s.sections.splice(i + 1, 0, c); save(); renderWrite(); }),
      btn('Delete', '', () => { snap(); s.sections.splice(i, 1); save(); renderWrite(); toast(x.type + ' removed — ↶ to undo'); }));
    tools.lastChild.style.color = 'var(--rose)';
    bd.appendChild(tools);
    d.appendChild(bd);
    return d;
  }
  let promptI = rand(5);
  function renderRhymes() {
    const pr = D.PROMPTS[style().cat];
    $('promptBox').textContent = '“' + pr[promptI % pr.length] + '”';
    chips($('rhymeChips'), Object.keys(D.RHYMES).map(k => [k, '-' + k]), S.rhymeKey, k => { S.rhymeKey = k; renderRhymes(); });
    const rw = $('rhymeWords'); rw.innerHTML = '';
    D.RHYMES[S.rhymeKey].forEach(w => { const b = el('button', null, w); b.addEventListener('click', () => insertWord(w)); rw.appendChild(b); });
  }
  function insertWord(w) {
    haptic();
    let i = S.lastLyric;
    if (i == null || !S.song.sections[i]) { i = S.song.sections.findIndex(s => s.type === 'Verse'); if (i < 0) i = 0; }
    const x = S.song.sections[i]; if (!x) { toast('Add a section first'); return; }
    snap(); x.lyrics = x.lyrics.replace(/[ \t]*$/, '') + (x.lyrics.trim() && !x.lyrics.endsWith('\n') ? ' ' : '') + w;
    S.open[x.id] = true; S.lastLyric = i; save(); renderWrite(); toast('Added “' + w + '” to ' + x.type);
  }

  /* ============================ Stage view ============================ */
  let perfScale = ST.kv.get('perfScale', 1), perfT = null;
  function openPerf() {
    const s = S.song, body = $('perfBody'); body.innerHTML = '';
    $('perfTitle').textContent = s.title || 'Untitled romance';
    const h = el('p', 'pn', style().artist + ' · ' + keyName() + ' · ' + s.tempo + ' BPM · ' + tuning().label + (s.capo ? ' · capo ' + s.capo : '')); h.style.marginTop = '0'; body.appendChild(h);
    s.sections.forEach(x => {
      body.appendChild(el('h4', null, x.type + (x.loops > 1 ? '  ×' + x.loops : '') + (x.shift ? '  · key ' + (x.shift > 0 ? '+' : '') + x.shift : '')));
      body.appendChild(el('div', 'pc', secChordsText(x)));
      if (x.lyrics.trim()) body.appendChild(el('div', 'pl', x.lyrics.trim())); else if (x.notes.trim()) body.appendChild(el('div', 'pn', x.notes));
    });
    applyPerf(); $('perf').classList.add('on'); ST.keepAwake(true);
  }
  function applyPerf() { $('perf').style.setProperty('--pfs', (1.15 * perfScale) + 'rem'); $('perf').style.setProperty('--pfs2', (1.2 * perfScale) + 'rem'); }
  function closePerf() { $('perf').classList.remove('on'); clearInterval(perfT); perfT = null; $('perfScroll').classList.remove('on'); ST.keepAwake(A.playing); }

  /* ============================ Library ============================ */
  function weekStart() { const d = new Date(); const day = (d.getDay() + 6) % 7; d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - day); return d.getTime(); }
  function streakDays() {
    let n = 0; const d = new Date();
    for (;;) { const k = d.toISOString().slice(0, 10); const created = songs.some(s => new Date(s.created).toISOString().slice(0, 10) === k); if ((P.practice[k] || 0) > 0 || created) { n++; d.setDate(d.getDate() - 1); } else break; if (n > 999) break; }
    return n;
  }
  function renderLibrary() {
    renderTop();
    const ws = weekStart(), week = songs.filter(s => s.created >= ws && s.status !== 'practice').length, goal = P.goal || 7;
    const pct = Math.min(1, week / goal), R2 = 36, Cc = 2 * Math.PI * R2;
    const gc = $('goalCard'); gc.innerHTML = '';
    const ring = el('div'); ring.innerHTML = '<svg class="ring" viewBox="0 0 84 84"><circle cx="42" cy="42" r="' + R2 + '" stroke="#301521" stroke-width="8" fill="none"/><circle cx="42" cy="42" r="' + R2 + '" stroke="url(#gg)" stroke-width="8" fill="none" stroke-linecap="round" stroke-dasharray="' + (Cc * pct) + ' ' + Cc + '" transform="rotate(-90 42 42)"/><defs><linearGradient id="gg"><stop offset="0" stop-color="#e6b85c"/><stop offset="1" stop-color="#3fd0c0"/></linearGradient></defs><text x="42" y="47" text-anchor="middle" fill="#ffd98a" font-size="18" font-weight="800">' + week + '</text></svg>';
    const info = el('div', 'grow');
    info.append(el('b', null, week + ' of ' + goal + ' songs this week'), el('div', 'small muted', '🔥 ' + streakDays() + '-day streak · ' + songs.length + ' songs total'));
    const gsel = el('select', 'sel'); gsel.style.marginTop = '8px'; gsel.setAttribute('aria-label', 'Weekly goal');
    [1, 3, 5, 7, 14, 25, 50, 100].forEach(n => { const o = el('option', null, 'Goal: ' + n + ' / week'); o.value = n; gsel.appendChild(o); });
    gsel.value = goal; gsel.addEventListener('change', () => { P.goal = +gsel.value; saveProgress(); renderLibrary(); });
    info.appendChild(gsel); gc.append(ring.firstChild, info);
    const tags = [...new Set(songs.flatMap(s => s.tags || []).filter(t => !/^lvl\d+:/.test(t)))];
    chips($('libFilter'), [['all', 'All'], ...STATUSES, ...tags.map(t => ['#' + t, '#' + t])], S.libFilter, id => { S.libFilter = id; renderLibrary(); });
    const q = S.libQ.toLowerCase();
    const list = songs.filter(s => {
      if (S.libFilter.startsWith('#') ? !(s.tags || []).includes(S.libFilter.slice(1)) : S.libFilter !== 'all' && s.status !== S.libFilter) return false;
      if (q) { const hay = (s.title + ' ' + STY(s.styleId).artist + ' ' + (s.tags || []).join(' ') + ' ' + s.sections.map(x => x.lyrics).join(' ')).toLowerCase(); if (!hay.includes(q)) return false; }
      return true;
    }).sort((a, b) => b.updated - a.updated);
    $('songCount').textContent = list.length + ' / ' + songs.length;
    const box = $('songList'); box.innerHTML = '';
    list.forEach(sg => {
      const st = STY(sg.styleId), row = el('div', 'song' + (sg.id === S.song.id ? ' cur' : ''));
      const inf = el('button', 'inf'); const b = el('b', null, sg.title || 'Untitled romance'); inf.appendChild(b);
      const meta = el('span'); const badge = el('span', 'badge ' + sg.status, STATUSES.find(x => x[0] === sg.status)[1]); meta.append(badge, document.createTextNode('  ' + st.artist + ' · ' + T.keyName(sg.key) + ' · ' + totalBars(sg) + ' bars · ' + new Date(sg.updated).toLocaleDateString()));
      inf.appendChild(meta);
      inf.addEventListener('click', () => { openSong(sg.id); go('write'); });
      const more = el('button', 'ib', '⋯'); more.setAttribute('aria-label', 'Song options'); more.addEventListener('click', () => songMenu(sg));
      row.append(inf, more); box.appendChild(row);
    });
    if (!list.length) box.appendChild(el('p', 'empty', 'No songs match.'));
    renderMemos();
  }
  function openSong(id) { if (A.playing) A.stop(); S.song = songs.find(s => s.id === id) || songs[0]; S.sec = 0; S.sel = 0; S.open = {}; undoStack.length = 0; ST.kv.set('current', S.song.id); renderTop(); }
  function songMenu(sg) {
    openSheet(b => {
      b.append(el('h3', null, sg.title || 'Untitled romance'), el('p', 'small muted', STY(sg.styleId).artist + ' · edited ' + new Date(sg.updated).toLocaleString()));
      const tagIn = el('input', 'inp'); tagIn.placeholder = 'Tags, comma separated'; tagIn.value = (sg.tags || []).filter(t => !/^lvl\d+:/.test(t)).join(', '); tagIn.style.cssText = 'width:100%;margin:8px 0';
      tagIn.addEventListener('change', () => { const keep = (sg.tags || []).filter(t => /^lvl\d+:/.test(t)); sg.tags = keep.concat(tagIn.value.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean)).slice(0, 12); sg.updated = Date.now(); flush(); });
      b.appendChild(tagIn);
      const stc = el('div', 'chips wrap'); chips(stc, STATUSES, sg.status, id => { sg.status = id; sg.updated = Date.now(); flush(); closeSheet(); renderLibrary(); }); b.appendChild(stc);
      const g = el('div', 'grid2'); g.style.marginTop = '12px';
      const withSong = fn => () => { const prev = S.song; S.song = sg; try { fn(); } finally { S.song = prev; } };
      g.append(btn('Open', 'gold', () => { closeSheet(); openSong(sg.id); go('write'); }),
        btn('Duplicate', '', () => { const c = sanitize(clone(sg)); c.id = uid(); c.title = (sg.title || 'Untitled romance') + ' (copy)'; c.created = c.updated = Date.now(); songs.push(c); flush(); closeSheet(); renderLibrary(); toast('Duplicated'); }),
        btn('Share .txt', '', withSong(() => ST.share(fname(sg) + '.txt', songSheet(), 'text/plain', toast))),
        btn('ChordPro', '', withSong(() => ST.share(fname(sg) + '.cho', chordPro(), 'text/plain', toast))),
        btn('MIDI file', '', withSong(() => exportMidi(sg))),
        btn('Delete', '', () => confirmSheet('Delete this song?', '“' + (sg.title || 'Untitled romance') + '” will be removed from this phone.', 'Delete', () => {
          songs = songs.filter(s => s.id !== sg.id); if (!songs.length) songs.push(newSong(sg.styleId));
          if (S.song.id === sg.id) openSong(songs[0].id); flush(); renderLibrary(); toast('Song deleted');
        })));
      b.appendChild(g);
    });
  }
  const fname = sg => ((sg.title || 'velvet-song').trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'velvet-song');
  function exportMidi(sg) {
    const r = C.render(sg, { offset: (sg.instrument === 'ukulele' ? 0 : (TUNINGS.find(t => t.id === sg.tuning) || TUNINGS[0]).shift) + sg.capo, guitarMidis });
    const bytes = X.midi(r.events, { tempo: sg.tempo, title: sg.title || 'Velvet & Strings', bpb: r.bpb });
    ST.share(fname(sg) + '.mid', bytes, 'audio/midi', toast);
  }
  function songSheet() {
    const p = style(), t = tuning(), s = S.song, L = [], title = (s.title || 'Untitled romance').trim();
    L.push(title.toUpperCase(), '='.repeat(Math.min(60, title.length)), 'Velvet & Strings ' + VERSION + ' · Romance Songwriting Studio', '');
    L.push('Style    : ' + p.artist + ' — ' + p.style, 'Key      : ' + keyName(), 'Tempo    : ' + s.tempo + ' BPM' + (s.swing ? ' (swing)' : ''),
      'Guitar   : ' + t.label + (s.capo ? ', capo ' + s.capo : ''), 'Groove   : ' + GROOVES.find(g => g[0] === s.groove)[1] + (s.drums ? ' · ' + DRUMSTYLES.find(g => g[0] === s.drumStyle)[1] + ' drums' : ''),
      'Status   : ' + STATUSES.find(x => x[0] === s.status)[1] + ((s.tags || []).length ? '   Tags: ' + s.tags.join(', ') : ''), '');
    if (s.challenge) L.push('Challenge: ' + s.challenge, '');
    L.push('CHORD SHAPES (' + t.strings.join(' ') + (s.capo ? ', capo ' + s.capo : '') + ')');
    const seen = new Set();
    s.sections.forEach(x => x.prog.forEach(c => { const n = symS(c, x); if (seen.has(n)) return; seen.add(n); L.push('  ' + (n + '          ').slice(0, 11) + dropFrets(shapeOf(c, secShift(x))).map(f => f < 0 ? 'x' : f).join('-') + (off() ? '   (shape ' + symW(c, x) + ')' : '')); }));
    L.push('', 'SONG');
    s.sections.forEach((x, i) => {
      const n = Math.round(x.intensity / 10);
      L.push('', '[' + (i + 1) + '. ' + x.type + ']  x' + x.loops + '  ' + '#'.repeat(n) + '.'.repeat(10 - n) + ' ' + x.intensity + '%' + (x.shift ? '  key ' + (x.shift > 0 ? '+' : '') + x.shift : ''));
      L.push('  Chords  : ' + x.prog.map(c => symS(c, x) + (c.d !== 1 ? '(' + c.d + ')' : '')).join(' ') + '    ' + x.prog.map(romanOf).join(' '));
      if (x.mel) L.push('  Melody  : ' + sectionMelody(x).map(n => T.midiName(n.m + off(), T.useFlats(s.key))).join(' '));
      if (x.notes.trim()) L.push('  Delivery: ' + x.notes.replace(/\s+/g, ' ').trim());
      if (x.lyrics.trim()) x.lyrics.trim().split('\n').forEach(l => L.push('    ' + l));
    });
    L.push('', 'Exported ' + new Date().toLocaleString());
    return L.join('\n') + '\n';
  }
  function chordPro() {
    const s = S.song;
    return X.chordpro({ title: s.title || 'Untitled romance', subtitle: style().artist + ' style', key: keyName().replace(' major', '').replace(' minor', 'm'), tempo: s.tempo, capo: s.capo, time: s.groove === '68' ? '6/8' : '4/4',
      sections: s.sections.map(x => ({ type: x.type, shift: x.shift, loops: x.loops, chords: x.prog.map(c => symS(c, x)), notes: x.notes, lyrics: x.lyrics.trim() })) });
  }
  /* quick sketch & challenge */
  function quickSketch() {
    const pool = S.favs.length ? D.STYLES.filter(p => S.favs.includes(p.id)) : D.STYLES;
    const p = pick(pool);
    const sg = newSong(p.id, { form: 'sketch', title: pick(D.ADJ) + ' ' + pick(D.NOUN), tags: ['quick'] });
    createSong(sg); go('write'); toast('⚡ Sketch: ' + sg.title + ' (' + p.artist + ')');
  }
  function challenge() {
    const c = { harmony: pick(D.CHALLENGES.harmony), rhythm: pick(D.CHALLENGES.rhythm), lyric: pick(D.CHALLENGES.lyric), melody: pick(D.CHALLENGES.melody), style: pick(D.STYLES) };
    openSheet(b => {
      b.append(el('h3', null, '🎲 Songwriting challenge'), el('p', 'small muted', 'Four constraints and a style. Constraints spark ideas — accept and write fast.'));
      [['Style', c.style.artist + ' — ' + c.style.style], ['Harmony', c.harmony], ['Rhythm', c.rhythm], ['Lyric', c.lyric], ['Melody', c.melody]].forEach(([k, v]) => { const r = el('div', 'task'); r.append(el('span', 'badge', k), el('span', 'small grow', v)); b.appendChild(r); });
      const g = el('div', 'grid2'); g.style.marginTop = '12px';
      g.append(btn('Accept', 'gold', () => { closeSheet(); acceptChallenge(c); }), btn('Reroll', '', challenge));
      b.appendChild(g);
    });
  }
  function acceptChallenge(c) {
    const sg = newSong(c.style.id, { form: c.style.form, title: pick(D.ADJ) + ' ' + pick(D.NOUN), tags: ['challenge'], challenge: [c.harmony, c.rhythm, c.lyric, c.melody].join(' · ') });
    const key = sg.key, find = t => sg.sections.filter(x => x.type === t);
    if (/6\/8/.test(c.rhythm)) sg.groove = '68';
    if (/Swing/.test(c.rhythm)) sg.swing = true;
    if (/under 70/.test(c.rhythm)) sg.tempo = 64;
    if (/over 115/.test(c.rhythm)) sg.tempo = 120;
    if (/Half-time/.test(c.rhythm)) sg.drumStyle = 'half';
    if (/borrowed iv/.test(c.harmony)) find('Bridge (Twist)').forEach(x => { x.prog = C.twist(x.prog, key, 'heart'); });
    if (/bVII in the chorus/.test(c.harmony)) find('Chorus').forEach(x => { if (x.prog[2]) x.prog[2] = { r: 10, q: '', b: null, d: x.prog[2].d }; });
    if (/secondary dominant/.test(c.harmony)) find('Verse').forEach(x => { x.prog = C.twist(x.prog, key, 'secondary'); });
    if (/whole step/.test(c.harmony)) find('Climactic Chorus').forEach(x => { x.shift = 2; });
    if (/sus4/.test(c.harmony)) find('Pre-Chorus').concat(find('Verse')).slice(0, 1).forEach(x => { const last = x.prog[x.prog.length - 1]; x.prog.splice(x.prog.length - 1, 0, { r: last.r, q: 'sus4', b: null, d: 1 }); });
    if (/End the song on the IV/.test(c.harmony)) find('Outro').forEach(x => { x.prog[x.prog.length - 1] = { r: 5, q: key.minor ? 'm' : '', b: null, d: 2 }; });
    createSong(sg); go('write'); toast('Challenge accepted: ' + sg.title);
  }
  /* voice memos */
  let memoAudio = null, memoUrl = null, playingMemo = null;
  async function renderMemos() {
    const box = $('memoList'), list = await ST.memos.all();
    box.innerHTML = '';
    $('memoCount').textContent = list.length ? list.length + ' memo' + (list.length === 1 ? '' : 's') : '';
    if (!list.length) { box.appendChild(el('p', 'empty', 'Tap the red ● button anytime to hum an idea. Memos live here.')); return; }
    list.forEach(m => {
      const row = el('div', 'memo');
      const play = el('button', 'ib', playingMemo === m.id ? '■' : '▶'); play.style.color = 'var(--teal)';
      play.addEventListener('click', () => playMemo(m));
      const inf = el('div', 'inf'); const sg = songs.find(s => s.id === m.songId);
      inf.append(el('b', null, m.title || (sg ? (sg.title || 'Untitled romance') : 'Idea')), el('span', null, new Date(m.created).toLocaleString() + ' · ' + Math.round(m.dur) + 's' + (sg ? ' · ' + (sg.title || STY(sg.styleId).artist) : '')));
      const more = el('button', 'ib', '⋯'); more.addEventListener('click', () => memoMenu(m));
      row.append(play, inf, more); box.appendChild(row);
    });
  }
  function playMemo(m) {
    if (memoAudio) { memoAudio.pause(); URL.revokeObjectURL(memoUrl); memoAudio = null; if (playingMemo === m.id) { playingMemo = null; renderMemos(); return; } }
    memoUrl = URL.createObjectURL(m.blob); memoAudio = new Audio(memoUrl); playingMemo = m.id;
    memoAudio.onended = () => { playingMemo = null; renderMemos(); };
    memoAudio.play().catch(() => toast('Could not play this memo')); renderMemos();
  }
  function memoMenu(m) {
    openSheet(b => {
      b.appendChild(el('h3', null, m.title || 'Voice memo'));
      const nm = el('input', 'inp'); nm.value = m.title || ''; nm.placeholder = 'Name this idea'; nm.style.cssText = 'width:100%;margin:8px 0';
      nm.addEventListener('change', async () => { m.title = nm.value.slice(0, 60); await ST.memos.put(m); renderMemos(); });
      b.appendChild(nm);
      const g = el('div', 'grid2');
      g.append(btn('Attach to current song', '', async () => { m.songId = S.song.id; await ST.memos.put(m); closeSheet(); renderMemos(); toast('Attached to ' + (S.song.title || 'current song')); }),
        btn('Share audio', '', () => ST.share((m.title || 'velvet-idea').replace(/[^a-z0-9]+/gi, '-') + (/mp4/.test(m.blob.type) ? '.m4a' : '.webm'), m.blob, m.blob.type || 'audio/webm', toast)),
        btn('Delete', 'rose', () => confirmSheet('Delete memo?', 'This voice memo will be removed.', 'Delete', async () => { await ST.memos.del(m.id); renderMemos(); })));
      b.appendChild(g);
    });
  }
  let recording = false;
  async function toggleRec() {
    if (!recording) {
      try { await A.startRec(); recording = true; $('recBtn').classList.add('on'); toast('● Recording… tap again to stop'); }
      catch (e) { toast('Microphone permission is needed to record'); }
      return;
    }
    recording = false; $('recBtn').classList.remove('on');
    const r = await A.stopRec(); if (!r || !r.blob.size) { toast('Nothing recorded'); return; }
    await ST.memos.put({ id: uid(), songId: S.song.id, title: (S.song.title || 'Idea') + ' · ' + (sec() ? sec().type : 'memo'), created: Date.now(), dur: r.dur, blob: r.blob });
    toast('Memo saved to Library ▸ Idea inbox'); if (S.view === 'library') renderMemos();
  }

  /* ============================ wiring ============================ */
  document.querySelectorAll('#tabs button').forEach(b => b.addEventListener('click', () => { haptic(); go(b.dataset.v); }));
  $('topTtl').addEventListener('click', () => go('styles'));
  $('undoBtn').addEventListener('click', () => { haptic(); undo(); });
  $('playBtn').addEventListener('click', () => { haptic(); if (A.playing) stopAll(); else if (S.view === 'write') playSong(); else playLoop(); });
  $('playSongBtn').addEventListener('click', () => { haptic(); if (A.playing && S.mode === 'song') { stopAll(); return; } playSong(); });
  $('cueBtn').addEventListener('click', () => { haptic(); singCue(); });
  $('recBtn').addEventListener('click', () => { haptic('heavy'); toggleRec(); });
  $('tempo').addEventListener('input', e => { S.song.tempo = +e.target.value; $('tempoVal').textContent = S.song.tempo; A.setTempo(S.song.tempo); renderTop(); renderNow(); save(); });
  let taps = [];
  $('tapBtn').addEventListener('click', () => {
    haptic(); const now = performance.now(); taps = taps.filter(x => now - x < 2500); taps.push(now);
    if (taps.length >= 2) { const iv = (taps[taps.length - 1] - taps[0]) / (taps.length - 1); S.song.tempo = Math.max(50, Math.min(160, Math.round(60000 / iv))); $('tempo').value = S.song.tempo; $('tempoVal').textContent = S.song.tempo; A.setTempo(S.song.tempo); renderTop(); save(); }
  });
  [['swingTog', 'swing'], ['drumTog', 'drums'], ['metroTog', 'metro'], ['countTog', 'countIn'], ['leftyTog', 'lefty']].forEach(([id, k]) => $(id).addEventListener('click', () => { haptic(); S.song[k] = !S.song[k]; save(); if (k !== 'countIn') refreshPlayback(); renderStudio(); }));
  A.volume = ST.kv.get('vol', 80) / 100;
  $('vol').addEventListener('input', e => { A.setVolume(+e.target.value / 100); ST.kv.set('vol', +e.target.value); });
  TUNINGS.forEach(t => { const o = el('option', null, t.label); o.value = t.id; $('tuningSel').appendChild(o); });
  $('tuningSel').addEventListener('change', e => { S.song.tuning = e.target.value; save(); refreshPlayback(); renderAll(); });
  $('capoDn').addEventListener('click', () => { haptic(); if (S.song.capo > 0) { S.song.capo--; save(); refreshPlayback(); renderAll(); } });
  $('capoUp').addEventListener('click', () => { haptic(); if (S.song.capo < 9) { S.song.capo++; save(); refreshPlayback(); renderAll(); } });
  $('q').addEventListener('input', e => { S.q = e.target.value.trim(); renderStyles(); });
  $('inspireBtn').addEventListener('click', () => {
    haptic(); const pool = D.STYLES.filter(styleMatches); const p = pick(pool.length ? pool : D.STYLES);
    const sg = newSong(p.id, { form: p.form, title: pick(D.ADJ) + ' ' + pick(D.NOUN), tags: ['inspire'] });
    createSong(sg); go('studio'); toast('✦ ' + p.artist + ' · ' + sg.title);
  });
  $('songTitle').addEventListener('focus', snap, { once: false });
  $('songTitle').addEventListener('input', e => { S.song.title = e.target.value; save(); renderTop(); });
  D.SECTION_TYPES.forEach(t => { const o = el('option', null, t); o.value = t; $('addType').appendChild(o); });
  $('addBtn').addEventListener('click', () => {
    haptic(); snap();
    const type = $('addType').value, map = { Intro: 'intro', Verse: 'verse', 'Pre-Chorus': 'pre', Chorus: 'chorus', 'Bridge (Twist)': 'bridge', Solo: 'solo', 'Climactic Chorus': 'climax', Outro: 'outro' };
    const g = C.generate(map[type], styleBase(style()), S.song.key); const x = mkSec(type, g.prog, g.shift, type === 'Intro' || type === 'Outro' ? 1 : 2);
    S.song.sections.push(x); S.open = { [x.id]: true }; save(); renderWrite();
    requestAnimationFrame(() => { const last = document.querySelector('#sections .sec:last-child'); if (last) last.scrollIntoView({ block: 'center', behavior: 'smooth' }); });
  });
  $('formBtn').addEventListener('click', formSheet);
  $('promptBox').addEventListener('click', () => { promptI++; renderRhymes(); });
  $('lyricTipsLnk').addEventListener('click', () => { S.learn = 'guide'; ST.kv.set('learn', 'guide'); go('learn'); setTimeout(() => { const d = document.getElementById('lyricTips'); if (d) { d.open = true; d.scrollIntoView({ block: 'start', behavior: 'smooth' }); } }, 80); });
  $('perfBtn').addEventListener('click', openPerf);
  $('perfClose').addEventListener('click', closePerf);
  $('perfBigger').addEventListener('click', () => { perfScale = Math.min(2.2, perfScale + 0.15); ST.kv.set('perfScale', perfScale); applyPerf(); });
  $('perfSmaller').addEventListener('click', () => { perfScale = Math.max(0.7, perfScale - 0.15); ST.kv.set('perfScale', perfScale); applyPerf(); });
  $('perfScroll').addEventListener('click', () => {
    if (perfT) { clearInterval(perfT); perfT = null; $('perfScroll').classList.remove('on'); return; }
    $('perfScroll').classList.add('on'); const body = $('perfBody'), px = Math.max(0.4, S.song.tempo / 120); let acc = 0;
    perfT = setInterval(() => { acc += px; if (acc >= 1) { body.scrollTop += Math.floor(acc); acc -= Math.floor(acc); } if (body.scrollTop + body.clientHeight >= body.scrollHeight - 2) { clearInterval(perfT); perfT = null; $('perfScroll').classList.remove('on'); } }, 40);
  });
  $('quickBtn').addEventListener('click', () => { haptic(); quickSketch(); });
  $('challengeBtn').addEventListener('click', () => { haptic(); challenge(); });
  $('newBtn').addEventListener('click', () => { haptic(); createSong(newSong(S.song.styleId, { form: style().form })); go('write'); toast('New song'); });
  $('libQ').addEventListener('input', e => { S.libQ = e.target.value.trim(); renderLibrary(); });
  $('backupBtn').addEventListener('click', () => ST.share('velvet-strings-backup-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify({ app: 'velvet-and-strings', version: 3, exported: new Date().toISOString(), favs: S.favs, progress: P, songs }, null, 1), 'application/json', toast));
  $('batchBtn').addEventListener('click', () => { const prev = S.song; const all = songs.filter(s => s.status !== 'practice').map(sg => { S.song = sg; return chordPro(); }).join('\n{new_song}\n'); S.song = prev; ST.share('velvet-strings-songbook.cho', all, 'text/plain', toast); });
  $('restoreBtn').addEventListener('click', () => $('restoreFile').click());
  $('restoreFile').addEventListener('change', async e => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      let incoming = Array.isArray(data) ? data : data.songs || [];
      if ((data.version || 2) < 3) { const keep = ST.kv.raw('vs2_songs'); try { localStorage.setItem('vs2_songs', JSON.stringify(incoming)); incoming = migrateLegacy() || []; } finally { if (keep === null) localStorage.removeItem('vs2_songs'); else localStorage.setItem('vs2_songs', keep); } }
      else incoming = incoming.map(sanitize);
      if (!incoming.length) throw new Error('empty');
      const ids = new Set(songs.map(s => s.id)); incoming.forEach(s => { if (ids.has(s.id)) s.id = uid(); songs.push(s); });
      if (Array.isArray(data.favs)) { S.favs = [...new Set([...S.favs, ...data.favs])]; ST.kv.set('favs', S.favs); }
      flush(); renderLibrary(); toast('Restored ' + incoming.length + (incoming.length === 1 ? ' song' : ' songs'));
    } catch (err) { toast('That file is not a Velvet & Strings backup'); }
    e.target.value = '';
  });
  $('aboutBtn').addEventListener('click', () => openSheet(b => {
    b.append(el('h3', null, 'Velvet & Strings ' + VERSION), el('p', 'small muted', 'Offline romance songwriting studio. Everything is stored on this phone.'));
    b.appendChild(el('p', 'small', 'Styles are archetypes inspired by the signature sounds of the artists named; the app is not affiliated with them. Example song titles in the progression library and trivia refer to well-known recordings; no lyrics or recordings are included.'));
    b.appendChild(el('p', 'small muted', 'Exports: .txt song sheets, ChordPro (.cho), Standard MIDI files (.mid), JSON backups and voice memos.'));
  }));
  $('scrim').addEventListener('click', closeSheet);

  function handleBack() {
    if (sheetOpen()) { closeSheet(); return true; }
    if ($('perf').classList.contains('on')) { closePerf(); return true; }
    if (S.view !== 'studio') { go('studio'); return true; }
    return false;
  }
  const AppP = ST.plugin('App');
  if (AppP) {
    AppP.addListener('backButton', () => { if (!handleBack()) { if (A.playing) A.stop(); AppP.minimizeApp ? AppP.minimizeApp() : AppP.exitApp(); } });
    AppP.addListener('pause', () => { if (A.playing) A.stop(); if (recording) toggleRec(); flush(); });
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) { if (A.playing) A.stop(); if (tunerOn) { tunerOn = false; A.stopTuner(); } flush(); } });
  window.addEventListener('pagehide', flush);

  /* public surface for learn.js and tests */
  const App = root.App = {
    S, P, D, T, C, A, ST, TUNINGS, get songs() { return songs; }, el, $, btn, chips, seg, toast, haptic, openSheet, closeSheet, chordSVG, go, renderAll,
    save, saveProgress, snap, newSong, createSong, sanitize, songSheet, chordPro, exportMidi, playRender, playLoop, playSong, stopAll, handleBack,
    guitarMidisFor, keyName, styleBase, VERSION, migrateLegacy, quickSketch, acceptChallenge, setSpeedHook: fn => { speedHook = fn; }
  };
  document.addEventListener('DOMContentLoaded', async () => {
    if (!ST.kv.get('songs', null) && ST.isNative) { const m = await ST.readMirror(); if (m && m.length) { songs = m.map(sanitize); S.song = songs[0]; } }
    flush(); renderTop(); go(S.view); renderNow();
  });
})(typeof self !== 'undefined' ? self : this);
