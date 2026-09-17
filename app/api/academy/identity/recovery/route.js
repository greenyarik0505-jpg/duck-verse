import { NextResponse } from 'next/server';
import {
  getRecoveryTickets,
  getCoolingOffActions,
  getRecoveryAuditLogs,
  createRecoveryTicket,
  escalateRecoveryTicket,
  executeAtoEmergencyFreeze,
  initiateIrreversibleAction,
  cancelCoolingOffAction,
  verifyPostActionResolution,
  sanitizeUserForSupport,
  RECOVERY_TYPES,
  COOLING_OFF_STATUS,
} from '@/lib/academy/identity/recovery_support';

export async function GET() {
  try {
    const tickets = getRecoveryTickets();
    const coolingOffActions = getCoolingOffActions();
    const auditLogs = getRecoveryAuditLogs();

    return NextResponse.json({
      success: true,
      tickets,
      coolingOffActions,
      auditLogs,
      recoveryTypes: RECOVERY_TYPES,
      coolingOffStatusEnum: COOLING_OFF_STATUS,
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

    if (action === 'create_ticket') {
      const { accountId, username, email, type, reason, actor } = body;
      const res = createRecoveryTicket({ accountId, username, email, type, reason, actor });
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, ticket: res.ticket });
    }

    if (action === 'escalate_ticket') {
      const { ticketId, newTier, newOwner, actor, reason } = body;
      const res = escalateRecoveryTicket({ ticketId, newTier, newOwner, actor, reason });
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, ticket: res.ticket });
    }

    if (action === 'emergency_freeze') {
      const { accountId, actor, reason } = body;
      const res = executeAtoEmergencyFreeze({ accountId, actor, reason });
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, ...res });
    }

    if (action === 'initiate_irreversible') {
      const {
        accountId,
        username,
        actionType,
        actor,
        reason,
        confirmationInput,
        expectedConfirmation,
        coolingOffHours,
      } = body;
      const res = initiateIrreversibleAction({
        accountId,
        username,
        actionType,
        actor,
        reason,
        confirmationInput,
        expectedConfirmation,
        coolingOffHours,
      });
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, actionRecord: res.action });
    }

    if (action === 'cancel_cooling_off') {
      const { actionId, actor, reason } = body;
      const res = cancelCoolingOffAction({ actionId, actor, reason });
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, actionRecord: res.action });
    }

    if (action === 'verify_resolution') {
      const { ticketId, actor, verificationNotes } = body;
      const res = verifyPostActionResolution({ ticketId, actor, verificationNotes });
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, ticket: res.ticket });
    }

    if (action === 'sanitize_preview') {
      const { rawUserData } = body;
      const sanitized = sanitizeUserForSupport(rawUserData);
      return NextResponse.json({ success: true, sanitized });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
