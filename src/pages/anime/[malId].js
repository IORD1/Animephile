import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import TopNav from '@/components/ui/TopNav';
import SectionHeader from '@/components/ui/SectionHeader';
import PosterPlaceholder from '@/components/ui/PosterPlaceholder';
import { useAuth } from '@/lib/AuthContext';
import { useSubscriptions } from '@/lib/useSubscriptions';
import { nextBroadcast, diffParts, pad2, approxAiredEpisode } from '@/lib/anime-time';

function formatDateInTz(date, tz) {
  if (!date) return '—';
  try {
    return date
      .toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: '2-digit', timeZone: tz,
      })
      .toUpperCase();
  } catch {
    return '—';
  }
}

function formatTimeInTz(date, tz, label) {
  if (!date) return '—';
  try {
    const t = date.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz,
    });
    return `${t} ${label}`;
  } catch {
    return '—';
  }
}

function formatEpDate(epAired) {
  if (!epAired) return '—';
  const d = new Date(epAired);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: '2-digit',
  }).toUpperCase();
}

function useCountdown(target) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [target]);
  return target ? diffParts(target, now) : null;
}

export default function AnimeDetailPage() {
  const router = useRouter();
  const { malId } = router.query;
  const { user, loading, logout } = useAuth();
  const { follow } = useSubscriptions();

  const [anime, setAnime] = useState(null);
  const [error, setError] = useState(null);
  const [episodes, setEpisodes] = useState(null);
  const [characters, setCharacters] = useState(null);
  const [following, setFollowing] = useState(false);
  const [followMessage, setFollowMessage] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/');
      return;
    }
    if (!malId) return;

    let cancelled = false;
    setAnime(null);
    setEpisodes(null);
    setCharacters(null);
    setError(null);

    fetch(`/api/anime/${encodeURIComponent(malId)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.message || `status ${r.status}`);
        return d;
      })
      .then((d) => { if (!cancelled) setAnime(d.anime); })
      .catch((err) => { if (!cancelled) setError(err.message || 'Failed to load anime'); });

    fetch(`/api/anime/${encodeURIComponent(malId)}/episodes`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d) setEpisodes(d.episodes || []); })
      .catch(() => {});

    fetch(`/api/anime/${encodeURIComponent(malId)}/characters`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d) setCharacters(d.characters || []); })
      .catch(() => {});

    const numericMalId = parseInt(malId, 10);
    fetch(`/api/subscriptions?firebaseUid=${encodeURIComponent(user.uid)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return;
        const subs = d.subscriptions || [];
        setIsSubscribed(subs.some((s) => s.malId === numericMalId));
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [malId, user, loading, router]);

  const broadcast = anime?.broadcast || {};
  const broadcastDay = broadcast.day;
  const broadcastTime = broadcast.time;
  const broadcastTimezone = broadcast.timezone;
  const tz = broadcastTimezone || 'Asia/Tokyo';
  const tzLabel = tz === 'Asia/Tokyo' ? 'JST' : tz.split('/').pop().toUpperCase();

  const nextDate = useMemo(
    () => nextBroadcast({ day: broadcastDay, time: broadcastTime, timezone: broadcastTimezone }),
    [broadcastDay, broadcastTime, broadcastTimezone],
  );
  const countdown = useCountdown(nextDate);

  const airedCount = Array.isArray(episodes) ? episodes.length : null;

  const episodesLabel = useMemo(() => {
    const total = anime?.episodes;
    if (typeof total === 'number' && total > 0) {
      if (airedCount != null && airedCount < total) return `${airedCount} / ${total}`;
      return String(total);
    }
    if (airedCount != null && airedCount > 0) return String(airedCount);
    const approx = approxAiredEpisode(anime?.rawJikan);
    if (approx) return String(approx);
    return '—';
  }, [anime?.episodes, anime?.rawJikan, airedCount]);

  const upcomingEpisodeNumber = useMemo(() => {
    if (airedCount != null) return airedCount + 1;
    const approx = approxAiredEpisode(anime?.rawJikan);
    if (approx) return approx + 1;
    const total = anime?.episodes;
    if (typeof total === 'number' && total > 0) return total + 1;
    return null;
  }, [anime?.episodes, anime?.rawJikan, airedCount]);

  const recentAired = useMemo(() => {
    if (!Array.isArray(episodes)) return [];
    return [...episodes].sort((a, b) => (b.mal_id || 0) - (a.mal_id || 0)).slice(0, 5);
  }, [episodes]);

  const mainCharacters = useMemo(() => {
    if (!Array.isArray(characters)) return [];
    return characters
      .filter((c) => c.role === 'Main')
      .slice(0, 6)
      .concat(
        characters
          .filter((c) => c.role !== 'Main')
          .slice(0, Math.max(0, 6 - characters.filter((c) => c.role === 'Main').length))
      );
  }, [characters]);

  async function onFollow() {
    if (!anime) return;
    setFollowing(true);
    setFollowMessage(null);
    try {
      const result = await follow(anime.malId, anime.title, anime.rawJikan);
      if (result.added) {
        setFollowMessage('FOLLOWING — EMAIL ON');
        setIsSubscribed(true);
      } else if (result.alreadySubscribed) {
        setFollowMessage('ALREADY FOLLOWING');
        setIsSubscribed(true);
      } else {
        setFollowMessage('COULD NOT FOLLOW');
      }
    } catch {
      setFollowMessage('COULD NOT FOLLOW');
    } finally {
      setFollowing(false);
    }
  }

  if (loading || !user) return null;

  if (error) {
    return (
      <div className="ink-root paper-bg" style={{ minHeight: '100vh' }}>
        <TopNav user={user} logout={logout} />
        <p className="idx" style={{ padding: 40, textAlign: 'center' }}>{error}</p>
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="ink-root paper-bg" style={{ minHeight: '100vh' }}>
        <TopNav user={user} logout={logout} />
        <p className="idx" style={{ padding: 40, textAlign: 'center' }}>LOADING…</p>
      </div>
    );
  }

  const titleEn = anime.titleEnglish || anime.title;
  const cover = anime.imageUrl;
  const score = anime.score?.toFixed(2);
  const stats = [
    { l: 'SCORE', v: score ?? '—', s: score ? '/10' : 'NOT RATED YET', accent: true },
    { l: 'STATUS', v: (anime.status || 'UNKNOWN').toUpperCase().slice(0, 12), s: '' },
    { l: 'EPISODES', v: episodesLabel, s: '' },
    { l: 'AIRS', v: broadcast.day ? broadcast.day.slice(0, 3).toUpperCase() : '—', s: broadcast.time ? `${broadcast.time} ${tzLabel}` : '' },
  ];

  const studioName = anime.rawJikan?.studios?.[0]?.name?.toUpperCase();
  const ratingChip = anime.rawJikan?.rating ? anime.rawJikan.rating.split(' - ')[0].toUpperCase() : null;
  const genres = anime.genres || [];

  return (
    <div className="ink-root paper-bg page-shell" style={{ minHeight: '100vh' }}>
      <TopNav user={user} logout={logout} />

      <div style={{ padding: '14px clamp(16px, 4vw, 28px)', borderBottom: '1.5px solid var(--ink)', background: 'var(--paper-2)' }}>
        <div className="idx">
          <Link href="/" style={{ color: 'var(--muted)' }}>DISCOVER</Link>
          {genres[0] && (
            <>
              {' / '}
              <span style={{ color: 'var(--muted)' }}>{genres[0].toUpperCase()}</span>
            </>
          )}
          {' / '}
          <span style={{ color: 'var(--ink)' }}>{(titleEn || '').toUpperCase()}</span>
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
          className="detail-main-sm detail-hero-sm"
          style={{
            display: 'grid',
            gridTemplateColumns: '320px 1fr 280px',
            gap: 'clamp(20px, 4vw, 36px)',
            position: 'relative',
          }}
        >
          <div className="detail-poster-sm">
            <div className="shadow-hard rotate-n2">
              <PosterPlaceholder
                title={titleEn?.split(':')[0]}
                jp={(anime.titleJapanese || '').slice(0, 2)}
                w={320}
                h={460}
                variant="halftone"
                accent="red"
                imageUrl={cover}
              />
            </div>
            <div className="detail-actions-sm" style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ justifyContent: 'center', padding: '14px' }}
                onClick={onFollow}
                disabled={following || isSubscribed}
              >
                {followMessage || (
                  following ? 'FOLLOWING…'
                  : isSubscribed ? '✓ FOLLOWING — EMAIL ON'
                  : '+ FOLLOW — EMAIL ON SIGNUP'
                )}
              </button>
              {anime.trailerUrl && (
                <a
                  className="btn"
                  style={{ justifyContent: 'center', padding: '14px' }}
                  href={anime.trailerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ▶ WATCH TRAILER
                </a>
              )}
              <a
                className="btn btn-ghost"
                style={{ justifyContent: 'center', padding: '8px', fontSize: 11 }}
                href={`https://myanimelist.net/anime/${anime.malId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                VIEW ON MAL ↗
              </a>
            </div>
          </div>

          <div>
            <div className="idx" style={{ marginBottom: 8 }}>
              — {[...genres.slice(0, 4)].map((g) => g.toUpperCase()).join(' · ') || 'GENRES UNKNOWN'}
            </div>
            <h1 className="display" style={{ fontSize: 'clamp(36px, 10vw, 88px)', lineHeight: 0.85, margin: 0, wordBreak: 'break-word' }}>
              {titleEn}
              <span style={{ color: 'var(--vermilion)' }}>.</span>
            </h1>
            {anime.titleJapanese && (
              <div className="jp" style={{ fontSize: 'clamp(18px, 4vw, 28px)', color: 'var(--muted)', marginTop: 8 }}>
                {anime.titleJapanese}
              </div>
            )}

            <div className="mobile-action-row" style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
              {anime.airing && <span className="chip chip-red">● AIRING NOW</span>}
              {studioName && <span className="chip">{studioName}</span>}
              {episodesLabel !== '—' && <span className="chip">{episodesLabel} EPS</span>}
              {ratingChip && <span className="chip">{ratingChip}</span>}
            </div>

            {anime.synopsis && (
              <p
                style={{
                  fontSize: 16,
                  lineHeight: 1.55,
                  marginTop: 24,
                  maxWidth: 580,
                  color: 'var(--ink-2)',
                }}
                className="detail-summary-sm"
              >
                {anime.synopsis.length > 360 ? `${anime.synopsis.slice(0, 360).trim()}…` : anime.synopsis}
              </p>
            )}

            <div
              className="detail-stats-sm detail-quad-sm"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 0,
                marginTop: 28,
                border: '1.5px solid var(--ink)',
                background: 'var(--paper)',
                alignSelf: 'flex-start',
                maxWidth: 600,
              }}
            >
              {stats.map((m, i) => (
                <div
                  key={m.l}
                  style={{
                    padding: 'clamp(10px, 2vw, 14px) clamp(12px, 2.5vw, 22px)',
                    borderRight: i < stats.length - 1 ? '1.5px solid var(--ink)' : 'none',
                    minWidth: 0,
                  }}
                >
                  <div className="idx" style={{ marginBottom: 4 }}>{m.l}</div>
                  <div
                    className="display"
                    style={{
                      fontSize: 'clamp(20px, 4vw, 28px)',
                      color: m.accent ? 'var(--vermilion)' : 'var(--ink)',
                    }}
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
              — NEXT EPISODE DROPS IN
            </div>
            {countdown ? (
              <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                {[
                  { v: pad2(countdown.days), l: 'DAYS' },
                  { v: pad2(countdown.hours), l: 'HRS' },
                  { v: pad2(countdown.mins), l: 'MIN' },
                  { v: pad2(countdown.secs), l: 'SEC' },
                ].map((t) => (
                  <div
                    key={t.l}
                    style={{
                      background: 'var(--paper)',
                      color: 'var(--ink)',
                      padding: '10px 8px',
                      minWidth: 50,
                      textAlign: 'center',
                      border: '1.5px solid var(--vermilion)',
                    }}
                  >
                    <div className="display" style={{ fontSize: 26 }}>{t.v}</div>
                    <div className="idx" style={{ fontSize: 8, marginTop: 2 }}>{t.l}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mono" style={{ color: 'var(--paper-3)', marginTop: 10, fontSize: 11 }}>
                NO BROADCAST SCHEDULE
              </div>
            )}

            {nextDate && (
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1.5px dashed var(--paper-3)' }}>
                {upcomingEpisodeNumber != null && (
                  <div className="idx" style={{ color: 'var(--paper-3)', marginBottom: 4 }}>
                    EPISODE {upcomingEpisodeNumber}
                  </div>
                )}
                <div className="display" style={{ fontSize: 18, lineHeight: 1, marginTop: 6 }}>
                  {formatDateInTz(nextDate, tz)} · {formatTimeInTz(nextDate, tz, tzLabel)}
                </div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--paper-3)', marginTop: 6 }}>
                  ({formatTimeInTz(nextDate, Intl.DateTimeFormat().resolvedOptions().timeZone, 'LOCAL')})
                </div>
              </div>
            )}

            {user.email && (
              <div className="bubble bubble-up" style={{ marginTop: 18, background: 'var(--paper)', color: 'var(--ink)' }}>
                {isSubscribed ? (
                  <>We&apos;ll email <b>{user.email}</b> the moment it drops.</>
                ) : (
                  <>Follow to get an email at <b>{user.email}</b> when it drops.</>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {(recentAired.length > 0 || upcomingEpisodeNumber != null) && (
        <div className="page-section" style={{ borderBottom: '2.5px solid var(--ink)' }}>
          <SectionHeader idx="01" kicker="THE EPISODE LOG" title="EPISODES" jp="エピソード" />

          <div className="detail-episodes-sm" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {upcomingEpisodeNumber != null && nextDate && (
              <div
                style={{
                  display: 'flex',
                  gap: 14,
                  padding: 14,
                  border: '1.5px solid var(--ink)',
                  background: 'var(--ink)',
                  color: 'var(--paper)',
                }}
              >
                <div
                  className="display"
                  style={{
                    fontSize: 48,
                    color: 'var(--vermilion)',
                    minWidth: 70,
                    lineHeight: 0.9,
                  }}
                >
                  {upcomingEpisodeNumber}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="idx" style={{ color: 'var(--paper-3)' }}>
                    {formatDateInTz(nextDate, tz)}
                  </div>
                  <div
                    className="display"
                    style={{ fontSize: 20, marginTop: 4, textTransform: 'none' }}
                  >
                    Coming up
                  </div>
                  <div className="idx" style={{ marginTop: 6, color: 'var(--vermilion)' }}>
                    {isSubscribed ? '● COMING UP — YOU’LL GET AN EMAIL' : '● COMING UP — FOLLOW TO GET EMAILED'}
                  </div>
                </div>
              </div>
            )}
            {recentAired.map((e) => (
              <div
                key={e.mal_id}
                style={{
                  display: 'flex',
                  gap: 14,
                  padding: 14,
                  border: '1.5px solid var(--ink)',
                  background: 'var(--paper)',
                  color: 'var(--ink)',
                }}
              >
                <div
                  className="display"
                  style={{
                    fontSize: 48,
                    color: 'var(--vermilion)',
                    minWidth: 70,
                    lineHeight: 0.9,
                  }}
                >
                  {e.mal_id}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="idx" style={{ color: 'var(--muted)' }}>{formatEpDate(e.aired)}</div>
                  <div
                    className="display"
                    style={{ fontSize: 20, marginTop: 4, textTransform: 'none' }}
                  >
                    {e.title || `Episode ${e.mal_id}`}
                  </div>
                  <div className="idx" style={{ marginTop: 6, color: 'var(--muted)' }}>
                    ✓ AIRED
                    {e.filler && ' · FILLER'}
                    {e.recap && ' · RECAP'}
                  </div>
                </div>
                {e.forum_url && (
                  <a
                    className="btn"
                    href={e.forum_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ padding: '6px 10px', fontSize: 10, alignSelf: 'flex-start' }}
                  >
                    DISCUSS →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {mainCharacters.length > 0 && (
        <div className="page-section">
          <SectionHeader idx="02" kicker="WHO MADE THIS" title="CAST & STAFF" jp="制作" />
          <div className="characters-grid-sm" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14 }}>
            {mainCharacters.map((c, i) => {
              const charName = c.character?.name || '—';
              const charImg = c.character?.images?.webp?.image_url || c.character?.images?.jpg?.image_url;
              const va = c.voice_actors?.find((v) => v.language === 'Japanese') || c.voice_actors?.[0];
              const vaName = va?.person?.name?.toUpperCase() || '—';
              return (
                <div key={`${c.character?.mal_id || i}`} style={{ textAlign: 'center' }}>
                  <div
                    className={i % 2 ? 'halftone' : 'stripes'}
                    style={{
                      width: '100%',
                      aspectRatio: '1 / 1',
                      border: '1.5px solid var(--ink)',
                      background: charImg ? `var(--paper-3) center/cover no-repeat url(${charImg})` : 'var(--paper-3)',
                    }}
                  />
                  <div style={{ fontWeight: 700, fontSize: 13, marginTop: 8 }}>{charName}</div>
                  <div className="idx" style={{ marginTop: 2 }}>VOICE · {vaName}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
