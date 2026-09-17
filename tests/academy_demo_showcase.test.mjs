import assert from 'assert';
import {
  getDemoDayEventInfo,
  submitDemoProject,
  updateParentConsentForShowcase,
  moderateSubmission,
  requestPublicShowcase,
  createShareableShowcaseLink,
  revokeShareableLink,
  verifyShareableLink,
  gradeSubmissionFairnessRubric,
  _resetShowcaseStateForTests,
} from '../lib/academy/showcase/showcase.js';
import { ACADEMY_ROLES } from '../lib/academy/auth/roles.js';

console.log('--- 🎙️ ТЕСТУВАННЯ DEMO DAY & PRIVACY-SAFE SHOWCASE (SCRUM-90) ---');

_resetShowcaseStateForTests();

const testStudent = { id: 'student_dmytro_44', username: 'Dmytro Junior', role: ACADEMY_ROLES.STUDENT };
const testParent = { id: 'parent_olena_01', username: 'Olena (Mother)', role: 'parent' };
const testMentor = { id: 'mentor_kirill_22', username: 'Kirill Mentor', role: ACADEMY_ROLES.MENTOR };

// Тест 1: Отримання інформації про захід Demo Day
console.log('1. Тест отримання інформації про захід Demo Day...');
const eventInfo = getDemoDayEventInfo();
assert.strictEqual(eventInfo.maxSlots, 8);
assert.strictEqual(eventInfo.status, 'REGISTRATION_OPEN');
assert(eventInfo.availableSlotsCount > 0);
console.log(`✅ Інформація про захід валідна, доступно слотів: ${eventInfo.availableSlotsCount}/${eventInfo.maxSlots}`);

// Тест 2: Подання проекту на демонстрацію (Rich Submission)
console.log('2. Тест подання проекту учнем (Rich Submission)...');
const submission = submitDemoProject({
  studentUser: testStudent,
  title: 'Cyber Flap Duck 60 FPS Engine',
  description: 'Повноцінний автономний ігровий рушій аркади Flappy Duck із Web Audio API.',
  demoUrl: 'https://duck-verse.vercel.app',
  prUrl: 'https://github.com/greenyarik0505-jpg/duck-verse/pull/18',
  testsSummary: { passed: 52, total: 52, coverage: '93%' },
  retrospective: 'Освоїв модульну архітектуру та захист від IDOR у Route Handlers.',
  slotNumber: 3,
});

assert(submission.id.startsWith('sub-'));
assert.strictEqual(submission.visibility, 'PRIVATE', 'Початковий статус завжди PRIVATE');
assert.strictEqual(submission.slotNumber, 3);
assert.strictEqual(submission.moderation.status, 'PENDING');
console.log('✅ Проект успішно зареєстровано у приватному статусі на слот #3');

// Тест 3: Блокування публікації без згоди батьків (PARENT_CONSENT_REQUIRED)
console.log('3. Тест блокування публікації без батьківської згоди...');
assert.throws(
  () => {
    requestPublicShowcase({
      submissionId: submission.id,
      actor: testStudent,
    });
  },
  (err) => {
    assert.strictEqual(err.code, 'PARENT_CONSENT_REQUIRED');
    return true;
  },
  'Публікація без батьківської згоди повинна бути заблокована'
);
console.log('✅ Блокування без батьківської згоди спрацювало (PARENT_CONSENT_REQUIRED)');

// Тест 4: Блокування публікації без модерації ментора (MODERATION_REQUIRED)
console.log('4. Тест блокування публікації без схвалення модератора...');
updateParentConsentForShowcase({
  submissionId: submission.id,
  parentUser: testParent,
  granted: true,
});

assert.throws(
  () => {
    requestPublicShowcase({
      submissionId: submission.id,
      actor: testStudent,
    });
  },
  (err) => {
    assert.strictEqual(err.code, 'MODERATION_REQUIRED');
    return true;
  },
  'Публікація без схвалення ментора повинна бути заблокована'
);
console.log('✅ Блокування без модерації спрацювало (MODERATION_REQUIRED)');

// Тест 5: Модерація ментором та перехід у PUBLIC_SHOWCASE
console.log('5. Тест схвалення модератором проекту...');
const modResult = moderateSubmission({
  submissionId: submission.id,
  moderatorUser: testMentor,
  decision: 'APPROVED',
  feedback: 'Відмінна робота із Canvas 2D рушієм та повне покриття тестами.',
});
assert.strictEqual(modResult.moderation.status, 'APPROVED');
assert.strictEqual(modResult.visibility, 'PUBLIC_SHOWCASE', 'При наявності згоди батьків проект переходить у публічний шоукейс');
console.log('✅ Проект успішно схвалено та опубліковано у PUBLIC_SHOWCASE');

// Тест 6: Генерація захищеного тимчасового посилання (TTL 7 днів)
console.log('6. Тест генерації тимчасового посилання (7d TTL)...');
const shareLink = createShareableShowcaseLink({
  submissionId: submission.id,
  actor: testStudent,
  ttlHours: 168,
});
assert(shareLink.token.startsWith('shlink-'));
assert(new Date(shareLink.expiresAt) > new Date());

const verifyActive = verifyShareableLink(shareLink.token);
assert.strictEqual(verifyActive.valid, true);
assert.strictEqual(verifyActive.submission.id, submission.id);
console.log(`✅ Тимчасове посилання дійсне: ${shareLink.shareableUrl}`);

// Тест 7: Миттєве відкликання тимчасового посилання (Revoke Access)
console.log('7. Тест відкликання тимчасового посилання...');
const revokeResult = revokeShareableLink({
  linkToken: shareLink.token,
  actor: testStudent,
});
assert.strictEqual(revokeResult.revoked, true);

const verifyRevoked = verifyShareableLink(shareLink.token);
assert.strictEqual(verifyRevoked.valid, false);
assert.strictEqual(verifyRevoked.reason, 'REVOKED');
console.log('✅ Відкликання посилання спрацювало: доступ миттєво заблоковано');

// Тест 8: Оцінювання за Fairness Rubric (40 pts)
console.log('8. Тест оцінювання роботи за 40-бальною Fairness Rubric...');
const rubricResult = gradeSubmissionFairnessRubric({
  submissionId: submission.id,
  mentorUser: testMentor,
  scores: {
    architectureAndCode: 10,
    uiPlayabilityAndPolish: 9,
    testsAndCiPipeline: 10,
    presentationAndRetrospective: 9,
  },
  feedback: 'Блискучий випускний проект, рекомендовано до нагородження.',
});

assert.strictEqual(rubricResult.totalScore, 38);
assert.strictEqual(rubricResult.maxScore, 40);
assert.strictEqual(rubricResult.grade, 'Exceptional');
assert.strictEqual(rubricResult.breakdown.architectureAndCode, 10);
console.log(`✅ Fairness Rubric оцінено: ${rubricResult.totalScore}/40 (${rubricResult.grade})`);

console.log('--- 🚀 ВСІ 8 ТЕСТІВ DEMO DAY & SHOWCASE (SCRUM-90) УСПІШНО ПРОЙДЕНО! ---');
