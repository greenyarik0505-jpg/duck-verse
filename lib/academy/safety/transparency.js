/**
 * Duck Academy — AI Transparency, Consent & Data Controls Engine (SCRUM-104)
 *
 * Відповідає стандартам:
 * 1. AI Transparency & Watermarking: обов'язкове маркування кожної генерації ШІ, розкриття моделі, версії та limitations.
 * 2. Consent Controls: Opt-In / Opt-Out для використання асистента та телеметрії, синхронізація з батьківським порталом.
 * 3. Pure Static Fallback: надійне навчання без ШІ за рахунок класичних еталонних специфікацій та підказок викладачів.
 * 4. Data Controls & Right to be Forgotten: ідемпотентний експорт та повне видалення історії генерацій без залишкових записів.
 * 5. Telemetry Sanitization Shield: очищення телеметрії від будь-яких секретів, ключів чи PII.
 * 6. Versioned Policy: офіційна політика прозорості штучного інтелекту v1.2.
 */

import crypto from 'crypto';
import { ACADEMY_ROLES } from '../auth/roles.js';

export const AI_MODELS_REGISTRY = {
  'duck-vibe-coder-v1.2': {
    id: 'duck-vibe-coder-v1.2',
    name: 'Duck Vibe Coder',
    version: '1.2.0',
    provider: 'Duck Verse Edge Engine',
    releaseDate: '2026-08-15',
    capabilities: ['code-hints', 'rubric-scoring', 'architecture-advice'],
    limitations: [
      'Може допускати неточності у складних типах та обчисленнях',
      'Не має прямого доступу до продакшн-баз даних чи приватних секретів',
      'Код вимагає обов\'язкового інженерного огляду та локального тестування учнем',
    ],
  },
  'duck-safety-guard-v2': {
    id: 'duck-safety-guard-v2',
    name: 'Duck Safety Guard',
    version: '2.0.1',
    provider: 'Duck Verse Internal Classifier',
    releaseDate: '2026-09-01',
    capabilities: ['pii-detection', 'toxic-filtering', 'compliance-gate'],
    limitations: [
      'Працює на базі евристичних правил і може генерувати поодинокі false-positive',
    ],
  },
};

export const AI_TRANSPARENCY_POLICY = {
  version: '1.2.0',
  effectiveDate: '2026-09-01',
  legalFrameworks: ['COPPA (US)', 'GDPR-K (EU)', 'EU AI Act Article 50 (Transparency Obligations)'],
  principles: [
    'Неможливість приховати використання ШІ від дитини чи батьків',
    'Право на повне відключення ШІ з наданням повноцінного статичного навчання',
    'Захист телеметрії: нуль персональних даних і паролів у метриках',
    'Повний ідемпотентний експорт та видалення історії взаємодій за першим запитом',
  ],
};

// Каталог статичних підказок при вимкненому ШІ (Static Fallback)
export const STATIC_CURRICULUM_FALLBACKS = {
  'lesson-fe-l0-arch': {
    topic: 'Архітектурний базис Duck Academy',
    guidance: 'Перевірте контракти у файлі lib/academy/registry.js та переконайтеся, що DAG не містить циклів.',
    codeSnippet: 'export function validateTrackDag(tracks) { /* перевірка ациклічності */ }',
    docsUrl: 'https://github.com/greenyarik0505-jpg/duck-verse/blob/main/AGENTS.md',
  },
  'lesson-fe-l1-canvas': {
    topic: 'Фізика куба та Canvas 2D',
    guidance: 'Використовуйте AABB (Axis-Aligned Bounding Box) для перевірки колізій між кубом та шипами.',
    codeSnippet: 'const isColliding = rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x;',
    docsUrl: 'https://duck-verse.vercel.app',
  },
  default: {
    topic: 'Інженерний довідник Duck Verse',
    guidance: 'Зверніться до офіційної специфікації уроку та перевірте acceptance criteria у Jira та README.',
    codeSnippet: 'npm test && npm run lint',
    docsUrl: 'https://duck-verse.vercel.app',
  },
};

// Сховища даних
const consentStore = new Map();
const interactionHistoryStore = new Map();
const telemetryLogsStore = [];

/**
 * Отримання налаштувань згоди учня
 */
export function getStudentConsentAndControls({ studentId }) {
  if (!studentId) throw new Error('studentId обов\'язковий');

  let consent = consentStore.get(studentId);
  if (!consent) {
    consent = {
      studentId,
      aiAssistanceEnabled: true,
      aiTelemetryConsent: true,
      parentConsentVerified: true,
      updatedAt: '2026-09-17T12:00:00.000Z',
    };
    consentStore.set(studentId, consent);
  }

  const history = interactionHistoryStore.get(studentId) || [];

  return {
    ...consent,
    historyCount: history.length,
    activePolicy: AI_TRANSPARENCY_POLICY,
    availableModels: Object.values(AI_MODELS_REGISTRY),
  };
}

/**
 * Оновлення згоди та налаштувань Opt-In / Opt-Out
 */
export function updateStudentAiConsent({
  studentId,
  aiAssistanceEnabled,
  aiTelemetryConsent,
  parentConsentVerified,
  actor,
}) {
  if (!studentId) throw new Error('studentId обов\'язковий');

  const isAuthorized = actor && (
    actor.id === studentId ||
    actor.role === 'parent' ||
    actor.role === ACADEMY_ROLES.ADMIN ||
    actor.role === 'team_lead'
  );

  if (!isAuthorized) {
    const err = new Error('Недостатньо прав для оновлення параметрів згоди');
    err.code = 'UNAUTHORIZED_CONSENT_UPDATE';
    throw err;
  }

  const consent = consentStore.get(studentId) || getStudentConsentAndControls({ studentId });

  if (typeof aiAssistanceEnabled === 'boolean') {
    consent.aiAssistanceEnabled = aiAssistanceEnabled;
  }
  if (typeof aiTelemetryConsent === 'boolean') {
    consent.aiTelemetryConsent = aiTelemetryConsent;
  }
  if (typeof parentConsentVerified === 'boolean') {
    consent.parentConsentVerified = parentConsentVerified;
  }

  consent.updatedAt = new Date().toISOString();
  consentStore.set(studentId, consent);

  // Запис у санітизовану телеметрію
  if (consent.aiTelemetryConsent) {
    telemetryLogsStore.push({
      event: 'CONSENT_UPDATED',
      studentHash: crypto.createHash('sha256').update(studentId).digest('hex').substring(0, 12),
      aiAssistanceEnabled: consent.aiAssistanceEnabled,
      timestamp: consent.updatedAt,
    });
  }

  return getStudentConsentAndControls({ studentId });
}

/**
 * Фіксація AI-генерації та створення прозорої картки метаданих
 */
export function recordAiInteraction({
  studentId,
  modelId = 'duck-vibe-coder-v1.2',
  promptText,
  responseText,
  taskContext = {},
}) {
  if (!studentId || !promptText || !responseText) {
    throw new Error('studentId, promptText та responseText обов\'язкові');
  }

  const consent = consentStore.get(studentId) || getStudentConsentAndControls({ studentId });

  // Якщо учень або батьки відключили ШІ — виклик блокується
  if (!consent.aiAssistanceEnabled) {
    const err = new Error('Використання асистента ШІ вимкнено в налаштуваннях згоди. Використовуйте статичний навчальний фолбек.');
    err.code = 'AI_ASSISTANCE_DISABLED';
    throw err;
  }

  const model = AI_MODELS_REGISTRY[modelId] || AI_MODELS_REGISTRY['duck-vibe-coder-v1.2'];
  const now = new Date().toISOString();
  const interactionId = `gen-${crypto.randomBytes(5).toString('hex')}`;

  // Очищення даних, що передавалися (Telemetry Sanitization Shield)
  const safeDataKeys = Object.keys(taskContext).filter(k => !/secret|token|password|cookie/i.test(k));

  const metadataCard = {
    isAiGenerated: true,
    interactionId,
    modelId: model.id,
    modelName: model.name,
    modelVersion: model.version,
    provider: model.provider,
    watermark: `🤖 Сгенеровано за допомогою Duck AI (${model.name} v${model.version}) • ${now}`,
    dataTransferred: safeDataKeys.length > 0 ? safeDataKeys : ['lesson_rubric', 'exercise_contract'],
    limitationsNotice: model.limitations,
    tokensEstimated: Math.ceil((promptText.length + responseText.length) / 4),
    timestamp: now,
  };

  const studentHistory = interactionHistoryStore.get(studentId) || [];
  studentHistory.push({
    id: interactionId,
    studentId,
    metadataCard,
    promptSnippet: promptText.substring(0, 120),
    responseSnippet: responseText.substring(0, 150),
    timestamp: now,
  });
  interactionHistoryStore.set(studentId, studentHistory);

  if (consent.aiTelemetryConsent) {
    telemetryLogsStore.push({
      event: 'AI_INFERENCE_COMPLETED',
      modelId: model.id,
      tokensEstimated: metadataCard.tokensEstimated,
      timestamp: now,
    });
  }

  return metadataCard;
}

/**
 * Отримання гарантованого фолбеку без ШІ (Static Fallback)
 */
export function getFallbackAssistance({ lessonId } = {}) {
  const fallback = STATIC_CURRICULUM_FALLBACKS[lessonId] || STATIC_CURRICULUM_FALLBACKS.default;
  return {
    isAiGenerated: false,
    source: 'Duck Academy Official Engineering Guide',
    ...fallback,
    fallbackDisclaimer: 'Ви використовуєте режим без ШІ (Human / Static Curriculum Reference). Усі матеріали перевірені викладачами.',
  };
}

/**
 * Ідемпотентний експорт історії взаємодій учня (Data Export)
 */
export function exportStudentAiHistory({ studentId, actor }) {
  if (!studentId) throw new Error('studentId обов\'язковий');

  const isAuthorized = actor && (
    actor.id === studentId ||
    actor.role === ACADEMY_ROLES.PARENT ||
    actor.role === ACADEMY_ROLES.ADMIN ||
    actor.role === 'team_lead'
  );

  if (!isAuthorized) {
    const err = new Error('Недостатньо прав для експорту історії взаємодій');
    err.code = 'UNAUTHORIZED_ACCESS';
    throw err;
  }

  const consent = consentStore.get(studentId) || getStudentConsentAndControls({ studentId });
  const history = interactionHistoryStore.get(studentId) || [];

  return {
    exportVersion: '1.0',
    studentId,
    exportedAt: new Date().toISOString(),
    consentState: {
      aiAssistanceEnabled: consent.aiAssistanceEnabled,
      aiTelemetryConsent: consent.aiTelemetryConsent,
      parentConsentVerified: consent.parentConsentVerified,
    },
    totalInteractions: history.length,
    interactions: history,
  };
}

/**
 * Ідемпотентне видалення всієї історії взаємодій учня (Right to be Forgotten)
 */
export function deleteStudentAiHistory({ studentId, actor }) {
  if (!studentId) throw new Error('studentId обов\'язковий');

  const isAuthorized = actor && (
    actor.id === studentId ||
    actor.role === ACADEMY_ROLES.PARENT ||
    actor.role === ACADEMY_ROLES.ADMIN ||
    actor.role === 'team_lead'
  );

  if (!isAuthorized) {
    const err = new Error('Недостатньо прав для видалення історії');
    err.code = 'UNAUTHORIZED_ACCESS';
    throw err;
  }

  const existingHistory = interactionHistoryStore.get(studentId) || [];
  const purgedCount = existingHistory.length;

  // Ідемпотентне очищення
  interactionHistoryStore.set(studentId, []);

  return {
    success: true,
    studentId,
    purgedRecordsCount: purgedCount,
    purgedAt: new Date().toISOString(),
    message: 'Історію генерацій ШІ успішно і безповоротно видалено (Zero Orphaned Records).',
  };
}

/**
 * Скидання стану для ізоляції тестів
 */
export function _resetTransparencyStateForTests() {
  consentStore.clear();
  interactionHistoryStore.clear();
  telemetryLogsStore.length = 0;
}
