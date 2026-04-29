import { getDb } from '../mongo';

export async function getUsers() {
  return (await getDb()).collection('users');
}

export async function getSubscriptions() {
  return (await getDb()).collection('subscriptions');
}

export async function getAnimes() {
  return (await getDb()).collection('animes');
}

export async function getJikanCache() {
  return (await getDb()).collection('jikanCache');
}

export async function getNotifications() {
  return (await getDb()).collection('notifications');
}

let episodesIndexEnsured = false;
export async function getAnimeEpisodes() {
  const col = (await getDb()).collection('animeEpisodes');
  if (!episodesIndexEnsured) {
    await col.createIndex({ malId: 1 }, { unique: true, name: 'malId_unique' });
    episodesIndexEnsured = true;
  }
  return col;
}

let charactersIndexEnsured = false;
export async function getAnimeCharacters() {
  const col = (await getDb()).collection('animeCharacters');
  if (!charactersIndexEnsured) {
    await col.createIndex({ malId: 1 }, { unique: true, name: 'malId_unique' });
    charactersIndexEnsured = true;
  }
  return col;
}

let mangasIndexEnsured = false;
export async function getMangas() {
  const col = (await getDb()).collection('mangas');
  if (!mangasIndexEnsured) {
    await col.createIndex({ malId: 1 }, { unique: true, name: 'malId_unique' });
    mangasIndexEnsured = true;
  }
  return col;
}
