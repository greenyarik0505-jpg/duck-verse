/**
 * Duck Verse — Game Registry (SCRUM-15)
 * Модульний реєстр ігор. Дозволяє підключати будь-яку гру
 * в каталог без потреби змінювати код інтерфейсу хабу.
 */

export const GAME_REGISTRY = [
  {
    id: 'geometry_dash',
    title: 'Geometry Dash',
    tag: 'РИТМ ТА ЕКШЕН',
    badge: '🔥 ДОСТУПНО',
    desc: 'Культовий ритм-платформер! Стрибай через гострі шипи, використовуй батути, орби під 130 BPM біт та пройди трек Neon Madness на 100%.',
    rating: '5.0 ★',
    players: '14.2k',
    category: 'action',
    enginePath: '/games/game_geometry_dash.js',
    engineClass: 'GeometryDashGame',
    icon: '⚡',
    isFlagship: true,
    status: 'playable'
  },
  {
    id: 'neon-hacker',
    title: 'Неоновий Взломщик',
    tag: 'ГОЛОВОЛОМКА ТА ЗЛОМ',
    badge: '🟣 НОВИНКА',
    desc: 'Кібер-злом фаєрволів: пробивай імпульсом проміжки в обертових кільцях та розшифруй секретний термінал ядра!',
    rating: '4.9 ★',
    players: '4.8k',
    category: 'puzzle',
    enginePath: '/components/games/NeonHacker',
    icon: '💻',
    isFlagship: false,
    status: 'playable'
  },
  {
    id: 'invaders',
    title: 'Galactic Invaders',
    tag: 'КОСМІЧНИЙ ШУТЕР',
    badge: '🔥 ДОСТУПНО',
    desc: 'Космічний ретро-шутер: керуй бойовим зорельотом-качкою, знищуй хвилі дронів і кібер-загарбників та збирай квантові монети.',
    rating: '4.9 ★',
    players: '7.8k',
    category: 'action',
    enginePath: '/games/game_invaders.js',
    engineClass: 'DuckInvadersGame',
    icon: '👾',
    isFlagship: false,
    status: 'playable'
  },
  {
    id: 'clicker',
    title: 'Quack Clicker Tycoon',
    tag: 'КЛІКЕР ТА ТАЙКУН',
    badge: '🔥 ДОСТУПНО',
    desc: 'Клікай, купуй квантові апгрейди та будуй власну мультиверс імперію качок.',
    rating: '4.8 ★',
    players: '16.5k',
    category: 'casual',
    enginePath: '/games/game_clicker.js',
    engineClass: 'QuackClickerGame',
    icon: '🪙',
    isFlagship: false,
    status: 'playable'
  },
  {
    id: 'flappy',
    title: 'Cyber Flap Duck',
    tag: 'АРКАДА',
    badge: 'СКОРО',
    desc: 'Керуй реактивним польотом через лазерні перешкоди та збирай квантові монети.',
    rating: '4.8 ★',
    players: '9.3k',
    category: 'arcade',
    enginePath: '/games/game_flappy.js',
    engineClass: 'FlappyDuckGame',
    icon: '🦆',
    isFlagship: false,
    status: 'coming_soon'
  },
  {
    id: 'hunter',
    title: 'Neon Duck Hunter',
    tag: 'ТИР ТА РЕАКЦІЯ',
    badge: 'СКОРО',
    desc: 'Динамічний неоновий тир на точність і швидкість реакції. Встигни за 35 секунд!',
    rating: '4.6 ★',
    players: '5.1k',
    category: 'arcade',
    enginePath: '/games/game_hunter.js',
    engineClass: 'DuckHunterGame',
    icon: '🎯',
    isFlagship: false,
    status: 'coming_soon'
  }
];

export function getGamesByCategory(category) {
  if (!category || category === 'all') return GAME_REGISTRY;
  const cat = category.toLowerCase();
  return GAME_REGISTRY.filter((g) => (g.category || '').toLowerCase() === cat);
}

export function searchGames(query) {
  const q = query.toLowerCase().trim();
  if (!q) return GAME_REGISTRY;
  return GAME_REGISTRY.filter(
    (g) =>
      g.title.toLowerCase().includes(q) ||
      g.desc.toLowerCase().includes(q) ||
      g.tag.toLowerCase().includes(q)
  );
}

export function getGameById(id) {
  return GAME_REGISTRY.find((g) => g.id === id) || GAME_REGISTRY[0];
}
