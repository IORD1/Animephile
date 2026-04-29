import { getCachedJikan, RESOLVE_ENDPOINTS } from '@/lib/jikan-cache';

export default async function handler(req, res) {
  const { type } = req.query;
  const resolver = RESOLVE_ENDPOINTS[type];

  if (!resolver) {
    return res.status(400).json({
      message: `type must be one of: ${Object.keys(RESOLVE_ENDPOINTS).join(', ')}`,
    });
  }

  try {
    const result = await getCachedJikan(resolver());
    res.status(200).json(result);
  } catch (err) {
    console.error(`browse/${type} failed:`, err);
    res.status(500).json({ message: 'Failed to load' });
  }
}
