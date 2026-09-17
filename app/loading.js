export default function Loading() {
  return (
    <div className="hub-loading-skeleton" aria-label="Завантаження хабу..." role="status">
      {/* Header skeleton */}
      <div className="skeleton-header">
        <div className="skeleton-brand shimmer" />
        <div className="skeleton-search shimmer" />
        <div className="skeleton-actions shimmer" />
      </div>

      <main className="skeleton-main">
        {/* Hero banner skeleton */}
        <div className="skeleton-hero shimmer" />

        {/* Categories bar skeleton */}
        <div className="skeleton-categories">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton-cat-btn shimmer" />
          ))}
        </div>

        {/* Game cards grid skeleton */}
        <div className="skeleton-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton-card shimmer" />
          ))}
        </div>
      </main>
    </div>
  );
}
