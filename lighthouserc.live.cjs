// Monthly Lighthouse run against the LIVE site, every language. Used by .github/workflows/monthly-lighthouse.yml
const base = (process.env.SITE_URL || 'https://claude-coding.bleedingdebts316.workers.dev').replace(/\/$/, '');
const slugs = {
  en: ['', 'music/', 'shows/', 'shop/', 'about/'], fr: ['', 'musique/', 'concerts/', 'boutique/', 'a-propos/'],
  ro: ['', 'muzica/', 'concerte/', 'magazin/', 'despre/'], it: ['', 'musica/', 'concerti/', 'negozio/', 'chi-siamo/'],
  es: ['', 'musica/', 'conciertos/', 'tienda/', 'sobre-nosotros/'], ar: ['', 'musiqa/', 'hafalat/', 'matjar/', 'man-nahnu/'],
  ru: ['', 'muzyka/', 'kontserty/', 'magazin/', 'o-nas/'], el: ['', 'mousiki/', 'synavlies/', 'katastima/', 'schetika/'],
};
module.exports = {
  ci: {
    collect: {
      url: Object.entries(slugs).flatMap(([l, s]) => s.map((x) => `${base}/${l}/${x}`)),
      numberOfRuns: 1,
      settings: { chromeFlags: '--no-sandbox --headless=new' },
    },
    upload: { target: 'filesystem', outputDir: 'reports/lighthouse-live' },
  },
};
