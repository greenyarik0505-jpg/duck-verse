import { NextResponse } from 'next/server';
import { verifySignedSessionToken } from '../../../../lib/academy/auth/session';
import {
  createDefaultProgress,
  normalizeProgressState,
  recordLessonCheckpoint,
  markLessonCompleted,
  getLessonProgressState
} from '../../../../lib/academy/progress';

// In-memory серверний кеш прогресу
const serverProgressStore = new Map();

function getUserIdFromRequest(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/duck_academy_session=([^;]+)/);
  if (match) {
    const verified = verifySignedSessionToken(match[1]);
    if (verified.valid && verified.session?.userId) {
      return verified.session.userId;
    }
  }
  // Перевірка заголовка X-Learner-Id для гостьового режиму / тестів
  const headerId = request.headers.get('x-learner-id');
  if (headerId && typeof headerId === 'string' && headerId.trim()) {
    return headerId.trim();
  }
  return 'guest';
}

/**
 * GET /api/academy/progress
 * Отримує поточний стан прогресу учня
 */
export async function GET(request) {
  const userId = getUserIdFromRequest(request);
  let progress = serverProgressStore.get(userId);
  if (!progress) {
    progress = createDefaultProgress(userId);
    serverProgressStore.set(userId, progress);
  } else {
    progress = normalizeProgressState(progress, userId);
  }

  return NextResponse.json({
    success: true,
    progress
  });
}

/**
 * POST /api/academy/progress
 * Оновлює чекпоінт або фіксує виконання уроку
 */
export async function POST(request) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Порожній або невалідний JSON' },
        { status: 400 }
      );
    }

    const { lessonId, action, step, stepData } = body;

    if (!lessonId || typeof lessonId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Поле lessonId є обов\'язковим' },
        { status: 400 }
      );
    }

    let progress = serverProgressStore.get(userId) || createDefaultProgress(userId);

    if (action === 'complete') {
      progress = markLessonCompleted(progress, lessonId);
    } else if (action === 'checkpoint' || !action) {
      try {
        progress = recordLessonCheckpoint(progress, lessonId, step || 0, stepData);
      } catch (err) {
        return NextResponse.json(
          { success: false, error: err.message },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: `Невідома дія: '${action}'` },
        { status: 400 }
      );
    }

    serverProgressStore.set(userId, progress);

    return NextResponse.json({
      success: true,
      progress,
      lessonState: getLessonProgressState(lessonId, progress)
    });
  } catch (err) {
    console.error('[API /academy/progress POST] Помилка:', err);
    return NextResponse.json(
      { success: false, error: 'Помилка збереження прогресу', details: err.message },
      { status: 500 }
    );
  }
}
