/* Velvet & Strings 3.0 — Learn tab: path, fretboard, trainers, ear training, quiz and the composing guide. */
(function (root) {
  'use strict';
  const App = root.App, T = App.T, D = App.D, C = App.C, A = App.A, ST = App.ST, S = App.S, P = App.P;
  const { el, $, btn, chips, seg, toast, haptic, chordSVG } = App;
  const rand = n => Math.floor(Math.random() * n), pick = a => a[rand(a.length)];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const L = { fMode: 'chord', scale: 'pentMin', labels: 'notes', root: null, pairA: 'G', pairB: 'C', drillTempo: 70, drill: null, speed: { from: 60, to: 100, step: 4, every: 2, on: false },
    ear: { mode: 'interval', hard: false, cur: null, streak: 0, score: 0, total: 0, answered: false }, quiz: null, fq: null };
  const TABS = [['path', 'Path'], ['fret', 'Fretboard'], ['train', 'Trainer'], ['ear', 'Ear'], ['quiz', 'Quiz'], ['guide', 'Guide']];
  const drillKey = (a, b) => [a, b].sort().join('|');
  const uke = () => App.S.song.instrument === 'ukulele';

  App.renderLearn = function () {
    chips($('learnTabs'), TABS, S.learn, id => { App.leaveLearn(); S.learn = id; ST.kv.set('learn', id); App.renderLearn(); });
    const box = $('learnBody'); box.innerHTML = '';
    ({ path: renderPath, fret: renderFret, train: renderTrain, ear: renderEar, quiz: renderQuiz, guide: renderGuide }[S.learn] || renderPath)(box);
  };
  App.leaveLearn = function () { stopDrill(); if (L.speed.on) stopSpeed(); };
  App.practiceActive = () => !!(L.drill && L.drill.running);

  /* ---------------- path ---------------- */
  function levelTasks(lv) {
    const tasks = [];
    lv.drills.forEach(([a, b, target]) => tasks.push({ kind: 'drill', label: a + ' ↔ ' + b + ': ' + target + ' changes / min', done: (P.drills[drillKey(a, b)] || 0) >= target, a, b, target }));
    lv.songs.forEach((sg, i) => tasks.push({ kind: 'song', label: 'Play “' + sg.name + '” for 4 loops at ' + sg.tempo + ' BPM', done: !!P.played['lvl' + lv.n + ':' + i], sg, i }));
    if (lv.fret) tasks.push({ kind: 'fret', label: 'Fretboard quiz: score 8/10 or better', done: (P.fret.best || 0) >= 80 });
    if (lv.voicings) tasks.push({ kind: 'voic', label: 'Explore 3+ voicings of one chord (Studio ▸ Chord ▸ ‹ ›)', done: Object.values(P.voicings).some(v => v >= 3) });
    if (lv.scale) tasks.push({ kind: 'scale', label: 'View the minor pentatonic scale on the fretboard', done: !!P.scaleSeen });
    return tasks;
  }
  function renderPath(box) {
    const intro = el('p', 'small muted', 'From your first chords to jazz voicings. Each level unlocks the fretboard a little more — tasks tick themselves off as you practise.');
    intro.style.marginTop = '0'; box.appendChild(intro);
    D.LEVELS.forEach(lv => {
      const tasks = levelTasks(lv), done = tasks.filter(t => t.done).length;
      const card = el('div', 'lvl' + (done === tasks.length ? ' done' : '') + (L.openLevel === lv.n ? ' open' : ''));
      const hd = el('button', 'hd'); const n = el('span', 'n', done === tasks.length ? '✓' : String(lv.n));
      const txt = el('div', 'grow'); txt.append(el('b', null, lv.name), el('span', null, done + ' / ' + tasks.length + ' tasks · ' + lv.goal));
      const pr = el('div', 'prog'); const pi = el('i'); pi.style.width = (100 * done / tasks.length) + '%'; pr.appendChild(pi); txt.appendChild(pr);
      hd.append(n, txt); hd.addEventListener('click', () => { L.openLevel = L.openLevel === lv.n ? null : lv.n; App.renderLearn(); });
      card.appendChild(hd);
      const bd = el('div', 'bd');
      bd.appendChild(el('div', 'tip', '💡 ' + lv.tip));
      const minis = el('div', 'minis');
      lv.chords.forEach(sym => {
        const p = T.parseSym(sym), item = { r: 0, q: p.q, b: null }, key = { tonic: p.pc, minor: false };
        const frets = uke() ? (D.UKE_SHAPES[sym] || T.voicings(item, p.pc, 'ukulele', 1)[0]) : (D.SHAPES[sym] || T.voicings(item, p.pc, 'guitar', 1)[0]);
        const m = el('button', 'mini'); m.innerHTML = chordSVG(frets, { lefty: S.song.lefty }); m.appendChild(el('b', null, sym));
        m.addEventListener('click', () => { A.ensure(); const open = uke() ? [67, 60, 64, 69] : [40, 45, 50, 55, 59, 64]; A.strumNow(frets.map((f, i) => f < 0 ? null : open[i] + f).filter(x => x !== null)); });
        minis.appendChild(m);
      });
      bd.appendChild(minis);
      tasks.forEach(t => {
        const row = el('div', 'task' + (t.done ? ' ok' : '')); row.appendChild(el('span', 'ck', t.done ? '✓' : ''));
        const lab = el('span', 'small grow', t.label);
        if (t.kind === 'drill') { const best = P.drills[drillKey(t.a, t.b)]; if (best) lab.textContent += ' · best ' + best; }
        row.appendChild(lab);
        if (t.kind === 'drill') row.appendChild(btn('Train', 'sm', () => { L.pairA = t.a; L.pairB = t.b; S.learn = 'train'; App.renderLearn(); }));
        if (t.kind === 'song') row.appendChild(btn('Load', 'sm gold', () => loadPractice(lv, t.sg, t.i)));
        if (t.kind === 'fret') row.appendChild(btn('Quiz', 'sm', () => { S.learn = 'fret'; L.fMode = 'quiz'; L.fq = null; App.renderLearn(); }));
        if (t.kind === 'voic') row.appendChild(btn('Open', 'sm', () => { S.inst = 'chord'; App.go('studio'); }));
        if (t.kind === 'scale') row.appendChild(btn('Show', 'sm', () => { S.learn = 'fret'; L.fMode = 'scale'; L.scale = 'pentMin'; App.renderLearn(); }));
        bd.appendChild(row);
      });
      card.appendChild(bd); box.appendChild(card);
    });
  }
  function loadPractice(lv, sg, i) {
    const p = T.parseSym(sg.key), minor = p.q === 'm';
    const lib = sg.lib ? D.LIB.find(x => x.id === sg.lib) : null;
    const roman = lib ? lib.roman : sg.roman;
    const prog = roman.map(r => r === 'i(maj7)' ? { r: 0, q: 'mmaj7', b: null, d: 1 } : Object.assign(T.parseRoman(r), { d: 1 }));
    const tag = 'lvl' + lv.n + ':' + i;
    let song = App.songs.find(s => (s.tags || []).includes(tag));
    if (!song) {
      song = App.newSong(lv.n >= 5 && sg.swing ? 'muddy' : 'adams', { title: 'Lv ' + lv.n + ' · ' + sg.name, status: 'practice', tags: [tag] });
      song.key = { tonic: p.pc, minor }; song.tempo = sg.tempo; song.swing = !!sg.swing; song.groove = sg.swing ? 'shuffle' : 'strum';
      song.drumStyle = sg.swing ? 'shuffle' : 'ballad'; song.voice = 'off'; song.capo = 0; song.tuning = 'std';
      song.sections = [{ id: 'p' + Date.now(), type: 'Verse', prog, shift: 0, loops: 4, intensity: 70, notes: 'Practice loop', lyrics: '', mel: false, melSeed: 1 }];
      App.createSong(song);
    } else { App.S.song = song; }
    App.S.sec = 0; App.S.sel = 0; App.S.loopCount = 0; App.S.inst = 'chord';
    App.go('studio'); App.playLoop(); toast('Play along: 4 loops completes the task');
  }

  /* ---------------- fretboard ---------------- */
  function renderFret(box) {
    const song = S.song, tun = uke() ? { midi: [67, 60, 64, 69], strings: ['G', 'C', 'E', 'A'] } : App.TUNINGS.find(t => t.id === song.tuning) || App.TUNINGS[0];
    seg(box.appendChild(el('div', 'seg')), [['chord', 'Chord tones'], ['scale', 'Scale'], ['quiz', 'Note quiz']], L.fMode, id => { L.fMode = id; L.fq = null; App.renderLearn(); });
    if (L.root === null) L.root = song.key.tonic;
    const offset = (uke() ? 0 : tun.shift || 0) + song.capo;
    let mark = new Set(), roots = new Set(), title = '';
    if (L.fMode === 'chord') {
      const s = song.sections[S.sec], c = s && s.prog[Math.min(S.sel, s.prog.length - 1)];
      if (c) { const t0 = song.key.tonic + (s.shift || 0) + offset; T.chordPcs(c, t0).forEach(x => mark.add(x)); roots.add(T.mod(t0 + c.r, 12)); title = T.symOf(c, song.key, (s.shift || 0) + offset) + ' — every chord tone on the neck'; }
    } else if (L.fMode === 'scale') {
      const ctl = el('div', 'row'); ctl.style.marginTop = '8px';
      const rs = el('select', 'sel'); for (let r = 0; r < 12; r++) { const o = el('option', null, T.noteName(r, T.useFlats(song.key))); o.value = r; rs.appendChild(o); } rs.value = L.root;
      rs.addEventListener('change', () => { L.root = +rs.value; App.renderLearn(); });
      const ss = el('select', 'sel grow'); Object.entries(T.SCALES).forEach(([id, sc]) => { const o = el('option', null, sc.name); o.value = id; ss.appendChild(o); }); ss.value = L.scale;
      ss.addEventListener('change', () => { L.scale = ss.value; App.renderLearn(); });
      ctl.append(rs, ss); box.appendChild(ctl);
      T.scalePcs(L.root, L.scale).forEach(x => mark.add(x)); roots.add(L.root);
      title = T.noteName(L.root, T.useFlats(song.key)) + ' ' + T.SCALES[L.scale].name;
      if (L.scale === 'pentMin') { P.scaleSeen = true; App.saveProgress(); }
    }
    const lb = el('div', 'chips'); lb.style.marginTop = '8px';
    chips(lb, [['notes', 'Note names'], ['intervals', 'Intervals'], ['none', 'Dots only']], L.labels, id => { L.labels = id; App.renderLearn(); }, 'teal');
    if (L.fMode !== 'quiz') box.appendChild(lb);
    if (title) box.appendChild(el('p', 'small', title)).style.color = 'var(--gold2)';
    if (L.fMode === 'quiz') { renderFretQuiz(box, tun); return; }
    box.appendChild(neck(tun.midi, tun.strings, { mark, roots, rootPc: [...roots][0] }));
    box.appendChild(el('p', 'tiny muted', 'Tap any position to hear it. Rose = root, gold = chord/scale tone. ' + (song.lefty ? 'Left-handed view.' : '') + (song.capo ? ' Capo ignored here (absolute frets).' : ''))).style.marginTop = '6px';
  }
  function neck(open, names, o) {
    o = o || {};
    const n = open.length, frets = 15, W = 780, H = n * 30 + 34, L0 = 34, fw = (W - L0 - 10) / frets, lefty = S.song.lefty;
    const X = f => lefty ? W - (L0 + (f - 0.5) * fw) : L0 + (f - 0.5) * fw;
    const XF = f => lefty ? W - (L0 + f * fw) : L0 + f * fw;
    const Y = i => 18 + (n - 1 - i) * 30;
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '">';
    s += '<rect x="' + Math.min(XF(0), XF(frets)) + '" y="8" width="' + (frets * fw) + '" height="' + ((n - 1) * 30 + 20) + '" rx="6" fill="#2a1410"/>';
    [3, 5, 7, 9, 15].forEach(f => s += '<circle cx="' + X(f) + '" cy="' + (H / 2 - 8) + '" r="5" fill="#4a2a20"/>');
    s += '<circle cx="' + X(12) + '" cy="' + (H / 2 - 23) + '" r="5" fill="#4a2a20"/><circle cx="' + X(12) + '" cy="' + (H / 2 + 7) + '" r="5" fill="#4a2a20"/>';
    for (let f = 0; f <= frets; f++) s += '<line x1="' + XF(f) + '" x2="' + XF(f) + '" y1="10" y2="' + (Y(0) + 8) + '" stroke="' + (f === 0 ? '#f5eaee' : '#8b6b5c') + '" stroke-width="' + (f === 0 ? 4 : 1.4) + '"/>';
    for (let i = 0; i < n; i++) {
      s += '<line x1="' + XF(0) + '" x2="' + XF(frets) + '" y1="' + Y(i) + '" y2="' + Y(i) + '" stroke="#cdb7a8" stroke-width="' + (n === 4 ? 1.4 : 2.2 - i * 0.28) + '"/>';
      s += '<text x="' + (lefty ? W - 14 : 14) + '" y="' + (Y(i) + 4) + '" text-anchor="middle" fill="#a88d98" font-size="12" font-weight="700">' + names[i] + '</text>';
    }
    for (let f = 1; f <= frets; f++) if ([3, 5, 7, 9, 12, 15].includes(f)) s += '<text x="' + X(f) + '" y="' + (H - 2) + '" text-anchor="middle" fill="#6f5762" font-size="10">' + f + '</text>';
    for (let i = 0; i < n; i++) for (let f = 0; f <= frets; f++) {
      const m = open[i] + f, pc = T.mod(m, 12);
      const hit = o.quiz ? (o.quiz.s === i && o.quiz.f === f) : o.mark && o.mark.has(pc);
      const cx = f === 0 ? (lefty ? XF(0) + 12 : XF(0) - 12) : X(f), cy = Y(i);
      if (hit) {
        const isRoot = !o.quiz && o.roots && o.roots.has(pc);
        s += '<circle cx="' + cx + '" cy="' + cy + '" r="11" fill="' + (o.quiz ? '#3fd0c0' : isRoot ? '#e0517a' : '#e6b85c') + '"/>';
        let lab = '';
        if (o.quiz) lab = '?';
        else if (L.labels === 'notes') lab = T.noteName(pc, T.useFlats(S.song.key));
        else if (L.labels === 'intervals') lab = ['R', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'][T.mod(pc - o.rootPc, 12)];
        if (lab) s += '<text x="' + cx + '" y="' + (cy + 4) + '" text-anchor="middle" fill="#1b0a11" font-size="10" font-weight="800">' + lab + '</text>';
      }
      s += '<rect data-m="' + m + '" x="' + (cx - fw / 2) + '" y="' + (cy - 15) + '" width="' + fw + '" height="30" fill="transparent"/>';
    }
    s += '</svg>';
    const wrap = el('div', 'neckwrap'), inner = el('div', 'neck'); inner.innerHTML = s; wrap.appendChild(inner);
    inner.addEventListener('click', e => { const r = e.target.closest('[data-m]'); if (r) { A.ensure(); A.pluckNow(+r.dataset.m, 1.5); } });
    if (o.quiz) requestAnimationFrame(() => { const x = X(o.quiz.f) / W * inner.scrollWidth; wrap.scrollLeft = Math.max(0, x - wrap.clientWidth / 2); });
    return wrap;
  }
  function renderFretQuiz(box, tun) {
    if (!L.fq) L.fq = { i: 0, score: 0, q: null, answered: false };
    const q = L.fq;
    if (q.i >= 10) {
      const pct = q.score * 10; if (pct > (P.fret.best || 0)) { P.fret.best = pct; App.saveProgress(); }
      box.append(el('div', 'big', q.score + ' / 10'));
      box.lastChild.appendChild(el('small', null, 'Best ' + (P.fret.best || 0) + '%'));
      box.appendChild(btn('Play again', 'gold full', () => { L.fq = null; App.renderLearn(); })).style.marginTop = '10px';
      return;
    }
    if (!q.q) q.q = { s: rand(tun.midi.length), f: rand(13) };
    const pc = T.mod(tun.midi[q.q.s] + q.q.f, 12);
    const sc = el('div', 'score'); sc.innerHTML = '<span>Question <b>' + (q.i + 1) + '</b>/10</span><span>Score <b>' + q.score + '</b></span><span>Best <b>' + (P.fret.best || 0) + '%</b></span>';
    box.appendChild(sc);
    box.appendChild(el('p', 'small muted', 'Which note is on the ' + tun.strings[q.q.s] + ' string, fret ' + q.q.f + '?'));
    box.appendChild(neck(tun.midi, tun.strings, { quiz: q.q }));
    const g = el('div', 'notes12');
    for (let r = 0; r < 12; r++) {
      const label = T.SHARPS[r] === T.FLATS[r] ? T.SHARPS[r] : T.SHARPS[r] + '/' + T.FLATS[r];
      const b = el('button', 'btn' + (q.answered && r === pc ? ' teal' : q.answered && q.pickd === r ? ' rose' : ''), label);
      b.addEventListener('click', () => {
        if (q.answered) return; q.answered = true; q.pickd = r; if (r === pc) { q.score++; haptic(); } else haptic('heavy');
        A.ensure(); A.pluckNow(tun.midi[q.q.s] + q.q.f, 1.2);
        App.renderLearn(); setTimeout(() => { q.i++; q.q = null; q.answered = false; if (S.learn === 'fret' && L.fMode === 'quiz') App.renderLearn(); }, 900);
      });
      g.appendChild(b);
    }
    box.appendChild(g);
  }

  /* ---------------- trainer ---------------- */
  const allChords = () => [...new Set(D.LEVELS.flatMap(l => l.chords))];
  function renderTrain(box) {
    // chord change drill
    box.appendChild(el('div', 'h')).appendChild(el('h2', null, 'One-minute chord changes'));
    const card = el('div', 'card');
    const row = el('div', 'row');
    const mk = (val, set) => { const s = el('select', 'sel grow'); allChords().forEach(c => { const o = el('option', null, c); o.value = c; s.appendChild(o); }); s.value = val; s.addEventListener('change', () => { set(s.value); App.renderLearn(); }); return s; };
    row.append(mk(L.pairA, v => L.pairA = v), el('span', 'muted', '↔'), mk(L.pairB, v => L.pairB = v));
    card.appendChild(row);
    const minis = el('div', 'minis'); minis.style.justifyContent = 'center';
    [L.pairA, L.pairB].forEach(sym => { const p = T.parseSym(sym); const f = uke() ? (D.UKE_SHAPES[sym] || T.voicings({ r: 0, q: p.q, b: null }, p.pc, 'ukulele', 1)[0]) : (D.SHAPES[sym] || T.voicings({ r: 0, q: p.q, b: null }, p.pc, 'guitar', 1)[0]); const m = el('div', 'mini'); m.innerHTML = chordSVG(f, { lefty: S.song.lefty }); m.appendChild(el('b', null, sym)); minis.appendChild(m); });
    card.appendChild(minis);
    const best = P.drills[drillKey(L.pairA, L.pairB)] || 0;
    const d = L.drill;
    const big = el('button', 'big');
    if (d && d.running) { big.textContent = d.count; big.appendChild(el('small', null, Math.ceil(d.left) + 's left · tap on every change')); }
    else if (d && d.done) { big.textContent = d.count; big.appendChild(el('small', null, 'changes / min · best ' + best + (d.count >= best && d.count > 0 ? ' 🎉 new best' : ''))); }
    else { big.textContent = '▶'; big.appendChild(el('small', null, 'Start · 60 seconds · best ' + best)); }
    big.addEventListener('click', () => { if (!L.drill || !L.drill.running) startDrill(); else { L.drill.count++; haptic(); big.firstChild.textContent = L.drill.count; } });
    card.appendChild(big);
    const tr = el('div', 'row'); tr.style.marginTop = '10px';
    const tg = el('button', 'tog' + (L.drillClick ? ' on' : ''), 'Click ' + L.drillTempo + ' BPM'); tg.addEventListener('click', () => { L.drillClick = !L.drillClick; App.renderLearn(); });
    const rg = el('input'); rg.type = 'range'; rg.min = 40; rg.max = 140; rg.value = L.drillTempo; rg.addEventListener('input', () => { L.drillTempo = +rg.value; tg.textContent = 'Click ' + L.drillTempo + ' BPM'; });
    tr.append(tg, rg); card.appendChild(tr);
    if (d && d.running) card.appendChild(btn('Stop', 'full', () => { stopDrill(); App.renderLearn(); })).style.marginTop = '8px';
    box.appendChild(card);
    // speed trainer
    box.appendChild(el('div', 'h')).appendChild(el('h2', null, 'Speed trainer'));
    const sp = el('div', 'card ctrl'), s = L.speed;
    const sec = S.song.sections[S.sec];
    sp.appendChild(el('p', 'small muted', 'Loops “' + (S.song.title || 'current song') + '” ▸ ' + (sec ? sec.type : '—') + ' and raises the tempo as you go.')).style.margin = '0';
    const num = (label, k, min, max) => { const r = el('div', 'row'); const i = el('input'); i.type = 'range'; i.min = min; i.max = max; i.value = s[k]; const v = el('b', null, String(s[k])); v.style.cssText = 'width:36px;text-align:right;color:var(--gold2)'; i.addEventListener('input', () => { s[k] = +i.value; v.textContent = i.value; }); r.append(el('span', 'small muted', label), i, v); r.firstChild.style.width = '96px'; return r; };
    sp.append(num('Start BPM', 'from', 40, 160), num('Target BPM', 'to', 40, 200), num('+BPM step', 'step', 1, 10), num('Every N loops', 'every', 1, 8));
    if (s.on) sp.appendChild(el('div', 'big', String(S.song.tempo))).appendChild(el('small', null, 'BPM now · target ' + s.to));
    sp.appendChild(btn(s.on ? '■ Stop speed trainer' : '▶ Start speed trainer', s.on ? '' : 'gold', () => { if (s.on) stopSpeed(); else startSpeed(); App.renderLearn(); }));
    box.appendChild(sp);
    // stats
    box.appendChild(el('div', 'h')).appendChild(el('h2', null, 'Practice log'));
    const st = el('div', 'card');
    const today = new Date().toISOString().slice(0, 10), mins = Math.round((P.practice[today] || 0) / 60);
    st.appendChild(el('div', 'score')).innerHTML = '<span>Today <b>' + mins + ' min</b></span><span>This week <b>' + Math.round(last7().reduce((a, x) => a + x.s, 0) / 60) + ' min</b></span><span>Drills <b>' + Object.keys(P.drills).length + '</b></span>';
    const bars = el('div', 'bars7'), mx = Math.max(60, ...last7().map(x => x.s));
    last7().forEach(x => { const c = el('div'); const i = el('i'); i.style.height = Math.max(2, 70 * x.s / mx) + 'px'; c.append(i, document.createTextNode(x.label)); bars.appendChild(c); });
    st.appendChild(bars);
    st.appendChild(el('p', 'tiny muted', 'Time counts while music plays or a drill runs.')).style.margin = '8px 0 0';
    box.appendChild(st);
  }
  function last7() { const out = []; for (let k = 6; k >= 0; k--) { const d = new Date(); d.setDate(d.getDate() - k); const key = d.toISOString().slice(0, 10); out.push({ s: P.practice[key] || 0, label: 'SMTWTFS'[d.getDay()] }); } return out; }
  function startDrill() {
    stopDrill(); A.ensure();
    L.drill = { running: true, count: 0, left: 60, start: performance.now() };
    const tick = () => {
      const d = L.drill; if (!d || !d.running) return;
      d.left = 60 - (performance.now() - d.start) / 1000;
      if (d.left <= 0) { d.running = false; d.done = true; const k = drillKey(L.pairA, L.pairB); if (d.count > (P.drills[k] || 0)) { P.drills[k] = d.count; App.saveProgress(); } A.click(A.now(), true); haptic('heavy'); if (S.view === 'learn' && S.learn === 'train') App.renderLearn(); return; }
      const big = document.querySelector('#learnBody .big small'); if (big) big.textContent = Math.ceil(d.left) + 's left · tap on every change';
      d.raf = setTimeout(tick, 200);
    };
    tick();
    if (L.drillClick) { let n = 0; L.clickT = setInterval(() => { A.click(A.now(), n++ % 4 === 0); }, 60000 / L.drillTempo); }
    App.renderLearn();
  }
  function stopDrill() { if (L.drill) { clearTimeout(L.drill.raf); L.drill.running = false; } clearInterval(L.clickT); }
  function startSpeed() {
    const s = L.speed; s.on = true; S.song.tempo = s.from; App.save();
    App.setSpeedHook(k => {
      if (k % s.every === 0 && S.song.tempo < s.to) { S.song.tempo = Math.min(s.to, S.song.tempo + s.step); A.setTempo(S.song.tempo); App.save(); toast('Tempo ' + S.song.tempo + ' BPM'); if (S.view === 'learn' && S.learn === 'train') App.renderLearn(); }
    });
    App.playLoop();
  }
  function stopSpeed() { L.speed.on = false; App.setSpeedHook(null); App.stopAll(); }

  /* ---------------- ear training ---------------- */
  const EASY_IV = [3, 4, 5, 7, 12], ALL_IV = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const EASY_Q = ['', 'm', '7', 'maj7'], HARD_Q = ['', 'm', '7', 'maj7', 'm7', 'dim', 'aug', 'sus4', 'm7b5', '6'];
  function newEar() {
    const e = L.ear; e.answered = false; e.picked = null;
    if (e.mode === 'interval') { const iv = pick(e.hard ? ALL_IV : EASY_IV), r = 52 + rand(14); e.cur = { iv, r, answer: T.INTERVALS[iv], options: (e.hard ? ALL_IV : EASY_IV).map(i => T.INTERVALS[i]) }; }
    else if (e.mode === 'chord') { const q = pick(e.hard ? HARD_Q : EASY_Q), r = 48 + rand(10); e.cur = { q, r, answer: T.QUAL[q].label, options: (e.hard ? HARD_Q : EASY_Q).map(x => T.QUAL[x].label) }; }
    else {
      const pool = D.LIB.filter(l => l.roman.length === 4 && !l.roman.includes('i(maj7)'));
      const ans = pick(pool), opts = shuffle([ans, ...shuffle(pool.filter(l => l.id !== ans.id)).slice(0, 3)]);
      e.cur = { lib: ans, answer: ans.name, options: opts.map(l => l.name) };
    }
  }
  function playEar() {
    const e = L.ear, c = e.cur; if (!c) return; A.ensure();
    if (e.mode === 'interval') A.playNotes([c.r, c.r + c.iv], 0.7, 0.9);
    else if (e.mode === 'chord') { const ms = T.QUAL[c.q].iv.map(i => c.r + i); A.playNotes(ms, 0, 1.6); setTimeout(() => A.playNotes(ms, 0.22, 0.6), 1500); }
    else {
      const minor = c.lib.mode === 'minor', key = { tonic: minor ? 9 : 0, minor };
      const prog = c.lib.roman.map(r => Object.assign(T.parseRoman(r), { d: 1 }));
      const song = Object.assign({}, S.song, { key, groove: 'pad', voice: 'off', drums: false, metro: false, swing: false, sections: [{ type: 'Verse', prog, shift: 0, loops: 1, intensity: 100, mel: false }] });
      App.playRender(C.render(song, { section: 0, offset: 0 }), 'preview', false);
    }
  }
  function renderEar(box) {
    const e = L.ear;
    seg(box.appendChild(el('div', 'seg')), [['interval', 'Intervals'], ['chord', 'Chord quality'], ['prog', 'Progressions']], e.mode, id => { e.mode = id; e.cur = null; App.renderLearn(); });
    const tg = el('button', 'tog' + (e.hard ? ' on' : ''), e.hard ? 'Hard mode' : 'Easy mode'); tg.style.marginTop = '8px';
    tg.addEventListener('click', () => { e.hard = !e.hard; e.cur = null; App.renderLearn(); });
    if (e.mode !== 'prog') box.appendChild(tg);
    if (!e.cur) newEar();
    const sc = el('div', 'score'); sc.style.marginTop = '10px'; sc.innerHTML = '<span>Score <b>' + e.score + '/' + e.total + '</b></span><span>Streak <b>' + e.streak + '</b></span><span>Best streak <b>' + (P.ear.best || 0) + '</b></span>';
    box.appendChild(sc);
    const big = el('button', 'big'); big.style.marginTop = '10px'; big.textContent = '▶'; big.appendChild(el('small', null, e.mode === 'interval' ? 'Play the interval' : e.mode === 'chord' ? 'Play the chord' : 'Play the progression'));
    big.addEventListener('click', playEar); box.appendChild(big);
    const g = el('div', 'answers');
    e.cur.options.forEach(o => {
      const b = el('button', 'btn' + (e.answered && o === e.cur.answer ? ' right' : e.answered && o === e.picked ? ' wrong' : ''), o);
      b.addEventListener('click', () => {
        if (e.answered) return; e.answered = true; e.picked = o; e.total++;
        if (o === e.cur.answer) { e.score++; e.streak++; haptic(); if (e.streak > (P.ear.best || 0)) { P.ear.best = e.streak; App.saveProgress(); } } else { e.streak = 0; haptic('heavy'); }
        App.renderLearn();
      });
      g.appendChild(b);
    });
    box.appendChild(g);
    if (e.answered) {
      if (e.mode === 'prog') box.appendChild(el('p', 'small muted', e.cur.lib.roman.join(' – ') + ' · ' + e.cur.lib.desc));
      box.appendChild(btn('Next ›', 'gold full', () => { newEar(); App.renderLearn(); playEar(); })).style.marginTop = '10px';
    }
  }

  /* ---------------- quiz ---------------- */
  function theoryQ() {
    const tonic = rand(12), key = { tonic, minor: false }, fl = T.useFlats(key), kn = T.noteName(tonic, fl);
    const dia = T.palette(key).diatonic;
    const types = [
      () => { const i = rand(7), c = dia[i]; return { q: 'In ' + kn + ' major, which chord is the ' + T.roman(c) + '?', a: T.symOf(c, key), w: shuffle(dia.filter((_, k) => k !== i)).slice(0, 3).map(x => T.symOf(x, key)), why: 'Count up the ' + kn + ' major scale: the ' + T.roman(c) + ' chord is built on degree ' + (i + 1) + '.' }; },
      () => ({ q: 'What is the relative minor of ' + kn + ' major?', a: T.noteName(tonic + 9, fl) + 'm', w: [T.noteName(tonic + 4, fl) + 'm', T.noteName(tonic + 2, fl) + 'm', T.noteName(tonic + 5, fl) + 'm'], why: 'The relative minor starts on the 6th degree — three semitones below the major tonic.' }),
      () => ({ q: 'Which chord is the V7 (dominant seventh) in ' + kn + ' major?', a: T.noteName(tonic + 7, fl) + '7', w: [T.noteName(tonic + 5, fl) + '7', T.noteName(tonic + 2, fl) + '7', T.noteName(tonic + 7, fl) + 'maj7'], why: 'V7 is built on the 5th degree with a flat 7th — the strongest pull back home.' }),
      () => { const qs = ['', 'm', '7', 'maj7', 'm7']; const q = pick(qs), r = rand(12), sym = T.noteName(r) + q; const notes = x => T.QUAL[x].iv.map(i => T.noteName(r + i)).join(' '); return { q: 'Which notes spell ' + sym + '?', a: notes(q), w: shuffle(qs.filter(x => x !== q)).slice(0, 3).map(notes), why: T.QUAL[q].label + ' = intervals ' + T.QUAL[q].iv.join('-') + ' semitones above the root.' }; },
      () => { const iv = 1 + rand(11); return { q: 'How many semitones are in a ' + T.INTERVALS[iv].toLowerCase() + '?', a: String(iv), w: shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].filter(x => x !== iv)).slice(0, 3).map(String), why: 'Each fret on a guitar is one semitone.' }; },
      () => { const l = pick(D.LIB); return { q: 'Which progression is ' + l.roman.join(' – ') + '?', a: l.name, w: shuffle(D.LIB.filter(x => x.id !== l.id)).slice(0, 3).map(x => x.name), why: l.desc }; }
    ];
    return pick(types)();
  }
  function triviaQ(t) {
    let w;
    if (t.t === 'artist') w = shuffle(D.TRIVIA_ARTISTS.filter(a => a !== t.a)).slice(0, 3);
    else if (t.t === 'year') { const y = +t.a; w = shuffle([y - 3, y - 2, y - 1, y + 1, y + 2, y + 4]).slice(0, 3).map(String); }
    else w = t.w;
    return { q: t.q, a: t.a, w, why: '' };
  }
  function newQuiz(mode) {
    const qs = [];
    const triv = shuffle(D.TRIVIA);
    for (let i = 0; i < 10; i++) {
      const useTrivia = mode === 'history' || (mode === 'mix' && i % 2 === 1);
      const q = useTrivia ? triviaQ(triv[i % triv.length]) : theoryQ();
      q.opts = shuffle([q.a, ...q.w]);
      qs.push(q);
    }
    L.quiz = { mode, qs, i: 0, score: 0, answered: false };
  }
  function renderQuiz(box) {
    const mode = L.quiz ? L.quiz.mode : (L.quizMode || 'mix');
    seg(box.appendChild(el('div', 'seg')), [['mix', 'Mix'], ['theory', 'Theory'], ['history', 'Music history']], mode, id => { L.quizMode = id; newQuiz(id); App.renderLearn(); });
    if (!L.quiz) newQuiz(mode);
    const z = L.quiz;
    if (z.i >= z.qs.length) {
      const pct = z.score * 10; const k = 'best_' + z.mode; if (pct > (P.quiz[k] || 0)) { P.quiz[k] = pct; App.saveProgress(); }
      const big = el('div', 'big', z.score + ' / 10'); big.style.marginTop = '10px'; big.appendChild(el('small', null, 'Best ' + (P.quiz[k] || 0) + '% · ' + (pct >= 80 ? 'Superb ear and memory!' : pct >= 50 ? 'Solid — go again!' : 'Every round teaches something.')));
      box.appendChild(big);
      box.appendChild(btn('New round', 'gold full', () => { newQuiz(z.mode); App.renderLearn(); })).style.marginTop = '10px';
      return;
    }
    const q = z.qs[z.i];
    const sc = el('div', 'score'); sc.style.marginTop = '10px'; sc.innerHTML = '<span>Question <b>' + (z.i + 1) + '</b>/10</span><span>Score <b>' + z.score + '</b></span><span>Best <b>' + (P.quiz['best_' + z.mode] || 0) + '%</b></span>';
    box.appendChild(sc);
    box.appendChild(el('p', 'qcard', q.q));
    const g = el('div', 'answers');
    q.opts.forEach(o => {
      const b = el('button', 'btn' + (z.answered && o === q.a ? ' right' : z.answered && o === z.picked ? ' wrong' : ''), o);
      b.addEventListener('click', () => { if (z.answered) return; z.answered = true; z.picked = o; if (o === q.a) { z.score++; haptic(); } else haptic('heavy'); App.renderLearn(); });
      g.appendChild(b);
    });
    box.appendChild(g);
    if (z.answered) {
      if (q.why) box.appendChild(el('p', 'tip', q.why));
      box.appendChild(btn(z.i === 9 ? 'See score' : 'Next ›', 'gold full', () => { z.i++; z.answered = false; z.picked = null; App.renderLearn(); })).style.marginTop = '10px';
    }
  }

  /* ---------------- guide ---------------- */
  function renderGuide(box) {
    const wrap = el('div', 'guide');
    wrap.appendChild(el('p', 'small muted', 'The ultimate pocket guide to composing romance songs — from the first sentence to a finished song, plus the craft of lyrics.')).style.marginTop = '0';
    D.GUIDE.forEach((ch, i) => {
      const d = el('details'); if (i === 0) d.open = true;
      d.appendChild(el('summary', null, ch.title));
      ch.body.forEach(p => d.appendChild(el('p', null, p)));
      wrap.appendChild(d);
    });
    const ly = el('details'); ly.id = 'lyricTips';
    ly.appendChild(el('summary', null, '✍ Writing lyrics: 13 craft tips'));
    D.LYRIC_TIPS.forEach(t => { const p = el('p'); p.appendChild(el('b', null, t.title + '. ')); p.appendChild(document.createTextNode(t.body)); ly.appendChild(p); });
    wrap.appendChild(ly);
    const st = el('details'); st.appendChild(el('summary', null, '🧭 What each section should do'));
    Object.entries(D.SECTION_TIPS).forEach(([k, v]) => { const p = el('p'); p.appendChild(el('b', null, k + ': ')); p.appendChild(document.createTextNode(v)); st.appendChild(p); });
    wrap.appendChild(st);
    const ex = el('details'); ex.appendChild(el('summary', null, '🏋 Daily songwriter workout (20 min)'));
    ['5 min — Object writing: one object, all senses, no stopping.', '5 min — Quick Sketch in Library: accept the first idea, write a chorus title.', '5 min — Melody: loop the chorus in Studio, hum over it, record a voice memo.', '5 min — Edit yesterday’s sketch: cut one filler line, strengthen one image.']
      .forEach(t => ex.appendChild(el('p', null, t)));
    wrap.appendChild(ex);
    box.appendChild(wrap);
  }
})(typeof self !== 'undefined' ? self : this);
