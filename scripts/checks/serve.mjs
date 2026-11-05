// Tiny static server that behaves like Cloudflare Pages (directory index, nearest 404.html, _headers ignored).
// Usage: node scripts/checks/serve.mjs [port]   (serves dist/)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { dist, fileFor } from './lib.mjs';

const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.pdf': 'application/pdf', '.ics': 'text/calendar', '.webmanifest': 'application/manifest+json' };
export const startServer = (port = 4400) => new Promise((resolve) => {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    let file = fileFor(url.pathname);
    // Like Pages: /fr/concerts → redirect to /fr/concerts/
    if (!file && !url.pathname.endsWith('/') && fileFor(url.pathname + '/')) { res.writeHead(308, { Location: url.pathname + '/' }); return res.end(); }
    let status = 200;
    if (!file) {
      status = 404;
      const lang = url.pathname.split('/')[1];
      file = fs.existsSync(path.join(dist, lang ?? '', '404.html')) ? path.join(dist, lang, '404.html') : path.join(dist, '404.html');
    }
    res.writeHead(status, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  server.listen(port, () => resolve(server));
});
if (process.argv[1] && process.argv[1].endsWith('serve.mjs')) {
  const port = +(process.argv[2] ?? 4400);
  await startServer(port);
  console.log(`Serving ${dist} on http://localhost:${port}`);
}
