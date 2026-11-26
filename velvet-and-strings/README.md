# Velvet & Strings: Romance Songwriting Studio

Offline Android songwriting app (HTML5/CSS3/vanilla JS in `www/index.html`, wrapped with Capacitor 7).

**Install:** copy `dist/velvet-and-strings-debug.apk` to an Android phone (Android 6.0+), open it and allow "Install unknown apps".

## Features
- 12 artist/archetype presets (BPM, key, vibe, studio secret, 4-chord progression with Roman numerals, guitar frets, piano MIDI voicing, lead / 2-part harmony / 3-part choir MIDI notes)
- Tuning transposition: Standard E, D Standard, Drop D, Drop C (chord names, key badge, tab frets, piano highlights, vocal pitches + Hz)
- Web Audio synth: Play/Stop loop, tempo 55–130, metronome, 3 grooves, 4 voice modes, Sing Cue, 3 harmonic twists
- ASCII 6-string tab, playable C3–E5 touch piano (gold = chord tones, teal = vocal notes)
- Song structure builder (8 section types, intensity 30–100 %, delivery notes; saved on the device) and `.txt` song sheet export via the Android share sheet

## Build it yourself
Needs Node 18+, JDK 17+ and the Android SDK (platform 35) with `ANDROID_HOME` set.
```bash
npm install
npx cap sync android        # android/ is already generated; use `npx cap add android` only on a fresh clone without it
cd android && ./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```
Test the web app: `node scripts/smoke-test.cjs` (uses Playwright + Chromium).
