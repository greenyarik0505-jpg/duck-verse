import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TEAM_MEMBERS,
  QUARTERLY_ROADMAP,
  RISK_REGISTER,
  TECH_RADAR,
  GRADUATION_GATES,
  calculateWorkloadFairness,
  triageNewTask,
  validateGovernanceModel
} from '../lib/academy/governance/roadmap.js';

test('Engineering Governance — Model Integrity & Validation', () => {
  const result = validateGovernanceModel();
  assert.equal(result.valid, true, `Governance model must be valid. Issues: ${result.issues.join(', ')}`);
  assert.equal(result.summary.quarters, 4, 'Must cover 4 quarters');
  assert.equal(result.summary.teamMembers, 3, 'Must register 3 team members');
  assert.ok(result.summary.risks >= 5, 'Must contain at least 5 documented risks');
  assert.ok(result.summary.techRadarItems >= 10, 'Must contain comprehensive Tech Radar items');
});

test('Engineering Governance — Workload Fairness & Capacity Calculation', () => {
  const fairness = calculateWorkloadFairness();
  assert.equal(typeof fairness.totalAssignedSp, 'number');
  assert.ok(fairness.totalAssignedSp > 0, 'Total roadmap SP must be greater than zero');
  assert.equal(fairness.members.length, 3, 'Must evaluate all 3 members');
  assert.equal(fairness.isFairlyDistributed, true, 'Workload must be fairly balanced across members');

  fairness.members.forEach(member => {
    assert.ok(member.name, 'Member must have a name');
    assert.ok(member.assignedSp > 0, 'Member must have assigned SP');
    assert.equal(member.isOverloaded, false, `${member.name} must not be overloaded`);
  });
});

test('Engineering Governance — Task Triage Validation Logic', () => {
  // 1. Valid task triage
  const validTask = {
    title: 'Implement Multi-File In-Browser Code Editor',
    owner: 'Yarik0505',
    level: 'L8',
    storyPoints: 8,
    acceptanceCriteria: [
      'Multi-file tab switching without state loss',
      'Monaco/CodeMirror integration with syntax highlighting',
      'Automated unit tests covering save/restore state'
    ]
  };
  const triageResult = triageNewTask(validTask);
  assert.equal(triageResult.valid, true, `Valid task must be accepted. Errors: ${triageResult.errors.join(', ')}`);
  assert.equal(triageResult.triagedTask.triageStatus, 'ACCEPTED');

  // 2. Reject task with invalid owner
  const invalidOwner = triageNewTask({
    ...validTask,
    owner: 'UnknownHacker99'
  });
  assert.equal(invalidOwner.valid, false);
  assert.ok(invalidOwner.errors.some(e => e.includes('owner')));

  // 3. Reject task with invalid level
  const invalidLevel = triageNewTask({
    ...validTask,
    level: 'L99'
  });
  assert.equal(invalidLevel.valid, false);
  assert.ok(invalidLevel.errors.some(e => e.includes('level')));

  // 4. Reject task with missing acceptance criteria
  const missingCriteria = triageNewTask({
    ...validTask,
    acceptanceCriteria: []
  });
  assert.equal(missingCriteria.valid, false);
  assert.ok(missingCriteria.errors.some(e => e.includes('acceptance criterion')));
});

test('Engineering Governance — Tech Radar Rings & Prohibited Practices', () => {
  assert.ok(TECH_RADAR.ADOPT.length >= 5, 'ADOPT ring must contain foundational tools');
  assert.ok(TECH_RADAR.TRIAL.length >= 2, 'TRIAL ring must contain experimental platforms');
  assert.ok(TECH_RADAR.ASSESS.length >= 2, 'ASSESS ring must evaluate upcoming tech');
  assert.ok(TECH_RADAR.HOLD.length >= 2, 'HOLD ring must document strictly prohibited patterns');

  const holdNames = TECH_RADAR.HOLD.map(i => i.name.toLowerCase());
  assert.ok(holdNames.some(n => n.includes('innerhtml')), 'Must explicitly place innerHTML wipeout on HOLD');
  assert.ok(holdNames.some(n => n.includes('push to main')), 'Must explicitly place direct push to main on HOLD');
});

test('Engineering Governance — Graduation Gates Quality Bar', () => {
  assert.equal(GRADUATION_GATES.MINIMUM_PASSING_SCORE, 80, 'Graduation threshold must be 80%');
  
  const totalWeight = GRADUATION_GATES.DIMENSIONS.reduce((acc, d) => acc + d.weight, 0);
  assert.ok(Math.abs(totalWeight - 1.0) < 0.001, 'Dimension weights must sum to 1.0 (100%)');
  
  assert.equal(GRADUATION_GATES.PASSING_LEVELS.length, 10, 'Must cover levels L0 through L9');
  assert.equal(GRADUATION_GATES.PASSING_LEVELS[0], 'L0');
  assert.equal(GRADUATION_GATES.PASSING_LEVELS[9], 'L9');
});
