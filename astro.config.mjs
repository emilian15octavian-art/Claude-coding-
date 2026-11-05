// @ts-check
import { defineConfig } from 'astro/config';

// The public address of the site. Change SITE_URL (GitHub Actions variable) if you move to a custom domain later.
const site = process.env.SITE_URL || 'https://claude-coding.emilian15octavian.workers.dev';

export default defineConfig({
  site,
  output: 'static',
  outDir: process.env.OUT_DIR || 'dist',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto', assets: '_astro' },
  compressHTML: true,
  prefetch: false,
  image: { responsiveStyles: false, domains: ['i.ytimg.com'] },
  vite: { build: { assetsInlineLimit: 0 } },
});
