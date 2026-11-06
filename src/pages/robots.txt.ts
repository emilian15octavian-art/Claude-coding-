import type { APIRoute } from 'astro';

/** Allows all search engines and AI crawlers (so the band shows up in AI answers too). */
export const GET: APIRoute = ({ site }) => {
  const bots = ['Googlebot', 'Bingbot', 'DuckDuckBot', 'YandexBot', 'Applebot', 'Applebot-Extended', 'Google-Extended', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'CCBot', 'Amazonbot', 'meta-externalagent', 'MistralAI-User'];
  const body = [
    '# Bleeding Debts 316: search engines and AI assistants are welcome.',
    ...bots.flatMap((b) => [`User-agent: ${b}`, 'Allow: /', '']),
    'User-agent: *', 'Allow: /', 'Disallow: /api/', 'Disallow: /dom/', '',
    `Sitemap: ${new URL('/sitemap.xml', site)}`, '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
