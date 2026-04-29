import { getNotifications, getUsers } from '@/lib/db/collections';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { firebaseUid } = req.body || {};
  if (!firebaseUid) {
    return res.status(400).json({ message: 'firebaseUid required' });
  }

  try {
    const users = await getUsers();
    const user = await users.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const notifications = await getNotifications();
    const now = new Date();
    const result = await notifications.updateMany(
      { userId: user._id, $or: [{ readAt: null }, { readAt: { $exists: false } }] },
      { $set: { readAt: now } },
    );
    res.status(200).json({ marked: result.modifiedCount });
  } catch (err) {
    console.error('mark-all-read failed:', err);
    res.status(500).json({ message: 'Failed to mark all read' });
  }
}
