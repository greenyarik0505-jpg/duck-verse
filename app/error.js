'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log sanitized error message without exposing credentials
    console.error('Unhandled app error occurred:', error?.message || 'Unknown error');
  }, [error]);

  return (
    <div className="error-screen-container" role="alert" aria-live="assertive">
      <div className="error-screen-card">
        <div className="error-screen-badge">ПОМИЛКА СИСТЕМИ</div>
        <div className="error-screen-icon" aria-hidden="true">⚠️</div>
        <h2 className="error-screen-title">Щось пішло не так</h2>
        <p className="error-screen-desc">
          Сталася неочікувана помилка під час виконання операції. Ваші дані та прогрес збережено.
        </p>

        <div className="error-screen-actions">
          <button
            type="button"
            className="error-retry-btn"
            onClick={() => reset()}
            aria-label="Спробувати знову"
          >
            🔄 Спробувати знову
          </button>
          <Link
            href="/"
            className="error-home-btn"
            aria-label="Повернутися на головну"
          >
            🏠 На головну
          </Link>
        </div>
      </div>
    </div>
  );
}
