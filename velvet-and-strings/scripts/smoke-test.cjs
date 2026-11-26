// Headless smoke test: loads www/index.html, exercises every preset/tuning/twist/groove/voice, checks for errors.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '../www/index.html'));
  const r = await page.evaluate(async () => {
    const V = window.__VS, out = { presets: V.PRESETS.length, issues: [] };
    const btn = (sel, txt) => [...document.querySelectorAll(sel + ' button')].find(b => b.textContent === txt).click();
    for (const p of V.PRESETS) {
      for (const c of p.chords) {
        if (c.frets.length !== 6 || c.piano.some(m => m < 48 || m > 76) || c.harmony.length !== 2 || c.choir.length !== 3 || c.choir.some(m => m === undefined))
          out.issues.push(p.artist + ' ' + c.name);
      }
      document.querySelectorAll('.preset')[V.PRESETS.indexOf(p)].click();
      for (const tu of ['Standard E (0)','D Standard (-2)','Drop D (0, low string -2)','Drop C (-2, low string -2)']) {
        btn('#tuningSeg', tu);
        for (const tw of ['Original Progression','IV → iv Heartbreak Twist','Dorian Major IV Lift']) {
          btn('#twistSeg', tw);
          if (document.querySelectorAll('.chord').length !== 4) out.issues.push('chords ' + p.id);
          if (!document.querySelector('#tab').textContent.includes('|')) out.issues.push('tab ' + p.id);
        }
      }
    }
    btn('#tuningSeg','Drop D (0, low string -2)'); btn('#twistSeg','Original Progression');
    document.querySelectorAll('.preset')[2].click(); // Elvis
    out.dropDtab = document.querySelector('#tab').textContent;
    btn('#tuningSeg','D Standard (-2)');
    out.dstdKey = document.querySelector('#keyBadge').textContent;
    out.dstdChords = [...document.querySelectorAll('.chord .nm')].map(e => e.textContent).join(' ');
    out.gold = document.querySelectorAll('#piano .chordt').length;
    out.teal = document.querySelectorAll('#piano .voc').length;
    btn('#twistSeg','IV → iv Heartbreak Twist');
    out.heart = [...document.querySelectorAll('.chord .nm')].map(e => e.textContent).join(' ');
    for (const g of ['Arpeggio + Bass','Lush Pad + Chords','6/8 Ballad Pulse']) for (const v of ['Voice Off','Lead','2-Part Harmony','3-Part Choir']) {
      btn('#grooveSeg', g); btn('#voiceSeg', v);
      document.getElementById('metro').click();
      V.Engine.start(); await new Promise(r => setTimeout(r, 250)); V.Engine.stop();
    }
    document.getElementById('cueBtn').click();
    document.querySelector('#piano [data-m="60"]').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    document.getElementById('addBtn').click();
    out.sections = document.querySelectorAll('.section').length;
    out.sheet = V.songSheet();
    return out;
  });
  console.log(JSON.stringify({ ...r, sheet: undefined }, null, 1));
  console.log(r.sheet);
  await page.screenshot({ path: path.resolve(__dirname, '../screenshot.png'), fullPage: false });
  await browser.close();
  if (errors.length || r.issues.length || r.presets !== 12) { console.error('FAIL', errors, r.issues); process.exit(1); }
  console.log('SMOKE TEST PASSED');
})();
