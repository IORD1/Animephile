import { getUsers, getSubscriptions } from '@/lib/db/collections';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const malIdRaw = req.query.malId;
  const malId = parseInt(malIdRaw, 10);
  if (Number.isNaN(malId)) {
    return res.status(400).json({ message: 'malId must be an integer' });
  }

  const { firebaseUid } = req.body || {};
  if (!firebaseUid) {
    return res.status(400).json({ message: 'firebaseUid is required' });
  }

  try {
    const users = await getUsers();
    const user = await users.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const subscriptions = await getSubscriptions();
    const result = await subscriptions.deleteOne({ userId: user._id, malId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    res.status(200).json({ deleted: true });
  } catch (err) {
    console.error('unfollow failed:', err);
    res.status(500).json({ message: 'Failed to unfollow' });
  }
}
