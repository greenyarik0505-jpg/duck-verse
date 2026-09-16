import { CURRICULUM_REGISTRY, validateCurriculumRegistry, isLessonUnlocked } from '../lib/academy/registry.js';
import {
  createDefaultProgress,
  normalizeProgressState,
  getLessonProgressState,
  recordLessonCheckpoint,
  markLessonCompleted
} from '../lib/academy/progress.js';
import { LESSON_PROGRESS_STATES, CURRENT_CONTENT_VERSION, validateLessonContract } from '../lib/academy/types.js';

console.log('--- 🧪 ТЕСТУВАННЯ ACADEMY LESSON MODEL & PROGRESSION (SCRUM-44) ---');

// Тест 1: Валідація контракту всіх уроків реєстру
for (const lesson of CURRICULUM_REGISTRY) {
  const errors = validateLessonContract(lesson);
  if (errors.length > 0) {
    console.error(`❌ Тест 1 провалено для уроку '${lesson.id}':`, errors);
    process.exit(1);
  }
}
console.log(`✅ Тест 1 пройдено: Усі ${CURRICULUM_REGISTRY.length} уроків мають коректну схему контракту.`);

// Тест 2: Детермінований порядок рівнів уроків
const trackIds = [...new Set(CURRICULUM_REGISTRY.map((l) => l.trackId))];
for (const tid of trackIds) {
  const trackLessons = CURRICULUM_REGISTRY.filter((l) => l.trackId === tid);
  for (let i = 1; i < trackLessons.length; i++) {
    if (trackLessons[i].level < trackLessons[i - 1].level) {
      console.error(`❌ Тест 2 провалено: уроки в треку ${tid} мають недетермінований порядок рівнів.`);
      process.exit(1);
    }
  }
}
console.log('✅ Тест 2 пройдено: Уроки кожного треку відсортовані за зростанням рівня.');

// Тест 3: Правила розблокування (L0 -> L1)
let progress = createDefaultProgress('student-42');
const l0 = 'lesson-fe-l0-arch';
const l1 = 'lesson-fe-l1-auth';

// 3.1: L0 має бути available
const stateL0 = getLessonProgressState(l0, progress);
if (stateL0 === LESSON_PROGRESS_STATES.AVAILABLE) {
  console.log('✅ Тест 3.1 пройдено: Базовий урок L0 доступний для нового учня.');
} else {
  console.error('❌ Тест 3.1 провалено: очікувався AVAILABLE, отримано:', stateL0);
  process.exit(1);
}

// 3.2: L1 має бути locked
const stateL1 = getLessonProgressState(l1, progress);
if (stateL1 === LESSON_PROGRESS_STATES.LOCKED) {
  console.log('✅ Тест 3.2 пройдено: Урок L1 заблокований через невиконану передумову L0.');
} else {
  console.error('❌ Тест 3.2 провалено: очікувався LOCKED, отримано:', stateL1);
  process.exit(1);
}

// Тест 4: Фіксація чекпоінту та перехід у стан IN_PROGRESS
progress = recordLessonCheckpoint(progress, l0, 2, { note: 'Completed ADR step' });
if (progress.lessons[l0].state === LESSON_PROGRESS_STATES.IN_PROGRESS && progress.lessons[l0].checkpoint.step === 2) {
  console.log('✅ Тест 4 пройдено: Чекпоінт кроку 2 збережено, стан оновлено до IN_PROGRESS.');
} else {
  console.error('❌ Тест 4 провалено:', progress.lessons[l0]);
  process.exit(1);
}

// Тест 5: Завершення L0 відкриває L1
progress = markLessonCompleted(progress, l0);
const stateL0After = getLessonProgressState(l0, progress);
const stateL1After = getLessonProgressState(l1, progress);

if (stateL0After === LESSON_PROGRESS_STATES.COMPLETED && stateL1After === LESSON_PROGRESS_STATES.AVAILABLE) {
  console.log('✅ Тест 5 пройдено: L0 завершено, а залежний урок L1 успішно розблоковано.');
} else {
  console.error('❌ Тест 5 провалено:', { stateL0After, stateL1After });
  process.exit(1);
}

// Тест 6: Збереження прогресу після міграції версії
const legacyProgress = {
  version: '0.9.0',
  userId: 'legacy-user',
  completedLessonIds: [l0],
  lessons: {
    [l0]: { state: 'completed' }
  }
};
const migrated = normalizeProgressState(legacyProgress, 'legacy-user');
if (migrated.version === CURRENT_CONTENT_VERSION && migrated.completedLessonIds.includes(l0)) {
  console.log('✅ Тест 6 пройдено: Міграція версії контенту зберегла пройдений урок.');
} else {
  console.error('❌ Тест 6 провалено:', migrated);
  process.exit(1);
}

// Тест 7: Відновлення після пошкодження даних
const corruptedData = { completedLessonIds: null, lessons: 'bad-string', version: 123 };
const recovered = normalizeProgressState(corruptedData, 'corrupted-user');
if (Array.isArray(recovered.completedLessonIds) && typeof recovered.lessons === 'object' && recovered.version === CURRENT_CONTENT_VERSION) {
  console.log('✅ Тест 7 пройдено: Пошкоджений payload безпечно відновлено до робочого стану.');
} else {
  console.error('❌ Тест 7 провалено:', recovered);
  process.exit(1);
}

console.log('\n🎉 ВСІ АВТОМАТИЗОВАНІ ТЕСТИ ACADEMY LESSON MODEL УСПІШНО ПРОЙДЕНО!');
