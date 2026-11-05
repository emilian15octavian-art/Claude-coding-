import type { APIRoute, GetStaticPaths } from 'astro';
import { getShows } from '../../lib/data';
import { buildIcs } from '../../lib/ics';

export const getStaticPaths: GetStaticPaths = async () => {
  const { all } = await getShows();
  return all.map((show) => ({ params: { id: show.id }, props: { show } }));
};

export const GET: APIRoute = ({ props, site }) => {
  const { show } = props as { show: Awaited<ReturnType<typeof getShows>>['all'][number] };
  const d = show.data;
  const v = d.venue;
  const body = buildIcs({
    uid: `${show.id}@${site!.host}`, start: show.startDate, end: show.endDate,
    title: d.name ?? `Bleeding Debts 316 · ${v.city}`,
    location: [v.name, v.street, v.postalCode, v.city, v.country].filter(Boolean).join(', '),
    description: d.ticketUrl ? `Tickets: ${d.ticketUrl}` : 'Bleeding Debts 316',
    url: new URL('/en/shows/', site).toString(), cancelled: d.status === 'cancelled',
  });
  return new Response(body, { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
};
