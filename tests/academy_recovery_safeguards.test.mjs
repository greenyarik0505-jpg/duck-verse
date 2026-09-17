import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import {
  RECOVERY_TYPES,
  COOLING_OFF_STATUS,
  maskEmail,
  maskIp,
  sanitizeUserForSupport,
  createRecoveryTicket,
  escalateRecoveryTicket,
  executeAtoEmergencyFreeze,
  initiateIrreversibleAction,
  cancelCoolingOffAction,
  verifyPostActionResolution,
  getRecoveryTickets,
  getCoolingOffActions,
  getRecoveryAuditLogs,
} from '../lib/academy/identity/recovery_support.js';

test('1. Incident Classification: defines 4 escalation tiers with SLA and owners', () => {
  assert.equal(RECOVERY_TYPES.FORGOTTEN_CREDENTIALS.tier, 'L1');
  assert.equal(RECOVERY_TYPES.LOCKED_OUT_2FA.tier, 'L2');
  assert.equal(RECOVERY_TYPES.SUSPECTED_ATO.tier, 'L3');
  assert.equal(RECOVERY_TYPES.IRREVERSIBLE_RESET.tier, 'L3_DUAL');
  assert.equal(RECOVERY_TYPES.IRREVERSIBLE_RESET.requiresCoolingOff, true);
});

test('2. Support Privacy Shield: sanitizes raw credentials, tokens, and PII', () => {
  const sensitiveUser = {
    id: 'usr-student-99',
    username: 'sensitive_kid',
    email: 'sensitive_student@secretmail.org',
    parentEmail: 'parent_guardian@home.ua',
    password: 'SuperSecretPassword123!',
    sessionToken: 'jwt-header.payload.signature',
    authToken: 'bearer-token-live',
    lastIp: '192.168.1.100',
  };

  const safe = sanitizeUserForSupport(sensitiveUser);

  assert.equal(safe.password, undefined);
  assert.equal(safe.sessionToken, undefined);
  assert.equal(safe.authToken, undefined);
  assert.equal(safe.email, 's***t@secretmail.org');
  assert.equal(safe.parentEmail, 'p***n@home.ua');
  assert.ok(safe.ipHash);
  assert.notEqual(safe.ipHash, '192.168.1.100');
  assert.equal(safe.dataShieldActive, true);
});

test('3. ATO Emergency Freeze Protocol: invalidates sessions and assigns incident code', () => {
  const adminActor = { id: 'usr-admin-01', username: 'admin_yarik', role: 'admin' };
  const res = executeAtoEmergencyFreeze({
    accountId: 'usr-student-04',
    actor: adminActor,
    reason: 'Suspicious IP hop from foreign subnet detected',
  });

  assert.equal(res.success, true);
  assert.ok(res.incidentCode.startsWith('ATO-'));

  const logs = getRecoveryAuditLogs();
  const freezeLog = logs.find(l => l.action === 'ATO_EMERGENCY_FREEZE' && l.targetAccountId === 'usr-student-04');
  assert.ok(freezeLog);
  assert.ok(freezeLog.details.includes(res.incidentCode));
});

test('4. Double-Confirmation Validator: rejects destructive action on text mismatch', () => {
  const adminActor = { id: 'usr-admin-01', username: 'admin_yarik', role: 'admin' };

  const failed = initiateIrreversibleAction({
    accountId: 'usr-student-04',
    username: 'bogdan_spammer',
    actionType: 'IRREVERSIBLE_DATA_RESET',
    actor: adminActor,
    reason: 'Reset requested',
    confirmationInput: 'WRONG-PHRASE',
    expectedConfirmation: 'CONFIRM-RESET-BOGDAN',
    coolingOffHours: 24,
  });

  assert.equal(failed.success, false);
  assert.ok(failed.error.includes('підтвердження'));
});

test('5. Cooling-off Policy: initiates 24h grace period for irreversible operations', () => {
  const adminActor = { id: 'usr-admin-01', username: 'admin_yarik', role: 'admin' };

  const res = initiateIrreversibleAction({
    accountId: 'usr-student-04',
    username: 'bogdan_spammer',
    actionType: 'IRREVERSIBLE_DATA_RESET',
    actor: adminActor,
    reason: 'Parent verified request for curriculum reset',
    confirmationInput: 'CONFIRM-RESET-BOGDAN',
    expectedConfirmation: 'CONFIRM-RESET-BOGDAN',
    coolingOffHours: 24,
  });

  assert.equal(res.success, true);
  assert.equal(res.action.status, COOLING_OFF_STATUS.PENDING_COOLING_OFF);
  assert.equal(res.action.coolingOffHours, 24);
  assert.ok(new Date(res.action.expiresAt).getTime() > Date.now());
});

test('6. Cooling-off Cancellation: aborts pending destructive action during grace period', () => {
  const adminActor = { id: 'usr-admin-01', username: 'admin_yarik', role: 'admin' };

  const initiated = initiateIrreversibleAction({
    accountId: 'usr-student-03',
    username: 'kyrylo_coder',
    actionType: 'IRREVERSIBLE_DATA_RESET',
    actor: adminActor,
    reason: 'Test reset',
    confirmationInput: 'CONFIRM-RESET-KYRYLO',
    expectedConfirmation: 'CONFIRM-RESET-KYRYLO',
    coolingOffHours: 24,
  });

  const cancelled = cancelCoolingOffAction({
    actionId: initiated.action.id,
    actor: adminActor,
    reason: 'Student and parent revoked reset request',
  });

  assert.equal(cancelled.success, true);
  assert.equal(cancelled.action.status, COOLING_OFF_STATUS.CANCELLED);
  assert.equal(cancelled.action.cancelReason, 'Student and parent revoked reset request');
});

test('7. Post-Action OOB Verification: resolves recovery ticket with documented evidence', () => {
  const mentorActor = { id: 'usr-mentor-02', username: 'mentor_dmytro', role: 'mentor' };
  const ticket = getRecoveryTickets()[0];
  assert.ok(ticket);

  const res = verifyPostActionResolution({
    ticketId: ticket.id,
    actor: mentorActor,
    verificationNotes: 'Parent confirmed identity via live video checkpoint',
  });

  assert.equal(res.success, true);
  assert.equal(res.ticket.status, 'RESOLVED');
  assert.equal(res.ticket.oobVerified, true);
  assert.equal(res.ticket.verificationNotes, 'Parent confirmed identity via live video checkpoint');
});

test('8. Operational Runbook: docs/ACCOUNT_TAKEOVER_RUNBOOK.md exists and documents all criteria', () => {
  const runbookPath = path.resolve(process.cwd(), 'docs/ACCOUNT_TAKEOVER_RUNBOOK.md');
  assert.ok(fs.existsSync(runbookPath), 'Runbook document must exist');

  const content = fs.readFileSync(runbookPath, 'utf-8');
  assert.ok(content.includes('ACCOUNT_TAKEOVER_RUNBOOK') || content.includes('Account Takeover'));
  assert.ok(content.includes('Emergency Freeze'));
  assert.ok(content.includes('Cooling-off'));
  assert.ok(content.includes('Zero-Knowledge') || content.includes('Support Privacy Shield'));
  assert.ok(content.includes('Double Confirmation'));
});
