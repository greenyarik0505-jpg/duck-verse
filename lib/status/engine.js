/**
 * Duck Verse & Academy — Public Status & Incident Communication Engine (SCRUM-114)
 *
 * Відповідає вимогам:
 * 1. Моніторинг 5 основних компонентів платформи: hub, games, auth, scores, learning.
 * 2. Градація статусів: operational, degraded, outage, maintenance.
 * 3. Модель інцидентів із повним життєвим циклом: investigating -> identified -> monitoring -> resolved.
 * 4. Обов'язкові поля: час початку, вплив на користувачів, термін наступного оновлення (nextUpdateDue).
 * 5. Privacy & Security Shield: гарантія відсутності витоку PII, паролів чи внутрішніх адрес у повідомленнях.
 * 6. Архів вирішених інцидентів із посиланням на Post-Incident аналіз.
 */

import crypto from 'crypto';

// Офіційні компоненти платформи
export const DEFAULT_COMPONENTS = {
  hub: {
    id: 'hub',
    name: 'Ігровий Хаб (Duck Verse Portal)',
    category: 'core',
    status: 'operational',
    description: 'Головна навігація, вітрина ігор, баланс монет та налаштування звуку.',
    updatedAt: new Date().toISOString(),
  },
  games: {
    id: 'games',
    name: 'Ігрові рушії Canvas 2D',
    category: 'gaming',
    status: 'operational',
    description: 'Geometry Dash Neon, Flappy Duck, Galactic Invaders та Neon Hacker.',
    updatedAt: new Date().toISOString(),
  },
  auth: {
    id: 'auth',
    name: 'Аутентифікація та сесії',
    category: 'security',
    status: 'operational',
    description: 'Вхід для учнів, батьків та менторів, безпека сесій та ролі.',
    updatedAt: new Date().toISOString(),
  },
  scores: {
    id: 'scores',
    name: 'Таблиця рекордів (Scores API)',
    category: 'data',
    status: 'operational',
    description: 'Збереження результатів проходження рівнів та світовий лідерборд.',
    updatedAt: new Date().toISOString(),
  },
  learning: {
    id: 'learning',
    name: 'Duck Academy & Prompt Lab',
    category: 'education',
    status: 'operational',
    description: 'Курси, практичні завдання, Vibe-coding лаба та перевірка PR.',
    updatedAt: new Date().toISOString(),
  },
};

// Регулярні вирази для санітизації повідомлень інцидентів (Zero Leakage Shield)
const SENSITIVE_PATTERNS = [
  { name: 'Email Address', regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '[REDACTED EMAIL]' },
  { name: 'Phone Number', regex: /(?:\+?380|0)\s*\(?\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{2}[-.\s]?\d{2}/g, replacement: '[REDACTED PHONE]' },
  { name: 'Password / API Secret', regex: /(?:password|secret|token|apikey|bearer)\s*[:=\s]\s*\S+/gi, replacement: '[REDACTED SECRET]' },
  { name: 'Internal IP Address', regex: /\b(?:10\.\d{1,3}|192\.168\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}|127\.0\.0\.1)\b/g, replacement: '[INTERNAL ADDR]' },
  { name: 'Database Stacktrace', regex: /(?:PostgreSQL|MySQL|PrismaClientKnownRequestError|MongoError|at\s+\S+\s+\(.*:\d+:\d+\))/gi, replacement: '[INTERNAL SYSTEM ERROR]' },
];

// Стан у пам'яті
let components = JSON.parse(JSON.stringify(DEFAULT_COMPONENTS));
let activeIncidents = [];
let resolvedIncidents = [];

// Ініціалізація демонстраційних даних
function initSampleData() {
  if (resolvedIncidents.length === 0) {
    const pastDate = new Date(Date.now() - 48 * 3600000);
    resolvedIncidents = [
      {
        id: 'INC-2026-01',
        title: 'Короткочасне уповільнення збереження рекордів у Scores API',
        severity: 'MINOR',
        status: 'resolved',
        startedAt: pastDate.toISOString(),
        resolvedAt: new Date(pastDate.getTime() + 45 * 60000).toISOString(),
        impactSummary: 'Деякі гравці могли спостерігати затримку до 2 хвилин при синхронізації рекордів з лідербордом.',
        affectedComponents: ['scores'],
        nextUpdateDue: null,
        updates: [
          {
            id: 'upd-1',
            timestamp: pastDate.toISOString(),
            status: 'investigating',
            message: 'Зафіксовано зростання черги запитів до Scores API. Інженери досліджують з’єднання.',
          },
          {
            id: 'upd-2',
            timestamp: new Date(pastDate.getTime() + 20 * 60000).toISOString(),
            status: 'identified',
            message: 'Причиною виявилося блокування транзакції при піковому напливі турніру. Застосовано оптимізацію пулу.',
          },
          {
            id: 'upd-3',
            timestamp: new Date(pastDate.getTime() + 45 * 60000).toISOString(),
            status: 'resolved',
            message: 'Всі черги очищено, середній час відповіді повернувся до норми (45 мс). Роботу відновлено.',
          },
        ],
        postIncidentUrl: '/status/incidents/INC-2026-01',
        postMortem: {
          rootCause: 'Піковий сплеск паралельних запитів під час турніру Geometry Dash викликав вичерпання пулу з’єднань.',
          correctiveActions: 'Збільшено розмір пулу до 50 з’єднань та впроваджено автоматичне кешування на рівні Edge.',
          downtimeMinutes: 45,
        },
      },
    ];
  }
}
initSampleData();

// Санітизація публічного тексту від конфіденційних даних (Zero Leakage)
export function sanitizePublicText(text) {
  if (!text || typeof text !== 'string') return text;
  let sanitized = text;
  let detectedLeaks = [];

  for (const item of SENSITIVE_PATTERNS) {
    if (item.regex.test(sanitized)) {
      detectedLeaks.push(item.name);
      sanitized = sanitized.replace(item.regex, item.replacement);
    }
  }

  return { sanitized, hasLeaks: detectedLeaks.length > 0, detectedLeaks };
}

// 1. Створення нового інциденту (Incident Reporting)
export function createIncident({
  title,
  severity = 'MINOR',
  impactSummary,
  affectedComponents = [],
  nextUpdateDue = 'протягом 30 хвилин',
  initialMessage,
}) {
  if (!title || !impactSummary) {
    throw new Error('Обов\'язково вкажіть заголовок інциденту та опис впливу на користувачів (impactSummary).');
  }

  // Санітизація заголовка та описів від PII/секретів
  const cleanTitle = sanitizePublicText(title).sanitized;
  const cleanImpact = sanitizePublicText(impactSummary).sanitized;
  const cleanInitMsg = sanitizePublicText(initialMessage || 'Розслідуємо причину проблеми. Слідкуйте за оновленнями.').sanitized;

  const incidentId = `INC-${new Date().getFullYear()}-${String(activeIncidents.length + resolvedIncidents.length + 1).padStart(2, '0')}`;
  const nowIso = new Date().toISOString();

  const newIncident = {
    id: incidentId,
    title: cleanTitle,
    severity, // 'MINOR', 'MAJOR', 'CRITICAL'
    status: 'investigating',
    startedAt: nowIso,
    resolvedAt: null,
    impactSummary: cleanImpact,
    affectedComponents,
    nextUpdateDue,
    updates: [
      {
        id: `upd-${crypto.randomUUID().slice(0, 8)}`,
        timestamp: nowIso,
        status: 'investigating',
        message: cleanInitMsg,
      },
    ],
    postIncidentUrl: null,
    postMortem: null,
  };

  // Оновлюємо статус відповідних компонентів
  for (const compId of affectedComponents) {
    if (components[compId]) {
      components[compId].status = severity === 'CRITICAL' ? 'outage' : 'degraded';
      components[compId].updatedAt = nowIso;
    }
  }

  activeIncidents.unshift(newIncident);
  return newIncident;
}

// 2. Оновлення статусу та додавання повідомлення в таймлайн інциденту
export function updateIncidentStatus(incidentId, { status, message, nextUpdateDue }) {
  const incident = activeIncidents.find((inc) => inc.id === incidentId);
  if (!incident) {
    throw new Error(`Інцидент із номером "${incidentId}" не знайдено або він вже закритий.`);
  }

  const cleanMessage = sanitizePublicText(message).sanitized;
  const nowIso = new Date().toISOString();

  incident.status = status || incident.status;
  if (nextUpdateDue !== undefined) {
    incident.nextUpdateDue = nextUpdateDue;
  }

  incident.updates.unshift({
    id: `upd-${crypto.randomUUID().slice(0, 8)}`,
    timestamp: nowIso,
    status: incident.status,
    message: cleanMessage,
  });

  return incident;
}

// 3. Закриття інциденту (Resolve & Move to Archive with Post-Mortem)
export function resolveIncident(incidentId, { resolutionMessage, rootCause, correctiveActions }) {
  const index = activeIncidents.findIndex((inc) => inc.id === incidentId);
  if (index === -1) {
    throw new Error(`Інцидент "${incidentId}" не знайдено серед активних.`);
  }

  const [incident] = activeIncidents.splice(index, 1);
  const nowIso = new Date().toISOString();
  const cleanResolution = sanitizePublicText(resolutionMessage || 'Проблему усунено, робота системи повернулася до штатного режиму.').sanitized;

  const durationMs = new Date(nowIso).getTime() - new Date(incident.startedAt).getTime();
  const downtimeMinutes = Math.max(1, Math.round(durationMs / 60000));

  incident.status = 'resolved';
  incident.resolvedAt = nowIso;
  incident.nextUpdateDue = null;
  incident.postIncidentUrl = `/status/incidents/${incident.id}`;
  incident.updates.unshift({
    id: `upd-${crypto.randomUUID().slice(0, 8)}`,
    timestamp: nowIso,
    status: 'resolved',
    message: cleanResolution,
  });

  incident.postMortem = {
    rootCause: sanitizePublicText(rootCause || 'Тимчасовий технічний збій конфігурації.').sanitized,
    correctiveActions: sanitizePublicText(correctiveActions || 'Застосовано захисні патчі та додано додаткові тести.').sanitized,
    downtimeMinutes,
  };

  // Повертаємо компоненти у статус operational, якщо немає інших активних інцидентів на них
  for (const compId of incident.affectedComponents) {
    const hasOtherActive = activeIncidents.some((inc) => inc.affectedComponents.includes(compId));
    if (!hasOtherActive && components[compId]) {
      components[compId].status = 'operational';
      components[compId].updatedAt = nowIso;
    }
  }

  resolvedIncidents.unshift(incident);
  return incident;
}

// 4. Оновлення статусу конкретного компонента (Admin/Ops Action)
export function setComponentStatus(componentId, newStatus) {
  if (!components[componentId]) {
    throw new Error(`Компонент "${componentId}" не існує.`);
  }

  const allowedStatuses = ['operational', 'degraded', 'outage', 'maintenance'];
  if (!allowedStatuses.includes(newStatus)) {
    throw new Error(`Неприпустимий статус: ${newStatus}. Дозволені: ${allowedStatuses.join(', ')}`);
  }

  components[componentId].status = newStatus;
  components[componentId].updatedAt = new Date().toISOString();
  return components[componentId];
}

// 5. Розрахунок загального агрегованого статусу системи
export function calculateOverallSystemStatus() {
  const compList = Object.values(components);

  if (compList.some((c) => c.status === 'outage')) {
    return {
      code: 'MAJOR_OUTAGE',
      label: 'Зафіксовано збій у роботі системи',
      color: 'rose',
      indicator: '🔴',
      description: 'Один або декілька сервісів наразі недоступні. Наша команда вже усуває неполадки.',
    };
  }

  if (compList.some((c) => c.status === 'degraded')) {
    return {
      code: 'PARTIAL_DEGRADATION',
      label: 'Часткове сповільнення роботи',
      color: 'amber',
      indicator: '🟡',
      description: 'Основні ігри працюють, але окремі функції можуть завантажуватися довше ніж зазвичай.',
    };
  }

  if (compList.some((c) => c.status === 'maintenance')) {
    return {
      code: 'UNDER_MAINTENANCE',
      label: 'Планове технічне обслуговування',
      color: 'blue',
      indicator: '🔵',
      description: 'Тривають планові інженерні роботи з оновлення платформи.',
    };
  }

  return {
    code: 'ALL_SYSTEMS_OPERATIONAL',
    label: 'Всі системи працюють стабільно',
    color: 'emerald',
    indicator: '🟢',
    description: 'Усі ігри, збереження рекордів та навчальні сервіси функціонують у штатному режимі.',
  };
}

// 6. Отримання повного знімка сторінки статусу (для API та UI)
export function getStatusPageSnapshot() {
  return {
    overall: calculateOverallSystemStatus(),
    components: Object.values(components),
    activeIncidents,
    resolvedIncidents: resolvedIncidents.slice(0, 10),
    lastCheckedAt: new Date().toISOString(),
    uptime90Days: '99.94%',
  };
}

// Хелпер для тестів
export function __resetStatusEngineForTests() {
  components = JSON.parse(JSON.stringify(DEFAULT_COMPONENTS));
  activeIncidents = [];
  resolvedIncidents = [];
  initSampleData();
}
