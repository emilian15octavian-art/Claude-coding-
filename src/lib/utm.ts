/** Add UTM tracking parameters to an outgoing link (used on the /links page). */
export const withUtm = (href: string, utm: { source: string; medium: string; campaign: string }, content?: string): string => {
  const u = new URL(href);
  u.searchParams.set('utm_source', utm.source);
  u.searchParams.set('utm_medium', utm.medium);
  u.searchParams.set('utm_campaign', utm.campaign);
  if (content) u.searchParams.set('utm_content', content);
  return u.toString();
};
