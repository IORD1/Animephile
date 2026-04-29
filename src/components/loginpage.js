import { useEffect, useState } from 'react';
import Logo from './ui/Logo';
import PosterPlaceholder from './ui/PosterPlaceholder';
import { getPosterUrl } from '@/lib/anime-utils';
import { approxAiredEpisode } from '@/lib/anime-time';

export default function Login({ loginfunc }) {
  const [todayItems, setTodayItems] = useState([]);

  useEffect(() => {
    fetch('/api/browse/today')
      .then((r) => r.json())
      .then((d) => setTodayItems(d.data || []))
      .catch(() => {});
  }, []);

  const withCover = todayItems.filter((i) => getPosterUrl(i));
  const featured = withCover[0];
  const secondary = withCover[1];
  const featuredTitle = featured?.title_english || featured?.title || null;
  const featuredJp = featured?.title_japanese || null;
  const secondaryTitle = secondary?.title_english || secondary?.title || null;
  const secondaryJp = secondary?.title_japanese || null;
  const epNum = featured ? approxAiredEpisode(featured) : null;
  const epLabel = epNum ? `EPISODE ${epNum}` : 'NEW EPISODE';
  const genreLabel = (featured?.genres?.[0]?.name || 'SHONEN').toUpperCase();

  return (
    <div
      className="ink-root paper-bg"
      style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}
    >
      <div
        className="halftone"
        style={{
          position: 'absolute',
          width: 900,
          height: 900,
          top: -200,
          right: -300,
          opacity: 0.15,
          borderRadius: 999,
          pointerEvents: 'none',
        }}
      />
      <div
        className="halftone-red"
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          bottom: -200,
          left: -200,
          opacity: 0.18,
          borderRadius: 999,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(110deg, transparent 0%, transparent 48%, var(--ink) 48%, var(--ink) 49%, transparent 49%)',
          pointerEvents: 'none',
          opacity: 0.6,
        }}
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'clamp(16px, 4vw, 24px) clamp(16px, 4vw, 40px)',
          position: 'relative',
          zIndex: 2,
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <Logo />
        <div className="mono" style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '0.18em' }}>
          NO ACCOUNT NEEDED · GOOGLE SIGN-IN ONLY
        </div>
      </div>

      <div
        className="login-grid-sm"
        style={{
          display: 'grid',
          gridTemplateColumns: '1.1fr 1fr',
          gap: 0,
          padding: 'clamp(16px, 4vw, 20px) clamp(16px, 4vw, 40px) clamp(80px, 10vw, 60px)',
          position: 'relative',
          zIndex: 2,
          minHeight: 'calc(100vh - 160px)',
        }}
      >
        <div style={{ paddingRight: 'clamp(0px, 4vw, 60px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="idx" style={{ marginBottom: 16 }}>— CHAPTER 01 · WELCOME BACK</div>

          <h1 className="display" style={{ fontSize: 'clamp(48px, 14vw, 130px)', lineHeight: 0.85, marginBottom: 10 }}>
            NEVER<br />MISS AN<br />
            <span style={{ color: 'var(--vermilion)', position: 'relative' }}>
              EPISODE
              <svg
                width="100%"
                height="10"
                viewBox="0 0 400 10"
                preserveAspectRatio="none"
                style={{ position: 'absolute', bottom: 35, left: 0, width: '100%' }}
              >
                <path d="M0,5 Q100,1 200,5 T400,5" stroke="var(--ink)" strokeWidth="3" fill="none" />
              </svg>
            </span>
            <span className="jp" style={{ fontSize: 'clamp(28px, 7vw, 60px)', marginLeft: 14, color: 'var(--ink)' }}>。</span>
          </h1>

          <p style={{ fontSize: 'clamp(15px, 2.5vw, 18px)', lineHeight: 1.5, marginTop: 28, maxWidth: 460, color: 'var(--ink-2)' }}>
            Subscribe to the anime you love. The second a new episode airs, we&apos;ll fire off an email — no
            scrolling, no spoilers, no FOMO.
          </p>

          <div style={{ display: 'flex', gap: 10, marginTop: 36 }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: '16px 22px', fontSize: 14 }}
              onClick={loginfunc}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z" />
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="idx" style={{ marginTop: 28, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            <span>✓ FREE FOREVER</span>
            <span>✓ NO SPAM</span>
            <span>✓ UNSUBSCRIBE ANYTIME</span>
          </div>
        </div>

        <div className="login-showcase-sm" style={{ position: 'relative', minHeight: 500 }}>
          <div
            className="shadow-hard rotate-2"
            style={{ position: 'absolute', top: 20, right: 20, width: 280, height: 380 }}
          >
            <PosterPlaceholder
              title={featuredTitle || 'Sample Cover'}
              jp={(featuredJp || '表紙').slice(0, 2)}
              w={280}
              h={380}
              variant="stripes"
              imageUrl={featured ? getPosterUrl(featured) : undefined}
            />
          </div>

          <div
            className="shadow-hard rotate-n2"
            style={{ position: 'absolute', top: 60, left: 0, width: 200, height: 280 }}
          >
            <PosterPlaceholder
              title={secondaryTitle || 'Vol. II'}
              jp={(secondaryJp || '二').slice(0, 2)}
              w={200}
              h={280}
              variant="halftone"
              accent="red"
              imageUrl={secondary ? getPosterUrl(secondary) : undefined}
            />
          </div>

          <div
            className="shadow-hard"
            style={{
              position: 'absolute',
              bottom: 100,
              left: 30,
              width: 360,
              background: 'var(--paper)',
              border: '1.5px solid var(--ink)',
              transform: 'rotate(-2deg)',
            }}
          >
            <div
              style={{
                background: 'var(--vermilion)',
                color: 'var(--paper)',
                padding: '6px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                borderBottom: '1.5px solid var(--ink)',
              }}
            >
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.12em' }}>
                📨 INBOX · 2 MIN AGO
              </div>
              <div className="mono" style={{ fontSize: 10 }}>UNREAD</div>
            </div>
            <div style={{ padding: 16 }}>
              <div className="idx" style={{ color: 'var(--vermilion)', marginBottom: 6 }}>— NEW EPISODE</div>
              <div className="display" style={{ fontSize: 22, marginBottom: 8 }}>
                {(featuredTitle || 'JUJUTSU KAISEN').toUpperCase()}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.4 }}>
                Hey! <b>{epNum ? `Episode ${epNum}` : 'A new episode'}</b> just dropped. Tap through to see where you can watch it tonight.
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                <span className="chip chip-ink">{epLabel}</span>
                <span className="chip">{genreLabel}</span>
              </div>
            </div>
          </div>

          <div
            className="bubble shadow-hard-sm"
            style={{
              position: 'absolute',
              top: 0,
              left: 60,
              transform: 'rotate(-3deg)',
              maxWidth: 200,
            }}
          >
            &quot;Finally caught up<br />without a single<br />spoiler!&quot; — Yuki
          </div>

          <div
            className="stamp"
            style={{
              position: 'absolute',
              bottom: 30,
              right: 60,
              width: 110,
              height: 110,
              fontSize: 28,
              transform: 'rotate(-12deg)',
              boxShadow: '4px 4px 0 var(--ink)',
              flexDirection: 'column',
              lineHeight: 1,
            }}
          >
            <div>推し</div>
            <div className="mono" style={{ fontSize: 8, marginTop: 4, letterSpacing: '0.15em' }}>
              APPROVED
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <div className="scan-rule" />
        <div
          className="mono login-foot-sm"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '10px clamp(16px, 4vw, 40px)',
            fontSize: 11,
          }}
        >
          <span>© ANIMEPHILE / 愛フィル</span>
          <span>VOL. 04 · ISSUE 12 · SPRING SEASON 2026</span>
          <span>PRIVACY · TERMS · PATCH NOTES</span>
        </div>
      </div>
    </div>
  );
}
