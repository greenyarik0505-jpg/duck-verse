import { NextResponse } from 'next/server';
import { verifySignedSessionToken } from '../../../../lib/academy/auth/session';
import {
  REPORT_CATEGORIES,
  MODERATION_ACTIONS,
  submitAiReport,
  getModerationQueue,
  reviewModerationTicket,
  submitTicketAppeal,
  getSafetyEvaluationMetrics,
} from '../../../../lib/academy/safety/moderation';

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
 * GET /api/academy/safety
 */
export async function GET(request) {
  const currentUser = getAuthenticatedUser(request);
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status') || undefined;
  const severityFilter = searchParams.get('severity') || undefined;

  const requestingUser = {
    id: currentUser.userId,
    username: currentUser.username,
    role: currentUser.role,
  };

  try {
    const queue = getModerationQueue({ requestingUser, statusFilter, severityFilter });
    const metrics = getSafetyEvaluationMetrics();

    return NextResponse.json({
      success: true,
      queue,
      metrics,
      categories: REPORT_CATEGORIES,
      actions: MODERATION_ACTIONS,
      currentUser: requestingUser,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message, code: err.code || 'UNKNOWN_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/academy/safety
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
    const { action, ...payload } = body;

    if (action === 'report') {
      const ticket = submitAiReport({
        reporterUser: actor,
        promptText: payload.promptText,
        responseText: payload.responseText,
        category: payload.category,
        userComment: payload.userComment,
        modelId: payload.modelId,
      });
      return NextResponse.json({ success: true, ticket });
    }

    if (action === 'review') {
      const ticket = reviewModerationTicket({
        ticketId: payload.ticketId,
        decision: payload.decision,
        reviewerNotes: payload.reviewerNotes,
        actor,
      });
      return NextResponse.json({ success: true, ticket });
    }

    if (action === 'appeal') {
      const ticket = submitTicketAppeal({
        ticketId: payload.ticketId,
        appealReason: payload.appealReason,
        actor,
      });
      return NextResponse.json({ success: true, ticket });
    }

    return NextResponse.json({ success: false, error: 'Невідома дія (action)' }, { status: 400 });
  } catch (err) {
    const status = err.code?.includes('UNAUTHORIZED') ? 403 : 400;
    return NextResponse.json({ success: false, error: err.message, code: err.code }, { status });
  }
}
