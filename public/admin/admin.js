// Fan wall admin: post messages/photos, delete posts and comments. The key is the ADMIN_KEY secret
// set in Cloudflare; it is only kept on this device if "Remember" is ticked.
(() => {
  const $ = (id) => document.getElementById(id);
  let key = '';
  try { key = localStorage.getItem('bd316-admin') || ''; } catch { key = ''; }
  const api = (path, opts = {}) => fetch(path, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, ...(opts.headers || {}) } });
  const el = (tag, text, cls) => { const e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; };

  const load = async () => {
    const d = await (await fetch('/api/wall')).json();
    const box = $('posts');
    box.replaceChildren();
    if (!d.posts?.length) { box.append(el('p', 'No posts yet.', 'muted')); return; }
    for (const p of d.posts) {
      const card = el('article', null, 'post');
      card.append(el('small', new Date(p.date).toLocaleString(), 'muted'));
      if (p.text) card.append(el('p', p.text));
      if (p.image) { const i = el('img'); i.src = p.image; i.alt = ''; card.append(i); }
      card.append(el('p', Object.entries(p.reactions).map(([e, n]) => `${e} ${n}`).join('   '), 'muted'));
      for (const c of p.comments) {
        const row = el('div', null, 'comment');
        row.append(el('span', `${c.name}: ${c.text}`));
        const del = el('button', 'Delete', 'ghost');
        del.type = 'button';
        del.addEventListener('click', async () => { if (confirm('Delete this comment?')) { await api(`/api/wall/admin/comment/${p.id}/${c.id}`, { method: 'DELETE' }); load(); } });
        row.append(del);
        card.append(row);
      }
      const delPost = el('button', 'Delete post', 'ghost');
      delPost.type = 'button';
      delPost.addEventListener('click', async () => { if (confirm('Delete this post and its comments?')) { await api(`/api/wall/admin/post/${p.id}`, { method: 'DELETE' }); load(); } });
      card.append(delPost);
      box.append(card);
    }
  };

  const enter = async () => {
    const r = await api('/api/wall/admin/check', { method: 'POST', body: '{}' });
    if (r.ok) {
      $('login').hidden = true; $('panel').hidden = false;
      try { if ($('remember').checked) localStorage.setItem('bd316-admin', key); } catch { /* private mode */ }
      load();
    } else {
      const d = await r.json().catch(() => ({}));
      $('login-msg').textContent = d.error || 'Could not log in.';
    }
  };
  $('enter').addEventListener('click', () => { key = $('key').value.trim(); enter(); });
  if (key) enter();

  // Photo: resized in the browser to max 1600 px JPEG before upload (fast, small, no EXIF location data).
  let photo = null;
  $('photo').addEventListener('change', async () => {
    const f = $('photo').files[0];
    if (!f) { photo = null; $('preview').hidden = true; return; }
    const bmp = await createImageBitmap(f);
    const s = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    photo = c.toDataURL('image/jpeg', 0.82);
    $('preview').src = photo; $('preview').hidden = false;
  });

  $('post').addEventListener('click', async () => {
    const text = $('text').value.trim();
    if (!text && !photo) { $('post-msg').textContent = 'Write something or add a photo.'; return; }
    $('post-msg').textContent = 'Posting…';
    const r = await api('/api/wall/admin/post', { method: 'POST', body: JSON.stringify({ text, image: photo }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) { $('post-msg').textContent = 'Posted ✅'; $('text').value = ''; $('photo').value = ''; photo = null; $('preview').hidden = true; load(); }
    else $('post-msg').textContent = d.error || 'Could not post.';
  });
})();
