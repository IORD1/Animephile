export default function HomeFooter() {
  return (
    <div style={{ padding: '32px 28px' }}>
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
        <div className="display" style={{ fontSize: 28 }}>
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
