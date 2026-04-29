import { ObjectId } from 'mongodb';
import { getNotifications, getUsers } from '@/lib/db/collections';

async function findUserId(firebaseUid) {
  if (!firebaseUid) return null;
  const users = await getUsers();
  const user = await users.findOne({ firebaseUid });
  return user ? user._id : null;
}

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id || !ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid notification id' });
  }
  const { firebaseUid, read } = req.body || {};
  if (!firebaseUid) {
    return res.status(400).json({ message: 'firebaseUid required' });
  }

  try {
    const userId = await findUserId(firebaseUid);
    if (!userId) {
      return res.status(404).json({ message: 'User not found' });
    }

    const notifications = await getNotifications();
    const filter = { _id: new ObjectId(id), userId };
    const update = { $set: { readAt: read === false ? null : new Date() } };
    const result = await notifications.findOneAndUpdate(filter, update, {
      returnDocument: 'after',
    });
    if (!result) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.status(200).json({ notification: result });
  } catch (err) {
    console.error('notifications patch failed:', err);
    res.status(500).json({ message: 'Failed to update notification' });
  }
}
