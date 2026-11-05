import { getCollection as getAll, getEntry, type CollectionEntry, type CollectionKey } from 'astro:content';
import { zonedToDate } from './format';

/** Example entries (in examples/ folders) are only shown when EXAMPLES=1. */
export const showExamples = process.env.EXAMPLES === '1';
const getCollection = async <C extends CollectionKey>(c: C) =>
  (await getAll(c))
    .filter((e) => showExamples || !e.id.startsWith('examples/'))
    .map((e) => ({ ...e, id: e.id.replace(/^examples\//, 'example-') })) as CollectionEntry<C>[];

/** Text written in [square brackets] is a placeholder still to be filled in. */
export const isPlaceholder = (v: string | null | undefined): boolean => !v || /^\[.*\]$/.test(v.trim()) || /example\.com/.test(v);

export const getBand = async () => (await getEntry('band', 'band'))!.data;
export const getSettings = async () => (await getEntry('settings', 'site'))!.data;

export type Show = CollectionEntry<'shows'> & { startDate: Date; endDate: Date };

/** Shows split by the build time. The daily scheduled rebuild moves finished shows to "past". */
export const getShows = async () => {
  const now = Date.now();
  const all: Show[] = (await getCollection('shows')).map((s) => {
    const startDate = zonedToDate(s.data.start, s.data.timeZone);
    const endDate = s.data.end ? zonedToDate(s.data.end, s.data.timeZone) : new Date(startDate.getTime() + 4 * 3600_000);
    return Object.assign(s, { startDate, endDate });
  });
  const upcoming = all.filter((s) => s.endDate.getTime() >= now).sort((a, b) => +a.startDate - +b.startDate);
  const past = all.filter((s) => s.endDate.getTime() < now).sort((a, b) => +b.startDate - +a.startDate);
  return { all, upcoming, past };
};

export const getReleases = async () => (await getCollection('releases')).sort((a, b) => b.data.date.localeCompare(a.data.date) || b.id.localeCompare(a.id));
export const getMerch = async () => (await getCollection('merch')).sort((a, b) => a.data.order - b.data.order || a.id.localeCompare(b.id));
export const getVideos = async () => (await getCollection('videos')).sort((a, b) => b.data.date.localeCompare(a.data.date));
export const getGallery = async () => (await getCollection('gallery')).sort((a, b) => a.data.order - b.data.order);
export const getMembers = async () => (await getCollection('members')).sort((a, b) => a.data.order - b.data.order);
export const getPress = async () => (await getCollection('press')).sort((a, b) => (b.data.date ?? '').localeCompare(a.data.date ?? ''));
export const getLinks = async () => (await getCollection('links')).sort((a, b) => a.data.order - b.data.order);

/** Long text page (bio, legal) in a language, falling back to English. */
export const getPage = async (lang: string, key: string) => {
  const own = await getEntry('pages', `${lang}/${key}`);
  return { entry: own ?? (await getEntry('pages', `en/${key}`))!, isFallback: !own };
};

/** Streaming platforms in display order, with their official names (never translated). */
export const platforms = {
  spotify: 'Spotify', appleMusic: 'Apple Music', youtubeMusic: 'YouTube Music', bandcamp: 'Bandcamp',
  deezer: 'Deezer', amazonMusic: 'Amazon Music', tidal: 'TIDAL', soundcloud: 'SoundCloud',
} as const;

/** Social profiles shown as footer icons, in order. */
export const socialOrder = ['instagram', 'facebook', 'tiktok', 'youtube', 'spotify', 'appleMusic', 'bandcamp', 'soundcloud', 'x', 'threads', 'linktree'] as const;
export const socialNames: Record<string, string> = {
  instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', youtube: 'YouTube', spotify: 'Spotify', appleMusic: 'Apple Music',
  bandcamp: 'Bandcamp', soundcloud: 'SoundCloud', x: 'X', threads: 'Threads', linktree: 'Linktree',
};
