// Headless smoke test for www/index.html: data integrity, every style/tuning/twist,
// all grooves/voices, song playback, write/songs features and screenshots.
const { chromium } = require('playwright');
const path = require('path');
const shot = name => path.resolve(__dirname, '../screenshots/' + name + '.png');

(async () => {
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '../www/index.html'));

  const r = await page.evaluate(async () => {
    const V = window.__VS, out = { issues: [] };
    const wait = ms => new Promise(res => setTimeout(res, ms));
    const segClick = (id, txt) => { const b = [...document.querySelectorAll('#' + id + ' button')].find(x => x.textContent === txt); if (!b) throw new Error(id + ':' + txt); b.click(); };
    out.styles = V.STYLES.length;
    out.perCat = V.CATS.map(c => c.id + ':' + V.STYLES.filter(s => s.cat === c.id).length).join(' ');
    const ids = new Set();
    for (const p of V.STYLES) {
      if (ids.has(p.id)) out.issues.push('dup ' + p.id); ids.add(p.id);
      if (p.bpm < 55 || p.bpm > 130) out.issues.push('bpm ' + p.id);
      for (const c of p.chords) {
        if (c.frets.length !== 6 || c.piano.some(m => m < 48 || m > 76) || c.harmony.length !== 2 || c.choir.length !== 3 || c.choir.some(m => m == null))
          out.issues.push(p.artist + ' ' + c.name);
      }
      for (const tw of ['orig', 'heart', 'dorian']) {
        const pr = (V.S.song.styleId = p.id, V.buildProg(tw));
        if (pr.chords.length !== 4 || pr.chords.some(c => c.choir.some(m => m == null))) out.issues.push('twist ' + p.id + ' ' + tw);
      }
    }
    // Styles view: filters
    document.querySelector('#tabs [data-v="styles"]').click();
    out.allCards = document.querySelectorAll('.sty').length;
    const q = document.getElementById('q'); q.value = 'gothic'; q.dispatchEvent(new Event('input'));
    out.searchGothic = [...document.querySelectorAll('.sty b')].map(b => b.textContent).join(',');
    q.value = ''; q.dispatchEvent(new Event('input'));
    [...document.querySelectorAll('#tempoChips .chip')].find(b => b.textContent.startsWith('Slow')).click();
    out.slowCount = document.querySelectorAll('.sty').length;
    [...document.querySelectorAll('#tempoChips .chip')].find(b => b.textContent.startsWith('Any')).click();
    document.querySelector('.sty .fav').click();
    [...document.querySelectorAll('#catChips .chip')].find(b => b.textContent.includes('Favorites')).click();
    out.favCount = document.querySelectorAll('.sty').length;
    [...document.querySelectorAll('#catChips .chip')].find(b => b.textContent === 'All').click();

    // Pick Elvis, exercise studio
    [...document.querySelectorAll('.sty')].find(b => b.textContent.includes('Elvis')).click();
    out.view = document.querySelector('.view.on').id;
    const tsel = document.getElementById('tuningSel');
    for (const tu of ['std', 'dstd', 'dropd', 'dropc']) {
      tsel.value = tu; tsel.dispatchEvent(new Event('change'));
      for (const tw of ['Original', 'IV→iv Heartbreak', 'Dorian IV Lift']) {
        segClick('twistSeg', tw);
        for (const inst of ['Chord', 'Tab', 'Piano', 'Voices', 'Tuner']) {
          segClick('instSeg', inst);
          if (!document.getElementById('instPanel').children.length) out.issues.push('inst ' + inst);
        }
      }
    }
    tsel.value = 'dstd'; tsel.dispatchEvent(new Event('change')); segClick('twistSeg', 'Original');
    out.dstd = document.getElementById('keyPill').textContent + ' | ' + [...document.querySelectorAll('#chords .ch b')].map(e => e.textContent).join(' ');
    document.getElementById('capoUp').click(); document.getElementById('capoUp').click();
    out.capo2 = document.getElementById('keyPill').textContent + ' | ' + [...document.querySelectorAll('#chords .ch b')].map(e => e.textContent).join(' ');
    document.getElementById('capoDn').click(); document.getElementById('capoDn').click();
    tsel.value = 'std'; tsel.dispatchEvent(new Event('change'));
    segClick('instSeg', 'Piano');
    out.gold = document.querySelectorAll('#instPanel .ct').length; out.teal = document.querySelectorAll('#instPanel .vc').length;
    for (const g of ['Arpeggio + Bass', 'Lush Pad', '6/8 Pulse']) for (const v of ['Off', 'Lead', 'Harmony', 'Choir']) {
      segClick('grooveSeg', g); segClick('voiceSeg', v);
      V.Engine.start('loop'); await wait(120); V.Engine.stop();
    }
    document.getElementById('countTog').click(); document.getElementById('metroTog').click();
    V.Engine.start('loop'); await wait(200); V.Engine.stop();
    document.getElementById('countTog').click(); document.getElementById('metroTog').click();
    document.getElementById('tapBtn').click(); await wait(500); document.getElementById('tapBtn').click();
    out.tapTempo = V.S.song.tempo;
    document.getElementById('cueBtn').click();
    segClick('instSeg', 'Chord');
    // Write view
    document.querySelector('#tabs [data-v="write"]').click();
    document.getElementById('songTitle').value = 'Midnight Rose'; document.getElementById('songTitle').dispatchEvent(new Event('input'));
    document.querySelector('.sec .nm').click();
    const lyr = document.querySelector('.sec.open textarea.lyr'); lyr.focus(); lyr.value = 'Under the jukebox light'; lyr.dispatchEvent(new Event('input'));
    document.querySelector('#rhymeWords button').click();
    out.lyric = V.S.song.sections[0].lyrics;
    document.getElementById('addBtn').click();
    out.sections = V.S.song.sections.length;
    V.S.song.tempo = 130;
    V.Engine.start('song'); await wait(900);
    out.songPlaying = V.Engine.playing && V.Engine.mode === 'song';
    V.Engine.stop();
    document.getElementById('perfBtn').click();
    out.perf = document.getElementById('perf').classList.contains('on') && document.getElementById('perfBody').textContent.includes('Under the jukebox');
    out.backHandled = V.handleBack() && !document.getElementById('perf').classList.contains('on');
    // Songs view
    document.querySelector('#tabs [data-v="songs"]').click();
    document.getElementById('newSong').click();
    out.songCount = V.songs.length;
    out.sheet = V.songSheet();
    return out;
  });
  const { sheet, ...summary } = r;
  console.log(JSON.stringify(summary, null, 1));
  console.log(sheet.split('\n').slice(0, 40).join('\n'));

  // Screenshots of each tab with a realistic state
  await page.evaluate(() => { const V = window.__VS; V.S.song.tempo = 108; });
  for (const v of ['styles', 'studio', 'write', 'songs']) {
    await page.evaluate(v => document.querySelector('#tabs [data-v="' + v + '"]').click(), v);
    await page.waitForTimeout(250);
    await page.screenshot({ path: shot(v) });
  }
  await browser.close();
  const fail = errors.length || r.issues.length || r.styles < 24 || !r.songPlaying || !r.perf || !r.backHandled || r.favCount !== 1;
  if (fail) { console.error('FAIL', errors, r.issues); process.exit(1); }
  console.log('SMOKE TEST PASSED');
})();
