import assert from 'assert';
import {
  CONTENT_STATES,
  validateQualityGates,
  createDraft,
  submitForReview,
  approveDraft,
  publishContent,
  rollbackLesson,
  deprecateLesson,
  getStudentVisibleCurriculum,
  getLessonContentDetails,
  getFullPublishAuditLog,
  calculateContentDiff,
  findAffectedDownstreamLessons,
} from '../lib/academy/content/workflow.js';
import { ACADEMY_ROLES } from '../lib/academy/auth/roles.js';

console.log('--- 📦 ТЕСТУВАННЯ CONTENT VERSIONING & PUBLISHING WORKFLOW (SCRUM-84) ---');

// Тест 1: Quality Gates валідація
console.log('1. Тест Quality Gates валідації...');
const invalidContent = {
  title: 'Bad',
  summary: 'Too short',
  acceptanceCriteria: ['Only one criterion'],
  jiraKey: 'INVALID-KEY',
  links: [{ url: 'javascript:alert(1)' }],
};
const failedGates = validateQualityGates(invalidContent);
assert.strictEqual(failedGates.passed, false, 'Невалідний контент повинен провалити Quality Gates');
assert(failedGates.errors.length >= 3, 'Повинно бути зафіксовано щонайменше 3 помилки');
assert.strictEqual(failedGates.gates.links, false, 'Небезпечне посилання має бути відхилене');

const validContent = {
  title: 'Advanced Web Audio Engine',
  summary: 'Поглиблене вивчення синтезу звуку на базі Web Audio API та 130 BPM осциляторів.',
  acceptanceCriteria: [
    'Створено 4 поліфонічні синтезатори',
    'Забезпечено 0 витоків пам\'яті при закритті модалки гри'
  ],
  jiraKey: 'SCRUM-84',
  links: [{ url: 'https://duck-verse.vercel.app' }],
};
const passedGates = validateQualityGates(validContent);
assert.strictEqual(passedGates.passed, true, 'Валідний контент повинен пройти Quality Gates');
console.log('✅ Quality Gates успішно відсіюють неякісний контент та пропускають валідний.');

// Тест 2: Повний життєвий цикл: Draft -> In Review -> Approve -> Publish
console.log('2. Тест повного життєвого циклу публікації...');
const authorUser = { id: 'author_duck_1', username: 'DuckCoder', role: ACADEMY_ROLES.CHILD };
const reviewerUser = { id: 'mentor_lead_1', username: 'SeniorMentor', role: ACADEMY_ROLES.MENTOR };

const draft = createDraft({
  lessonId: 'lesson-fe-l0-arch',
  updates: {
    title: 'Curriculum Registry & Feature Architecture v2',
    summary: 'Оновлений навчальний модуль з повною підтримкою версіонування та Quality Gates.',
    acceptanceCriteria: [
      'Усі передумови валідовані через DAG',
      'Quality gates перевіряють посилання та код'
    ],
    jiraKey: 'SCRUM-84',
  },
  author: authorUser,
});
assert.strictEqual(draft.status, CONTENT_STATES.DRAFT);
console.log('✅ Драфт створено у статусі DRAFT.');

// Відправка на рев'ю
const submitted = submitForReview({
  lessonId: 'lesson-fe-l0-arch',
  draftId: draft.draftId,
  actor: authorUser,
});
assert.strictEqual(submitted.status, CONTENT_STATES.IN_REVIEW);
console.log('✅ Драфт переведено у статус IN_REVIEW.');

// Схвалення рев'ювером
const approved = approveDraft({
  lessonId: 'lesson-fe-l0-arch',
  draftId: draft.draftId,
  reviewer: reviewerUser,
});
assert.strictEqual(approved.status, CONTENT_STATES.APPROVED);
assert.strictEqual(approved.reviewer.id, reviewerUser.id);
console.log('✅ Драфт схвалено ментором у статус APPROVED.');

// Публікація
const published = publishContent({
  lessonId: 'lesson-fe-l0-arch',
  draftId: draft.draftId,
  publisher: reviewerUser,
});
assert.strictEqual(published.status, CONTENT_STATES.PUBLISHED);
assert.strictEqual(published.version, '1.1.0');
console.log(`✅ Контент опубліковано у новій версії: v${published.version}.`);

// Тест 3: Захист від самосхвалення автором (Separation of Duties)
console.log('3. Захист від самосхвалення (Separation of Duties)...');
const mentorAuthor = { id: 'mentor_author_99', username: 'SelfAuthorMentor', role: ACADEMY_ROLES.MENTOR };
const selfDraft = createDraft({
  lessonId: 'lesson-fe-l1-canvas',
  updates: {
    title: 'Canvas 2D Engine Performance Deep Dive',
    summary: 'Оптимізація рендерингу для досягнення стабільних 60 FPS на мобільних пристроях.',
    acceptanceCriteria: [
      'Використано requestAnimationFrame',
      'Профільовано через Chrome DevTools'
    ],
    jiraKey: 'SCRUM-84',
  },
  author: mentorAuthor,
});
submitForReview({ lessonId: 'lesson-fe-l1-canvas', draftId: selfDraft.draftId, actor: mentorAuthor });

assert.throws(() => {
  approveDraft({
    lessonId: 'lesson-fe-l1-canvas',
    draftId: selfDraft.draftId,
    reviewer: mentorAuthor, // Спроба схвалити власний драфт!
  });
}, (err) => {
  return err.code === 'AUTHOR_CANNOT_APPROVE';
});
console.log('✅ Спроба автора схвалити власний драфт успішно заблокована (AUTHOR_CANNOT_APPROVE).');

// Тест 4: Студентська ізоляція (учні ніколи не бачать неперевірені чернетки)
console.log('4. Студентська ізоляція від чернеток...');
const studentView = getStudentVisibleCurriculum(ACADEMY_ROLES.CHILD);
// У студентському вигляді всі уроки повинні мати статус published або deprecated
for (const lesson of studentView) {
  assert.notStrictEqual(lesson.contentStatus, CONTENT_STATES.DRAFT);
  assert.notStrictEqual(lesson.contentStatus, CONTENT_STATES.IN_REVIEW);
}
console.log(`✅ Студентський каталог (${studentView.length} уроків) містить виключно перевірені релізи.`);

// Тест 5: Відкат (Rollback) зі збереженням студентського прогресу
console.log('5. Відкат до стабільної версії (Rollback)...');
const rollbackResult = rollbackLesson({
  lessonId: 'lesson-fe-l0-arch',
  targetVersion: '1.0.0',
  actor: reviewerUser,
  reason: 'Rollback test to baseline 1.0.0',
});
assert.strictEqual(rollbackResult.success, true);
assert.strictEqual(rollbackResult.rolledBackTo, '1.0.0');
const detailsAfterRollback = getLessonContentDetails('lesson-fe-l0-arch');
assert.strictEqual(detailsAfterRollback.activeVersion, '1.0.0');
console.log('✅ Відкат до версії v1.0.0 виконано успішно, історія збережена.');

// Тест 6: Депрекація та міграційний шлях (Deprecation & Migration Path)
console.log('6. Виведення уроку з експлуатації (Deprecation)...');
const adminUser = { id: 'admin_lead_yarik', username: 'Yarik0505', role: ACADEMY_ROLES.ADMIN };
const deprecateResult = deprecateLesson({
  lessonId: 'lesson-fe-l1-canvas',
  actor: adminUser,
  reason: 'Замінено на новий інтерактивний воркшоп',
  replacementLessonId: 'lesson-fe-l0-arch',
});
assert.strictEqual(deprecateResult.status, CONTENT_STATES.DEPRECATED);
assert.strictEqual(deprecateResult.deprecation.replacementLessonId, 'lesson-fe-l0-arch');
console.log('✅ Урок успішно депрековано із зазначенням курсу-наступника.');

// Тест 7: Content Diff та пошук залежних уроків (Downstream Impact)
console.log('7. Content Diff та Affected Lessons...');
const diff = calculateContentDiff(
  { title: 'Old Title', acceptanceCriteria: ['A', 'B'] },
  { title: 'New Title', acceptanceCriteria: ['A', 'B', 'C'] }
);
assert.strictEqual(diff.hasChanges, true);
assert.strictEqual(diff.diffCount, 2);

const affected = findAffectedDownstreamLessons('lesson-fe-l0-arch');
assert(Array.isArray(affected), 'affected lessons мають бути масивом');
console.log(`✅ Downstream impact: знайдено ${affected.length} залежних уроків.`);

// Тест 8: Аудит-трейл містить зафіксовані дії
console.log('8. Перевірка журналу операцій (Audit Trail)...');
const fullAudit = getFullPublishAuditLog();
assert(fullAudit.length >= 5, 'Повинно бути зафіксовано щонайменше 5 записів аудиту');
const actions = fullAudit.map(a => a.action);
assert(actions.includes('CREATE_DRAFT'));
assert(actions.includes('SUBMIT_FOR_REVIEW'));
assert(actions.includes('APPROVE_CONTENT'));
assert(actions.includes('PUBLISH_CONTENT'));
assert(actions.includes('ROLLBACK_CONTENT'));
assert(actions.includes('DEPRECATE_LESSON'));
console.log('✅ Повний аудит-трейл успішно зафіксував усі критичні події.');

console.log('🎉 ВСІ 8 ТЕСТІВ CONTENT VERSIONING & PUBLISHING WORKFLOW (SCRUM-84) УСПІШНО ПРОЙДЕНО!');
