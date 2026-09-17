/**
 * Duck Academy — Notifications, Reminders & Learning Calendar (SCRUM-85)
 *
 * Призначення:
 * 1. In-app reminders з обов'язковим зв'язком із source task (SCRUM-XX) та next action.
 * 2. Дедуплікація сповіщень (idempotency key) для запобігання спаму при reload/retry.
 * 3. Learning Calendar із підтримкою часових поясів (timezone) та подій (уроки, рев'ю, ретро).
 * 4. Тихі години (Quiet Hours 22:00–08:00) та миттєве відкликання згоди (Revoke Consent).
 * 5. Захист від витоку чужих або приватних задач (Zero IDOR leakage).
 */

import crypto from 'crypto';
import { ACADEMY_ROLES } from '../auth/roles.js';

export const EVENT_TYPES = {
  LESSON_DEADLINE: 'lesson_deadline',
  MENTOR_REVIEW: 'mentor_review',
  RETROSPECTIVE: 'retrospective',
  TASK_BLOCKER: 'task_blocker',
};

export const DELIVERY_STATUS = {
  DELIVERED: 'DELIVERED',
  SUPPRESSED_DUPLICATE: 'SUPPRESSED_DUPLICATE',
  SUPPRESSED_QUIET_HOURS: 'SUPPRESSED_QUIET_HOURS',
  SUPPRESSED_REVOKED_CONSENT: 'SUPPRESSED_REVOKED_CONSENT',
  DISMISSED: 'DISMISSED',
};

// In-memory сховища (відокремлено від операційних логів)
const userPreferencesStore = new Map();
const userNotificationsStore = new Map();
const sentKeysCache = new Set();
const deliveryHistoryStore = new Map();

/**
 * Отримання або ініціалізація дефолтних налаштувань сповіщень
 */
export function getNotificationPreferences(userId) {
  if (!userId) throw new Error('userId обов\'язковий');
  
  if (!userPreferencesStore.has(userId)) {
    userPreferencesStore.set(userId, {
      userId,
      timezone: 'Europe/Kyiv',
      quietHours: {
        enabled: true,
        startHour: 22, // 22:00
        endHour: 8,    // 08:00
      },
      consentRevoked: false,
      channels: {
        inApp: true,
        browserBadge: true,
      },
      updatedAt: new Date().toISOString(),
    });
  }

  return userPreferencesStore.get(userId);
}

/**
 * Оновлення налаштувань сповіщень користувача
 */
export function updateNotificationPreferences(userId, updates = {}) {
  const current = getNotificationPreferences(userId);
  const updated = {
    ...current,
    ...updates,
    quietHours: {
      ...current.quietHours,
      ...(updates.quietHours || {}),
    },
    channels: {
      ...current.channels,
      ...(updates.channels || {}),
    },
    updatedAt: new Date().toISOString(),
  };

  userPreferencesStore.set(userId, updated);
  return updated;
}

/**
 * Генерація унікального детермінованого idempotency ключа
 */
export function generateIdempotencyKey({ userId, sourceTaskId, eventType, dateStr }) {
  const raw = `${userId}:${sourceTaskId}:${eventType}:${dateStr}`;
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 24);
}

/**
 * Перевірка, чи активні тихі години (Quiet Hours) у часовому поясі користувача
 *
 * @param {Object} preferences Налаштування користувача
 * @param {Date} checkDate Дата для перевірки (за замовчуванням поточний час)
 * @returns {boolean} True, якщо зараз тихі години
 */
export function isQuietHoursActive(preferences, checkDate = new Date()) {
  if (!preferences?.quietHours?.enabled) {
    return false;
  }

  const { startHour, endHour, timezone = 'Europe/Kyiv' } = {
    ...preferences.quietHours,
    timezone: preferences.timezone || 'Europe/Kyiv',
  };

  // Визначаємо поточну годину в зазначеному часовому поясі
  let hourInTimezone;
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone: timezone,
    });
    hourInTimezone = parseInt(formatter.format(checkDate), 10);
    // Обробка значення 24 у деяких середовищах
    if (hourInTimezone === 24) hourInTimezone = 0;
  } catch {
    // Фолбек на UTC
    hourInTimezone = checkDate.getUTCHours();
  }

  // Якщо нічний інтервал перетинає північ (наприклад 22:00 -> 08:00)
  if (startHour > endHour) {
    return hourInTimezone >= startHour || hourInTimezone < endHour;
  }

  // Якщо інтервал у межах однієї доби (наприклад 01:00 -> 06:00)
  return hourInTimezone >= startHour && hourInTimezone < endHour;
}

/**
 * Створення та доставка нагадування з перевіркою дедуплікації, тихих годин та IDOR
 */
export function triggerReminder({
  userId,
  eventType,
  sourceTaskId,
  title,
  message,
  nextAction,
  eventDate = new Date().toISOString().split('T')[0],
  requestingUser = null,
  overrideDate = null, // Для тестування тихих годин
}) {
  if (!userId) throw new Error('userId обов\'язковий');
  if (!sourceTaskId) throw new Error('sourceTaskId (SCRUM-XX) обов\'язковий');
  if (!nextAction || !nextAction.label || !nextAction.actionUrl) {
    throw new Error('nextAction повинен містити label та actionUrl');
  }

  // 1. Перевірка IDOR: дитина не може отримувати або тригерити сповіщення для іншого учня
  if (requestingUser && requestingUser.role === ACADEMY_ROLES.CHILD && requestingUser.id !== userId) {
    const err = new Error('Доступ заборонено: неможливо взаємодіяти зі сповіщеннями іншого учня');
    err.code = 'UNAUTHORIZED_STUDENT_ACCESS';
    throw err;
  }

  const prefs = getNotificationPreferences(userId);

  // 2. Перевірка відкликання згоди (Consent Revoked)
  if (prefs.consentRevoked) {
    const suppressedResult = {
      status: DELIVERY_STATUS.SUPPRESSED_REVOKED_CONSENT,
      reason: 'Користувач відкликав згоду на отримання сповіщень',
      userId,
      sourceTaskId,
      timestamp: new Date().toISOString(),
    };
    logDelivery(userId, suppressedResult);
    return suppressedResult;
  }

  // 3. Перевірка дедуплікації (Zero-Spam Deduplication)
  const idempotencyKey = generateIdempotencyKey({
    userId,
    sourceTaskId,
    eventType,
    dateStr: eventDate,
  });

  if (sentKeysCache.has(idempotencyKey)) {
    const duplicateResult = {
      status: DELIVERY_STATUS.SUPPRESSED_DUPLICATE,
      idempotencyKey,
      reason: 'Повторне сповіщення придушено: повідомлення вже доставлено сьогодні',
      userId,
      sourceTaskId,
      timestamp: new Date().toISOString(),
    };
    logDelivery(userId, duplicateResult);
    return duplicateResult;
  }

  // 4. Перевірка тихих годин (Quiet Hours)
  const checkTime = overrideDate ? new Date(overrideDate) : new Date();
  if (isQuietHoursActive(prefs, checkTime)) {
    const quietResult = {
      status: DELIVERY_STATUS.SUPPRESSED_QUIET_HOURS,
      reason: `Доставку призупинено: активні тихі години (${prefs.quietHours.startHour}:00–${prefs.quietHours.endHour}:00 ${prefs.timezone})`,
      userId,
      sourceTaskId,
      timestamp: new Date().toISOString(),
    };
    logDelivery(userId, quietResult);
    return quietResult;
  }

  // 5. Успішна доставка (Delivered)
  const notification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    idempotencyKey,
    userId,
    eventType,
    sourceTaskId,
    title,
    message,
    nextAction,
    deliveredAt: new Date().toISOString(),
    read: false,
    dismissed: false,
  };

  sentKeysCache.add(idempotencyKey);

  if (!userNotificationsStore.has(userId)) {
    userNotificationsStore.set(userId, []);
  }
  userNotificationsStore.get(userId).unshift(notification);

  const deliveryResult = {
    status: DELIVERY_STATUS.DELIVERED,
    notification,
    timestamp: notification.deliveredAt,
  };
  logDelivery(userId, deliveryResult);

  return deliveryResult;
}

function logDelivery(userId, result) {
  if (!deliveryHistoryStore.has(userId)) {
    deliveryHistoryStore.set(userId, []);
  }
  deliveryHistoryStore.get(userId).unshift(result);
}

/**
 * Отримання активних (не відхилених) сповіщень користувача
 */
export function getStudentNotifications(userId) {
  if (!userId) return [];
  const list = userNotificationsStore.get(userId) || [];
  return list.filter(n => !n.dismissed);
}

/**
 * Відхилення або позначення сповіщення як прочитаного
 */
export function dismissNotification(userId, notificationId) {
  const list = userNotificationsStore.get(userId) || [];
  const target = list.find(n => n.id === notificationId);
  if (target) {
    target.dismissed = true;
    target.read = true;
    return { success: true, notificationId };
  }
  return { success: false, error: 'Сповіщення не знайдено' };
}

/**
 * Генератор персоналізованих подій навчального календаря (Learning Calendar)
 */
export function getStudentCalendarEvents({ userId, timezone = 'Europe/Kyiv' }) {
  const baseDate = new Date();
  const formatOffsetDate = (offsetDays, hour, minute) => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + offsetDays);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  };

  return [
    {
      id: 'cal-event-1',
      title: 'Дедлайн: [SCRUM-56] Curriculum Registry & Feature Architecture',
      eventType: EVENT_TYPES.LESSON_DEADLINE,
      sourceTaskId: 'SCRUM-56',
      start: formatOffsetDate(1, 18, 0),
      end: formatOffsetDate(1, 19, 0),
      timezone,
      status: 'upcoming',
      nextAction: {
        label: 'Перейти до уроку',
        actionUrl: '/academy#lesson-fe-l0-arch',
      },
    },
    {
      id: 'cal-event-2',
      title: 'Код-рев’ю: [SCRUM-57] Senior Mentor Rubric Checkpoint',
      eventType: EVENT_TYPES.MENTOR_REVIEW,
      sourceTaskId: 'SCRUM-57',
      start: formatOffsetDate(3, 16, 30),
      end: formatOffsetDate(3, 17, 30),
      timezone,
      status: 'scheduled',
      nextAction: {
        label: 'Відкрити рубрику рев’ю',
        actionUrl: '/academy#rubric-checkpoint',
      },
    },
    {
      id: 'cal-event-3',
      title: 'Командна Ретроспектива Спринту (Duck Verse Team)',
      eventType: EVENT_TYPES.RETROSPECTIVE,
      sourceTaskId: 'SCRUM-70',
      start: formatOffsetDate(5, 19, 0),
      end: formatOffsetDate(5, 20, 0),
      timezone,
      status: 'scheduled',
      nextAction: {
        label: 'Переглянути Roadmap',
        actionUrl: '/academy#roadmap',
      },
    },
    {
      id: 'cal-event-4',
      title: 'Блокер передумов: Необхідно закрити PR для SCRUM-54',
      eventType: EVENT_TYPES.TASK_BLOCKER,
      sourceTaskId: 'SCRUM-54',
      start: formatOffsetDate(0, 14, 0),
      end: formatOffsetDate(0, 15, 0),
      timezone,
      status: 'action_required',
      nextAction: {
        label: 'Виправити зауваження PR',
        actionUrl: 'https://github.com/greenyarik0505-jpg/duck-verse/pulls',
      },
    },
  ];
}

/**
 * Отримання історії доставки сповіщень
 */
export function getDeliveryHistory(userId) {
  return deliveryHistoryStore.get(userId) || [];
}
