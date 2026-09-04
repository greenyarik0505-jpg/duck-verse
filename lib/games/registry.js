/**
 * Duck Verse — Game Registry
 * Модульний реєстр ігор. Щоб додати нову гру в хаб,
 * достатньо додати новий об'єкт у масив GAME_REGISTRY.
 */

export const GAME_REGISTRY = [
  {
    id: 'geometry_dash',
    title: 'Geometry Dash Neon',
    tag: 'RHYTHM & ACTION',
    badge: '🔥 ПРЕМЬЕРА ХАБА',
    desc: 'Культовий ритм-платформер! Стрибай через неонові шипи, використовуй батути, орби та пройди рівень на 100%.',
    rating: '5.0 ★',
    category: 'action',
    enginePath: '/src/games/game_geometry_dash.js',
    icon: '⚡'
  },
  {
    id: 'cyber_runner',
    title: 'Cyber Runner 2077',
    tag: 'ENDLESS RUNNER',
    badge: 'СКОРО',
    desc: 'Нескінченний раннер неоновим містом майбутнього з підбором повер-апів.',
    rating: '4.8 ★',
    category: 'action',
    enginePath: null,
    icon: '🏃'
  },
  {
    id: 'quantum_puzzle',
    title: 'Quantum Grid Puzzle',
    tag: 'PUZZLE',
    badge: 'СКОРО',
    desc: 'Логічна головоломка з квантовими порталами та перемикачами лазерів.',
    rating: '4.9 ★',
    category: 'casual',
    enginePath: null,
    icon: '🧩'
  }
];

export function getGamesByCategory(category) {
  if (!category || category === 'all') return GAME_REGISTRY;
  return GAME_REGISTRY.filter(g => g.category === category);
}

export function searchGames(query) {
  const q = query.toLowerCase().trim();
  if (!q) return GAME_REGISTRY;
  return GAME_REGISTRY.filter(g => 
    g.title.toLowerCase().includes(q) ||
    g.desc.toLowerCase().includes(q) ||
    g.tag.toLowerCase().includes(q)
  );
}
