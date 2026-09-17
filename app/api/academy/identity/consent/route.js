import { NextResponse } from 'next/server';
import {
  getAccounts,
  registerAccount,
  approveParentConsent,
  rejectParentConsent,
  revokeParentConsent,
  checkFeatureAccess,
  getAuditLog,
  FEATURE_SCOPES,
  CURRENT_POLICY_VERSION,
  ACTIVATION_STATES,
} from '@/lib/academy/identity/parent_consent';

export async function GET() {
  try {
    const accounts = getAccounts();
    const auditLogs = getAuditLog();
    return NextResponse.json({
      success: true,
      accounts,
      scopes: FEATURE_SCOPES,
      policyVersion: CURRENT_POLICY_VERSION,
      activationStates: ACTIVATION_STATES,
      auditLogs,
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

    if (action === 'request_consent') {
      const { childUsername, age, parentEmail } = body;
      if (!childUsername || age === undefined) {
        return NextResponse.json(
          { success: false, error: 'childUsername and age are required' },
          { status: 400 }
        );
      }
      const res = registerAccount({ childUsername, age, parentEmail });
      return NextResponse.json({ success: true, ...res });
    }

    if (action === 'approve_consent') {
      const { accountId, token, scopesGranted, parentName } = body;
      if (!accountId) {
        return NextResponse.json(
          { success: false, error: 'accountId is required' },
          { status: 400 }
        );
      }
      const result = approveParentConsent({ accountId, token, scopesGranted, parentName });
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, account: result.account });
    }

    if (action === 'reject_consent') {
      const { accountId, reason } = body;
      if (!accountId) {
        return NextResponse.json(
          { success: false, error: 'accountId is required' },
          { status: 400 }
        );
      }
      const result = rejectParentConsent({ accountId, reason });
      return NextResponse.json(result);
    }

    if (action === 'revoke_consent') {
      const { accountId, reason } = body;
      if (!accountId) {
        return NextResponse.json(
          { success: false, error: 'accountId is required' },
          { status: 400 }
        );
      }
      const result = revokeParentConsent({ accountId, reason });
      return NextResponse.json(result);
    }

    if (action === 'check_access') {
      const { accountId, featureKey } = body;
      const accounts = getAccounts();
      const account = accounts.find(a => a.id === accountId);
      if (!account) {
        return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 });
      }
      const access = checkFeatureAccess(account, featureKey);
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
