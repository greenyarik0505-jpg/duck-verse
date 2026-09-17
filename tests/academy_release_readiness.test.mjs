import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RELEASE_QUALITY_GATES,
  CHANGE_RISK_LEVELS,
  validateReleaseReadiness,
  approveHighRiskRelease,
  executeReleaseRecord,
  toggleReleaseGate,
  getReleaseReadinessSnapshot,
  __resetReleaseEngineForTests,
} from '../lib/academy/ops/release_readiness.js';

test.beforeEach(() => {
  __resetReleaseEngineForTests();
});

test('1. Quality Gates: 6 mandatory release quality gates defined and validated', () => {
  assert.equal(RELEASE_QUALITY_GATES.length, 6);
  const gateIds = RELEASE_QUALITY_GATES.map((g) => g.id);

  assert.ok(gateIds.includes('pr_review'));
  assert.ok(gateIds.includes('ci_pipeline'));
  assert.ok(gateIds.includes('security_privacy'));
  assert.ok(gateIds.includes('accessibility_ux'));
  assert.ok(gateIds.includes('performance_slo'));
  assert.ok(gateIds.includes('rollback_plan'));
});

test('2. Missing Quality Gate blocks release readiness', () => {
  const snapshot = getReleaseReadinessSnapshot();
  const draft = snapshot.activeDraft;

  // Uncheck a gate (e.g. security_privacy)
  const updated = toggleReleaseGate('security_privacy', false);
  assert.equal(updated.validation.ready, false);
  assert.equal(updated.validation.blockedReason, 'MISSING_QUALITY_GATES');
  assert.ok(updated.validation.missingGates.includes('Security & Privacy Gate'));
});

test('3. Missing Evidence Links block release readiness', () => {
  const snapshot = getReleaseReadinessSnapshot();
  const draft = {
    ...snapshot.activeDraft,
    evidenceLinks: {
      prUrl: '', // Missing PR URL
      jiraKey: 'SCRUM-114',
      testEvidence: '82/82 passing',
      screenshotArtifact: 'live_public_status_page.png',
    },
  };

  const validation = validateReleaseReadiness(draft);
  assert.equal(validation.ready, false);
  assert.equal(validation.blockedReason, 'MISSING_EVIDENCE_LINKS');
  assert.ok(validation.missingEvidence.includes('Pull Request URL'));
});

test('4. Risk-based Gate: High-Risk change blocked without explicit mentor approval', () => {
  const snapshot = getReleaseReadinessSnapshot();
  const draft = {
    ...snapshot.activeDraft,
    riskLevel: 'HIGH_RISK',
    mentorApproval: null, // No mentor sign-off
  };

  const validation = validateReleaseReadiness(draft);
  assert.equal(validation.ready, false);
  assert.equal(validation.requiresMentorApproval, true);
  assert.equal(validation.mentorApprovalMissing, true);
  assert.equal(validation.blockedReason, 'HIGH_RISK_REQUIRES_MENTOR_APPROVAL');
});

test('5. RBAC Protection: Student role cannot sign off on High-Risk release approval', () => {
  const student = { id: 'std_yurko', role: 'child', name: 'Юрко' };

  assert.throws(() => {
    approveHighRiskRelease('rel-draft-v1.4.0', student, 'Спроба підписати реліз учнем');
  }, /Тільки ментор або адміністратор має право/);
});

test('6. Mentor Sign-off unlocks High-Risk release for deployment', () => {
  const mentor = { id: 'mentor_yarik', role: 'mentor', name: 'Yarik0505' };

  const result = approveHighRiskRelease('rel-draft-v1.4.0', mentor, 'Всі 82 тести пройдено, CDP верифіковано');
  assert.ok(result.draft.mentorApproval);
  assert.equal(result.draft.mentorApproval.approvedByName, 'Yarik0505');
  assert.equal(result.validation.ready, true);
  assert.equal(result.draft.status, 'READY_FOR_DEPLOY');
});

test('7. Release Execution: commits release into history and creates follow-up tasks', () => {
  const mentor = { id: 'mentor_yarik', role: 'mentor', name: 'Yarik0505' };
  approveHighRiskRelease('rel-draft-v1.4.0', mentor, 'Схвалено');

  const record = executeReleaseRecord(
    'rel-draft-v1.4.0',
    'SUCCESSFUL_DEPLOY',
    ['Моніторинг черги помилок протягом 2 годин', 'Оновити релізні нотатки у Discord'],
    'Yarik0505'
  );

  assert.equal(record.outcome, 'SUCCESSFUL_DEPLOY');
  assert.equal(record.followUpTasks.length, 2);

  const snapshot = getReleaseReadinessSnapshot();
  assert.equal(snapshot.activeDraft, null);
  assert.ok(snapshot.releaseHistory.some((r) => r.id === 'rel-draft-v1.4.0'));
});

test('8. Rollback Scenario: supports rollback recording with post-mortem follow-up', () => {
  // Can execute rollback recording even if partial
  const record = executeReleaseRecord(
    'rel-draft-v1.4.0',
    'ROLLBACK_TRIGGERED',
    ['Провести аналіз регресії', 'Створити баг-фікс задачу у Jira'],
    'Incident Manager'
  );

  assert.equal(record.outcome, 'ROLLBACK_TRIGGERED');
  assert.ok(record.followUpTasks.includes('Провести аналіз регресії'));
});
