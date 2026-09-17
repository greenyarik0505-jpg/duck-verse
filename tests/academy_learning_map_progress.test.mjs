import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  MASTERY_LEVELS,
  SKILL_TAXONOMY,
  LESSON_CATALOG,
  calculateLearnerProgress
} from '../lib/academy/dashboard/learningMap.js';

test('1. Mastery Levels: defines Beginner, Junior, Middle, and Senior with descriptions and ranges', () => {
  assert.ok(MASTERY_LEVELS.BEGINNER, 'BEGINNER level must exist');
  assert.ok(MASTERY_LEVELS.JUNIOR, 'JUNIOR level must exist');
  assert.ok(MASTERY_LEVELS.MIDDLE, 'MIDDLE level must exist');
  assert.ok(MASTERY_LEVELS.SENIOR, 'SENIOR level must exist');

  assert.equal(MASTERY_LEVELS.BEGINNER.range.join(','), 'L0,L1');
  assert.equal(MASTERY_LEVELS.JUNIOR.range.join(','), 'L2,L3,L4');
  assert.equal(MASTERY_LEVELS.MIDDLE.range.join(','), 'L5,L6,L7');
  assert.equal(MASTERY_LEVELS.SENIOR.range.join(','), 'L8,L9');

  Object.values(MASTERY_LEVELS).forEach((level) => {
    assert.ok(level.title.length > 5, 'Level title must be descriptive');
    assert.ok(level.description.length > 20, 'Level description must be clear');
    assert.ok(level.badge, 'Level must have an icon badge');
  });
});

test('2. Skill Taxonomy: defines 6 core engineering skills', () => {
  const expectedSkills = ['git', 'ui', 'api', 'testing', 'security', 'architecture'];
  const actualSkillKeys = Object.values(SKILL_TAXONOMY).map((s) => s.id);
  assert.deepEqual(actualSkillKeys.sort(), expectedSkills.sort());
});

test('3. Empty State for New Learner: highlights L0, flags isNewStudent, 0% progress', () => {
  const result = calculateLearnerProgress([], { username: 'NewCadet', role: 'child' });

  assert.equal(result.progress.isNewStudent, true, 'Must flag new student when 0 lessons completed');
  assert.equal(result.progress.overallPercentage, 0, 'Progress must be 0%');
  assert.equal(result.tier.id, 'beginner', 'New student must start at beginner tier');
  assert.ok(result.recommendedNextTask, 'Must provide recommended next task');
  assert.equal(result.recommendedNextTask.id, 'lesson-fe-l0-arch');
  assert.equal(result.recommendedNextTask.jiraKey, 'SCRUM-56');
});

test('4. Progression & Single Recommended Task: DAG unblocked sequential recommendation', () => {
  // Scenario A: Completed L0 -> Next must be L1 (SCRUM-54)
  const afterL0 = calculateLearnerProgress(['lesson-fe-l0-arch']);
  assert.equal(afterL0.progress.isNewStudent, false);
  assert.equal(afterL0.progress.completedCount, 1);
  assert.equal(afterL0.recommendedNextTask.id, 'lesson-fe-l1-auth');
  assert.equal(afterL0.recommendedNextTask.jiraKey, 'SCRUM-54');

  // Scenario B: Completed L0 + L1 -> Tier advances to Junior, Next is L2 (SCRUM-44)
  const afterL1 = calculateLearnerProgress(['lesson-fe-l0-arch', 'lesson-fe-l1-auth']);
  assert.equal(afterL1.tier.id, 'junior');
  assert.equal(afterL1.recommendedNextTask.id, 'lesson-fe-l2-testing');
  assert.equal(afterL1.recommendedNextTask.jiraKey, 'SCRUM-44');

  // Scenario C: Completed L0..L4 -> Tier advances to Middle, Next is L5 (SCRUM-66)
  const afterL4 = calculateLearnerProgress([
    'lesson-fe-l0-arch',
    'lesson-fe-l1-auth',
    'lesson-fe-l2-testing',
    'lesson-fe-l3-prompts',
    'lesson-fe-l4-portfolio'
  ]);
  assert.equal(afterL4.tier.id, 'middle');
  assert.equal(afterL4.recommendedNextTask.id, 'lesson-fe-l5-sysdesign');
  assert.equal(afterL4.recommendedNextTask.jiraKey, 'SCRUM-66');

  // Scenario D: Completed All 10 -> Tier is Senior, 100% progress
  const allIds = LESSON_CATALOG.map((l) => l.id);
  const afterAll = calculateLearnerProgress(allIds);
  assert.equal(afterAll.tier.id, 'senior');
  assert.equal(afterAll.progress.overallPercentage, 100);
});

test('5. Non-Fabricated Deterministic Skill Calculation: points earned strictly from completed lessons', () => {
  const result = calculateLearnerProgress(['lesson-fe-l0-arch']);
  const archSkill = result.skills.find((s) => s.id === 'architecture');
  assert.ok(archSkill.score > 0, 'Architecture score must increase after completing L0');

  const emptyResult = calculateLearnerProgress([]);
  emptyResult.skills.forEach((s) => {
    assert.equal(s.score, 0, 'Skill scores must be exactly 0 for zero completed lessons');
  });
});

test('6. Privacy & Role Isolation: prevents cross-student data leakage', () => {
  const studentResult = calculateLearnerProgress(['lesson-fe-l0-arch'], { username: 'DuckCadet1', role: 'child' });
  assert.equal(studentResult.student.username, 'DuckCadet1');
  assert.equal(studentResult.student.role, 'child');
  assert.equal(typeof studentResult.student.email, 'undefined', 'Emails or PII must not be exposed');
});

test('7. API Route and UI Component: files exist and export expected components', () => {
  const apiPath = path.resolve('app/api/academy/learning-map/route.js');
  const compPath = path.resolve('components/academy/LearningMapDashboard.jsx');

  assert.ok(fs.existsSync(apiPath), 'API route file must exist');
  assert.ok(fs.existsSync(compPath), 'UI component file must exist');

  const apiContent = fs.readFileSync(apiPath, 'utf8');
  assert.ok(apiContent.includes('export async function GET'), 'API route must export GET handler');

  const compContent = fs.readFileSync(compPath, 'utf8');
  assert.ok(compContent.includes('export default function LearningMapDashboard'), 'UI component must export default function');
  assert.ok(compContent.includes('tabIndex'), 'UI component must support keyboard navigation');
});
