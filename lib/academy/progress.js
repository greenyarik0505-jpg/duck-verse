/**
 * Duck Academy — Lesson Progression & Checkpoints Store (SCRUM-44)
 * Керує збереженням прогресу учнів, відновленням із чекпоінтів,
 * правилами розблокування за графом передумов та версіонуванням контенту.
 */

import { CURRICULUM_REGISTRY, isLessonUnlocked } from './registry.js';
import { LESSON_PROGRESS_STATES, CURRENT_CONTENT_VERSION } from './types.js';

const STORAGE_KEY_PREFIX = 'duckverse_academy_progress_';

/**
 * Створює чисту валідну модель прогресу для нового користувача
 */
export function createDefaultProgress(userId = 'guest') {
  return {
    version: CURRENT_CONTENT_VERSION,
    userId: String(userId || 'guest'),
    completedLessonIds: [],
    lessons: {}, // { [lessonId]: { state, checkpoint: { step, data, updatedAt }, submittedEvidence: [] } }
    updatedAt: new Date().toISOString()
  };
}

/**
 * Безпечно нормалізує і відновлює об'єкт прогресу у разі пошкодження або застарілої версії
 */
export function normalizeProgressState(raw, userId = 'guest') {
  const fallback = createDefaultProgress(userId);
  if (!raw || typeof raw !== 'object') return fallback;

  const validCompleted = Array.isArray(raw.completedLessonIds)
    ? raw.completedLessonIds.filter((id) => typeof id === 'string')
    : [];

  const normalizedLessons = {};
  if (raw.lessons && typeof raw.lessons === 'object') {
    for (const [lessonId, val] of Object.entries(raw.lessons)) {
      if (!val || typeof val !== 'object') continue;
      normalizedLessons[lessonId] = {
        state: Object.values(LESSON_PROGRESS_STATES).includes(val.state)
          ? val.state
          : (validCompleted.includes(lessonId) ? LESSON_PROGRESS_STATES.COMPLETED : LESSON_PROGRESS_STATES.AVAILABLE),
        checkpoint: val.checkpoint && typeof val.checkpoint === 'object'
          ? {
              step: Number.isInteger(val.checkpoint.step) ? val.checkpoint.step : 0,
              data: val.checkpoint.data || null,
              updatedAt: val.checkpoint.updatedAt || new Date().toISOString()
            }
          : { step: 0, data: null, updatedAt: new Date().toISOString() },
        submittedEvidence: Array.isArray(val.submittedEvidence) ? val.submittedEvidence : []
      };
    }
  }

  // Синхронізація: якщо урок є в completedLessonIds, його стан обов'язково COMPLETED
  for (const completedId of validCompleted) {
    if (!normalizedLessons[completedId]) {
      normalizedLessons[completedId] = {
        state: LESSON_PROGRESS_STATES.COMPLETED,
        checkpoint: { step: 100, data: null, updatedAt: new Date().toISOString() },
        submittedEvidence: []
      };
    } else {
      normalizedLessons[completedId].state = LESSON_PROGRESS_STATES.COMPLETED;
    }
  }

  return {
    version: CURRENT_CONTENT_VERSION,
    userId: String(raw.userId || userId || 'guest'),
    completedLessonIds: validCompleted,
    lessons: normalizedLessons,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Визначає актуальний стан уроку для учня з урахуванням графу передумов
 */
export function getLessonProgressState(lessonId, progress) {
  const normalized = normalizeProgressState(progress, progress?.userId);
  if (normalized.completedLessonIds.includes(lessonId)) {
    return LESSON_PROGRESS_STATES.COMPLETED;
  }

  const lesson = CURRICULUM_REGISTRY.find((l) => l.id === lessonId);
  if (!lesson) return LESSON_PROGRESS_STATES.LOCKED;

  const isUnlocked = isLessonUnlocked(lessonId, normalized.completedLessonIds);
  if (!isUnlocked) {
    return LESSON_PROGRESS_STATES.LOCKED;
  }

  const record = normalized.lessons[lessonId];
  if (!record || record.state === LESSON_PROGRESS_STATES.LOCKED || record.state === LESSON_PROGRESS_STATES.AVAILABLE) {
    return LESSON_PROGRESS_STATES.AVAILABLE;
  }

  return record.state;
}

/**
 * Оновлює чекпоінт уроку (початок уроку або збереження проміжного кроку)
 */
export function recordLessonCheckpoint(progress, lessonId, step = 0, stepData = null) {
  const current = normalizeProgressState(progress, progress?.userId);
  const state = getLessonProgressState(lessonId, current);

  if (state === LESSON_PROGRESS_STATES.LOCKED) {
    throw new Error(`Урок '${lessonId}' заблокований через невиконані передумови`);
  }

  const existing = current.lessons[lessonId] || {
    state: LESSON_PROGRESS_STATES.IN_PROGRESS,
    checkpoint: { step: 0, data: null, updatedAt: new Date().toISOString() },
    submittedEvidence: []
  };

  current.lessons[lessonId] = {
    ...existing,
    state: existing.state === LESSON_PROGRESS_STATES.COMPLETED
      ? LESSON_PROGRESS_STATES.COMPLETED
      : LESSON_PROGRESS_STATES.IN_PROGRESS,
    checkpoint: {
      step: Math.max(0, parseInt(step, 10) || 0),
      data: stepData,
      updatedAt: new Date().toISOString()
    }
  };

  current.updatedAt = new Date().toISOString();
  return current;
}

/**
 * Фіксує виконання уроку та відкриває наступні за графом передумов
 */
export function markLessonCompleted(progress, lessonId) {
  const current = normalizeProgressState(progress, progress?.userId);

  if (!current.completedLessonIds.includes(lessonId)) {
    current.completedLessonIds.push(lessonId);
  }

  const existing = current.lessons[lessonId] || {
    checkpoint: { step: 100, data: null, updatedAt: new Date().toISOString() },
    submittedEvidence: []
  };

  current.lessons[lessonId] = {
    ...existing,
    state: LESSON_PROGRESS_STATES.COMPLETED,
    checkpoint: {
      step: 100,
      data: { completed: true },
      updatedAt: new Date().toISOString()
    }
  };

  current.updatedAt = new Date().toISOString();
  return current;
}

/**
 * Локальне завантаження для клієнтського середовища
 */
export function loadClientProgress(userId = 'guest') {
  if (typeof window === 'undefined') return createDefaultProgress(userId);
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
    if (!raw) return createDefaultProgress(userId);
    return normalizeProgressState(JSON.parse(raw), userId);
  } catch (e) {
    console.warn('[Academy Progress] Відновлено безпечний стан після помилки читання:', e);
    return createDefaultProgress(userId);
  }
}

/**
 * Локальне збереження для клієнтського середовища
 */
export function saveClientProgress(userId = 'guest', progress) {
  if (typeof window === 'undefined') return;
  try {
    const normalized = normalizeProgressState(progress, userId);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(normalized));
  } catch (e) {
    console.warn('[Academy Progress] Помилка запису у localStorage:', e);
  }
}
