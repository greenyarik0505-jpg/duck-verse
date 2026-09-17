/**
 * Duck Academy — Mentor Office Hours & 1-on-1 Booking Engine (SCRUM-99)
 *
 * Відповідає стандартам:
 * 1. Mentor Availability: 30-хвилинні слоти менторів із підтримкою IANA часових поясів (Europe/Kyiv).
 * 2. Atomic Reservation: захист від подвійного бронювання (Double-Booking Prevention).
 * 3. Fair-Use Quota: максимум 1 активна консультація на тиждень на одного учня для рівного доступу між дітьми.
 * 4. Cancel & Reschedule: атомарне скасування та перенесення слотів.
 * 5. Agenda & Follow-Up Jira: обов'язковий порядок денний зустрічі та генерація задачі в Jira.
 * 6. Child Privacy & Notes Isolation: приватні спостереження ментора суворо ізольовані від учня/батьків.
 */

import crypto from 'crypto';
import { ACADEMY_ROLES } from '../auth/roles.js';

// Профілі менторів
export const MENTOR_PROFILES = [
  {
    id: 'mentor_kirill',
    name: 'Кирил Пушкарук',
    role: 'Mentor & Audio Engineer',
    focus: 'Web Audio API, 130 BPM Synthesizer, Route Handlers, Rate Limiting',
  },
  {
    id: 'mentor_dima',
    name: 'Степаненко Дмитро',
    role: 'Mentor & Physics Specialist',
    focus: 'Canvas 2D Physics, Geometry Dash, Hitboxes, Flappy Duck',
  },
  {
    id: 'admin_yarik',
    name: 'Yarik0505',
    role: 'Team Lead & Architect',
    focus: 'Next.js 15, Architecture, Tailwind CSS, Vercel CI/CD & Scrum',
  },
];

// Сховище слотів доступності
const slotsStore = [
  {
    id: 'slot-kirill-tue-1',
    mentorId: 'mentor_kirill',
    mentorName: 'Кирил Пушкарук',
    startTime: '2026-09-22T14:00:00.000Z',
    endTime: '2026-09-22T14:30:00.000Z',
    timeZone: 'Europe/Kyiv',
    weekNumber: 39,
    status: 'AVAILABLE',
  },
  {
    id: 'slot-kirill-tue-2',
    mentorId: 'mentor_kirill',
    mentorName: 'Кирил Пушкарук',
    startTime: '2026-09-22T14:30:00.000Z',
    endTime: '2026-09-22T15:00:00.000Z',
    timeZone: 'Europe/Kyiv',
    weekNumber: 39,
    status: 'AVAILABLE',
  },
  {
    id: 'slot-dima-wed-1',
    mentorId: 'mentor_dima',
    mentorName: 'Степаненко Дмитро',
    startTime: '2026-09-23T15:00:00.000Z',
    endTime: '2026-09-23T15:30:00.000Z',
    timeZone: 'Europe/Kyiv',
    weekNumber: 39,
    status: 'AVAILABLE',
  },
  {
    id: 'slot-dima-wed-2',
    mentorId: 'mentor_dima',
    mentorName: 'Степаненко Дмитро',
    startTime: '2026-09-23T15:30:00.000Z',
    endTime: '2026-09-23T16:00:00.000Z',
    timeZone: 'Europe/Kyiv',
    weekNumber: 39,
    status: 'AVAILABLE',
  },
  {
    id: 'slot-yarik-thu-1',
    mentorId: 'admin_yarik',
    mentorName: 'Yarik0505',
    startTime: '2026-09-24T16:00:00.000Z',
    endTime: '2026-09-24T16:30:00.000Z',
    timeZone: 'Europe/Kyiv',
    weekNumber: 39,
    status: 'AVAILABLE',
  },
];

// Сховище бронювань
const bookingsStore = [
  {
    id: 'book-init-01',
    slotId: 'slot-hist-01',
    studentId: 'student_eva_01',
    studentName: 'Eva Coder',
    mentorId: 'mentor_kirill',
    mentorName: 'Кирил Пушкарук',
    startTime: '2026-09-15T14:00:00.000Z',
    endTime: '2026-09-15T14:30:00.000Z',
    timeZone: 'Europe/Kyiv',
    weekNumber: 38,
    agenda: 'Консультація щодо оптимізації синтезатора звуку Web Audio API.',
    preferredFocus: 'Audio Engine & Performance',
    status: 'COMPLETED',
    publicSummary: 'Учень успішно реалізував 130 BPM бас-лінію та налаштував аудіо-ноти.',
    privateMentorNotes: 'Учень має гарне аналітичне мислення, але потребує впевненості при роботі з AudioContext state.',
    followUpJiraTask: {
      key: 'SCRUM-19',
      summary: 'Інтегрувати синтезатор звуку у флагманську гру',
      url: 'https://gta6-sliv-cyberleek.atlassian.net/browse/SCRUM-19',
    },
    createdAt: '2026-09-14T10:00:00.000Z',
  },
];

/**
 * Отримання списку доступних слотів менторів
 */
export function getAvailableSlots({ mentorId } = {}) {
  return slotsStore.filter(s => {
    if (mentorId && s.mentorId !== mentorId) return false;
    return s.status === 'AVAILABLE';
  });
}

/**
 * Бронювання консультації (Atomic Reservation & Fair-Use Quota)
 */
export function bookOfficeHourSlot({
  slotId,
  studentUser,
  agenda,
  preferredFocus = 'General Code Review',
}) {
  if (!slotId) throw new Error('slotId обов\'язковий');
  if (!studentUser || !studentUser.id) throw new Error('studentUser обов\'язковий');
  if (!agenda || agenda.length < 10) throw new Error('Порядок денний (agenda) повинен містити щонайменше 10 символів');

  const slot = slotsStore.find(s => s.id === slotId);
  if (!slot) throw new Error('Слот не знайдено');

  // 1. Захист від подвійного бронювання (Double-Booking Prevention)
  if (slot.status !== 'AVAILABLE') {
    const err = new Error('Цей часовий слот вже заброньовано іншим учнем');
    err.code = 'SLOT_ALREADY_BOOKED';
    throw err;
  }

  // 2. Захист квоти справедливого використання (Fair-Use Quota Policy)
  // Кожен учень має право на максимум 1 активну консультацію на тиждень
  const existingActiveWeeklyBooking = bookingsStore.find(b =>
    b.studentId === studentUser.id &&
    b.weekNumber === slot.weekNumber &&
    b.status === 'CONFIRMED'
  );

  if (existingActiveWeeklyBooking) {
    const err = new Error(`Перевищено ліміт Fair-Use: учень має право щонайбільше на 1 консультацію на тиждень (вже заброньовано на тиждень #${slot.weekNumber})`);
    err.code = 'FAIR_USE_QUOTA_EXCEEDED';
    throw err;
  }

  const bookingId = `book-${crypto.randomBytes(6).toString('hex')}`;
  const now = new Date().toISOString();

  // Атомарна зміна статусу слота
  slot.status = 'BOOKED';
  slot.bookedBy = studentUser.id;

  const newBooking = {
    id: bookingId,
    slotId: slot.id,
    studentId: studentUser.id,
    studentName: studentUser.username || 'Student',
    mentorId: slot.mentorId,
    mentorName: slot.mentorName,
    startTime: slot.startTime,
    endTime: slot.endTime,
    timeZone: slot.timeZone,
    weekNumber: slot.weekNumber,
    agenda,
    preferredFocus,
    status: 'CONFIRMED',
    publicSummary: null,
    privateMentorNotes: null,
    followUpJiraTask: {
      key: 'SCRUM-54',
      summary: 'Підготувати PR за результатами менторської сесії',
      url: 'https://gta6-sliv-cyberleek.atlassian.net/browse/SCRUM-54',
    },
    reminderIdempotencyKey: `rem-${studentUser.id}-${slot.id}-${slot.weekNumber}`,
    createdAt: now,
  };

  bookingsStore.push(newBooking);
  return newBooking;
}

/**
 * Перенесення консультації (Reschedule)
 */
export function rescheduleBooking({ bookingId, newSlotId, actor }) {
  if (!bookingId || !newSlotId) throw new Error('bookingId та newSlotId обов\'язкові');

  const booking = bookingsStore.find(b => b.id === bookingId);
  if (!booking) throw new Error('Бронювання не знайдено');

  const isAuthorized = actor && (
    actor.id === booking.studentId ||
    actor.id === booking.mentorId ||
    actor.role === ACADEMY_ROLES.ADMIN
  );

  if (!isAuthorized) {
    const err = new Error('Тільки учень, закріплений ментор або адміністратор можуть переносити консультацію');
    err.code = 'UNAUTHORIZED_RESCHEDULE';
    throw err;
  }

  const newSlot = slotsStore.find(s => s.id === newSlotId);
  if (!newSlot) throw new Error('Новий слот не знайдено');

  if (newSlot.status !== 'AVAILABLE') {
    const err = new Error('Новий обраний слот вже зайнятий');
    err.code = 'SLOT_ALREADY_BOOKED';
    throw err;
  }

  // Звільняємо старий слот
  const oldSlot = slotsStore.find(s => s.id === booking.slotId);
  if (oldSlot) {
    oldSlot.status = 'AVAILABLE';
    delete oldSlot.bookedBy;
  }

  // Займаємо новий слот
  newSlot.status = 'BOOKED';
  newSlot.bookedBy = booking.studentId;

  // Оновлюємо запис бронювання
  booking.slotId = newSlot.id;
  booking.startTime = newSlot.startTime;
  booking.endTime = newSlot.endTime;
  booking.weekNumber = newSlot.weekNumber;
  booking.rescheduledAt = new Date().toISOString();

  return {
    success: true,
    bookingId: booking.id,
    newStartTime: booking.startTime,
    message: 'Консультацію успішно перенесено на новий часовий слот.',
  };
}

/**
 * Скасування консультації (Cancel)
 */
export function cancelBooking({ bookingId, actor, reason = 'Скасовано користувачем' }) {
  const booking = bookingsStore.find(b => b.id === bookingId);
  if (!booking) throw new Error('Бронювання не знайдено');

  const isAuthorized = actor && (
    actor.id === booking.studentId ||
    actor.id === booking.mentorId ||
    actor.role === ACADEMY_ROLES.ADMIN
  );

  if (!isAuthorized) {
    const err = new Error('Тільки учень, ментор або адміністратор можуть скасувати консультацію');
    err.code = 'UNAUTHORIZED_CANCEL';
    throw err;
  }

  booking.status = 'CANCELLED';
  booking.cancelReason = reason;
  booking.cancelledAt = new Date().toISOString();

  // Звільняємо слот
  const slot = slotsStore.find(s => s.id === booking.slotId);
  if (slot) {
    slot.status = 'AVAILABLE';
    delete slot.bookedBy;
  }

  return {
    success: true,
    bookingId,
    status: 'CANCELLED',
    message: 'Консультацію скасовано, слот знову доступний для інших учнів.',
  };
}

/**
 * Завершення консультації ментором та фіксація нотаток
 */
export function completeOfficeHourSession({
  bookingId,
  mentorUser,
  publicSummary,
  privateNotes,
  followUpJiraTask,
}) {
  if (!mentorUser) throw new Error('mentorUser обов\'язковий');
  const isMentorOrAdmin = mentorUser.role === ACADEMY_ROLES.MENTOR || mentorUser.role === ACADEMY_ROLES.ADMIN;
  if (!isMentorOrAdmin) {
    const err = new Error('Тільки ментори або адміністратори можуть завершувати консультацію');
    err.code = 'UNAUTHORIZED_COMPLETION';
    throw err;
  }

  const booking = bookingsStore.find(b => b.id === bookingId);
  if (!booking) throw new Error('Бронювання не знайдено');

  booking.status = 'COMPLETED';
  booking.publicSummary = publicSummary || 'Консультацію успішно проведено.';
  booking.privateMentorNotes = privateNotes || null; // Ізольовано від учня

  if (followUpJiraTask) {
    booking.followUpJiraTask = followUpJiraTask;
  }

  booking.completedAt = new Date().toISOString();

  return {
    success: true,
    bookingId,
    status: 'COMPLETED',
    publicSummary: booking.publicSummary,
    hasPrivateNotes: Boolean(booking.privateMentorNotes),
  };
}

/**
 * Отримання списку консультацій із захистом приватності (Zero Notes Leakage)
 */
export function getUserBookings({ requestingUser }) {
  if (!requestingUser) return [];

  const isMentorOrAdmin = requestingUser.role === ACADEMY_ROLES.MENTOR || requestingUser.role === ACADEMY_ROLES.ADMIN;

  return bookingsStore
    .filter(b => {
      if (isMentorOrAdmin) return true;
      return b.studentId === requestingUser.id;
    })
    .map(b => {
      // Для учня чи батьків приватні нотатки ментора вилучаються (Privacy Shield)
      if (!isMentorOrAdmin) {
        // eslint-disable-next-line no-unused-vars
        const { privateMentorNotes, ...safeBooking } = b;
        return safeBooking;
      }
      return b;
    });
}

/**
 * Скидання стану для ізоляції тестів
 */
export function _resetOfficeHoursStateForTests() {
  bookingsStore.length = 1; // Залишаємо початковий запис
  slotsStore.forEach(s => {
    s.status = 'AVAILABLE';
    delete s.bookedBy;
  });
}
