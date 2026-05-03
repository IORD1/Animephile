import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import TopNav from '@/components/ui/TopNav';
import SectionHeader from '@/components/ui/SectionHeader';
import PosterPlaceholder from '@/components/ui/PosterPlaceholder';
import Stamp from '@/components/ui/Stamp';
import { initialsFrom } from '@/components/ui/Avatar';
import { useAuth } from '@/lib/AuthContext';
import { getPosterUrl } from '@/lib/anime-utils';

const FILTERS = [
  { id: 'all', label: 'ALL' },
  { id: 'airing', label: 'AIRING' },
  { id: 'complete', label: 'COMPLETE' },
  { id: 'hiatus', label: 'HIATUS' },
];

function statusOf(sub) {
  const s = (sub.anime?.status || '').toLowerCase();
  if (s.includes('airing') || s.includes('publishing')) return 'airing';
  if (s.includes('hiatus')) return 'hiatus';
  if (s.includes('finished') || s.includes('complete')) return 'complete';
  return 'complete';
}

function formatJoined(date) {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
}

function formatFollowed(date) {
  if (!date) return 'Followed —';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return 'Followed —';
  return `Followed ${d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}`;
}

function Toggle({ on, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 52, height: 26, border: '1.5px solid var(--ink)',
        background: on ? 'var(--vermilion)' : 'var(--paper-3)',
        position: 'relative', cursor: disabled ? 'not-allowed' : 'pointer',
        padding: 0, opacity: disabled ? 0.5 : 1,
      }}
      aria-pressed={on}
    >
      <div
        style={{
          position: 'absolute', top: 2, left: on ? 26 : 2,
          width: 20, height: 20, background: 'var(--paper)',
          border: '1.5px solid var(--ink)',
          transition: 'left 0.15s',
        }}
      />
    </button>
  );
}

export default function ProfilePage() {
  const { user, isAdmin, loading, logout } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [subs, setSubs] = useState(null);
  const [filter, setFilter] = useState('all');
  const [removing, setRemoving] = useState({});
  const [error, setError] = useState(null);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [adminBusy, setAdminBusy] = useState(false);
  const [adminMessage, setAdminMessage] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/');
      return;
    }
    let cancelled = false;
    Promise.all([
      fetch(`/api/users/me?firebaseUid=${encodeURIComponent(user.uid)}`).then((r) => r.json()),
      fetch(`/api/subscriptions?firebaseUid=${encodeURIComponent(user.uid)}`).then((r) => r.json()),
    ])
      .then(([u, s]) => {
        if (cancelled) return;
        setProfile(u.user);
        setSubs(s.subscriptions || []);
      })
      .catch((err) => { if (!cancelled) setError(err.message || 'Failed to load profile'); });
    return () => { cancelled = true; };
  }, [user, loading, router]);

  const filteredSubs = useMemo(() => {
    if (!subs) return [];
    if (filter === 'all') return subs;
    return subs.filter((s) => statusOf(s) === filter);
  }, [subs, filter]);

  const counts = useMemo(() => {
    if (!subs) return { all: 0, airing: 0, complete: 0, hiatus: 0, genres: 0 };
    const byStatus = { all: subs.length, airing: 0, complete: 0, hiatus: 0 };
    const genreSet = new Set();
    for (const s of subs) {
      byStatus[statusOf(s)] += 1;
      (s.anime?.genres || []).forEach((g) => genreSet.add(g));
    }
    return { ...byStatus, genres: genreSet.size };
  }, [subs]);

  async function unfollow(malId) {
    if (!user) return;
    setRemoving((p) => ({ ...p, [malId]: true }));
    try {
      const res = await fetch(`/api/subscriptions/${malId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseUid: user.uid }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || `status ${res.status}`);
      }
      setSubs((prev) => (prev || []).filter((s) => s.malId !== malId));
    } catch (err) {
      setError(err.message || 'Failed to unfollow');
    } finally {
      setRemoving((p) => {
        const c = { ...p }; delete c[malId]; return c;
      });
    }
  }

  async function patchPrefs(partial) {
    if (!user) return;
    setSavingPrefs(true);
    const optimistic = {
      ...profile,
      preferences: {
        ...profile.preferences,
        ...partial,
        ...(partial.quietHours
          ? { quietHours: { ...profile.preferences.quietHours, ...partial.quietHours } }
          : {}),
      },
    };
    setProfile(optimistic);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseUid: user.uid, preferences: partial }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Save failed');
      setProfile(d.user);
    } catch (err) {
      setError(err.message || 'Failed to save preferences');
    } finally {
      setSavingPrefs(false);
    }
  }

  async function exportData() {
    if (!profile) return;
    const payload = {
      user: profile,
      subscriptions: subs || [],
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `animephile-${user.uid}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function runAdminCron() {
    if (!user) return;
    setAdminBusy(true);
    setAdminMessage(null);
    try {
      const res = await fetch('/api/cron/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseUid: user.uid }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || `status ${res.status}`);
      setAdminMessage(`SENT ${d.sent} · FAILED ${d.failed} · MATCHED ${d.matched}`);
    } catch (err) {
      setAdminMessage(`ERROR — ${err.message || 'cron failed'}`);
    } finally {
      setAdminBusy(false);
    }
  }

  if (loading || !user) return null;

  if (!profile || !subs) {
    return (
      <div className="ink-root paper-bg page-shell" style={{ minHeight: '100vh' }}>
        <TopNav user={user} logout={logout} />
        <p className="idx" style={{ padding: 40, textAlign: 'center' }}>
          {error ? `ERROR — ${error}` : 'LOADING…'}
        </p>
      </div>
    );
  }

  const initials = initialsFrom(profile.displayName, profile.email);
  const prefs = profile.preferences || {};
  const isPower = (profile.stats?.emailsSent || 0) > 100;

  const stats = [
    { n: counts.all, l: 'FOLLOWED' },
    { n: profile.stats?.emailsSent ?? 0, l: 'EMAILS SENT' },
    { n: counts.airing, l: 'AIRING NOW' },
    { n: counts.complete, l: 'COMPLETED' },
    { n: counts.hiatus, l: 'HIATUS' },
    { n: counts.genres, l: 'GENRES' },
  ];

  return (
    <div className="ink-root paper-bg page-shell" style={{ minHeight: '100vh' }}>
      <TopNav user={user} logout={logout} />

      <div
        className="page-section"
        style={{
          borderBottom: '2.5px solid var(--ink)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          className="halftone-fade"
          style={{ position: 'absolute', inset: 0, opacity: 0.08, pointerEvents: 'none' }}
        />
        <div
          className="grid-stack-sm"
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto',
            gap: 'clamp(16px, 4vw, 32px)',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: 'clamp(96px, 22vw, 160px)', height: 'clamp(96px, 22vw, 160px)', borderRadius: 999,
                background: 'var(--vermilion)', color: 'var(--paper)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Anton, sans-serif', fontSize: 'clamp(42px, 10vw, 78px)',
                border: '2.5px solid var(--ink)', boxShadow: '6px 6px 0 var(--ink)',
              }}
            >
              {initials}
            </div>
            <Stamp
              size={60}
              fontSize={22}
              rotate={14}
              style={{ position: 'absolute', bottom: -8, right: -16 }}
            >
              会員
            </Stamp>
          </div>

          <div>
            <div className="idx" style={{ marginBottom: 8 }}>
              — READER PROFILE · MEMBER {profile._id?.toString().slice(-6).toUpperCase() || ''}
            </div>
            <div className="display" style={{ fontSize: 'clamp(32px, 8vw, 64px)', lineHeight: 0.85, wordBreak: 'break-word' }}>
              {(profile.displayName || profile.email || 'User').toUpperCase()}
            </div>
            <div className="jp" style={{ fontSize: 18, color: 'var(--muted)', marginTop: 6 }}>
              {profile.email}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              <span className="chip">JOINED {formatJoined(profile.createdAt)}</span>
              {isPower && <span className="chip chip-ink">⭐ POWER USER</span>}
              <span className="chip chip-red">{counts.all} SUBSCRIPTIONS</span>
              {isAdmin && <span className="chip chip-ink">ADMIN</span>}
            </div>
          </div>

          <div
            className="mobile-stats-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 0,
              border: '1.5px solid var(--ink)',
              background: 'var(--paper)',
              width: '100%',
            }}
          >
            {stats.map((s, i) => (
              <div
                key={s.l}
                style={{
                  padding: 'clamp(10px, 2vw, 16px) clamp(10px, 2vw, 22px)',
                  textAlign: 'center',
                  borderRight: i % 3 !== 2 ? '1.5px solid var(--ink)' : 'none',
                  borderBottom: i < 3 ? '1.5px solid var(--ink)' : 'none',
                  minWidth: 0,
                }}
              >
                <div className="display" style={{ fontSize: 'clamp(22px, 5vw, 32px)', color: 'var(--vermilion)' }}>
                  {s.n}
                </div>
                <div className="idx" style={{ marginTop: 4, fontSize: 9 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          padding: 'clamp(14px, 3vw, 20px) clamp(16px, 4vw, 28px)',
          borderBottom: '1.5px solid var(--ink)',
          background: 'var(--paper-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 18,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="idx">FILTER:</span>
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                className="btn"
                onClick={() => setFilter(f.id)}
                style={{
                  padding: '8px 12px',
                  fontSize: 11,
                  background: active ? 'var(--ink)' : 'var(--paper)',
                  color: active ? 'var(--paper)' : 'var(--ink)',
                }}
              >
                {f.label} · {counts[f.id]}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: 'clamp(16px, 4vw, 28px)' }}>
        <SectionHeader
          idx="01"
          kicker="EVERYTHING YOU FOLLOW"
          title="MY SUBSCRIPTIONS"
          jp="購読中"
        />

        {filteredSubs.length === 0 ? (
          <div
            style={{
              border: '1.5px dashed var(--ink)',
              background: 'var(--paper)',
              padding: 48,
              textAlign: 'center',
            }}
          >
            <div className="display" style={{ fontSize: 24 }}>
              NOTHING HERE YET
              <span className="jp" style={{ fontSize: 20, color: 'var(--muted)', marginLeft: 12 }}>。</span>
            </div>
            <p style={{ marginTop: 12, color: 'var(--muted)' }}>
              {filter === 'all'
                ? 'Browse the home page and click Follow on something.'
                : 'No subscriptions match this filter.'}
            </p>
            {filter === 'all' && (
              <Link href="/" className="btn btn-primary" style={{ marginTop: 18 }}>
                BROWSE HOME →
              </Link>
            )}
          </div>
        ) : (
          <div style={{ border: '1.5px solid var(--ink)', background: 'var(--paper)' }}>
            <div
              className="subs-header-sm"
              style={{
                display: 'grid',
                gridTemplateColumns: '100px 2.5fr 1fr 1.4fr 1fr auto',
                alignItems: 'center',
                padding: '12px 18px',
                background: 'var(--ink)',
                color: 'var(--paper)',
                gap: 16,
              }}
            >
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.1em' }}>POSTER</div>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.1em' }}>TITLE</div>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.1em' }}>STATUS</div>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.1em' }}>BROADCAST</div>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.1em' }}>NOTIFS</div>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.1em' }}>ACTIONS</div>
            </div>

            {filteredSubs.map((s, i) => {
              const a = s.anime || {};
              const status = statusOf(s);
              const statusColor =
                status === 'airing' ? 'var(--vermilion)'
                : status === 'hiatus' ? 'var(--muted)'
                : 'var(--ink)';
              const statusLabel = status.toUpperCase();
              const broadcast = a.broadcast?.string || '—';
              const cover = getPosterUrl(a);
              const isRemoving = !!removing[s.malId];
              const notifChip = prefs.muted
                ? 'PAUSED'
                : prefs.digestFrequency === 'weekly' ? 'EMAIL · WEEKLY'
                : prefs.digestFrequency === 'daily' ? 'EMAIL · DAILY'
                : 'EMAIL';

              return (
                <Link
                  key={s._id || s.malId}
                  href={`/anime/${s.malId}`}
                  className="subs-row-sm"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '100px 2.5fr 1fr 1.4fr 1fr auto',
                    alignItems: 'center',
                    padding: '14px 18px',
                    gap: 16,
                    borderBottom: i < filteredSubs.length - 1 ? '1.5px solid var(--paper-3)' : 'none',
                    background: i % 2 === 0 ? 'var(--paper)' : 'var(--paper-2)',
                    color: 'inherit',
                    textDecoration: 'none',
                  }}
                >
                  <div className="subs-card-main" style={{ display: 'contents' }}>
                    <div style={{ width: 70, height: 96, position: 'relative' }}>
                      <PosterPlaceholder
                        title={(a.titleEnglish || a.title || s.animeTitle || '').split(/[:×]/)[0].trim().slice(0, 12)}
                        jp={(a.titleJapanese || '').slice(0, 1)}
                        w={70}
                        h={96}
                        variant={i % 2 ? 'halftone' : 'stripes'}
                        imageUrl={cover}
                      />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.1 }}>
                        {a.titleEnglish || a.title || s.animeTitle}
                      </div>
                      {a.titleJapanese && (
                        <div className="jp" style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                          {a.titleJapanese}
                        </div>
                      )}
                      <div className="idx" style={{ marginTop: 6 }}>
                        {(a.genres || []).slice(0, 2).map((g) => g.toUpperCase()).join(' · ') || '—'}
                      </div>
                      <div className="idx" style={{ marginTop: 2, color: 'var(--muted)' }}>
                        {formatFollowed(s.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, background: statusColor, borderRadius: 999 }} />
                      <span
                        className="mono"
                        style={{ fontSize: 11, fontWeight: 700, color: statusColor }}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    {a.episodes && (
                      <div className="mono" style={{ fontSize: 11, marginTop: 4 }}>
                        {a.episodes} EPS
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{broadcast}</div>
                    {status === 'airing' && (
                      <div className="idx" style={{ color: 'var(--vermilion)', marginTop: 2 }}>
                        ● ONGOING
                      </div>
                    )}
                  </div>
                  <div>
                    <span className={`chip ${notifChip === 'PAUSED' ? '' : 'chip-ink'}`}>
                      {notifChip === 'PAUSED' ? '⏸ PAUSED' : `✉ ${notifChip}`}
                    </span>
                  </div>
                  <div className="subs-card-actions" style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        unfollow(s.malId);
                      }}
                      disabled={isRemoving}
                      style={{
                        padding: '8px 10px',
                        fontSize: 10,
                        background: 'var(--vermilion)',
                        color: 'var(--paper)',
                      }}
                    >
                      {isRemoving ? '…' : 'REMOVE'}
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="grid-2-stack-sm" style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <div
            className="shadow-hard"
            style={{
              border: '1.5px solid var(--ink)',
              background: 'var(--paper)',
              padding: 22,
            }}
          >
            <div className="idx" style={{ marginBottom: 8 }}>— SETTINGS · GLOBAL DEFAULTS</div>
            <div className="display" style={{ fontSize: 26, marginBottom: 16 }}>
              NOTIFICATION PREFERENCES
            </div>
            {[
              { l: 'Email when a new episode airs', on: !prefs.muted, toggle: () => patchPrefs({ muted: !prefs.muted }) },
              {
                l: 'Send a weekly digest on Sunday',
                on: prefs.digestFrequency === 'weekly',
                toggle: () => patchPrefs({ digestFrequency: prefs.digestFrequency === 'weekly' ? 'per-episode' : 'weekly' }),
              },
              {
                l: 'Notify me about season finales',
                on: !!prefs.notifyFinales,
                toggle: () => patchPrefs({ notifyFinales: !prefs.notifyFinales }),
              },
              {
                l: `Quiet hours (${prefs.quietHours?.start || '22:00'} – ${prefs.quietHours?.end || '08:00'})`,
                on: !!prefs.quietHours?.enabled,
                toggle: () =>
                  patchPrefs({
                    quietHours: { enabled: !prefs.quietHours?.enabled },
                  }),
              },
            ].map((p, i) => (
              <div
                key={p.l}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: i < 3 ? '1px dashed var(--ink)' : 'none',
                }}
              >
                <span style={{ fontSize: 14 }}>{p.l}</span>
                <Toggle on={p.on} onClick={p.toggle} disabled={savingPrefs} />
              </div>
            ))}
          </div>

          <div
            style={{
              border: '1.5px solid var(--ink)',
              background: 'var(--paper-2)',
              padding: 22,
            }}
          >
            <div className="idx" style={{ marginBottom: 8 }}>— DANGER ZONE · IRREVERSIBLE</div>
            <div className="display" style={{ fontSize: 26, marginBottom: 16 }}>ACCOUNT</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button type="button" className="btn" onClick={exportData} style={{ alignSelf: 'flex-start' }}>
                EXPORT MY DATA (.JSON)
              </button>
              <button
                type="button"
                className="btn"
                style={{ alignSelf: 'flex-start' }}
                onClick={() => alert('Bulk unfollow is coming soon. For now, remove rows individually.')}
              >
                UNFOLLOW EVERYTHING
              </button>
            </div>
            <div className="bubble bubble-up" style={{ marginTop: 18, background: 'var(--paper)' }}>
              This action can&apos;t be undone. We&apos;ll send a confirmation email before anything is wiped.
            </div>
          </div>
        </div>

        {isAdmin && (
          <div
            style={{
              marginTop: 32,
              border: '1.5px solid var(--ink)',
              background: 'var(--ink)',
              color: 'var(--paper)',
              padding: 22,
            }}
          >
            <div className="idx" style={{ color: 'var(--vermilion)', marginBottom: 8 }}>
              — ADMIN · MANUAL CRON TRIGGER
            </div>
            <div className="display" style={{ fontSize: 26, marginBottom: 16 }}>
              SEND TODAY&apos;S NOTIFICATIONS
            </div>
            <p style={{ fontSize: 13, color: 'var(--paper-3)', marginBottom: 16, maxWidth: 600 }}>
              Fires the same job Vercel Cron runs daily at 09:00 UTC. Idempotent — won&apos;t double-send to anyone already
              notified today.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={runAdminCron}
                disabled={adminBusy}
              >
                {adminBusy ? 'RUNNING…' : 'TRIGGER NOTIFY'}
              </button>
              {adminMessage && (
                <span className="mono" style={{ fontSize: 12, color: 'var(--paper-3)' }}>
                  {adminMessage}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
