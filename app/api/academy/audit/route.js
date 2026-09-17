import { NextResponse } from 'next/server';
import { verifySignedSessionToken } from '../../../../lib/academy/auth/session';
import {
  AUDIT_EVENT_TYPES,
  recordAuditEvent,
  getAuditEvents,
  generateMachineReadableExport,
  executeAccountDeletion,
  getRetentionPolicies,
} from '../../../../lib/academy/audit/compliance';

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
 * GET /api/academy/audit
 */
export async function GET(request) {
  const currentUser = getAuthenticatedUser(request);
  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'events';
  const eventType = searchParams.get('eventType');
  const targetUserId = searchParams.get('targetUserId') || currentUser.userId;

  const requestingUser = {
    id: currentUser.userId,
    username: currentUser.username,
    role: currentUser.role,
  };

  try {
    if (view === 'export') {
      const exportData = generateMachineReadableExport({
        targetUserId,
        requestingUser,
      });
      return NextResponse.json({ success: true, export: exportData });
    }

    if (view === 'retention') {
      const policies = getRetentionPolicies();
      return NextResponse.json({ success: true, policies });
    }

    // Default: view === 'events'
    const events = getAuditEvents({
      requestingUser,
      filterEventType: eventType,
      limit: 50,
    });

    return NextResponse.json({ success: true, events });
  } catch (err) {
    const status = err.code === 'UNAUTHORIZED_AUDIT_ACCESS' || err.code === 'UNAUTHORIZED_EXPORT_ACCESS' ? 403 : 400;
    return NextResponse.json(
      { success: false, error: err.message, code: err.code },
      { status }
    );
  }
}

/**
 * POST /api/academy/audit
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
    const { action, targetUserId, eventType, metadata, confirmationToken, reason } = body;

    if (action === 'export') {
      const exportData = generateMachineReadableExport({
        targetUserId: targetUserId || currentUser.userId,
        requestingUser,
      });
      return NextResponse.json({ success: true, export: exportData });
    }

    if (action === 'delete') {
      const deletionResult = executeAccountDeletion({
        targetUserId: targetUserId || currentUser.userId,
        requestingUser,
        confirmationToken,
        reason,
      });
      return NextResponse.json({ success: true, result: deletionResult });
    }

    if (action === 'log') {
      const event = recordAuditEvent({
        eventType: eventType || AUDIT_EVENT_TYPES.REVIEW_ACCESS,
        actor: requestingUser,
        targetUserId: targetUserId || currentUser.userId,
        metadata: metadata || {},
      });
      return NextResponse.json({ success: true, event });
    }

    return NextResponse.json(
      { success: false, error: 'Невідома дія (action). Допустимі: export, delete, log' },
      { status: 400 }
    );
  } catch (err) {
    const status = err.code?.startsWith('UNAUTHORIZED') ? 403 : 400;
    return NextResponse.json(
      { success: false, error: err.message, code: err.code },
      { status }
    );
  }
}
