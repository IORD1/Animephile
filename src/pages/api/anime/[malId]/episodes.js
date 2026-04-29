import { getAnimeEpisodes } from '@/lib/db/collections';
import { getAnimeEpisodesById } from '@/lib/jikan';

const TTL_MS = 24 * 60 * 60 * 1000;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const malId = parseInt(req.query.malId, 10);
  if (Number.isNaN(malId)) {
    return res.status(400).json({ message: 'malId must be an integer' });
  }

  try {
    const col = await getAnimeEpisodes();
    const cached = await col.findOne({ malId });
    const fresh = cached && Date.now() - new Date(cached.cachedAt).getTime() < TTL_MS;

    if (fresh) {
      return res.status(200).json({ episodes: cached.episodes, source: 'cache' });
    }

    let episodes;
    try {
      episodes = await getAnimeEpisodesById(malId, 1);
    } catch (err) {
      if (cached) {
        return res.status(200).json({ episodes: cached.episodes, source: 'stale-cache' });
      }
      return res.status(404).json({ message: 'Episodes not found on Jikan' });
    }

    const now = new Date();
    await col.updateOne(
      { malId },
      { $set: { episodes, cachedAt: now } },
      { upsert: true },
    );

    res.status(200).json({ episodes, source: 'fresh' });
  } catch (err) {
    console.error(`anime/${malId}/episodes failed:`, err);
    res.status(500).json({ message: 'Failed to load episodes' });
  }
}
