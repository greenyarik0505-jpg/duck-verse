'use client';

const CATEGORIES = [
  { id: 'all', label: 'Усі ігри' },
  { id: 'action', label: 'Екшен та Ритм' },
  { id: 'arcade', label: 'Аркади' },
  { id: 'casual', label: 'Казуальні' }
];

export default function CategoryFilter({ activeCategory, onSelectCategory }) {
  return (
    <section className="categories-bar">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          className={`cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
          onClick={() => onSelectCategory(cat.id)}
        >
          {cat.label}
        </button>
      ))}
    </section>
  );
}
