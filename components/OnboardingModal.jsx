'use client';

import { useState, useEffect } from 'react';

const STEPS = [
  {
    title: '👋 Ласкаво просимо до Duck Verse!',
    icon: '🦆',
    desc: 'Duck Verse — ігровий хаб нового покоління. Тут є аркади, ритм-платформери та ігри з унікальним стилем. Давай швидко покажемо, як усе влаштовано!',
    hint: null,
  },
  {
    title: '🎮 Каталог ігор',
    icon: '🗂️',
    desc: 'Переглядай всі доступні ігри у каталозі. Натискай «ГРАТИ» на картці Geometry Dash Neon — це наш флагман!',
    hint: 'Використовуй фільтри категорій або пошук зверху, щоб знайти потрібну гру.',
  },
  {
    title: '⚡ Geometry Dash Neon — керування',
    icon: '⚡',
    desc: 'В Geometry Dash: натискай Пробіл, стрілку вгору або клікай по екрану — кубик стрибне! Уникай шипів та долітай до фінішу.',
    hint: 'Клавіша R — перезапуск раунду. S — змінити швидкість. Esc — повернутись до хабу.',
  },
  {
    title: '🪙 QuackCoins та Профіль',
    icon: '🪙',
    desc: 'За гру ти отримуєш QuackCoins — внутрішню валюту хабу. Трать їх у Магазині скінів на нові образи куба!',
    hint: 'Кнопка «👤 Профіль» у шапці зберігає твоє ім\'я, аватар та рекорди між сесіями.',
  },
  {
    title: '✅ Готово! Час грати!',
    icon: '🚀',
    desc: 'Ти готовий до Duck Verse! Натискай «Починати» і запускай першу гру. Якщо потрібна довідка — кнопка «Як грати?» є в меню кожної гри.',
    hint: null,
  },
];

export default function OnboardingModal({ isOpen, onClose }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    setStep(0);
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        setStep((prev) => {
          if (prev < STEPS.length - 1) return prev + 1;
          onClose();
          return prev;
        });
      }
      if (e.key === 'ArrowLeft') {
        setStep((prev) => Math.max(0, prev - 1));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div
      className="onboarding-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Onboarding — знайомство з Duck Verse"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="onboarding-panel">
        {/* Progress dots */}
        <div className="onboarding-dots" role="tablist" aria-label="Кроки ознайомлення">
          {STEPS.map((_, i) => (
            <button
              key={i}
              className={`onboarding-dot ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
              onClick={() => setStep(i)}
              aria-label={`Крок ${i + 1}`}
              aria-selected={i === step}
              role="tab"
            />
          ))}
        </div>

        {/* Content */}
        <div className="onboarding-content" key={step}>
          <div className="onboarding-icon" aria-hidden="true">{current.icon}</div>
          <h2 className="onboarding-title">{current.title}</h2>
          <p className="onboarding-desc">{current.desc}</p>
          {current.hint && (
            <div className="onboarding-hint" role="note">
              💡 {current.hint}
            </div>
          )}
        </div>

        {/* Keyboard hint */}
        <div className="onboarding-kbd-hint" aria-hidden="true">
          <kbd>←</kbd> <kbd>→</kbd> або <kbd>Enter</kbd> для навігації &nbsp;|&nbsp; <kbd>Esc</kbd> — пропустити
        </div>

        {/* Actions */}
        <div className="onboarding-actions">
          <button
            className="onboarding-skip-btn"
            onClick={onClose}
            aria-label="Пропустити ознайомлення"
          >
            Пропустити
          </button>

          <div className="onboarding-nav-btns">
            {step > 0 && (
              <button
                className="onboarding-prev-btn"
                onClick={() => setStep((p) => p - 1)}
                aria-label="Попередній крок"
              >
                ← Назад
              </button>
            )}
            <button
              className="onboarding-next-btn"
              onClick={() => {
                if (isLast) onClose();
                else setStep((p) => p + 1);
              }}
              aria-label={isLast ? 'Почати грати' : 'Наступний крок'}
            >
              {isLast ? '🚀 Починати!' : 'Далі →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
