import { NextResponse } from 'next/server';
import { verifySignedSessionToken } from '../../../../lib/academy/auth/session';
import { ACADEMY_ROLES } from '../../../../lib/academy/auth/roles';
import {
  generateWeeklyProgressReport,
  createGuardianInvite,
  acceptGuardianInvite,
  revokeGuardianAccess,
  getStudentGuardians,
  getChildrenForParent,
  getPortalAuditLog,
} from '../../../../lib/academy/portal/guardian';

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
 * GET /api/academy/portal
 */
export async function GET(request) {
  const currentUser = getAuthenticatedUser(request);
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'report';
  const requestedStudentId = searchParams.get('studentId');
  const studentId = requestedStudentId || currentUser.userId;

  try {
    if (view === 'report') {
      const report = generateWeeklyProgressReport({
        studentId,
        requestingUser: {
          id: currentUser.userId,
          username: currentUser.username,
          role: currentUser.role,
        },
      });
      return NextResponse.json({ success: true, report });
    }

    if (view === 'guardians') {
      const guardians = getStudentGuardians(studentId);
      return NextResponse.json({ success: true, guardians });
    }

    if (view === 'children') {
      const children = getChildrenForParent(currentUser.userId);
      return NextResponse.json({ success: true, children });
    }

    if (view === 'audit') {
      const logs = getPortalAuditLog();
      return NextResponse.json({ success: true, logs });
    }

    return NextResponse.json({ success: false, error: `Невідомий view: ${view}` }, { status: 400 });
  } catch (err) {
    const status = err.code === 'UNAUTHORIZED_PARENT_ACCESS' ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

/**
 * POST /api/academy/portal
 */
export async function POST(request) {
  const currentUser = getAuthenticatedUser(request);
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Невалідний JSON запиту' }, { status: 400 });
  }

  const { action, studentId: reqStudentId, parentEmail, relation, token, parentId } = body;
  const studentId = reqStudentId || currentUser.userId;

  try {
    switch (action) {
      case 'create_invite': {
        const invite = createGuardianInvite({
          studentId,
          parentEmail,
          relation,
          actor: { id: currentUser.userId, username: currentUser.username },
        });
        return NextResponse.json({ success: true, invite });
      }

      case 'accept_invite': {
        const result = acceptGuardianInvite({
          token,
          parentUser: { id: currentUser.userId, username: currentUser.username },
        });
        return NextResponse.json({ success: true, ...result });
      }

      case 'revoke_access': {
        const result = revokeGuardianAccess({
          studentId,
          parentId,
          actor: { id: currentUser.userId, username: currentUser.username },
        });
        return NextResponse.json({ success: true, ...result });
      }

      default:
        return NextResponse.json({ success: false, error: `Невідома дія: ${action}` }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
