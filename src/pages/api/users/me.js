import { getUsers } from '@/lib/db/collections';

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export const DEFAULT_PREFERENCES = {
  muted: false,
  preferredNotificationTime: '09:00',
  timezone: 'Asia/Kolkata',
  digestFrequency: 'per-episode',
  notifyFinales: true,
  quietHours: { enabled: false, start: '22:00', end: '08:00' },
};

const VALID_DIGEST_FREQUENCIES = ['per-episode', 'daily', 'weekly'];
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

async function handleUpsert(req, res) {
  const { firebaseUid, email, displayName, photoURL } = req.body || {};
  if (!firebaseUid || !email) {
    return res.status(400).json({ message: 'firebaseUid and email are required' });
  }

  const users = await getUsers();
  const now = new Date();
  await users.updateOne(
    { firebaseUid },
    {
      $set: {
        email,
        displayName: displayName || null,
        photoURL: photoURL || null,
        isAdmin: ADMIN_EMAILS.includes(email),
        updatedAt: now,
        lastLoginAt: now,
      },
      $setOnInsert: {
        firebaseUid,
        preferences: DEFAULT_PREFERENCES,
        stats: { emailsSent: 0, lastNotifiedAt: null },
        createdAt: now,
      },
    },
    { upsert: true },
  );

  // Backfill new pref fields for users created before they existed.
  await users.updateOne(
    { firebaseUid, 'preferences.notifyFinales': { $exists: false } },
    { $set: { 'preferences.notifyFinales': DEFAULT_PREFERENCES.notifyFinales } },
  );
  await users.updateOne(
    { firebaseUid, 'preferences.quietHours': { $exists: false } },
    { $set: { 'preferences.quietHours': DEFAULT_PREFERENCES.quietHours } },
  );

  const user = await users.findOne({ firebaseUid });
  res.status(200).json({ user });
}

async function handleGet(req, res) {
  const { firebaseUid } = req.query;
  if (!firebaseUid || typeof firebaseUid !== 'string') {
    return res.status(400).json({ message: 'firebaseUid query param required' });
  }
  const users = await getUsers();
  const user = await users.findOne({ firebaseUid });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const prefs = user.preferences || {};
  const merged = {
    ...DEFAULT_PREFERENCES,
    ...prefs,
    quietHours: { ...DEFAULT_PREFERENCES.quietHours, ...(prefs.quietHours || {}) },
  };
  res.status(200).json({ user: { ...user, preferences: merged } });
}

async function handlePatch(req, res) {
  const { firebaseUid, preferences } = req.body || {};
  if (!firebaseUid) {
    return res.status(400).json({ message: 'firebaseUid is required' });
  }
  if (!preferences || typeof preferences !== 'object') {
    return res.status(400).json({ message: 'preferences object is required' });
  }

  const updates = {};
  if (typeof preferences.muted === 'boolean') {
    updates['preferences.muted'] = preferences.muted;
  }
  if (typeof preferences.notifyFinales === 'boolean') {
    updates['preferences.notifyFinales'] = preferences.notifyFinales;
  }
  if (typeof preferences.preferredNotificationTime === 'string') {
    if (!TIME_PATTERN.test(preferences.preferredNotificationTime)) {
      return res.status(400).json({ message: 'preferredNotificationTime must match HH:MM' });
    }
    updates['preferences.preferredNotificationTime'] = preferences.preferredNotificationTime;
  }
  if (typeof preferences.timezone === 'string' && preferences.timezone.length > 0) {
    updates['preferences.timezone'] = preferences.timezone;
  }
  if (typeof preferences.digestFrequency === 'string') {
    if (!VALID_DIGEST_FREQUENCIES.includes(preferences.digestFrequency)) {
      return res.status(400).json({
        message: `digestFrequency must be one of: ${VALID_DIGEST_FREQUENCIES.join(', ')}`,
      });
    }
    updates['preferences.digestFrequency'] = preferences.digestFrequency;
  }
  if (preferences.quietHours && typeof preferences.quietHours === 'object') {
    const qh = preferences.quietHours;
    if (typeof qh.enabled === 'boolean') {
      updates['preferences.quietHours.enabled'] = qh.enabled;
    }
    if (typeof qh.start === 'string') {
      if (!TIME_PATTERN.test(qh.start)) {
        return res.status(400).json({ message: 'quietHours.start must match HH:MM' });
      }
      updates['preferences.quietHours.start'] = qh.start;
    }
    if (typeof qh.end === 'string') {
      if (!TIME_PATTERN.test(qh.end)) {
        return res.status(400).json({ message: 'quietHours.end must match HH:MM' });
      }
      updates['preferences.quietHours.end'] = qh.end;
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'No valid fields to update' });
  }

  updates.updatedAt = new Date();
  const users = await getUsers();
  const result = await users.findOneAndUpdate(
    { firebaseUid },
    { $set: updates },
    { returnDocument: 'after' },
  );
  if (!result) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.status(200).json({ user: result });
}

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') return handleUpsert(req, res);
    if (req.method === 'GET') return handleGet(req, res);
    if (req.method === 'PATCH') return handlePatch(req, res);
    return res.status(405).json({ message: 'Method not allowed' });
  } catch (err) {
    console.error('users/me error:', err);
    res.status(500).json({ message: 'Internal error' });
  }
}
