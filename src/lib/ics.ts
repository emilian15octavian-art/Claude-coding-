/** Minimal RFC 5545 calendar file for one show (with the venue's time zone as UTC times). */
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
const utc = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
/** Fold lines longer than 75 octets, as the standard requires. */
const fold = (line: string) => {
  const out: string[] = [];
  let cur = '';
  for (const ch of line) {
    if (Buffer.byteLength(cur + ch) > 74) { out.push(cur); cur = ' ' + ch; } else cur += ch;
  }
  out.push(cur);
  return out.join('\r\n');
};
export const buildIcs = (o: { uid: string; start: Date; end: Date; title: string; location: string; description: string; url: string; cancelled?: boolean }) =>
  [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Bleeding Debts 316//Shows//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT', `UID:${o.uid}`, `DTSTAMP:${utc(new Date())}`, `DTSTART:${utc(o.start)}`, `DTEND:${utc(o.end)}`,
    `SUMMARY:${esc(o.title)}`, `LOCATION:${esc(o.location)}`, `DESCRIPTION:${esc(o.description)}`, `URL:${o.url}`,
    `STATUS:${o.cancelled ? 'CANCELLED' : 'CONFIRMED'}`, 'END:VEVENT', 'END:VCALENDAR', '',
  ].map(fold).join('\r\n');
