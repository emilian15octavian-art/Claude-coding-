/**
 * JSON-LD builders. Everything is emitted as one @graph per page, in the static HTML.
 * The MusicGroup @id is the same on every page and in every language, so search
 * engines see a single entity (important for the Knowledge Panel).
 */
import type { CollectionEntry } from 'astro:content';
import { locales, type Locale } from '../i18n/locales';
import { path } from '../i18n/routes';
import { pick, t } from '../i18n/t';
import { isPlaceholder, type Show } from './data';
import { isoWithOffset } from './format';

type Band = CollectionEntry<'band'>['data'];
type Settings = CollectionEntry<'settings'>['data'];
type Node = Record<string, unknown>;

export const ids = (site: string) => ({
  band: `${site}/#band`,
  website: `${site}/#website`,
  logo: `${site}/#logo`,
  release: (id: string) => `${site}/#release-${id}`,
  event: (id: string) => `${site}/#event-${id}`,
  product: (id: string) => `${site}/#product-${id}`,
  member: (n: number) => `${site}/#member-${n}`,
});

const clean = <T extends Node>(o: T): T => {
  for (const k of Object.keys(o)) {
    const v = o[k];
    if (v === undefined || v === null || (Array.isArray(v) && v.length === 0)) delete o[k];
  }
  return o;
};

export const musicGroup = (
  site: string, lang: Locale, band: Band, members: CollectionEntry<'members'>[],
  releases: CollectionEntry<'releases'>[], imageUrl: string,
): Node => {
  const I = ids(site);
  const sameAs = Object.entries(band.profiles).filter(([k, v]) => v && k !== 'linktree').map(([, v]) => v as string);
  if (band.profiles.linktree) sameAs.push(band.profiles.linktree);
  return clean({
    '@type': 'MusicGroup',
    '@id': I.band,
    name: band.name,
    alternateName: band.alternateName,
    url: `${site}/`,
    logo: { '@id': I.logo },
    image: imageUrl,
    description: pick(lang, band.shortBio),
    slogan: pick(lang, band.tagline),
    genre: band.genre,
    foundingDate: band.foundingYear ? String(band.foundingYear) : undefined,
    foundingLocation: clean({
      '@type': 'Place',
      name: [band.city, band.country].filter(Boolean).join(', '),
      address: clean({ '@type': 'PostalAddress', addressLocality: band.city ?? undefined, addressRegion: band.region ?? undefined, addressCountry: band.countryCode }),
    }),
    member: members.filter((m) => !isPlaceholder(m.data.name)).map((m) => ({
      '@type': 'OrganizationRole',
      roleName: pick(lang, m.data.role),
      member: { '@type': 'Person', '@id': I.member(m.data.order), name: m.data.name },
    })),
    album: releases.filter((r) => r.data.type !== 'single').map((r) => ({ '@id': I.release(r.id) })),
    track: releases.filter((r) => r.data.type === 'single').map((r) => ({ '@id': I.release(r.id) })),
    email: isPlaceholder(band.bookingEmail) ? undefined : `mailto:${band.bookingEmail}`,
    sameAs,
  });
};

export const logoNode = (site: string): Node => ({
  '@type': 'ImageObject', '@id': ids(site).logo, url: `${site}/press/logo/bleeding-debts-316-logo-on-black.png`,
  contentUrl: `${site}/press/logo/bleeding-debts-316-logo-on-black.png`, width: 3000, height: 1688, caption: 'Bleeding Debts 316',
});

export const website = (site: string, lang: Locale): Node => ({
  '@type': 'WebSite', '@id': ids(site).website, url: `${site}/`, name: 'Bleeding Debts 316',
  inLanguage: [...locales], publisher: { '@id': ids(site).band }, about: { '@id': ids(site).band },
  description: t(lang, 'pages.home.description'),
});

export const webPage = (site: string, lang: Locale, url: string, name: string, description: string, image: string, type = 'WebPage', hasBreadcrumb = false): Node =>
  clean({
    '@type': type, '@id': `${url}#webpage`, url, name, description, inLanguage: lang,
    isPartOf: { '@id': ids(site).website }, about: { '@id': ids(site).band },
    primaryImageOfPage: { '@type': 'ImageObject', url: image },
    breadcrumb: hasBreadcrumb ? { '@id': `${url}#breadcrumb` } : undefined,
  });

export const breadcrumbList = (url: string, items: Array<{ name: string; url: string }>): Node => ({
  '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`,
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })),
});

export const releaseNode = (site: string, lang: Locale, r: CollectionEntry<'releases'>, coverUrl: string): Node => {
  const I = ids(site);
  const listen = Object.values(r.data.links).filter(Boolean) as string[];
  const tracks = r.data.tracks.map((tr, i) => clean({
    '@type': 'MusicRecording', name: tr.title, position: i + 1, duration: tr.duration, isrcCode: tr.isrc, byArtist: { '@id': I.band },
  }));
  if (r.data.type === 'single') {
    const tr = r.data.tracks[0];
    return clean({
      '@type': 'MusicRecording', '@id': I.release(r.id), name: r.data.title, byArtist: { '@id': I.band },
      datePublished: r.data.date, duration: tr.duration, isrcCode: tr.isrc, image: coverUrl, url: `${site}${path('music', lang)}#${r.id}`, sameAs: listen,
    });
  }
  return clean({
    '@type': 'MusicAlbum', '@id': I.release(r.id), name: r.data.title, byArtist: { '@id': I.band },
    datePublished: r.data.date, image: coverUrl, url: `${site}${path('music', lang)}#${r.id}`,
    albumProductionType: 'https://schema.org/StudioAlbum',
    albumReleaseType: r.data.type === 'ep' ? 'https://schema.org/EPRelease' : 'https://schema.org/AlbumRelease',
    numTracks: r.data.tracks.length, track: { '@type': 'ItemList', numberOfItems: tracks.length, itemListElement: tracks.map((x, i) => ({ '@type': 'ListItem', position: i + 1, item: x })) },
    description: r.data.description ? pick(lang, r.data.description) : undefined, sameAs: listen,
  });
};

const eventStatus: Record<string, string> = {
  scheduled: 'https://schema.org/EventScheduled', soldout: 'https://schema.org/EventScheduled', cancelled: 'https://schema.org/EventCancelled',
  postponed: 'https://schema.org/EventPostponed', rescheduled: 'https://schema.org/EventRescheduled',
};

export const eventNode = (site: string, lang: Locale, s: Show, imageUrl: string, name: string, pageUrl: string): Node => {
  const d = s.data;
  return clean({
    '@type': 'MusicEvent', '@id': ids(site).event(s.id), name,
    startDate: isoWithOffset(d.start, d.timeZone), endDate: d.end ? isoWithOffset(d.end, d.timeZone) : undefined,
    doorTime: d.doors ? isoWithOffset(`${d.start.slice(0, 10)}T${d.doors}`, d.timeZone) : undefined,
    eventStatus: eventStatus[d.status], eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: clean({
      '@type': 'Place', name: d.venue.name, url: d.venue.url,
      address: clean({ '@type': 'PostalAddress', streetAddress: d.venue.street, addressLocality: d.venue.city, addressRegion: d.venue.region, postalCode: d.venue.postalCode, addressCountry: d.venue.country }),
    }),
    performer: [{ '@id': ids(site).band }, ...d.lineup.filter((n) => n !== 'Bleeding Debts 316').map((n) => ({ '@type': 'MusicGroup', name: n }))],
    organizer: { '@id': ids(site).band },
    image: [imageUrl], url: `${pageUrl}#${s.id}`,
    description: d.notes ? pick(lang, d.notes) : name,
    offers: clean({
      '@type': 'Offer', url: d.ticketUrl ?? `${pageUrl}#${s.id}`,
      price: d.free ? 0 : d.price?.amount, priceCurrency: d.free ? (d.price?.currency ?? 'RON') : d.price?.currency,
      availability: d.status === 'soldout' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
      validFrom: undefined,
    }),
    isAccessibleForFree: d.free || undefined,
  });
};

export const productNode = (site: string, lang: Locale, p: CollectionEntry<'merch'>, imageUrls: string[], pageUrl: string, settings: Settings): Node => {
  const d = p.data;
  const sh = settings.shipping;
  const shipping = [
    { country: 'RO', value: sh.romaniaRON, currency: 'RON', days: sh.romaniaDays },
    ...sh.countries.filter((c) => c !== 'RO').map((c) => ({ country: c, value: sh.europeEUR, currency: 'EUR', days: sh.europeDays })),
  ];
  return {
    '@type': 'Product', '@id': ids(site).product(p.id), name: pick(lang, d.name), description: pick(lang, d.description),
    sku: d.sku, image: imageUrls, brand: { '@type': 'Brand', name: 'Bleeding Debts 316' }, url: `${pageUrl}#${p.id}`,
    ...(d.sizes.length ? { size: d.sizes } : {}),
    offers: {
      '@type': 'Offer', url: `${pageUrl}#${p.id}`, price: d.priceRON.toFixed(2), priceCurrency: 'RON',
      availability: d.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': ids(site).band },
      shippingDetails: shipping.slice(0, 2).map((s, i) => ({
        '@type': 'OfferShippingDetails',
        shippingRate: { '@type': 'MonetaryAmount', value: s.value, currency: s.currency },
        shippingDestination: i === 0
          ? { '@type': 'DefinedRegion', addressCountry: 'RO' }
          : sh.countries.filter((c) => c !== 'RO').map((c) => ({ '@type': 'DefinedRegion', addressCountry: c })),
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 2, unitCode: 'DAY' },
          transitTime: { '@type': 'QuantitativeValue', minValue: s.days[0], maxValue: s.days[1], unitCode: 'DAY' },
        },
      })),
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy', applicableCountry: sh.countries,
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow', merchantReturnDays: sh.returnDays,
        returnMethod: 'https://schema.org/ReturnByMail', returnFees: 'https://schema.org/ReturnShippingFees',
        merchantReturnLink: `${site}${path('shipping', lang)}`,
      },
    },
  };
};
