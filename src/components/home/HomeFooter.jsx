export default function HomeFooter() {
  return (
    <div style={{ padding: 'clamp(20px, 4vw, 32px) clamp(16px, 4vw, 28px)' }}>
      <div className="scan-rule" style={{ marginBottom: 18 }} />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 20,
          flexWrap: 'wrap',
        }}
      >
        <div className="display" style={{ fontSize: 'clamp(22px, 5vw, 28px)' }}>
          ANIMEPHILE{' '}
          <span className="jp" style={{ fontSize: 22, color: 'var(--vermilion)' }}>
            愛フィル
          </span>
        </div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
          BUILT BY FANS · POWERED BY MAL · NO ADS · NO TRACKING
        </div>
      </div>
    </div>
  );
}
