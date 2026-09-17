import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateGovernanceScorecard,
  sanitizeAuthorData,
  SCORECARD_RUBRIC_VERSION,
  SCORECARD_EFFECTIVE_DATE,
  SCORECARD_CHANGELOG,
  EVIDENCE_DIMENSIONS,
  PASSING_SCORECARD_FIXTURE,
  FAILING_SCORECARD_FIXTURE
} from '../lib/academy/governance/governance_scorecard.js';

test('1. Rubric Metadata & Versioning: enforces v2.4.0 with effective date and changelog', () => {
  assert.equal(SCORECARD_RUBRIC_VERSION, 'v2.4.0');
  assert.equal(SCORECARD_EFFECTIVE_DATE, '2026-03-01');
  assert.ok(SCORECARD_CHANGELOG.length >= 2, 'Changelog must contain revision history');
  assert.equal(SCORECARD_CHANGELOG[0].version, 'v2.4.0');
});

test('2. 7 Evidence Dimensions Schema: defines 7 dimensions summing to 100 SP', () => {
  const dimensions = Object.values(EVIDENCE_DIMENSIONS);
  assert.equal(dimensions.length, 7, 'Must have exactly 7 dimensions');

  const totalWeight = dimensions.reduce((acc, d) => acc + d.weight, 0);
  assert.equal(totalWeight, 100, 'Dimensions must sum to exactly 100 max score points');

  const requiredIds = [
    'branch_naming',
    'jira_linking',
    'ci_status',
    'automated_tests',
    'peer_reviewers',
    'security_scans',
    'deployment_evidence'
  ];
  for (const id of requiredIds) {
    assert.ok(EVIDENCE_DIMENSIONS[id.toUpperCase()], `Dimension ${id} must exist`);
  }
});

test('3. Exemplar Passing PR Evaluation: yields 100% score and APPROVED decision', () => {
  const evaluation = evaluateGovernanceScorecard(PASSING_SCORECARD_FIXTURE);
  assert.equal(evaluation.totalScore, 100);
  assert.equal(evaluation.passedOverall, true);
  assert.equal(evaluation.qualityRating, 'EXEMPLARY');
  assert.equal(evaluation.remediations.length, 0);
  assert.equal(evaluation.author, 'Yarik0505');
  assert.ok(evaluation.mentorNotes.length > 0);
});

test('4. Constructive Remediation Generation: gives actionable advice instead of penalty', () => {
  const evaluation = evaluateGovernanceScorecard(FAILING_SCORECARD_FIXTURE);
  assert.equal(evaluation.passedOverall, false);
  assert.equal(evaluation.qualityRating, 'NEEDS_REVISION');
  assert.ok(evaluation.remediations.length >= 3, 'Must produce constructive remediations');

  const branchRemediation = evaluation.remediations.find((r) => r.dimension.includes('Branch'));
  assert.ok(branchRemediation);
  assert.ok(branchRemediation.advice.includes('git branch -m'));

  const jiraRemediation = evaluation.remediations.find((r) => r.dimension.includes('Jira'));
  assert.ok(jiraRemediation);
  assert.equal(jiraRemediation.urgency, 'HIGH');
});

test('5. Non-Punitive Partial Grading: awards proportional score for test pass rate', () => {
  const partialSubmission = {
    ...PASSING_SCORECARD_FIXTURE,
    testsPassRate: 0.8 // 80% tests pass -> 16 of 20 SP earned
  };
  const evaluation = evaluateGovernanceScorecard(partialSubmission);

  const testDim = evaluation.dimensionResults.find((d) => d.id === 'automated_tests');
  assert.equal(testDim.passed, false);
  assert.equal(testDim.score, 16);
  assert.equal(testDim.maxScore, 20);
});

test('6. Privacy & Minimal PII Shield: strips personal emails from author metadata', () => {
  assert.equal(sanitizeAuthorData('developer@company.com'), 'developer');
  assert.equal(sanitizeAuthorData('StudentLeader'), 'StudentLeader');
  assert.equal(sanitizeAuthorData({ username: 'learner_123' }), 'learner_123');
  assert.equal(sanitizeAuthorData(null), 'Anonymous Learner');

  const evalWithEmail = evaluateGovernanceScorecard({
    ...PASSING_SCORECARD_FIXTURE,
    author: 'learner@school.edu'
  });
  assert.equal(evalWithEmail.author, 'learner', 'Email domain must be stripped');
});

test('7. Dispute & Mentor Calibration Loop: supports dispute argument and mentor override note', () => {
  const customSubmission = {
    ...PASSING_SCORECARD_FIXTURE,
    disputes: [
      { id: 'disp-1', author: 'Learner', argument: 'Alternative CI ran with 100% pass', date: '2026-09-17' }
    ],
    mentorNotes: [
      { mentor: 'Lead Mentor', comment: 'Waived secondary reviewer due to high autonomy.', date: '2026-09-17' }
    ]
  };

  const evaluation = evaluateGovernanceScorecard(customSubmission);
  assert.equal(evaluation.disputes.length, 1);
  assert.equal(evaluation.disputes[0].argument, 'Alternative CI ran with 100% pass');
  assert.equal(evaluation.mentorNotes.length, 1);
  assert.equal(evaluation.mentorNotes[0].mentor, 'Lead Mentor');
});

test('8. API Route and UI Component: files exist and export expected endpoints', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const apiRoutePath = path.resolve('app/api/academy/governance/scorecard/route.js');
  const componentPath = path.resolve('components/academy/EngineeringGovernanceScorecardView.jsx');

  assert.ok(fs.existsSync(apiRoutePath), 'API route file must exist');
  assert.ok(fs.existsSync(componentPath), 'UI component file must exist');

  const apiContent = fs.readFileSync(apiRoutePath, 'utf8');
  assert.ok(apiContent.includes('export async function GET'), 'GET route must be exported');
  assert.ok(apiContent.includes('export async function POST'), 'POST route must be exported');
  assert.ok(apiContent.includes('evaluateGovernanceScorecard'), 'API route must invoke evaluateGovernanceScorecard');
});
