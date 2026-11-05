// Lighthouse CI: mobile scores and performance budgets. Any budget exceeded fails the deploy.
// Run locally with `npm run check:lighthouse` (needs Chrome; set CHROME_PATH if it is not found).
const dir = process.env.OUT_DIR || 'dist';
const pages = (process.env.LH_PAGES || '/,/en/,/fr/,/ro/,/it/,/es/,/ar/,/ru/,/el/,/en/shows/,/en/shop/,/en/music/,/en/gallery/,/ar/hafalat/,/ar/matjar/').split(',');
module.exports = {
  ci: {
    collect: {
      staticDistDir: dir,
      url: pages.map((p) => `http://localhost${p}`),
      numberOfRuns: Number(process.env.LH_RUNS || 1),
      settings: { chromeFlags: '--no-sandbox --headless=new', ...(process.env.CHROME_PATH ? { chromePath: process.env.CHROME_PATH } : {}) },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        // Budgets (bytes, compressed transfer size)
        'resource-summary:script:size': ['error', { maxNumericValue: 30000 }],
        'resource-summary:stylesheet:size': ['error', { maxNumericValue: 40000 }],
        // Arabic pages need two Arabic weights (≈100 KB) plus Latin for names: 185 KB max.
        'resource-summary:font:size': ['error', { maxNumericValue: 185000 }],
        'resource-summary:image:size': ['error', { maxNumericValue: 400000 }],
        'resource-summary:total:size': ['error', { maxNumericValue: 700000 }],
        'resource-summary:third-party:count': ['error', { maxNumericValue: 0 }],
      },
    },
    upload: { target: 'filesystem', outputDir: 'reports/lighthouse' },
  },
};
