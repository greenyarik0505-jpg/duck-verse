import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHILD_SAFE_AI_POLICY_V2,
  AI_MODELS,
  AI_TOOL_SCOPES,
  checkModelAccess,
  checkToolAccess,
  requestPrivilegedToolAccess,
  reviewPrivilegedToolAccess,
  revokePrivilegeGrant,
  checkAndConsumeQuota,
  getQuotaStatus,
  canViewUserAiHistory,
  updatePolicyVersion,
  getSafetyPolicySnapshot,
  __resetSafetyEngineForTests,
} from '../lib/academy/safety/child_policy.js';

test.beforeEach(() => {
  __resetSafetyEngineForTests();
});

test('1. Deny-by-default posture: blocks unregistered models and tools', () => {
  const childActor = { id: 'student-yurko', role: 'child', name: 'Юрко' };

  // Unregistered model
  const modelRes = checkModelAccess(childActor, 'unknown-gpt-hacker-999');
  assert.equal(modelRes.allowed, false);
  assert.equal(modelRes.code, 'DENY_UNKNOWN_MODEL');

  // Unregistered tool
  const toolRes = checkToolAccess(childActor, 'unknown_root_shell');
  assert.equal(toolRes.allowed, false);
  assert.equal(toolRes.code, 'DENY_UNKNOWN_TOOL');

  // Anonymous user
  const anonRes = checkModelAccess(null, 'duck-vibe-coder-v1.2');
  assert.equal(anonRes.allowed, false);
  assert.equal(anonRes.code, 'DENY_ANONYMOUS');
});

test('2. Role-based model access: Child cannot access unfiltered high-risk models', () => {
  const childActor = { id: 'student-yurko', role: 'child', name: 'Юрко' };
  const mentorActor = { id: 'mentor-yarik', role: 'mentor', name: 'Yarik0505' };
  const adminActor = { id: 'admin-kirill', role: 'admin', name: 'Кирил' };

  // Child can access safe educational models
  const safeRes = checkModelAccess(childActor, 'duck-vibe-coder-v1.2');
  assert.equal(safeRes.allowed, true);

  // Child is BLOCKED from adult/unfiltered models
  const blockedRes = checkModelAccess(childActor, 'duck-gpt-unfiltered-pro');
  assert.equal(blockedRes.allowed, false);
  assert.equal(blockedRes.code, 'DENY_ROLE_RESTRICTED');

  // Mentor CAN access duck-gpt-unfiltered-pro
  const mentorRes = checkModelAccess(mentorActor, 'duck-gpt-unfiltered-pro');
  assert.equal(mentorRes.allowed, true);

  // Only Admin can access experimental autonomous model
  assert.equal(checkModelAccess(mentorActor, 'duck-autonomous-agent').allowed, false);
  assert.equal(checkModelAccess(adminActor, 'duck-autonomous-agent').allowed, true);
});

test('3. Tool Scopes: Child can use safe tools, but privileged tools require explicit approval', () => {
  const childActor = { id: 'student-yurko', role: 'child', name: 'Юрко' };

  // Safe tools allowed immediately
  const safeHint = checkToolAccess(childActor, 'read_code_hint');
  assert.equal(safeHint.allowed, true);

  const safeExplain = checkToolAccess(childActor, 'explain_concept');
  assert.equal(safeExplain.allowed, true);

  // Privileged tools blocked by default with requiresApproval = true
  const privTerminal = checkToolAccess(childActor, 'run_bash_terminal');
  assert.equal(privTerminal.allowed, false);
  assert.equal(privTerminal.requiresApproval, true);
  assert.equal(privTerminal.code, 'ACCESS_DENIED_PRIVILEGED_TOOL_REQUIRES_APPROVAL');

  const privFs = checkToolAccess(childActor, 'modify_file_system');
  assert.equal(privFs.allowed, false);
  assert.equal(privFs.requiresApproval, true);
});

test('4. Threat Mitigation TM-01: Child self-approval or illegal privilege escalation is strictly blocked', () => {
  const childActor = { id: 'student-yurko', role: 'child', name: 'Юрко' };

  // Child creates legitimate request for terminal
  const req = requestPrivilegedToolAccess({
    studentId: 'student-yurko',
    toolId: 'run_bash_terminal',
    reason: 'Запуск тестів для перевірки Canvas 2D',
    actor: childActor,
  });
  assert.equal(req.status, 'pending');

  // Child attempts self-approval -> MUST THROW error and mitigate escalation
  assert.throws(() => {
    reviewPrivilegedToolAccess({
      requestId: req.id,
      reviewer: childActor, // child reviewer
      decision: 'approved',
    });
  }, /Учень не має права схвалювати запити/);

  // Child cannot request prohibited capability bypass_safety_guard
  assert.throws(() => {
    requestPrivilegedToolAccess({
      studentId: 'student-yurko',
      toolId: 'bypass_safety_guard',
      reason: 'Хочу вимкнути фільтри',
      actor: childActor,
    });
  }, /Вимкнення фільтра безпеки категорично заборонено/);
});

test('5. Full Privilege Lifecycle: Child requests -> Mentor approves -> Access active -> Revoke', () => {
  const childActor = { id: 'student-yurko', role: 'child', name: 'Юрко' };
  const mentorActor = { id: 'mentor-yarik', role: 'mentor', name: 'Yarik0505' };

  // 1. Initial check: blocked
  assert.equal(checkToolAccess(childActor, 'run_bash_terminal').allowed, false);

  // 2. Child requests access
  const req = requestPrivilegedToolAccess({
    studentId: 'student-yurko',
    toolId: 'run_bash_terminal',
    reason: 'Необхідно скомпілювати шейдери для гри',
    actor: childActor,
  });

  // 3. Mentor reviews and approves
  const { request: reviewedReq, grant } = reviewPrivilegedToolAccess({
    requestId: req.id,
    reviewer: mentorActor,
    decision: 'approved',
    notes: 'Схвалено на 2 години для модуля шейдерів',
    durationHours: 2,
  });
  assert.equal(reviewedReq.status, 'approved');
  assert.ok(grant);
  assert.equal(grant.status, 'active');

  // 4. Check tool access now: should be allowed via active grant
  const accessWithGrant = checkToolAccess(childActor, 'run_bash_terminal');
  assert.equal(accessWithGrant.allowed, true);
  assert.equal(accessWithGrant.viaGrant, true);

  // 5. Mentor revokes grant early
  revokePrivilegeGrant(grant.id, mentorActor);

  // 6. Check tool access again: should be blocked again
  const accessAfterRevoke = checkToolAccess(childActor, 'run_bash_terminal');
  assert.equal(accessAfterRevoke.allowed, false);
});

test('6. Daily Quota Enforcement (TM-03): Blocks excessive AI calls', () => {
  const studentId = 'student-test-quota';

  // Consume up to child limit (50 requests)
  for (let i = 0; i < 50; i++) {
    const outcome = checkAndConsumeQuota(studentId, 'child', 100);
    assert.equal(outcome.allowed, true);
  }

  // 51st request should be rejected due to quota exhaustion
  const overLimit = checkAndConsumeQuota(studentId, 'child', 100);
  assert.equal(overLimit.allowed, false);
  assert.equal(overLimit.code, 'QUOTA_EXCEEDED_REQUESTS');

  // Quota status check reflects 100% usage
  const status = getQuotaStatus(studentId, 'child');
  assert.equal(status.currentRequests, 50);
  assert.equal(status.percentUsed, 100);
});

test('7. History Isolation (TM-04): Tenant privacy between peers, parents and mentors', () => {
  const child1 = { id: 'student-yurko', role: 'child' };
  const child2 = { id: 'student-dima', role: 'child' };
  const parentOfYurko = { id: 'parent-olena', role: 'parent' };
  const mentor = { id: 'mentor-yarik', role: 'mentor' };
  const admin = { id: 'admin-kirill', role: 'admin' };

  // Child can view own history
  assert.equal(canViewUserAiHistory(child1, 'student-yurko'), true);

  // Child CANNOT view peer history
  assert.equal(canViewUserAiHistory(child1, 'student-dima'), false);

  // Parent can view child history
  assert.equal(
    canViewUserAiHistory(parentOfYurko, 'student-yurko', { parentChildren: ['student-yurko'] }),
    true
  );

  // Mentor can view cohort student history
  assert.equal(
    canViewUserAiHistory(mentor, 'student-yurko', { mentorStudents: ['student-yurko'] }),
    true
  );

  // Admin can view any history
  assert.equal(canViewUserAiHistory(admin, 'student-yurko'), true);
});

test('8. Policy Versioning & Audit Integrity (TM-05): Non-admin blocked from modifying policy', () => {
  const child = { id: 'student-yurko', role: 'child' };
  const admin = { id: 'admin-kirill', role: 'admin' };

  // Child attempts policy modification -> BLOCKED
  assert.throws(() => {
    updatePolicyVersion('3.0.0-hacked', child);
  }, /Лише системний адміністратор/);

  // Admin successfully updates policy version
  const updated = updatePolicyVersion('2.2.0', admin, { rationale: 'Scheduled compliance review' });
  assert.equal(updated.version, '2.2.0');

  // Snapshot audit log contains entries
  const snapshot = getSafetyPolicySnapshot(admin);
  assert.ok(snapshot.auditLog.length > 0);
  assert.ok(snapshot.threatCatalog.length >= 5);
});
