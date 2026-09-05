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
        <section className="games-section">
          <div className="games-grid">
            {filtered.map((game) => (
              <GameCard key={game.id} game={game} onPlay={handleLaunchGame} />
            ))}
          </div>
        </section>
      </main>

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
