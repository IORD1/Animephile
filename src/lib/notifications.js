export async function notifyTodaysSubscribers(firebaseUid) {
  const res = await fetch('/api/cron/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firebaseUid }),
  });
  if (!res.ok) {
    throw new Error(`cron failed: ${res.status}`);
  }
  return res.json();
}
