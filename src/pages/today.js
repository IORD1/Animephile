import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import TopNav from '@/components/ui/TopNav';
import SectionHeader from '@/components/ui/SectionHeader';
import PosterPlaceholder from '@/components/ui/PosterPlaceholder';
import { useAuth } from '@/lib/AuthContext';
import { useSubscriptions } from '@/lib/useSubscriptions';
import { getPosterUrl, dedupeAnime, sortByScore } from '@/lib/anime-utils';

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

function formatRank(n) {
  return String(n).padStart(2, '0');
}

export default function TodayPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { follow } = useSubscriptions();

  const [items, setItems] = useState(null);
  const [subs, setSubs] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/');
      return;
    }
    fetch(`/api/subscriptions?firebaseUid=${encodeURIComponent(user.uid)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setSubs(d?.subscriptions || []))
      .catch(() => {});
  }, [user, loading, router]);

  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    setError(null);
    fetch('/api/browse/today')
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.message || `status ${r.status}`);
        return d;
      })
      .then((d) => { if (!cancelled) setItems(d.data || []); })
      .catch((err) => { if (!cancelled) setError(err.message || 'Failed to load'); });
    return () => { cancelled = true; };
  }, [user, loading]);

  const ranked = useMemo(() => sortByScore(dedupeAnime(items || [])), [items]);
  const subIds = useMemo(() => new Set(subs.map((s) => s.malId)), [subs]);
  const dayName = DAY_NAMES[new Date().getDay()];

  async function handleFollow(item) {
    const res = await follow(item.mal_id, item.title, item);
    if (res?.added) {
      setSubs((prev) => [...prev, { malId: item.mal_id, animeTitle: item.title }]);
    }
  }

  if (loading || !user) return null;

  const total = ranked.length;

  return (
    <div className="ink-root paper-bg" style={{ minHeight: '100vh' }}>
      <TopNav user={user} logout={logout} />

      <div style={{ padding: 'clamp(24px, 5vw, 40px) clamp(16px, 4vw, 28px)', borderBottom: '2.5px solid var(--ink)', position: 'relative' }}>
        <div className="halftone-fade" style={{ position: 'absolute', inset: 0, opacity: 0.08 }} />
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 18, flexWrap: 'wrap' }}>
          <div>
            <div className="idx" style={{ marginBottom: 8 }}>
              — {dayName} · RANKED BY USER SCORE
            </div>
            <h1 className="display" style={{ fontSize: 'clamp(36px, 9vw, 76px)', lineHeight: 0.85, margin: 0 }}>
              DROPS <span style={{ color: 'var(--vermilion)' }}>TODAY</span>
              <span className="jp" style={{ fontSize: 'clamp(28px, 6vw, 50px)', marginLeft: 8 }}>。</span>
            </h1>
          </div>
          <div className="bubble shadow-hard-sm" style={{ maxWidth: 280 }}>
            <b style={{ color: 'var(--vermilion)' }}>{total}</b> {total === 1 ? 'anime drops' : 'anime drop'} today.
            Ranked by user score — highest first.
          </div>
        </div>
      </div>

      <div style={{ padding: 'clamp(24px, 5vw, 40px) clamp(16px, 4vw, 28px)' }}>
        <SectionHeader idx="01" kicker="THE LINEUP" title="EVERYTHING AIRING" jp="本日放送" />

        {error && <p className="idx" style={{ color: 'var(--vermilion)', marginBottom: 18 }}>{error}</p>}

        {!items && !error && <p className="idx" style={{ textAlign: 'center', padding: 40 }}>LOADING…</p>}

        {items && total === 0 && (
          <div className="bubble">Nothing scheduled for today. Check back tomorrow.</div>
        )}

        {total > 0 && (
          <div style={{ border: '1.5px solid var(--ink)', background: 'var(--paper)' }}>
            {ranked.map((r, i) => {
              const rank = i + 1;
              const followed = subIds.has(r.mal_id);
              const cover = getPosterUrl(r);
              const titleEn = r.title_english || r.title;
              const genres = (r.genres || []).map((g) => g.name || g).filter(Boolean);
              const score = typeof r.score === 'number' ? r.score.toFixed(2) : '—';
              return (
                <Link
                  key={r.mal_id}
                  href={`/anime/${r.mal_id}`}
                  className="top-row-sm"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 100px 2.5fr 1fr auto auto',
                    alignItems: 'center',
                    gap: 18,
                    padding: '16px 22px',
                    borderBottom: i < ranked.length - 1 ? '1.5px solid var(--paper-3)' : 'none',
                    background: i % 2 === 0 ? 'var(--paper)' : 'var(--paper-2)',
                    color: 'inherit',
                    textDecoration: 'none',
                  }}
                >
                  <div
                    className="display top-row-rank"
                    style={{
                      fontSize: 44,
                      color: rank <= 3 ? 'var(--vermilion)' : 'var(--ink)',
                      lineHeight: 0.9,
                    }}
                  >
                    {formatRank(rank)}
                  </div>
                  <div className="top-row-poster" style={{ width: 80, height: 110 }}>
                    <PosterPlaceholder
                      title={(titleEn || '').split(/[:×]/)[0].trim().slice(0, 12)}
                      jp={(r.title_japanese || '').slice(0, 1)}
                      w={80}
                      h={110}
                      variant={i % 2 ? 'halftone' : 'stripes'}
                      imageUrl={cover}
                    />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="display" style={{ fontSize: 22, lineHeight: 1, textTransform: 'none' }}>
                      {titleEn}
                    </div>
                    {r.title_japanese && (
                      <div className="jp" style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                        {r.title_japanese}
                      </div>
                    )}
                    <div className="idx" style={{ marginTop: 6 }}>
                      {genres.slice(0, 3).map((g) => g.toUpperCase()).join(' · ') || '—'}
                    </div>
                  </div>
                  <div className="top-row-status">
                    <div className="mono" style={{ fontSize: 11, fontWeight: 700 }}>
                      {(r.status || 'UNKNOWN').toUpperCase()}
                    </div>
                    <div className="idx" style={{ marginTop: 4 }}>
                      {r.episodes ? `${r.episodes} EPS` : '— EPS'}
                    </div>
                  </div>
                  <div className="top-row-score-cell" style={{ textAlign: 'right' }}>
                    <div className="display" style={{ fontSize: 30, color: 'var(--vermilion)' }}>
                      {score}
                    </div>
                    <div className="idx" style={{ marginTop: 2 }}>SCORE / 10</div>
                  </div>
                  <button
                    type="button"
                    className={`btn ${followed ? 'btn-primary' : ''}`}
                    style={{ padding: '8px 12px', fontSize: 11 }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!followed) handleFollow(r);
                    }}
                    disabled={followed}
                  >
                    {followed ? '✓ FOLLOWING' : '+ FOLLOW'}
                  </button>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
