import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Logo from './Logo';
import Avatar, { initialsFrom } from './Avatar';
import SearchBar from './SearchBar';
import { useNavCounts } from '@/lib/useNavCounts';

const NAV_ITEMS = [
  { id: 'home', label: 'Discover', href: '/', match: (p) => p === '/' },
  { id: 'subs', label: 'My Subs', href: '/profile', match: (p) => p === '/profile' || p === '/following' },
  { id: 'inbox', label: 'Inbox', href: '/inbox', match: (p) => p.startsWith('/inbox') },
  { id: 'search', label: 'Search', href: '/search', match: (p) => p.startsWith('/search') },
];

export default function TopNav({ user, logout, searchEnabled = true }) {
  const router = useRouter();
  const counts = useNavCounts(user?.uid);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const firstName = (user?.displayName || user?.email || 'User').split(/[\s@]/)[0];
  const initials = initialsFrom(user?.displayName, user?.email);

  useEffect(() => {
    setDrawerOpen(false);
  }, [router.asPath]);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    function onKeyDown(event) {
      if (event.key === 'Escape') setDrawerOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  const quickSearchHref = searchEnabled ? '/search' : '/profile';

  return (
    <div style={{ borderBottom: '2.5px solid var(--ink)', background: 'var(--paper)' }}>
      <div
        className="topnav-row-sm"
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '14px 28px',
          gap: 28,
        }}
      >
        <Logo />
        <div className="topnav-desktop-sm" style={{ width: 1.5, height: 32, background: 'var(--ink)' }} />
        <nav className="topnav-desktop-sm" style={{ display: 'flex', gap: 'clamp(12px, 3vw, 22px)', flex: 1, flexWrap: 'wrap' }}>
          {NAV_ITEMS.map((it) => {
            const active = it.match(router.pathname);
            const count =
              it.id === 'subs' ? counts.subs
              : it.id === 'inbox' ? counts.unread
              : null;
            const itemStyle = {
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: 600,
              fontSize: 13,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: active ? 'var(--ink)' : 'var(--muted)',
              borderBottom: active ? '2.5px solid var(--vermilion)' : '2.5px solid transparent',
              paddingBottom: 4,
              textDecoration: 'none',
              opacity: it.comingSoon ? 0.45 : 1,
              cursor: it.comingSoon ? 'not-allowed' : 'pointer',
            };
            const inner = (
              <>
                {it.label}
                {count != null && count > 0 && (
                  <span
                    style={{
                      background: active ? 'var(--vermilion)' : 'var(--ink)',
                      color: 'var(--paper)',
                      fontSize: 10,
                      padding: '1px 6px',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                  >
                    {count}
                  </span>
                )}
              </>
            );
            if (it.comingSoon) {
              return (
                <span key={it.id} style={itemStyle} title="Coming soon">
                  {inner}
                </span>
              );
            }
            return (
              <Link key={it.id} href={it.href} style={itemStyle}>
                {inner}
              </Link>
            );
          })}
        </nav>
        <div className="topnav-desktop-sm" style={{ display: 'flex' }}>
          <SearchBar enabled={searchEnabled} />
        </div>
        <div className="topnav-desktop-sm" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link
            href="/profile"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <Avatar initials={initials} />
            <div className="topnav-name-sm">
              <div style={{ fontWeight: 700, fontSize: 13 }}>{firstName}</div>
              <div className="mono" style={{ fontSize: 9, color: 'var(--muted)' }}>
                VIEW PROFILE →
              </div>
            </div>
          </Link>
          {logout && (
            <button
              onClick={logout}
              className="btn btn-ghost"
              style={{ padding: '6px 10px', fontSize: 10 }}
              type="button"
            >
              LOGOUT
            </button>
          )}
        </div>
        <div className="mobile-only topnav-search-trigger-sm" style={{ display: 'none', marginLeft: 'auto' }}>
          <Link
            href={quickSearchHref}
            className="hamburger-btn"
            aria-label={searchEnabled ? 'Open search' : 'Open profile'}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <span className="mono" style={{ fontSize: 10 }}>{searchEnabled ? 'SRCH' : 'ME'}</span>
          </Link>
        </div>
        <button
          type="button"
          className="mobile-only hamburger-btn"
          aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen((open) => !open)}
          style={{ display: 'none' }}
        >
          <span style={{ display: 'grid', gap: 4 }}>
            <span style={{ display: 'block', width: 16, height: 1.5, background: 'var(--ink)' }} />
            <span style={{ display: 'block', width: 16, height: 1.5, background: 'var(--ink)' }} />
            <span style={{ display: 'block', width: 16, height: 1.5, background: 'var(--ink)' }} />
          </span>
        </button>
      </div>
      <div
        className={`mobile-only drawer-overlay ${drawerOpen ? 'open' : ''}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden={!drawerOpen}
      />
      <aside
        className={`mobile-only drawer-panel ${drawerOpen ? 'open' : ''}`}
        aria-hidden={!drawerOpen}
      >
        <div style={{ padding: '20px 18px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <Logo href="/" />
            <button
              type="button"
              className="hamburger-btn"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
            >
              <span className="display" style={{ fontSize: 18, lineHeight: 1 }}>×</span>
            </button>
          </div>

          <div style={{ marginTop: 18 }}>
            <SearchBar enabled={searchEnabled} wide />
          </div>

          <div style={{ marginTop: 18, borderTop: '1.5px solid var(--ink)' }}>
            {NAV_ITEMS.map((it) => {
              const active = it.match(router.pathname);
              const count =
                it.id === 'subs' ? counts.subs
                : it.id === 'inbox' ? counts.unread
                : null;

              return (
                <Link
                  key={it.id}
                  href={it.href}
                  className="drawer-nav-link"
                  style={{
                    color: active ? 'var(--ink)' : 'var(--ink-2)',
                    fontWeight: active ? 800 : 600,
                  }}
                >
                  <span style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 13 }}>
                    {it.label}
                  </span>
                  {count != null && count > 0 ? (
                    <span className="chip chip-ink">{count}</span>
                  ) : (
                    <span className="idx">OPEN</span>
                  )}
                </Link>
              );
            })}

            <Link href="/profile" className="drawer-nav-link" style={{ color: 'inherit' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar initials={initials} />
                <span>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{firstName}</div>
                  <div className="idx">PROFILE</div>
                </span>
              </span>
              <span className="idx">VIEW</span>
            </Link>
          </div>

          {logout && (
            <button
              onClick={logout}
              className="btn"
              style={{ width: '100%', justifyContent: 'center', marginTop: 20 }}
              type="button"
            >
              LOGOUT
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
