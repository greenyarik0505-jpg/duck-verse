import assert from 'assert';
import {
  COMPETENCY_AREAS,
  determineLevel,
  calculateCompetencyMatrix,
  performGapAnalysis,
  getStudentSkillProfile,
  exportSkillAnalytics,
  deleteStudentSkillAnalytics,
} from '../lib/academy/skills/matrix.js';
import { ACADEMY_ROLES } from '../lib/academy/auth/roles.js';

console.log('--- 📊 ТЕСТУВАННЯ SKILL ANALYTICS & COMPETENCY MATRIX (SCRUM-82) ---');

// Тест 1: 7 інженерних компетенцій присутні
console.log('1. Перевірка 7 інженерних компетенцій...');
const areaKeys = Object.keys(COMPETENCY_AREAS);
assert.strictEqual(areaKeys.length, 7, 'Повинно бути рівно 7 компетенцій');
const areaIds = Object.values(COMPETENCY_AREAS).map(a => a.id);
assert.deepStrictEqual(areaIds, [
  'git',
  'ui',
  'api',
  'testing',
  'security',
  'architecture',
  'teamwork'
]);
for (const comp of Object.values(COMPETENCY_AREAS)) {
  assert(comp.name, `Компетенція ${comp.id} повинна мати name`);
  assert(comp.icon, `Компетенція ${comp.id} повинна мати icon`);
  assert(comp.desc, `Компетенція ${comp.id} повинна мати desc`);
  assert(Array.isArray(comp.relevantLessons), `Компетенція ${comp.id} повинна мати relevantLessons`);
}
console.log('✅ Всі 7 обов\'язкових компетенцій визначено та валідовано.');

// Тест 2: Рівні майстерності від L0 до L4
console.log('2. Перевірка рівнів майстерності L0-L4...');
assert.strictEqual(determineLevel(0).level, 'L0');
assert.strictEqual(determineLevel(25).level, 'L1');
assert.strictEqual(determineLevel(50).level, 'L2');
assert.strictEqual(determineLevel(70).level, 'L3');
assert.strictEqual(determineLevel(90).level, 'L4');
console.log('✅ Рівні майстерності L0-L4 відповідають інженерному стандарту.');

// Тест 3: Захист від експлойту одного комміту/джерела (Multi-evidence & capped weight)
console.log('3. Захист від накрутки одиничним коммітом/PR...');
const singleSourceMatrix = calculateCompetencyMatrix({
  completedLessonIds: [],
  verifiedPrs: [
    { id: 'PR-1', number: 1, title: 'Fix bug', skills: ['git'] },
    { id: 'PR-2', number: 2, title: 'Add feature', skills: ['git'] },
    { id: 'PR-3', number: 3, title: 'Refactor', skills: ['git'] },
    { id: 'PR-4', number: 4, title: 'Hotfix', skills: ['git'] },
  ],
  mentorReviews: []
});
const gitComp = singleSourceMatrix.git;
// Максимальний внесок з PR обмежений MAX_PER_SOURCE = 40 балів
assert(gitComp.score <= 40, `Одне джерело PR не може перевищити 40 балів (фактично: ${gitComp.score})`);
assert.strictEqual(gitComp.confidence, 'low', 'Без різнорідних джерел confidence має бути low');
assert.strictEqual(gitComp.level, 'L1', 'З одним джерелом неможливо отримати L2, L3 або L4');
console.log(`✅ Захист активний: single source score = ${gitComp.score}%, confidence = ${gitComp.confidence}`);

// Тест 4: Багатофакторні свідчення (Уроки + PR + Менторське рев'ю)
console.log('4. Розрахунок з різнорідними свідченнями...');
const multiSourceMatrix = calculateCompetencyMatrix({
  completedLessonIds: ['lesson-fe-l0-arch', 'lesson-fe-l2-pr', 'lesson-fe-l4-capstone'],
  verifiedPrs: [
    { id: 'PR-10', number: 10, title: 'Implement Security & Matrix', skills: ['git', 'security', 'testing'] }
  ],
  mentorReviews: [
    {
      id: 'rev-1',
      rubricScores: { git: 5, security: 5, testing: 5 },
      feedback: 'Відмінна реалізація стандартів безпеки'
    }
  ]
});
const secComp = multiSourceMatrix.security;
assert(secComp.score >= 50, `Багатофакторна оцінка повинна підвищувати бал (фактично: ${secComp.score})`);
assert(['medium', 'high'].includes(secComp.confidence), 'Різнорідні джерела повинні підвищувати confidence');
assert(secComp.evidences.length >= 3, 'Повинно бути щонайменше 3 свідчення різного типу');
console.log(`✅ Багатофакторна оцінка: security score = ${secComp.score}%, confidence = ${secComp.confidence}`);

// Тест 5: Gap Analysis та персональна рекомендація наступного уроку
console.log('5. Аналіз розриву компетенцій (Gap Analysis)...');
const gapAnalysis = performGapAnalysis(multiSourceMatrix, ['lesson-fe-l0-arch']);
assert(gapAnalysis.primaryGap !== null, 'Повинен бути знайдений primary gap');
assert(gapAnalysis.overallAverageScore !== undefined, 'Повинен бути середній бал');
assert(gapAnalysis.recommendedLesson !== null, 'Повинен рекомендувати урок з програми');
console.log(`✅ Рекомендовано урок: [${gapAnalysis.recommendedLesson.jiraKey}] ${gapAnalysis.recommendedLesson.title} для покращення «${gapAnalysis.primaryGap.name}»`);

// Тест 6: Збереження та отримання профілю студента
console.log('6. Збереження та читання профілю...');
const testStudentId = 'student-scrum-82';
const profile = getStudentSkillProfile(testStudentId, {
  completedLessonIds: ['lesson-fe-l0-arch'],
  verifiedPrs: [{ id: 'PR-1', number: 1, skills: ['ui'] }],
  mentorReviews: []
});
assert.strictEqual(profile.studentId, testStudentId);
assert(profile.matrix.ui !== undefined);
assert(profile.gapAnalysis !== undefined);
console.log('✅ Профіль студента коректно збережено та згенеровано.');

// Тест 7: Експорт даних та IDOR захист (GDPR / Privacy)
console.log('7. Експорт даних та перевірка IDOR захисту...');
const ownerUser = { id: testStudentId, role: ACADEMY_ROLES.CHILD };
const strangerUser = { id: 'stranger-danger', role: ACADEMY_ROLES.CHILD };
const adminUser = { id: 'admin-lead', role: ACADEMY_ROLES.ADMIN };

// Власник може експортувати
const exported = exportSkillAnalytics(testStudentId, ownerUser);
assert.strictEqual(exported.profile.studentId, testStudentId);
assert(exported.retentionNotice, 'Повинно бути повідомлення про політику зберігання даних');

// Сторонній користувач блокується (IDOR захист)
assert.throws(() => {
  exportSkillAnalytics(testStudentId, strangerUser);
}, /Доступ заборонено/);
console.log('✅ IDOR блокування спрацювало: чужі дані недоступні.');

// Тест 8: Видалення даних (Right to be Forgotten) та захист від стороннього видалення
console.log('8. Видалення аналітики учня...');
// Сторонній не може видалити
assert.throws(() => {
  deleteStudentSkillAnalytics(testStudentId, strangerUser);
}, /Доступ заборонено/);

// Власник може видалити
const deleteRes = deleteStudentSkillAnalytics(testStudentId, ownerUser);
assert.strictEqual(deleteRes.success, true);
assert.strictEqual(deleteRes.deleted, true);

// Повторне видалення повідомляє deleted: false
const secondDelete = deleteStudentSkillAnalytics(testStudentId, adminUser);
assert.strictEqual(secondDelete.deleted, false);
console.log('✅ Політику видалення даних (Right to be Forgotten) успішно протестовано.');

console.log('🎉 ВСІ 8 ТЕСТІВ SKILL ANALYTICS ТА COMPETENCY MATRIX (SCRUM-82) УСПІШНО ПРОЙДЕНО!');
