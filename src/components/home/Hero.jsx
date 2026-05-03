import Link from 'next/link';
import PosterPlaceholder from '../ui/PosterPlaceholder';
import { getPosterUrl } from '@/lib/anime-utils';
import { approxAiredEpisode, pad2 } from '@/lib/anime-time';

const TODAY_LABEL = formatToday();

function formatToday() {
  const d = new Date();
  return d
    .toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    .toUpperCase()
    .replace(/,/g, ' ·');
}

const VARIANTS = ['stripes', 'halftone', 'stripes-loose'];

export default function Hero({ firstName, todayCount, totalToday = 0, subsCount, unreadCount, featured, isFollowing, onFollow }) {
  const greetingName = (firstName || 'You').toUpperCase();
  const epsLine = todayCount === 0 ? 'NO EPS DROP TODAY' : `${todayCount} EP${todayCount === 1 ? '' : 'S'} DROP TODAY`;

  return (
    <div style={{ padding: 'clamp(20px, 4vw, 32px) clamp(16px, 4vw, 28px)', borderBottom: '2.5px solid var(--ink)', position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: 20,
          gap: 24,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div className="idx" style={{ marginBottom: 6 }}>
            — {TODAY_LABEL} · ALL TIMES JST
          </div>
          <h1 className="display" style={{ fontSize: 'clamp(36px, 9vw, 76px)', lineHeight: 0.85, margin: 0 }}>
            HEY <span style={{ color: 'var(--vermilion)' }}>{greetingName}</span>,
            <br />
            {epsLine} <span className="jp" style={{ fontSize: 'clamp(28px, 6vw, 50px)' }}>。</span>
          </h1>
        </div>
        <div className="bubble shadow-hard-sm" style={{ maxWidth: 260, transform: 'rotate(-1deg)' }}>
          You&apos;re following <b style={{ color: 'var(--vermilion)' }}>{subsCount} series</b>
          {unreadCount != null && unreadCount > 0 ? (
            <>
              {'. '}Inbox has <b>{unreadCount} unread</b>.
            </>
          ) : (
            '.'
          )}
        </div>
      </div>

      {featured.length > 0 && (
        <>
        <div className="hero-cards-sm feature-grid-mobile" style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(3, featured.length)}, 1fr)`, gap: 18 }}>
          {featured.map((item, i) => {
            const variant = VARIANTS[i % VARIANTS.length];
            const accent = i === 1 ? 'red' : 'ink';
            const titleShort = (item.title_english || item.title || 'Untitled').split(':')[0];
            const jpShort = (item.title_japanese || '').slice(0, 2);
            const broadcast = item.broadcast?.string || (item.airing ? 'AIRING' : '—');
            const epNum = approxAiredEpisode(item);
            const ep = epNum ? `EP ${pad2(epNum)}` : 'NEW EP';
            const followed = isFollowing(item.mal_id);
            const poster = getPosterUrl(item);
            return (
              <Link
                key={item.mal_id}
                href={`/anime/${item.mal_id}`}
                className="shadow-hard"
                style={{
                  background: 'var(--paper)',
                  border: '1.5px solid var(--ink)',
                  color: 'inherit',
                  textDecoration: 'none',
                  display: 'block',
                }}
              >
                <div className="hero-feature-card">
                  <div className="hero-feature-poster">
                    <PosterPlaceholder
                      title={titleShort}
                      jp={jpShort}
                      w="100%"
                      h="100%"
                      variant={variant}
                      accent={accent}
                      imageUrl={poster}
                    />
                  </div>
                  <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span className="chip chip-red">AIRING TODAY</span>
                      <div className="ep-badge">{ep}</div>
                    </div>
                    <div className="display" style={{ fontSize: 18, marginTop: 12, lineHeight: 1 }}>
                      {item.title_english || item.title}
                    </div>
                    {item.title_japanese && (
                      <div className="jp" style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                        {item.title_japanese}
                      </div>
                    )}
                    <div style={{ flex: 1 }} />
                    <div className="mono" style={{ fontSize: 10, color: 'var(--ink)', marginTop: 12 }}>
                      📡 {broadcast}
                    </div>
                    <div className="mobile-action-row" style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <button
                        type="button"
                        className={`btn ${followed ? 'btn-primary' : ''}`}
                        style={{ padding: '8px 12px', fontSize: 11 }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!followed) onFollow(item);
                        }}
                        disabled={followed}
                      >
                        {followed ? 'FOLLOWING ✓' : '+ FOLLOW'}
                      </button>
                      {item.trailer?.url && (
                        <button
                          type="button"
                          className="btn"
                          style={{ padding: '8px 12px', fontSize: 11 }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.open(item.trailer.url, '_blank', 'noopener,noreferrer');
                          }}
                        >
                          TRAILER
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        {totalToday > 3 && (
          <div style={{ marginTop: 18, textAlign: 'right' }}>
            <Link
              href="/today"
              className="idx"
              style={{
                borderBottom: '1.5px solid var(--ink)',
                paddingBottom: 2,
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              SEE ALL {totalToday} DROPS →
            </Link>
          </div>
        )}
        </>
      )}
    </div>
  );
}
