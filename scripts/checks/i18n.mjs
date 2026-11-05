// Check 3: translations. Every key exists in all 8 files, no empty strings, no leftover English.
// Also lists content (bios, legal pages, roles, alt texts…) that falls back to English.
import fs from 'node:fs';
import path from 'node:path';
import { langs, root, result, walk } from './lib.mjs';

const r = result('i18n', 'Translations: complete in all 8 languages');
const dir = path.join(root, 'src/content/i18n');
const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (k === '_meta' ? [] : v && typeof v === 'object' ? flat(v, `${p}${k}.`) : [[`${p}${k}`, v]]));
const files = Object.fromEntries(langs.map((l) => [l, Object.fromEntries(flat(JSON.parse(fs.readFileSync(path.join(dir, `${l}.json`), 'utf8'))))]));

// Text that is correctly the same as English (names, brands, international words).
const allowed = new Set(JSON.parse(fs.readFileSync(path.join(dir, '_allowed-identical.json'), 'utf8')).values);
const en = files.en;
for (const l of langs.slice(1)) {
  const cur = files[l];
  const meta = JSON.parse(fs.readFileSync(path.join(dir, `${l}.json`), 'utf8'))._meta ?? {};
  if (meta.status === 'needs native review') r.note(`${l}.json is a draft: needs review by a native speaker.`);
  for (const k of Object.keys(en)) {
    if (!(k in cur)) r.error(`${l}.json: missing key "${k}" (English: "${en[k]}")`, `Add "${k}" to src/content/i18n/${l}.json. Until then visitors see the English text.`);
    else if (typeof cur[k] !== 'string' || !cur[k].trim()) r.error(`${l}.json: "${k}" is empty`, `Write the ${l} translation for "${en[k]}".`);
    else if (cur[k] === en[k] && !allowed.has(en[k])) r.error(`${l}.json: "${k}" is still in English ("${en[k]}")`, `Translate it, or if it really is the same in ${l} (a name or an international word), add the text to src/content/i18n/_allowed-identical.json.`);
    else {
      const need = [...en[k].matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
      const have = [...cur[k].matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
      if (need !== have) r.error(`${l}.json: "${k}" must contain the placeholders {${need}} (found {${have}})`, 'Keep words in {curly brackets} exactly as in English; they are replaced automatically.');
    }
  }
  for (const k of Object.keys(cur)) if (!(k in en)) r.error(`${l}.json: unknown key "${k}" (not in en.json)`, 'Remove it or add it to en.json.');
}

// Long texts per language (bio, legal pages)
const pages = path.join(root, 'src/content/pages');
for (const f of fs.readdirSync(path.join(pages, 'en'))) {
  for (const l of langs.slice(1)) if (!fs.existsSync(path.join(pages, l, f))) r.note(`Missing ${l}/${f}: visitors see the English text. Create src/content/pages/${l}/${f}.`);
}
// Localised fields inside content files ({ "en": …, "fr": … })
const content = path.join(root, 'src/content');
const fallbacks = {};
for (const f of walk(content).filter((f) => f.endsWith('.json') && !f.includes(`${path.sep}i18n${path.sep}`) && !f.includes(`${path.sep}examples${path.sep}`))) {
  const visit = (o, p) => {
    if (!o || typeof o !== 'object') return;
    if (typeof o.en === 'string' && !Array.isArray(o)) {
      for (const l of langs.slice(1)) if (!o[l]) (fallbacks[l] ??= []).push(`${path.relative(root, f)} → ${p}`);
      return;
    }
    for (const [k, v] of Object.entries(o)) visit(v, p ? `${p}.${k}` : k);
  };
  visit(JSON.parse(fs.readFileSync(f, 'utf8')), '');
}
for (const [l, list] of Object.entries(fallbacks)) r.note(`${l}: ${list.length} content field(s) fall back to English: ${list.join('; ')}`);
r.finish();
