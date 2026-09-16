import { NextResponse } from 'next/server';
import {
  DATA_INVENTORY,
  RBAC_PERMISSIONS,
  exportUserData,
  deleteUserData,
  verifyParentConsent,
  runPrivacySecurityAudit
} from '../../../../lib/academy/privacy/audit';

export async function GET() {
  const audit = runPrivacySecurityAudit();
  return NextResponse.json({
    success: true,
    inventory: DATA_INVENTORY,
    permissions: RBAC_PERMISSIONS,
    audit
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action = 'run_audit', targetUserId, requestingUser, consentEvidence } = body;

    if (action === 'export_data') {
      const data = exportUserData(targetUserId, requestingUser);
      return NextResponse.json({ success: true, data });
    }

    if (action === 'delete_data') {
      const result = deleteUserData(targetUserId, requestingUser);
      return NextResponse.json({ success: true, result });
    }

    if (action === 'verify_consent') {
      const result = verifyParentConsent(targetUserId, requestingUser, consentEvidence);
      return NextResponse.json({ success: true, result });
    }

    if (action === 'run_audit') {
      const result = runPrivacySecurityAudit();
      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json(
      { success: false, error: 'Невідома дія (action)' },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: err.message.includes('IDOR') || err.message.includes('Security') ? 403 : 400 }
    );
  }
}
