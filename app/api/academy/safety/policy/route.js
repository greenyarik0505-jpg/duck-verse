import { NextResponse } from 'next/server';
import {
  getSafetyPolicySnapshot,
  checkModelAccess,
  checkToolAccess,
  requestPrivilegedToolAccess,
  reviewPrivilegedToolAccess,
  revokePrivilegeGrant,
  checkAndConsumeQuota,
  updatePolicyVersion,
  canViewUserAiHistory,
} from '@/lib/academy/safety/child_policy.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'student-yurko';
    const role = searchParams.get('role') || 'child';
    const name = searchParams.get('name') || 'Юрко (Учень)';

    const snapshot = getSafetyPolicySnapshot({ id: userId, role, name });
    return NextResponse.json({ success: true, ...snapshot });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || 'Помилка отримання політики безпеки' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'check_model_access': {
        const { actor, modelId } = body;
        const result = checkModelAccess(actor, modelId);
        return NextResponse.json({ success: true, result });
      }

      case 'check_tool_access': {
        const { actor, toolId } = body;
        const result = checkToolAccess(actor, toolId);
        return NextResponse.json({ success: true, result });
      }

      case 'request_tool_access': {
        const { studentId, studentName, toolId, reason, actor } = body;
        const newRequest = requestPrivilegedToolAccess({ studentId, studentName, toolId, reason, actor });
        return NextResponse.json({ success: true, request: newRequest });
      }

      case 'review_tool_access': {
        const { requestId, reviewer, decision, notes, durationHours } = body;
        const outcome = reviewPrivilegedToolAccess({ requestId, reviewer, decision, notes, durationHours });
        return NextResponse.json({ success: true, ...outcome });
      }

      case 'revoke_grant': {
        const { grantId, revoker } = body;
        const grant = revokePrivilegeGrant(grantId, revoker);
        return NextResponse.json({ success: true, grant });
      }

      case 'consume_quota': {
        const { userId, role, requestedTokens } = body;
        const outcome = checkAndConsumeQuota(userId, role, requestedTokens);
        return NextResponse.json({ success: outcome.allowed, ...outcome });
      }

      case 'update_policy': {
        const { newVersion, adminActor, updateDetails } = body;
        const policy = updatePolicyVersion(newVersion, adminActor, updateDetails);
        return NextResponse.json({ success: true, policy });
      }

      case 'check_history_access': {
        const { viewer, targetUserId, relations } = body;
        const allowed = canViewUserAiHistory(viewer, targetUserId, relations);
        return NextResponse.json({ success: true, allowed });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Невідома дія (action): ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    const status = error.message && error.message.includes('не має права') ? 403 : 400;
    return NextResponse.json(
      { success: false, error: error.message || 'Помилка виконання операції безпеки' },
      { status }
    );
  }
}
