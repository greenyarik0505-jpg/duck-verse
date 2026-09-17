/**
 * Duck Verse — Game Registry (SCRUM-15 & SCRUM-40)
 * Модульний реєстр ігор із єдиним контрактом, валідацією на рівні збірки
 * та централізованими метаданими керування й доступності.
 */

import { validateGameRegistry, validateGameContract } from './contract.js';

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
    engineType: 'canvas',
    enginePath: '/games/game_geometry_dash.js',
    engineClass: 'GeometryDashGame',
    icon: '⚡',
    isFlagship: true,
    status: 'playable',
    keywords: ['геометрия', 'геометрія', 'деш', 'даш', 'куб', 'кубик', 'шипы', 'шипи', 'gd', 'geometry dash', 'ритм', 'neon madness', 'платформер', 'стрибки', 'прыжки', 'музыка'],
    controls: {
      summary: 'Пробіл / ↑ / Клік — стрибок | R — заново | S — швидкість | F — повний екран',
      keyboard: [
        { keys: ['Space', 'ArrowUp'], description: 'Стрибок кубика' },
        { keys: ['KeyR'], description: 'Швидкий рестарт' },
        { keys: ['KeyS'], description: 'Зміна швидкості' },
        { keys: ['KeyF'], description: 'Повний екран' },
        { keys: ['KeyM'], description: 'Перемикання звуку' },
        { keys: ['Escape'], description: 'Вихід до хабу' }
      ],
      mouse: 'Лівий клік — стрибок',
      touch: 'Тап по екрану — стрибок'
    },
    scoring: {
      type: 'percentage',
      unit: '%',
      highScoreKey: 'duckverse_gd_best'
    },
    accessibility: {
      ariaLabel: 'Geometry Dash Neon: ритм-платформер',
      keyboardSupport: true,
      screenReaderInstructions: 'Використовуйте клавішу Пробіл або стрілку вгору для стрибка через перешкоди.'
    }
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
    engineType: 'react',
    enginePath: '/components/games/NeonHacker',
    engineClass: null,
    icon: '💻',
    isFlagship: false,
    status: 'playable',
    keywords: ['хакер', 'взломщик', 'неон', 'взлом', 'злом', 'терминал', 'термінал', 'кібер', 'кибер', 'головоломка', 'пазл', 'кольца', 'кільця', 'коды', 'коди', 'hacker', 'neon'],
    controls: {
      summary: 'Пробіл / Клік — постріл імпульсу | Клавіатура — шифр терміналу',
      keyboard: [
        { keys: ['Space'], description: 'Постріл кібер-імпульсу' },
        { keys: ['A-Z', '0-9'], description: 'Введення кібер-шифру в терміналі' },
        { keys: ['KeyM'], description: 'Перемикання звуку' },
        { keys: ['Escape'], description: 'Вихід до хабу' }
      ],
      mouse: 'Лівий клік — постріл імпульсу',
      touch: 'Тап по екрану — постріл імпульсу'
    },
    scoring: {
      type: 'levels',
      unit: 'рівні',
      highScoreKey: 'duckverse_hacker_level'
    },
    accessibility: {
      ariaLabel: 'Неоновий Взломщик: кібер-головоломка',
      keyboardSupport: true,
      screenReaderInstructions: 'Стріляйте імпульсом крізь проміжки у файрволі клавішею Пробіл або введіть шифр терміналу.'
    }
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
    engineType: 'canvas',
    enginePath: '/games/game_invaders.js',
    engineClass: 'DuckInvadersGame',
    icon: '👾',
    isFlagship: false,
    status: 'playable',
    keywords: ['инвадерс', 'інвадерс', 'космос', 'шутер', 'стрелялка', 'стрілялка', 'галактика', 'space', 'invaders', 'корабль', 'корабель', 'дроны', 'дрони', 'лазер', 'утка', 'качка'],
    controls: {
      summary: '← → / Миша — рух | Пробіл / Клік — лазери | R — заново | F — повний екран',
      keyboard: [
        { keys: ['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'], description: 'Рух корабля' },
        { keys: ['Space'], description: 'Стрільба квантовим лазером' },
        { keys: ['KeyR'], description: 'Перезапуск місії' },
        { keys: ['KeyF'], description: 'Повний екран' },
        { keys: ['KeyM'], description: 'Звук' },
        { keys: ['Escape'], description: 'Вихід до хабу' }
      ],
      mouse: 'Рух мишкою — позиція, Клік — вогонь',
      touch: 'Свайп вліво/вправо — позиція, тап — вогонь'
    },
    scoring: {
      type: 'points',
      unit: 'pts',
      highScoreKey: 'duckverse_invaders_score'
    },
    accessibility: {
      ariaLabel: 'Galactic Invaders: космічний аркадний шутер',
      keyboardSupport: true,
      screenReaderInstructions: 'Керуйте зорельотом стрілками вліво/вправо та стріляйте клавішею Пробіл.'
    }
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
    engineType: 'dom',
    enginePath: '/games/game_clicker.js',
    engineClass: 'QuackClickerGame',
    icon: '🪙',
    isFlagship: false,
    status: 'playable',
    keywords: ['кликер', 'клікер', 'тайкун', 'tycoon', 'клик', 'клік', 'монеты', 'монети', 'апгрейды', 'апгрейди', 'утка', 'качка', 'кряк', 'quack', 'clicker', 'деньги', 'гроші'],
    controls: {
      summary: 'Клік / Space / Enter по качці — збір кряків | Покращення — картки праворуч',
      keyboard: [
        { keys: ['Space', 'Enter'], description: 'Клік по головній качці при фокусі' },
        { keys: ['Tab'], description: 'Навігація по апгрейдах магазину' },
        { keys: ['Escape'], description: 'Вихід до хабу' }
      ],
      mouse: 'Лівий клік по качці та кнопках покращень',
      touch: 'Тап по качці та елементах тайкуну'
    },
    scoring: {
      type: 'quacks',
      unit: 'кряків',
      highScoreKey: 'duckverse_clicker_quacks'
    },
    accessibility: {
      ariaLabel: 'Quack Clicker Tycoon: клікер качок',
      keyboardSupport: true,
      screenReaderInstructions: 'Натискайте клавішу Space або Enter для кліку по качці та купуйте покращення клавіатурою.'
    }
  },
  {
    id: 'flappy',
    title: 'Flappy Duck',
    tag: 'КЛАСИЧНА АРКАДА',
    badge: 'СКОРО',
    desc: 'Класична аркадна гра без неону! Керуй польотом кумедної качечки крізь зелені труби, збирай золоті монети та бий рекорди.',
    rating: '4.9 ★',
    players: '11.2k',
    category: 'arcade',
    engineType: 'canvas',
    enginePath: '/games/game_flappy.js',
    engineClass: 'FlappyDuckGame',
    icon: '🦆',
    isFlagship: false,
    status: 'coming_soon',
    keywords: ['флаппи', 'флаппі', 'птичка', 'пташка', 'утка', 'качка', 'трубы', 'труби', 'flappy', 'flappy bird', 'flap', 'полет', 'політ', 'аркада'],
    controls: {
      summary: 'Пробіл / Клік / Тап — підйом реактивного ранця',
      keyboard: [
        { keys: ['Space', 'ArrowUp'], description: 'Підйом вгору' },
        { keys: ['KeyR'], description: 'Рестарт' },
        { keys: ['Escape'], description: 'Вихід до хабу' }
      ],
      mouse: 'Клік — поштовх вгору',
      touch: 'Тап — поштовх вгору'
    },
    scoring: {
      type: 'points',
      unit: 'перешкод',
      highScoreKey: 'duckverse_flappy_best'
    },
    accessibility: {
      ariaLabel: 'Cyber Flap Duck: аркада реактивного польоту',
      keyboardSupport: true,
      screenReaderInstructions: 'Підтримуйте висоту польоту короткими натисканнями клавіші Пробіл.'
    }
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
    engineType: 'canvas',
    enginePath: '/games/game_hunter.js',
    engineClass: 'DuckHunterGame',
    icon: '🎯',
    isFlagship: false,
    status: 'coming_soon',
    keywords: ['тир', 'охота', 'полювання', 'хантер', 'hunter', 'мишени', 'мішені', 'стрельба', 'стрільба', 'прицел', 'приціл', 'реакция', 'реакція', 'duck hunter'],
    controls: {
      summary: 'Приціл мишкою / тапом — точний постріл по голографічних мішенях',
      keyboard: [
        { keys: ['Space'], description: 'Постріл у точку прицілу' },
        { keys: ['KeyR'], description: 'Перезарядка / Рестарт' },
        { keys: ['Escape'], description: 'Вихід до хабу' }
      ],
      mouse: 'Рух курсором — прицілювання, Клік — вогонь',
      touch: 'Тап по цілі — миттєвий постріл'
    },
    scoring: {
      type: 'points',
      unit: 'влучань',
      highScoreKey: 'duckverse_hunter_score'
    },
    accessibility: {
      ariaLabel: 'Neon Duck Hunter: неоновий лазерний тир',
      keyboardSupport: true,
      screenReaderInstructions: 'Цільтесь та натискайте для стрільби по мішенях.'
    }
  }
];

// Автоматична валідація реєстру при ініціалізації
validateGameRegistry(GAME_REGISTRY);

export function getGamesByCategory(category) {
  if (!category || category === 'all') return GAME_REGISTRY;
  const cat = category.toLowerCase();
  return GAME_REGISTRY.filter((g) => (g.category || '').toLowerCase() === cat);
}

export function searchGames(query) {
  const q = (query || '').toLowerCase().trim();
  if (!q) return GAME_REGISTRY;
  const terms = q.split(/\s+/).filter(Boolean);

  return GAME_REGISTRY.filter((g) => {
    const haystack = [
      g.title,
      g.desc,
      g.tag,
      g.category,
      g.id,
      ...(g.keywords || [])
    ].map((item) => (item || '').toLowerCase());

    return terms.every((term) => haystack.some((field) => field.includes(term)));
  });
}

export function getGameById(id) {
  return GAME_REGISTRY.find((g) => g.id === id) || GAME_REGISTRY[0];
}

export { validateGameRegistry, validateGameContract };
