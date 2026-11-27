/* Velvet & Strings — exporters: Standard MIDI File (type 1) from composer events, and ChordPro text. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./theory.js'));
  else root.VX = factory(root.VT);
})(typeof self !== 'undefined' ? self : this, function (VT) {
  'use strict';
  const PPQ = 480;
  const vlq = n => { const out = [n & 0x7f]; while ((n >>= 7)) out.unshift((n & 0x7f) | 0x80); return out; };
  const str = s => Array.from(unescape(encodeURIComponent(s))).map(ch => ch.charCodeAt(0));
  const u32 = n => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
  const u16 = n => [(n >>> 8) & 255, n & 255];

  function track(name, notes, channel, program) {
    // notes: [{t (beats), d (beats), m, v (0..1)}]
    const ev = [];
    notes.forEach(n => {
      const on = Math.max(0, Math.round(n.t * PPQ)), off = Math.max(on + 1, Math.round((n.t + Math.max(0.05, n.d)) * PPQ));
      const vel = Math.max(1, Math.min(127, Math.round((n.v || 0.8) * 100)));
      const m = Math.max(0, Math.min(127, Math.round(n.m)));
      ev.push({ tick: on, data: [0x90 | channel, m, vel], ord: 1 });
      ev.push({ tick: off, data: [0x80 | channel, m, 0], ord: 0 });
    });
    ev.sort((a, b) => a.tick - b.tick || a.ord - b.ord);
    const bytes = [0x00, 0xff, 0x03, ...vlq(str(name).length), ...str(name)];
    if (program !== null && program !== undefined) bytes.push(0x00, 0xc0 | channel, program);
    let last = 0;
    ev.forEach(e => { bytes.push(...vlq(e.tick - last), ...e.data); last = e.tick; });
    bytes.push(0x00, 0xff, 0x2f, 0x00);
    return [0x4d, 0x54, 0x72, 0x6b, ...u32(bytes.length), ...bytes];
  }

  /* events from VC.render; returns Uint8Array */
  function midi(events, opts) {
    const tempo = opts.tempo || 90, title = opts.title || 'Velvet & Strings';
    const bpb = opts.bpb || 4;
    const us = Math.round(60000000 / tempo);
    const meta = [0x00, 0xff, 0x03, ...vlq(str(title).length), ...str(title),
      0x00, 0xff, 0x51, 0x03, (us >> 16) & 255, (us >> 8) & 255, us & 255,
      0x00, 0xff, 0x58, 0x04, bpb === 3 ? 6 : 4, bpb === 3 ? 3 : 2, 24, 8,
      0x00, 0xff, 0x2f, 0x00];
    const tracks = [[0x4d, 0x54, 0x72, 0x6b, ...u32(meta.length), ...meta]];
    const pick = (pred, map) => { const out = []; events.forEach(e => { if (pred(e)) map(e).forEach(n => out.push(n)); }); return out; };
    const guitar = pick(e => e.k === 'pluck' || e.k === 'strum' || e.k === 'keys', e => e.k === 'strum' ? e.ms.map((m, i) => ({ t: e.t + i * 0.03, d: e.d, m, v: e.v })) : [{ t: e.t, d: e.d, m: e.m, v: e.v }]);
    const pad = pick(e => e.k === 'pad', e => e.ms.map(m => ({ t: e.t, d: e.d, m, v: e.v * 0.7 })));
    const bass = pick(e => e.k === 'bass', e => [{ t: e.t, d: e.d, m: e.m, v: e.v }]);
    const lead = pick(e => e.k === 'voice' && e.part === 0, e => [{ t: e.t, d: e.d, m: e.m, v: e.v }]);
    const harm = pick(e => e.k === 'voice' && e.part > 0, e => [{ t: e.t, d: e.d, m: e.m, v: e.v }]);
    const solo = pick(e => e.k === 'lead', e => [{ t: e.t, d: e.d, m: e.m, v: e.v }]);
    const drums = pick(e => e.k === 'kick' || e.k === 'snare' || e.k === 'hat', e => [{ t: e.t, d: 0.1, m: e.k === 'kick' ? 36 : e.k === 'snare' ? (e.brush ? 40 : 38) : 42, v: Math.min(1, e.v) }]);
    if (guitar.length) tracks.push(track('Guitar / Keys', guitar, 0, 25));
    if (pad.length) tracks.push(track('Pad', pad, 1, 89));
    if (bass.length) tracks.push(track('Bass', bass, 2, 33));
    if (lead.length) tracks.push(track('Lead melody', lead, 3, 53));
    if (harm.length) tracks.push(track('Harmony / Choir', harm, 4, 52));
    if (solo.length) tracks.push(track('Solo guitar', solo, 5, 27));
    if (drums.length) tracks.push(track('Drums', drums, 9, null));
    const header = [0x4d, 0x54, 0x68, 0x64, ...u32(6), ...u16(1), ...u16(tracks.length), ...u16(PPQ)];
    const all = header.concat(...tracks);
    return new Uint8Array(all);
  }

  /* ChordPro (https://www.chordpro.org/chordpro/) — chord names already resolved by the caller */
  function chordpro(song) {
    const L = [];
    L.push('{title: ' + (song.title || 'Untitled romance') + '}');
    if (song.subtitle) L.push('{subtitle: ' + song.subtitle + '}');
    L.push('{key: ' + song.key + '}', '{tempo: ' + song.tempo + '}');
    if (song.capo) L.push('{capo: ' + song.capo + '}');
    if (song.time) L.push('{time: ' + song.time + '}');
    song.sections.forEach(s => {
      const kind = /chorus/i.test(s.type) ? 'chorus' : /bridge/i.test(s.type) ? 'bridge' : /verse|pre/i.test(s.type) ? 'verse' : null;
      L.push('');
      if (kind) L.push('{start_of_' + kind + ': label="' + s.type + '"}'); else L.push('{comment: ' + s.type + '}');
      if (s.shift) L.push('{comment: key change +' + s.shift + '}');
      const bars = s.chords.map(c => '[' + c + ']').join(' ');
      L.push(s.loops > 1 ? bars + '   (x' + s.loops + ')' : bars);
      if (s.notes) L.push('{comment_italic: ' + s.notes + '}');
      if (s.lyrics) s.lyrics.split('\n').forEach(l => L.push(l));
      if (kind) L.push('{end_of_' + kind + '}');
    });
    return L.join('\n') + '\n';
  }

  return { midi, chordpro };
});
