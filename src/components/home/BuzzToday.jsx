import Link from 'next/link';
import SectionHeader from '../ui/SectionHeader';
import { getPosterUrl } from '@/lib/anime-utils';

function tagFor(status) {
  if (!status) return 'MANGA';
  const s = status.toLowerCase();
  if (s.includes('publishing')) return 'ONGOING';
  if (s.includes('finished')) return 'COMPLETE';
  if (s.includes('hiatus')) return 'HIATUS';
  return status.toUpperCase();
}

function authorOf(item) {
  const a = item?.authors?.[0]?.name;
  return a ? a.replace(/,\s*/, ' ').toUpperCase() : 'UNKNOWN';
}

function chaptersOf(item) {
  if (item?.chapters) return `${item.chapters} CH`;
  if (item?.volumes) return `${item.volumes} VOL`;
  return '—';
}

function snippet(text, n = 110) {
  if (!text) return '';
  const cleaned = text.replace(/\s+/g, ' ').trim();
  return cleaned.length > n ? `${cleaned.slice(0, n).trim()}…` : cleaned;
}

export default function BuzzToday({ items }) {
  if (!items || items.length === 0) return null;
  const top4 = items.slice(0, 4);

  return (
    <div style={{ padding: '40px 28px', borderBottom: '2.5px solid var(--ink)' }}>
      <SectionHeader idx="04" kicker="WORD ON THE STREET" title="BUZZ TODAY" jp="話題" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
        {top4.map((item, i) => {
          const cover = getPosterUrl(item);
          const synopsis = snippet(item.synopsis);
          return (
            <Link
              key={item.mal_id || i}
              href={`/buzz/${item.mal_id}`}
              className="shadow-hard-sm"
              style={{
                background: 'var(--paper)',
                border: '1.5px solid var(--ink)',
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                color: 'inherit',
                textDecoration: 'none',
                transition: 'transform 0.08s ease',
              }}
            >
              <div
                className={i % 2 ? 'halftone' : 'stripes'}
                style={{
                  height: 110,
                  border: '1.5px solid var(--ink)',
                  position: 'relative',
                  background: cover
                    ? `var(--paper-3) center/cover no-repeat url(${cover})`
                    : 'var(--paper-3)',
                }}
              >
                <span
                  className="chip chip-ink"
                  style={{ position: 'absolute', top: 8, left: 8, fontSize: 9 }}
                >
                  {tagFor(item.status)}
                </span>
                {item.score != null && (
                  <span
                    className="chip chip-red"
                    style={{ position: 'absolute', top: 8, right: 8, fontSize: 9 }}
                  >
                    ★ {item.score.toFixed(1)}
                  </span>
                )}
              </div>
              <div className="display" style={{ fontSize: 18, lineHeight: 1, textTransform: 'none' }}>
                {item.title}
              </div>
              {synopsis && (
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    lineHeight: 1.5,
                    color: 'var(--ink-2)',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {synopsis}
                </p>
              )}
              <div style={{ flex: 1 }} />
              <div className="idx" style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    minWidth: 0,
                  }}
                >
                  {authorOf(item)}
                </span>
                <span>{chaptersOf(item)}</span>
              </div>
              <div
                className="idx"
                style={{
                  borderTop: '1.5px dashed var(--paper-3)',
                  paddingTop: 8,
                  color: 'var(--vermilion)',
                }}
              >
                READ MORE →
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
