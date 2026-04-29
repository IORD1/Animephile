export default function Avatar({ initials = 'PI', size = 36, color = 'var(--vermilion)' }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: color,
        color: 'var(--paper)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Anton, sans-serif',
        fontSize: size * 0.42,
        border: '1.5px solid var(--ink)',
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

export function initialsFrom(name, email) {
  const source = (name || email || '').trim();
  if (!source) return '?';
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}
