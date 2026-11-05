// The 8 site languages. Order = order in the language switcher.
export const locales = ['en', 'fr', 'ro', 'it', 'es', 'ar', 'ru', 'el'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

interface LocaleInfo {
  /** Language name in its own language (shown in the switcher, no flags). */
  nativeName: string;
  dir: 'ltr' | 'rtl';
  /** Open Graph locale. */
  og: string;
  /** Locale passed to the Intl API for dates, numbers and prices. */
  intl: string;
  /** Font scripts this language needs (see src/components/Fonts.astro). */
  scripts: Array<'latin' | 'latin-ext' | 'cyrillic' | 'greek' | 'arabic'>;
}

export const localeInfo: Record<Locale, LocaleInfo> = {
  en: { nativeName: 'English', dir: 'ltr', og: 'en_GB', intl: 'en-GB', scripts: ['latin'] },
  fr: { nativeName: 'Français', dir: 'ltr', og: 'fr_FR', intl: 'fr-FR', scripts: ['latin', 'latin-ext'] },
  ro: { nativeName: 'Română', dir: 'ltr', og: 'ro_RO', intl: 'ro-RO', scripts: ['latin', 'latin-ext'] },
  it: { nativeName: 'Italiano', dir: 'ltr', og: 'it_IT', intl: 'it-IT', scripts: ['latin'] },
  es: { nativeName: 'Español', dir: 'ltr', og: 'es_ES', intl: 'es-ES', scripts: ['latin'] },
  ar: { nativeName: 'العربية', dir: 'rtl', og: 'ar_AR', intl: 'ar', scripts: ['arabic', 'latin'] },
  ru: { nativeName: 'Русский', dir: 'ltr', og: 'ru_RU', intl: 'ru-RU', scripts: ['cyrillic', 'latin'] },
  el: { nativeName: 'Ελληνικά', dir: 'ltr', og: 'el_GR', intl: 'el-GR', scripts: ['greek', 'latin'] },
};

export const isLocale = (v: string | undefined): v is Locale => !!v && (locales as readonly string[]).includes(v);
