const DAY_INDEX = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
};

export function nextBroadcast({ day, time, timezone }) {
  if (!day || !time || !timezone) return null;
  const dayKey = day.toLowerCase().replace(/s$/, '');
  const targetDay = DAY_INDEX[dayKey];
  if (targetDay == null) return null;

  const m = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);

  const now = new Date();
  let tzNow;
  try {
    tzNow = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  } catch {
    return null;
  }

  let daysAhead = (targetDay - tzNow.getDay() + 7) % 7;
  if (daysAhead === 0) {
    if (tzNow.getHours() > h || (tzNow.getHours() === h && tzNow.getMinutes() >= min)) {
      daysAhead = 7;
    }
  }

  const target = new Date(tzNow);
  target.setDate(tzNow.getDate() + daysAhead);
  target.setHours(h, min, 0, 0);

  const offsetMs = tzNow.getTime() - now.getTime();
  return new Date(target.getTime() - offsetMs);
}

export function diffParts(future, from = new Date()) {
  let diff = Math.max(0, future.getTime() - from.getTime());
  const days = Math.floor(diff / 86400000); diff -= days * 86400000;
  const hours = Math.floor(diff / 3600000); diff -= hours * 3600000;
  const mins = Math.floor(diff / 60000); diff -= mins * 60000;
  const secs = Math.floor(diff / 1000);
  return { days, hours, mins, secs };
}

export function pad2(n) {
  return String(n).padStart(2, '0');
}

// Approximate the most-recently-aired episode number for a Jikan anime item,
// assuming a weekly broadcast cadence from `aired.from`. Caps at total
// `episodes` when known. Returns null when `aired.from` is missing/invalid.
export function approxAiredEpisode(item) {
  const total = item?.episodes;
  const from = item?.aired?.from;
  if (!from) return null;
  const start = new Date(from);
  if (Number.isNaN(start.getTime())) return null;
  const weeks = Math.floor((Date.now() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const n = Math.max(1, weeks + 1);
  return total ? Math.min(total, n) : n;
}
