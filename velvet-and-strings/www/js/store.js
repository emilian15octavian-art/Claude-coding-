/* Velvet & Strings — persistence + native bridges (Capacitor plugins when running as the Android app). */
(function (root) {
  'use strict';
  const Cap = root.Capacitor;
  const isNative = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());
  const plugin = name => (isNative && Cap.Plugins && Cap.Plugins[name]) || null;
  const P = 'vs3_';

  const kv = {
    get(k, d) { try { const v = localStorage.getItem(P + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(P + k, JSON.stringify(v)); } catch (e) {} },
    raw(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  };

  /* durable mirror of the song library in the app's private files (survives WebView storage eviction) */
  let mirrorT = null;
  function mirrorSongs(songs) {
    const FS = plugin('Filesystem'); if (!FS) return;
    clearTimeout(mirrorT);
    mirrorT = setTimeout(() => { FS.writeFile({ path: 'velvet-songs.json', data: JSON.stringify({ v: 3, songs }), directory: 'DATA', encoding: 'utf8' }).catch(() => {}); }, 1500);
  }
  async function readMirror() {
    const FS = plugin('Filesystem'); if (!FS) return null;
    try { const r = await FS.readFile({ path: 'velvet-songs.json', directory: 'DATA', encoding: 'utf8' }); const d = JSON.parse(r.data); return Array.isArray(d.songs) ? d.songs : null; } catch (e) { return null; }
  }

  /* voice memos in IndexedDB */
  let dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      if (!root.indexedDB) return rej(new Error('no indexedDB'));
      const r = indexedDB.open('velvet-strings', 1);
      r.onupgradeneeded = () => { r.result.createObjectStore('memos', { keyPath: 'id' }); };
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  const tx = async (mode, fn) => { const d = await db(); return new Promise((res, rej) => { const t = d.transaction('memos', mode); const s = t.objectStore('memos'); const out = fn(s); t.oncomplete = () => res(out && out.result !== undefined ? out.result : out); t.onerror = () => rej(t.error); }); };
  const memos = {
    async all() { try { const list = await tx('readonly', s => s.getAll()); return (list || []).sort((a, b) => b.created - a.created); } catch (e) { return []; } },
    async put(m) { return tx('readwrite', s => s.put(m)); },
    async del(id) { return tx('readwrite', s => s.delete(id)); }
  };

  /* sharing / saving files */
  const blobToB64 = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(blob); });
  async function share(fname, data, mime, toast) {
    // data: string (text) or Uint8Array / Blob (binary)
    const FS = plugin('Filesystem'), SH = plugin('Share');
    const isText = typeof data === 'string';
    const blob = isText ? new Blob([data], { type: mime }) : data instanceof Blob ? data : new Blob([data], { type: mime });
    if (FS && SH) {
      try {
        const opts = { path: fname, directory: 'CACHE' };
        if (isText) { opts.data = data; opts.encoding = 'utf8'; } else opts.data = await blobToB64(blob);
        const res = await FS.writeFile(opts);
        await SH.share({ title: fname, files: [res.uri], dialogTitle: 'Share ' + fname });
        return;
      } catch (e) {
        if (/cancel/i.test(String((e && e.message) || e))) return;
        try {
          const opts = { path: fname, directory: 'DOCUMENTS' };
          if (isText) { opts.data = data; opts.encoding = 'utf8'; } else opts.data = await blobToB64(blob);
          await FS.writeFile(opts); toast && toast('Saved to Documents/' + fname); return;
        } catch (e2) {}
      }
    }
    try {
      const file = new File([blob], fname, { type: mime });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: fname }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = fname; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000); toast && toast('Downloaded ' + fname);
    } catch (e) { toast && toast('Could not export'); }
  }

  function haptic(kind) {
    const H = plugin('Haptics');
    try { if (H) H.impact({ style: kind === 'heavy' ? 'MEDIUM' : 'LIGHT' }); else if (navigator.vibrate) navigator.vibrate(kind === 'heavy' ? 18 : 6); } catch (e) {}
  }
  let wakeLock = null;
  async function keepAwake(on) {
    try {
      if (on && !wakeLock && navigator.wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); }
      else if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
    } catch (e) {}
  }

  root.VS = { isNative, plugin, kv, mirrorSongs, readMirror, memos, share, haptic, keepAwake, blobToB64 };
})(typeof self !== 'undefined' ? self : this);
