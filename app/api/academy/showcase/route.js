import { NextResponse } from 'next/server';
import { verifySignedSessionToken } from '../../../../lib/academy/auth/session';
import {
  getDemoDayEventInfo,
  submitDemoProject,
  updateParentConsentForShowcase,
  moderateSubmission,
  requestPublicShowcase,
  createShareableShowcaseLink,
  revokeShareableLink,
  verifyShareableLink,
  gradeSubmissionFairnessRubric,
  getSubmissionsList,
} from '../../../../lib/academy/showcase/showcase';

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
 * GET /api/academy/showcase
 */
export async function GET(request) {
  const currentUser = getAuthenticatedUser(request);
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'event';
  const visibility = searchParams.get('visibility');
  const token = searchParams.get('token');

  const requestingUser = {
    id: currentUser.userId,
    username: currentUser.username,
    role: currentUser.role,
  };

  try {
    if (view === 'event') {
      const eventInfo = getDemoDayEventInfo();
      return NextResponse.json({ success: true, event: eventInfo });
    }

    if (view === 'submissions') {
      const submissions = getSubmissionsList({
        requestingUser,
        filterVisibility: visibility,
      });
      return NextResponse.json({ success: true, submissions });
    }

    if (view === 'verify_link') {
      const verification = verifyShareableLink(token);
      return NextResponse.json({ success: true, verification });
    }

    return NextResponse.json({ success: false, error: 'Невідомий параметр view' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/academy/showcase
 */
export async function POST(request) {
  const currentUser = getAuthenticatedUser(request);
  const requestingUser = {
    id: currentUser.userId,
    username: currentUser.username,
    role: currentUser.role,
  };

  try {
    const body = await request.json();
    const { action, submissionId, ...payload } = body;

    if (action === 'submit') {
      const submission = submitDemoProject({
        studentUser: requestingUser,
        ...payload,
      });
      return NextResponse.json({ success: true, submission });
    }

    if (action === 'consent') {
      const result = updateParentConsentForShowcase({
        submissionId,
        parentUser: requestingUser,
        granted: payload.granted,
      });
      return NextResponse.json({ success: true, result });
    }

    if (action === 'moderate') {
      const result = moderateSubmission({
        submissionId,
        moderatorUser: requestingUser,
        decision: payload.decision,
        feedback: payload.feedback,
      });
      return NextResponse.json({ success: true, result });
    }

    if (action === 'request_public') {
      const result = requestPublicShowcase({
        submissionId,
        actor: requestingUser,
      });
      return NextResponse.json({ success: true, result });
    }

    if (action === 'create_link') {
      const link = createShareableShowcaseLink({
        submissionId,
        actor: requestingUser,
        ttlHours: payload.ttlHours || 168,
      });
      return NextResponse.json({ success: true, link });
    }

    if (action === 'revoke_link') {
      const result = revokeShareableLink({
        linkToken: payload.linkToken,
        actor: requestingUser,
      });
      return NextResponse.json({ success: true, result });
    }

    if (action === 'grade') {
      const evaluation = gradeSubmissionFairnessRubric({
        submissionId,
        mentorUser: requestingUser,
        scores: payload.scores,
        feedback: payload.feedback,
      });
      return NextResponse.json({ success: true, evaluation });
    }

    return NextResponse.json(
      { success: false, error: 'Невідома дія (action)' },
      { status: 400 }
    );
  } catch (err) {
    const isSecurityError = err.code?.includes('REQUIRED') || err.code?.includes('UNAUTHORIZED');
    return NextResponse.json(
      { success: false, error: err.message, code: err.code },
      { status: isSecurityError ? 403 : 400 }
    );
  }
}
