import { randomUUID, timingSafeEqual } from 'crypto';
import { getCachedJikan, RESOLVE_ENDPOINTS } from '@/lib/jikan-cache';
import { sendEmail } from '@/lib/email';
import { episodeNotificationEmail } from '@/lib/email-templates';
import {
  getSubscriptions,
  getUsers,
  getNotifications,
} from '@/lib/db/collections';

function safeEqual(a, b) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

async function authorize(req) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;
  if (cronSecret && authHeader && authHeader.startsWith('Bearer ')) {
    if (safeEqual(authHeader.slice(7), cronSecret)) {
      return { ok: true, source: 'cron' };
    }
  }

  const { firebaseUid } = req.body || {};
  if (firebaseUid) {
    const users = await getUsers();
    const user = await users.findOne({ firebaseUid });
    if (user?.isAdmin) {
      return { ok: true, source: 'admin' };
    }
  }

  return { ok: false };
}

function todayUtcDateString() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const auth = await authorize(req);
  if (!auth.ok) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const cronRunId = randomUUID();
    const todayKey = todayUtcDateString();

    const cached = await getCachedJikan(RESOLVE_ENDPOINTS.today());
    const scheduleData = cached.data || [];
    const itemByMalId = new Map(
      scheduleData
        .filter((s) => typeof s.mal_id === 'number')
        .map((s) => [s.mal_id, s])
    );
    const todayMalIds = Array.from(itemByMalId.keys());

    if (todayMalIds.length === 0) {
      return res.status(200).json({
        matched: 0,
        sent: 0,
        failed: 0,
        skipped: 0,
        cronRunId,
        todayKey,
      });
    }

    const subscriptions = await getSubscriptions();
    const matches = await subscriptions
      .aggregate([
        {
          $match: {
            malId: { $in: todayMalIds },
            $or: [
              { lastNotifiedEpisodeKey: { $exists: false } },
              { lastNotifiedEpisodeKey: null },
              { lastNotifiedEpisodeKey: { $ne: todayKey } },
            ],
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        { $match: { 'user.preferences.muted': { $ne: true } } },
      ])
      .toArray();

    const notifications = await getNotifications();
    const users = await getUsers();
    const now = new Date();
    let sent = 0;
    let failed = 0;

    // TODO(future): honor preferences.preferredNotificationTime once on Pro plan
    //   with hourly cron. Daily cron fires once and can't gate per user-local time.
    // TODO(future): honor preferences.digestFrequency 'daily' / 'weekly' aggregation.
    //   For now everything is treated as 'per-episode'.

    for (const m of matches) {
      const item = itemByMalId.get(m.malId);
      const { subject, text, html } = episodeNotificationEmail({
        animeTitle: m.animeTitle,
        item,
      });
      try {
        await sendEmail({ to: m.user.email, subject, text, html });
        await subscriptions.updateOne(
          { _id: m._id },
          { $set: { lastNotifiedEpisodeKey: todayKey, lastNotifiedAt: now } }
        );
        await notifications.insertOne({
          userId: m.userId,
          malId: m.malId,
          episodeId: null,
          email: m.user.email,
          subject,
          status: 'sent',
          error: null,
          sentAt: now,
          cronRunId,
          type: 'episode',
          animeTitle: m.animeTitle,
          bodyHtml: html,
          bodyText: text,
          readAt: null,
        });
        await users.updateOne(
          { _id: m.userId },
          {
            $inc: { 'stats.emailsSent': 1 },
            $set: { 'stats.lastNotifiedAt': now },
          }
        );
        sent += 1;
      } catch (err) {
        await notifications.insertOne({
          userId: m.userId,
          malId: m.malId,
          episodeId: null,
          email: m.user.email,
          subject,
          status: 'failed',
          error: err.message || String(err),
          sentAt: now,
          cronRunId,
          type: 'episode',
          animeTitle: m.animeTitle,
          bodyHtml: null,
          bodyText: null,
          readAt: null,
        });
        failed += 1;
      }
    }

    res.status(200).json({
      matched: matches.length,
      sent,
      failed,
      skipped: 0,
      cronRunId,
      todayKey,
      source: auth.source,
    });
  } catch (err) {
    console.error('cron notify failed:', err);
    res.status(500).json({ message: 'Cron run failed' });
  }
}
