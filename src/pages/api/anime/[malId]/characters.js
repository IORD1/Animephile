import { getAnimeCharacters } from '@/lib/db/collections';
import { getAnimeCharactersById } from '@/lib/jikan';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const malId = parseInt(req.query.malId, 10);
  if (Number.isNaN(malId)) {
    return res.status(400).json({ message: 'malId must be an integer' });
  }

  try {
    const col = await getAnimeCharacters();
    const cached = await col.findOne({ malId });
    if (cached) {
      return res.status(200).json({ characters: cached.characters, source: 'cache' });
    }

    let characters;
    try {
      characters = await getAnimeCharactersById(malId);
    } catch (err) {
      return res.status(404).json({ message: 'Characters not found on Jikan' });
    }

    await col.updateOne(
      { malId },
      { $set: { characters, cachedAt: new Date() } },
      { upsert: true },
    );

    res.status(200).json({ characters, source: 'fresh' });
  } catch (err) {
    console.error(`anime/${malId}/characters failed:`, err);
    res.status(500).json({ message: 'Failed to load characters' });
  }
}
