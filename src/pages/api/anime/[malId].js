import { getAnimes } from '@/lib/db/collections';
import { getAnimeById } from '@/lib/jikan';
import { jikanToAnimeDoc } from '@/lib/anime-utils';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const malId = parseInt(req.query.malId, 10);
  if (Number.isNaN(malId)) {
    return res.status(400).json({ message: 'malId must be an integer' });
  }

  try {
    const animes = await getAnimes();
    let anime = await animes.findOne({ malId });

    if (!anime) {
      let item;
      try {
        item = await getAnimeById(malId);
      } catch (err) {
        return res.status(404).json({ message: 'Anime not found on Jikan' });
      }
      const doc = jikanToAnimeDoc(item);
      const now = new Date();
      await animes.updateOne(
        { malId },
        { $set: { ...doc, refreshedAt: now }, $setOnInsert: { cachedAt: now } },
        { upsert: true }
      );
      anime = await animes.findOne({ malId });
    }

    res.status(200).json({ anime });
  } catch (err) {
    console.error(`anime/${malId} failed:`, err);
    res.status(500).json({ message: 'Failed to load anime' });
  }
}
