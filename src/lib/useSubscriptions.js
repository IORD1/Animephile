import { useCallback } from 'react';
import { useAuth } from './AuthContext';

export function useSubscriptions() {
  const { user } = useAuth();

  const follow = useCallback(
    async (malId, animeTitle, animeData) => {
      if (!user || !malId || !animeTitle) {
        return { added: false, reason: 'missing-args' };
      }

      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseUid: user.uid,
          email: user.email,
          malId,
          animeTitle,
          animeData,
        }),
      });

      if (!res.ok) {
        return { added: false, reason: 'request-failed' };
      }
      return res.json();
    },
    [user]
  );

  return { follow };
}
