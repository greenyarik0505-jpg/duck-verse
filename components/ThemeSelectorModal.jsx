'use client';

import { useState, useEffect } from 'react';
import { THEMES, saveTheme, applyTheme } from '../lib/themes';

export default function ThemeSelectorModal({ isOpen, onClose, currentTheme, onSelectTheme, gamesPlayed = 0 }) {
  const [selectedThemeId, setSelectedThemeId] = useState(currentTheme);

  useEffect(() => {
    if (isOpen) {
      setSelectedThemeId(currentTheme);
    }
  }, [isOpen, currentTheme]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        // Revert to original active theme on cancel/esc
        applyTheme(currentTheme);
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentTheme, onClose]);

  if (!isOpen) return null;

  const handlePreview = (theme) => {
    const isLocked = theme.locked && gamesPlayed < 5;
    if (isLocked) return;
    setSelectedThemeId(theme.id);
    applyTheme(theme.id);
  };

  const handleApply = (themeId) => {
    saveTheme(themeId);
    applyTheme(themeId);
    onSelectTheme(themeId);
    onClose();
  };

  const handleCancel = () => {
    applyTheme(currentTheme);
    onClose();
  };

  return (
    <div
      className="theme-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Налаштування теми хабу"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCancel();
      }}
    >
      <div className="theme-modal-panel">
        <div className="theme-modal-header">
          <h2 className="theme-modal-title">🎨 Теми хабу</h2>
          <button
            className="profile-close-btn"
            onClick={handleCancel}
            aria-label="Закрити вибір теми"
          >
            ✕
          </button>
        </div>

        <p className="theme-modal-subtitle">
          Виберіть стиль оформлення Duck Verse. Попередній перегляд застосовується миттєво.
        </p>

        <div className="theme-cards-list" role="radiogroup" aria-label="Вибір теми">
          {THEMES.map((theme) => {
            const isLocked = theme.locked && gamesPlayed < 5;
            const isSelected = selectedThemeId === theme.id;
            const isCurrent = currentTheme === theme.id;

            return (
              <div
                key={theme.id}
                className={`theme-card ${isSelected ? 'selected' : ''} ${isLocked ? 'locked' : ''}`}
                onClick={() => !isLocked && handlePreview(theme)}
                role="radio"
                aria-checked={isSelected}
                tabIndex={isLocked ? -1 : 0}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !isLocked) {
                    e.preventDefault();
                    handlePreview(theme);
                  }
                }}
                aria-label={`${theme.name}${isLocked ? ' (заблоковано)' : ''}`}
              >
                <div className="theme-card-icon" aria-hidden="true">
                  {isLocked ? '🔒' : theme.icon}
                </div>
                <div className="theme-card-body">
                  <div className="theme-card-title-row">
                    <span className="theme-card-name">{theme.name}</span>
                    {isCurrent && <span className="theme-current-badge">Активна</span>}
                    {isLocked && <span className="theme-locked-badge">СКОРО</span>}
                  </div>
                  <p className="theme-card-desc">{theme.desc}</p>
                  {isLocked && (
                    <p className="theme-card-hint">
                      🔒 {theme.unlockHint} (зіграно: {gamesPlayed}/5)
                    </p>
                  )}
                  {/* Swatches preview */}
                  <div className="theme-palette-preview" aria-hidden="true">
                    <span style={{ background: theme.vars['--bg-primary'] }} />
                    <span style={{ background: theme.vars['--primary'] }} />
                    <span style={{ background: theme.vars['--accent'] }} />
                    <span style={{ background: theme.vars['--text-main'] }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="theme-modal-footer">
          <button
            className="theme-cancel-btn"
            onClick={handleCancel}
            aria-label="Скасувати"
          >
            Скасувати
          </button>
          <button
            className="theme-apply-btn"
            onClick={() => handleApply(selectedThemeId)}
            aria-label="Зберегти обрану тему"
          >
            ✓ Застосувати тему
          </button>
        </div>
      </div>
    </div>
  );
}
