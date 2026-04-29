import { getUsers, getSubscriptions, getAnimes } from '@/lib/db/collections';
import { jikanToAnimeDoc } from '@/lib/anime-utils';

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const DEFAULT_PREFERENCES = {
  muted: false,
  preferredNotificationTime: '09:00',
  timezone: 'Asia/Kolkata',
  digestFrequency: 'per-episode',
};

async function upsertUser(firebaseUid, email) {
  const users = await getUsers();
  const now = new Date();
  await users.updateOne(
    { firebaseUid },
    {
      $set: {
        email,
        updatedAt: now,
        lastLoginAt: now,
        isAdmin: ADMIN_EMAILS.includes(email),
      },
      $setOnInsert: {
        firebaseUid,
        displayName: null,
        photoURL: null,
        preferences: DEFAULT_PREFERENCES,
        stats: { emailsSent: 0, lastNotifiedAt: null },
        createdAt: now,
      },
    },
    { upsert: true }
  );
  return users.findOne({ firebaseUid });
}

async function handleList(req, res) {
  const { firebaseUid } = req.query;
  if (!firebaseUid || typeof firebaseUid !== 'string') {
    return res.status(400).json({ message: 'firebaseUid query param required' });
  }

  const users = await getUsers();
  const user = await users.findOne({ firebaseUid });
  if (!user) {
    return res.status(200).json({ subscriptions: [] });
  }

  const subscriptions = await getSubscriptions();
  const docs = await subscriptions
    .aggregate([
      { $match: { userId: user._id } },
      { $sort: { createdAt: -1 } },
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
          anime: {
            $cond: [
              { $gt: [{ $size: '$animeDocs' }, 0] },
              { $arrayElemAt: ['$animeDocs', 0] },
              null,
            ],
          },
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

  res.status(200).json({ subscriptions: docs });
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      return await handleList(req, res);
    } catch (err) {
      console.error('subscriptions list failed:', err);
      return res.status(500).json({ message: 'Failed to list subscriptions' });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { firebaseUid, email, malId, animeTitle, animeData } = req.body || {};

  if (!firebaseUid || !email || !malId || !animeTitle) {
    return res
      .status(400)
      .json({ message: 'firebaseUid, email, malId, animeTitle are required' });
  }

  try {
    const user = await upsertUser(firebaseUid, email);
    const subscriptions = await getSubscriptions();
    const now = new Date();

    let added = false;
    let alreadySubscribed = false;

    try {
      await subscriptions.insertOne({
        userId: user._id,
        malId: parseInt(malId, 10),
        animeTitle,
        createdAt: now,
        lastNotifiedEpisodeKey: null,
        lastNotifiedAt: null,
      });
      added = true;
    } catch (err) {
      if (err.code === 11000) {
        alreadySubscribed = true;
      } else {
        throw err;
      }
    }

    if (animeData && animeData.mal_id) {
      const animes = await getAnimes();
      const doc = jikanToAnimeDoc(animeData);
      await animes.updateOne(
        { malId: doc.malId },
        {
          $set: { ...doc, refreshedAt: now },
          $setOnInsert: { cachedAt: now },
        },
        { upsert: true }
      );
    }

    res.status(200).json({ added, alreadySubscribed });
  } catch (err) {
    console.error('subscription failed:', err);
    res.status(500).json({ message: 'Failed to create subscription' });
  }
}
