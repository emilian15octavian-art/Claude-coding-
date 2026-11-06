import { locales, type Locale } from './locales';

// Every page of the site, with its translated URL slug per language.
// Slugs use Latin letters only so links stay readable when shared.
export const pageKeys = [
  'home', 'music', 'videos', 'shows', 'shop', 'about', 'gallery', 'press', 'newsletter', 'contact', 'links',
  'faq', 'accessibility', 'privacy', 'cookies', 'terms', 'shipping', 'notFound',
] as const;
export type PageKey = (typeof pageKeys)[number];

export const slugs: Record<PageKey, Record<Locale, string>> = {
  home: { en: '', fr: '', ro: '', it: '', es: '', ar: '', ru: '', el: '' },
  music: { en: 'music', fr: 'musique', ro: 'muzica', it: 'musica', es: 'musica', ar: 'musiqa', ru: 'muzyka', el: 'mousiki' },
  videos: { en: 'videos', fr: 'videos', ro: 'videoclipuri', it: 'video', es: 'videos', ar: 'fidyu', ru: 'video', el: 'vinteo' },
  shows: { en: 'shows', fr: 'concerts', ro: 'concerte', it: 'concerti', es: 'conciertos', ar: 'hafalat', ru: 'kontserty', el: 'synavlies' },
  shop: { en: 'shop', fr: 'boutique', ro: 'magazin', it: 'negozio', es: 'tienda', ar: 'matjar', ru: 'magazin', el: 'katastima' },
  about: { en: 'about', fr: 'a-propos', ro: 'despre', it: 'chi-siamo', es: 'sobre-nosotros', ar: 'man-nahnu', ru: 'o-nas', el: 'schetika' },
  gallery: { en: 'gallery', fr: 'galerie', ro: 'galerie', it: 'galleria', es: 'galeria', ar: 'maarad', ru: 'galereya', el: 'gkaleri' },
  press: { en: 'press', fr: 'presse', ro: 'presa', it: 'stampa', es: 'prensa', ar: 'sahafa', ru: 'pressa', el: 'typos' },
  newsletter: { en: 'newsletter', fr: 'newsletter', ro: 'newsletter', it: 'newsletter', es: 'boletin', ar: 'nashra', ru: 'rassylka', el: 'enimerotiko' },
  contact: { en: 'contact', fr: 'contact', ro: 'contact', it: 'contatti', es: 'contacto', ar: 'ittisal', ru: 'kontakty', el: 'epikoinonia' },
  links: { en: 'links', fr: 'liens', ro: 'linkuri', it: 'link', es: 'enlaces', ar: 'rawabit', ru: 'ssylki', el: 'syndesmoi' },
  faq: { en: 'faq', fr: 'faq', ro: 'intrebari-frecvente', it: 'domande-frequenti', es: 'preguntas-frecuentes', ar: 'asila', ru: 'voprosy', el: 'syxnes-erotiseis' },
  accessibility: { en: 'accessibility', fr: 'accessibilite', ro: 'accesibilitate', it: 'accessibilita', es: 'accesibilidad', ar: 'wusul', ru: 'dostupnost', el: 'prosvasimotita' },
  privacy: { en: 'privacy', fr: 'confidentialite', ro: 'confidentialitate', it: 'privacy', es: 'privacidad', ar: 'khususiya', ru: 'konfidentsialnost', el: 'aporrito' },
  cookies: { en: 'cookies', fr: 'cookies', ro: 'cookies', it: 'cookie', es: 'cookies', ar: 'cookies', ru: 'cookies', el: 'cookies' },
  terms: { en: 'terms', fr: 'conditions', ro: 'termeni', it: 'termini', es: 'condiciones', ar: 'shurut', ru: 'usloviya', el: 'oroi' },
  shipping: { en: 'shipping-returns', fr: 'livraison-retours', ro: 'livrare-retur', it: 'spedizioni-resi', es: 'envios-devoluciones', ar: 'shahn-irja', ru: 'dostavka-vozvrat', el: 'apostoli-epistrofes' },
  notFound: { en: '404', fr: '404', ro: '404', it: '404', es: '404', ar: '404', ru: '404', el: '404' },
};

/** Site-relative URL of a page in a language, e.g. path('shows','fr') → /fr/concerts/ */
export const path = (key: PageKey, lang: Locale): string => {
  const s = slugs[key][lang];
  return `/${lang}/${s ? s + '/' : ''}`;
};

/** Pages that get a sitemap entry and hreflang alternates (all except 404). */
export const indexablePages = pageKeys.filter((k) => k !== 'notFound');

/** Find which page a URL path belongs to (used by 404 + language switcher). */
export const matchPath = (pathname: string): { lang: Locale; key: PageKey } | null => {
  for (const lang of locales) for (const key of pageKeys) if (path(key, lang) === pathname) return { lang, key };
  return null;
};
