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
      className="academy-auth-modal-overlay fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-heading"
    >
      <div
        className="academy-auth-modal-card max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <h3 id="auth-modal-heading" className="text-lg font-bold font-['Orbitron',sans-serif] text-cyan-400">
            🔐 Авторизація в Duck Academy
          </h3>
          <button
            type="button"
            className="text-slate-400 hover:text-white text-lg p-1"
            onClick={onClose}
            aria-label="Закрити модальне вікно"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            className={`py-1.5 text-xs font-bold rounded-lg transition ${
              tab === 'login' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
            onClick={() => { setTab('login'); setErrorMessage(''); }}
          >
            Вхід (Login)
          </button>
          <button
            type="button"
            className={`py-1.5 text-xs font-bold rounded-lg transition ${
              tab === 'register' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
            onClick={() => { setTab('register'); setErrorMessage(''); }}
          >
            Реєстрація (New)
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-800/50 text-rose-300 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="login-username">
                {"Ім'я користувача (Username):"}
              </label>
              <input
                id="login-username"
                type="text"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                placeholder="наприклад: student_yarik"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="login-password">
                Пароль:
              </label>
              <input
                id="login-password"
                type="password"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold rounded-lg transition shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              {loading ? 'Перевірка...' : 'Увійти в акаунт'}
            </button>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="reg-username">
                Придумайте Username (від 3 символів):
              </label>
              <input
                id="reg-username"
                type="text"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                placeholder="наприклад: cyber_duck_2026"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="reg-password">
                Надійний пароль (від 8 символів):
              </label>
              <input
                id="reg-password"
                type="password"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none"
                placeholder="Мінімум 8 символів"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
              <label className="flex items-start gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer"
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
              className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-bold rounded-lg transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {loading ? 'Створення акаунта...' : 'Зареєструватися'}
            </button>
          </form>
        )}

        {/* Guest Mode Alternative */}
        <div className="mt-4 pt-4 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400 mb-2">Хочете спершу оглянути платформу без реєстрації?</p>
          <button
            type="button"
            onClick={handleGuestMode}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition"
          >
            👤 Продовжити як Гість (Guest Mode)
          </button>
        </div>
      </div>
    </div>
  );
}
