'use client';

import { useState } from 'react';

export default function Navbar({ coins, onOpenShop, soundEnabled, onToggleSound, searchQuery, onSearchChange }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setMobileMenuOpen(prev => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="hub-header">
      <div className="header-container">
        {/* Brand & Left */}
        <div className="brand">
          <div className="brand-logo" aria-hidden="true">
            <span className="logo-box">GD</span>
          </div>
          <div className="brand-text">
            <h1 className="logo-title">
              DUCK<span className="brand-accent">VERSE</span>
            </h1>
            <span className="logo-subtitle">ІГРОВИЙ ХАБ</span>
          </div>
        </div>

        {/* Search */}
        <div className="header-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Пошук ігор у хабі..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Пошук ігор у хабі"
          />
          {searchQuery && (
            <button
              className="search-clear-btn"
              onClick={() => onSearchChange('')}
              title="Очистити пошук"
              aria-label="Очистити пошук"
            >
              ✕
            </button>
          )}
        </div>

        {/* Desktop Actions */}
        <div className="header-actions desktop-actions">
          {/* Wallet */}
          <div className="user-wallet" title={`Ваш баланс: ${coins} QuackCoins`} aria-label="Баланс QuackCoins">
            <span className="coin-icon" aria-hidden="true">🪙</span>
            <span className="user-coins-val" suppressHydrationWarning>{coins}</span>
          </div>

          {/* Skin Shop Trigger (SCRUM-12) */}
          <button
            className="header-btn shop-trigger-btn"
            onClick={onOpenShop}
            title="Магазин скінів Geometry Dash"
            aria-label="Відкрити магазин скінів"
          >
            <span>🎨 Магазин скінів</span>
          </button>

          {/* Sound Mute */}
          <button
            className="header-btn sound-toggle-btn"
            onClick={onToggleSound}
            title={soundEnabled ? 'Вимкнути звук у хабі' : 'Увімкнути звук у хабі'}
            aria-label={soundEnabled ? 'Вимкнути звук' : 'Увімкнути звук'}
            suppressHydrationWarning
          >
            {soundEnabled ? '🔊 Звук: Увімк' : '🔇 Звук: Вимк'}
          </button>

          {/* GitHub link */}
          <a
            href="https://github.com/greenyarik0505-jpg/duck-verse"
            target="_blank"
            rel="noopener noreferrer"
            className="header-btn gh-btn"
            title="Репозиторій проекту Duck Verse на GitHub"
            aria-label="GitHub репозиторій"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            <span>GitHub</span>
          </a>
        </div>

        {/* Mobile Header Bar Quick Items */}
        <div className="header-actions-mobile">
          <div className="user-wallet mobile-wallet" title={`Ваш баланс: ${coins} QuackCoins`} aria-label="Баланс QuackCoins">
            <span className="coin-icon" aria-hidden="true">🪙</span>
            <span className="user-coins-val" suppressHydrationWarning>{coins}</span>
          </div>

          <button
            className="mobile-menu-toggle"
            onClick={toggleMobileMenu}
            aria-label={mobileMenuOpen ? "Закрити меню" : "Відкрити меню"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer" role="dialog" aria-modal="true" aria-label="Мобільне меню навігації">
          <div className="mobile-drawer-content">
            <button
              className="mobile-nav-item"
              onClick={() => {
                onOpenShop();
                closeMobileMenu();
              }}
            >
              <span className="mobile-nav-icon">🎨</span>
              <div className="mobile-nav-text">
                <span className="mobile-nav-title">Магазин скінів</span>
                <span className="mobile-nav-desc">Кастомізація куба</span>
              </div>
            </button>

            <button
              className="mobile-nav-item"
              onClick={() => {
                onToggleSound();
              }}
            >
              <span className="mobile-nav-icon">{soundEnabled ? '🔊' : '🔇'}</span>
              <div className="mobile-nav-text">
                <span className="mobile-nav-title">{soundEnabled ? 'Звук: Увімкнено' : 'Звук: Вимкнено'}</span>
                <span className="mobile-nav-desc">Фоновий звук та ефекти</span>
              </div>
            </button>

            <a
              href="https://github.com/greenyarik0505-jpg/duck-verse"
              target="_blank"
              rel="noopener noreferrer"
              className="mobile-nav-item"
              onClick={closeMobileMenu}
            >
              <span className="mobile-nav-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              </span>
              <div className="mobile-nav-text">
                <span className="mobile-nav-title">GitHub Репозиторій</span>
                <span className="mobile-nav-desc">duck-verse open source</span>
              </div>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

