/**
 * Makes small Arabic font files (≈14 KB instead of ≈49 KB each) with only the letters Arabic text needs,
 * so Arabic pages load as fast as the others. Shaping (joined letter forms) is kept.
 * Run again only if the Noto Sans Arabic package is updated: node scripts/tools/subset-arabic.mjs
 * Characters outside this set (rare Persian/Urdu letters) fall back to the system font.
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import subsetFont from 'subset-font';
const require = createRequire(import.meta.url);
export const ranges = [[0x0600, 0x065F], [0x0660, 0x066D], [0x0670, 0x0671], [0x067E, 0x067E], [0x0686, 0x0686], [0x06A4, 0x06A4], [0x06AF, 0x06AF], [0x06CC, 0x06CC], [0x200C, 0x200F], [0x0020, 0x0040]];
let text = '';
for (const [a, b] of ranges) for (let c = a; c <= b; c++) text += String.fromCodePoint(c);
for (const w of [400, 700]) {
  const src = fs.readFileSync(require.resolve(`@fontsource/noto-sans-arabic/files/noto-sans-arabic-arabic-${w}-normal.woff2`));
  const out = await subsetFont(src, text, { targetFormat: 'woff2' });
  fs.writeFileSync(`src/assets/fonts/noto-sans-arabic-core-${w}.woff2`, out);
  console.log(`Noto Sans Arabic ${w}: ${src.length} → ${out.length} bytes`);
}
