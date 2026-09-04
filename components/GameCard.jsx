'use client';

export default function GameCard({ game, onPlay }) {
  return (
    <div className="game-card">
      <div className="card-top">
        <span className="card-badge">{game.badge}</span>
        <span className="card-tag">{game.tag}</span>
      </div>

      <div className="card-visual">
        <span className="card-icon-emoji">{game.icon}</span>
      </div>

      <div className="card-body">
        <h3 className="card-title">{game.title}</h3>
        <p className="card-desc">{game.desc}</p>
        <div className="card-meta">
          <span className="meta-rating">{game.rating}</span>
          <span className="meta-category">📂 {game.category}</span>
        </div>
      </div>

      <div className="card-footer">
        <button className="play-btn" onClick={() => onPlay(game.id)}>
          <span>ГРАТИ</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
