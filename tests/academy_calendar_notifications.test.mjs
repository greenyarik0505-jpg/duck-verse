import assert from 'assert';
import {
  EVENT_TYPES,
  DELIVERY_STATUS,
  getNotificationPreferences,
  updateNotificationPreferences,
  triggerReminder,
  getStudentNotifications,
  dismissNotification,
  getStudentCalendarEvents,
  getDeliveryHistory,
  isQuietHoursActive,
  generateIdempotencyKey,
} from '../lib/academy/calendar/notifications.js';
import { ACADEMY_ROLES } from '../lib/academy/auth/roles.js';

console.log('--- 📅 ТЕСТУВАННЯ NOTIFICATIONS, REMINDERS & LEARNING CALENDAR (SCRUM-85) ---');

const testStudentId = 'student-test-85';

// Тест 1: Генерація детермінованого Idempotency ключа
console.log('1. Тест формування Idempotency Key...');
const key1 = generateIdempotencyKey({
  userId: testStudentId,
  sourceTaskId: 'SCRUM-56',
  eventType: EVENT_TYPES.LESSON_DEADLINE,
  dateStr: '2026-09-17',
});
const key2 = generateIdempotencyKey({
  userId: testStudentId,
  sourceTaskId: 'SCRUM-56',
  eventType: EVENT_TYPES.LESSON_DEADLINE,
  dateStr: '2026-09-17',
});
assert.strictEqual(key1, key2, 'Ключі для ідентичних параметрів мають бути повністю однаковими');
console.log(`✅ Idempotency Key детермінований: ${key1}`);

// Тест 2: Доставка нагадування та успішна дедуплікація (Zero-Spam)
console.log('2. Тест доставки та дедуплікації нагадувань...');
const reminderPayload = {
  userId: testStudentId,
  eventType: EVENT_TYPES.LESSON_DEADLINE,
  sourceTaskId: 'SCRUM-56',
  title: 'Дедлайн завдання [SCRUM-56]',
  message: 'Час здати Pull Request та пройти автоматичні перевірки.',
  nextAction: {
    label: 'Перейти до уроку',
    actionUrl: '/academy#lesson-fe-l0-arch',
  },
  eventDate: '2026-09-17',
  overrideDate: '2026-09-17T12:00:00.000Z', // День (не тихі години)
};

// Перший запуск -> DELIVERED
const firstDelivery = triggerReminder(reminderPayload);
assert.strictEqual(firstDelivery.status, DELIVERY_STATUS.DELIVERED);
assert(firstDelivery.notification, 'Доставлене сповіщення повинно містити об\'єкт notification');
assert.strictEqual(firstDelivery.notification.sourceTaskId, 'SCRUM-56');
assert.strictEqual(firstDelivery.notification.nextAction.label, 'Перейти до уроку');

// Повторний запуск із тими самими параметрами -> SUPPRESSED_DUPLICATE
const secondDelivery = triggerReminder(reminderPayload);
assert.strictEqual(secondDelivery.status, DELIVERY_STATUS.SUPPRESSED_DUPLICATE);
assert(secondDelivery.idempotencyKey, 'Повинно містити ключ дедуплікації');
console.log('✅ Дедуплікація спрацювала: перше повідомлення доставлено, повторне відхилено без спаму.');

// Тест 3: Тихі години (Quiet Hours: 22:00 – 08:00)
console.log('3. Тест тихих годин (Quiet Hours)...');
const prefs = getNotificationPreferences(testStudentId);
assert.strictEqual(prefs.quietHours.enabled, true);

// Перевірка функції визначення часу
const nightDate = new Date('2026-09-17T23:30:00+03:00'); // 23:30 Kyiv
const dayDate = new Date('2026-09-17T14:00:00+03:00');   // 14:00 Kyiv
assert.strictEqual(isQuietHoursActive(prefs, nightDate), true, 'О 23:30 тихі години мають бути активні');
assert.strictEqual(isQuietHoursActive(prefs, dayDate), false, 'О 14:00 тихі години не повинні бути активні');

// Спроба відправити інше сповіщення вночі
const nightReminder = triggerReminder({
  userId: testStudentId,
  eventType: EVENT_TYPES.TASK_BLOCKER,
  sourceTaskId: 'SCRUM-54',
  title: 'Нічне нагадування',
  message: 'Це повідомлення не повинно турбувати учня вночі.',
  nextAction: { label: 'Деталі', actionUrl: '/academy' },
  eventDate: '2026-09-18',
  overrideDate: nightDate,
});
assert.strictEqual(nightReminder.status, DELIVERY_STATUS.SUPPRESSED_QUIET_HOURS);
console.log('✅ Тихі години активні: нічне сповіщення призупинено зі статусом SUPPRESSED_QUIET_HOURS.');

// Тест 4: Відкликання згоди (Consent Revocation / Right to Object)
console.log('4. Тест відкликання згоди на сповіщення...');
updateNotificationPreferences(testStudentId, { consentRevoked: true });
const revokedDelivery = triggerReminder({
  userId: testStudentId,
  eventType: EVENT_TYPES.MENTOR_REVIEW,
  sourceTaskId: 'SCRUM-57',
  title: 'Запит на рев\'ю',
  message: 'Ментор готовий до зустрічі.',
  nextAction: { label: 'Відкрити', actionUrl: '/academy' },
  eventDate: '2026-09-19',
  overrideDate: dayDate,
});
assert.strictEqual(revokedDelivery.status, DELIVERY_STATUS.SUPPRESSED_REVOKED_CONSENT);
console.log('✅ Відкликання згоди діє миттєво: сповіщення повністю заблоковано.');

// Відновлюємо згоду для наступних тестів
updateNotificationPreferences(testStudentId, { consentRevoked: false });

// Тест 5: Обов'язковість метаданих sourceTaskId та nextAction
console.log('5. Тест обов\'язковості sourceTaskId та nextAction...');
assert.throws(() => {
  triggerReminder({
    userId: testStudentId,
    eventType: EVENT_TYPES.LESSON_DEADLINE,
    title: 'No task',
    message: 'Missing sourceTaskId',
    nextAction: { label: 'Go', actionUrl: '/go' },
  });
}, /sourceTaskId/);

assert.throws(() => {
  triggerReminder({
    userId: testStudentId,
    eventType: EVENT_TYPES.LESSON_DEADLINE,
    sourceTaskId: 'SCRUM-56',
    title: 'No next action',
    message: 'Missing nextAction',
  });
}, /nextAction/);
console.log('✅ Контракт суворий: неможливо створити нагадування без прив\'язки до задачі та дії.');

// Тест 6: Захист від витоку чужих нагадувань (IDOR / Privacy)
console.log('6. Тест IDOR захисту...');
const strangerStudent = { id: 'stranger-999', role: ACADEMY_ROLES.CHILD };
assert.throws(() => {
  triggerReminder({
    userId: testStudentId, // Чужий ID
    eventType: EVENT_TYPES.LESSON_DEADLINE,
    sourceTaskId: 'SCRUM-56',
    title: 'Злом',
    message: 'Спроба отримати доступ до чужого сповіщення',
    nextAction: { label: 'Go', actionUrl: '/go' },
    requestingUser: strangerStudent,
  });
}, (err) => {
  return err.code === 'UNAUTHORIZED_STUDENT_ACCESS';
});
console.log('✅ IDOR захист успішно заблокував несанкціонований доступ чужого учня.');

// Тест 7: Генерація подій Learning Calendar та підтримка Timezone
console.log('7. Тест генератора розкладу Learning Calendar...');
const calendarEvents = getStudentCalendarEvents({
  userId: testStudentId,
  timezone: 'Europe/Kyiv',
});
assert(Array.isArray(calendarEvents));
assert(calendarEvents.length >= 4, 'Має бути щонайменше 4 планові події');
for (const ev of calendarEvents) {
  assert(ev.sourceTaskId, 'Подія повинна мати sourceTaskId');
  assert(ev.nextAction?.actionUrl, 'Подія повинна мати nextAction');
  assert(ev.start && ev.end, 'Подія повинна мати дати початку і кінця');
  assert.strictEqual(ev.timezone, 'Europe/Kyiv');
}
console.log(`✅ Навчальний календар успішно сформував ${calendarEvents.length} подій із часовим поясом Europe/Kyiv.`);

// Тест 8: Відхилення нагадування (Dismiss) та журнал доставок (Delivery History)
console.log('8. Тест відхилення сповіщення та історії доставок...');
const activeListBefore = getStudentNotifications(testStudentId);
assert(activeListBefore.length > 0, 'Повинні бути активні сповіщення');
const firstNotifId = activeListBefore[0].id;

const dismissResult = dismissNotification(testStudentId, firstNotifId);
assert.strictEqual(dismissResult.success, true);
const activeListAfter = getStudentNotifications(testStudentId);
assert.strictEqual(activeListAfter.find(n => n.id === firstNotifId), undefined);

const history = getDeliveryHistory(testStudentId);
assert(history.length >= 3, 'Історія доставок повинна містити всі спроби');
console.log(`✅ Сповіщення успішно відхилено, історія містить ${history.length} записів аудиту доставки.`);

console.log('🎉 ВСІ 8 ТЕСТІВ NOTIFICATIONS & LEARNING CALENDAR (SCRUM-85) УСПІШНО ПРОЙДЕНО!');
