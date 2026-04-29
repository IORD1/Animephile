import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

export default function SearchBar({
  placeholder = 'Search anime...',
  wide = false,
  initialValue = '',
  enabled = true,
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled]);

  function onSubmit(e) {
    e.preventDefault();
    if (!enabled || !value.trim()) return;
    router.push(`/search?q=${encodeURIComponent(value.trim())}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{
        display: 'flex',
        alignItems: 'center',
        border: '1.5px solid var(--ink)',
        background: 'var(--paper)',
        padding: '0 12px',
        height: 44,
        width: wide ? '100%' : 360,
        boxShadow: '4px 4px 0 var(--ink)',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.5" y2="16.5" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        disabled={!enabled}
        style={{
          marginLeft: 10,
          flex: 1,
          fontSize: 14,
          fontWeight: 500,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'var(--ink)',
          fontFamily: 'inherit',
        }}
      />
      <div
        className="mono"
        style={{
          fontSize: 10,
          padding: '3px 6px',
          border: '1px solid var(--ink)',
          color: 'var(--muted)',
        }}
      >
        ⌘ K
      </div>
    </form>
  );
}
