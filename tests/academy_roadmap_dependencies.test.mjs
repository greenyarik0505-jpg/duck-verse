import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDependencyGraph,
  getNextAvailableTasks,
  filterForChildView,
  generateBlockedWorkAlerts,
  BROKEN_CIRCULAR_FIXTURE,
  BROKEN_MISSING_PREREQ_FIXTURE,
  DEFAULT_ROADMAP_ISSUES,
  TASK_EXECUTION_STATE
} from '../lib/academy/governance/roadmap_visualizer.js';

test('1. Dependency Graph Topology: builds nodes and edges from Jira issues and links', () => {
  const graph = buildDependencyGraph(DEFAULT_ROADMAP_ISSUES);
  assert.ok(graph.nodes.length >= 10, 'Graph should contain all roadmap issues');
  assert.ok(graph.edges.length >= 8, 'Graph should contain dependency edges');
  assert.equal(graph.hasCycles, false, 'Default roadmap should have no circular dependencies');
  assert.equal(graph.hasMissingPrerequisites, false, 'Default roadmap should have no missing prerequisites');

  const scrum138 = graph.nodes.find((n) => n.key === 'SCRUM-138');
  assert.ok(scrum138, 'SCRUM-138 node must exist in graph');
  assert.equal(scrum138.owner, 'Yarik0505');
  assert.equal(scrum138.level, 'L9');
});

test('2. Task Execution State: accurately marks DONE, IN_PROGRESS, READY, and BLOCKED', () => {
  const graph = buildDependencyGraph(DEFAULT_ROADMAP_ISSUES);

  // SCRUM-56 is Done
  const scrum56 = graph.nodes.find((n) => n.key === 'SCRUM-56');
  assert.equal(scrum56.executionState, TASK_EXECUTION_STATE.DONE);

  // SCRUM-138 is In Progress
  const scrum138 = graph.nodes.find((n) => n.key === 'SCRUM-138');
  assert.equal(scrum138.executionState, TASK_EXECUTION_STATE.IN_PROGRESS);

  // SCRUM-142 is blocked by SCRUM-138 (since SCRUM-138 is In Progress, not Done)
  const scrum142 = graph.nodes.find((n) => n.key === 'SCRUM-142');
  assert.equal(scrum142.executionState, TASK_EXECUTION_STATE.BLOCKED);
  assert.ok(scrum142.isBlocked);
  assert.equal(scrum142.blockers.length, 1);
  assert.equal(scrum142.blockers[0].key, 'SCRUM-138');
});

test('3. Circular Dependency Detection: flags cycles and provides exact cycle path', () => {
  const brokenGraph = buildDependencyGraph(BROKEN_CIRCULAR_FIXTURE.issues);
  assert.equal(brokenGraph.hasCycles, true, 'Must detect circular dependency in broken fixture');
  assert.ok(brokenGraph.cycles.length > 0, 'Cycles array must not be empty');

  const cycle = brokenGraph.cycles[0];
  assert.ok(cycle.includes('TEST-A'));
  assert.ok(cycle.includes('TEST-B'));
  assert.ok(cycle.includes('TEST-C'));
});

test('4. Missing Prerequisite Signaling: flags dead link Jira references', () => {
  const missingGraph = buildDependencyGraph(BROKEN_MISSING_PREREQ_FIXTURE.issues);
  assert.equal(missingGraph.hasMissingPrerequisites, true);
  assert.equal(missingGraph.missingPrerequisites.length, 1);
  assert.equal(missingGraph.missingPrerequisites[0].missingKey, 'SCRUM-999-DOES-NOT-EXIST');

  const orphanNode = missingGraph.nodes.find((n) => n.key === 'TEST-ORPHAN');
  assert.equal(orphanNode.executionState, TASK_EXECUTION_STATE.BLOCKED);
  assert.equal(orphanNode.blockers[0].status, 'MISSING');
});

test('5. Next Available Tasks: returns unblocked tasks ready to start sorted by level', () => {
  // Custom fixture with 1 done prerequisite and 1 ready task
  const testIssues = [
    { key: 'STEP-1', summary: 'Base Setup', level: 'L0', status: 'Done', prerequisites: [] },
    { key: 'STEP-2', summary: 'Feature Build', level: 'L1', status: 'To Do', prerequisites: ['STEP-1'], assigneeId: 'child-1' },
    { key: 'STEP-3', summary: 'Release', level: 'L2', status: 'To Do', prerequisites: ['STEP-2'], assigneeId: 'child-1' }
  ];

  const graph = buildDependencyGraph(testIssues);
  const nextTasks = getNextAvailableTasks(graph);

  assert.equal(nextTasks.length, 1);
  assert.equal(nextTasks[0].key, 'STEP-2');
  assert.equal(nextTasks[0].executionState, TASK_EXECUTION_STATE.READY_TO_START);
});

test('6. Child Role View Filtering: prunes unapproved electives and team tasks', () => {
  const fullGraph = buildDependencyGraph(DEFAULT_ROADMAP_ISSUES);
  const childGraph = filterForChildView(
    fullGraph,
    '712020:d66a7a94-b2f2-4434-9582-8190026d3c20',
    ['ELECTIVE-AUDIO-SYNTH']
  );

  assert.ok(childGraph.isChildView);
  // Unapproved elective ELECTIVE-CHAOS-DAY should be excluded
  const chaosElective = childGraph.nodes.find((n) => n.key === 'ELECTIVE-CHAOS-DAY');
  assert.equal(chaosElective, undefined, 'Unapproved elective must not appear in child view');

  // Approved elective must be present
  const audioElective = childGraph.nodes.find((n) => n.key === 'ELECTIVE-AUDIO-SYNTH');
  assert.ok(audioElective, 'Approved elective must appear in child view');
});

test('7. Blocked-Work Alerts Engine: generates actionable next steps and suppresses duplicate spam', () => {
  const graph = buildDependencyGraph(DEFAULT_ROADMAP_ISSUES);
  const firstAlerts = generateBlockedWorkAlerts(graph, { cooldownMinutes: 60 });

  assert.ok(firstAlerts.alerts.length > 0, 'Must produce alerts for blocked tasks');
  const alert142 = firstAlerts.alerts.find((a) => a.blockedIssueKey === 'SCRUM-142');
  assert.ok(alert142, 'Must generate alert for blocked SCRUM-142');
  assert.equal(alert142.urgency, 'HIGH');
  assert.ok(alert142.actionableNextStep.includes('SCRUM-138'));
  assert.equal(alert142.isRateLimited, false);

  // Simulate recent alert timestamp (within cooldown)
  const history = { [alert142.id]: Date.now() - 5 * 60 * 1000 }; // 5 mins ago
  const secondAlerts = generateBlockedWorkAlerts(graph, { cooldownMinutes: 60, recentAlertHistory: history });
  const suppressedAlert = secondAlerts.alerts.find((a) => a.id === alert142.id);

  assert.equal(suppressedAlert.isRateLimited, true, 'Repeated alert within cooldown must be suppressed');
  assert.equal(secondAlerts.suppressedCount, 1);
});

test('8. API Route and UI Component: files exist and export expected endpoints', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const apiRoutePath = path.resolve('app/api/academy/governance/dependencies/route.js');
  const componentPath = path.resolve('components/academy/RoadmapDependencyVisualizerView.jsx');

  assert.ok(fs.existsSync(apiRoutePath), 'API route file must exist');
  assert.ok(fs.existsSync(componentPath), 'UI component file must exist');

  const apiContent = fs.readFileSync(apiRoutePath, 'utf8');
  assert.ok(apiContent.includes('export async function GET'), 'GET route must be exported');
  assert.ok(apiContent.includes('export async function POST'), 'POST route must be exported');
  assert.ok(apiContent.includes('buildDependencyGraph'), 'API route must invoke buildDependencyGraph');
  assert.ok(apiContent.includes('generateBlockedWorkAlerts'), 'API route must invoke generateBlockedWorkAlerts');
});
