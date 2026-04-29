import Link from 'next/link';
import SectionHeader from '../ui/SectionHeader';
import PosterPlaceholder from '../ui/PosterPlaceholder';
import { getPosterUrl } from '@/lib/anime-utils';

function summary(text, n = 240) {
  if (!text) return '';
  return text.length > n ? `${text.slice(0, n).trim()}…` : text;
}

export default function TopRated({
  items,
  isFollowing,
  onFollow,
  idx = '02',
  kicker = 'THE LEADERBOARD',
  title = 'TOP RATED',
  jp = 'トップ評価',
  action = 'SEE ALL',
  actionHref = '/top',
}) {
  if (!items || items.length === 0) return null;
  const featured = items[0];
  const rest = items.slice(1, 5);
  const followedFeatured = isFollowing(featured.mal_id);

  return (
    <div style={{ padding: 'clamp(24px, 5vw, 40px) clamp(16px, 4vw, 28px)', borderBottom: '2.5px solid var(--ink)' }}>
      <SectionHeader
        idx={idx}
        kicker={kicker}
        title={title}
        jp={jp}
        action={action}
        actionHref={actionHref}
      />

      <div className="grid-2-stack-sm" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 28 }}>
        <Link
          href={`/anime/${featured.mal_id}`}
          className="shadow-hard top-rated-feat-sm"
          style={{
            background: 'var(--paper-2)',
            border: '1.5px solid var(--ink)',
            padding: 18,
            display: 'flex',
            gap: 18,
            color: 'inherit',
            textDecoration: 'none',
          }}
        >
          <div className="top-rated-feat-poster" style={{ width: 200, height: 280, flexShrink: 0 }}>
            <PosterPlaceholder
              title={(featured.title_english || featured.title || '').split(':')[0]}
              jp={(featured.title_japanese || '').slice(0, 1)}
              w={200}
              h={280}
              variant="halftone"
              imageUrl={getPosterUrl(featured)}
            />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <div
                className="display"
                style={{ fontSize: 'clamp(56px, 14vw, 96px)', color: 'var(--vermilion)', lineHeight: 0.8 }}
              >
                01
              </div>
              <div className="idx">RANK · BY USER SCORE</div>
            </div>
            <div className="display" style={{ fontSize: 'clamp(22px, 5vw, 30px)', marginTop: 14, lineHeight: 0.95 }}>
              {featured.title_english || featured.title}
            </div>
            {featured.title_japanese && (
              <div className="jp" style={{ fontSize: 16, color: 'var(--muted)', marginTop: 4 }}>
                {featured.title_japanese}
              </div>
            )}
            <p style={{ fontSize: 13, lineHeight: 1.5, marginTop: 14, color: 'var(--ink-2)' }}>
              {summary(featured.synopsis, 320)}
            </p>
            <div
              style={{
                display: 'flex',
                gap: 18,
                marginTop: 'auto',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div className="display" style={{ fontSize: 38, color: 'var(--ink)' }}>
                  {featured.score?.toFixed(2) ?? '—'}
                  <span style={{ fontSize: 16, color: 'var(--muted)' }}>/10</span>
                </div>
                <div className="idx">
                  {featured.members ? `${(featured.members / 1000).toFixed(1)}K MEMBERS · ` : ''}
                  {featured.episodes ?? '—'} EPS · {featured.status || 'STATUS UNKNOWN'}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!followedFeatured) onFollow(featured);
                }}
                disabled={followedFeatured}
              >
                {followedFeatured ? '✓ FOLLOWING' : '+ FOLLOW'}
              </button>
            </div>
          </div>
        </Link>

        <div style={{ border: '1.5px solid var(--ink)', background: 'var(--paper)' }}>
          {rest.map((s, i) => {
            const rank = String(i + 2).padStart(2, '0');
            const followed = isFollowing(s.mal_id);
            const followers = s.members ? `${(s.members / 1000).toFixed(1)}K MEMBERS` : '';
            return (
              <Link
                key={s.mal_id}
                href={`/anime/${s.mal_id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px 18px',
                  borderBottom: i < rest.length - 1 ? '1.5px solid var(--ink)' : 'none',
                  gap: 16,
                  color: 'inherit',
                  textDecoration: 'none',
                }}
              >
                <div className="display" style={{ fontSize: 'clamp(26px, 6vw, 36px)', color: 'var(--vermilion)', minWidth: 'clamp(36px, 8vw, 56px)' }}>
                  {rank}
                </div>
                <div style={{ width: 50, height: 70, flexShrink: 0 }}>
                  <PosterPlaceholder
                    title=""
                    w={50}
                    h={70}
                    variant="stripes-loose"
                    imageUrl={getPosterUrl(s)}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {s.title_english || s.title}
                  </div>
                  {followers && <div className="idx" style={{ marginTop: 4 }}>{followers}</div>}
                </div>
                <div className="display" style={{ fontSize: 22 }}>
                  {s.score?.toFixed(2) ?? '—'}
                </div>
                <button
                  type="button"
                  className={`btn ${followed ? 'btn-primary' : ''}`}
                  style={{ padding: '6px 10px', fontSize: 10 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!followed) onFollow(s);
                  }}
                  disabled={followed}
                >
                  {followed ? '✓' : '+ FOLLOW'}
                </button>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
