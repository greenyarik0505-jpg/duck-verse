import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACCOUNT_STATUS,
  INVITE_STATUS,
  ROLES,
  RBAC_LIFECYCLE_MATRIX,
  getAccounts,
  getInvites,
  getAuditLogs,
  createInvite,
  revokeInvite,
  suspendAccount,
  reactivateAccount,
  verifyAccountAccess,
  executeBulkLifecycleAction,
  canManageAccount,
} from '../lib/academy/identity/lifecycle_admin.js';

test('1. Invite Creation with TTL: generates unique token and computes expiration', () => {
  const adminActor = { id: 'usr-admin-01', username: 'admin_yarik', role: ROLES.ADMIN };
  const res = createInvite({
    email: 'new_candidate@duckverse.io',
    role: ROLES.STUDENT,
    ttlHours: 72,
    actor: adminActor,
  });

  assert.equal(res.success, true);
  assert.equal(res.invite.email, 'new_candidate@duckverse.io');
  assert.equal(res.invite.status, INVITE_STATUS.PENDING);
  assert.ok(res.invite.token.startsWith('INV-'));
  assert.equal(res.invite.ttlHours, 72);
  assert.ok(new Date(res.invite.expiresAt).getTime() > Date.now());
});

test('2. Invite Revocation: revokes pending invitation with reason and audit trail', () => {
  const adminActor = { id: 'usr-admin-01', username: 'admin_yarik', role: ROLES.ADMIN };
  const created = createInvite({
    email: 'revokable@school.ua',
    role: ROLES.STUDENT,
    ttlHours: 24,
    actor: adminActor,
  });

  const revoked = revokeInvite({
    inviteId: created.invite.id,
    actor: adminActor,
    reason: 'Candidate requested cancellation',
  });

  assert.equal(revoked.success, true);
  assert.equal(revoked.invite.status, INVITE_STATUS.REVOKED);
  assert.equal(revoked.invite.revokeReason, 'Candidate requested cancellation');
});

test('3. RBAC Enforcement: student role is blocked from suspending accounts', () => {
  const studentActor = { id: 'usr-student-03', username: 'kyrylo_coder', role: ROLES.STUDENT };
  const target = { id: 'usr-student-04', username: 'bogdan_spammer', role: ROLES.STUDENT };

  const check = canManageAccount(studentActor, target, 'SUSPEND');
  assert.equal(check.allowed, false);

  const res = suspendAccount({
    accountId: target.id,
    actor: studentActor,
    reason: 'Unauthorized student attempt',
    confirmed: true,
  });
  assert.equal(res.success, false);
});

test('4. Mandatory Reason & Confirmation Safeguard: rejects suspension without reason or confirmation', () => {
  const adminActor = { id: 'usr-admin-01', username: 'admin_yarik', role: ROLES.ADMIN };

  // Empty reason
  const emptyReasonRes = suspendAccount({
    accountId: 'usr-student-03',
    actor: adminActor,
    reason: '',
    confirmed: true,
  });
  assert.equal(emptyReasonRes.success, false);
  assert.ok(emptyReasonRes.error.includes('Причина блокування обов’язкова'));

  // Missing confirmation
  const noConfirmRes = suspendAccount({
    accountId: 'usr-student-03',
    actor: adminActor,
    reason: 'Legitimate reason',
    confirmed: false,
  });
  assert.equal(noConfirmRes.success, false);
  assert.ok(noConfirmRes.error.includes('confirmation required'));
});

test('5. Safeguard: Self-suspension is strictly prohibited', () => {
  const adminActor = { id: 'usr-admin-01', username: 'admin_yarik', role: ROLES.ADMIN };

  const selfRes = suspendAccount({
    accountId: adminActor.id,
    actor: adminActor,
    reason: 'Trying to self-suspend',
    confirmed: true,
  });

  assert.equal(selfRes.success, false);
  assert.ok(selfRes.error.includes('Самоблокування суворо заборонене'));
});

test('6. Reactivation Workflow: restores suspended account to ACTIVE status', () => {
  const adminActor = { id: 'usr-admin-01', username: 'admin_yarik', role: ROLES.ADMIN };
  const target = getAccounts().find(a => a.status === ACCOUNT_STATUS.SUSPENDED);
  assert.ok(target, 'Must have at least one suspended mock account');

  const res = reactivateAccount({
    accountId: target.id,
    actor: adminActor,
    reason: 'Terms of service agreement resigned and verified',
  });

  assert.equal(res.success, true);
  assert.equal(res.account.status, ACCOUNT_STATUS.ACTIVE);
  assert.equal(res.account.suspensionInfo, null);
});

test('7. Access Gatekeeper: strictly blocks suspended accounts from login and learner data', () => {
  const adminActor = { id: 'usr-admin-01', username: 'admin_yarik', role: ROLES.ADMIN };

  // Suspend student 03
  suspendAccount({
    accountId: 'usr-student-03',
    actor: adminActor,
    reason: 'Account under security investigation',
    confirmed: true,
  });

  const suspendedStudent = getAccounts().find(a => a.id === 'usr-student-03');
  assert.equal(suspendedStudent.status, ACCOUNT_STATUS.SUSPENDED);

  // Attempt login
  const loginGate = verifyAccountAccess(suspendedStudent, 'LOGIN');
  assert.equal(loginGate.allowed, false);
  assert.equal(loginGate.code, 'ACCOUNT_SUSPENDED');
  assert.ok(loginGate.reason.includes('security investigation'));

  // Attempt reading learner data
  const dataGate = verifyAccountAccess(suspendedStudent, 'READ_DATA');
  assert.equal(dataGate.allowed, false);
  assert.equal(dataGate.code, 'ACCOUNT_SUSPENDED');
});

test('8. Bulk Operations Safeguard: applies batch action while skipping self and requiring confirmation', () => {
  const adminActor = { id: 'usr-admin-01', username: 'admin_yarik', role: ROLES.ADMIN };

  // Unconfirmed bulk action fails
  const unconfirmed = executeBulkLifecycleAction({
    action: 'BULK_REACTIVATE',
    targetIds: ['usr-student-03'],
    actor: adminActor,
    reason: 'Bulk reset',
    confirmed: false,
  });
  assert.equal(unconfirmed.success, false);

  // Confirmed bulk reactivation including self in target list
  const confirmed = executeBulkLifecycleAction({
    action: 'BULK_REACTIVATE',
    targetIds: ['usr-admin-01', 'usr-student-03'],
    actor: adminActor,
    reason: 'Batch reactivation after safety review',
    confirmed: true,
  });

  assert.equal(confirmed.success, true);
  assert.equal(confirmed.affectedCount, 1);
  assert.equal(confirmed.skippedCount, 1); // self was safely skipped
});
