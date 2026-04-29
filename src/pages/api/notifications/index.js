import { getNotifications, getUsers } from '@/lib/db/collections';

const VALID_TYPES = new Set(['episode', 'finale', 'digest', 'news']);

async function findUserId(firebaseUid) {
  if (!firebaseUid) return null;
  const users = await getUsers();
  const user = await users.findOne({ firebaseUid });
  return user ? user._id : null;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { firebaseUid, type, unreadOnly, countOnly, limit } = req.query;
  if (!firebaseUid || typeof firebaseUid !== 'string') {
    return res.status(400).json({ message: 'firebaseUid query param required' });
  }

  try {
    const userId = await findUserId(firebaseUid);
    if (!userId) {
      return res.status(200).json({ notifications: [], unreadCount: 0, total: 0 });
    }

    const match = { userId };
    if (typeof type === 'string' && VALID_TYPES.has(type)) {
      match.type = type;
    }
    if (unreadOnly === '1' || unreadOnly === 'true') {
      match.$or = [{ readAt: null }, { readAt: { $exists: false } }];
    }

    const notifications = await getNotifications();

    if (countOnly === '1' || countOnly === 'true') {
      const unreadCount = await notifications.countDocuments({
        userId,
        $or: [{ readAt: null }, { readAt: { $exists: false } }],
      });
      return res.status(200).json({ unreadCount });
    }

    const cap = Math.min(parseInt(limit, 10) || 50, 200);
    const docs = await notifications
      .aggregate([
        { $match: match },
        { $sort: { sentAt: -1 } },
        { $limit: cap },
        {
          $lookup: {
            from: 'animes',
            localField: 'malId',
            foreignField: 'malId',
            as: 'animeDocs',
          },
        },
        {
          $addFields: {
            anime: { $arrayElemAt: ['$animeDocs', 0] },
          },
        },
        {
          $project: {
            animeDocs: 0,
            'anime.rawJikan': 0,
          },
        },
      ])
      .toArray();

    const unreadCount = await notifications.countDocuments({
      userId,
      $or: [{ readAt: null }, { readAt: { $exists: false } }],
    });

    res.status(200).json({ notifications: docs, unreadCount, total: docs.length });
  } catch (err) {
    console.error('notifications list failed:', err);
    res.status(500).json({ message: 'Failed to load notifications' });
  }
}
