const JIKAN_BASE = 'https://api.jikan.moe/v4';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

async function jikanFetch(path) {
  const res = await fetch(`${JIKAN_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`Jikan ${path} failed: ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}

export function getTodayName() {
  return DAYS[new Date().getDay()];
}

export function getTopAnime(filter) {
  return jikanFetch(filter ? `/top/anime?filter=${encodeURIComponent(filter)}` : '/top/anime');
}

export function getScheduleForDay(day) {
  return jikanFetch(`/schedules/${day}`);
}

export function getTodaySchedule() {
  return getScheduleForDay(getTodayName());
}

export function getManga() {
  return jikanFetch('/manga');
}

export function getAnimeById(malId) {
  return jikanFetch(`/anime/${malId}`);
}

export function getAnimeEpisodesById(malId, page = 1) {
  return jikanFetch(`/anime/${malId}/episodes?page=${page}`);
}

export function getAnimeCharactersById(malId) {
  return jikanFetch(`/anime/${malId}/characters`);
}

export function getMangaById(malId) {
  return jikanFetch(`/manga/${malId}`);
}
