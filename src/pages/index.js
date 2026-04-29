import { useEffect, useMemo, useState } from 'react';
import TopNav from '@/components/ui/TopNav';
import Hero from '@/components/home/Hero';
import TopRated from '@/components/home/TopRated';
import BuzzToday from '@/components/home/BuzzToday';
import HomeFooter from '@/components/home/HomeFooter';
import Login from '@/components/loginpage';
import { useAuth } from '@/lib/AuthContext';
import { useSubscriptions } from '@/lib/useSubscriptions';

export default function Home() {
  const { user, loading, login, logout } = useAuth();
  const { follow } = useSubscriptions();

  const [today, setToday] = useState([]);
  const [top, setTop] = useState([]);
  const [airing, setAiring] = useState([]);
  const [manga, setManga] = useState([]);
  const [subs, setSubs] = useState([]);
  const [followToast, setFollowToast] = useState(null);

  useEffect(() => {
    fetch('/api/browse/today').then((r) => r.json()).then((d) => setToday(d.data || [])).catch(() => {});
    fetch('/api/browse/top').then((r) => r.json()).then((d) => setTop(d.data || [])).catch(() => {});
    fetch('/api/browse/airing').then((r) => r.json()).then((d) => setAiring(d.data || [])).catch(() => {});
    fetch('/api/browse/manga').then((r) => r.json()).then((d) => setManga(d.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/subscriptions?firebaseUid=${encodeURIComponent(user.uid)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setSubs(d?.subscriptions || []))
      .catch(() => {});
  }, [user]);

  const subIds = useMemo(() => new Set(subs.map((s) => s.malId)), [subs]);
  const isFollowing = (malId) => subIds.has(malId);

  const featured = useMemo(() => {
    if (!today.length) return [];
    const followed = today.filter((t) => subIds.has(t.mal_id));
    const pool = followed.length >= 3 ? followed : today;
    return pool.slice(0, 3);
  }, [today, subIds]);

  const todayCount = useMemo(
    () => today.filter((t) => subIds.has(t.mal_id)).length,
    [today, subIds],
  );

  async function handleFollow(item) {
    const res = await follow(item.mal_id, item.title, item);
    if (res?.added) {
      setSubs((prev) => [...prev, { malId: item.mal_id, animeTitle: item.title }]);
      setFollowToast(`Following ${item.title}`);
    } else if (res?.alreadySubscribed) {
      setFollowToast(`Already following ${item.title}`);
    } else {
      setFollowToast('Could not follow.');
    }
    setTimeout(() => setFollowToast(null), 2400);
  }

  if (loading) return null;
  if (!user) return <Login loginfunc={login} />;

  const firstName = (user.displayName || user.email || 'You').split(/[\s@]/)[0];

  return (
    <div className="ink-root paper-bg" style={{ minHeight: '100vh' }}>
      <TopNav user={user} logout={logout} />
      <Hero
        firstName={firstName}
        todayCount={todayCount}
        subsCount={subs.length}
        unreadCount={null}
        featured={featured}
        isFollowing={isFollowing}
        onFollow={handleFollow}
      />
      <TopRated
        items={airing}
        isFollowing={isFollowing}
        onFollow={handleFollow}
        idx="02"
        kicker="ON AIR · BY SCORE"
        title="TOP AIRING"
        jp="放送中"
        action={null}
        actionHref={null}
      />
      <TopRated items={top} isFollowing={isFollowing} onFollow={handleFollow} idx="03" />
      <BuzzToday items={manga} />
      <HomeFooter />

      {followToast && (
        <div
          className="bubble shadow-hard-sm"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'var(--ink)',
            color: 'var(--paper)',
            zIndex: 50,
          }}
        >
          {followToast}
        </div>
      )}
    </div>
  );
}
