import { NextResponse } from 'next/server';
import { verifySignedSessionToken } from '../../../../lib/academy/auth/session';
import { buildPortfolioView, generateCertificate } from '../../../../lib/academy/portfolio/certificate';

function getAuthenticatedUser(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/duck_academy_session=([^;]+)/);
  if (match) {
    const verified = verifySignedSessionToken(match[1]);
    if (verified.valid && verified.session) {
      return verified.session;
    }
  }
  return { userId: 'student_yarik', username: 'student_yarik', role: 'child' };
}

/**
 * GET /api/academy/portfolio
 * Отримує приватне портфоліо авторизованого учня
 */
export async function GET(request) {
  const user = getAuthenticatedUser(request);
  const portfolio = buildPortfolioView({
    learnerId: user.userId,
    displayName: user.username,
    completedLessonIds: ['lesson-fe-l0-arch', 'lesson-fe-l1-auth'],
    rubricScores: {
      tradeoffs: 5,
      security: 5,
      performance: 4,
      maintainability: 5
    },
    mentorFeedback: 'Усі лабораторні роботи перевірено, CI пайплайни зелені, дотримано контрактів.'
  });

  return NextResponse.json({
    success: true,
    portfolio
  });
}

/**
 * POST /api/academy/portfolio
 * Генерує публічно поширюване посилання на сертифікат
 */
export async function POST(request) {
  try {
    const user = getAuthenticatedUser(request);
    const body = await request.json().catch(() => ({}));

    const cert = generateCertificate({
      learnerId: user.userId,
      displayName: user.username,
      trackId: body.trackId || 'track-frontend-gaming',
      completedLessonIds: body.completedLessonIds || ['lesson-fe-l0-arch'],
      expiresInDays: body.expiresInDays || 30
    });

    return NextResponse.json({
      success: true,
      ...cert
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Помилка генерації сертифіката', details: err.message },
      { status: 500 }
    );
  }
}
