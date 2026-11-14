// Check 6: structured data (JSON-LD). Every block parses, uses real Schema.org types, includes the fields
// Google requires for MusicGroup, MusicEvent and Product, and the band has the same @id everywhere.
import fs from 'node:fs';
import { htmlFiles, requireDist, result, urlOf } from './lib.mjs';

const r = result('jsonld', 'Structured data: valid JSON-LD with Google-required fields');
requireDist(r);
const types = new Set(['WebSite', 'FAQPage', 'Question', 'Answer', 'WebPage', 'AboutPage', 'ContactPage', 'CollectionPage', 'ItemPage', 'BreadcrumbList', 'ListItem', 'MusicGroup', 'Person', 'OrganizationRole',
  'ImageObject', 'Place', 'PostalAddress', 'MusicAlbum', 'MusicRecording', 'ItemList', 'MusicEvent', 'Offer', 'Product', 'Brand', 'OfferShippingDetails',
  'MonetaryAmount', 'DefinedRegion', 'ShippingDeliveryTime', 'QuantitativeValue', 'MerchantReturnPolicy', 'VideoObject']);
const bandIds = new Set();
const get = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
const require = (page, node, fields) => {
  for (const f of fields) if (get(node, f) === undefined || get(node, f) === '') r.error(`${page}: ${node['@type']} "${node.name ?? node['@id'] ?? ''}" is missing "${f}"`, 'Fill in the matching field in the content file (src/content/…).');
};
let blocks = 0;
for (const f of htmlFiles()) {
  const page = urlOf(f);
  const html = fs.readFileSync(f, 'utf8');
  if (/name="robots" content="noindex/.test(html)) continue; // private pages (e.g. /admin/) have no search data
  const found = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (!found.length && !page.includes('404')) r.error(`${page}: no JSON-LD found`, 'Every page should render the schema graph from src/layouts/Base.astro.');
  for (const m of found) {
    blocks++;
    let data;
    try { data = JSON.parse(m[1]); } catch (e) { r.error(`${page}: JSON-LD does not parse: ${e.message}`, 'A text field probably contains a broken character; check recent content edits.'); continue; }
    if (data['@context'] !== 'https://schema.org') r.error(`${page}: @context must be https://schema.org`);
    const nodes = [];
    const walk = (n) => { if (Array.isArray(n)) n.forEach(walk); else if (n && typeof n === 'object') { if (n['@type']) nodes.push(n); Object.values(n).forEach(walk); } };
    walk(data['@graph'] ?? data);
    for (const n of nodes) {
      for (const t of [n['@type']].flat()) if (!types.has(t)) r.error(`${page}: unknown or unexpected Schema.org type "${t}"`, 'Use a valid type from schema.org.');
      if (n['@type'] === 'MusicGroup' && n['@id']) { bandIds.add(n['@id']); require(page, n, ['name', 'url', 'logo', 'image', 'description', 'genre']); }
      if (n['@type'] === 'MusicEvent') {
        require(page, n, ['name', 'startDate', 'location.name', 'location.address.addressLocality', 'location.address.addressCountry', 'eventStatus', 'eventAttendanceMode', 'performer', 'image', 'offers.url', 'offers.availability']);
        if (n.startDate && !/T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(n.startDate)) r.error(`${page}: MusicEvent startDate "${n.startDate}" has no time zone offset`);
      }
      if (n['@type'] === 'Product') require(page, n, ['name', 'image', 'description', 'offers.price', 'offers.priceCurrency', 'offers.availability', 'offers.shippingDetails', 'offers.hasMerchantReturnPolicy']);
      if (n['@type'] === 'MusicAlbum' || n['@type'] === 'MusicRecording') { if (n['@id']) require(page, n, ['name', 'datePublished', 'byArtist']); }
      if (n['@type'] === 'BreadcrumbList') require(page, n, ['itemListElement']);
      if (n['@type'] === 'WebSite' && (!Array.isArray(n.inLanguage) || n.inLanguage.length !== 8)) r.error(`${page}: WebSite.inLanguage must list all 8 languages`);
    }
  }
}
if (bandIds.size !== 1) r.error(`The MusicGroup @id differs between pages (${[...bandIds].join(', ')})`, 'Google must see one band entity. The @id is set in src/lib/schema.ts; it must not depend on the language.');
r.note(`${blocks} JSON-LD blocks checked. For a final check, paste a page URL into https://search.google.com/test/rich-results after deploying.`);
r.finish();
