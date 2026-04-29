import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import TopNav from '@/components/ui/TopNav';
import SectionHeader from '@/components/ui/SectionHeader';
import PosterPlaceholder from '@/components/ui/PosterPlaceholder';
import { useAuth } from '@/lib/AuthContext';
import { useSubscriptions } from '@/lib/useSubscriptions';
import { getPosterUrl } from '@/lib/anime-utils';

const PAGE_SIZE = 25;

function formatRank(n) {
  return String(n).padStart(2, '0');
}

export default function TopPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { follow } = useSubscriptions();

  const page = Math.max(1, parseInt(router.query.page, 10) || 1);

  const [data, setData] = useState(null);
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
    fetch(`/api/search?page=${page}&limit=${PAGE_SIZE}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.message || `status ${r.status}`);
        return d;
      })
      .then((d) => { if (!cancelled) setData(d); })
      .catch((err) => { if (!cancelled) setError(err.message || 'Failed to load'); });
    return () => { cancelled = true; };
  }, [page, user, loading]);

  const subIds = useMemo(() => new Set(subs.map((s) => s.malId)), [subs]);

  async function handleFollow(item) {
    const res = await follow(item.malId, item.title, item);
    if (res?.added) {
      setSubs((prev) => [...prev, { malId: item.malId, animeTitle: item.title }]);
    }
  }

  if (loading || !user) return null;

  const results = data?.results || [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const baseRank = (page - 1) * PAGE_SIZE;

  return (
    <div className="ink-root paper-bg" style={{ minHeight: '100vh' }}>
      <TopNav user={user} logout={logout} />

      <div style={{ padding: '40px 28px', borderBottom: '2.5px solid var(--ink)', position: 'relative' }}>
        <div className="halftone-fade" style={{ position: 'absolute', inset: 0, opacity: 0.08 }} />
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 18, flexWrap: 'wrap' }}>
          <div>
            <div className="idx" style={{ marginBottom: 8 }}>
              — RANKED BY USER SCORE · LIVE FROM YOUR INDEX
            </div>
            <h1 className="display" style={{ fontSize: 76, lineHeight: 0.85, margin: 0 }}>
              TOP RATED <span style={{ color: 'var(--vermilion)' }}>{total}</span>
              <span className="jp" style={{ fontSize: 50, marginLeft: 8 }}>。</span>
            </h1>
          </div>
          <div className="bubble shadow-hard-sm" style={{ maxWidth: 280 }}>
            Page <b>{page}</b> of <b>{totalPages}</b>. Indexed{' '}
            <b style={{ color: 'var(--vermilion)' }}>{total}</b> anime so far.
          </div>
        </div>
      </div>

      <div style={{ padding: '40px 28px' }}>
        <SectionHeader idx="01" kicker="THE LEADERBOARD" title="EVERYTHING WE'VE GOT" jp="ランキング" />

        {error && <p className="idx" style={{ color: 'var(--vermilion)', marginBottom: 18 }}>{error}</p>}

        {!data && !error && <p className="idx" style={{ textAlign: 'center', padding: 40 }}>LOADING…</p>}

        {data && results.length === 0 && (
          <div className="bubble">
            Our index is empty. Run <code className="mono">npm run db:seed</code> to populate it from Jikan.
          </div>
        )}

        {results.length > 0 && (
          <div style={{ border: '1.5px solid var(--ink)', background: 'var(--paper)' }}>
            {results.map((r, i) => {
              const rank = baseRank + i + 1;
              const followed = subIds.has(r.malId);
              const cover = getPosterUrl(r);
              return (
                <Link
                  key={r.malId}
                  href={`/anime/${r.malId}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 100px 2.5fr 1fr auto auto',
                    alignItems: 'center',
                    gap: 18,
                    padding: '16px 22px',
                    borderBottom: i < results.length - 1 ? '1.5px solid var(--paper-3)' : 'none',
                    background: i % 2 === 0 ? 'var(--paper)' : 'var(--paper-2)',
                    color: 'inherit',
                    textDecoration: 'none',
                  }}
                >
                  <div
                    className="display"
                    style={{
                      fontSize: 44,
                      color: rank <= 3 ? 'var(--vermilion)' : 'var(--ink)',
                      lineHeight: 0.9,
                    }}
                  >
                    {formatRank(rank)}
                  </div>
                  <div style={{ width: 80, height: 110 }}>
                    <PosterPlaceholder
                      title={(r.titleEnglish || r.title || '').split(/[:×]/)[0].trim().slice(0, 12)}
                      jp={(r.titleJapanese || '').slice(0, 1)}
                      w={80}
                      h={110}
                      variant={i % 2 ? 'halftone' : 'stripes'}
                      imageUrl={cover}
                    />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="display" style={{ fontSize: 22, lineHeight: 1, textTransform: 'none' }}>
                      {r.titleEnglish || r.title}
                    </div>
                    {r.titleJapanese && (
                      <div className="jp" style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                        {r.titleJapanese}
                      </div>
                    )}
                    <div className="idx" style={{ marginTop: 6 }}>
                      {(r.genres || []).slice(0, 3).map((g) => g.toUpperCase()).join(' · ') || '—'}
                    </div>
                  </div>
                  <div>
                    <div className="mono" style={{ fontSize: 11, fontWeight: 700 }}>
                      {(r.status || 'UNKNOWN').toUpperCase()}
                    </div>
                    <div className="idx" style={{ marginTop: 4 }}>
                      {r.episodes ? `${r.episodes} EPS` : '— EPS'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="display" style={{ fontSize: 30, color: 'var(--vermilion)' }}>
                      {r.score?.toFixed(2) ?? '—'}
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

        {totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 32,
              gap: 12,
            }}
          >
            <Link
              href={`/top?page=${Math.max(1, page - 1)}`}
              className={`btn ${page <= 1 ? 'btn-ghost' : ''}`}
              style={{ pointerEvents: page <= 1 ? 'none' : 'auto', opacity: page <= 1 ? 0.4 : 1 }}
            >
              ← PREV
            </Link>
            <div className="idx">
              PAGE {page} / {totalPages}
            </div>
            <Link
              href={`/top?page=${Math.min(totalPages, page + 1)}`}
              className={`btn ${page >= totalPages ? 'btn-ghost' : ''}`}
              style={{
                pointerEvents: page >= totalPages ? 'none' : 'auto',
                opacity: page >= totalPages ? 0.4 : 1,
              }}
            >
              NEXT →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
