import type { APIRoute } from 'astro';
import pkg from '../../package.json';
import { locales } from '../i18n/locales';
import { indexablePages } from '../i18n/routes';
import { getGallery, getMerch, getReleases, getShows, getVideos } from '../lib/data';

/** /health.json: read by the uptime monitor to confirm the latest build is live. */
export const GET: APIRoute = async () => {
  const [releases, shows, merch, videos, gallery] = await Promise.all([getReleases(), getShows(), getMerch(), getVideos(), getGallery()]);
  const body = {
    status: 'ok',
    builtAt: new Date().toISOString(),
    version: pkg.version,
    commit: process.env.GITHUB_SHA ?? process.env.WORKERS_CI_COMMIT_SHA ?? process.env.CF_PAGES_COMMIT_SHA ?? 'local',
    languages: locales.length,
    pages: indexablePages.length * locales.length + 1,
    content: { releases: releases.length, upcomingShows: shows.upcoming.length, pastShows: shows.past.length, products: merch.length, videos: videos.length, photos: gallery.length },
  };
  return new Response(JSON.stringify(body, null, 2), { headers: { 'Content-Type': 'application/json' } });
};
