'use client';

import { useState, useEffect } from 'react';
import { GAME_REGISTRY } from '../lib/games/registry';

export default function GameHubPage() {
  const [coins, setCoins] = useState(50);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const savedCoins = localStorage.getItem('duckverse_coins');
    if (savedCoins) setCoins(parseInt(savedCoins, 10));
  }, []);

  const filteredGames = GAME_REGISTRY.filter((g) => {
    const matchesCat = activeCategory === 'all' || g.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const launchGame = (gameId) => {
    // Open game via hub launcher or redirect to game canvas
    window.location.href = `/index.html?play=${gameId}`;
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="hub-header">
        <div className="header-container">
          <div className="brand">
            <div className="brand-logo">
              <span className="logo-box">GD</span>
            </div>
            <div className="brand-text">
              <h1 className="logo-title">
                DUCK<span className="neon-text">VERSE</span>
              </h1>
              <span className="logo-subtitle">NEXT.JS GAME HUB</span>
            </div>
          </div>

          <div className="header-search">
            <input
              type="text"
              placeholder="Пошук ігор у хабі..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="header-actions">
            <div className="user-wallet">
              <span className="coin-icon">🪙</span>
              <span className="user-coins-val">{coins}</span>
            </div>
            <button
              id="mute-btn"
              className="header-btn"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? '🔊 Звук: Увімк' : '🔇 Звук: Вимк'}
            </button>
            <a
              href="https://github.com/greenyarik0505-jpg/duck-verse"
              target="_blank"
              rel="noopener noreferrer"
              className="header-btn gh-btn"
            >
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="hub-main">
        {/* Hero Spotlight: Geometry Dash */}
        <section className="hero-spotlight">
          <div className="spotlight-content">
            <div className="spotlight-badge">🔥 ПРЕМʼЄРА ХАБУ</div>
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
            </div>
            <div className="spotlight-actions">
              <button
                className="btn-primary-large"
                onClick={() => launchGame('geometry_dash')}
              >
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

        {/* Category Filters */}
        <section className="categories-bar">
          {['all', 'action', 'arcade', 'casual'].map((cat) => (
            <button
              key={cat}
              className={`cat-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat === 'all'
                ? 'Усі ігри'
                : cat === 'action'
                ? 'Екшен та Ритм'
                : cat === 'arcade'
                ? 'Аркади'
                : 'Казуальні'}
            </button>
          ))}
        </section>

        {/* Games Grid */}
        <section className="games-section">
          <div className="games-grid">
            {filteredGames.map((game) => (
              <div key={game.id} className="game-card">
                <div className="card-top">
                  <span className="card-badge">{game.badge}</span>
                  <span className="card-tag">{game.tag}</span>
                </div>
                <div className="card-visual">
                  <span className="card-icon-emoji">{game.icon}</span>
                </div>
                <div className="card-body">
                  <h3 className="card-title">{game.title}</h3>
                  <p className="card-desc">{game.desc}</p>
                  <div className="card-meta">
                    <span className="meta-rating">{game.rating}</span>
                    <span className="meta-category">📂 {game.category}</span>
                  </div>
                </div>
                <div className="card-footer">
                  <button
                    className="play-btn"
                    onClick={() => launchGame(game.id)}
                  >
                    <span>ГРАТИ</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
