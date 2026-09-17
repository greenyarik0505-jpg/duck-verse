import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import {
  TRADE_OFF_DIMENSIONS,
  MENTOR_RUBRIC_CRITERIA,
  PASSING_SCORE_THRESHOLD,
  getCasebook,
  getAdrRegistry,
  getCaseById,
  getAdrById,
  submitAdrProposal,
  reviewAdrProposal,
  supersedeAdr,
  resetCasebookStore,
} from '../lib/academy/sysdesign/casebook.js';

test('1. Architecture Casebook Schema: defines 4 realistic challenges with constraints and alternatives', () => {
  const cases = getCasebook();
  assert.equal(cases.length, 4, 'Must provide 4 architecture case studies');

  for (const c of cases) {
    assert.ok(c.id, 'Case must have ID');
    assert.ok(c.titleUk, 'Case must have Ukrainian title');
    assert.ok(c.problemStatement && c.problemStatement.length > 20, 'Case must have problem statement');
    assert.ok(c.constraints && c.constraints.length >= 3, 'Case must have constraints');
    assert.ok(c.alternatives && c.alternatives.length >= 2, 'Case must have at least 2 alternatives');
    assert.ok(c.codeEvidence, 'Case must reference code evidence');
    assert.ok(c.jiraKey && c.jiraKey.startsWith('SCRUM-'), 'Case must link to Jira');
  }
});

test('2. Trade-Off Dimensions & Alternatives: all alternatives scored across 4 dimensions', () => {
  const cases = getCasebook();
  const dimensionKeys = Object.keys(TRADE_OFF_DIMENSIONS);
  assert.deepEqual(dimensionKeys, ['COST', 'RISK', 'COMPLEXITY', 'REVERSIBILITY']);

  for (const c of cases) {
    for (const alt of c.alternatives) {
      assert.ok(alt.tradeOffs.cost >= 1 && alt.tradeOffs.cost <= 5);
      assert.ok(alt.tradeOffs.risk >= 1 && alt.tradeOffs.risk <= 5);
      assert.ok(alt.tradeOffs.complexity >= 1 && alt.tradeOffs.complexity <= 5);
      assert.ok(alt.tradeOffs.reversibility >= 1 && alt.tradeOffs.reversibility <= 5);
      assert.ok(alt.pros.length >= 1, 'Must have pros');
      assert.ok(alt.cons.length >= 1, 'Must have cons');
    }
  }
});

test('3. ADR Proposal Submission: enforces title, rationale, and rollback plan validation', () => {
  resetCasebookStore();

  // Incomplete submission
  const invalidRes = submitAdrProposal({
    caseId: 'case-canvas-loop',
    alternativeId: 'alt-canvas-b',
    title: 'Short',
    rationale: 'Too short',
    rollbackPlan: 'No',
  });
  assert.equal(invalidRes.success, false);
  assert.ok(invalidRes.error);

  // Valid submission
  const validRes = submitAdrProposal({
    caseId: 'case-canvas-loop',
    alternativeId: 'alt-canvas-b',
    title: 'Autonomous Canvas Loop with CustomEvent Bridge',
    rationale: 'Isolates 60 FPS animation loop from React Virtual DOM to prevent frame drops and eliminate removeChild crashes.',
    rollbackPlan: 'Instant rollback via Feature Flag to basic static rendering mode in case of browser incompatibility.',
    author: 'Yarik0505',
    jiraKey: 'SCRUM-66',
  });

  assert.equal(validRes.success, true);
  assert.ok(validRes.adr.id.startsWith('ADR-'));
  assert.equal(validRes.adr.status, 'Proposed');
  assert.equal(validRes.adr.selectedAlternative, 'alt-canvas-b');
  assert.equal(validRes.adr.owner, 'Yarik0505');
});

test('4. Mentor Reasoning Review Rubric: evaluates 5 criteria with passing threshold of 18/25', () => {
  resetCasebookStore();
  const adrId = 'ADR-001';

  // Passing review
  const passReview = reviewAdrProposal({
    adrId,
    reviewer: 'Dmytro Stepanenko',
    criteriaScores: {
      contextUnderstanding: 5,
      tradeOffAwareness: 5,
      reversibilityDesign: 5,
      consequenceMitigation: 4,
      evidenceGrounding: 5,
    },
    feedback: 'Excellent architectural rationale and thorough risk mitigation.',
  });

  assert.equal(passReview.success, true);
  assert.equal(passReview.adr.status, 'Accepted');
  assert.equal(passReview.reviewRecord.score, 24);
  assert.equal(passReview.reviewRecord.passed, true);

  // Failing review (< 18)
  const failReview = reviewAdrProposal({
    adrId,
    reviewer: 'Lead Mentor',
    criteriaScores: {
      contextUnderstanding: 2,
      tradeOffAwareness: 3,
      reversibilityDesign: 2,
      consequenceMitigation: 2,
      evidenceGrounding: 3,
    },
    feedback: 'Insufficient rollback plan and neglected serverless cold start impact.',
  });

  assert.equal(failReview.success, true);
  assert.equal(failReview.adr.status, 'Rejected');
  assert.equal(failReview.reviewRecord.score, 12);
  assert.equal(failReview.reviewRecord.passed, false);
});

test('5. Non-Dogmatic Evaluation: multiple viable alternatives can be approved with valid reasoning', () => {
  resetCasebookStore();

  // Submitting Alt B
  const resB = submitAdrProposal({
    caseId: 'case-child-auth',
    alternativeId: 'alt-auth-b',
    title: 'Stateful Redis Session Management with Edge Cache',
    rationale: 'Provides instant revocation across all regions, prioritized for enterprise institutions.',
    rollbackPlan: 'Switch to local memory cache if Redis endpoint fails.',
  });
  assert.equal(resB.success, true);

  const reviewB = reviewAdrProposal({
    adrId: resB.adr.id,
    criteriaScores: {
      contextUnderstanding: 4,
      tradeOffAwareness: 5,
      reversibilityDesign: 5,
      consequenceMitigation: 4,
      evidenceGrounding: 4,
    },
    feedback: 'High cloud cost justified by institution requirements; accepted for enterprise track.',
  });
  assert.equal(reviewB.adr.status, 'Accepted');

  // Submitting Alt C
  const resC = submitAdrProposal({
    caseId: 'case-child-auth',
    alternativeId: 'alt-auth-c',
    title: 'Stateless HMAC-SHA256 Signed Cookies',
    rationale: 'Zero cloud cost, optimal for student bootstrapping with sub-millisecond edge checks.',
    rollbackPlan: 'Rotate SESSION_SECRET to invalidate all sessions.',
  });
  assert.equal(resC.success, true);

  const reviewC = reviewAdrProposal({
    adrId: resC.adr.id,
    criteriaScores: {
      contextUnderstanding: 5,
      tradeOffAwareness: 5,
      reversibilityDesign: 5,
      consequenceMitigation: 4,
      evidenceGrounding: 5,
    },
    feedback: 'Perfect fit for student scale and zero budget; accepted.',
  });
  assert.equal(reviewC.adr.status, 'Accepted');
});

test('6. ADR Superseding & Historical Lineage: preserves deprecated decisions in audit history', () => {
  resetCasebookStore();

  const res = supersedeAdr({
    oldAdrId: 'ADR-002',
    newAdrProposal: {
      caseId: 'case-canvas-loop',
      alternativeId: 'alt-canvas-c',
      title: 'OffscreenCanvas Web Worker Architecture (v2 Evolution)',
      rationale: 'Mobile Safari has updated OffscreenCanvas support in 2026; moving compute to dedicated worker.',
      rollbackPlan: 'Fallback to main-thread requestAnimationFrame if worker creation fails.',
      author: 'Yarik0505',
      jiraKey: 'SCRUM-66',
    },
    author: 'Yarik0505',
  });

  assert.equal(res.success, true);
  assert.equal(res.oldAdr.status, 'Superseded');
  assert.equal(res.oldAdr.supersededBy, res.newAdr.id);
  assert.equal(res.newAdr.status, 'Accepted');

  // Ensure both remain in registry
  const registry = getAdrRegistry();
  assert.ok(registry.find((a) => a.id === 'ADR-002' && a.status === 'Superseded'));
  assert.ok(registry.find((a) => a.id === res.newAdr.id && a.status === 'Accepted'));
});

test('7. Jira & Code Evidence Tracing: every ADR references traceable ticket and repository path', () => {
  const registry = getAdrRegistry();
  for (const adr of registry) {
    assert.ok(adr.jiraKey, `ADR ${adr.id} must have Jira key`);
    assert.ok(adr.jiraKey.startsWith('SCRUM-'), `ADR ${adr.id} must have SCRUM-XX Jira key`);
    assert.ok(adr.codeEvidence, `ADR ${adr.id} must reference code evidence`);
    assert.ok(
      fs.existsSync(path.resolve(adr.codeEvidence)),
      `Code evidence path ${adr.codeEvidence} must exist in repository`
    );
  }
});

test('8. Architecture Casebook API Route & UI Component: verified files and route exports', () => {
  const apiRoutePath = path.resolve('app/api/academy/sysdesign/casebook/route.js');
  const componentPath = path.resolve('components/academy/ArchitectureCasebookView.jsx');

  assert.ok(fs.existsSync(apiRoutePath), 'API route file must exist');
  assert.ok(fs.existsSync(componentPath), 'UI component file must exist');

  const content = fs.readFileSync(apiRoutePath, 'utf8');
  assert.ok(content.includes('export async function GET'));
  assert.ok(content.includes('export async function POST'));
  assert.ok(content.includes('submit_adr'));
  assert.ok(content.includes('review_adr'));
  assert.ok(content.includes('supersede_adr'));
});
