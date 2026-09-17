'use client';

import { useState, useEffect, useRef } from 'react';

const AVATARS = ['🦆', '🐥', '⚡', '💻', '🎮', '🏆', '🌊', '🤖', '🔥', '🌀', '👾', '🎯'];

function loadProfile() {
  try {
    const raw = localStorage.getItem('duckverse_profile');
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (typeof data !== 'object' || !data) return null;
    return data;
  } catch {
    return null;
  }
}

function saveProfile(profile) {
  try {
    localStorage.setItem('duckverse_profile', JSON.stringify(profile));
  } catch {}
}

function defaultProfile() {
  return {
    name: '',
    avatar: '🦆',
    coins: 50,
    bestGD: 0,
    bestInvaders: 0,
    lastPlayed: null,
    gamesPlayed: 0,
    createdAt: new Date().toISOString(),
  };
}

export default function PlayerProfileModal({ isOpen, onClose, coins }) {
  const [profile, setProfile] = useState(defaultProfile);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftAvatar, setDraftAvatar] = useState('🦆');
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const saved = loadProfile();
    if (saved) {
      setProfile({ ...defaultProfile(), ...saved, coins });
    } else {
      setProfile({ ...defaultProfile(), coins });
    }
  }, [isOpen, coins]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const startEdit = () => {
    setDraftName(profile.name);
    setDraftAvatar(profile.avatar);
    setEditing(true);
  };

  const saveEdit = () => {
    const trimmed = draftName.trim().slice(0, 24);
    const updated = { ...profile, name: trimmed || 'Гравець', avatar: draftAvatar };
    setProfile(updated);
    saveProfile(updated);
    setEditing(false);
  };

  const resetProfile = () => {
    const fresh = defaultProfile();
    fresh.coins = coins;
    setProfile(fresh);
    saveProfile(fresh);
    setEditing(false);
  };

  const displayName = profile.name || 'Новий Гравець';
  const joined = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('uk-UA')
    : '—';

  return (
    <div
      className="profile-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Профіль гравця"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="profile-modal-panel">
        {/* Header */}
        <div className="profile-modal-header">
          <h2 className="profile-modal-title">👤 Профіль гравця</h2>
          <button
            className="profile-close-btn"
            onClick={onClose}
            aria-label="Закрити профіль"
          >
            ✕
          </button>
        </div>

        {/* Avatar + Name */}
        <div className="profile-identity">
          <div className="profile-avatar-big" aria-label={`Аватар: ${profile.avatar}`}>
            {profile.avatar}
          </div>
          <div className="profile-name-section">
            {editing ? (
              <>
                <div className="profile-avatar-picker" role="group" aria-label="Вибір аватару">
                  {AVATARS.map((a) => (
                    <button
                      key={a}
                      className={`avatar-pick-btn ${draftAvatar === a ? 'active' : ''}`}
                      onClick={() => setDraftAvatar(a)}
                      aria-label={`Аватар ${a}`}
                      aria-pressed={draftAvatar === a}
                    >
                      {a}
                    </button>
                  ))}
                </div>
                <input
                  ref={inputRef}
                  className="profile-name-input"
                  type="text"
                  maxLength={24}
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  placeholder="Введіть ім'я (до 24 символів)"
                  aria-label="Ім'я гравця"
                  onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); }}
                />
                <div className="profile-edit-actions">
                  <button className="profile-save-btn" onClick={saveEdit} aria-label="Зберегти профіль">
                    ✔ Зберегти
                  </button>
                  <button className="profile-cancel-btn" onClick={() => setEditing(false)} aria-label="Скасувати редагування">
                    ✕ Скасувати
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="profile-display-name">{displayName}</div>
                <div className="profile-joined">Гравець з {joined}</div>
                <button className="profile-edit-btn" onClick={startEdit} aria-label="Редагувати профіль">
                  ✏️ Редагувати
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="profile-stats-grid" role="list" aria-label="Статистика гравця">
          <div className="profile-stat-card" role="listitem">
            <span className="pstat-icon" aria-hidden="true">🪙</span>
            <div className="pstat-val" suppressHydrationWarning>{coins}</div>
            <div className="pstat-label">QuackCoins</div>
          </div>
          <div className="profile-stat-card" role="listitem">
            <span className="pstat-icon" aria-hidden="true">⚡</span>
            <div className="pstat-val">{profile.bestGD}%</div>
            <div className="pstat-label">Рекорд GD</div>
          </div>
          <div className="profile-stat-card" role="listitem">
            <span className="pstat-icon" aria-hidden="true">👾</span>
            <div className="pstat-val">{profile.bestInvaders}</div>
            <div className="pstat-label">Рекорд Invaders</div>
          </div>
          <div className="profile-stat-card" role="listitem">
            <span className="pstat-icon" aria-hidden="true">🎮</span>
            <div className="pstat-val">{profile.gamesPlayed}</div>
            <div className="pstat-label">Ігор зіграно</div>
          </div>
        </div>

        {/* Reset */}
        <div className="profile-footer">
          <button
            className="profile-reset-btn"
            onClick={resetProfile}
            aria-label="Скинути профіль до початкового стану"
          >
            🔄 Скинути профіль
          </button>
        </div>
      </div>
    </div>
  );
}
