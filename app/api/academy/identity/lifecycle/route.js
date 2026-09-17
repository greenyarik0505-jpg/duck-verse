import { NextResponse } from 'next/server';
import {
  getAccounts,
  getInvites,
  getAuditLogs,
  createInvite,
  revokeInvite,
  suspendAccount,
  reactivateAccount,
  verifyAccountAccess,
  executeBulkLifecycleAction,
  RBAC_LIFECYCLE_MATRIX,
  ACCOUNT_STATUS,
  INVITE_STATUS,
  ROLES,
} from '@/lib/academy/identity/lifecycle_admin';

export async function GET() {
  try {
    const accounts = getAccounts();
    const invites = getInvites();
    const auditLogs = getAuditLogs();
    return NextResponse.json({
      success: true,
      accounts,
      invites,
      auditLogs,
      rbacMatrix: RBAC_LIFECYCLE_MATRIX,
      accountStatusEnum: ACCOUNT_STATUS,
      inviteStatusEnum: INVITE_STATUS,
      rolesEnum: ROLES,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'create_invite') {
      const { email, role, ttlHours, actor } = body;
      const res = createInvite({ email, role, ttlHours, actor });
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, invite: res.invite });
    }

    if (action === 'revoke_invite') {
      const { inviteId, actor, reason } = body;
      const res = revokeInvite({ inviteId, actor, reason });
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, invite: res.invite });
    }

    if (action === 'suspend_account') {
      const { accountId, actor, reason, confirmed } = body;
      const res = suspendAccount({ accountId, actor, reason, confirmed });
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, account: res.account });
    }

    if (action === 'reactivate_account') {
      const { accountId, actor, reason } = body;
      const res = reactivateAccount({ accountId, actor, reason });
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, account: res.account });
    }

    if (action === 'bulk_action') {
      const { bulkAction, targetIds, actor, reason, confirmed } = body;
      const res = executeBulkLifecycleAction({
        action: bulkAction,
        targetIds,
        actor,
        reason,
        confirmed,
      });
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, ...res });
    }

    if (action === 'verify_access') {
      const { accountId, operation } = body;
      const accounts = getAccounts();
      const account = accounts.find(a => a.id === accountId);
      if (!account) {
        return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 });
      }
      const access = verifyAccountAccess(account, operation);
      return NextResponse.json({ success: true, access });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
