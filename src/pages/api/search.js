import { getAnimes } from '@/lib/db/collections';

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseList(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  return String(raw).split(',').map((s) => s.trim()).filter(Boolean);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const genres = parseList(req.query.genre);
  const statuses = parseList(req.query.status);
  const minScore = req.query.minScore ? Number(req.query.minScore) : null;
  const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const skip = (page - 1) * limit;

  try {
    const animes = await getAnimes();
    const t0 = Date.now();

    const baseFilter = {};
    if (genres.length) baseFilter.genres = { $in: genres };
    if (statuses.length) baseFilter.status = { $in: statuses };
    if (minScore != null && !Number.isNaN(minScore)) {
      baseFilter.score = { $gte: minScore };
    }

    let results = [];
    let total = 0;

    if (q) {
      try {
        const filter = { ...baseFilter, $text: { $search: q } };
        const cursor = animes
          .find(filter, { projection: { rawJikan: 0, _searchScore: { $meta: 'textScore' } } })
          .sort({ _searchScore: { $meta: 'textScore' } })
          .skip(skip)
          .limit(limit);
        results = await cursor.toArray();
        total = await animes.countDocuments(filter);
      } catch {
        const regex = new RegExp(escapeRegex(q), 'i');
        const filter = {
          ...baseFilter,
          $or: [{ title: regex }, { titleEnglish: regex }, { titleJapanese: regex }],
        };
        results = await animes
          .find(filter, { projection: { rawJikan: 0 } })
          .sort({ score: -1 })
          .skip(skip)
          .limit(limit)
          .toArray();
        total = await animes.countDocuments(filter);
      }
    } else {
      const sortFilter = { ...baseFilter, score: { ...(baseFilter.score || {}), $ne: null } };
      results = await animes
        .find(sortFilter, { projection: { rawJikan: 0 } })
        .sort({ score: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
      total = await animes.countDocuments(sortFilter);
    }

    const facets = await animes
      .aggregate([
        { $match: baseFilter },
        {
          $facet: {
            genres: [
              { $unwind: '$genres' },
              { $group: { _id: '$genres', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 12 },
            ],
            statuses: [
              { $group: { _id: '$status', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 8 },
            ],
          },
        },
      ])
      .toArray();

    const took = Date.now() - t0;
    res.status(200).json({
      results,
      total,
      took,
      page,
      limit,
      facets: facets[0] || { genres: [], statuses: [] },
      query: { q, genres, statuses, minScore },
    });
  } catch (err) {
    console.error('search failed:', err);
    res.status(500).json({ message: 'Search failed', error: err.message });
  }
}
