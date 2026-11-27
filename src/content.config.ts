/**
 * Content schemas. Every content file is checked against these rules at build time.
 * If a file is wrong (missing field, bad date, broken image path) the build stops
 * and tells you which file and which field to fix.
 */
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Example content (fake shows, products, releases) lives in each folder's examples/ subfolder.
// It is loaded (so you can copy it as a template) but only SHOWN when EXAMPLES=1,
// e.g. `npm run dev:examples`. It is never published. See src/lib/data.ts.
/** Same as Astro's glob loader, but an empty folder (e.g. no shows yet) is normal, not a warning. */
const quietGlob = (opts: Parameters<typeof glob>[0]) => {
  const g = glob(opts);
  return {
    ...g,
    load: (ctx: Parameters<typeof g.load>[0]) => g.load({
      ...ctx,
      logger: new Proxy(ctx.logger, {
        get(target, prop) {
          if (prop === 'warn') return (msg: string) => { if (!String(msg).includes('No files found')) target.warn(msg); };
          const v = Reflect.get(target, prop);
          return typeof v === 'function' ? v.bind(target) : v;
        },
      }),
    }),
  };
};

const withExamples = (pattern: string) => [pattern, `examples/${pattern}`];

const langs = ['en', 'fr', 'ro', 'it', 'es', 'ar', 'ru', 'el'] as const;
/** Text in several languages. English is required; missing languages fall back to English. */
const localized = z.object({
  en: z.string().min(1),
  ...Object.fromEntries(langs.slice(1).map((l) => [l, z.string().min(1).optional()])),
}) as unknown as z.ZodType<{ en: string } & Partial<Record<(typeof langs)[number], string>>>;

const url = z.url({ protocol: /^https$/, message: 'Must be a full https:// link' });
const optionalUrl = url.nullable().default(null);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD');
const localDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Use the format YYYY-MM-DDTHH:MM (venue local time)');
const timeZone = z.string().refine((tz) => {
  try { new Intl.DateTimeFormat('en', { timeZone: tz }); return true; } catch { return false; }
}, 'Use an IANA time zone like Europe/Bucharest');

const band = defineCollection({
  loader: glob({ pattern: 'band.json', base: './src/content/band' }),
  schema: z.object({
    name: z.literal('Bleeding Debts 316'),
    alternateName: z.array(z.string()),
    genre: z.array(z.string()).min(1),
    city: z.string().nullable(),
    region: z.string().nullable(),
    country: z.string(),
    countryCode: z.string().length(2),
    foundingYear: z.number().int().min(1950).max(2100).nullable(),
    email: z.email(),
    bookingEmail: z.email(),
    pressEmail: z.email(),
    shopEmail: z.email(),
    tagline: localized,
    shortBio: localized,
    creed: localized,
    hashtags: z.array(z.string()),
    /** Official profiles. Leave null until the profile exists. Used for footer icons, schema sameAs and the /links page. */
    profiles: z.object({
      spotify: optionalUrl, appleMusic: optionalUrl, youtube: optionalUrl, youtubeMusic: optionalUrl,
      instagram: optionalUrl, facebook: optionalUrl, tiktok: optionalUrl, bandcamp: optionalUrl,
      soundcloud: optionalUrl, deezer: optionalUrl, amazonMusic: optionalUrl, tidal: optionalUrl,
      x: optionalUrl, threads: optionalUrl, linktree: optionalUrl,
      wikidata: optionalUrl, musicbrainz: optionalUrl, discogs: optionalUrl, bandsintown: optionalUrl, songkick: optionalUrl,
    }),
  }),
});

const settings = defineCollection({
  loader: glob({ pattern: 'site.json', base: './src/content/settings' }),
  schema: z.object({
    legalEntity: z.object({
      name: z.string(), type: z.string(), cui: z.string(), regCom: z.string(), address: z.string(),
      phone: z.string().nullable(), vatPayer: z.boolean(),
      // false = the company details stay private (not shown on the site). Set true when the shop opens: Romanian law then requires them.
      showOnSite: z.boolean().default(false),
    }),
    services: z.object({
      brevoFormAction: optionalUrl,
      web3formsEnabled: z.boolean(),
      /** Web3Forms access key (public by design: it only lets people send messages TO your inbox). */
      web3formsAccessKey: z.string().uuid().nullable().default(null),
      turnstileSiteKey: z.string().nullable(),
      cloudflareAnalyticsToken: z.string().nullable(),
      googleSiteVerification: z.string().nullable(),
      bingSiteVerification: z.string().nullable(),
      /** Ko-fi page for the Support box (https://ko-fi.com/yourname). The box stays hidden until this is set. */
      kofiUrl: optionalUrl,
    }),
    shipping: z.object({
      romaniaRON: z.number().nonnegative(), europeEUR: z.number().nonnegative(),
      romaniaDays: z.tuple([z.number().int(), z.number().int()]), europeDays: z.tuple([z.number().int(), z.number().int()]),
      countries: z.array(z.string().length(2)).min(1),
      returnDays: z.number().int().min(14),
    }),
    utm: z.object({ source: z.string(), medium: z.string(), campaign: z.string() }),
  }),
});

const members = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/members' }),
  schema: ({ image }) => z.object({
    name: z.string().min(1),
    role: localized,
    order: z.number().int(),
    photo: image().optional(),
    photoAlt: localized.optional(),
    bio: localized.optional(),
  }),
});

const releases = defineCollection({
  loader: quietGlob({ pattern: withExamples('*.json'), base: './src/content/releases' }),
  schema: ({ image }) => z.object({
    title: z.string().min(1),
    type: z.enum(['album', 'ep', 'single']),
    date: isoDate,
    cover: image(),
    /** One or two punchy sentences (also the Google description of the song page). */
    hook: localized.optional(),
    description: localized.optional(),
    hashtags: z.array(z.string().regex(/^#\w+$/, 'Hashtags start with # and have no spaces')).default([]),
    tracks: z.array(z.object({
      title: z.string().min(1),
      duration: z.string().regex(/^PT(\d+M)?(\d+S)?$/, 'Use ISO 8601 like PT3M45S').optional(),
      isrc: z.string().regex(/^[A-Z]{2}[A-Z0-9]{3}\d{7}$/, 'ISRC like ROA012500001').optional(),
    })).min(1),
    links: z.object({
      spotify: optionalUrl, appleMusic: optionalUrl, youtubeMusic: optionalUrl, bandcamp: optionalUrl,
      deezer: optionalUrl, amazonMusic: optionalUrl, tidal: optionalUrl, soundcloud: optionalUrl, youtube: optionalUrl,
    }),
    /** YouTube id of the official video (shown on the song page, click to play). */
    youtubeId: z.string().regex(/^[A-Za-z0-9_-]{11}$/).optional(),
    /** Spotify album/track id, e.g. "4aawyAB9vmqN3uQ7FjRGTy" (for the click-to-load player). */
    spotifyEmbed: z.string().regex(/^(album|track)\/[A-Za-z0-9]{22}$/, 'Use album/<id> or track/<id>').optional(),
    /** SoundCloud track or playlist link (for the click-to-load player), e.g. https://soundcloud.com/bleedingdebts316/song */
    soundcloudEmbed: url.optional(),
    /** Bandcamp album id number (for the click-to-load player). */
    bandcampAlbumId: z.string().regex(/^\d+$/).optional(),
    upc: z.string().optional(),
  }),
});

const shows = defineCollection({
  loader: quietGlob({ pattern: withExamples('*.json'), base: './src/content/shows' }),
  schema: ({ image }) => z.object({
    name: z.string().optional(),
    start: localDateTime,
    end: localDateTime.optional(),
    doors: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    timeZone,
    status: z.enum(['scheduled', 'cancelled', 'postponed', 'rescheduled', 'soldout']).default('scheduled'),
    venue: z.object({
      name: z.string().min(1), street: z.string().min(1), city: z.string().min(1),
      region: z.string().optional(), postalCode: z.string().optional(), country: z.string().length(2),
      url: url.optional(),
    }),
    ticketUrl: optionalUrl,
    free: z.boolean().default(false),
    price: z.object({ amount: z.number().nonnegative(), currency: z.string().length(3) }).nullable().default(null),
    lineup: z.array(z.string()).default([]),
    notes: localized.optional(),
    image: image().optional(),
  }).refine((s) => s.free || s.ticketUrl || s.status !== 'scheduled', { message: 'A scheduled show needs a ticketUrl or "free": true' }),
});

const merch = defineCollection({
  loader: quietGlob({ pattern: withExamples('*.json'), base: './src/content/merch' }),
  schema: ({ image }) => z.object({
    name: localized,
    description: localized,
    sku: z.string().min(1),
    images: z.array(image()).min(1),
    imageAlt: localized,
    priceRON: z.number().positive(),
    priceEUR: z.number().positive(),
    sizes: z.array(z.string()).default([]),
    /** Stripe Payment Link. One for the product, or one per size ({"S": "https://buy.stripe.com/…"}). */
    stripeLink: z.union([url, z.record(z.string(), url)]),
    inStock: z.boolean().default(true),
    order: z.number().int().default(0),
  }),
});

const videos = defineCollection({
  loader: quietGlob({ pattern: withExamples('*.json'), base: './src/content/videos' }),
  schema: ({ image }) => z.object({
    /** Optional own thumbnail. If empty, the YouTube thumbnail is downloaded at build time and self-hosted. */
    thumbnail: image().optional(),
    youtubeId: z.string().regex(/^[A-Za-z0-9_-]{11}$/, 'The 11-character id from the YouTube link'),
    title: z.string().min(1),
    date: isoDate,
    description: localized.optional(),
    duration: z.string().regex(/^PT(\d+H)?(\d+M)?(\d+S)?$/).optional(),
    /** id of the song (file name in src/content/releases) this video belongs to */
    song: z.string().optional(),
  }),
});

const gallery = defineCollection({
  loader: quietGlob({ pattern: withExamples('*.json'), base: './src/content/gallery' }),
  schema: ({ image }) => z.object({
    image: image(),
    alt: localized,
    photographer: z.string().min(1),
    photographerUrl: url.optional(),
    date: isoDate.optional(),
    order: z.number().int().default(0),
  }),
});

const press = defineCollection({
  loader: quietGlob({ pattern: withExamples('*.json'), base: './src/content/press' }),
  schema: z.object({
    quote: z.string().min(1),
    quoteLang: z.enum(langs),
    source: z.string().min(1),
    url: url.optional(),
    date: isoDate.optional(),
  }),
});

const links = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/links' }),
  schema: z.object({
    label: localized,
    url: url.nullable(),
    icon: z.enum(['spotify', 'appleMusic', 'youtube', 'instagram', 'facebook', 'tiktok', 'bandcamp', 'linktree', 'shop', 'shows', 'mail', 'link', 'newsletter', 'soundcloud', 'deezer', 'x', 'threads']),
    order: z.number().int(),
    featured: z.boolean().default(false),
    /** Internal links (to this site) use a page key instead of a url. */
    page: z.enum(['music', 'shows', 'shop', 'newsletter', 'videos', 'press', 'contact']).optional(),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string().optional(),
    updated: z.coerce.date().transform((d) => d.toISOString().slice(0, 10)).optional(),
    status: z.enum(['source', 'needs native review', 'reviewed', 'needs legal review']).default('needs native review'),
  }),
});

export const collections = { band, settings, members, releases, shows, merch, videos, gallery, press, links, pages };
