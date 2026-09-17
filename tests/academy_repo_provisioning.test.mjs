import test from 'node:test';
import assert from 'node:assert/strict';
import {
  provisionRepository,
  PERMISSIONS_MATRIX,
  DEFAULT_BRANCH_PROTECTION_RULESET,
  getStandardBaselineFiles,
  generateRollbackScript
} from '../lib/academy/governance/repo_provisioning.js';

test('1. Baseline File Scaffolding: produces 5 mandatory standard files', () => {
  const files = getStandardBaselineFiles('duck-verse-test-repo', 'Student Alpha');
  assert.equal(files.length, 5);

  const paths = files.map((f) => f.path);
  assert.ok(paths.includes('README.md'), 'README.md must be scaffolded');
  assert.ok(paths.includes('AGENTS.md'), 'AGENTS.md must be scaffolded');
  assert.ok(paths.includes('.github/CODEOWNERS'), '.github/CODEOWNERS must be scaffolded');
  assert.ok(paths.includes('.github/pull_request_template.md'), 'PR template must be scaffolded');
  assert.ok(paths.includes('.github/workflows/ci.yml'), 'CI workflow must be scaffolded');

  const agentsMd = files.find((f) => f.path === 'AGENTS.md');
  assert.ok(agentsMd.content.includes('Direct push to `main` is strictly prohibited'));
});

test('2. Least-Privilege RBAC Matrix: enforces strict role limits', () => {
  assert.equal(PERMISSIONS_MATRIX.LEARNER.canPushDirectlyToMain, false);
  assert.equal(PERMISSIONS_MATRIX.LEARNER.canForcePush, false);
  assert.equal(PERMISSIONS_MATRIX.LEARNER.canApproveReleasePR, false);
  assert.equal(PERMISSIONS_MATRIX.LEARNER.permission, 'push');

  assert.equal(PERMISSIONS_MATRIX.MENTOR.canPushDirectlyToMain, false);
  assert.equal(PERMISSIONS_MATRIX.MENTOR.canApproveReleasePR, true);
  assert.equal(PERMISSIONS_MATRIX.MENTOR.permission, 'maintain');

  assert.equal(PERMISSIONS_MATRIX.ADMIN.canPushDirectlyToMain, false, 'Admins cannot bypass direct main push');
  assert.equal(PERMISSIONS_MATRIX.ADMIN.canChangeRepoSettings, true);
});

test('3. Branch Protection Ruleset: enforces 2 approvals, strict CI and linear history', () => {
  const rules = DEFAULT_BRANCH_PROTECTION_RULESET;
  assert.equal(rules.branchPattern, 'main');
  assert.equal(rules.requiredApprovingReviewCount, 2);
  assert.equal(rules.dismissStaleReviewsOnPush, true);
  assert.equal(rules.requireCodeOwnerReviews, true);
  assert.equal(rules.strictStatusChecks, true);
  assert.equal(rules.allowForcePushes, false);
  assert.equal(rules.blockBypassing, true);
  assert.ok(rules.requiredStatusChecks.includes('ci/build'));
  assert.ok(rules.requiredStatusChecks.includes('ci/lint'));
});

test('4. Fresh Provisioning Dry-Run: identifies missing files and drifted rules', () => {
  const result = provisionRepository({}, {
    repoName: 'new-learner-repo',
    learnerName: 'Student Beta',
    isDryRun: true
  });

  assert.equal(result.isUpToDate, false);
  assert.equal(result.isDryRun, true);
  assert.equal(result.filesToCreate.length, 5);
  assert.equal(result.filesUnchanged.length, 0);
  assert.ok(result.auditRecord.actionId.startsWith('prov-'));
  assert.equal(result.auditRecord.status, 'DRY_RUN_COMPLETED');
});

test('5. Strict Idempotency: repeated run on provisioned repo produces zero drift', () => {
  const baselineFiles = getStandardBaselineFiles('idempotent-repo', 'Student Gamma');
  const existingFiles = {};
  for (const f of baselineFiles) {
    existingFiles[f.path] = f.content;
  }

  const fullyConfiguredState = {
    existingFiles,
    branchRules: { ...DEFAULT_BRANCH_PROTECTION_RULESET },
    permissions: {
      LEARNER: PERMISSIONS_MATRIX.LEARNER.permission,
      MENTOR: PERMISSIONS_MATRIX.MENTOR.permission,
      ADMIN: PERMISSIONS_MATRIX.ADMIN.permission,
      CI_BOT: PERMISSIONS_MATRIX.CI_BOT.permission
    }
  };

  const rerunResult = provisionRepository(fullyConfiguredState, {
    repoName: 'idempotent-repo',
    learnerName: 'Student Gamma',
    isDryRun: false
  });

  assert.equal(rerunResult.isUpToDate, true, 'Fully provisioned repo must report up to date');
  assert.equal(rerunResult.filesToCreate.length, 0);
  assert.equal(rerunResult.filesDrifted.length, 0);
  assert.equal(rerunResult.filesUnchanged.length, 5);
  assert.equal(rerunResult.auditRecord.status, 'UP_TO_DATE');
});

test('6. Drift Detection: flags modified baseline files without overwriting learner commits', () => {
  const baselineFiles = getStandardBaselineFiles('drift-repo', 'Student Delta');
  const existingFiles = {};
  for (const f of baselineFiles) {
    existingFiles[f.path] = f.content;
  }

  // Learner added a custom line to AGENTS.md
  existingFiles['AGENTS.md'] = existingFiles['AGENTS.md'] + '\n# Custom student note\n';

  const driftResult = provisionRepository({ existingFiles }, {
    repoName: 'drift-repo',
    learnerName: 'Student Delta',
    isDryRun: true
  });

  assert.equal(driftResult.isUpToDate, false);
  assert.equal(driftResult.filesDrifted.length, 1);
  assert.equal(driftResult.filesDrifted[0].path, 'AGENTS.md');
  assert.equal(driftResult.filesUnchanged.length, 4);
});

test('7. Audit Record and Rollback Script: generates executable shell instructions', () => {
  const filesCreated = [
    { path: 'README.md' },
    { path: 'AGENTS.md' }
  ];
  const script = generateRollbackScript('test-repo', filesCreated, false);

  assert.ok(script.includes('#!/usr/bin/env bash'));
  assert.ok(script.includes('git rm -f "README.md"'));
  assert.ok(script.includes('git rm -f "AGENTS.md"'));
  assert.ok(script.includes('chore(governance): rollback provisioning changes'));
});

test('8. API Route and UI Component: files exist and export expected endpoints', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const apiRoutePath = path.resolve('app/api/academy/governance/provisioning/route.js');
  const componentPath = path.resolve('components/academy/RepoProvisioningAutomationView.jsx');

  assert.ok(fs.existsSync(apiRoutePath), 'API route file must exist');
  assert.ok(fs.existsSync(componentPath), 'UI component file must exist');

  const apiContent = fs.readFileSync(apiRoutePath, 'utf8');
  assert.ok(apiContent.includes('export async function GET'), 'GET route must be exported');
  assert.ok(apiContent.includes('export async function POST'), 'POST route must be exported');
  assert.ok(apiContent.includes('provisionRepository'), 'API route must invoke provisionRepository');
});
