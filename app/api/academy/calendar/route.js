import { NextResponse } from 'next/server';
import { verifySignedSessionToken } from '../../../../lib/academy/auth/session';
import { ACADEMY_ROLES } from '../../../../lib/academy/auth/roles';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  getStudentNotifications,
  dismissNotification,
  getStudentCalendarEvents,
  triggerReminder,
  getDeliveryHistory,
} from '../../../../lib/academy/calendar/notifications';

function getAuthenticatedUser(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/duck_academy_session=([^;]+)/);
  if (match) {
    const verified = verifySignedSessionToken(match[1]);
    if (verified.valid && verified.session) {
      return verified.session;
    }
  }
  return { userId: 'user_guest', username: 'Гість', role: 'guest' };
}

/**
 * GET /api/academy/calendar
 */
export async function GET(request) {
  const currentUser = getAuthenticatedUser(request);
  const { searchParams } = new URL(request.url);
  const requestedId = searchParams.get('studentId');
  const studentId = requestedId || currentUser.userId;
  const timezone = searchParams.get('timezone') || 'Europe/Kyiv';

  // IDOR Protection: учень бачить лише свої нагадування
  if (currentUser.role === ACADEMY_ROLES.CHILD && requestedId && requestedId !== currentUser.userId) {
    return NextResponse.json(
      { success: false, error: 'Доступ заборонено: неможливо переглядати нагадування іншого учня' },
      { status: 403 }
    );
  }

  try {
    const preferences = getNotificationPreferences(studentId);
    const notifications = getStudentNotifications(studentId);
    const events = getStudentCalendarEvents({ userId: studentId, timezone: preferences.timezone || timezone });
    const history = getDeliveryHistory(studentId);

    return NextResponse.json({
      success: true,
      data: {
        studentId,
        timezone: preferences.timezone || timezone,
        preferences,
        notifications,
        events,
        history,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || 'Помилка отримання даних календаря' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/academy/calendar
 */
export async function POST(request) {
  const currentUser = getAuthenticatedUser(request);
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Невалідний JSON запиту' }, { status: 400 });
  }

  const { action, studentId: requestedId, updates, notificationId, reminderData } = body;
  const studentId = requestedId || currentUser.userId;

  // IDOR Protection
  if (currentUser.role === ACADEMY_ROLES.CHILD && requestedId && requestedId !== currentUser.userId) {
    return NextResponse.json(
      { success: false, error: 'Доступ заборонено: неможливо змінювати налаштування іншого учня' },
      { status: 403 }
    );
  }

  try {
    switch (action) {
      case 'update_preferences': {
        const updated = updateNotificationPreferences(studentId, updates);
        return NextResponse.json({ success: true, preferences: updated });
      }

      case 'dismiss_notification': {
        if (!notificationId) {
          return NextResponse.json({ success: false, error: 'notificationId обов\'язковий' }, { status: 400 });
        }
        const res = dismissNotification(studentId, notificationId);
        return NextResponse.json({ success: true, ...res });
      }

      case 'trigger_reminder': {
        if (!reminderData) {
          return NextResponse.json({ success: false, error: 'reminderData обов\'язковий' }, { status: 400 });
        }
        const result = triggerReminder({
          userId: studentId,
          ...reminderData,
          requestingUser: currentUser,
        });
        return NextResponse.json({ success: true, result });
      }

      case 'revoke_consent': {
        const updated = updateNotificationPreferences(studentId, { consentRevoked: true });
        return NextResponse.json({ success: true, preferences: updated });
      }

      case 'restore_consent': {
        const updated = updateNotificationPreferences(studentId, { consentRevoked: false });
        return NextResponse.json({ success: true, preferences: updated });
      }

      default:
        return NextResponse.json({ success: false, error: `Невідома дія: ${action}` }, { status: 400 });
    }
  } catch (err) {
    const status = err.code === 'UNAUTHORIZED_STUDENT_ACCESS' ? 403 : 400;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
