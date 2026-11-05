// Check 10: security. Dependency audit + the _headers file has the required headers and a valid CSP.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { dist, requireDist, result, root, walk } from './lib.mjs';

const r = result('security', 'Security: dependencies, security headers, no secrets');
requireDist(r);
const audit = spawnSync('npm', ['audit', '--audit-level=high', '--json'], { encoding: 'utf8', shell: process.platform === 'win32' });
try {
  const j = JSON.parse(audit.stdout || '{}');
  const v = j.metadata?.vulnerabilities ?? {};
  if ((v.high ?? 0) + (v.critical ?? 0) > 0) r.error(`npm audit: ${v.high ?? 0} high and ${v.critical ?? 0} critical vulnerabilities in dependencies`, 'Run `npm audit fix`. If that cannot fix it, wait for the Dependabot pull request or update the package named in `npm audit`.');
  if ((v.moderate ?? 0) + (v.low ?? 0) > 0) r.note(`npm audit: ${v.moderate ?? 0} moderate / ${v.low ?? 0} low (build-time only tools; not shipped to visitors).`);
} catch { r.note('npm audit could not run (offline?).'); }

const hf = path.join(dist, '_headers');
if (!fs.existsSync(hf)) r.error('dist/_headers is missing', 'public/_headers must exist; it is copied into the build.');
else {
  const h = fs.readFileSync(hf, 'utf8');
  const need = ['Strict-Transport-Security', 'X-Content-Type-Options: nosniff', 'Referrer-Policy', 'Permissions-Policy', 'Content-Security-Policy', 'X-Frame-Options'];
  for (const n of need) if (!h.includes(n)) r.error(`_headers is missing ${n}`, 'Restore it in public/_headers.');
  if (h.includes('__CSP__')) r.error('_headers still contains the __CSP__ placeholder', 'scripts/postbuild.mjs did not run. Use `npm run build`, not `astro build`.');
  const csp = h.match(/Content-Security-Policy: (.+)/)?.[1] ?? '';
  for (const d of ["default-src 'self'", "frame-ancestors 'none'", "object-src 'none'", "base-uri 'self'"]) if (!csp.includes(d)) r.error(`CSP is missing "${d}"`);
  if (/script-src[^;]*'unsafe-(inline|eval)'/.test(csp)) r.error("CSP allows 'unsafe-inline' or 'unsafe-eval' scripts", 'Inline scripts are allowed by hash automatically; remove the unsafe keyword.');
  for (const line of h.split('\n')) if (line.length > 2000) r.error(`_headers has a line of ${line.length} characters (Cloudflare limit is 2000)`);
  if (!/^\/\*$/m.test(h)) r.error('_headers has no rule for /*');
}
if (!fs.existsSync(path.join(dist, '.well-known/security.txt'))) r.error('/.well-known/security.txt is missing');

const exp = fs.existsSync(path.join(dist, '.well-known/security.txt')) && fs.readFileSync(path.join(dist, '.well-known/security.txt'), 'utf8').match(/Expires: (\S+)/)?.[1];
if (exp && Date.parse(exp) < Date.now() + 30 * 86400000) r.error('security.txt expires within 30 days', 'Update the Expires date in public/.well-known/security.txt (max one year ahead).');

// External links must not leak window.opener
for (const f of walk(dist).filter((x) => x.endsWith('.html'))) {
  const html = fs.readFileSync(f, 'utf8');
  for (const m of html.matchAll(/<a [^>]*href="https?:\/\/[^"]+"[^>]*>/g)) {
    if (/target="_blank"/.test(m[0]) && !/rel="[^"]*noopener/.test(m[0])) r.error(`${path.relative(root, f)}: external link with target=_blank but no rel="noopener"`);
  }
}
// No secrets committed
const secretRx = /(sk_live_[0-9a-zA-Z]{10,}|rk_live_[0-9a-zA-Z]{10,}|xkeysib-[0-9a-f]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN (RSA |EC )?PRIVATE KEY-----|0x4AAAAAA[A-Za-z0-9_-]{10,}(?=.*secret))/;
for (const f of walk(path.join(root, 'src')).concat(walk(path.join(root, 'public')), walk(path.join(root, 'functions')))) {
  if (!/\.(json|md|ts|astro|mjs|js|txt|yml|yaml|toml)$/.test(f)) continue;
  if (secretRx.test(fs.readFileSync(f, 'utf8'))) r.error(`${path.relative(root, f)} seems to contain a secret key`, 'Remove it, rotate the key in that service, and store it as a Cloudflare or GitHub secret instead.');
}
r.finish();
