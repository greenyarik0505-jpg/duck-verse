import { CURRICULUM_REGISTRY, validateCurriculumRegistry, isLessonUnlocked } from '../lib/academy/registry.js';
import { validateLessonContract, EVIDENCE_TYPES } from '../lib/academy/types.js';

console.log('--- 🧪 ТЕСТУВАННЯ CURRICULUM REGISTRY (SCRUM-56) ---');

// Тест 1: Валідний реєстр проходить перевірку
try {
  const isValid = validateCurriculumRegistry();
  if (isValid) {
    console.log('✅ Тест 1 пройдено: Офіційний реєстр валідний (DAG без циклів, контракти дотримані).');
  }
} catch (e) {
  console.error('❌ Тест 1 провалено:', e.message);
  process.exit(1);
}

// Тест 2: Перевірка контракту уроку (валідація відсутності обов’язкових полів)
const badLesson = { id: 'bad-1', level: 0 };
const contractErrors = validateLessonContract(badLesson);
if (contractErrors.length > 0) {
  console.log('✅ Тест 2 пройдено: Контракт відхилив невалідний урок, знайдено помилок:', contractErrors.length);
} else {
  console.error('❌ Тест 2 провалено: Невалідний урок не повинен проходити валідацію.');
  process.exit(1);
}

// Тест 3: Перевірка розблокування уроків за prerequisites
const l0Id = 'lesson-fe-l0-arch';
const l1Id = 'lesson-fe-l1-auth';

if (isLessonUnlocked(l0Id, [])) {
  console.log('✅ Тест 3.1 пройдено: Урок L0 (без передумов) відкритий за замовчуванням.');
} else {
  console.error('❌ Тест 3.1 провалено.');
  process.exit(1);
}

if (!isLessonUnlocked(l1Id, [])) {
  console.log('✅ Тест 3.2 пройдено: Урок L1 заблокований, доки учень не пройшов L0.');
} else {
  console.error('❌ Тест 3.2 провалено: Урок L1 має бути заблокований.');
  process.exit(1);
}

if (isLessonUnlocked(l1Id, [l0Id])) {
  console.log('✅ Тест 3.3 пройдено: Урок L1 розблоковано після проходження L0.');
} else {
  console.error('❌ Тест 3.3 провалено.');
  process.exit(1);
}

console.log('\n🎉 ВСІ АВТОМАТИЗОВАНІ ТЕСТИ CURRICULUM REGISTRY УСПІШНО ПРОЙДЕНО!');
