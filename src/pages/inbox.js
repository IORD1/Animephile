import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import TopNav from '@/components/ui/TopNav';
import PosterPlaceholder from '@/components/ui/PosterPlaceholder';
import Stamp from '@/components/ui/Stamp';
import { useAuth } from '@/lib/AuthContext';
import { getPosterUrl } from '@/lib/anime-utils';

const TABS = [
  { id: 'all', label: 'ALL' },
  { id: 'episode', label: 'NEW EPISODES' },
  { id: 'finale', label: 'FINALES' },
  { id: 'digest', label: 'WEEKLY DIGEST' },
  { id: 'news', label: 'PRODUCT NEWS' },
];

function formatWhen(date) {
  if (!date) return '—';
  const d = new Date(date);
  const ms = Date.now() - d.getTime();
  const min = Math.floor(ms / 60000);
  if (min < 60) return min <= 1 ? 'JUST NOW' : `${min} MIN AGO`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs} HRS AGO`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'YESTERDAY';
  if (days < 7) return `${days} DAYS AGO`;
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase();
}

function chipClassFor(type) {
  if (type === 'finale') return 'chip chip-red';
  if (type === 'digest') return 'chip';
  if (type === 'news') return 'chip';
  return 'chip chip-ink';
}

function chipLabelFor(type) {
  if (type === 'finale') return '★ FINALE';
  if (type === 'digest') return '📊 DIGEST';
  if (type === 'news') return '📢 NEWS';
  return '✉ NEW EP';
}

export default function InboxPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState('all');
  const [list, setList] = useState(null);
  const [unread, setUnread] = useState(0);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/');
      return;
    }
    let cancelled = false;
    const params = new URLSearchParams({ firebaseUid: user.uid, limit: '50' });
    if (tab !== 'all') params.set('type', tab);
    fetch(`/api/notifications?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setList(d.notifications || []);
        setUnread(d.unreadCount || 0);
        if ((d.notifications || []).length > 0 && !selected) {
          setSelected(d.notifications[0]);
        }
      })
      .catch((err) => { if (!cancelled) setError(err.message || 'Failed to load inbox'); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, tab, router]);

  const tabCounts = useMemo(() => {
    if (!list) return {};
    const out = { all: list.length };
    for (const n of list) {
      const t = n.type || 'episode';
      out[t] = (out[t] || 0) + 1;
    }
    return out;
  }, [list]);

  async function markRead(notif) {
    if (!notif || notif.readAt) return;
    try {
      await fetch(`/api/notifications/${notif._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseUid: user.uid, read: true }),
      });
      setList((prev) =>
        (prev || []).map((n) => (n._id === notif._id ? { ...n, readAt: new Date().toISOString() } : n)),
      );
      setUnread((u) => Math.max(0, u - 1));
    } catch {
      // non-fatal
    }
  }

  async function markAllRead() {
    if (!user) return;
    try {
      const res = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseUid: user.uid }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Failed');
      const now = new Date().toISOString();
      setList((prev) => (prev || []).map((n) => ({ ...n, readAt: n.readAt || now })));
      setUnread(0);
    } catch (err) {
      setError(err.message || 'Failed to mark all read');
    }
  }

  if (loading || !user) return null;

  return (
    <div className="ink-root paper-bg page-shell" style={{ minHeight: '100vh' }}>
      <TopNav user={user} logout={logout} />

      <div className="page-section" style={{ borderBottom: '2.5px solid var(--ink)' }}>
        <div className="page-header-stack">
          <div>
            <div className="idx" style={{ marginBottom: 6 }}>
              — EVERY EMAIL WE&apos;VE SENT YOU · IN ONE PLACE
            </div>
            <h1 className="display" style={{ fontSize: 76, lineHeight: 0.85, margin: 0 }}>
              INBOX <span style={{ color: 'var(--vermilion)' }}>{unread}</span> NEW
              <span className="jp" style={{ fontSize: 50 }}>。</span>
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn"
              onClick={markAllRead}
              disabled={unread === 0}
            >
              MARK ALL READ
            </button>
            <Link href="/profile" className="btn btn-primary">⚙ EMAIL SETTINGS</Link>
          </div>
        </div>
      </div>

      <div
        style={{
          padding: '14px 28px',
          borderBottom: '1.5px solid var(--ink)',
          background: 'var(--paper-2)',
          display: 'flex',
          gap: 4,
          flexWrap: 'wrap',
        }}
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          const count = tabCounts[t.id] || 0;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => { setTab(t.id); setSelected(null); }}
              style={{
                padding: '8px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                border: '1.5px solid var(--ink)',
                background: active ? 'var(--ink)' : 'transparent',
                color: active ? 'var(--paper)' : 'var(--ink)',
                fontWeight: 700,
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {t.label}
              <span
                style={{
                  background: active ? 'var(--vermilion)' : 'var(--ink)',
                  color: 'var(--paper)',
                  padding: '1px 6px',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 10,
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {error && <p className="idx" style={{ padding: 20, textAlign: 'center', color: 'var(--vermilion)' }}>{error}</p>}

      <div className="inbox-layout">
        <div style={{ borderRight: '1.5px solid var(--ink)' }}>
          {list === null ? (
            <p className="idx" style={{ padding: 32, textAlign: 'center' }}>LOADING…</p>
          ) : list.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <div className="display" style={{ fontSize: 24 }}>NO NOTIFICATIONS YET</div>
              <p style={{ color: 'var(--muted)', marginTop: 12 }}>
                Once you start following anime, episode alerts will land here.
              </p>
            </div>
          ) : (
            <>
              {list.map((n) => {
                const a = n.anime || {};
                const isSelected = selected?._id === n._id;
                const isUnread = !n.readAt;
                const type = n.type || 'episode';
                const cover = getPosterUrl(a);
                const titleShort = (n.animeTitle || a.title || '').split(/[:×]/)[0].trim().slice(0, 12);
                const ep = n.episodeId
                  ? String(n.episodeId).padStart(2, '0')
                  : type === 'digest' ? 'WK' : '—';
                return (
                  <div
                    key={n._id}
                    className="inbox-row-sm"
                    role="button"
                    tabIndex={0}
                    onClick={() => { setSelected(n); markRead(n); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') { setSelected(n); markRead(n); }
                    }}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '6px 80px 1fr auto',
                      gap: 14,
                      padding: '18px 24px',
                      alignItems: 'center',
                      borderBottom: '1.5px solid var(--paper-3)',
                      background: isSelected ? 'var(--paper-2)' : 'var(--paper)',
                      cursor: 'pointer',
                    }}
                  >
                    <div className="inbox-row-main" style={{ display: 'contents' }}>
                      <div
                        style={{
                          width: 6,
                          height: 60,
                          background: isUnread ? 'var(--vermilion)' : 'transparent',
                        }}
                      />
                      <div style={{ width: 64, height: 90 }}>
                        <PosterPlaceholder
                          title={titleShort}
                          jp=""
                          w={64}
                          h={90}
                          variant="halftone"
                          imageUrl={cover}
                        />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span className={chipClassFor(type)} style={{ fontSize: 9 }}>
                            {chipLabelFor(type)}
                          </span>
                          <span className="display" style={{ fontSize: 18 }}>
                            {n.animeTitle || a.title || n.subject}
                          </span>
                          {isUnread && (
                            <span
                              style={{
                                width: 8, height: 8, background: 'var(--vermilion)', borderRadius: 999,
                              }}
                            />
                          )}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.4 }}>
                          {n.subject}
                        </div>
                        <div className="idx" style={{ marginTop: 8 }}>{formatWhen(n.sentAt)}</div>
                      </div>
                    </div>
                    <div className="inbox-row-ep" style={{ textAlign: 'right' }}>
                      <div className="ep-badge">{ep}</div>
                      <div className="idx" style={{ marginTop: 4 }}>EP</div>
                    </div>
                  </div>
                );
              })}
              <div style={{ padding: '18px 24px', textAlign: 'center' }} className="idx">
                — END OF FEED · SHOWING {list.length} —
              </div>
            </>
          )}
        </div>

        <div className="inbox-preview-mobile" style={{ padding: 28, background: 'var(--paper-2)' }}>
          <div className="idx" style={{ marginBottom: 12 }}>— SELECTED · EMAIL PREVIEW</div>
          {selected ? (
            <EmailPreview notification={selected} userEmail={user.email} />
          ) : (
            <div className="bubble">Select a notification to preview the email.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmailPreview({ notification, userEmail }) {
  const a = notification.anime || {};
  const animeTitle = (notification.animeTitle || a.title || 'YOUR ANIME').toUpperCase();

  return (
    <div className="shadow-hard" style={{ background: 'var(--paper)', border: '1.5px solid var(--ink)' }}>
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1.5px solid var(--ink)',
          background: 'var(--ink)',
          color: 'var(--paper)',
        }}
      >
        <div className="mono" style={{ fontSize: 10, marginBottom: 6, color: 'var(--paper-3)' }}>
          FROM: ANIMEPHILE &lt;{process.env.NEXT_PUBLIC_FROM_EMAIL || 'updates@animephile.app'}&gt;
        </div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--paper-3)' }}>
          TO: {notification.email || userEmail}
        </div>
        <div className="display" style={{ fontSize: 22, marginTop: 10 }}>{notification.subject}</div>
      </div>

      <div style={{ padding: '24px 22px' }}>
        <Stamp size={60} fontSize={22} rotate={-8} style={{ marginBottom: 16 }}>新</Stamp>

        <div className="display" style={{ fontSize: 30, lineHeight: 0.9 }}>
          NEW EP JUST DROPPED
          <span className="jp" style={{ fontSize: 24 }}>、</span>
        </div>
        <div className="display" style={{ fontSize: 22, lineHeight: 0.9, marginTop: 6, color: 'var(--vermilion)' }}>
          {animeTitle}
        </div>

        <p style={{ fontSize: 14, lineHeight: 1.6, marginTop: 18, color: 'var(--ink-2)' }}>
          {notification.bodyText
            ? notification.bodyText.split('\n').slice(0, 6).join(' ').slice(0, 320)
            : 'A new episode is now streaming. Tap through to watch.'}
        </p>

        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <Link href={`/anime/${notification.malId}`} className="btn btn-primary">
            ▶ OPEN ANIME
          </Link>
          <a
            className="btn"
            href={`https://myanimelist.net/anime/${notification.malId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            VIEW ON MAL
          </a>
        </div>

        <div
          style={{
            marginTop: 28,
            paddingTop: 18,
            borderTop: '1.5px solid var(--paper-3)',
          }}
          className="mono"
        >
          <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>
            You&apos;re getting this because you follow <b>{animeTitle}</b>.<br />
            <Link href="/profile">Manage subscriptions · Pause emails · Unsubscribe</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
