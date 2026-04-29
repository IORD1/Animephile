import { getMangas } from '@/lib/db/collections';
import { getMangaById } from '@/lib/jikan';
import { jikanToMangaDoc } from '@/lib/anime-utils';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const malId = parseInt(req.query.id, 10);
  if (Number.isNaN(malId)) {
    return res.status(400).json({ message: 'id must be an integer' });
  }

  try {
    const mangas = await getMangas();
    let manga = await mangas.findOne({ malId });

    if (!manga) {
      let item;
      try {
        item = await getMangaById(malId);
      } catch (err) {
        return res.status(404).json({ message: 'Manga not found on Jikan' });
      }
      const doc = jikanToMangaDoc(item);
      const now = new Date();
      await mangas.updateOne(
        { malId },
        { $set: { ...doc, refreshedAt: now }, $setOnInsert: { cachedAt: now } },
        { upsert: true },
      );
      manga = await mangas.findOne({ malId });
    }

    res.status(200).json({ manga });
  } catch (err) {
    console.error(`manga/${malId} failed:`, err);
    res.status(500).json({ message: 'Failed to load manga' });
  }
}
