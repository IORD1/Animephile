import { useEffect, useState } from 'react';

export function useNavCounts(uid) {
  const [counts, setCounts] = useState({ subs: null, unread: null });

  useEffect(() => {
    if (!uid) {
      setCounts({ subs: null, unread: null });
      return;
    }
    let cancelled = false;

    const subsP = fetch(`/api/subscriptions?firebaseUid=${encodeURIComponent(uid)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => (d?.subscriptions ? d.subscriptions.length : null))
      .catch(() => null);

    const unreadP = fetch(
      `/api/notifications?firebaseUid=${encodeURIComponent(uid)}&unreadOnly=1&countOnly=1`,
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => (typeof d?.unreadCount === 'number' ? d.unreadCount : null))
      .catch(() => null);

    Promise.all([subsP, unreadP]).then(([subs, unread]) => {
      if (cancelled) return;
      setCounts({ subs, unread });
    });

    return () => {
      cancelled = true;
    };
  }, [uid]);

  return counts;
}
