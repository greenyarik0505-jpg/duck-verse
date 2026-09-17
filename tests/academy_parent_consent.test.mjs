import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACTIVATION_STATES,
  AGE_THRESHOLD,
  CURRENT_POLICY_VERSION,
  FEATURE_SCOPES,
  determineAgeCategory,
  hashConsentToken,
  maskEmail,
  registerAccount,
  approveParentConsent,
  rejectParentConsent,
  revokeParentConsent,
  checkFeatureAccess,
  getAccounts,
  getAuditLog,
} from '../lib/academy/identity/parent_consent.js';

test('1. Age Category Classification: accurately distinguishes <13 vs 13+', () => {
  const child = determineAgeCategory(10);
  assert.equal(child.category, 'child_under_13');
  assert.equal(child.requiresParentConsent, true);
  assert.ok(child.legalStandard.includes('COPPA'));

  const teen = determineAgeCategory(14);
  assert.equal(teen.category, 'minor_or_adult');
  assert.equal(teen.requiresParentConsent, false);
});

test('2. Registration State Machine: under-13 starts in PENDING, 13+ starts in APPROVED', () => {
  const childReg = registerAccount({
    childUsername: 'test_child_77',
    age: 9,
    parentEmail: 'parent_test@gmail.com',
  });
  assert.equal(childReg.account.status, ACTIVATION_STATES.PENDING);
  assert.equal(childReg.account.requiresParentConsent, true);
  assert.ok(childReg.rawToken);
  assert.equal(childReg.account.tokenHash, hashConsentToken(childReg.rawToken));
  assert.equal(childReg.account.parentEmailMasked, 'p***t@gmail.com');

  const teenReg = registerAccount({
    childUsername: 'test_teen_88',
    age: 15,
  });
  assert.equal(teenReg.account.status, ACTIVATION_STATES.APPROVED);
  assert.equal(teenReg.account.requiresParentConsent, false);
  assert.equal(teenReg.rawToken, null);
});

test('3. Permission Gate: restricted features blocked while PENDING, baseline features allowed', () => {
  const reg = registerAccount({
    childUsername: 'pending_child',
    age: 11,
    parentEmail: 'guardian@example.com',
  });

  // Baseline safe feature
  const baseAccess = checkFeatureAccess(reg.account, 'curriculum_access');
  assert.equal(baseAccess.allowed, true);

  // Restricted feature (social chat)
  const chatAccess = checkFeatureAccess(reg.account, 'social_chat');
  assert.equal(chatAccess.allowed, false);
  assert.ok(chatAccess.reason.includes('Потрібна згода батьків'));

  // Restricted feature (AI tutor)
  const aiAccess = checkFeatureAccess(reg.account, 'ai_tutor_generative');
  assert.equal(aiAccess.allowed, false);
});

test('4. Parent Approval Flow: unlocks selected scopes with valid token and timestamp', () => {
  const reg = registerAccount({
    childUsername: 'approvable_kid',
    age: 10,
    parentEmail: 'dad@sample.com',
  });

  const chosenScopes = ['curriculum_access', 'offline_practice', 'social_chat', 'ai_tutor_generative'];
  const res = approveParentConsent({
    accountId: reg.account.id,
    token: reg.rawToken,
    scopesGranted: chosenScopes,
    parentName: 'Тато Олексій',
  });

  assert.equal(res.success, true);
  assert.equal(res.account.status, ACTIVATION_STATES.APPROVED);
  assert.equal(res.account.policyVersion, CURRENT_POLICY_VERSION);
  assert.ok(res.account.consentRecord.approvedAt);

  // Now social chat should be allowed
  const chatAccess = checkFeatureAccess(res.account, 'social_chat');
  assert.equal(chatAccess.allowed, true);

  // Public leaderboard wasn't granted, so should be disallowed
  const boardAccess = checkFeatureAccess(res.account, 'public_leaderboard');
  assert.equal(boardAccess.allowed, false);
});

test('5. Invalid Token Handling: rejects approval with bad token', () => {
  const reg = registerAccount({
    childUsername: 'token_kid',
    age: 12,
    parentEmail: 'mom@sample.com',
  });

  const res = approveParentConsent({
    accountId: reg.account.id,
    token: 'WRONG-TOKEN-12345',
    scopesGranted: ['social_chat'],
  });

  assert.equal(res.success, false);
  assert.equal(res.error, 'Невірний токен згоди');
  assert.equal(reg.account.status, ACTIVATION_STATES.PENDING);
});

test('6. Parent Revocation: instantly locks restricted scopes on demand', () => {
  const reg = registerAccount({
    childUsername: 'revocable_child',
    age: 10,
    parentEmail: 'parent@home.com',
  });

  approveParentConsent({
    accountId: reg.account.id,
    token: reg.rawToken,
    scopesGranted: ['social_chat'],
  });

  // Verify chat is initially allowed
  assert.equal(checkFeatureAccess(reg.account, 'social_chat').allowed, true);

  // Revoke consent
  const revRes = revokeParentConsent({
    accountId: reg.account.id,
    reason: 'Parent requested immediate access pause',
  });

  assert.equal(revRes.success, true);
  assert.equal(revRes.account.status, ACTIVATION_STATES.REJECTED);

  // Chat must now be locked immediately
  const chatAfterRevoke = checkFeatureAccess(reg.account, 'social_chat');
  assert.equal(chatAfterRevoke.allowed, false);
  // Baseline is still allowed
  assert.equal(checkFeatureAccess(reg.account, 'curriculum_access').allowed, true);
});

test('7. Privacy Safeguards & Data Minimization: email masking & token hashing', () => {
  assert.equal(maskEmail('alexander.smith@provider.org'), 'a***h@provider.org');
  assert.equal(maskEmail('me@domain.com'), 'm***@domain.com');

  const hashed = hashConsentToken('SECRET_TOKEN_42');
  assert.equal(typeof hashed, 'string');
  assert.equal(hashed.length, 64); // sha256 hex length
});

test('8. Audit Trail and Account Querying: captures lifecycle events with actors', () => {
  const reg = registerAccount({
    childUsername: 'audit_test_child',
    age: 9,
    parentEmail: 'parent_audit@gmail.com',
  });

  approveParentConsent({
    accountId: reg.account.id,
    token: reg.rawToken,
    scopesGranted: ['social_chat'],
    parentName: 'Олена В.',
  });

  const logs = getAuditLog();
  assert.ok(logs.length >= 2);
  const consentEvent = logs.find(
    l => l.accountId === reg.account.id && l.action === 'CONSENT_GRANTED'
  );
  assert.ok(consentEvent);
  assert.equal(consentEvent.actor, 'Олена В.');

  const accounts = getAccounts();
  const found = accounts.find(a => a.id === reg.account.id);
  assert.ok(found);
  assert.equal(found.status, ACTIVATION_STATES.APPROVED);
});
