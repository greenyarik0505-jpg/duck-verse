import { NextResponse } from 'next/server';
import { verifySignedSessionToken } from '../../../../lib/academy/auth/session';
import {
  AVAILABLE_GOALS,
  ELECTIVES_CATALOG,
  getStudentLearningPlan,
  updateLearningPlanGoals,
  updateSelectedElectives,
  requestPrerequisiteException,
  reviewPrerequisiteException,
  calculateAdaptiveNextStep,
} from '../../../../lib/academy/learning_plan/plan';

function getAuthenticatedUser(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/duck_academy_session=([^;]+)/);
  if (match) {
    const verified = verifySignedSessionToken(match[1]);
    if (verified.valid && verified.session) {
      return verified.session;
    }
  }
  return { userId: 'student_eva_01', username: 'Eva Coder', role: 'student' };
}

/**
 * GET /api/academy/learning-plan
 */
export async function GET(request) {
  const currentUser = getAuthenticatedUser(request);
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId') || currentUser.userId;

  // Можемо отримати список пройдених уроків з параметрів або дефолт
  const completedParam = searchParams.get('completedLessons');
  const completedLessons = completedParam ? completedParam.split(',').filter(Boolean) : ['lesson-fe-l0-arch'];

  try {
    const plan = getStudentLearningPlan({ studentId, completedLessons });
    const nextStep = calculateAdaptiveNextStep({ studentId, completedLessons });

    return NextResponse.json({
      success: true,
      plan,
      availableGoals: AVAILABLE_GOALS,
      electivesCatalog: ELECTIVES_CATALOG,
      nextStep,
      currentUser,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message, code: err.code || 'UNKNOWN_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/academy/learning-plan
 */
export async function POST(request) {
  const currentUser = getAuthenticatedUser(request);
  const actor = {
    id: currentUser.userId,
    username: currentUser.username,
    role: currentUser.role,
  };

  try {
    const body = await request.json();
    const { action, studentId = actor.id, ...payload } = body;

    if (action === 'update_goals') {
      const updatedPlan = updateLearningPlanGoals({
        studentId,
        targetGoal: payload.targetGoal,
        targetWeeklyHours: payload.targetWeeklyHours,
        actor,
      });
      return NextResponse.json({ success: true, plan: updatedPlan });
    }

    if (action === 'select_electives') {
      const updatedPlan = updateSelectedElectives({
        studentId,
        electiveIds: payload.electiveIds,
        completedLessons: payload.completedLessons || ['lesson-fe-l0-arch'],
        actor,
      });
      return NextResponse.json({ success: true, plan: updatedPlan });
    }

    if (action === 'request_exception') {
      const exception = requestPrerequisiteException({
        studentId,
        electiveId: payload.electiveId,
        explanation: payload.explanation,
        actor,
      });
      return NextResponse.json({ success: true, exception });
    }

    if (action === 'review_exception') {
      const result = reviewPrerequisiteException({
        exceptionId: payload.exceptionId,
        decision: payload.decision,
        reviewerNotes: payload.reviewerNotes,
        mentorUser: actor,
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ success: false, error: 'Невідома дія (action)' }, { status: 400 });
  } catch (err) {
    let status = 400;
    if (err.code === 'PREREQUISITES_NOT_MET') {
      status = 409;
    } else if (err.code?.includes('UNAUTHORIZED')) {
      status = 403;
    }
    return NextResponse.json(
      { success: false, error: err.message, code: err.code, missingPrerequisites: err.missingPrerequisites },
      { status }
    );
  }
}
