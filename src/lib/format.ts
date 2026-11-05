import { localeInfo, type Locale } from '../i18n/locales';

const intl = (lang: Locale) => localeInfo[lang].intl;

/** Offset in minutes of a time zone at a given UTC instant. */
const tzOffset = (utcMs: number, timeZone: string): number => {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      .formatToParts(new Date(utcMs)).map((x) => [x.type, x.value]),
  );
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return Math.round((asUtc - utcMs) / 60000);
};

/** Convert a venue-local "YYYY-MM-DDTHH:MM" in a time zone to a real Date (UTC instant). */
export const zonedToDate = (local: string, timeZone: string): Date => {
  const [d, t] = local.split('T');
  const [y, m, day] = d.split('-').map(Number);
  const [hh, mm] = t.split(':').map(Number);
  const naive = Date.UTC(y, m - 1, day, hh, mm);
  let off = tzOffset(naive, timeZone);
  off = tzOffset(naive - off * 60000, timeZone);
  return new Date(naive - off * 60000);
};

/** ISO 8601 with the venue's UTC offset, e.g. 2026-03-14T20:30:00+02:00 (used in schema). */
export const isoWithOffset = (local: string, timeZone: string): string => {
  const off = tzOffset(zonedToDate(local, timeZone).getTime(), timeZone);
  const sign = off >= 0 ? '+' : '-';
  const a = Math.abs(off);
  return `${local}:00${sign}${String(Math.floor(a / 60)).padStart(2, '0')}:${String(a % 60).padStart(2, '0')}`;
};

export const formatDate = (lang: Locale, isoDate: string, opts: Intl.DateTimeFormatOptions = { dateStyle: 'long' }): string =>
  new Intl.DateTimeFormat(intl(lang), { ...opts, timeZone: 'UTC' }).format(new Date(`${isoDate}T12:00:00Z`));

/** Show date in the venue's time zone, e.g. "Saturday 14 March 2026". */
export const formatShowDate = (lang: Locale, local: string, timeZone: string): string =>
  new Intl.DateTimeFormat(intl(lang), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone }).format(zonedToDate(local, timeZone));

export const formatShowTime = (lang: Locale, local: string, timeZone: string, withZone = true): string =>
  new Intl.DateTimeFormat(intl(lang), { hour: '2-digit', minute: '2-digit', timeZone, ...(withZone ? { timeZoneName: 'short' } : {}) }).format(zonedToDate(local, timeZone));

/** Compact date badge parts for show cards. */
export const showBadge = (lang: Locale, local: string, timeZone: string) => {
  const d = zonedToDate(local, timeZone);
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(intl(lang), { ...o, timeZone }).format(d);
  return { day: f({ day: 'numeric' }), month: f({ month: 'short' }), year: f({ year: 'numeric' }) };
};

export const formatMoney = (lang: Locale, amount: number, currency: string): string =>
  new Intl.NumberFormat(intl(lang), { style: 'currency', currency, maximumFractionDigits: Number.isInteger(amount) ? 0 : 2 }).format(amount);

export const formatNumber = (lang: Locale, n: number): string => new Intl.NumberFormat(intl(lang)).format(n);

/** ISO 8601 duration (PT3M45S) to "3:45". */
export const formatDuration = (iso?: string): string | undefined => {
  if (!iso) return undefined;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return undefined;
  const [h, min, s] = [+(m[1] ?? 0), +(m[2] ?? 0), +(m[3] ?? 0)];
  return `${h ? h + ':' + String(min).padStart(2, '0') : min}:${String(s).padStart(2, '0')}`;
};

/** Country name in the visitor's language, e.g. RO → "Roumanie". */
export const countryName = (lang: Locale, code: string): string =>
  new Intl.DisplayNames([intl(lang)], { type: 'region' }).of(code) ?? code;
