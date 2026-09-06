'use client';

export default function HeroSpotlight({ onLaunch }) {
  return (
    <section className="hero-spotlight">
      <div className="spotlight-content">
        <div className="spotlight-badge">🔥 ФЛАГМАН ХАБУ • СПРИНТ 1</div>
        <h2 className="spotlight-title">
          GEOMETRY DASH <span className="brand-accent">ORIGINAL</span>
        </h2>
        <p className="spotlight-desc">
          Ритм, швидкість та чистий адреналін! Долайте геометричні перешкоди, злітайте на батутах,
          активуйте стрибкові сфери під авторський електронний біт 130 BPM і встановіть абсолютний рекорд 100%!
        </p>
        <div className="spotlight-features">
          <span>⚡ Next.js 15 + Vercel</span>
          <span>🎮 60 FPS точна фізика</span>
          <span>🎵 130 BPM Web Audio</span>
          <span>🏆 Таблиця рекордів</span>
        </div>
        <div className="spotlight-actions">
          <button
            className="btn-primary-large"
            onClick={() => onLaunch('geometry_dash')}
            title="Запустити гру Geometry Dash"
            aria-label="Грати в Geometry Dash"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>ГРАТИ В GEOMETRY DASH</span>
          </button>
        </div>
      </div>

      <div className="spotlight-visual">
        <div className="gd-hero-scene">
          <div className="gd-hero-cube"></div>
          <div className="gd-hero-spikes">
            <div className="spike-item"></div>
            <div className="spike-item"></div>
            <div className="spike-item"></div>
          </div>
          <div className="gd-hero-pad"></div>
          <div className="gd-hero-orb"></div>
          <div className="gd-hero-floor"></div>
        </div>
      </div>
    </section>
  );
}
