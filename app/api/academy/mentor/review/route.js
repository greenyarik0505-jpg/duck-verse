import { NextResponse } from 'next/server';
import { verifySignedSessionToken, COOKIE_CONFIG } from '../../../../../lib/academy/auth/session';
import { ACADEMY_ROLES } from '../../../../../lib/academy/auth/roles';
import { createReview, getStudentReviews } from '../../../../../lib/academy/mentor/rubric';

export async function POST(request) {
  try {
    const sessionCookie = request.cookies.get(COOKIE_CONFIG.name);
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ error: 'Потрібна авторизація' }, { status: 401 });
    }

    const { valid, session } = verifySignedSessionToken(sessionCookie.value);
    if (!valid || !session) {
      return NextResponse.json({ error: 'Недійсна сесія' }, { status: 401 });
    }

    // Лише mentor або admin мають право виставляти оцінки (захист від vertical privilege escalation)
    if (session.role !== ACADEMY_ROLES.MENTOR && session.role !== ACADEMY_ROLES.ADMIN) {
      return NextResponse.json(
        {
          error: 'VERTICAL_PRIVILEGE_VIOLATION',
          message: 'Тільки ментор або адміністратор має право проводити code-review',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { studentId, lessonId, scores, feedback, severity, nextAction } = body;

    const review = createReview({
      mentorId: session.userId,
      studentId: studentId || 'user_student_yarik',
      lessonId: lessonId || 'lesson-fe-l1-auth',
      scores,
      feedback,
      severity,
      nextAction,
    });

    return NextResponse.json({ success: true, review });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Помилка збереження code review' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  const sessionCookie = request.cookies.get(COOKIE_CONFIG.name);
  if (!sessionCookie || !sessionCookie.value) {
    return NextResponse.json({ error: 'Потрібна авторизація' }, { status: 401 });
  }

  const { valid, session } = verifySignedSessionToken(sessionCookie.value);
  if (!valid || !session) {
    return NextResponse.json({ error: 'Недійсна сесія' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const targetStudentId = searchParams.get('studentId') || session.userId;

  // Дитина може переглядати ТІЛЬКИ власні відгуки ментора (Horizontal Access Protection)
  if (session.role === ACADEMY_ROLES.CHILD && targetStudentId !== session.userId) {
    return NextResponse.json(
      {
        error: 'HORIZONTAL_PRIVILEGE_VIOLATION',
        message: 'Учень не має права переглядати оцінки інших учнів',
      },
      { status: 403 }
    );
  }

  const reviews = getStudentReviews(targetStudentId);
  return NextResponse.json({ success: true, reviews });
}
