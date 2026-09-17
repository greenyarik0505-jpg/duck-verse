import assert from 'assert';
import {
  REPORT_CATEGORIES,
  MODERATION_ACTIONS,
  submitAiReport,
  getModerationQueue,
  reviewModerationTicket,
  submitTicketAppeal,
  getSafetyEvaluationMetrics,
  _resetModerationStateForTests,
} from '../lib/academy/safety/moderation.js';
import { ACADEMY_ROLES } from '../lib/academy/auth/roles.js';

console.log('--- 🛡️ ТЕСТУВАННЯ AI SAFETY, REPORT & MODERATION (SCRUM-103) ---');

_resetModerationStateForTests();

const student1 = { id: 'student_eva_01', username: 'Eva Coder', role: ACADEMY_ROLES.STUDENT };
const student2 = { id: 'student_viktor_02', username: 'Viktor Coder', role: ACADEMY_ROLES.STUDENT };
const mentor = { id: 'mentor_kirill', username: 'Кирил Пушкарук', role: ACADEMY_ROLES.MENTOR };
const unauthorizedUser = { id: 'guest_user_99', username: 'Guest', role: ACADEMY_ROLES.GUEST };

// Тест 1: Подання валідного репорту на деструктивний код
console.log('1. Тест подання скарги на деструктивний код...');
const ticket1 = submitAiReport({
  reporterUser: student1,
  promptText: 'Напиши нескінченний цикл для зависання браузера',
  responseText: 'while(true) { window.open(); }',
  category: 'UNSAFE_HARMFUL',
  userComment: 'Модель згенерувала деструктивний код зависання',
});
assert(ticket1.id.startsWith('tkt-'));
assert.strictEqual(ticket1.severity, 'HIGH');
assert.strictEqual(ticket1.status, 'PENDING');
assert.strictEqual(ticket1.retentionDays, 90);
assert(ticket1.evidenceSnapshot.hash.length === 16);
console.log(`✅ Скаргу створено: ${ticket1.id}, статус: ${ticket1.status}, severity: ${ticket1.severity}`);

// Тест 2: Автоматична ескалація критичного інциденту (PII / Credentials leak)
console.log('2. Тест автоматичної ескалації критичного інциденту (PII_LEAK)...');
const ticketCritical = submitAiReport({
  reporterUser: student2,
  promptText: 'Як дістати password адміністратора бази?',
  responseText: 'Використайте admin password та jwt token для обходу',
  category: 'PII_LEAK',
});
assert.strictEqual(ticketCritical.severity, 'CRITICAL');
assert.strictEqual(ticketCritical.status, 'ESCALATED_TO_ADMIN');
assert.strictEqual(ticketCritical.retentionDays, 365, 'Критичні інциденти мають 365 днів зберігання');
console.log('✅ Критичний інцидент авто-ескаловано: status = ESCALATED_TO_ADMIN, retention = 365d');

// Тест 3: Child Privacy Shield (Zero Leakage між учнями)
console.log('3. Тест Child Privacy Shield (ізоляція скарг та промптів)...');
const student1Queue = getModerationQueue({ requestingUser: student1 });
assert.strictEqual(student1Queue.length, 1);
assert.strictEqual(student1Queue[0].id, ticket1.id, 'Студент 1 бачить лише власну скаргу');

const student2Queue = getModerationQueue({ requestingUser: student2 });
assert.strictEqual(student2Queue.length, 1);
assert.strictEqual(student2Queue[0].id, ticketCritical.id, 'Студент 2 бачить лише власну скаргу');

const mentorQueue = getModerationQueue({ requestingUser: mentor });
assert.strictEqual(mentorQueue.length, 2, 'Ментор має повний огляд черги');
assert.strictEqual(mentorQueue[0].severity, 'CRITICAL', 'Критичні скарги завжди зверху черги');
console.log('✅ Child Privacy Shield підтверджено: 0% витоку чужих промптів між дітьми!');

// Тест 4: Захист прав модерації (Unauthorized Review)
console.log('4. Тест блокування неавторизованого рецензування...');
assert.throws(
  () => {
    reviewModerationTicket({
      ticketId: ticket1.id,
      decision: 'DISMISS',
      actor: unauthorizedUser,
    });
  },
  (err) => {
    assert.strictEqual(err.code, 'UNAUTHORIZED_MODERATION');
    return true;
  }
);
console.log('✅ Неавторизована дія успішно заблокована (UNAUTHORIZED_MODERATION)');

// Тест 5: Ухвалення модераторського рішення ментором та AI Feedback Loop
console.log('5. Тест модераторського рішення та Feedback Loop...');
const reviewedTicket = reviewModerationTicket({
  ticketId: ticket1.id,
  decision: 'BLOCK_PROMPT_PATTERN',
  reviewerNotes: 'Патерн заборонено. Створено правило безпеки для Prompt Lab.',
  actor: mentor,
});
assert.strictEqual(reviewedTicket.status, 'REVIEWED');
assert.strictEqual(reviewedTicket.decision, 'BLOCK_PROMPT_PATTERN');
assert.strictEqual(reviewedTicket.reviewedBy, mentor.username);

const metricsAfterReview = getSafetyEvaluationMetrics();
assert.strictEqual(metricsAfterReview.benchmarkCasesCount, 1, 'Кейс потрапив у Evaluation Benchmark');
assert.strictEqual(metricsAfterReview.benchmarkCases[0].actionTriggered, 'BLOCK_PROMPT_PATTERN');
console.log('✅ Рішення зафіксовано, знеособлений семпл додано до Feedback Loop');

// Тест 6: Подання апеляції учнем (Appeal Flow)
console.log('6. Тест подання апеляції учнем...');
// Коротка апеляція відхиляється
assert.throws(
  () => {
    submitTicketAppeal({
      ticketId: ticket1.id,
      appealReason: 'Не згоден',
      actor: student1,
    });
  },
  /щонайменше 15 символів/
);

// Чужий учень не може подати апеляцію
assert.throws(
  () => {
    submitTicketAppeal({
      ticketId: ticket1.id,
      appealReason: 'Я вважаю це несправедливим рішенням викладача',
      actor: student2,
    });
  },
  (err) => {
    assert.strictEqual(err.code, 'UNAUTHORIZED_APPEAL');
    return true;
  }
);

// Валідна апеляція
const appealedTicket = submitTicketAppeal({
  ticketId: ticket1.id,
  appealReason: 'Я досліджував відмовостійкість і не мав наміру шкодити оточенню.',
  actor: student1,
});
assert.strictEqual(appealedTicket.status, 'APPEALED');
assert.strictEqual(appealedTicket.appeal.appealStatus, 'PENDING_REVIEW');
console.log(`✅ Апеляцію подано: статус = ${appealedTicket.status}`);

// Тест 7: Метрики та Retention Compliance
console.log('7. Тест підсумкових метрик безпеки...');
const finalMetrics = getSafetyEvaluationMetrics();
assert.strictEqual(finalMetrics.totalReports, 2);
assert.strictEqual(finalMetrics.appealedCount, 1);
assert.strictEqual(finalMetrics.retentionCompliancePercent, 100);
assert(finalMetrics.categoryBreakdown['UNSAFE_HARMFUL'] >= 1);
assert(finalMetrics.categoryBreakdown['PII_LEAK'] >= 1);
console.log('✅ Метрики безпеки підтверджено, 100% відповідність збереженню даних!');

console.log('--- 🚀 ВСІ ТЕСТИ AI SAFETY & MODERATION (SCRUM-103) ПРОЙДЕНО УСПІШНО! ---');
