import { getJikanCache } from './db/collections';
import { getTopAnime, getScheduleForDay, getTodayName, getManga } from './jikan';

const TTL_DAY = 24 * 60 * 60;
const TTL_HOUR = 60 * 60;

function fetcherFor(endpoint) {
  if (endpoint === 'top/anime') return getTopAnime;
  if (endpoint === 'top/anime?filter=airing') return () => getTopAnime('airing');
  if (endpoint === 'manga') return getManga;
  if (endpoint.startsWith('schedules/')) {
    const day = endpoint.slice('schedules/'.length);
    return () => getScheduleForDay(day);
  }
  throw new Error(`unknown endpoint: ${endpoint}`);
}

function ttlFor(endpoint) {
  if (endpoint === 'top/anime') return TTL_DAY;
  if (endpoint === 'top/anime?filter=airing') return TTL_DAY;
  if (endpoint === 'manga') return TTL_DAY;
  if (endpoint.startsWith('schedules/')) return TTL_HOUR;
  throw new Error(`unknown endpoint: ${endpoint}`);
}

async function refresh(endpoint) {
  const data = await fetcherFor(endpoint)();
  const now = new Date();
  const cache = await getJikanCache();
  await cache.updateOne(
    { endpoint },
    { $set: { data, fetchedAt: now, ttlSeconds: ttlFor(endpoint) } },
    { upsert: true }
  );
  return { data, fetchedAt: now };
}

export async function getCachedJikan(endpoint) {
  const cache = await getJikanCache();
  const cached = await cache.findOne({ endpoint });

  if (!cached) {
    const refreshed = await refresh(endpoint);
    return { ...refreshed, stale: false };
  }

  const ageSec = (Date.now() - cached.fetchedAt.getTime()) / 1000;
  const stale = ageSec > cached.ttlSeconds;

  if (stale) {
    refresh(endpoint).catch((err) =>
      console.error(`background refresh failed for ${endpoint}:`, err)
    );
  }

  return { data: cached.data, fetchedAt: cached.fetchedAt, stale };
}

export const RESOLVE_ENDPOINTS = {
  top: () => 'top/anime',
  airing: () => 'top/anime?filter=airing',
  today: () => `schedules/${getTodayName()}`,
  manga: () => 'manga',
};
