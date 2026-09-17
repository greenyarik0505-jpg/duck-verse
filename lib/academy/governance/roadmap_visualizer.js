/**
 * Duck Academy — Roadmap Dependency Visualizer & Blocked-Work Alerts (SCRUM-138)
 * 
 * Production graph engine for Jira link-driven roadmap dependencies:
 * - Builds DAG from Jira issue links (blocks, prerequisite, relates)
 * - Identifies owners, levels, statuses, blockers, and next available tasks
 * - Detects cycles (circular dependencies) and missing prerequisites
 * - Role-based filtering: Child view (personal path + approved electives) vs Mentor/Admin full view
 * - Blocked-work alert engine with rate-limiting / anti-spam cooldown and actionable next steps
 * - Provides intentional broken fixtures for regression and error signaling verification
 */

export const JIRA_RELATION_TYPES = Object.freeze({
  BLOCKS: 'blocks',
  IS_BLOCKED_BY: 'is_blocked_by',
  PREREQUISITE_FOR: 'prerequisite_for',
  DEPENDS_ON: 'depends_on',
  RELATES_TO: 'relates_to'
});

export const TASK_EXECUTION_STATE = Object.freeze({
  DONE: 'DONE',
  IN_PROGRESS: 'IN_PROGRESS',
  READY_TO_START: 'READY_TO_START',
  BLOCKED: 'BLOCKED'
});

/**
 * Baseline Jira roadmap issues and link topology for Duck Academy tracks
 */
export const DEFAULT_ROADMAP_ISSUES = Object.freeze([
  {
    key: 'SCRUM-56',
    summary: 'Curriculum DAG Registry & Validation',
    owner: 'Yarik0505',
    assigneeId: '712020:d66a7a94-b2f2-4434-9582-8190026d3c20',
    level: 'L0',
    status: 'Done',
    priority: 'High',
    isElective: false,
    prerequisites: []
  },
  {
    key: 'SCRUM-54',
    summary: 'Auth Backend, Sessions & Role Hierarchy',
    owner: 'Кирил Пушкарук',
    assigneeId: '712020:23aa804c-99cb-4863-9cda-ee2bfa879882',
    level: 'L1',
    status: 'Done',
    priority: 'High',
    isElective: false,
    prerequisites: ['SCRUM-56']
  },
  {
    key: 'SCRUM-58',
    summary: 'Graduation Capstone Pipeline & Quality Bar',
    owner: 'Yarik0505',
    assigneeId: '712020:d66a7a94-b2f2-4434-9582-8190026d3c20',
    level: 'L4',
    status: 'Done',
    priority: 'Highest',
    isElective: false,
    prerequisites: ['SCRUM-54']
  },
  {
    key: 'SCRUM-66',
    summary: 'Architecture Decision Records (ADRs) & System Design',
    owner: 'Yarik0505',
    assigneeId: '712020:d66a7a94-b2f2-4434-9582-8190026d3c20',
    level: 'L5',
    status: 'Done',
    priority: 'High',
    isElective: false,
    prerequisites: ['SCRUM-58']
  },
  {
    key: 'SCRUM-82',
    summary: 'Competency Matrix & Skill Analytics Engine',
    owner: 'Yarik0505',
    assigneeId: '712020:d66a7a94-b2f2-4434-9582-8190026d3c20',
    level: 'L6',
    status: 'Done',
    priority: 'High',
    isElective: false,
    prerequisites: ['SCRUM-66']
  },
  {
    key: 'SCRUM-133',
    summary: 'Senior Engineering Metrics & Portfolio Dossier',
    owner: 'Yarik0505',
    assigneeId: '712020:d66a7a94-b2f2-4434-9582-8190026d3c20',
    level: 'L8',
    status: 'Done',
    priority: 'High',
    isElective: false,
    prerequisites: ['SCRUM-82']
  },
  {
    key: 'SCRUM-136',
    summary: 'Architecture Trade-Off Casebook & ADR Review',
    owner: 'Yarik0505',
    assigneeId: '712020:d66a7a94-b2f2-4434-9582-8190026d3c20',
    level: 'L8',
    status: 'Done',
    priority: 'High',
    isElective: false,
    prerequisites: ['SCRUM-133']
  },
  {
    key: 'SCRUM-137',
    summary: 'Mentoring Leadership Loop & Feedback Calibration',
    owner: 'Yarik0505',
    assigneeId: '712020:d66a7a94-b2f2-4434-9582-8190026d3c20',
    level: 'L8',
    status: 'Done',
    priority: 'High',
    isElective: false,
    prerequisites: ['SCRUM-136']
  },
  {
    key: 'SCRUM-138',
    summary: 'Roadmap dependency visualizer and blocked-work alerts',
    owner: 'Yarik0505',
    assigneeId: '712020:d66a7a94-b2f2-4434-9582-8190026d3c20',
    level: 'L9',
    status: 'In Progress',
    priority: 'Highest',
    isElective: false,
    prerequisites: ['SCRUM-137']
  },
  {
    key: 'SCRUM-142',
    summary: 'GitHub repository provisioning and permissions automation',
    owner: 'Yarik0505',
    assigneeId: '712020:d66a7a94-b2f2-4434-9582-8190026d3c20',
    level: 'L9',
    status: 'To Do',
    priority: 'High',
    isElective: false,
    prerequisites: ['SCRUM-138']
  },
  {
    key: 'SCRUM-146',
    summary: 'Engineering governance scorecard for PR and release evidence',
    owner: 'Yarik0505',
    assigneeId: '712020:d66a7a94-b2f2-4434-9582-8190026d3c20',
    level: 'L9',
    status: 'To Do',
    priority: 'Highest',
    isElective: false,
    prerequisites: ['SCRUM-142']
  },
  // Electives
  {
    key: 'ELECTIVE-AUDIO-SYNTH',
    summary: 'Web Audio API Real-time Polyphonic Synthesizer',
    owner: 'Кирил Пушкарук',
    assigneeId: '712020:23aa804c-99cb-4863-9cda-ee2bfa879882',
    level: 'L2',
    status: 'Done',
    priority: 'Medium',
    isElective: true,
    approvedForChild: true,
    prerequisites: ['SCRUM-54']
  },
  {
    key: 'ELECTIVE-CHAOS-DAY',
    summary: 'Chaos Engineering & Game Latency Injection',
    owner: 'Степаненко Дмитро',
    assigneeId: '712020:78105bfe-a055-429c-b519-d1b35998b9af',
    level: 'L7',
    status: 'To Do',
    priority: 'Low',
    isElective: true,
    approvedForChild: false,
    prerequisites: ['SCRUM-82']
  }
]);

/**
 * Builds dependency graph from issues and explicit Jira links.
 * 
 * @param {Array} issues - Array of issue objects
 * @param {Array} customLinks - Optional override of explicit Jira links [{ source, target, type }]
 * @returns {Object} { nodes, edges, cycles, missingPrerequisites, summary }
 */
export function buildDependencyGraph(issues = DEFAULT_ROADMAP_ISSUES, customLinks = null) {
  const issueMap = new Map();
  for (const issue of issues) {
    issueMap.set(issue.key, { ...issue });
  }

  const edges = [];
  const missingPrerequisites = [];

  // Build edges either from explicit links or from prerequisites field
  if (customLinks && Array.isArray(customLinks)) {
    for (const link of customLinks) {
      if (!issueMap.has(link.source)) {
        missingPrerequisites.push({ issueKey: link.target, missingKey: link.source });
      }
      if (!issueMap.has(link.target)) {
        missingPrerequisites.push({ issueKey: link.source, missingKey: link.target });
      }
      edges.push({
        source: link.source,
        target: link.target,
        type: link.type || JIRA_RELATION_TYPES.PREREQUISITE_FOR
      });
    }
  } else {
    for (const issue of issues) {
      const prereqs = issue.prerequisites || [];
      for (const pKey of prereqs) {
        if (!issueMap.has(pKey)) {
          missingPrerequisites.push({ issueKey: issue.key, missingKey: pKey });
        }
        edges.push({
          source: pKey,
          target: issue.key,
          type: JIRA_RELATION_TYPES.PREREQUISITE_FOR
        });
      }
    }
  }

  // Detect Cycles using Depth-First Search
  const cycles = detectCycles(issueMap, edges);

  // Evaluate execution status for each node (DONE, IN_PROGRESS, READY_TO_START, BLOCKED)
  const evaluatedNodes = [];
  for (const issue of issues) {
    const isDone = issue.status === 'Done' || issue.status === 'In Review' || issue.completed === true;
    const isInProgress = issue.status === 'In Progress' || issue.status === 'В работе';

    // Find incoming prerequisite edges
    const incomingPrereqKeys = edges
      .filter((e) => e.target === issue.key)
      .map((e) => e.source);

    const blockers = [];
    for (const pKey of incomingPrereqKeys) {
      const prereqIssue = issueMap.get(pKey);
      if (!prereqIssue) {
        blockers.push({
          key: pKey,
          summary: 'Missing Prerequisite (Unknown Issue)',
          owner: 'Unknown',
          status: 'MISSING'
        });
      } else {
        const prereqDone = prereqIssue.status === 'Done' || prereqIssue.status === 'In Review' || prereqIssue.completed === true;
        if (!prereqDone) {
          blockers.push({
            key: prereqIssue.key,
            summary: prereqIssue.summary,
            owner: prereqIssue.owner,
            status: prereqIssue.status
          });
        }
      }
    }

    let executionState;
    if (isDone) {
      executionState = TASK_EXECUTION_STATE.DONE;
    } else if (isInProgress) {
      executionState = TASK_EXECUTION_STATE.IN_PROGRESS;
    } else if (blockers.length === 0) {
      executionState = TASK_EXECUTION_STATE.READY_TO_START;
    } else {
      executionState = TASK_EXECUTION_STATE.BLOCKED;
    }

    evaluatedNodes.push({
      ...issue,
      executionState,
      isBlocked: blockers.length > 0 && !isDone,
      blockers,
      prerequisiteKeys: incomingPrereqKeys
    });
  }

  return {
    nodes: evaluatedNodes,
    edges,
    cycles,
    hasCycles: cycles.length > 0,
    missingPrerequisites,
    hasMissingPrerequisites: missingPrerequisites.length > 0,
    summary: {
      totalTasks: evaluatedNodes.length,
      doneCount: evaluatedNodes.filter((n) => n.executionState === TASK_EXECUTION_STATE.DONE).length,
      inProgressCount: evaluatedNodes.filter((n) => n.executionState === TASK_EXECUTION_STATE.IN_PROGRESS).length,
      readyCount: evaluatedNodes.filter((n) => n.executionState === TASK_EXECUTION_STATE.READY_TO_START).length,
      blockedCount: evaluatedNodes.filter((n) => n.executionState === TASK_EXECUTION_STATE.BLOCKED).length
    }
  };
}

/**
 * Detect cycles in the directed dependency graph.
 */
function detectCycles(issueMap, edges) {
  const adj = new Map();
  for (const key of issueMap.keys()) {
    adj.set(key, []);
  }
  for (const edge of edges) {
    if (adj.has(edge.source)) {
      adj.get(edge.source).push(edge.target);
    }
  }

  const visited = new Set();
  const recursionStack = new Set();
  const cycles = [];

  function dfs(node, path) {
    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const neighbors = adj.get(node) || [];
    for (const next of neighbors) {
      if (!visited.has(next)) {
        dfs(next, [...path]);
      } else if (recursionStack.has(next)) {
        const cycleStartIndex = path.indexOf(next);
        const cycle = [...path.slice(cycleStartIndex), next];
        cycles.push(cycle);
      }
    }

    recursionStack.delete(node);
  }

  for (const node of issueMap.keys()) {
    if (!visited.has(node)) {
      dfs(node, []);
    }
  }

  return cycles;
}

/**
 * Returns tasks that are currently unblocked and ready to be worked on.
 */
export function getNextAvailableTasks(graph, filterAssigneeId = null) {
  let candidates = graph.nodes.filter(
    (n) => n.executionState === TASK_EXECUTION_STATE.READY_TO_START
  );

  if (filterAssigneeId) {
    candidates = candidates.filter((n) => n.assigneeId === filterAssigneeId);
  }

  return candidates.sort((a, b) => {
    // Sort by level order L0 -> L9
    const lvlA = parseInt((a.level || 'L0').replace(/\D/g, ''), 10) || 0;
    const lvlB = parseInt((b.level || 'L0').replace(/\D/g, ''), 10) || 0;
    return lvlA - lvlB;
  });
}

/**
 * Filters the graph for the Child/Student role view:
 * Shows only tasks assigned to the child, plus approved electives,
 * and hides unrelated tasks from other team members.
 */
export function filterForChildView(graph, childAccountId, approvedElectiveKeys = ['ELECTIVE-AUDIO-SYNTH']) {
  const approvedSet = new Set(approvedElectiveKeys);

  const filteredNodes = graph.nodes.filter((node) => {
    if (node.assigneeId === childAccountId) return true;
    if (node.isElective && approvedSet.has(node.key)) return true;
    return false;
  });

  const nodeKeySet = new Set(filteredNodes.map((n) => n.key));
  const filteredEdges = graph.edges.filter(
    (e) => nodeKeySet.has(e.source) && nodeKeySet.has(e.target)
  );

  return {
    ...graph,
    nodes: filteredNodes,
    edges: filteredEdges,
    isChildView: true,
    childAccountId,
    summary: {
      totalTasks: filteredNodes.length,
      doneCount: filteredNodes.filter((n) => n.executionState === TASK_EXECUTION_STATE.DONE).length,
      inProgressCount: filteredNodes.filter((n) => n.executionState === TASK_EXECUTION_STATE.IN_PROGRESS).length,
      readyCount: filteredNodes.filter((n) => n.executionState === TASK_EXECUTION_STATE.READY_TO_START).length,
      blockedCount: filteredNodes.filter((n) => n.executionState === TASK_EXECUTION_STATE.BLOCKED).length
    }
  };
}

/**
 * Generates non-spamming, deduplicated alerts for blocked tasks with actionable next steps.
 * 
 * @param {Object} graph - Evaluated graph from buildDependencyGraph
 * @param {Object} options - { cooldownMinutes = 60, recentAlertHistory = {} }
 */
export function generateBlockedWorkAlerts(graph, options = {}) {
  const { cooldownMinutes = 60, recentAlertHistory = {} } = options;
  const now = Date.now();
  const cooldownMs = cooldownMinutes * 60 * 1000;

  const alerts = [];

  const blockedNodes = graph.nodes.filter(
    (n) => n.executionState === TASK_EXECUTION_STATE.BLOCKED
  );

  for (const node of blockedNodes) {
    const blockerKeys = node.blockers.map((b) => b.key).sort();
    const alertId = `alert-${node.key}-${blockerKeys.join('_')}`;

    // Anti-Spam / Cooldown Check
    const lastSent = recentAlertHistory[alertId] || 0;
    const isRateLimited = now - lastSent < cooldownMs;

    // Actionable Next Step formulation
    let actionableNextStep;
    if (node.blockers.some((b) => b.status === 'MISSING')) {
      actionableNextStep = `Prerequisite link missing in Jira. Add or fix prerequisite relationship for ${node.key}.`;
    } else {
      const primaryBlocker = node.blockers[0];
      actionableNextStep = `Reach out to ${primaryBlocker.owner} or review open PR for ${primaryBlocker.key} (${primaryBlocker.summary}) to unlock ${node.key}.`;
    }

    const urgency = node.priority === 'Highest' || node.level === 'L9' ? 'HIGH' : 'MEDIUM';

    alerts.push({
      id: alertId,
      blockedIssueKey: node.key,
      taskSummary: node.summary,
      owner: node.owner,
      level: node.level,
      urgency,
      blockers: node.blockers,
      actionableNextStep,
      isRateLimited,
      cooldownExpiresAt: new Date(lastSent + cooldownMs).toISOString()
    });
  }

  return {
    alerts,
    activeCount: alerts.filter((a) => !a.isRateLimited).length,
    suppressedCount: alerts.filter((a) => a.isRateLimited).length
  };
}

/**
 * Intentional broken fixture with circular dependency (A -> B -> C -> A)
 */
export const BROKEN_CIRCULAR_FIXTURE = Object.freeze({
  issues: [
    { key: 'TEST-A', summary: 'Task A', owner: 'Dev A', level: 'L1', status: 'To Do', prerequisites: ['TEST-C'] },
    { key: 'TEST-B', summary: 'Task B', owner: 'Dev B', level: 'L1', status: 'To Do', prerequisites: ['TEST-A'] },
    { key: 'TEST-C', summary: 'Task C', owner: 'Dev C', level: 'L1', status: 'To Do', prerequisites: ['TEST-B'] }
  ]
});

/**
 * Intentional broken fixture with missing prerequisite (pointing to SCRUM-999 which does not exist)
 */
export const BROKEN_MISSING_PREREQ_FIXTURE = Object.freeze({
  issues: [
    { key: 'TEST-ORPHAN', summary: 'Task with Dead Link', owner: 'Dev', level: 'L1', status: 'To Do', prerequisites: ['SCRUM-999-DOES-NOT-EXIST'] }
  ]
});
