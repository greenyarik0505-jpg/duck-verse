import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="not-found-container" role="main">
      <div className="not-found-card">
        <div className="not-found-code">404</div>
        <div className="not-found-icon" aria-hidden="true">🛸</div>
        <h1 className="not-found-title">Сторінку не знайдено</h1>
        <p className="not-found-desc">
          Цей сектор Duck Verse порожній або був переміщений у квантовий вимір.
        </p>
        <Link href="/" className="not-found-btn" aria-label="Повернутися до ігрового хабу">
          🏠 Повернутися до хабу
        </Link>
      </div>
    </div>
  );
}
