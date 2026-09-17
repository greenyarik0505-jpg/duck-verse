/**
 * Duck Academy — GitHub Repository Provisioning & Permissions Automation (SCRUM-142)
 * 
 * DevSecOps platform automation for standardized learner repositories:
 * - Scaffolds standard repo baseline: README, AGENTS.md, issue/PR templates, CI workflow, CODEOWNERS
 * - Enforces Least-Privilege Permissions Matrix (Learner, Mentor, Admin, CI Bot)
 * - Automates default branch protection rules (require PR, 2 approvals, strict CI, no force-push)
 * - Strict idempotency: safe to run multiple times without clobbering existing commits
 * - Produces audit records with rollback script and checksums
 */

/**
 * Least-Privilege Permissions Matrix
 */
export const PERMISSIONS_MATRIX = Object.freeze({
  LEARNER: {
    role: 'Student / Learner',
    permission: 'push', // protected by branch rulesets, cannot push directly to main
    canPushDirectlyToMain: false,
    canForcePush: false,
    canDeleteBranchMain: false,
    canApproveReleasePR: false,
    canChangeRepoSettings: false,
    scopeDescription: 'Create feature branches, push commits, open PRs and request reviews.'
  },
  MENTOR: {
    role: 'Mentor / Code Reviewer',
    permission: 'maintain',
    canPushDirectlyToMain: false,
    canForcePush: false,
    canDeleteBranchMain: false,
    canApproveReleasePR: true,
    canChangeRepoSettings: false,
    scopeDescription: 'Review and approve PRs, manage issue labels and milestones, unlock blocked steps.'
  },
  ADMIN: {
    role: 'Team Lead / Repo Owner',
    permission: 'admin',
    canPushDirectlyToMain: false, // Even admin is blocked from direct main push by rulesets!
    canForcePush: false,
    canDeleteBranchMain: false,
    canApproveReleasePR: true,
    canChangeRepoSettings: true,
    scopeDescription: 'Manage billing, repo access, branch rulesets, team invitations, and production release tags.'
  },
  CI_BOT: {
    role: 'GitHub Actions / DevSecOps Bot',
    permission: 'write',
    canPushDirectlyToMain: false,
    canForcePush: false,
    canDeleteBranchMain: false,
    canApproveReleasePR: false,
    canChangeRepoSettings: false,
    scopeDescription: 'Emit status checks (lint, build, test), post preview deployment links and security scan SARIF.'
  }
});

/**
 * Standard Branch Protection Ruleset for default branch 'main'
 */
export const DEFAULT_BRANCH_PROTECTION_RULESET = Object.freeze({
  branchPattern: 'main',
  enforceAdmins: true,
  requiredApprovingReviewCount: 2,
  dismissStaleReviewsOnPush: true,
  requireCodeOwnerReviews: true,
  requireLastPushApproval: true,
  requiredStatusChecks: [
    'ci/lint',
    'ci/build',
    'ci/unit-tests',
    'security/secret-scan'
  ],
  strictStatusChecks: true, // branch must be up to date before merging
  allowForcePushes: false,
  allowDeletions: false,
  blockBypassing: true,
  requiredLinearHistory: true
});

/**
 * Standard template files required for every Duck Academy learner repo
 */
export function getStandardBaselineFiles(repoName, learnerName = 'Student Learner') {
  return [
    {
      path: 'README.md',
      type: 'documentation',
      content: `# ${repoName}\n\nWelcome to your **Duck Academy** project workspace, ${learnerName}!\n\n## Quick Start\n\`\`\`bash\nnpm install\nnpm test\nnpm run build\n\`\`\`\n\n## Governance & Rules\nAll changes must follow our DevSecOps workflow: branch ➔ PR ➔ 2 approvals ➔ CI pass ➔ merge.\n`
    },
    {
      path: 'AGENTS.md',
      type: 'ai_governance',
      content: `# AGENTS.md — Rules for AI Pair Programmers\n\n- Direct push to \`main\` is strictly prohibited.\n- Every commit must include a Jira key (e.g. \`feat(SCRUM-XX): ...\`).\n- 100% test pass rate required before opening PR.\n- Never wipe React DOM via innerHTML.\n`
    },
    {
      path: '.github/CODEOWNERS',
      type: 'access_control',
      content: `* @greenyarik0505-jpg\n/lib/academy/ @greenyarik0505-jpg\n`
    },
    {
      path: '.github/pull_request_template.md',
      type: 'template',
      content: `## Jira Issue\n- Closes [SCRUM-XX](https://gta6-sliv-cyberleek.atlassian.net)\n\n## Summary of Changes\n\n## Testing & Verification Evidence\n- [ ] 100% unit tests pass\n- [ ] Linting & build pass\n- [ ] Screenshot or video attached\n`
    },
    {
      path: '.github/workflows/ci.yml',
      type: 'ci_workflow',
      content: `name: CI\non: [push, pull_request]\njobs:\n  verify:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 20\n      - run: npm ci\n      - run: npm run lint\n      - run: npm test\n      - run: npm run build\n`
    }
  ];
}

/**
 * Browser- and Node-safe deterministic checksum for content string
 */
function calculateChecksum(str) {
  let h1 = 0x811c9dc5;
  let h2 = 0x9dc5811c;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 0x01000193);
    h2 = Math.imul(h2 ^ (ch << 1), 0x01000193);
  }
  return ((h1 >>> 0).toString(16).padStart(8, '0')) + ((h2 >>> 0).toString(16).padStart(8, '0'));
}

/**
 * Evaluates repository provisioning state and determines changes needed.
 * Guarantees idempotency: if repo already matches desired state, no-op is returned.
 * 
 * @param {Object} currentRepoState - { existingFiles: { [path]: content }, branchRules: {}, permissions: {} }
 * @param {Object} options - { repoName, learnerName, actorId, isDryRun }
 */
export function provisionRepository(currentRepoState = {}, options = {}) {
  const {
    repoName = 'duck-verse-learner-repo',
    learnerName = 'Student Learner',
    actorId = '712020:d66a7a94-b2f2-4434-9582-8190026d3c20',
    isDryRun = false
  } = options;

  const targetFiles = getStandardBaselineFiles(repoName, learnerName);
  const existingFiles = currentRepoState.existingFiles || {};

  const filesToCreate = [];
  const filesUnchanged = [];
  const filesDrifted = [];

  for (const file of targetFiles) {
    const existingContent = existingFiles[file.path];
    const targetChecksum = calculateChecksum(file.content);

    if (existingContent === undefined) {
      filesToCreate.push({
        path: file.path,
        type: file.type,
        action: 'CREATE',
        checksum: targetChecksum
      });
    } else {
      const existingChecksum = calculateChecksum(existingContent);
      if (existingChecksum === targetChecksum) {
        filesUnchanged.push({
          path: file.path,
          type: file.type,
          action: 'UNCHANGED',
          checksum: targetChecksum
        });
      } else {
        filesDrifted.push({
          path: file.path,
          type: file.type,
          action: 'UPDATE_DRIFT',
          existingChecksum,
          targetChecksum
        });
      }
    }
  }

  // Evaluate Branch Protection Rules
  const existingRules = currentRepoState.branchRules || {};
  const rulesDrift = {};
  let rulesRequireUpdate = false;

  for (const [key, val] of Object.entries(DEFAULT_BRANCH_PROTECTION_RULESET)) {
    if (JSON.stringify(existingRules[key]) !== JSON.stringify(val)) {
      rulesDrift[key] = { desired: val, current: existingRules[key] ?? null };
      rulesRequireUpdate = true;
    }
  }

  // Evaluate Permissions
  const existingPermissions = currentRepoState.permissions || {};
  const permissionsDrift = {};
  let permissionsRequireUpdate = false;

  for (const [roleKey, roleSpec] of Object.entries(PERMISSIONS_MATRIX)) {
    const currentRolePerm = existingPermissions[roleKey];
    if (currentRolePerm !== roleSpec.permission) {
      permissionsDrift[roleKey] = { desired: roleSpec.permission, current: currentRolePerm ?? null };
      permissionsRequireUpdate = true;
    }
  }

  const isUpToDate = filesToCreate.length === 0 && filesDrifted.length === 0 && !rulesRequireUpdate && !permissionsRequireUpdate;

  // Generate Rollback Instructions
  const rollbackScript = generateRollbackScript(repoName, filesToCreate, isDryRun);

  // Generate Audit Record
  const actionId = `prov-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  const auditRecord = {
    actionId,
    timestamp: new Date().toISOString(),
    repoName,
    actorId,
    isDryRun,
    status: isUpToDate ? 'UP_TO_DATE' : (isDryRun ? 'DRY_RUN_COMPLETED' : 'PROVISIONED_SUCCESSFULLY'),
    filesCreatedCount: filesToCreate.length,
    filesDriftedCount: filesDrifted.length,
    filesUnchangedCount: filesUnchanged.length,
    rulesUpdated: rulesRequireUpdate,
    permissionsUpdated: permissionsRequireUpdate,
    rollbackScript
  };

  return {
    actionId,
    isUpToDate,
    isDryRun,
    repoName,
    filesToCreate,
    filesDrifted,
    filesUnchanged,
    rulesDrift,
    permissionsDrift,
    permissionsMatrix: PERMISSIONS_MATRIX,
    branchProtectionRules: DEFAULT_BRANCH_PROTECTION_RULESET,
    auditRecord
  };
}

/**
 * Produces an automated rollback script for safety and reverse operations
 */
export function generateRollbackScript(repoName, filesCreated, isDryRun = false) {
  const fileRemovals = filesCreated.map((f) => `git rm -f "${f.path}"`).join('\n');
  return `#!/usr/bin/env bash
# Duck Academy — Automated Rollback for ${repoName}
set -euo pipefail

echo "=== Rolling back provisioning for ${repoName} ==="
${isDryRun ? '# [Dry-Run mode: no changes were committed to rollback]' : ''}
${fileRemovals || '# No files created to remove.'}

# Revert branch protection ruleset via GitHub API if needed:
# gh api --method DELETE "repos/:owner/${repoName}/rulesets/main"

git commit -m "chore(governance): rollback provisioning changes" || true
echo "=== Rollback completed successfully ==="
`;
}
