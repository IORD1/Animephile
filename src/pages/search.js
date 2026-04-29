import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import TopNav from '@/components/ui/TopNav';
import SearchBar from '@/components/ui/SearchBar';
import PosterPlaceholder from '@/components/ui/PosterPlaceholder';
import { useAuth } from '@/lib/AuthContext';
import { useSubscriptions } from '@/lib/useSubscriptions';
import { getPosterUrl } from '@/lib/anime-utils';

function highlight(text, query) {
  if (!query || !text) return text;
  const trimmed = query.trim();
  if (!trimmed) return text;
  const re = new RegExp(`(${trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i');
  const parts = String(text).split(re);
  return parts.map((p, i) => {
    if (i % 2 === 1) {
      return (
        <span key={i} style={{ background: 'var(--highlight)', padding: '0 4px' }}>
          {p}
        </span>
      );
    }
    return <span key={i}>{p}</span>;
  });
}

export default function SearchPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { follow } = useSubscriptions();

  const [data, setData] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState(null);
  const [subs, setSubs] = useState([]);
  const [genreFilters, setGenreFilters] = useState(new Set());
  const [statusFilters, setStatusFilters] = useState(new Set());

  const q = typeof router.query.q === 'string' ? router.query.q : '';

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
    setLoadingResults(true);
    setError(null);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (genreFilters.size) params.set('genre', [...genreFilters].join(','));
    if (statusFilters.size) params.set('status', [...statusFilters].join(','));
    fetch(`/api/search?${params.toString()}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.message || `status ${r.status}`);
        return d;
      })
      .then((d) => { if (!cancelled) setData(d); })
      .catch((err) => { if (!cancelled) setError(err.message || 'Search failed'); })
      .finally(() => { if (!cancelled) setLoadingResults(false); });
    return () => { cancelled = true; };
  }, [q, user, loading, genreFilters, statusFilters]);

  const subIds = useMemo(() => new Set(subs.map((s) => s.malId)), [subs]);

  function toggleGenre(g) {
    const next = new Set(genreFilters);
    if (next.has(g)) next.delete(g);
    else next.add(g);
    setGenreFilters(next);
  }
  function toggleStatus(s) {
    const next = new Set(statusFilters);
    if (next.has(s)) next.delete(s);
    else next.add(s);
    setStatusFilters(next);
  }
  function clearFilters() {
    setGenreFilters(new Set());
    setStatusFilters(new Set());
  }

  async function handleFollow(item) {
    const res = await follow(item.malId, item.title, item);
    if (res?.added) {
      setSubs((prev) => [...prev, { malId: item.malId, animeTitle: item.title }]);
    }
  }

  if (loading || !user) return null;

  const results = data?.results || [];
  const facetGenres = data?.facets?.genres || [];
  const facetStatuses = data?.facets?.statuses || [];
  const total = data?.total ?? 0;
  const took = data?.took ?? 0;

  const activeFilters = [
    ...[...genreFilters].map((g) => ({ id: `g-${g}`, label: `GENRE: ${g.toUpperCase()}`, clear: () => toggleGenre(g) })),
    ...[...statusFilters].map((s) => ({ id: `s-${s}`, label: `STATUS: ${(s || '').toUpperCase()}`, clear: () => toggleStatus(s) })),
  ];

  return (
    <div className="ink-root paper-bg" style={{ minHeight: '100vh' }}>
      <TopNav user={user} logout={logout} searchEnabled />

      <div style={{ padding: '40px 28px', borderBottom: '2.5px solid var(--ink)', position: 'relative' }}>
        <div className="halftone-fade" style={{ position: 'absolute', inset: 0, opacity: 0.08 }} />
        <div style={{ position: 'relative' }}>
          <div className="idx" style={{ marginBottom: 8 }}>
            {loadingResults ? '— SEARCHING…' : `— SHOWING ${results.length} OF ${total} RESULTS · ${(took / 1000).toFixed(2)}S`}
          </div>
          <h1 className="display" style={{ fontSize: 76, lineHeight: 0.85, marginBottom: 20 }}>
            {q ? <>&quot;{q.toUpperCase()}<span style={{ color: 'var(--vermilion)' }}>&quot;</span></> : 'SEARCH'}
            <span className="jp" style={{ fontSize: 50 }}>。</span>
          </h1>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, maxWidth: 600, minWidth: 280 }}>
              <SearchBar wide enabled initialValue={q} />
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div
              style={{
                marginTop: 18,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <span className="idx">ACTIVE FILTERS:</span>
              {activeFilters.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className="chip"
                  onClick={f.clear}
                  style={{ cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  {f.label} ✕
                </button>
              ))}
              <button
                type="button"
                onClick={clearFilters}
                className="idx"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--vermilion)',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                CLEAR ALL
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: 800 }}>
        <div
          style={{
            borderRight: '1.5px solid var(--ink)',
            padding: 28,
            background: 'var(--paper-2)',
          }}
        >
          <FacetGroup
            label="GENRE"
            items={facetGenres.map((f) => ({ name: f._id, count: f.count, on: genreFilters.has(f._id) }))}
            onToggle={toggleGenre}
          />
          <FacetGroup
            label="STATUS"
            items={facetStatuses
              .filter((f) => f._id)
              .map((f) => ({ name: f._id, count: f.count, on: statusFilters.has(f._id) }))}
            onToggle={toggleStatus}
          />
        </div>

        <div style={{ padding: 28 }}>
          {error && (
            <p className="idx" style={{ color: 'var(--vermilion)', marginBottom: 18 }}>{error}</p>
          )}

          {!loadingResults && results.length === 0 && (
            <div className="bubble shadow-hard-sm" style={{ padding: 16 }}>
              <div className="display" style={{ fontSize: 18, marginBottom: 4 }}>
                NO MATCHES IN OUR INDEX
              </div>
              <div style={{ fontSize: 13 }}>
                Our search runs over anime users have already opened. Try clicking around the home page first
                to populate the index, or try a different query.
              </div>
            </div>
          )}

          {results.map((r, i) => {
            const followed = subIds.has(r.malId);
            const cover = getPosterUrl(r);
            return (
              <Link
                key={r.malId}
                href={`/anime/${r.malId}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr auto',
                  gap: 22,
                  padding: '20px 0',
                  borderBottom: i < results.length - 1 ? '1.5px solid var(--paper-3)' : 'none',
                  alignItems: 'center',
                  color: 'inherit',
                  textDecoration: 'none',
                }}
              >
                <div style={{ width: 120, height: 168 }}>
                  <PosterPlaceholder
                    title={(r.titleEnglish || r.title || '').split(/[:×]/)[0].trim().slice(0, 12)}
                    jp={(r.titleJapanese || '').slice(0, 2)}
                    w={120}
                    h={168}
                    variant={i % 2 ? 'halftone' : 'stripes'}
                    accent={i === 0 ? 'red' : 'ink'}
                    imageUrl={cover}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span
                      className={`chip ${r.airing ? 'chip-red' : 'chip-ink'}`}
                      style={{ fontSize: 9 }}
                    >
                      {(r.status || 'UNKNOWN').toUpperCase()}
                    </span>
                    <span className="idx">
                      {r.episodes ? `${r.episodes} EPS` : '— EPS'} ·{' '}
                      {(r.genres || []).slice(0, 2).map((g) => g.toUpperCase()).join(' · ') || '—'}
                    </span>
                  </div>
                  <div className="display" style={{ fontSize: 30, lineHeight: 1 }}>
                    {highlight(r.titleEnglish || r.title, q)}
                  </div>
                  {r.titleJapanese && (
                    <div className="jp" style={{ fontSize: 16, color: 'var(--muted)', marginTop: 2 }}>
                      {highlight(r.titleJapanese, q)}
                    </div>
                  )}
                  {r.synopsis && (
                    <p
                      style={{
                        fontSize: 13,
                        lineHeight: 1.5,
                        marginTop: 10,
                        maxWidth: 540,
                        color: 'var(--ink-2)',
                      }}
                    >
                      {r.synopsis.length > 240 ? `${r.synopsis.slice(0, 240).trim()}…` : r.synopsis}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="display" style={{ fontSize: 36, color: 'var(--vermilion)' }}>
                    {r.score?.toFixed(2) ?? '—'}
                  </div>
                  <div className="idx" style={{ marginBottom: 16 }}>SCORE / 10</div>
                  <button
                    type="button"
                    className={`btn ${followed ? 'btn-primary' : ''}`}
                    style={{ padding: '10px 14px', fontSize: 11 }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!followed) handleFollow(r);
                    }}
                    disabled={followed}
                  >
                    {followed ? '✓ FOLLOWING' : '+ FOLLOW'}
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FacetGroup({ label, items, onToggle }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginBottom: 28 }}>
      <div
        className="display"
        style={{
          fontSize: 16,
          marginBottom: 12,
          paddingBottom: 6,
          borderBottom: '1.5px solid var(--ink)',
        }}
      >
        {label}
      </div>
      {items.map((it) => (
        <label
          key={it.name}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 0',
            cursor: 'pointer',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: it.on ? 700 : 400 }}>
            <input
              type="checkbox"
              checked={it.on}
              onChange={() => onToggle(it.name)}
              style={{ display: 'none' }}
            />
            <span
              style={{
                width: 16, height: 16, border: '1.5px solid var(--ink)',
                background: it.on ? 'var(--vermilion)' : 'var(--paper)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--paper)', fontSize: 12, fontWeight: 900,
              }}
            >
              {it.on && '✓'}
            </span>
            {it.name}
          </span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>{it.count}</span>
        </label>
      ))}
    </div>
  );
}
