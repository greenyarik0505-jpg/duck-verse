'use client';

import React, { useState } from 'react';

export default function AuthModal({ isOpen, onClose, currentUser, onUserChange }) {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [parentConsent, setParentConsent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!username.trim() || !password) {
      setErrorMessage('Будь ласка, заповніть усі поля.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/academy/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onUserChange(data.user);
        onClose();
      } else {
        setErrorMessage(data.error || 'Невірне ім\'я користувача або пароль.');
      }
    } catch (err) {
      setErrorMessage('Помилка підключення до сервера автентифікації.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (username.trim().length < 3) {
      setErrorMessage('Ім\'я користувача має містити щонайменше 3 символи.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Пароль має містити щонайменше 8 символів.');
      return;
    }
    if (!parentConsent) {
      setErrorMessage('Для учнів обов\'язкове підтвердження згоди батьків або опікуна.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/academy/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
          role: 'child',
          parentConsent: true
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onUserChange(data.user);
        onClose();
      } else {
        setErrorMessage(data.error || 'Не вдалося зареєструвати акаунт.');
      }
    } catch (err) {
      setErrorMessage('Помилка реєстрації. Спробуйте пізніше.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMode = () => {
    onUserChange({
      id: 'user_guest',
      username: 'Гість',
      role: 'guest',
      parentConsent: null
    });
    onClose();
  };

  return (
    <div
      className="academy-auth-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-heading"
    >
      <div
        className="academy-auth-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="academy-auth-modal-header">
          <h3 id="auth-modal-heading" className="academy-auth-modal-title">
            <span>🔐</span> Авторизація в Duck Academy
          </h3>
          <button
            type="button"
            className="academy-auth-modal-close"
            onClick={onClose}
            aria-label="Закрити модальне вікно"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="academy-auth-tabs">
          <button
            type="button"
            className={`academy-auth-tab-btn ${tab === 'login' ? 'is-active' : ''}`}
            onClick={() => { setTab('login'); setErrorMessage(''); }}
          >
            Вхід (Login)
          </button>
          <button
            type="button"
            className={`academy-auth-tab-btn ${tab === 'register' ? 'is-active' : ''}`}
            onClick={() => { setTab('register'); setErrorMessage(''); }}
          >
            Реєстрація (New)
          </button>
        </div>

        {errorMessage && (
          <div className="academy-auth-error">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="academy-auth-form">
            <div className="academy-auth-field">
              <label className="academy-auth-label" htmlFor="login-username">
                {"Ім'я користувача (Username):"}
              </label>
              <input
                id="login-username"
                type="text"
                required
                className="academy-auth-input"
                placeholder="наприклад: student_duck або admin_root"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="academy-auth-field">
              <label className="academy-auth-label" htmlFor="login-password">
                Пароль:
              </label>
              <input
                id="login-password"
                type="password"
                required
                className="academy-auth-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="academy-auth-submit-btn"
            >
              {loading ? 'Перевірка...' : 'Увійти в акаунт'}
            </button>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegister} className="academy-auth-form">
            <div className="academy-auth-field">
              <label className="academy-auth-label" htmlFor="reg-username">
                Придумайте Username (від 3 символів):
              </label>
              <input
                id="reg-username"
                type="text"
                required
                className="academy-auth-input"
                placeholder="наприклад: cyber_duck_2026"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="academy-auth-field">
              <label className="academy-auth-label" htmlFor="reg-password">
                Надійний пароль (від 8 символів):
              </label>
              <input
                id="reg-password"
                type="password"
                required
                className="academy-auth-input"
                placeholder="Мінімум 8 символів"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="academy-auth-consent-box">
              <label className="academy-auth-checkbox-label">
                <input
                  type="checkbox"
                  checked={parentConsent}
                  onChange={(e) => setParentConsent(e.target.checked)}
                />
                <span>
                  <strong>Згода батьків або опікуна</strong>: Я підтверджую дозвіл на використання навчальної платформи Duck Academy згідно з політикою конфіденційності (без збору зайвих персональних даних).
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="academy-auth-submit-btn"
              style={{
                background: 'linear-gradient(135deg, #10b981, #14b8a6)',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
                borderColor: 'rgba(16, 185, 129, 0.5)'
              }}
            >
              {loading ? 'Створення акаунта...' : 'Зареєструватися'}
            </button>
          </form>
        )}

        {/* Guest Mode Alternative */}
        <div className="academy-auth-guest-section">
          <p className="academy-auth-guest-hint">Хочете спершу оглянути платформу без реєстрації?</p>
          <button
            type="button"
            onClick={handleGuestMode}
            className="academy-auth-guest-btn"
          >
            <span>👤</span> Продовжити як Гість (Guest Mode)
          </button>
        </div>
      </div>
    </div>
  );
}
