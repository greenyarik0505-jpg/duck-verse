'use client';

export default function EmptyState({
  icon = '🔍',
  title = 'Нічого не знайдено',
  description = 'Спробуйте змінити параметри пошуку або скинути фільтри.',
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div className={`empty-state-card ${className}`} role="status" aria-live="polite">
      <span className="empty-state-icon" aria-hidden="true">
        {icon}
      </span>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-desc">{description}</p>}
      {actionLabel && onAction && (
        <button
          type="button"
          className="empty-state-action-btn"
          onClick={onAction}
          aria-label={actionLabel}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
