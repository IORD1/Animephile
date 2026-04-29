export default function PosterPlaceholder({
  title,
  jp,
  w,
  h,
  variant = 'stripes',
  accent = 'ink',
  imageUrl,
  style = {},
}) {
  const bgClass =
    variant === 'halftone' ? 'halftone'
    : variant === 'stripes-loose' ? 'stripes-loose'
    : variant === 'solid' ? ''
    : 'stripes';
  const fillColor = accent === 'red' ? 'var(--vermilion)' : 'var(--paper-3)';

  if (imageUrl) {
    return (
      <div
        className="poster"
        style={{
          width: w,
          height: h,
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          ...style,
        }}
      />
    );
  }

  return (
    <div className="poster" style={{ width: w, height: h, background: fillColor, ...style }}>
      <div
        className={bgClass}
        style={{ position: 'absolute', inset: 0, opacity: 0.45 }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: 14,
        }}
      >
        {jp && (
          <div
            className="jp"
            style={{
              fontSize: 20,
              color: 'var(--ink)',
              marginBottom: 4,
              fontWeight: 700,
              writingMode: 'vertical-rl',
              position: 'absolute',
              top: 12,
              right: 12,
            }}
          >
            {jp}
          </div>
        )}
        {title && (
          <div
            style={{
              background: 'var(--paper)',
              border: '1.5px solid var(--ink)',
              padding: '6px 8px',
              display: 'inline-block',
              alignSelf: 'flex-start',
              maxWidth: '95%',
            }}
          >
            <div className="display" style={{ fontSize: 18, color: 'var(--ink)' }}>{title}</div>
          </div>
        )}
      </div>
      <div
        className="mono"
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          fontSize: 9,
          background: 'var(--ink)',
          color: 'var(--paper)',
          padding: '2px 5px',
        }}
      >
        PLACEHOLDER
      </div>
    </div>
  );
}
