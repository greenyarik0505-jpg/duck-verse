/**
 * Duck Verse — Achievements & Daily Quests System (SCRUM-32)
 * Конфігурація досягнень та щоденних квестів.
 */

export const ACHIEVEMENTS = [
  {
    id: 'first_launch',
    icon: '🚀',
    title: 'Перший старт',
    desc: 'Запусти будь-яку гру вперше.',
    reward: 10,
    condition: (stats) => stats.gamesLaunched >= 1,
  },
  {
    id: 'quack_100',
    icon: '🦆',
    title: 'Сто Кряків',
    desc: 'Набери 100 кряків у Quack Clicker.',
    reward: 15,
    condition: (stats) => stats.maxQuacks >= 100,
  },
  {
    id: 'gd_50pct',
    icon: '⚡',
    title: 'Половина шляху',
    desc: 'Пройди Geometry Dash Neon на 50%.',
    reward: 20,
    condition: (stats) => stats.bestGD >= 50,
  },
  {
    id: 'gd_100pct',
    icon: '🏆',
    title: 'Абсолютний рекорд!',
    desc: 'Пройди Geometry Dash Neon на 100%!',
    reward: 100,
    condition: (stats) => stats.bestGD >= 100,
  },
  {
    id: 'coins_50',
    icon: '🪙',
    title: 'Перша скарбниця',
    desc: 'Накопич 50 QuackCoins.',
    reward: 5,
    condition: (stats) => stats.totalCoinsEarned >= 50,
  },
  {
    id: 'coins_500',
    icon: '💰',
    title: 'Квантова скарбниця',
    desc: 'Накопич 500 QuackCoins.',
    reward: 50,
    condition: (stats) => stats.totalCoinsEarned >= 500,
  },
  {
    id: 'games_3',
    icon: '🎮',
    title: 'Справжній геймер',
    desc: 'Запусти 3 різних гри.',
    reward: 25,
    condition: (stats) => stats.uniqueGamesPlayed >= 3,
  },
  {
    id: 'invaders_wave5',
    icon: '👾',
    title: 'Галактичний захисник',
    desc: 'Досягни 5-ї хвилі у Galactic Invaders.',
    reward: 30,
    condition: (stats) => stats.bestInvadersWave >= 5,
  },
  {
    id: 'skin_bought',
    icon: '🎨',
    title: 'Стиліст',
    desc: 'Купи перший скін у магазині.',
    reward: 15,
    condition: (stats) => stats.skinsBought >= 1,
  },
  {
    id: 'profile_set',
    icon: '👤',
    title: 'Власна особистість',
    desc: 'Встанови ім\'я та аватар у профілі.',
    reward: 10,
    condition: (stats) => stats.profileSet,
  },
];

export const DAILY_QUESTS_POOL = [
  {
    id: 'daily_launch',
    icon: '▶️',
    title: 'Щоденний старт',
    desc: 'Запусти будь-яку гру сьогодні.',
    reward: 5,
    target: 1,
    stat: 'dailyLaunches',
  },
  {
    id: 'daily_quacks',
    icon: '🦆',
    title: 'Кряк-марафон',
    desc: 'Набери 50 кряків у Quack Clicker.',
    reward: 8,
    target: 50,
    stat: 'dailyQuacks',
  },
  {
    id: 'daily_coins',
    icon: '🪙',
    title: 'Золотий день',
    desc: 'Зароби 20 QuackCoins за сьогодні.',
    reward: 10,
    target: 20,
    stat: 'dailyCoins',
  },
];

/**
 * Отримати 2 щоденних квести для сьогоднішнього дня.
 * Індекс визначається за порядковим номером дня року — стабільно на весь день.
 */
export function getTodaysQuests() {
  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  const idx1 = dayOfYear % DAILY_QUESTS_POOL.length;
  const idx2 = (dayOfYear + 1) % DAILY_QUESTS_POOL.length;
  return [DAILY_QUESTS_POOL[idx1], DAILY_QUESTS_POOL[idx2]];
}

const STORAGE_KEY = 'duckverse_achievements';

export function loadAchievementsState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();
    const data = JSON.parse(raw);
    if (typeof data !== 'object' || !data) return getDefaultState();
    return { ...getDefaultState(), ...data };
  } catch {
    return getDefaultState();
  }
}

function getDefaultState() {
  const today = new Date().toISOString().slice(0, 10);
  return {
    unlocked: [],          // array of achievement ids
    stats: {
      gamesLaunched: 0,
      uniqueGamesPlayed: 0,
      uniqueGamesSet: [],
      maxQuacks: 0,
      bestGD: 0,
      bestInvadersWave: 0,
      totalCoinsEarned: 0,
      skinsBought: 0,
      profileSet: false,
      dailyLaunches: 0,
      dailyQuacks: 0,
      dailyCoins: 0,
    },
    dailyDate: today,
    dailyProgress: {},     // { questId: progress }
    dailyCompleted: [],    // completed quest ids today
  };
}

export function saveAchievementsState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

/**
 * Check achievements after stat update.
 * Returns array of newly unlocked achievement objects.
 */
export function checkAchievements(state) {
  const newlyUnlocked = [];
  for (const ach of ACHIEVEMENTS) {
    if (!state.unlocked.includes(ach.id) && ach.condition(state.stats)) {
      newlyUnlocked.push(ach);
      state.unlocked.push(ach.id);
    }
  }
  return newlyUnlocked;
}

/**
 * Reset daily progress if the date has changed.
 */
export function maybeResetDailyProgress(state) {
  const today = new Date().toISOString().slice(0, 10);
  if (state.dailyDate !== today) {
    state.dailyDate = today;
    state.dailyProgress = {};
    state.dailyCompleted = [];
  }
}
