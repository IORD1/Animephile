export function getPosterUrl(item) {
  return (
    item?.images?.webp?.large_image_url ||
    item?.images?.jpg?.large_image_url ||
    item?.imageUrl ||
    null
  );
}

export function dedupeAnime(items) {
  const seenIds = new Set();
  const seenTitles = new Set();
  return (items || []).filter((t) => {
    const key = (t.title_english || t.title || '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (t.mal_id != null && seenIds.has(t.mal_id)) return false;
    if (key && seenTitles.has(key)) return false;
    if (t.mal_id != null) seenIds.add(t.mal_id);
    if (key) seenTitles.add(key);
    return true;
  });
}

export function sortByScore(items) {
  return [...(items || [])].sort((a, b) => {
    const sa = typeof a?.score === 'number' ? a.score : -Infinity;
    const sb = typeof b?.score === 'number' ? b.score : -Infinity;
    return sb - sa;
  });
}

export function jikanToMangaDoc(item) {
  return {
    malId: item.mal_id,
    title: item.title,
    titleEnglish: item.title_english || null,
    titleJapanese: item.title_japanese || null,
    synopsis: item.synopsis || null,
    background: item.background || null,
    imageUrl:
      item.images?.webp?.large_image_url ||
      item.images?.jpg?.large_image_url ||
      null,
    score: typeof item.score === 'number' ? item.score : null,
    chapters: typeof item.chapters === 'number' ? item.chapters : null,
    volumes: typeof item.volumes === 'number' ? item.volumes : null,
    status: item.status || null,
    publishing: !!item.publishing,
    published: item.published?.string || null,
    authors: Array.isArray(item.authors) ? item.authors.map((a) => a.name) : [],
    serializations: Array.isArray(item.serializations)
      ? item.serializations.map((s) => s.name)
      : [],
    genres: Array.isArray(item.genres) ? item.genres.map((g) => g.name) : [],
    themes: Array.isArray(item.themes) ? item.themes.map((t) => t.name) : [],
    rawJikan: item,
  };
}

export function jikanToAnimeDoc(item) {
  return {
    malId: item.mal_id,
    title: item.title,
    titleEnglish: item.title_english || null,
    titleJapanese: item.title_japanese || null,
    synopsis: item.synopsis || null,
    imageUrl:
      item.images?.webp?.large_image_url ||
      item.images?.jpg?.large_image_url ||
      null,
    trailerUrl: item.trailer?.url || null,
    score: typeof item.score === 'number' ? item.score : null,
    episodes: typeof item.episodes === 'number' ? item.episodes : null,
    status: item.status || null,
    broadcast: {
      day: item.broadcast?.day || null,
      time: item.broadcast?.time || null,
      timezone: item.broadcast?.timezone || null,
      string: item.broadcast?.string || null,
    },
    airing: !!item.airing,
    genres: Array.isArray(item.genres) ? item.genres.map((g) => g.name) : [],
    rawJikan: item,
  };
}
