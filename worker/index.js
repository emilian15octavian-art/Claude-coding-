// Tiny Cloudflare Worker in front of the static site. It only runs for the paths listed in
// wrangler.jsonc → assets.run_worker_first; everything else is served straight from dist/.
// Why: Cloudflare's static-asset handling redirects "/file.html" to "/file", which would break
// Google's HTML-file verification, so the verification file is answered here directly.
const VERIFY = {
  '/google853763245a87759b.html': 'google-site-verification: google853763245a87759b.html',
};

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (VERIFY[pathname]) {
      return new Response(VERIFY[pathname], { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
    }
    return env.ASSETS.fetch(request);
  },
};
