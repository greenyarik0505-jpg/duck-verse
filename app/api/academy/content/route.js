import { NextResponse } from 'next/server';
import { verifySignedSessionToken } from '../../../../lib/academy/auth/session';
import { ACADEMY_ROLES } from '../../../../lib/academy/auth/roles';
import {
  CONTENT_STATES,
  createDraft,
  submitForReview,
  approveDraft,
  publishContent,
  rollbackLesson,
  deprecateLesson,
  getLessonContentDetails,
  getFullPublishAuditLog,
  getStudentVisibleCurriculum,
  calculateContentDiff,
  validateQualityGates,
} from '../../../../lib/academy/content/workflow';

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
 * GET /api/academy/content
 */
export async function GET(request) {
  const user = getAuthenticatedUser(request);
  const { searchParams } = new URL(request.url);
  const lessonId = searchParams.get('lessonId');
  const action = searchParams.get('action');

  try {
    if (action === 'audit') {
      const logs = getFullPublishAuditLog();
      return NextResponse.json({ success: true, logs });
    }

    if (action === 'curriculum') {
      const curriculum = getStudentVisibleCurriculum(user.role);
      return NextResponse.json({ success: true, curriculum });
    }

    if (lessonId) {
      const details = getLessonContentDetails(lessonId);
      return NextResponse.json({ success: true, details });
    }

    // За замовчуванням повертаємо деталі першого уроку
    const details = getLessonContentDetails('lesson-fe-l0-arch');
    return NextResponse.json({ success: true, details });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || 'Помилка отримання контенту' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/academy/content
 */
export async function POST(request) {
  const user = getAuthenticatedUser(request);
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Невалідний JSON у запиті' }, { status: 400 });
  }

  const { action, lessonId, draftId, updates, scheduleAt, targetVersion, replacementLessonId, reason } = body;
  if (!action) {
    return NextResponse.json({ success: false, error: 'Параметр action обов\'язковий' }, { status: 400 });
  }

  try {
    switch (action) {
      case 'create_draft': {
        const draft = createDraft({
          lessonId,
          updates,
          author: { id: user.userId || user.id, username: user.username, role: user.role },
        });
        return NextResponse.json({ success: true, draft });
      }

      case 'submit_review': {
        const submitted = submitForReview({
          lessonId,
          draftId,
          actor: { id: user.userId || user.id, username: user.username, role: user.role },
        });
        return NextResponse.json({ success: true, draft: submitted });
      }

      case 'approve': {
        // Перевірка привілеїв: тільки ментор або адмін
        const actorRole = user.role;
        if (actorRole !== ACADEMY_ROLES.MENTOR && actorRole !== ACADEMY_ROLES.ADMIN) {
          return NextResponse.json(
            { success: false, error: 'Доступ заборонено: схвалювати контент можуть лише ментори або адміністратори' },
            { status: 403 }
          );
        }

        const approved = approveDraft({
          lessonId,
          draftId,
          reviewer: { id: user.userId || user.id, username: user.username, role: user.role },
        });
        return NextResponse.json({ success: true, draft: approved });
      }

      case 'publish': {
        const actorRole = user.role;
        if (actorRole !== ACADEMY_ROLES.MENTOR && actorRole !== ACADEMY_ROLES.ADMIN) {
          return NextResponse.json(
            { success: false, error: 'Доступ заборонено: публікувати контент можуть лише ментори або адміністратори' },
            { status: 403 }
          );
        }

        const published = publishContent({
          lessonId,
          draftId,
          publisher: { id: user.userId || user.id, username: user.username, role: user.role },
          scheduleAt,
        });
        return NextResponse.json({ success: true, published });
      }

      case 'rollback': {
        const actorRole = user.role;
        if (actorRole !== ACADEMY_ROLES.MENTOR && actorRole !== ACADEMY_ROLES.ADMIN) {
          return NextResponse.json(
            { success: false, error: 'Доступ заборонено: відкочувати версії можуть лише ментори або адміністратори' },
            { status: 403 }
          );
        }

        const rolledBack = rollbackLesson({
          lessonId,
          targetVersion,
          actor: { id: user.userId || user.id, username: user.username, role: user.role },
          reason,
        });
        return NextResponse.json({ success: true, rollback: rolledBack });
      }

      case 'deprecate': {
        if (user.role !== ACADEMY_ROLES.ADMIN) {
          return NextResponse.json(
            { success: false, error: 'Доступ заборонено: виводити з експлуатації уроки можуть лише адміністратори' },
            { status: 403 }
          );
        }

        const deprecated = deprecateLesson({
          lessonId,
          actor: { id: user.userId || user.id, username: user.username, role: user.role },
          reason,
          replacementLessonId,
        });
        return NextResponse.json({ success: true, deprecation: deprecated });
      }

      default:
        return NextResponse.json({ success: false, error: `Невідома дія: ${action}` }, { status: 400 });
    }
  } catch (err) {
    const status = err.code === 'AUTHOR_CANNOT_APPROVE' || err.code === 'QUALITY_GATES_FAILED' ? 422 : 400;
    return NextResponse.json(
      { success: false, error: err.message, code: err.code, errors: err.errors },
      { status }
    );
  }
}
