import assert from 'assert';
import {
  MENTOR_PROFILES,
  getAvailableSlots,
  bookOfficeHourSlot,
  rescheduleBooking,
  cancelBooking,
  completeOfficeHourSession,
  getUserBookings,
  _resetOfficeHoursStateForTests,
} from '../lib/academy/mentoring/office_hours.js';
import { ACADEMY_ROLES } from '../lib/academy/auth/roles.js';

console.log('--- 📅 ТЕСТУВАННЯ MENTOR OFFICE HOURS & 1-ON-1 BOOKING (SCRUM-99) ---');

_resetOfficeHoursStateForTests();

const testStudent1 = { id: 'student_eva_01', username: 'Eva Coder', role: ACADEMY_ROLES.STUDENT };
const testStudent2 = { id: 'student_viktor_02', username: 'Viktor Coder', role: ACADEMY_ROLES.STUDENT };
const testMentor = { id: 'mentor_kirill', username: 'Кирил Пушкарук', role: ACADEMY_ROLES.MENTOR };
const unauthorizedUser = { id: 'guest_user_99', username: 'Guest', role: ACADEMY_ROLES.GUEST };

// Тест 1: Перевірка профілів менторів та отримання доступних слотів
console.log('1. Тест отримання слотів та фільтрації за ментором...');
assert(MENTOR_PROFILES.length >= 3);
const allSlots = getAvailableSlots();
assert(allSlots.length >= 4);
const kirillSlots = getAvailableSlots({ mentorId: 'mentor_kirill' });
assert(kirillSlots.every(s => s.mentorId === 'mentor_kirill'));
console.log(`✅ Слоти отримано: всього ${allSlots.length}, у Кирила ${kirillSlots.length}`);

// Тест 2: Успішне бронювання слота (з валідацією agenda >= 10)
console.log('2. Тест успішного бронювання слота...');
const targetSlot = kirillSlots[0];
const booking = bookOfficeHourSlot({
  slotId: targetSlot.id,
  studentUser: testStudent1,
  agenda: 'Оптимізація буферів аудіо та дебаг Web Audio API sintetizer.',
  preferredFocus: 'Audio Engine',
});
assert(booking.id.startsWith('book-'));
assert.strictEqual(booking.slotId, targetSlot.id);
assert.strictEqual(booking.studentId, testStudent1.id);
assert.strictEqual(booking.status, 'CONFIRMED');
assert.strictEqual(booking.followUpJiraTask.key, 'SCRUM-54');
console.log(`✅ Слот успішно заброньовано: ${booking.id}, статус: ${booking.status}`);

// Тест 3: Захист від подвійного бронювання (Double-Booking Prevention)
console.log('3. Тест захисту від подвійного бронювання...');
assert.throws(
  () => {
    bookOfficeHourSlot({
      slotId: targetSlot.id,
      studentUser: testStudent2,
      agenda: 'Спроба паралельного бронювання того ж слота.',
    });
  },
  (err) => {
    assert.strictEqual(err.code, 'SLOT_ALREADY_BOOKED');
    return true;
  }
);
console.log('✅ Подвійне бронювання успішно заблоковано (SLOT_ALREADY_BOOKED)');

// Тест 4: Захист квоти справедливого використання (Fair-Use Quota: max 1 session / week)
console.log('4. Тест перевірки Fair-Use ліміту (1 консультація на тиждень)...');
const anotherSlotSameWeek = getAvailableSlots().find(s => s.weekNumber === targetSlot.weekNumber && s.id !== targetSlot.id);
assert(anotherSlotSameWeek, 'Повинен бути інший вільний слот на цей же тиждень');

assert.throws(
  () => {
    bookOfficeHourSlot({
      slotId: anotherSlotSameWeek.id,
      studentUser: testStudent1, // Той самий студент у тому самому тижні
      agenda: 'Спроба забронювати другу консультацію на той самий тиждень.',
    });
  },
  (err) => {
    assert.strictEqual(err.code, 'FAIR_USE_QUOTA_EXCEEDED');
    return true;
  }
);
console.log('✅ Перевищення ліміту Fair-Use успішно заблоковано (FAIR_USE_QUOTA_EXCEEDED)');

// Тест 5: Перенесення консультації (Reschedule) на інший слот
console.log('5. Тест перенесення консультації на новий слот...');
const rescheduleRes = rescheduleBooking({
  bookingId: booking.id,
  newSlotId: anotherSlotSameWeek.id,
  actor: testStudent1,
});
assert.strictEqual(rescheduleRes.success, true);
// Старий слот має стати доступним знову
const freedOldSlot = getAvailableSlots().find(s => s.id === targetSlot.id);
assert(freedOldSlot, 'Старий слот повинен стати AVAILABLE');
console.log('✅ Консультацію перенесено, старий слот звільнено для інших учнів');

// Тест 6: Скасування консультації (Cancel)
console.log('6. Тест скасування консультації...');
const cancelRes = cancelBooking({
  bookingId: booking.id,
  actor: testStudent1,
  reason: 'Захворів, звільняю слот',
});
assert.strictEqual(cancelRes.success, true);
assert.strictEqual(cancelRes.status, 'CANCELLED');
console.log('✅ Консультацію скасовано, слот знову доступний');

// Тест 7: Завершення консультації ментором та фіксація нотаток
console.log('7. Тест завершення сесії ментором...');
// Бронюємо новий слот для перевірки completion
const slotForCompletion = getAvailableSlots()[0];
const bookingToComplete = bookOfficeHourSlot({
  slotId: slotForCompletion.id,
  studentUser: testStudent2,
  agenda: 'Консультація щодо розрахунку колізій Canvas 2D.',
});

// Неавторизований користувач не може завершити сесію
assert.throws(
  () => {
    completeOfficeHourSession({
      bookingId: bookingToComplete.id,
      mentorUser: unauthorizedUser,
      publicSummary: 'Спроба неавторизованого завершення',
    });
  },
  (err) => {
    assert.strictEqual(err.code, 'UNAUTHORIZED_COMPLETION');
    return true;
  }
);

// Ментор успішно завершує консультацію
const completeRes = completeOfficeHourSession({
  bookingId: bookingToComplete.id,
  mentorUser: testMentor,
  publicSummary: 'Розглянули AABB та колові хітбокси, учень реалізував правильний відскок.',
  privateNotes: 'Учень відмінно орієнтується у векторі швидкостей, рекомендувати на хакатон.',
  followUpJiraTask: {
    key: 'SCRUM-18',
    summary: 'Рефакторинг фізики перешкод',
    url: 'https://gta6-sliv-cyberleek.atlassian.net/browse/SCRUM-18',
  },
});
assert.strictEqual(completeRes.success, true);
assert.strictEqual(completeRes.status, 'COMPLETED');
assert.strictEqual(completeRes.hasPrivateNotes, true);
console.log('✅ Сесію завершено ментором, нотатки зафіксовано');

// Тест 8: Child Privacy Shield (Zero Private Notes Leakage to Students)
console.log('8. Тест Child Privacy Shield (ізоляція приватних нотаток)...');
const studentView = getUserBookings({ requestingUser: testStudent2 });
const myCompletedBooking = studentView.find(b => b.id === bookingToComplete.id);
assert(myCompletedBooking, 'Студент бачить свою завершену консультацію');
assert.strictEqual(myCompletedBooking.publicSummary, 'Розглянули AABB та колові хітбокси, учень реалізував правильний відскок.');
assert.strictEqual(myCompletedBooking.privateMentorNotes, undefined, 'Приватні нотатки ментора НЕ повинні бути доступні учню');

const mentorView = getUserBookings({ requestingUser: testMentor });
const mentorCompletedBooking = mentorView.find(b => b.id === bookingToComplete.id);
assert.strictEqual(mentorCompletedBooking.privateMentorNotes, 'Учень відмінно орієнтується у векторі швидкостей, рекомендувати на хакатон.', 'Ментор має доступ до своїх нотаток');
console.log('✅ Child Privacy Shield перевірено: 0% витоку приватних нотаток учню!');

console.log('--- 🚀 ВСІ ТЕСТИ MENTOR OFFICE HOURS (SCRUM-99) ПРОЙДЕНО УСПІШНО! ---');
