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
  const firstName = (user?.displayName || user?.email || 'User').split(/[\s@]/)[0];
  const initials = initialsFrom(user?.displayName, user?.email);

  return (
    <div style={{ borderBottom: '2.5px solid var(--ink)', background: 'var(--paper)' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '14px 28px',
          gap: 28,
        }}
      >
        <Logo />
        <div style={{ width: 1.5, height: 32, background: 'var(--ink)' }} />
        <nav style={{ display: 'flex', gap: 22, flex: 1 }}>
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
        <SearchBar enabled={searchEnabled} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
            <div>
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
      </div>
    </div>
  );
}
