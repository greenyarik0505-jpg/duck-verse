import { NextResponse } from 'next/server';
import { verifySignedSessionToken } from '../../../../lib/academy/auth/session';
import {
  getStudentSkillProfile,
  exportSkillAnalytics,
  deleteStudentSkillAnalytics,
} from '../../../../lib/academy/skills/matrix';
import { ACADEMY_ROLES } from '../../../../lib/academy/auth/roles';

function getAuthenticatedUser(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/duck_academy_session=([^;]+)/);
  if (match) {
    const verified = verifySignedSessionToken(match[1]);
    if (verified.valid && verified.session) {
      return verified.session;
    }
  }
  // За замовчуванням гість/демо
  return { userId: 'user_student_duck', username: 'student_duck', role: ACADEMY_ROLES.CHILD };
}

/**
 * GET /api/academy/skills?studentId=...
 * Отримує матрицю компетенцій та аналіз прогалин (Gap Analysis)
 */
export async function GET(request) {
  const currentUser = getAuthenticatedUser(request);
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId') || currentUser.userId;

  // Перевірка IDOR: дитина може бачити тільки свій профіль
  if (currentUser.role === ACADEMY_ROLES.CHILD && studentId !== currentUser.userId) {
    return NextResponse.json(
      { success: false, error: 'Доступ заборонено: неможливо переглядати аналітику іншого учня' },
      { status: 403 }
    );
  }

  const profile = getStudentSkillProfile(studentId, {
    completedLessonIds: ['lesson-fe-l0-arch', 'lesson-fe-l1-canvas'],
    verifiedPrs: [
      { id: 'pr-20', number: 20, title: 'fix: search bar & guest auth', jiraKey: 'SCRUM-15', skills: ['ui', 'git'] },
      { id: 'pr-21', number: 21, title: 'fix: login placeholder', jiraKey: 'SCRUM-15', skills: ['ui', 'security'] },
      { id: 'pr-22', number: 22, title: 'feat: team admin accounts', jiraKey: 'SCRUM-54', skills: ['security', 'api'] },
    ],
    mentorReviews: [
      { id: 'rev-1', rubricScores: { git: 5, ui: 4, api: 4, testing: 5, security: 5, architecture: 4, teamwork: 5 }, feedback: 'Відмінна інженерна дисципліна' },
    ],
  });

  return NextResponse.json({
    success: true,
    data: profile,
  });
}

/**
 * POST /api/academy/skills
 * Оновлення або запис нових свідчень у матрицю
 */
export async function POST(request) {
  const currentUser = getAuthenticatedUser(request);

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Невалідний JSON' }, { status: 400 });
  }

  const studentId = body.studentId || currentUser.userId;

  // Тільки сам учень або ментор/адмін можуть оновлювати
  if (currentUser.role === ACADEMY_ROLES.CHILD && studentId !== currentUser.userId) {
    return NextResponse.json({ success: false, error: 'Доступ заборонено' }, { status: 403 });
  }

  const profile = getStudentSkillProfile(studentId, {
    completedLessonIds: body.completedLessonIds || [],
    verifiedPrs: body.verifiedPrs || [],
    mentorReviews: body.mentorReviews || [],
  });

  return NextResponse.json({
    success: true,
    data: profile,
  });
}

/**
 * DELETE /api/academy/skills?studentId=...
 * Видалення аналітики навичок учня (Privacy & Retention Policy)
 */
export async function DELETE(request) {
  const currentUser = getAuthenticatedUser(request);
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId') || currentUser.userId;

  try {
    const result = deleteStudentSkillAnalytics(studentId, currentUser);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 403 });
  }
}
