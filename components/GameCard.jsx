'use client';

const CATEGORY_NAMES = {
  action: 'Екшен та Ритм',
  arcade: 'Аркади',
  puzzle: 'Головоломки',
  Puzzle: 'Головоломки',
  casual: 'Казуальні',
  all: 'Усі ігри'
};

export default function GameCard({ game, onPlay }) {
  const isPlayable = game.status === 'playable';
  const categoryLabel = CATEGORY_NAMES[game.category] || game.category;

  return (
    <article className={`game-card ${isPlayable ? 'playable-card' : 'soon-card'}`}>
      <div className="card-top">
        <span className={`card-badge ${isPlayable ? 'badge-active' : 'badge-soon'}`}>
          {game.badge}
        </span>
        <span className="card-tag">{game.tag}</span>
      </div>

      <div className="card-visual">
        <span className="card-icon-emoji" aria-hidden="true">{game.icon}</span>
      </div>

      <div className="card-body">
        <h3 className="card-title">{game.title}</h3>
        <p className="card-desc">{game.desc}</p>
        <div className="card-meta">
          <span className="meta-rating" title={`Рейтинг гри: ${game.rating}`}>
            {game.rating}
          </span>
          <span className="meta-category" title={`Категорія: ${categoryLabel}`}>
            📂 {categoryLabel}
          </span>
          {game.players && (
            <span className="meta-players" title={`Активна спільнота: ${game.players} гравців`}>
              👥 {game.players}
            </span>
          )}
        </div>
      </div>

      <div className="card-footer">
        {isPlayable ? (
          <button
            className="play-btn"
            onClick={() => onPlay(game.id)}
            title={`Грати в ${game.title} онлайн`}
            aria-label={`Грати в ${game.title}`}
          >
            <span>ГРАТИ</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </button>
        ) : (
          <button
            className="play-btn disabled-btn"
            disabled
            aria-disabled="true"
            title="Гра знаходиться в активній розробці. Слідкуйте за оновленнями!"
            style={{
              opacity: 0.65,
              cursor: 'not-allowed',
              background: 'rgba(255, 255, 255, 0.05)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              color: '#8b9bb4',
              boxShadow: 'none'
            }}
          >
            <span>🔒 СКОРО</span>
          </button>
        )}
      </div>
    </article>
  );
}
