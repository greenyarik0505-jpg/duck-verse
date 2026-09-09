'use client';

const CATEGORIES = [
  { id: 'all', label: 'Усі ігри' },
  { id: 'action', label: 'Екшен та Ритм' },
  { id: 'arcade', label: 'Аркади' },
  { id: 'puzzle', label: 'Головоломки' },
  { id: 'casual', label: 'Казуальні' }
];

export default function CategoryFilter({ activeCategory, onSelectCategory }) {
  return (
    <nav className="categories-bar" aria-label="Фільтрація ігор за жанрами">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          className={`cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
          onClick={() => onSelectCategory(cat.id)}
          aria-pressed={activeCategory === cat.id}
          title={`Фільтр: ${cat.label}`}
        >
          {cat.label}
        </button>
      ))}
    </nav>
  );
}
