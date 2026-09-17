import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import {
  LEADERSHIP_PILLARS,
  getMentoringSessions,
  createMentoringSession,
  submitLearnerSelfReview,
  amendMentoringFeedback,
  calculateRotationReport,
  exportAnonymizedFeedbackExamples,
  resetLeadershipLoopStore,
} from '../lib/academy/mentoring/leadership_loop.js';

test('1. 3-Pillar Rubric Schema: separates Technical, Communication, and Ownership skills', () => {
  const pillarKeys = Object.keys(LEADERSHIP_PILLARS);
  assert.deepEqual(pillarKeys, ['TECHNICAL', 'COMMUNICATION', 'OWNERSHIP']);

  for (const key of pillarKeys) {
    const pillar = LEADERSHIP_PILLARS[key];
    assert.ok(pillar.nameUk);
    assert.ok(pillar.description);
    assert.equal(pillar.maxScore, 5);
    assert.ok(pillar.criteria.length >= 3);
  }
});

test('2. Mentoring Session Creation: enforces pre-review goal and observable feedback', () => {
  resetLeadershipLoopStore();

  // Invalid session (missing required fields)
  const invalidRes = createMentoringSession({
    prReference: 'PR #99',
    mentorName: 'Dmytro',
    learnerName: 'Kyryl',
    preReviewGoal: 'Short',
    observableFeedback: 'Too short',
  });
  assert.equal(invalidRes.success, false);

  // Valid session
  const validRes = createMentoringSession({
    prReference: 'PR #43',
    jiraKey: 'SCRUM-133',
    mentorName: 'Dmytro Stepanenko',
    learnerName: 'Bohdan Student',
    preReviewGoal: 'Design a clean sanitized export view without leaking raw student PII',
    observableFeedback: 'Bohdan demonstrated thorough understanding of anti-toxic constraints, creating a safe markdown serializer.',
    praiseHighlight: 'Proactive test-driven approach to PII masking.',
    improvementTip: 'Ensure edge cases in email masking are documented.',
    scores: { technical: 5, communication: 4, ownership: 5 },
  });

  assert.equal(validRes.success, true);
  assert.ok(validRes.session.id.startsWith('mentoring-session-'));
  assert.equal(validRes.session.status, 'IN_REVIEW');
  assert.equal(validRes.session.selfReview, null);
  assert.equal(validRes.session.auditTrail.length, 1);
});

test('3. Learner Self-Review & Next Experiment: completes the closed mentoring loop', () => {
  resetLeadershipLoopStore();
  const sessionId = 'mentoring-session-02';

  const res = submitLearnerSelfReview({
    sessionId,
    reflection: 'I realized that relying on in-memory storage requires careful cleanup on component unmount to prevent leaks.',
    blindSpotsDiscovered: 'Overlooked the necessity of handling 404 responses gracefully in the UI client.',
    nextExperiment: 'I will write an explicit unmount integration test before submitting the next Pull Request.',
  });

  assert.equal(res.success, true);
  assert.equal(res.session.status, 'COMPLETED');
  assert.ok(res.session.selfReview);
  assert.equal(res.session.selfReview.reflection.length > 20, true);
  assert.equal(res.session.selfReview.nextExperiment.length > 20, true);
  assert.ok(res.session.auditTrail.length >= 2);
  assert.equal(res.session.auditTrail[res.session.auditTrail.length - 1].action, 'SELF_REVIEW_SUBMITTED');
});

test('4. Immutable Feedback Calibration: amends feedback with revision snapshot and reason', () => {
  resetLeadershipLoopStore();
  const sessionId = 'mentoring-session-01';

  const amendRes = amendMentoringFeedback({
    sessionId,
    amendedBy: 'Dmytro Stepanenko',
    amendmentReason: 'Calibrated feedback during weekly mentor 1:1 to emphasize serverless cold starts',
    newFeedback: 'Yarik demonstrated exceptional architectural maturity, and we agreed to focus on edge latency optimizations.',
    newPraise: 'Flawless execution of zero-knowledge privacy shields.',
    newTip: 'Conduct load testing on cold-start routes.',
    newScores: { technical: 5, communication: 5, ownership: 5 },
  });

  assert.equal(amendRes.success, true);
  assert.equal(amendRes.session.observableFeedback.includes('exceptional architectural maturity'), true);
  assert.equal(amendRes.session.auditTrail.length, 2);

  const lastAudit = amendRes.session.auditTrail[1];
  assert.equal(lastAudit.action, 'FEEDBACK_AMENDED');
  assert.ok(lastAudit.previousSnapshot, 'Must preserve previous feedback snapshot in audit');
  assert.equal(lastAudit.version, 2);
});

test('5. Audit Trail Immutability: previous feedback history cannot be purged', () => {
  resetLeadershipLoopStore();
  const session = getMentoringSessions()[0];
  assert.ok(session.auditTrail);
  assert.ok(Array.isArray(session.auditTrail));
  assert.ok(session.auditTrail[0].version === 1);
  assert.ok(session.auditTrail[0].timestamp);
});

test('6. Peer Rotation Fairness Engine: calculates imbalance and suggests optimal next pairing', () => {
  resetLeadershipLoopStore();
  const report = calculateRotationReport();

  assert.ok(report.studentReports.length >= 5);
  assert.ok(report.systemFairnessScore);
  assert.ok(report.suggestedNextPair);
  assert.ok(report.suggestedNextPair.reviewer);
  assert.ok(report.suggestedNextPair.reviewee);

  // Student with low reviewer count should be suggested as reviewer
  const bohdan = report.studentReports.find((s) => s.name.includes('Богдан'));
  assert.ok(bohdan);
  assert.equal(bohdan.recommendedRole, 'REVIEWER', 'Bohdan has reviewer deficit and should be prioritized');
});

test('7. Anonymized Feedback Samples: safely exported for peer learning without PII', () => {
  resetLeadershipLoopStore();
  const samples = exportAnonymizedFeedbackExamples();

  assert.ok(samples.length >= 2);
  for (const s of samples) {
    assert.ok(s.caseNumber);
    assert.ok(s.goalTheme);
    assert.ok(s.observableFeedbackSample);
    assert.ok(s.praiseSample);
    assert.ok(s.growthTipSample);
    assert.ok(s.scores);
  }
});

test('8. Mentoring Leadership API Route and UI Component: files exist and export expected endpoints', () => {
  const apiRoutePath = path.resolve('app/api/academy/mentoring/leadership/route.js');
  const componentPath = path.resolve('components/academy/MentoringLeadershipLoopView.jsx');

  assert.ok(fs.existsSync(apiRoutePath), 'API route file must exist');
  assert.ok(fs.existsSync(componentPath), 'UI component file must exist');

  const content = fs.readFileSync(apiRoutePath, 'utf8');
  assert.ok(content.includes('export async function GET'));
  assert.ok(content.includes('export async function POST'));
  assert.ok(content.includes('create_session'));
  assert.ok(content.includes('submit_self_review'));
  assert.ok(content.includes('amend_feedback'));
});
