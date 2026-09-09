'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import HeroSpotlight from '../components/HeroSpotlight';
import CategoryFilter from '../components/CategoryFilter';
import GameCard from '../components/GameCard';
import GameModal from '../components/GameModal';
import SkinShopModal from '../components/SkinShopModal';
import { GAME_REGISTRY, getGamesByCategory, searchGames } from '../lib/games/registry';

export default function GameHubPage() {
  const [coins, setCoins] = useState(50);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isGameOpen, setIsGameOpen] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState('geometry_dash');

  useEffect(() => {
    const savedCoins = localStorage.getItem('duckverse_coins');
    if (savedCoins) setCoins(parseInt(savedCoins, 10));

    const savedMuted = localStorage.getItem('duckverse_muted') === 'true';
    setSoundEnabled(!savedMuted);
  }, []);

  const handleUpdateCoins = useCallback((delta) => {
    setCoins((prev) => {
      const next = Math.max(0, prev + delta);
      try {
        localStorage.setItem('duckverse_coins', next.toString());
      } catch (e) {}
      return next;
    });
  }, []);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('duckverse_muted', (!next).toString());
    if (window.sound) window.sound.toggleMute();
  };

  const handleLaunchGame = (gameId) => {
    setSelectedGameId(gameId || 'geometry_dash');
    setIsGameOpen(true);
  };

  let filtered = getGamesByCategory(activeCategory);
  if (searchQuery) {
    filtered = searchGames(searchQuery);
  }

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <Navbar
        coins={coins}
        onOpenShop={() => setIsShopOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Hub Body */}
      <main className="hub-main">
        {/* Featured Hero Banner: Geometry Dash Neon */}
        <HeroSpotlight onLaunch={handleLaunchGame} />

        {/* Category Filter Bar */}
        <CategoryFilter
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
        />

        {/* Modular Games Grid */}
        <section className="games-section" aria-label="Каталог ігор">
          {filtered.length > 0 ? (
            <div className="games-grid">
              {filtered.map((game) => (
                <GameCard key={game.id} game={game} onPlay={handleLaunchGame} />
              ))}
            </div>
          ) : (
            <div className="empty-search-state">
              <span className="empty-search-icon" aria-hidden="true">🔍</span>
              <h3 className="empty-search-title">Ігор не знайдено</h3>
              <p className="empty-search-desc">
                За запитом {searchQuery ? `«${searchQuery}»` : ''} у цій категорії немає ігор. Спробуйте інший запит або скиньте фільтри.
              </p>
              <button
                className="btn-reset-search"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
              >
                Скинути фільтри
              </button>
            </div>
          )}
        </section>

      </main>

      {/* Premium AAA Hub Footer */}
      <footer className="hub-footer">
        <div className="footer-container">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="footer-logo-row">
                <span className="footer-logo-icon" style={{ background: 'linear-gradient(135deg, #00ff99, #00f3ff)', color: '#020509' }}>NH</span>
                <span className="footer-logo-title">
                  НЕОНОВИЙ<span className="brand-accent" style={{ color: '#00ff99' }}> ВЗЛОМЩИК</span>
                </span>
              </div>
              <p className="footer-desc">
                Кіберпанк ігровий хаб головоломок та екшену на базі Next.js 15, React 19 та Vercel Production.
              </p>
            </div>

            <div className="footer-nav">
              <div className="footer-nav-col">
                <span className="footer-nav-title">НАВІГАЦІЯ</span>
                <button type="button" className="footer-link" onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}>
                  Каталог ігор
                </button>
                <button type="button" className="footer-link" onClick={() => setIsShopOpen(true)}>
                  Магазин скінів
                </button>
                <button type="button" className="footer-link" onClick={handleToggleSound}>
                  {soundEnabled ? 'Звук: Увімкнено' : 'Звук: Вимкнено'}
                </button>
              </div>

              <div className="footer-nav-col">
                <span className="footer-nav-title">ПРОЕКТ</span>
                <a
                  href="https://github.com/greenyarik0505-jpg/duck-verse"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link"
                >
                  GitHub Репозиторій
                </a>
              </div>
            </div>
          </div>

          <div className="footer-badges">
            <span className="footer-tag">⚡ 60 FPS Canvas Engine</span>
            <span className="footer-tag">🎵 130 BPM Web Audio</span>
            <span className="footer-tag">🏆 Хмарна таблиця рекордів</span>
            <span className="footer-tag">🎨 Магазин кастомізації</span>
            <span className="footer-tag">🚀 Vercel Edge Serverless</span>
          </div>

          <div className="footer-bottom">
            <span className="footer-copy">
              © 2026 Duck Verse. Усі права захищено. Створено для турнірних рекордів та чистого ритму.
            </span>
            <span className="footer-status-pill">
              <span className="footer-status-dot"></span>
              <span>Production Live</span>
            </span>
          </div>
        </div>
      </footer>

      {/* Skin Shop Modal (SCRUM-12) */}
      <SkinShopModal
        isOpen={isShopOpen}
        onClose={() => setIsShopOpen(false)}
        coins={coins}
        onUpdateCoins={handleUpdateCoins}
      />

      {/* Game Playing Modal (SCRUM-13 Benchmark & Launcher) */}
      <GameModal
        isOpen={isGameOpen}
        gameId={selectedGameId}
        onClose={() => setIsGameOpen(false)}
        onAddCoins={handleUpdateCoins}
      />
    </div>
  );
}
