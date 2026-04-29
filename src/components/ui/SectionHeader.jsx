import Link from 'next/link';

export default function SectionHeader({ idx, title, jp, kicker, action, actionHref }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: 18,
        gap: 24,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
        {idx && (
          <div
            className="display"
            style={{ fontSize: 'clamp(36px, 8vw, 64px)', color: 'var(--vermilion)', lineHeight: 0.8 }}
          >
            {idx}
          </div>
        )}
        <div>
          {kicker && <div className="idx" style={{ marginBottom: 6 }}>— {kicker}</div>}
          <div className="display" style={{ fontSize: 'clamp(24px, 5.5vw, 38px)', lineHeight: 0.9 }}>
            {title}
            {jp && (
              <span
                className="jp"
                style={{
                  fontSize: 22,
                  color: 'var(--muted)',
                  marginLeft: 14,
                  fontWeight: 400,
                  textTransform: 'none',
                }}
              >
                {jp}
              </span>
            )}
          </div>
        </div>
      </div>
      {action && (
        actionHref ? (
          <Link
            href={actionHref}
            className="idx"
            style={{
              borderBottom: '1.5px solid var(--ink)',
              paddingBottom: 2,
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            {action} →
          </Link>
        ) : (
          <div className="idx" style={{ borderBottom: '1.5px solid var(--ink)', paddingBottom: 2 }}>
            {action} →
          </div>
        )
      )}
    </div>
  );
}
