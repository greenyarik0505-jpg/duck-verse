import assert from 'assert';
import {
  RUBRIC_DIMENSIONS,
  PASSING_SCORE,
  calculateRubricScore,
  createReview,
  getStudentReviews,
  FEEDBACK_SEVERITIES,
} from '../lib/academy/mentor/rubric.js';

console.log('--- 🎓 ТЕСТУВАННЯ МЕНТОРСЬКОЇ РУБРИКИ ТА КОД-РЕВ’Ю (SCRUM-57) ---');

// 1. Перевірка структури рубрики (6 обов'язкових вимірів)
console.log('1. Тест вимірів рубрики...');
assert.strictEqual(RUBRIC_DIMENSIONS.length, 6, 'Рубрика повинна містити рівно 6 вимірів');
const dimensionIds = RUBRIC_DIMENSIONS.map((d) => d.id);
assert.deepStrictEqual(dimensionIds, [
  'correctness',
  'readability',
  'tests',
  'security',
  'performance',
  'teamwork',
]);
console.log('✅ Всі 6 вимірів стандартизованої рубрики присутні');

// 2. Тест розрахунку балів та прохідного порогу
console.log('2. Тест розрахунку балів...');
const passingScores = {
  correctness: 5,
  readability: 4,
  tests: 5,
  security: 5,
  performance: 4,
  teamwork: 4,
}; // Total: 27 / 30

const passResult = calculateRubricScore(passingScores);
assert.strictEqual(passResult.totalScore, 27);
assert.strictEqual(passResult.passed, true);
console.log('✅ Оцінка 27/30 перевищує поріг (24) і зараховує урок');

const failingScores = {
  correctness: 3,
  readability: 3,
  tests: 2,
  security: 4,
  performance: 3,
  teamwork: 3,
}; // Total: 18 / 30

const failResult = calculateRubricScore(failingScores);
assert.strictEqual(failResult.totalScore, 18);
assert.strictEqual(failResult.passed, false);
console.log('✅ Оцінка 18/30 менша за поріг (24) і відправляє на доопрацювання');

// 3. Тест створення імутабельного рев'ю
console.log('3. Тест імутабельності записів рев’ю...');
const review = createReview({
  mentorId: 'user_mentor_alex',
  studentId: 'user_student_yarik',
  lessonId: 'lesson-fe-l1-auth',
  scores: passingScores,
  feedback: 'Відмінна реалізація автентифікації та захисту сесій!',
  severity: FEEDBACK_SEVERITIES.SUGGESTION,
  nextAction: 'Переходити до інтеграції Jira/GitHub (SCRUM-53)',
});

assert.ok(review.id.startsWith('rev_'));
assert.strictEqual(review.passed, true);
assert.strictEqual(Object.isFrozen(review), true, 'Об’єкт рев’ю має бути заморожений (immutable)');

// Спроба змінити оцінку в існуючому рев'ю
try {
  review.totalScore = 0;
} catch (e) {
  // У strict mode викликає помилку
}
assert.strictEqual(review.totalScore, 27, 'Оцінка в замороженому об’єкті не може бути змінена');

// Перевірка зчитування історії учня
const studentHistory = getStudentReviews('user_student_yarik');
assert.strictEqual(studentHistory.length, 1);
assert.strictEqual(studentHistory[0].studentId, 'user_student_yarik');
console.log('✅ Імутабельність історії рев’ю та цілісність аудиту підтверджена');

console.log('\n🎉 ВСІ АВТОМАТИЗОВАНІ ТЕСТИ МЕНТОРСЬКОЇ РУБРИКИ (SCRUM-57) УСПІШНО ПРОЙДЕНО!');
