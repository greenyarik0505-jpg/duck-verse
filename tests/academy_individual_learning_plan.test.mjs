import assert from 'assert';
import {
  AVAILABLE_GOALS,
  ELECTIVES_CATALOG,
  getStudentLearningPlan,
  updateLearningPlanGoals,
  updateSelectedElectives,
  requestPrerequisiteException,
  reviewPrerequisiteException,
  calculateAdaptiveNextStep,
  _resetLearningPlanStateForTests,
} from '../lib/academy/learning_plan/plan.js';
import { ACADEMY_ROLES } from '../lib/academy/auth/roles.js';

console.log('--- 🎯 ТЕСТУВАННЯ INDIVIDUAL LEARNING PLAN & ADAPTIVE PATH (SCRUM-100) ---');

_resetLearningPlanStateForTests();

const testStudent = { id: 'student_eva_01', username: 'Eva Coder', role: ACADEMY_ROLES.STUDENT };
const testMentor = { id: 'mentor_kirill', username: 'Кирил Пушкарук', role: ACADEMY_ROLES.MENTOR };
const unauthorizedUser = { id: 'guest_user_99', username: 'Guest', role: ACADEMY_ROLES.GUEST };

// Тест 1: Ініціалізація дефолтного плану та перевірка v1
console.log('1. Тест ініціалізації дефолтного плану...');
const initialPlan = getStudentLearningPlan({ studentId: testStudent.id });
assert.strictEqual(initialPlan.studentId, testStudent.id);
assert.strictEqual(initialPlan.version, 1);
assert.strictEqual(initialPlan.targetGoal, 'fe-architect');
assert.strictEqual(initialPlan.auditTrail.length, 1);
assert.strictEqual(initialPlan.auditTrail[0].changeType, 'PLAN_INITIALIZED');
console.log(`✅ План успішно створено: v${initialPlan.version}, ціль: ${initialPlan.targetGoal}`);

// Тест 2: Оновлення цілей та тижневого навантаження (інкремент версії до v2)
console.log('2. Тест оновлення цілей та навантаження...');
const updatedGoalsPlan = updateLearningPlanGoals({
  studentId: testStudent.id,
  targetGoal: 'audio-dsp',
  targetWeeklyHours: 12,
  actor: testStudent,
});
assert.strictEqual(updatedGoalsPlan.targetGoal, 'audio-dsp');
assert.strictEqual(updatedGoalsPlan.targetWeeklyHours, 12);
assert.strictEqual(updatedGoalsPlan.version, 2);
assert(updatedGoalsPlan.auditTrail.some(a => a.changeType === 'GOALS_UPDATED'));
console.log(`✅ Цілі оновлено, створено ревізію v${updatedGoalsPlan.version}`);

// Тест 3: Вибір вибіркового курсу з дотриманими передумовами
console.log('3. Тест вибору курсу з виконаними prerequisites...');
// Курс elec-vibe-engineering потребує лише lesson-fe-l0-arch
const planWithElective = updateSelectedElectives({
  studentId: testStudent.id,
  electiveIds: ['elec-vibe-engineering'],
  completedLessons: ['lesson-fe-l0-arch'],
  actor: testStudent,
});
assert(planWithElective.selectedElectives.includes('elec-vibe-engineering'));
assert.strictEqual(planWithElective.version, 3);
console.log('✅ Вибірковий курс успішно додано до плану з валідацією prerequisites');

// Тест 4: Захист передумов — блокування курсу без prerequisites
console.log('4. Тест блокування курсу з невиконаними prerequisites...');
// elec-canvas-shaders вимагає і lesson-fe-l0-arch, і lesson-fe-l1-canvas
assert.throws(
  () => {
    updateSelectedElectives({
      studentId: testStudent.id,
      electiveIds: ['elec-vibe-engineering', 'elec-canvas-shaders'],
      completedLessons: ['lesson-fe-l0-arch'], // немає lesson-fe-l1-canvas
      actor: testStudent,
    });
  },
  (err) => {
    assert.strictEqual(err.code, 'PREREQUISITES_NOT_MET');
    assert(err.missingPrerequisites.includes('lesson-fe-l1-canvas'));
    return true;
  }
);
console.log('✅ Блокування спрацювало: PREREQUISITES_NOT_MET');

// Тест 5: Подання запиту на виняток щодо prerequisites
console.log('5. Тест подання запиту на обхід prerequisites...');
// Занадто короткий опис має бути відхилено
assert.throws(
  () => {
    requestPrerequisiteException({
      studentId: testStudent.id,
      electiveId: 'elec-canvas-shaders',
      explanation: 'Хочу курс', // < 15 символів
      actor: testStudent,
    });
  },
  /щонайменше 15 символів/
);

// Валідний запит
const exception = requestPrerequisiteException({
  studentId: testStudent.id,
  electiveId: 'elec-canvas-shaders',
  explanation: 'Маю 2 роки комерційного досвіду з шейдерами WebGL та GLSL поза платформою.',
  actor: testStudent,
});
assert(exception.id.startsWith('exc-'));
assert.strictEqual(exception.status, 'PENDING');
assert.strictEqual(exception.electiveId, 'elec-canvas-shaders');
console.log(`✅ Запит на виняток подано: ${exception.id}, статус: ${exception.status}`);

// Тест 6: Захист прав рецензування (тільки ментор/адмін)
console.log('6. Тест неавторизованого рецензування...');
assert.throws(
  () => {
    reviewPrerequisiteException({
      exceptionId: exception.id,
      decision: 'APPROVED',
      mentorUser: unauthorizedUser,
    });
  },
  (err) => {
    assert.strictEqual(err.code, 'UNAUTHORIZED_REVIEW');
    return true;
  }
);
console.log('✅ Неавторизований перегляд успішно заблоковано (UNAUTHORIZED_REVIEW)');

// Тест 7: Схвалення винятку ментором та автоматичний допуск
console.log('7. Тест схвалення винятку ментором...');
const reviewResult = reviewPrerequisiteException({
  exceptionId: exception.id,
  decision: 'APPROVED',
  reviewerNotes: 'Портфоліо перевірено, допуск підтверджено.',
  mentorUser: testMentor,
});
assert.strictEqual(reviewResult.success, true);
assert.strictEqual(reviewResult.exception.status, 'APPROVED');

const planAfterApproval = getStudentLearningPlan({ studentId: testStudent.id, completedLessons: ['lesson-fe-l0-arch'] });
assert(planAfterApproval.approvedExceptions.includes('elec-canvas-shaders'));
assert(planAfterApproval.selectedElectives.includes('elec-canvas-shaders'));
console.log('✅ Виняток схвалено ментором, курс додано до плану учня!');

// Тест 8: Адаптивний розрахунок рекомендованого наступного кроку
console.log('8. Тест адаптивної рекомендації наступного кроку...');
// Коли обов'язковий урок не пройдено
const step1 = calculateAdaptiveNextStep({
  studentId: testStudent.id,
  completedLessons: ['lesson-fe-l0-arch'],
});
assert.strictEqual(step1.type, 'CORE');
assert.strictEqual(step1.moduleId, 'lesson-fe-l1-canvas');
assert.strictEqual(step1.isMandatory, true);
console.log(`✅ Адаптивний крок 1 (Core): ${step1.title}`);

// Коли всі core уроки пройдені
const step2 = calculateAdaptiveNextStep({
  studentId: testStudent.id,
  completedLessons: ['lesson-fe-l0-arch', 'lesson-fe-l1-canvas'],
});
assert.strictEqual(step2.type, 'ELECTIVE');
console.log(`✅ Адаптивний крок 2 (Elective): ${step2.title}`);

console.log('--- 🚀 ВСІ ТЕСТИ INDIVIDUAL LEARNING PLAN & ADAPTIVE PATH (SCRUM-100) ПРОЙДЕНО УСПІШНО! ---');
