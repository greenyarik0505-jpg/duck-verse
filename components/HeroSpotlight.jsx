'use client';

export default function HeroSpotlight({ onLaunch }) {
  return (
    <section className="hero-spotlight">
      <div className="spotlight-content">
        <div className="spotlight-badge">🔥 ПРЕМʼЄРА СПРИНТУ</div>
        <h2 className="spotlight-title">
          GEOMETRY DASH <span className="neon-cyan">NEON</span>
        </h2>
        <p className="spotlight-desc">
          Ритм, швидкість та чистий адреналін! Долайте неонові шипи, злітайте на батутах,
          активуйте стрибкові сфери під електронний 130 BPM біт і встановіть рекорд 100%!
        </p>
        <div className="spotlight-features">
          <span>⚡ Next.js 15 + Vercel</span>
          <span>🎮 100% чесна фізика 60 FPS</span>
          <span>🎵 Web Audio 130 BPM біт</span>
          <span>🏆 Збереження рекордів</span>
        </div>
        <div className="spotlight-actions">
          <button className="btn-primary-large" onClick={() => onLaunch('geometry_dash')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
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
