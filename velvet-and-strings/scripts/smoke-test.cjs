// End-to-end smoke test for Velvet & Strings 3.0 (Playwright + Chromium with a fake microphone).
// Serves www/ over HTTP, drives every tab and the main features, checks for errors and writes screenshots/.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const WWW = path.resolve(__dirname, '../www'), SHOTS = path.resolve(__dirname, '../screenshots');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };

const server = http.createServer((req, res) => {
  const p = path.join(WWW, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!p.startsWith(WWW) || !fs.existsSync(p)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});

(async () => {
  await new Promise(r => server.listen(0, r));
  const url = 'http://localhost:' + server.address().port + '/';
  fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, hasTouch: true, permissions: ['microphone'], acceptDownloads: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(url);
  await page.waitForFunction(() => window.App && document.querySelector('.view.on'));

  const r = await page.evaluate(async () => {
    const App = window.App, out = { issues: [] }, $ = id => document.getElementById(id);
    const wait = ms => new Promise(res => setTimeout(res, ms));
    const click = (sel, txt) => { const els = [...document.querySelectorAll(sel)]; const e = txt ? els.find(x => x.textContent.trim().startsWith(txt)) : els[0]; if (!e) throw new Error('missing ' + sel + ' ' + (txt || '')); e.click(); return e; };
    const tab = v => click('#tabs [data-v="' + v + '"]');
    const check = (cond, msg) => { if (!cond) out.issues.push(msg); };
    const song = () => App.S.song;

    // ---- Styles ----
    tab('styles');
    out.styles = document.querySelectorAll('.sty').length;
    click('.sty', 'Roy Orbison'); await wait(50);
    check(document.getElementById('sheet').classList.contains('on'), 'style sheet');
    click('#sheetBody .btn', 'New song in this style'); await wait(50);
    out.afterNew = { view: document.querySelector('.view.on').id, style: song().styleId, sections: song().sections.length };

    // ---- Studio: chord editing ----
    const s0 = song().sections[1];
    out.verse = s0.prog.map(c => App.T.symOf(c, song().key)).join(' ');
    click('#secChips .chip', '2 '); await wait(20);
    const chord = document.querySelectorAll('#strip .ch:not(.add)')[1];
    chord.click(); chord.click(); await wait(30);
    check(document.querySelector('#sheetBody h3'), 'chord editor opened');
    click('#sheetBody .pal button', 'Bb'); await wait(20);
    click('#sheetBody .chip', 'maj7'); await wait(20);
    click('#sheetBody .btn', 'Save'); await wait(30);
    out.edited = App.T.symOf(song().sections[1].prog[1], song().key);
    click('#undoBtn'); await wait(20);
    out.undone = App.T.symOf(song().sections[1].prog[1], song().key);
    // add chord
    click('#strip .ch.add'); await wait(20); click('#sheetBody .pal button', 'Em'); click('#sheetBody .btn', 'Add chord'); await wait(20);
    out.lenAfterAdd = song().sections[1].prog.length;
    // instruments
    for (const t of ['Chord', 'Tab', 'Piano', 'Voices', 'Tuner']) { click('#instSeg button', t); await wait(20); check($('instPanel').children.length > 0, 'inst ' + t); }
    click('#instSeg button', 'Chord'); click('#instPanel .btn', '›'); await wait(20);
    out.voicingLabel = document.querySelector('#instPanel .vnav span').textContent;
    // library + twist + key
    click('#studioActions .btn', '▤ Library'); await wait(30);
    out.libItems = document.querySelectorAll('#sheetBody .libitem').length;
    [...document.querySelectorAll('#sheetBody .libitem')].find(x => x.textContent.includes('Andalusian')).querySelector('.btn.gold').click(); await wait(30);
    out.andalusian = song().sections[1].prog.map(c => App.T.roman(c)).join(' ');
    click('#studioActions .btn', '↯ Twist'); click('#sheetBody .libitem', 'Secondary'); await wait(20);
    out.secondaryLen = song().sections[1].prog.length;
    const k0 = $('keyPill').textContent; click('#studioActions .btn', 'Key +'); out.keyChange = k0 + ' -> ' + $('keyPill').textContent; click('#studioActions .btn', 'Key −');
    // grooves & playback
    for (const g of ['Arpeggio', 'Strummed', 'Lush', '6/8', 'Boom', 'Blues']) { click('#grooveChips .chip', g); App.playLoop(); await wait(180); check(App.A.playing, 'playing ' + g); App.stopAll(); }
    click('#grooveChips .chip', 'Strummed');
    for (const d of ['Ballad', 'Four', 'Half', 'Shuffle', 'Train']) click('#drumChips .chip', d);
    for (const v of ['Off', 'Lead', 'Harmony', 'Choir']) click('#voiceSeg button', v);
    click('#countTog'); click('#metroTog'); App.playLoop(); await wait(300); App.stopAll(); click('#countTog'); click('#metroTog');
    click('#instrSeg button', 'Ukulele'); await wait(20); out.uke = document.querySelector('#instPanel svg') !== null; click('#instrSeg button', 'Guitar');
    click('#capoUp'); out.capoKey = $('keyPill').textContent; click('#capoDn');
    // tuner with fake mic
    click('#instSeg button', 'Tuner'); click('#instPanel .btn', '🎤'); await wait(1500);
    out.tuner = $('tNote') ? $('tNote').textContent : 'none';
    click('#instPanel .btn', 'Stop'); click('#instSeg button', 'Chord');

    // ---- Write ----
    tab('write');
    $('songTitle').value = 'Midnight Rose'; $('songTitle').dispatchEvent(new Event('input'));
    click('#sections .sec .nm', 'Verse'); await wait(20);
    const ta = document.querySelector('.sec.open .lyrwrap textarea');
    ta.dispatchEvent(new Event('focus')); ta.value = 'I saw your face tonight\nunder the neon light'; ta.dispatchEvent(new Event('input')); await wait(20);
    out.gutter = document.querySelector('.sec.open .gutter').textContent.replace(/\s+/g, ' ').trim();
    click('#rhymeWords button'); await wait(20);
    out.lyric = song().sections.find(x => x.lyrics).lyrics.split('\n').pop();
    click('#addBtn'); out.secCount = song().sections.length;
    click('#formBtn'); click('#sheetBody .libitem', '12-bar'); await wait(30);
    out.blues = song().sections.map(x => x.type).join(',') + ' | ' + song().sections[1].prog.length + ' bars';
    out.lyricKept = song().sections.some(x => x.lyrics.includes('neon'));
    App.playSong(); await wait(700); out.songPlay = App.A.playing && App.S.mode === 'song'; App.stopAll();
    click('#perfBtn'); out.stage = $('perf').classList.contains('on') && $('perfBody').textContent.includes('neon'); App.handleBack();

    // ---- Learn ----
    tab('learn');
    for (const t of ['Path', 'Fretboard', 'Trainer', 'Ear', 'Quiz', 'Guide']) { click('#learnTabs .chip', t); await wait(30); check($('learnBody').children.length > 0, 'learn ' + t); }
    click('#learnTabs .chip', 'Path'); click('.lvl .hd'); await wait(20);
    out.levels = document.querySelectorAll('.lvl').length;
    click('.lvl.open .task .btn', 'Load'); await wait(100);
    out.practice = song().status + ' ' + (song().tags || []).join(',') + ' playing=' + App.A.playing; App.stopAll();
    tab('learn'); click('#learnTabs .chip', 'Fretboard'); click('#learnBody .seg button', 'Scale'); await wait(20);
    out.scaleDots = document.querySelectorAll('#learnBody .neck circle[r="11"]').length;
    click('#learnBody .seg button', 'Note quiz'); await wait(20); click('.notes12 .btn'); await wait(50);
    out.fretQuiz = document.querySelector('#learnBody .score').textContent;
    click('#learnTabs .chip', 'Trainer'); await wait(20);
    click('#learnBody .big'); await wait(30); click('#learnBody .big'); click('#learnBody .big'); click('#learnBody .big');
    out.drill = document.querySelector('#learnBody .big').firstChild.textContent;
    click('#learnBody .btn', 'Stop');
    click('#learnTabs .chip', 'Ear'); click('#learnBody .big'); await wait(50); click('#learnBody .answers .btn'); await wait(20);
    out.ear = document.querySelector('#learnBody .score').textContent;
    click('#learnTabs .chip', 'Quiz'); click('#learnBody .answers .btn'); await wait(20);
    out.quiz = document.querySelector('#learnBody .score').textContent + ' | ' + document.querySelector('.qcard').textContent.slice(0, 60);
    click('#learnTabs .chip', 'Guide'); out.guide = document.querySelectorAll('.guide details').length;

    // ---- Library ----
    tab('library');
    out.goal = document.querySelector('#goalCard b').textContent;
    click('#quickBtn'); await wait(30); out.quick = song().title + ' / ' + song().sections.length + ' sections';
    tab('library'); click('#challengeBtn'); await wait(20); click('#sheetBody .btn', 'Accept'); await wait(30);
    out.challenge = (song().challenge || '').slice(0, 80);
    tab('library');
    out.songs = App.songs.length;
    // voice memo with fake mic
    click('#recBtn'); await wait(1300); click('#recBtn'); await wait(600);
    tab('library'); await wait(300);
    out.memos = document.querySelectorAll('#memoList .memo').length;
    out.sheet = App.songSheet().split('\n').slice(0, 30).join('\n');
    out.chordpro = App.chordPro().split('\n').slice(0, 12).join('\n');
    return out;
  });

  // MIDI export through the real button path (browser falls back to a download)
  const dl = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
  await page.evaluate(() => window.App.exportMidi(window.App.S.song));
  const d = await dl; let midiBytes = 0;
  if (d) { const p = await d.path(); midiBytes = fs.statSync(p).size; r.midiHeader = fs.readFileSync(p).slice(0, 4).toString(); }
  r.midiBytes = midiBytes;

  const { sheet, chordpro, ...summary } = r;
  console.log(JSON.stringify(summary, null, 1));
  console.log('--- song sheet ---\n' + sheet + '\n--- chordpro ---\n' + chordpro);

  // screenshots
  for (const v of ['styles', 'studio', 'write', 'learn', 'library']) {
    await page.evaluate(v => { window.App.closeSheet(); document.querySelector('#tabs [data-v="' + v + '"]').click(); window.scrollTo(0, 0); }, v);
    if (v === 'learn') await page.evaluate(() => { [...document.querySelectorAll('#learnTabs .chip')].find(c => c.textContent === 'Path').click(); });
    if (v === 'write') await page.evaluate(() => { const n = document.querySelectorAll('#sections .sec .nm')[1]; if (n) n.click(); });
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(SHOTS, v + '.png') });
  }
  await page.evaluate(() => { document.querySelector('#tabs [data-v="studio"]').click(); const c = document.querySelector('#strip .ch:not(.add)'); c.click(); c.click(); });
  await page.waitForTimeout(250); await page.screenshot({ path: path.join(SHOTS, 'chord-editor.png') });
  await page.evaluate(() => { window.App.closeSheet(); document.querySelector('#tabs [data-v="learn"]').click(); [...document.querySelectorAll('#learnTabs .chip')].find(c => c.textContent === 'Fretboard').click(); });
  await page.waitForTimeout(250); await page.screenshot({ path: path.join(SHOTS, 'fretboard.png') });

  // migration from 2.x storage in a fresh context
  const ctx2 = await browser.newContext();
  const p2 = await ctx2.newPage(); p2.on('pageerror', e => errors.push('migrate: ' + e.message));
  await p2.addInitScript(() => { if (!localStorage.getItem('seeded')) { localStorage.clear(); localStorage.setItem('seeded', '1'); localStorage.setItem('vs2_songs', JSON.stringify([{ id: 'old1', title: 'Old Flame', styleId: 'orbison', tuning: 'std', capo: 0, twist: 'orig', groove: 'pad', voice: 'lead', tempo: 78, updated: 1, sections: [{ type: 'Verse', loops: 2, intensity: 50, notes: 'soft', lyrics: 'old words' }, { type: 'Bridge (Twist)', loops: 1, intensity: 60, notes: '', lyrics: '' }] }])); } });
  await p2.goto(url); await p2.waitForFunction(() => window.App);
  r.migrated = await p2.evaluate(() => { const s = window.App.S.song; return s.title + ' | ' + s.styleId + ' | ' + s.sections.map(x => x.type + ':' + x.prog.map(c => window.App.T.symOf(c, s.key)).join(' ')).join(' / ') + ' | ' + s.sections[0].lyrics; });
  console.log('migrated:', r.migrated);

  await browser.close(); server.close();
  const fail = errors.length || r.issues.length || r.styles !== 26 || !r.songPlay || !r.stage || r.memos < 1 || r.midiHeader !== 'MThd' || !/Old Flame \| orbison/.test(r.migrated) || r.undone === r.edited;
  if (fail) { console.error('FAIL', errors, r.issues); process.exit(1); }
  console.log('SMOKE TEST PASSED');
})().catch(e => { console.error(e); server.close(); process.exit(1); });
