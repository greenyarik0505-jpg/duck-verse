/**
 * Duck Verse Academy — Plugin Architecture, Feature Flags & Migrations (L8: SCRUM-73)
 * Керування життєвим циклом прапорців функцій, безпечні плагінні контракти з ізоляцією збоїв,
 * та ідемпотентні міграції даних зі зворотною сумісністю.
 */

export const FEATURE_FLAGS = {
  enable_academy_core: {
    key: 'enable_academy_core',
    name: 'Duck Academy Core Platform',
    description: 'Головний навчальний портал курсів L0-L9, реєстрація та прогрес',
    owner: 'Yarik0505',
    lifecycle: 'ga',
    enabled: true,
    killSwitchActive: false,
    rolloutPercentage: 100,
    expiryDate: '2027-01-01'
  },
  enable_cyber_flap: {
    key: 'enable_cyber_flap',
    name: 'Cyber Flap Duck Mini-Game',
    description: 'Автономний аркадний рушій Flappy Duck',
    owner: 'Степаненко Дмитро',
    lifecycle: 'beta',
    enabled: true,
    killSwitchActive: false,
    rolloutPercentage: 100,
    expiryDate: '2026-12-31'
  },
  enable_galactic_invaders: {
    key: 'enable_galactic_invaders',
    name: 'Galactic Invaders Mini-Game',
    description: 'Космічний 2D шутер з хітбоксами',
    owner: 'Степаненко Дмитро',
    lifecycle: 'beta',
    enabled: true,
    killSwitchActive: false,
    rolloutPercentage: 100,
    expiryDate: '2026-12-31'
  },
  enable_quack_clicker: {
    key: 'enable_quack_clicker',
    name: 'Quack Clicker Tycoon',
    description: 'Економічний клікер та магазин апгрейдів',
    owner: 'Кирил Пушкарук',
    lifecycle: 'beta',
    enabled: true,
    killSwitchActive: false,
    rolloutPercentage: 100,
    expiryDate: '2026-12-31'
  },
  enable_neon_hacker: {
    key: 'enable_neon_hacker',
    name: 'Neon Hacker Mini-Game',
    description: 'Неоновий кібер-пазл з аудіо-синтезатором 130 BPM',
    owner: 'Кирил Пушкарук',
    lifecycle: 'beta',
    enabled: true,
    killSwitchActive: false,
    rolloutPercentage: 100,
    expiryDate: '2026-12-31'
  },
  enable_dark_launch_lab: {
    key: 'enable_dark_launch_lab',
    name: 'Dark Launch Prompt Engineering Lab',
    description: 'Експериментальний модуль vibe-coding prompt lab (Dark Launch)',
    owner: 'Yarik0505',
    lifecycle: 'experimental',
    enabled: false,
    killSwitchActive: false,
    rolloutPercentage: 10,
    expiryDate: '2026-11-01'
  }
};

export const PLUGIN_REGISTRY = [
  {
    id: 'plugin-cyber-flap',
    name: 'Cyber Flap Duck',
    version: '1.2.0',
    author: 'Степаненко Дмитро',
    entryPoint: 'public/games/game_flappy.js',
    status: 'active',
    sandbox: { allowCanvas2D: true, allowAudio: true, allowLocalStorage: true, allowDomWipe: false },
    initFn: () => ({ status: 'READY', fps: 60 })
  },
  {
    id: 'plugin-galactic-invaders',
    name: 'Galactic Invaders',
    version: '1.1.0',
    author: 'Степаненко Дмитро',
    entryPoint: 'public/games/game_invaders.js',
    status: 'active',
    sandbox: { allowCanvas2D: true, allowAudio: true, allowLocalStorage: true, allowDomWipe: false },
    initFn: () => ({ status: 'READY', fps: 60 })
  },
  {
    id: 'plugin-quack-clicker',
    name: 'Quack Clicker Tycoon',
    version: '1.3.0',
    author: 'Кирил Пушкарук',
    entryPoint: 'public/games/game_clicker.js',
    status: 'active',
    sandbox: { allowCanvas2D: true, allowAudio: true, allowLocalStorage: true, allowDomWipe: false },
    initFn: () => ({ status: 'READY', fps: 60 })
  },
  {
    id: 'plugin-faulty-demo',
    name: 'Faulty Third-Party Game (Fault Injection Test)',
    version: '0.9.0',
    author: 'External Untrusted Contributor',
    entryPoint: 'public/games/game_broken.js',
    status: 'testing',
    sandbox: { allowCanvas2D: true, allowAudio: false, allowLocalStorage: false, allowDomWipe: false },
    initFn: () => {
      throw new Error('Simulated runtime exception inside plugin sandbox!');
    }
  }
];

export const MIGRATIONS_REGISTRY = [
  {
    id: '001_initial_schema',
    name: 'Add Parental Consent to Student Profiles',
    version: 1,
    applied: true,
    appliedAt: '2026-09-10T10:00:00Z',
    up: (data) => {
      return { ...data, parentConsent: { granted: true } };
    },
    down: (data) => {
      const copy = { ...data };
      delete copy.parentConsent;
      return copy;
    }
  },
  {
    id: '002_add_rubric_history',
    name: 'Add Immutable Mentor Rubric History',
    version: 2,
    applied: true,
    appliedAt: '2026-09-16T18:00:00Z',
    up: (data) => {
      return { ...data, rubricHistory: data.rubricHistory || [] };
    },
    down: (data) => {
      const copy = { ...data };
      delete copy.rubricHistory;
      return copy;
    }
  },
  {
    id: '003_capstone_certificates',
    name: 'Add SHA-256 Verified Certificates Table',
    version: 3,
    applied: true,
    appliedAt: '2026-09-16T21:00:00Z',
    up: (data) => {
      return { ...data, certificates: data.certificates || [] };
    },
    down: (data) => {
      const copy = { ...data };
      delete copy.certificates;
      return copy;
    }
  }
];

let liveFlagState = { ...FEATURE_FLAGS };
let currentSchemaVersion = 3;
const migrationLog = [
  { migrationId: '001_initial_schema', status: 'SUCCESS', timestamp: '2026-09-10T10:00:00Z' },
  { migrationId: '002_add_rubric_history', status: 'SUCCESS', timestamp: '2026-09-16T18:00:00Z' },
  { migrationId: '003_capstone_certificates', status: 'SUCCESS', timestamp: '2026-09-16T21:00:00Z' }
];

/**
 * Перевіряє доступність прапорця (Evaluation Engine)
 */
export function isFeatureEnabled(flagKey, context = {}) {
  const flag = liveFlagState[flagKey];
  if (!flag) return false;

  // Якщо активовано Kill Switch — фіча миттєво блокується!
  if (flag.killSwitchActive) return false;

  // Якщо вимкнено адміністратором
  if (!flag.enabled) return false;

  // Перевірка терміну дії (expiry date)
  if (new Date() > new Date(flag.expiryDate)) {
    return flag.lifecycle === 'ga'; // Якщо ga — за замовчуванням залишається, інакше виводиться
  }

  // Розрахунок gradual rollout відсотку
  if (flag.rolloutPercentage < 100) {
    const userId = context.userId || 'guest_user';
    const charCodeSum = userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const bucket = charCodeSum % 100;
    return bucket < flag.rolloutPercentage;
  }

  return true;
}

/**
 * Оновлює стан прапорця або активує аварійний Kill Switch
 */
export function setFeatureFlag(flagKey, updates = {}, requestingUser = {}) {
  if (!liveFlagState[flagKey]) {
    throw new Error(`Прапорець ${flagKey} не знайдено`);
  }

  // Тільки ментор або адмін мають право змінювати флаги у продакшені
  if (requestingUser.role !== 'admin' && requestingUser.role !== 'mentor') {
    throw new Error('Недостатньо прав для модифікації Feature Flags (потрібна роль Admin або Mentor)');
  }

  liveFlagState[flagKey] = {
    ...liveFlagState[flagKey],
    ...updates,
    updatedAt: new Date().toISOString(),
    updatedBy: requestingUser.username || 'admin'
  };

  return {
    success: true,
    flag: liveFlagState[flagKey]
  };
}

/**
 * Безпечне завантаження плагіна в ізольованій пісочниці (Fault-Tolerant Loader)
 */
export function loadPluginSafely(pluginId) {
  const plugin = PLUGIN_REGISTRY.find(p => p.id === pluginId);
  if (!plugin) {
    return { success: false, error: `Плагін ${pluginId} не зареєстровано`, fallbackActive: true };
  }

  try {
    const initResult = plugin.initFn();
    return {
      success: true,
      pluginId: plugin.id,
      name: plugin.name,
      version: plugin.version,
      initResult,
      fallbackActive: false
    };
  } catch (err) {
    // Graceful Degradation: ядро перехоплює збій плагіна і не ламається
    return {
      success: false,
      pluginId: plugin.id,
      name: plugin.name,
      error: err.message,
      fallbackActive: true,
      message: 'Плагін аварійно зупинено, застосовано безпечний Fallback для захисту ядра хабу'
    };
  }
}

/**
 * Запуск міграції даних (Ідемпотентний)
 */
export function runMigration(migrationId) {
  const migration = MIGRATIONS_REGISTRY.find(m => m.id === migrationId);
  if (!migration) {
    throw new Error(`Міграцію ${migrationId} не знайдено`);
  }

  // Ідемпотентність: якщо міграція вже застосована
  if (migration.applied) {
    return {
      success: true,
      migrationId,
      message: 'Міграцію вже застосовано раніше (Ідемпотентний пропуск)',
      schemaVersion: currentSchemaVersion
    };
  }

  migration.applied = true;
  migration.appliedAt = new Date().toISOString();
  currentSchemaVersion = Math.max(currentSchemaVersion, migration.version);

  migrationLog.push({
    migrationId,
    status: 'SUCCESS',
    timestamp: new Date().toISOString()
  });

  return {
    success: true,
    migrationId,
    schemaVersion: currentSchemaVersion,
    message: `Міграцію ${migrationId} успішно виконано без простою системи`
  };
}

/**
 * Відкат міграції даних (Zero-Downtime Rollback)
 */
export function rollbackMigration(migrationId) {
  const migration = MIGRATIONS_REGISTRY.find(m => m.id === migrationId);
  if (!migration) {
    throw new Error(`Міграцію ${migrationId} не знайдено`);
  }

  migration.applied = false;
  currentSchemaVersion = Math.max(1, migration.version - 1);

  migrationLog.push({
    migrationId,
    status: 'ROLLED_BACK',
    timestamp: new Date().toISOString()
  });

  return {
    success: true,
    migrationId,
    schemaVersion: currentSchemaVersion,
    message: `Міграцію ${migrationId} успішно відкочено до версії ${currentSchemaVersion}`
  };
}

/**
 * Отримання повного стану модуля плагінів та прапорців
 */
export function getPluginState() {
  return {
    flags: liveFlagState,
    plugins: PLUGIN_REGISTRY.map(p => ({
      id: p.id,
      name: p.name,
      version: p.version,
      author: p.author,
      status: p.status,
      sandbox: p.sandbox
    })),
    migrations: {
      currentVersion: currentSchemaVersion,
      list: MIGRATIONS_REGISTRY,
      log: migrationLog.slice(-5)
    },
    updatedAt: new Date().toISOString()
  };
}
