/* Velvet & Strings — audio engine: synth voices, plucked-string guitar, event scheduler, mic tuner and recorder. */
(function (root) {
  'use strict';
  const VT = root.VT;
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);

  const A = {
    ctx: null, master: null, bus: null, verb: null, noise: null, ks: new Map(),
    playing: false, volume: 0.8,
    ensure() {
      if (!this.ctx) {
        const AC = root.AudioContext || root.webkitAudioContext;
        const c = this.ctx = new AC({ latencyHint: 'interactive' });
        const comp = c.createDynamicsCompressor(); comp.threshold.value = -15; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
        this.master = c.createGain(); this.master.gain.value = this.volume * 0.9;
        this.master.connect(comp); comp.connect(c.destination);
        const len = Math.floor(c.sampleRate * 2.3), ir = c.createBuffer(2, len, c.sampleRate);
        for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.4); }
        this.verb = c.createConvolver(); this.verb.buffer = ir;
        const vg = c.createGain(); vg.gain.value = 0.3; this.verb.connect(vg); vg.connect(this.master);
        this.noise = c.createBuffer(1, c.sampleRate, c.sampleRate);
        const nd = this.noise.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
        this.newBus();
      }
      if (this.ctx.state !== 'running') this.ctx.resume();
      return this.ctx;
    },
    newBus() {
      // every playback writes into a bus; stopping disconnects it so already-scheduled notes go silent instantly
      const c = this.ctx;
      this.bus = c.createGain(); this.bus.connect(this.master);
      this.busVerb = c.createGain(); this.busVerb.connect(this.verb);
    },
    killBus() {
      const b = this.bus, bv = this.busVerb, t = this.ctx.currentTime;
      b.gain.setValueAtTime(b.gain.value, t); b.gain.linearRampToValueAtTime(0, t + 0.06);
      bv.gain.setValueAtTime(bv.gain.value, t); bv.gain.linearRampToValueAtTime(0, t + 0.06);
      setTimeout(() => { try { b.disconnect(); bv.disconnect(); } catch (e) {} }, 120);
      this.newBus();
    },
    setVolume(v) { this.volume = v; if (this.master) this.master.gain.setTargetAtTime(v * 0.9, this.ctx.currentTime, 0.03); },
    out(node, wet) { node.connect(this.bus); if (wet) { const g = this.ctx.createGain(); g.gain.value = wet; node.connect(g); g.connect(this.busVerb); } },
    env(g, t, a, peak, d, sus, rel) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak * sus), t + a + d);
      g.gain.exponentialRampToValueAtTime(0.0001, t + a + d + rel);
    },
    /* Karplus-Strong plucked string, rendered once per pitch and cached */
    ksBuffer(m, bright) {
      const key = m + (bright ? 'b' : '');
      if (this.ks.has(key)) return this.ks.get(key);
      const c = this.ctx, sr = c.sampleRate, f = hz(m);
      const N = Math.max(2, Math.round(sr / f)), dur = bright ? 1.8 : 2.4, len = Math.floor(sr * dur);
      const buf = c.createBuffer(1, len, sr), y = buf.getChannelData(0);
      let prev = 0;
      for (let i = 0; i < N; i++) { const r = Math.random() * 2 - 1; prev = bright ? r : (r + prev) * 0.5; y[i] = prev; }
      const s = Math.min(0.9992, 0.9975 + 0.0015 * Math.min(1, 220 / f));
      for (let i = N; i < len; i++) y[i] = s * 0.5 * (y[i - N] + y[i - N - 1 < 0 ? 0 : i - N - 1]);
      let peak = 0; for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(y[i]));
      const fade = Math.floor(sr * 0.05);
      for (let i = 0; i < len; i++) { y[i] /= peak || 1; if (i > len - fade) y[i] *= (len - i) / fade; }
      this.ks.set(key, buf);
      return buf;
    },
    string(m, t, v, d, bright) {
      const c = this.ctx, src = c.createBufferSource(), lp = c.createBiquadFilter(), g = c.createGain();
      src.buffer = this.ksBuffer(Math.round(m), bright);
      lp.type = 'lowpass'; lp.frequency.value = bright ? 6000 : 3800;
      g.gain.setValueAtTime(0.32 * v, t);
      if (d) { g.gain.setValueAtTime(0.32 * v, t + d * 1.4); g.gain.exponentialRampToValueAtTime(0.0001, t + d * 1.4 + 0.25); }
      src.connect(lp); lp.connect(g); this.out(g, bright ? 0.35 : 0.22);
      src.start(t); src.stop(t + (d ? d * 1.4 + 0.3 : 2.4));
    },
    strum(ms, t, v, dir, d) {
      const order = dir === 'U' ? ms.slice().reverse() : ms;
      const gap = dir === 'U' ? 0.011 : 0.016;
      order.forEach((m, i) => this.string(m, t + i * gap, v * (dir === 'U' ? 0.75 : 1) * (1 - i * 0.04), d));
    },
    keys(m, t, v, d) {
      const c = this.ctx, f = hz(m);
      const o1 = c.createOscillator(), o2 = c.createOscillator(), lp = c.createBiquadFilter(), g = c.createGain(), g2 = c.createGain();
      o1.type = 'triangle'; o1.frequency.value = f; o2.type = 'sine'; o2.frequency.value = f * 2; g2.gain.value = 0.3;
      lp.type = 'lowpass'; lp.frequency.setValueAtTime(Math.min(9000, f * 8), t); lp.frequency.exponentialRampToValueAtTime(Math.max(200, f * 1.5), t + (d || 1));
      o1.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g);
      this.env(g, t, 0.005, 0.28 * v, 0.18, 0.35, d || 1);
      this.out(g, 0.4);
      const end = t + (d || 1) + 0.45; o1.start(t); o2.start(t); o1.stop(end); o2.stop(end);
    },
    pad(ms, t, v, d) {
      const c = this.ctx, lp = c.createBiquadFilter(), g = c.createGain();
      lp.type = 'lowpass'; lp.frequency.setValueAtTime(650, t); lp.frequency.linearRampToValueAtTime(1700, t + d * 0.6); lp.Q.value = 0.7;
      lp.connect(g);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.075 * v, t + Math.min(0.6, d * 0.3));
      g.gain.setValueAtTime(0.075 * v, t + d * 0.85); g.gain.linearRampToValueAtTime(0.0001, t + d + 0.5);
      this.out(g, 0.8);
      ms.forEach(m => [-7, 7].forEach(dt => { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(m); o.detune.value = dt; o.connect(lp); o.start(t); o.stop(t + d + 0.6); }));
    },
    bass(m, t, v, d) {
      const c = this.ctx, o = c.createOscillator(), s = c.createOscillator(), lp = c.createBiquadFilter(), g = c.createGain();
      o.type = 'triangle'; o.frequency.value = hz(m); s.type = 'sine'; s.frequency.value = hz(m) / 2;
      lp.type = 'lowpass'; lp.frequency.value = 650;
      o.connect(lp); s.connect(lp); lp.connect(g);
      this.env(g, t, 0.008, 0.36 * v, 0.22, 0.55, Math.max(0.15, d));
      this.out(g, 0.03);
      const end = t + d + 0.45; o.start(t); s.start(t); o.stop(end); s.stop(end);
    },
    voice(m, t, v, d, choir) {
      const c = this.ctx, f = hz(m);
      const mk = (detune, amp) => {
        const o = c.createOscillator(), o2 = c.createOscillator(); o.type = 'sawtooth'; o2.type = 'triangle';
        o.frequency.value = f; o2.frequency.value = f; o.detune.value = detune; o2.detune.value = detune;
        const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 5 + Math.random() * 0.6;
        lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.011, t + Math.min(0.6, d * 0.6));
        lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
        const mix = c.createGain(); const sg = c.createGain(); sg.gain.value = 0.55; o.connect(sg); sg.connect(mix); o2.connect(mix);
        const g = c.createGain();
        const F = choir ? [[350, 1, 5], [900, 0.45, 7], [2700, 0.12, 9]] : [[760, 1, 6], [1180, 0.55, 8], [2800, 0.2, 10]];
        F.forEach(([fr, a, q]) => { const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fr; bp.Q.value = q; const ag = c.createGain(); ag.gain.value = a; mix.connect(bp); bp.connect(ag); ag.connect(g); });
        const body = c.createBiquadFilter(); body.type = 'lowpass'; body.frequency.value = 850; const bg = c.createGain(); bg.gain.value = 0.3; mix.connect(body); body.connect(bg); bg.connect(g);
        const out = c.createGain();
        const att = Math.min(0.09, d * 0.3), rel = Math.min(0.2, d * 0.3);
        out.gain.setValueAtTime(0.0001, t); out.gain.linearRampToValueAtTime(amp * v, t + att);
        out.gain.setValueAtTime(amp * v, t + Math.max(att, d - rel)); out.gain.linearRampToValueAtTime(0.0001, t + d);
        g.connect(out); this.out(out, 0.85);
        [o, o2, lfo].forEach(x => { x.start(t); x.stop(t + d + 0.05); });
      };
      if (choir) { mk(-7, 0.32); mk(8, 0.28); } else mk(0, 0.5);
    },
    kick(t, v) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain();
      o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
      g.gain.setValueAtTime(0.8 * v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
      o.connect(g); this.out(g, 0); o.start(t); o.stop(t + 0.34);
    },
    hit(t, v, type, freq, dur, wet) {
      const c = this.ctx, n = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      n.buffer = this.noise; f.type = type; f.frequency.value = freq;
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      n.connect(f); f.connect(g); this.out(g, wet); n.start(t, Math.random() * 0.5); n.stop(t + dur + 0.02);
    },
    snare(t, v, brush) {
      if (brush) { this.hit(t, 0.2 * v, 'bandpass', 3200, 0.12, 0.15); return; }
      this.hit(t, 0.3 * v, 'bandpass', 1900, 0.17, 0.25);
      const c = this.ctx, o = c.createOscillator(), g = c.createGain();
      o.type = 'triangle'; o.frequency.value = 190; g.gain.setValueAtTime(0.17 * v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
      o.connect(g); this.out(g, 0); o.start(t); o.stop(t + 0.1);
    },
    hat(t, v) { this.hit(t, 0.085 * v, 'highpass', 7500, 0.045, 0); },
    click(t, acc) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain();
      o.type = 'square'; o.frequency.value = acc ? 1600 : 1000;
      g.gain.setValueAtTime(acc ? 0.15 : 0.085, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
      o.connect(g); this.out(g, 0); o.start(t); o.stop(t + 0.05);
    },
    fire(e, t, spb) {
      const d = (e.d || 0.5) * spb;
      switch (e.k) {
        case 'pluck': this.string(e.m, t, e.v, d); break;
        case 'strum': this.strum(e.ms, t, e.v, e.dir, d); break;
        case 'keys': this.keys(e.m, t, e.v, d); break;
        case 'pad': this.pad(e.ms, t, e.v, d); break;
        case 'bass': this.bass(e.m, t, e.v, d); break;
        case 'voice': this.voice(e.m, t, e.v * (e.part ? 0.85 : 1), d, e.choir); break;
        case 'lead': this.string(e.m, t, e.v * 1.2, d, true); break;
        case 'kick': this.kick(t, e.v); break;
        case 'snare': this.snare(t, e.v, e.brush); break;
        case 'hat': this.hat(t, e.v); break;
        case 'click': this.click(t, e.acc); break;
      }
    },
    /* ---------- transport ---------- */
    play(r, opts) {
      this.ensure();
      if (this.playing) this.stop(true);
      this.r = r; this.opts = opts; this.loop = !!opts.loop; this.tempo = opts.tempo;
      this.idx = 0; this.iter = 0; this.uiQ = [];
      this.anchorTime = this.ctx.currentTime + 0.08; this.anchorBeat = 0;
      this.playing = true;
      this.timer = setInterval(() => this.tick(), 25);
      const raf = () => { if (!this.playing) return; this.drainUI(); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    },
    beatTime(b) { return this.anchorTime + (b - this.anchorBeat) * 60 / this.tempo; },
    nowBeat() { return this.anchorBeat + (this.ctx.currentTime - this.anchorTime) * this.tempo / 60; },
    setTempo(bpm) {
      if (!this.playing) { this.tempo = bpm; return; }
      const b = this.nowBeat(); this.anchorTime = this.ctx.currentTime; this.anchorBeat = b; this.tempo = bpm;
    },
    tick() {
      const horizon = this.ctx.currentTime + 0.14, ev = this.r.events, L = this.r.total;
      const spb = 60 / this.tempo;
      for (let guard = 0; guard < 400; guard++) {
        if (this.idx >= ev.length) {
          if (this.loop) {
            const endT = this.beatTime((this.iter + 1) * L);
            if (endT > horizon) break;
            this.iter++; this.idx = 0;
            if (this.opts.onLoop) this.uiQ.push({ t: endT, loop: this.iter });
            continue;
          }
          const endT = this.beatTime(L);
          if (!this.ending) { this.ending = true; this.uiQ.push({ t: endT + 0.3, end: true }); }
          break;
        }
        const e = ev[this.idx], b = e.t + this.iter * L, t = this.beatTime(b);
        if (t > horizon) break;
        this.idx++;
        if (t < this.ctx.currentTime - 0.05) continue;     // skip events we are late for
        if (e.k === 'seg') { this.uiQ.push({ t, si: e.si, ci: e.ci }); continue; }
        this.fire(e, Math.max(t, this.ctx.currentTime), spb);
      }
    },
    drainUI() {
      const now = this.ctx.currentTime;
      while (this.uiQ.length && this.uiQ[0].t <= now) {
        const q = this.uiQ.shift();
        if (q.end) { const cb = this.opts.onEnd; this.stop(); if (cb) cb(); return; }
        if (q.loop !== undefined) { if (this.opts.onLoop) this.opts.onLoop(q.loop); continue; }
        if (this.opts.onSeg) this.opts.onSeg(q.si, q.ci);
      }
      this.uiQ.sort((a, b) => a.t - b.t);
    },
    stop(silent) {
      if (!this.playing) return;
      this.playing = false; this.ending = false; clearInterval(this.timer); this.timer = null;
      this.killBus();
      if (!silent && this.opts && this.opts.onStop) this.opts.onStop();
    },
    /* one-shots */
    now() { this.ensure(); return this.ctx.currentTime + 0.02; },
    tap(m) { this.keys(m, this.now(), 1, 1.2); },
    pluckNow(m, d) { this.string(m, this.now(), 1, d || 2); },
    strumNow(ms) { this.strum(ms, this.now(), 0.9, 'D', 2); },
    sing(ms, d, choir) { const t = this.now(); ms.forEach((m, i) => this.voice(m, t, i ? 0.7 : 0.9, d || 1.6, choir || ms.length > 2)); },
    playNotes(ms, gap, d) { const t = this.now(); ms.forEach((m, i) => this.keys(m, t + i * (gap || 0), 1, d || 1)); },

    /* ---------- microphone: tuner + recorder ---------- */
    async mic() {
      if (this.stream && this.stream.active) return this.stream;
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      return this.stream;
    },
    async startTuner(cb) {
      this.ensure();
      const stream = await this.mic();
      const c = this.ctx, src = c.createMediaStreamSource(stream), an = c.createAnalyser();
      an.fftSize = 2048; src.connect(an);
      const buf = new Float32Array(an.fftSize);
      this.tunerOn = true; this.tunerSrc = src;
      let smooth = 0;
      const loop = () => {
        if (!this.tunerOn) return;
        an.getFloatTimeDomainData(buf);
        const f = autoCorrelate(buf, c.sampleRate);
        if (f > 0) { smooth = smooth ? smooth * 0.7 + f * 0.3 : f; cb(smooth); } else cb(-1);
        setTimeout(loop, 60);
      };
      loop();
    },
    stopTuner() { this.tunerOn = false; try { this.tunerSrc && this.tunerSrc.disconnect(); } catch (e) {} this.releaseMic(); },
    async startRec() {
      const stream = await this.mic();
      const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
      const type = types.find(t => root.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '';
      this.rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
      this.chunks = []; this.recStart = Date.now();
      this.rec.ondataavailable = e => { if (e.data && e.data.size) this.chunks.push(e.data); };
      this.rec.start(250);
    },
    stopRec() {
      return new Promise(res => {
        if (!this.rec) return res(null);
        const rec = this.rec; this.rec = null;
        rec.onstop = () => { const blob = new Blob(this.chunks, { type: rec.mimeType || 'audio/webm' }); this.releaseMic(); res({ blob, dur: (Date.now() - this.recStart) / 1000 }); };
        rec.stop();
      });
    },
    releaseMic() { if (!this.tunerOn && !this.rec && this.stream) { this.stream.getTracks().forEach(t => t.stop()); this.stream = null; } }
  };

  /* autocorrelation pitch detector (ACF2+ style) */
  function autoCorrelate(buf, sr) {
    let size = buf.length, rms = 0;
    for (let i = 0; i < size; i++) rms += buf[i] * buf[i];
    if (Math.sqrt(rms / size) < 0.012) return -1;
    let r1 = 0, r2 = size - 1; const th = 0.2;
    for (let i = 0; i < size / 2; i++) if (Math.abs(buf[i]) < th) { r1 = i; break; }
    for (let i = 1; i < size / 2; i++) if (Math.abs(buf[size - i]) < th) { r2 = size - i; break; }
    const b = buf.slice(r1, r2); size = b.length;
    const c = new Float32Array(size);
    for (let i = 0; i < size; i++) { let s = 0; for (let j = 0; j < size - i; j++) s += b[j] * b[j + i]; c[i] = s; }
    let d = 0; while (d < size - 1 && c[d] > c[d + 1]) d++;
    let maxv = -1, maxp = -1;
    for (let i = d; i < size; i++) if (c[i] > maxv) { maxv = c[i]; maxp = i; }
    if (maxp <= 0) return -1;
    let T0 = maxp;
    const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1] || 0;
    const a = (x1 + x3 - 2 * x2) / 2, bb = (x3 - x1) / 2;
    if (a) T0 = T0 - bb / (2 * a);
    const f = sr / T0;
    return f > 50 && f < 1400 ? f : -1;
  }
  A.autoCorrelate = autoCorrelate;
  root.VA = A;
})(typeof self !== 'undefined' ? self : this);
