import en from '../content/i18n/en.json';
import fr from '../content/i18n/fr.json';
import ro from '../content/i18n/ro.json';
import it from '../content/i18n/it.json';
import es from '../content/i18n/es.json';
import ar from '../content/i18n/ar.json';
import ru from '../content/i18n/ru.json';
import el from '../content/i18n/el.json';
import type { Locale } from './locales';

type Dict = Record<string, unknown>;
export const dictionaries: Record<Locale, Dict> = { en, fr, ro, it, es, ar, ru, el };

const lookup = (dict: Dict, key: string): string | undefined => {
  let cur: unknown = dict;
  for (const part of key.split('.')) {
    if (cur && typeof cur === 'object' && part in (cur as Dict)) cur = (cur as Dict)[part];
    else return undefined;
  }
  return typeof cur === 'string' && cur.trim() !== '' ? cur : undefined;
};

/**
 * Translate a key for a language. Missing or empty text falls back to English
 * (the translation check, `npm run check:i18n`, lists every fallback).
 */
export const t = (lang: Locale, key: string, vars: Record<string, string | number> = {}): string => {
  const raw = lookup(dictionaries[lang], key) ?? lookup(dictionaries.en, key);
  if (raw === undefined) throw new Error(`Missing translation key "${key}" in en.json`);
  return raw.replace(/\{(\w+)\}/g, (_, v) => (v in vars ? String(vars[v]) : `{${v}}`));
};

/** Bound translator for one language: const tr = useT('fr'); tr('shows.tickets') */
export const useT = (lang: Locale) => (key: string, vars?: Record<string, string | number>) => t(lang, key, vars);

/** Pick a language from a content field like { en: "…", fr: "…" }, falling back to English. */
export const pick = <T>(lang: Locale, value: Partial<Record<Locale, T>> & { en: T }): T => value[lang] ?? value.en;
