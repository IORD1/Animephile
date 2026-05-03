import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import TopNav from '@/components/ui/TopNav';
import SectionHeader from '@/components/ui/SectionHeader';
import PosterPlaceholder from '@/components/ui/PosterPlaceholder';
import { useAuth } from '@/lib/AuthContext';

function statusLabel(status) {
  if (!status) return 'UNKNOWN';
  const s = status.toLowerCase();
  if (s.includes('publishing')) return 'ONGOING';
  if (s.includes('finished')) return 'COMPLETE';
  if (s.includes('hiatus')) return 'HIATUS';
  return status.toUpperCase();
}

export default function BuzzDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, loading, logout } = useAuth();

  const [manga, setManga] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/');
      return;
    }
    if (!id) return;
    let cancelled = false;
    setManga(null);
    setError(null);
    fetch(`/api/manga/${encodeURIComponent(id)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.message || `status ${r.status}`);
        return d;
      })
      .then((d) => { if (!cancelled) setManga(d.manga); })
      .catch((err) => { if (!cancelled) setError(err.message || 'Failed to load'); });
    return () => { cancelled = true; };
  }, [id, user, loading, router]);

  if (loading || !user) return null;

  if (error) {
    return (
      <div className="ink-root paper-bg" style={{ minHeight: '100vh' }}>
        <TopNav user={user} logout={logout} />
        <p className="idx" style={{ padding: 40, textAlign: 'center' }}>{error}</p>
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="ink-root paper-bg" style={{ minHeight: '100vh' }}>
        <TopNav user={user} logout={logout} />
        <p className="idx" style={{ padding: 40, textAlign: 'center' }}>LOADING…</p>
      </div>
    );
  }

  const title = manga.titleEnglish || manga.title;
  const status = statusLabel(manga.status);

  return (
    <div className="ink-root paper-bg page-shell" style={{ minHeight: '100vh' }}>
      <TopNav user={user} logout={logout} />

      <div
        style={{
          padding: '14px 28px',
          borderBottom: '1.5px solid var(--ink)',
          background: 'var(--paper-2)',
        }}
      >
        <div className="idx">
          <Link href="/" style={{ color: 'var(--muted)' }}>DISCOVER</Link>
          {' / '}
          <span style={{ color: 'var(--muted)' }}>BUZZ TODAY</span>
          {' / '}
          <span style={{ color: 'var(--ink)' }}>{(title || '').toUpperCase()}</span>
        </div>
      </div>

      <div
        className="page-section"
        style={{
          borderBottom: '2.5px solid var(--ink)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div className="halftone-fade" style={{ position: 'absolute', inset: 0, opacity: 0.1 }} />
        <div
          className="detail-hero-sm"
          style={{
            display: 'grid',
            gridTemplateColumns: '320px 1fr 280px',
            gap: 36,
            position: 'relative',
          }}
        >
          <div>
            <div className="shadow-hard rotate-n2">
              <PosterPlaceholder
                title={title?.split(':')[0]}
                jp={(manga.titleJapanese || '').slice(0, 2)}
                w={320}
                h={460}
                variant="halftone"
                imageUrl={manga.imageUrl}
              />
            </div>
            <div className="detail-actions-sm" style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <a
                className="btn btn-primary"
                style={{ justifyContent: 'center', padding: '14px' }}
                href={`https://myanimelist.net/manga/${manga.malId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                READ ON MAL ↗
              </a>
              <Link
                href="/"
                className="btn btn-ghost"
                style={{ justifyContent: 'center', padding: '8px', fontSize: 11 }}
              >
                ← BACK TO BUZZ
              </Link>
            </div>
          </div>

          <div>
            <div className="idx" style={{ marginBottom: 8 }}>
              — {(manga.genres || []).slice(0, 4).map((g) => g.toUpperCase()).join(' · ') || 'GENRES UNKNOWN'}
            </div>
            <h1 className="display" style={{ fontSize: 88, lineHeight: 0.85, margin: 0 }}>
              {title}
              <span style={{ color: 'var(--vermilion)' }}>.</span>
            </h1>
            {manga.titleJapanese && (
              <div className="jp" style={{ fontSize: 28, color: 'var(--muted)', marginTop: 8 }}>
                {manga.titleJapanese}
              </div>
            )}

            <div className="mobile-action-row" style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
              <span className={`chip ${manga.publishing ? 'chip-red' : 'chip-ink'}`}>
                {manga.publishing ? '● PUBLISHING' : status}
              </span>
              {manga.serializations?.[0] && (
                <span className="chip">{manga.serializations[0].toUpperCase()}</span>
              )}
              {manga.chapters != null && <span className="chip">{manga.chapters} CH</span>}
              {manga.volumes != null && <span className="chip">{manga.volumes} VOL</span>}
            </div>

            {manga.authors?.length > 0 && (
              <div className="idx" style={{ marginTop: 14 }}>
                BY {manga.authors.map((a) => a.toUpperCase()).join(' · ')}
              </div>
            )}

            {manga.synopsis && (
              <p
                style={{
                  fontSize: 16,
                  lineHeight: 1.6,
                  marginTop: 24,
                  maxWidth: 580,
                  color: 'var(--ink-2)',
                  whiteSpace: 'pre-wrap',
                }}
                className="detail-summary-sm"
              >
                {manga.synopsis}
              </p>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, auto)',
                gap: 0,
                marginTop: 28,
                border: '1.5px solid var(--ink)',
                background: 'var(--paper)',
                alignSelf: 'flex-start',
                maxWidth: 600,
              }}
              className="detail-quad-sm"
            >
              {[
                { l: 'SCORE', v: manga.score?.toFixed(2) ?? '—', s: '/10', accent: true },
                { l: 'STATUS', v: status, s: '' },
                { l: 'CHAPTERS', v: manga.chapters ?? '—', s: '' },
                { l: 'PUBLISHED', v: manga.published ? manga.published.split(' to ')[0] : '—', s: '' },
              ].map((m, i) => (
                <div
                  key={m.l}
                  style={{
                    padding: '14px 22px',
                    borderRight: i < 3 ? '1.5px solid var(--ink)' : 'none',
                  }}
                >
                  <div className="idx" style={{ marginBottom: 4 }}>{m.l}</div>
                  <div
                    className="display"
                    style={{ fontSize: 24, color: m.accent ? 'var(--vermilion)' : 'var(--ink)' }}
                  >
                    {m.v}
                    {m.s && (
                      <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 4 }}>
                        {m.s}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="shadow-hard detail-side-sm"
            style={{
              background: 'var(--ink)',
              color: 'var(--paper)',
              padding: 24,
              height: 'fit-content',
            }}
          >
            <div className="idx" style={{ color: 'var(--vermilion)', marginBottom: 8 }}>
              — STATS
            </div>
            <div className="display" style={{ fontSize: 18, lineHeight: 1, marginBottom: 14 }}>
              {(manga.serializations || []).map((s) => s.toUpperCase()).join(' / ') || 'NOT SERIALIZED'}
            </div>
            {(manga.themes || []).length > 0 && (
              <>
                <div className="idx" style={{ color: 'var(--paper-3)', marginBottom: 6, marginTop: 12 }}>
                  THEMES
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {manga.themes.map((t) => (
                    <span
                      key={t}
                      className="chip"
                      style={{ background: 'var(--paper)', color: 'var(--ink)' }}
                    >
                      {t.toUpperCase()}
                    </span>
                  ))}
                </div>
              </>
            )}
            {manga.published && (
              <div className="mono" style={{ fontSize: 11, color: 'var(--paper-3)', marginTop: 18 }}>
                PUBLISHED · {manga.published}
              </div>
            )}
          </div>
        </div>
      </div>

      {manga.background && (
        <div style={{ padding: '40px 28px' }}>
          <SectionHeader idx="01" kicker="BEHIND THE COVER" title="BACKGROUND" jp="背景" />
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.7,
              maxWidth: 800,
              color: 'var(--ink-2)',
              whiteSpace: 'pre-wrap',
            }}
          >
            {manga.background}
          </p>
        </div>
      )}
    </div>
  );
}
