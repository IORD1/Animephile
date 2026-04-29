export function getPosterUrl(item) {
  return (
    item?.images?.webp?.large_image_url ||
    item?.images?.jpg?.large_image_url ||
    item?.imageUrl ||
    null
  );
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
