// Unit tests for theory, composer, exporters and content data. Run: node tests/unit.test.cjs
const assert = require('assert');
const VT = require('../www/js/theory.js');
const VD = require('../www/js/data.js');
const VC = require('../www/js/composer.js');
const VX = require('../www/js/export.js');
let n = 0; const ok = (name, fn) => { fn(); n++; };
const C = { tonic: 0, minor: false }, Am = { tonic: 9, minor: true };

ok('roman parse/spell', () => {
  const s = r => VT.symOf(VT.parseRoman(r), C);
  assert.deepStrictEqual(['I','V/3','bVII','iiø7','vii°','iv6','I/5','V7','IVmaj7'].map(s), ['C','G/B','Bb','Dm7b5','Bdim','Fm6','C/G','G7','Fmaj7']);
  assert.strictEqual(VT.symOf(VT.parseRoman('bVI'), Am), 'F');
  assert.strictEqual(VT.roman(VT.itemFromSym('A/C#', 2)), 'V/3');
});
ok('shapes match chord tones', () => {
  const open = [40,45,50,55,59,64];
  for (const [sym, frets] of Object.entries(VD.SHAPES)) {
    const p = VT.parseSym(sym); assert(p, 'parse ' + sym);
    const pcs = VT.chordPcs({ r: 0, q: p.q, b: null }, p.pc);
    const notes = frets.map((f, i) => f < 0 ? null : (open[i] + f) % 12).filter(x => x !== null);
    notes.forEach(x => assert(pcs.includes(x) || (p.bass !== null && x === p.bass), sym + ' has wrong note'));
    const bassNote = frets.map((f, i) => f < 0 ? null : open[i] + f).filter(x => x !== null)[0] % 12;
    if (p.bass !== null) assert.strictEqual(bassNote, p.bass, sym + ' bass');
  }
});
ok('voicing generator covers every quality in 12 keys', () => {
  for (const q of VT.QUAL_ORDER) for (let pc = 0; pc < 12; pc++) {
    const v = VT.voicings({ r: pc, q, b: null }, 0, 'guitar', 4);
    assert(v.length >= 1, 'no voicing for ' + VT.noteName(pc) + q);
    const pcs = VT.chordPcs({ r: pc, q, b: null }, 0);
    v[0].forEach((f, i) => { if (f >= 0) assert(pcs.includes(([40,45,50,55,59,64][i] + f) % 12)); });
  }
  assert(VT.voicings(VT.itemFromSym('C', 0), 0, 'ukulele', 3).length > 0);
});
ok('all styles, library, levels parse', () => {
  assert.strictEqual(VD.STYLES.length, 26);
  VD.STYLES.forEach(s => s.chords.forEach(([sym, rn]) => {
    const it = VT.itemFromSym(sym, VT.PC[s.key]); assert(it, s.id + ' ' + sym);
    assert.strictEqual(VT.roman(it), rn, s.id + ' roman ' + sym + ' -> ' + VT.roman(it));
  }));
  VD.LIB.forEach(l => l.roman.forEach(r => assert(VT.parseRoman(r) || r === 'i(maj7)', l.id + ' ' + r)));
  VD.LEVELS.forEach(l => { l.chords.forEach(c => assert(VT.parseSym(c), 'level chord ' + c)); l.songs.forEach(s => assert(s.lib ? VD.LIB.find(x => x.id === s.lib) : s.roman, 'level song ' + s.name)); });
  VD.TRIVIA.forEach(t => assert(t.t !== 'text' || (t.w && t.w.length === 3 && !t.w.includes(t.a)), t.q));
});
ok('melody stays in range and on chord tones at bar starts', () => {
  const prog = ['I','V','vi','IV'].map(VT.parseRoman);
  for (let seed = 1; seed < 40; seed++) {
    const mel = VT.melody(prog, C, seed, 4);
    assert(mel.length >= 6);
    mel.forEach(n2 => { assert(n2.m >= 62 && n2.m <= 76); assert(n2.t >= 0 && n2.t < 16); });
    mel.filter(n2 => n2.t % 4 === 0).forEach(n2 => { const c = prog[Math.floor(n2.t / 4)]; assert(VT.chordPcs(c, 0).includes(n2.m % 12), 'seed ' + seed); });
  }
});
ok('lyrics helpers', () => {
  assert.strictEqual(VT.lineSyllables('Under the jukebox light tonight'), 9);
  assert.strictEqual(VT.rhymeScheme(['I saw your face tonight', 'under the neon light', 'you said goodbye', 'and I start to cry']).join(''), 'AABB');
});
function song(groove, extra) {
  const base = ['I','V','vi','IV'].map(VT.parseRoman);
  const sections = Object.values(VD.FORMS.pop.secs).map(([type, gen, loops]) => { const g = VC.generate(gen, base, C); return { type, prog: g.prog, shift: g.shift, loops, intensity: VD.SEC_DEF[type][0], mel: type !== 'Intro' && type !== 'Outro', melSeed: 5 }; });
  return Object.assign({ key: C, sections, groove, swing: false, drumStyle: 'ballad', drums: true, voice: 'choir', metro: true, tempo: 90 }, extra || {});
}
ok('composer renders every groove', () => {
  for (const g of ['arp','strum','pad','68','boom','shuffle']) {
    const r = VC.render(song(g), { offset: 0, countIn: true });
    assert(r.total > 100, g);
    const kinds = new Set(r.events.map(e => e.k));
    ['seg','bass','kick','voice','click'].forEach(k => assert(kinds.has(k), g + ' missing ' + k));
    r.events.forEach(e => { assert(Number.isFinite(e.t) && e.t >= 0 && e.t <= r.total + 1, g + ' time'); if (e.m !== undefined) assert(e.m > 20 && e.m < 110, g + ' pitch ' + e.m); });
  }
  const loop = VC.render(song('arp'), { section: 1 });
  assert.strictEqual(loop.total, 16);
  const sw = VC.render(song('arp', { swing: true }), { section: 1 });
  assert(sw.events.some(e => Math.abs((e.t % 1) - 2 / 3) < 1e-6), 'swing offbeats');
});
ok('section generators and twists', () => {
  const base = ['I','V','vi','IV'].map(VT.parseRoman);
  assert.strictEqual(VC.generate('climax', base, C).shift, 1);
  assert.strictEqual(VC.generate('blues', base, C).prog.length, 12);
  assert.strictEqual(VT.symOf(VC.twist(base, C, 'heart')[3], C), 'Fm');
  assert(VC.twist(base, C, 'secondary').length > 4);
});
ok('MIDI file is well-formed', () => {
  const r = VC.render(song('strum'), {});
  const bytes = VX.midi(r.events, { tempo: 96, title: 'Test', bpb: r.bpb });
  assert.strictEqual(String.fromCharCode(...bytes.slice(0, 4)), 'MThd');
  const ntrk = (bytes[10] << 8) | bytes[11];
  let p = 14, found = 0;
  while (p < bytes.length) { assert.strictEqual(String.fromCharCode(...bytes.slice(p, p + 4)), 'MTrk'); const len = (bytes[p+4] << 24) | (bytes[p+5] << 16) | (bytes[p+6] << 8) | bytes[p+7]; p += 8 + len; found++; }
  assert.strictEqual(p, bytes.length); assert.strictEqual(found, ntrk); assert(ntrk >= 5);
});
ok('ChordPro export', () => {
  const t = VX.chordpro({ title: 'X', key: 'C', tempo: 90, capo: 2, sections: [{ type: 'Chorus', chords: ['C','G'], loops: 2, lyrics: 'la la', notes: 'big' }] });
  assert(t.includes('{start_of_chorus: label="Chorus"}') && t.includes('[C] [G]') && t.includes('{capo: 2}'));
});
console.log('UNIT TESTS PASSED: ' + n);
