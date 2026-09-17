/**
 * Duck Academy — Engineering Governance Scorecard for PR & Release Evidence (SCRUM-146)
 * 
 * Objective quality rubric and evidence evaluation engine:
 * - Evaluates 7 core evidence dimensions: branch, Jira key, CI, tests, reviewers, security, deployment
 * - Constructive, non-punitive remediation guidance for any missing evidence
 * - Versioned rubric with effective date and governance changelog
 * - Dispute mechanism and mentor calibration notes
 * - Privacy-by-design: minimal PII, zero sensitive leak
 */

export const SCORECARD_RUBRIC_VERSION = 'v2.4.0';
export const SCORECARD_EFFECTIVE_DATE = '2026-03-01';

export const SCORECARD_CHANGELOG = Object.freeze([
  {
    version: 'v2.4.0',
    date: '2026-03-01',
    author: 'Yarik0505',
    changes: 'Added non-punitive remediation recommendations and student dispute loop.'
  },
  {
    version: 'v2.3.0',
    date: '2026-01-15',
    author: 'Yarik0505',
    changes: 'Introduced 2-reviewer requirement and automated secret scanning evidence.'
  }
]);

export const EVIDENCE_DIMENSIONS = Object.freeze({
  BRANCH_NAMING: {
    id: 'branch_naming',
    name: 'Branch Naming Standard',
    weight: 10,
    pattern: /^(feature|fix|refactor|docs)\/SCRUM-\d+-[a-z0-9-]+$/,
    description: 'Branch follows <type>/<JIRA-KEY>-<slug> format',
    remediation: 'Rename branch using `git branch -m <type>/SCRUM-XX-short-name` and push with `-u`.'
  },
  JIRA_LINKING: {
    id: 'jira_linking',
    name: 'Jira Key & Traceability',
    weight: 15,
    pattern: /SCRUM-\d+/,
    description: 'Commit messages and PR title explicitly reference assigned Jira task',
    remediation: 'Add Jira key to PR title (e.g. `[SCRUM-XX] Title`) or amend commit message.'
  },
  CI_STATUS: {
    id: 'ci_status',
    name: 'Automated CI Pipeline',
    weight: 20,
    description: 'All GitHub Actions CI checks (lint, build, tests) passed without bypass',
    remediation: 'Inspect failed GitHub Actions step in PR Checks tab, fix locally, and push update.'
  },
  AUTOMATED_TESTS: {
    id: 'automated_tests',
    name: 'Automated Unit Tests & Coverage',
    weight: 20,
    description: '100% test pass rate with regression coverage for modified contracts',
    remediation: 'Run `npm test` locally. Ensure zero test failures and add missing assertions.'
  },
  PEER_REVIEWERS: {
    id: 'peer_reviewers',
    name: 'Peer Review & Approvals',
    weight: 15,
    minApprovals: 2,
    description: 'At least 2 approving reviews from designated team members or mentors',
    remediation: 'Tag @mentor or peer in PR Reviewers panel and resolve all inline comments.'
  },
  SECURITY_SCANS: {
    id: 'security_scans',
    name: 'Security & Secret Sanitization',
    weight: 10,
    description: 'Zero hardcoded secrets, zero high/critical vulnerabilities in dependencies',
    remediation: 'Run `npm audit` and ensure no API tokens or passwords are committed in code.'
  },
  DEPLOYMENT_EVIDENCE: {
    id: 'deployment_evidence',
    name: 'Deployment & Verification Evidence',
    weight: 10,
    description: 'Working preview deployment link or verified screenshot of live functionality',
    remediation: 'Attach live CDP screenshot or Vercel preview link in the PR description.'
  }
});

/**
 * Sanitizes author data to preserve privacy (minimal PII)
 */
export function sanitizeAuthorData(author) {
  if (!author) return 'Anonymous Learner';
  if (typeof author === 'string') {
    // Strip email if passed as author
    if (author.includes('@')) {
      return author.split('@')[0];
    }
    return author;
  }
  return author.username || author.handle || 'Learner';
}

/**
 * Evaluates a Pull Request / Release submission against the Engineering Governance Scorecard.
 * 
 * @param {Object} submission - Evidence submission object
 * @returns {Object} Scorecard evaluation result
 */
export function evaluateGovernanceScorecard(submission = {}) {
  const {
    prNumber = 48,
    branchName = 'feature/SCRUM-142-repo-provisioning-automation',
    prTitle = '[SCRUM-142] GitHub repository provisioning and permissions automation',
    commitMessages = ['feat(SCRUM-142): implement repo provisioning automation'],
    ciStatus = 'SUCCESS', // 'SUCCESS' | 'FAILED' | 'PENDING'
    testsPassRate = 1.0, // 0.0 to 1.0
    approvalsCount = 2,
    securityScanClean = true,
    hasDeploymentEvidence = true,
    deploymentUrl = 'https://duck-verse.vercel.app',
    author = 'Yarik0505',
    mentorNotes = [],
    disputes = []
  } = submission;

  const sanitizedAuthor = sanitizeAuthorData(author);
  const dimensionResults = [];
  let totalScore = 0;
  const maxScore = 100;
  const remediations = [];

  // 1. Branch Naming
  const branchValid = EVIDENCE_DIMENSIONS.BRANCH_NAMING.pattern.test(branchName);
  if (branchValid) {
    totalScore += EVIDENCE_DIMENSIONS.BRANCH_NAMING.weight;
    dimensionResults.push({
      id: EVIDENCE_DIMENSIONS.BRANCH_NAMING.id,
      name: EVIDENCE_DIMENSIONS.BRANCH_NAMING.name,
      passed: true,
      score: EVIDENCE_DIMENSIONS.BRANCH_NAMING.weight,
      maxScore: EVIDENCE_DIMENSIONS.BRANCH_NAMING.weight,
      detail: `Branch "${branchName}" follows standard format.`
    });
  } else {
    remediations.push({
      dimension: EVIDENCE_DIMENSIONS.BRANCH_NAMING.name,
      urgency: 'MEDIUM',
      advice: EVIDENCE_DIMENSIONS.BRANCH_NAMING.remediation
    });
    dimensionResults.push({
      id: EVIDENCE_DIMENSIONS.BRANCH_NAMING.id,
      name: EVIDENCE_DIMENSIONS.BRANCH_NAMING.name,
      passed: false,
      score: 0,
      maxScore: EVIDENCE_DIMENSIONS.BRANCH_NAMING.weight,
      detail: `Branch "${branchName}" does not match required convention.`
    });
  }

  // 2. Jira Linking
  const hasJiraInTitle = EVIDENCE_DIMENSIONS.JIRA_LINKING.pattern.test(prTitle);
  const hasJiraInCommits = commitMessages.some((msg) =>
    EVIDENCE_DIMENSIONS.JIRA_LINKING.pattern.test(msg)
  );
  const jiraLinked = hasJiraInTitle || hasJiraInCommits;

  if (jiraLinked) {
    totalScore += EVIDENCE_DIMENSIONS.JIRA_LINKING.weight;
    dimensionResults.push({
      id: EVIDENCE_DIMENSIONS.JIRA_LINKING.id,
      name: EVIDENCE_DIMENSIONS.JIRA_LINKING.name,
      passed: true,
      score: EVIDENCE_DIMENSIONS.JIRA_LINKING.weight,
      maxScore: EVIDENCE_DIMENSIONS.JIRA_LINKING.weight,
      detail: 'Jira issue key linked in PR title and commit history.'
    });
  } else {
    remediations.push({
      dimension: EVIDENCE_DIMENSIONS.JIRA_LINKING.name,
      urgency: 'HIGH',
      advice: EVIDENCE_DIMENSIONS.JIRA_LINKING.remediation
    });
    dimensionResults.push({
      id: EVIDENCE_DIMENSIONS.JIRA_LINKING.id,
      name: EVIDENCE_DIMENSIONS.JIRA_LINKING.name,
      passed: false,
      score: 0,
      maxScore: EVIDENCE_DIMENSIONS.JIRA_LINKING.weight,
      detail: 'Missing Jira key reference.'
    });
  }

  // 3. CI Status
  const ciPassed = ciStatus === 'SUCCESS';
  if (ciPassed) {
    totalScore += EVIDENCE_DIMENSIONS.CI_STATUS.weight;
    dimensionResults.push({
      id: EVIDENCE_DIMENSIONS.CI_STATUS.id,
      name: EVIDENCE_DIMENSIONS.CI_STATUS.name,
      passed: true,
      score: EVIDENCE_DIMENSIONS.CI_STATUS.weight,
      maxScore: EVIDENCE_DIMENSIONS.CI_STATUS.weight,
      detail: 'All automated CI workflows passed cleanly.'
    });
  } else {
    remediations.push({
      dimension: EVIDENCE_DIMENSIONS.CI_STATUS.name,
      urgency: 'HIGH',
      advice: EVIDENCE_DIMENSIONS.CI_STATUS.remediation
    });
    dimensionResults.push({
      id: EVIDENCE_DIMENSIONS.CI_STATUS.id,
      name: EVIDENCE_DIMENSIONS.CI_STATUS.name,
      passed: false,
      score: 0,
      maxScore: EVIDENCE_DIMENSIONS.CI_STATUS.weight,
      detail: `CI status is ${ciStatus}.`
    });
  }

  // 4. Automated Tests
  const testsPassed = testsPassRate >= 1.0;
  if (testsPassed) {
    totalScore += EVIDENCE_DIMENSIONS.AUTOMATED_TESTS.weight;
    dimensionResults.push({
      id: EVIDENCE_DIMENSIONS.AUTOMATED_TESTS.id,
      name: EVIDENCE_DIMENSIONS.AUTOMATED_TESTS.name,
      passed: true,
      score: EVIDENCE_DIMENSIONS.AUTOMATED_TESTS.weight,
      maxScore: EVIDENCE_DIMENSIONS.AUTOMATED_TESTS.weight,
      detail: '100% unit tests pass rate confirmed.'
    });
  } else {
    const earned = Math.round(testsPassRate * EVIDENCE_DIMENSIONS.AUTOMATED_TESTS.weight);
    totalScore += earned;
    remediations.push({
      dimension: EVIDENCE_DIMENSIONS.AUTOMATED_TESTS.name,
      urgency: 'HIGH',
      advice: EVIDENCE_DIMENSIONS.AUTOMATED_TESTS.remediation
    });
    dimensionResults.push({
      id: EVIDENCE_DIMENSIONS.AUTOMATED_TESTS.id,
      name: EVIDENCE_DIMENSIONS.AUTOMATED_TESTS.name,
      passed: false,
      score: earned,
      maxScore: EVIDENCE_DIMENSIONS.AUTOMATED_TESTS.weight,
      detail: `Pass rate: ${Math.round(testsPassRate * 100)}%. Requires 100%.`
    });
  }

  // 5. Peer Reviewers
  const reviewersPassed = approvalsCount >= EVIDENCE_DIMENSIONS.PEER_REVIEWERS.minApprovals;
  if (reviewersPassed) {
    totalScore += EVIDENCE_DIMENSIONS.PEER_REVIEWERS.weight;
    dimensionResults.push({
      id: EVIDENCE_DIMENSIONS.PEER_REVIEWERS.id,
      name: EVIDENCE_DIMENSIONS.PEER_REVIEWERS.name,
      passed: true,
      score: EVIDENCE_DIMENSIONS.PEER_REVIEWERS.weight,
      maxScore: EVIDENCE_DIMENSIONS.PEER_REVIEWERS.weight,
      detail: `${approvalsCount} approving reviews obtained.`
    });
  } else {
    remediations.push({
      dimension: EVIDENCE_DIMENSIONS.PEER_REVIEWERS.name,
      urgency: 'MEDIUM',
      advice: EVIDENCE_DIMENSIONS.PEER_REVIEWERS.remediation
    });
    dimensionResults.push({
      id: EVIDENCE_DIMENSIONS.PEER_REVIEWERS.id,
      name: EVIDENCE_DIMENSIONS.PEER_REVIEWERS.name,
      passed: false,
      score: 0,
      maxScore: EVIDENCE_DIMENSIONS.PEER_REVIEWERS.weight,
      detail: `Obtained ${approvalsCount} of ${EVIDENCE_DIMENSIONS.PEER_REVIEWERS.minApprovals} required approvals.`
    });
  }

  // 6. Security Scans
  if (securityScanClean) {
    totalScore += EVIDENCE_DIMENSIONS.SECURITY_SCANS.weight;
    dimensionResults.push({
      id: EVIDENCE_DIMENSIONS.SECURITY_SCANS.id,
      name: EVIDENCE_DIMENSIONS.SECURITY_SCANS.name,
      passed: true,
      score: EVIDENCE_DIMENSIONS.SECURITY_SCANS.weight,
      maxScore: EVIDENCE_DIMENSIONS.SECURITY_SCANS.weight,
      detail: 'No hardcoded secrets or dependency vulnerabilities detected.'
    });
  } else {
    remediations.push({
      dimension: EVIDENCE_DIMENSIONS.SECURITY_SCANS.name,
      urgency: 'CRITICAL',
      advice: EVIDENCE_DIMENSIONS.SECURITY_SCANS.remediation
    });
    dimensionResults.push({
      id: EVIDENCE_DIMENSIONS.SECURITY_SCANS.id,
      name: EVIDENCE_DIMENSIONS.SECURITY_SCANS.name,
      passed: false,
      score: 0,
      maxScore: EVIDENCE_DIMENSIONS.SECURITY_SCANS.weight,
      detail: 'Security vulnerability or credential detected.'
    });
  }

  // 7. Deployment Evidence
  if (hasDeploymentEvidence) {
    totalScore += EVIDENCE_DIMENSIONS.DEPLOYMENT_EVIDENCE.weight;
    dimensionResults.push({
      id: EVIDENCE_DIMENSIONS.DEPLOYMENT_EVIDENCE.id,
      name: EVIDENCE_DIMENSIONS.DEPLOYMENT_EVIDENCE.name,
      passed: true,
      score: EVIDENCE_DIMENSIONS.DEPLOYMENT_EVIDENCE.weight,
      maxScore: EVIDENCE_DIMENSIONS.DEPLOYMENT_EVIDENCE.weight,
      detail: `Verified deployment evidence (${deploymentUrl}).`
    });
  } else {
    remediations.push({
      dimension: EVIDENCE_DIMENSIONS.DEPLOYMENT_EVIDENCE.name,
      urgency: 'LOW',
      advice: EVIDENCE_DIMENSIONS.DEPLOYMENT_EVIDENCE.remediation
    });
    dimensionResults.push({
      id: EVIDENCE_DIMENSIONS.DEPLOYMENT_EVIDENCE.id,
      name: EVIDENCE_DIMENSIONS.DEPLOYMENT_EVIDENCE.name,
      passed: false,
      score: 0,
      maxScore: EVIDENCE_DIMENSIONS.DEPLOYMENT_EVIDENCE.weight,
      detail: 'Deployment evidence missing from PR.'
    });
  }

  const passedOverall = totalScore >= 85 && remediations.filter((r) => r.urgency === 'CRITICAL' || r.urgency === 'HIGH').length === 0;

  return {
    prNumber,
    author: sanitizedAuthor,
    rubricVersion: SCORECARD_RUBRIC_VERSION,
    effectiveDate: SCORECARD_EFFECTIVE_DATE,
    totalScore,
    maxScore,
    passedOverall,
    qualityRating: totalScore >= 95 ? 'EXEMPLARY' : (totalScore >= 85 ? 'PROFICIENT' : 'NEEDS_REVISION'),
    dimensionResults,
    remediations,
    mentorNotes,
    disputes
  };
}

/**
 * Sample Exemplar Passing Scorecard Fixture
 */
export const PASSING_SCORECARD_FIXTURE = Object.freeze({
  prNumber: 48,
  branchName: 'feature/SCRUM-142-repo-provisioning-automation',
  prTitle: '[SCRUM-142] GitHub repository provisioning and permissions automation',
  commitMessages: [
    'feat(SCRUM-142): implement github repo provisioning and permissions automation'
  ],
  ciStatus: 'SUCCESS',
  testsPassRate: 1.0,
  approvalsCount: 2,
  securityScanClean: true,
  hasDeploymentEvidence: true,
  deploymentUrl: 'https://duck-verse.vercel.app',
  author: 'Yarik0505',
  mentorNotes: [
    {
      mentor: 'Mentor Team Lead',
      comment: 'Exemplary DevSecOps PR: clean branch naming, full test coverage, and complete audit trail.',
      date: '2026-09-17'
    }
  ]
});

/**
 * Sample Failing Scorecard Fixture (to demonstrate constructive remediation guidance)
 */
export const FAILING_SCORECARD_FIXTURE = Object.freeze({
  prNumber: 49,
  branchName: 'patch-1', // Invalid branch name
  prTitle: 'quick fix for some issues', // Missing Jira key
  commitMessages: ['fix stuff'],
  ciStatus: 'FAILED',
  testsPassRate: 0.85,
  approvalsCount: 1, // Needs 2
  securityScanClean: true,
  hasDeploymentEvidence: false,
  author: 'student_tester',
  mentorNotes: []
});
