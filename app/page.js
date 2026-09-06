'use client';

import { useState, useEffect } from 'react';
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

  const handleUpdateCoins = (delta) => {
    setCoins((prev) => {
      const next = Math.max(0, prev + delta);
      localStorage.setItem('duckverse_coins', next);
      return next;
    });
  };

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

        {/* Live Team & Jira Sprint Section */}
        <section className="team-section" aria-label="Команда розробки та спринт">
          <div className="team-header">
            <div className="team-badge">👥 КОМАНДА РОЗРОБКИ</div>
            <h3 className="team-title">
              Активний спринт: <span className="neon-text">«Створення гри»</span>
            </h3>
            <a
              href="https://gta6-sliv-cyberleek.atlassian.net"
              target="_blank"
              rel="noopener noreferrer"
              className="jira-link-pill"
              title="Відкрити Scrum-дошку проекту в Jira Cloud"
            >
              <span className="live-pulse" aria-hidden="true"></span>
              <span>Jira Live Дошка</span>
            </a>
          </div>

          <div className="team-grid">
            <div className="member-card">
              <div className="member-avatar" aria-hidden="true">👑</div>
              <div className="member-info">
                <div className="member-name">Yarik0505</div>
                <div className="member-role">Team Lead • Next.js Hub, UI/UX, Деплой</div>
                <div className="member-tasks">
                  <span className="task-tag">SCRUM-14</span>
                  <span className="task-tag">SCRUM-15</span>
                  <span className="task-tag">SCRUM-12</span>
                </div>
              </div>
            </div>

            <div className="member-card">
              <div className="member-avatar" aria-hidden="true">🎮</div>
              <div className="member-info">
                <div className="member-name">Степаненко Дмитро</div>
                <div className="member-role">Gameplay & Physics • Фізика куба, шипи, FX</div>
                <div className="member-tasks">
                  <span className="task-tag">SCRUM-7</span>
                  <span className="task-tag">SCRUM-8</span>
                  <span className="task-tag">SCRUM-11</span>
                </div>
              </div>
            </div>

            <div className="member-card">
              <div className="member-avatar" aria-hidden="true">🎵</div>
              <div className="member-info">
                <div className="member-name">Кирил Пушкарук</div>
                <div className="member-role">Audio & Level Design • Синтезатор 130 BPM, API</div>
                <div className="member-tasks">
                  <span className="task-tag">SCRUM-9</span>
                  <span className="task-tag">SCRUM-10</span>
                  <span className="task-tag">SCRUM-16</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Hub Footer */}
      <footer className="hub-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="footer-logo">
              DUCK<span className="neon-text">VERSE</span>
            </span>
            <p className="footer-desc">
              Автономна кіберпанк ігрова платформа нового покоління на базі Next.js 15, React 19 та Vercel Production.
            </p>
          </div>
          <div className="footer-meta">
            <span className="footer-tag">⚡ 60 FPS Canvas Engine</span>
            <span className="footer-tag">🎵 130 BPM Web Audio</span>
            <span className="footer-tag">🏆 Хмарна таблиця рекордів</span>
            <span className="footer-tag">🎨 Магазин кастомізації</span>
          </div>
          <div className="footer-copy">
            © 2026 Duck Verse. Усі права захищено. Створено для турнірних рекордів та чистого ритму.
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
        onAddCoins={(amount) => handleUpdateCoins(amount)}
      />
    </div>
  );
}
