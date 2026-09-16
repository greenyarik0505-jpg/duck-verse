'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ACHIEVEMENTS,
  getTodaysQuests,
  loadAchievementsState,
  saveAchievementsState,
  maybeResetDailyProgress,
} from '../lib/achievements';

// ── Toast ──────────────────────────────────────────────────────────────────
export function AchievementToast({ achievement, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  if (!achievement) return null;
  return (
    <div
      className="achievement-toast"
      role="alert"
      aria-live="assertive"
      aria-label={`Досягнення відкрито: ${achievement.title}`}
    >
      <span className="achievement-toast-icon" aria-hidden="true">{achievement.icon}</span>
      <div className="achievement-toast-text">
        <span className="achievement-toast-label">🏅 Досягнення відкрито!</span>
        <span className="achievement-toast-title">{achievement.title}</span>
        <span className="achievement-toast-reward">+{achievement.reward} 🪙</span>
      </div>
      <button
        className="achievement-toast-close"
        onClick={onDismiss}
        aria-label="Закрити сповіщення"
      >✕</button>
    </div>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────
export function useAchievements(onAddCoins) {
  const [achState, setAchState] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const state = loadAchievementsState();
    maybeResetDailyProgress(state);
    setAchState(state);
  }, []);

  const updateStat = useCallback((updates) => {
    setAchState((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        stats: { ...prev.stats },
        unlocked: [...prev.unlocked],
        dailyProgress: { ...prev.dailyProgress },
        dailyCompleted: [...prev.dailyCompleted],
      };

      // Apply stat updates
      for (const [k, v] of Object.entries(updates)) {
        if (k === 'addUniqueGame') {
          if (!next.stats.uniqueGamesSet.includes(v)) {
            next.stats.uniqueGamesSet = [...next.stats.uniqueGamesSet, v];
            next.stats.uniqueGamesPlayed = next.stats.uniqueGamesSet.length;
          }
        } else if (typeof v === 'number') {
          next.stats[k] = Math.max(next.stats[k] || 0, v);
        } else {
          next.stats[k] = v;
        }
      }

      // Check achievements
      const newlyUnlocked = [];
      for (const ach of ACHIEVEMENTS) {
        if (!next.unlocked.includes(ach.id) && ach.condition(next.stats)) {
          newlyUnlocked.push(ach);
          next.unlocked.push(ach.id);
        }
      }

      if (newlyUnlocked.length > 0) {
        const ach = newlyUnlocked[0];
        setToast(ach);
        if (onAddCoins) onAddCoins(ach.reward);
      }

      saveAchievementsState(next);
      return next;
    });
  }, [onAddCoins]);

  const dismissToast = useCallback(() => setToast(null), []);

  return { achState, updateStat, toast, dismissToast };
}

// ── Modal ──────────────────────────────────────────────────────────────────
export default function AchievementsModal({ isOpen, onClose, achState }) {
  const todaysQuests = getTodaysQuests();

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen || !achState) return null;

  const unlocked = achState.unlocked || [];
  const stats = achState.stats || {};

  return (
    <div
      className="achievements-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Досягнення та щоденні квести"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="achievements-panel">
        {/* Header */}
        <div className="achievements-header">
          <h2 className="achievements-title">🏅 Досягнення та квести</h2>
          <button
            className="profile-close-btn"
            onClick={onClose}
            aria-label="Закрити досягнення"
          >✕</button>
        </div>

        {/* Daily Quests */}
        <section className="achievements-section" aria-labelledby="daily-quests-heading">
          <h3 className="achievements-section-title" id="daily-quests-heading">
            📅 Щоденні квести
          </h3>
          <div className="quests-list" role="list">
            {todaysQuests.map((q) => {
              const progress = achState.dailyProgress?.[q.id] || 0;
              const completed = achState.dailyCompleted?.includes(q.id);
              const pct = Math.min(100, Math.round((progress / q.target) * 100));
              return (
                <div
                  key={q.id}
                  className={`quest-card ${completed ? 'quest-done' : ''}`}
                  role="listitem"
                  aria-label={`${q.title}: ${completed ? 'завершено' : `${progress} з ${q.target}`}`}
                >
                  <span className="quest-icon" aria-hidden="true">{q.icon}</span>
                  <div className="quest-info">
                    <div className="quest-title">{q.title}</div>
                    <div className="quest-desc">{q.desc}</div>
                    {!completed && (
                      <div className="quest-progress-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                        <div className="quest-progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </div>
                  <div className="quest-reward" aria-label={`Нагорода ${q.reward} монет`}>
                    {completed ? '✅' : `+${q.reward}🪙`}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Achievements */}
        <section className="achievements-section" aria-labelledby="achievements-heading">
          <h3 className="achievements-section-title" id="achievements-heading">
            🏆 Досягнення ({unlocked.length}/{ACHIEVEMENTS.length})
          </h3>
          <div className="achievements-grid" role="list">
            {ACHIEVEMENTS.map((ach) => {
              const isUnlocked = unlocked.includes(ach.id);
              return (
                <div
                  key={ach.id}
                  className={`achievement-card ${isUnlocked ? 'ach-unlocked' : 'ach-locked'}`}
                  role="listitem"
                  aria-label={`${ach.title}: ${isUnlocked ? 'відкрито' : 'заблоковано'}`}
                >
                  <span className="ach-icon" aria-hidden="true">
                    {isUnlocked ? ach.icon : '🔒'}
                  </span>
                  <div className="ach-info">
                    <div className="ach-title">{ach.title}</div>
                    <div className="ach-desc">{isUnlocked ? ach.desc : '???'}</div>
                  </div>
                  {isUnlocked && (
                    <span className="ach-reward" aria-label={`Нагорода ${ach.reward} монет`}>
                      +{ach.reward}🪙
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Empty state */}
        {unlocked.length === 0 && (
          <div className="achievements-empty" role="status">
            <span aria-hidden="true">🎮</span>
            <p>Грай та відкривай досягнення! Перше — вже при запуску гри.</p>
          </div>
        )}
      </div>
    </div>
  );
}
