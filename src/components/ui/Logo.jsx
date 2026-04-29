import Link from 'next/link';

export default function Logo({ size = 'md', href = '/' }) {
  const big = size === 'lg';
  const inner = (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <div
        className="stamp"
        style={{
          width: big ? 40 : 28,
          height: big ? 40 : 28,
          fontSize: big ? 16 : 12,
          transform: 'rotate(-8deg)',
        }}
      >
        番
      </div>
      <div>
        <div className="display" style={{ fontSize: big ? 28 : 20, lineHeight: 0.9 }}>
          ANIMEPHILE
        </div>
        <div
          className="mono"
          style={{
            fontSize: big ? 9 : 7,
            letterSpacing: '0.18em',
            color: 'var(--muted)',
          }}
        >
          EST · 2024 · NEVER MISS AN EP
        </div>
      </div>
    </div>
  );

  if (!href) return inner;
  return (
    <Link href={href} style={{ color: 'inherit', textDecoration: 'none' }}>
      {inner}
    </Link>
  );
}
