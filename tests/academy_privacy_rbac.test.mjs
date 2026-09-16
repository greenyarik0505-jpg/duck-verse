import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DATA_INVENTORY,
  RBAC_PERMISSIONS,
  canAccessUserData,
  exportUserData,
  deleteUserData,
  verifyParentConsent,
  runPrivacySecurityAudit
} from '../lib/academy/privacy/audit.js';

test('Privacy & RBAC — Data Inventory Completeness', () => {
  const expectedCategories = ['account', 'progress', 'submissions', 'reviews', 'telemetry'];
  const actualCategories = Object.keys(DATA_INVENTORY);

  assert.deepEqual(actualCategories.sort(), expectedCategories.sort(), 'Всі 5 категорій даних мають бути в інвентарі');

  for (const cat of expectedCategories) {
    const item = DATA_INVENTORY[cat];
    assert.ok(item.purpose, `Категорія ${cat} повинна мати мету збору (purpose)`);
    assert.ok(item.owner, `Категорія ${cat} повинна мати власника (owner)`);
    assert.ok(item.retentionDays > 0, `Категорія ${cat} повинна мати термін зберігання в днях`);
    assert.ok(item.accessRule, `Категорія ${cat} повинна мати правило доступу (accessRule)`);
  }
});

test('Privacy & RBAC — RBAC Matrix Roles Validation', () => {
  const roles = ['child', 'parent', 'mentor', 'admin'];
  for (const role of roles) {
    assert.ok(RBAC_PERMISSIONS[role], `Роль ${role} має бути визначена в матриці`);
    assert.equal(typeof RBAC_PERMISSIONS[role].canViewOthersData, 'boolean');
  }

  // Дитина не повинна бачити чужі дані або керувати платформою
  assert.equal(RBAC_PERMISSIONS.child.canViewOthersData, false);
  assert.equal(RBAC_PERMISSIONS.child.canManagePlatform, false);

  // Ментор має доступ до робіт учнів, але не до управління платформою
  assert.equal(RBAC_PERMISSIONS.mentor.canReviewSubmissions, true);
  assert.equal(RBAC_PERMISSIONS.mentor.canManagePlatform, false);

  // Адмін має повний доступ до аудиту
  assert.equal(RBAC_PERMISSIONS.admin.canAuditSecurityLogs, true);
  assert.equal(RBAC_PERMISSIONS.admin.canManagePlatform, true);
});

test('Privacy & RBAC — IDOR Protection Blocks Unauthorized Data Export', () => {
  const childA = { id: 'user_student_yarik', role: 'child', username: 'student_yarik' };
  const childBId = 'user_student_bob';

  assert.throws(
    () => exportUserData(childBId, childA),
    /\[IDOR Protection\]/,
    'Учень не повинен мати змоги експортувати дані іншого учня'
  );
});

test('Privacy & RBAC — Legitimate Export Sanitizes Sensitive Secrets', () => {
  const childA = { id: 'user_student_yarik', role: 'child', username: 'student_yarik' };
  const exported = exportUserData('user_student_yarik', childA);

  assert.equal(exported.userProfile.id, 'user_student_yarik');
  assert.ok(Array.isArray(exported.educationalProgress));
  assert.ok(Array.isArray(exported.submissions));

  const jsonStr = JSON.stringify(exported);
  assert.equal(jsonStr.includes('password'), false, 'Експорт не повинен містити паролів');
  assert.equal(jsonStr.includes('secret'), false, 'Експорт не повинен містити секретних ключів');
});

test('Privacy & RBAC — Cascade Deletion with Zero Orphaned Records', () => {
  const admin = { id: 'user_admin_root', role: 'admin', username: 'admin_root' };
  const deleteResult = deleteUserData('user_student_bob', admin);

  assert.equal(deleteResult.success, true);
  assert.equal(deleteResult.orphanedRecordsCount, 0, 'Кількість сирітських записів має дорівнювати 0');
  assert.equal(deleteResult.purgedItems.profileDeleted, true);
});

test('Privacy & RBAC — Parental Consent Verification', () => {
  const parent = { id: 'user_parent_olena', role: 'parent', username: 'parent_olena' };
  const consentResult = verifyParentConsent('user_student_yarik', parent, { channel: 'sms_otp' });

  assert.equal(consentResult.success, true);
  assert.equal(consentResult.consent.granted, true);
  assert.ok(consentResult.consent.consentHash, 'Має бути згенеровано унікальний хеш згоди');
});

test('Privacy & RBAC — Automated Privacy & Security Audit Passes 100%', () => {
  const audit = runPrivacySecurityAudit();

  assert.equal(audit.passed, true, 'Всі перевірки безпеки повинні успішно пройти');
  assert.equal(audit.score, '100%');
  assert.equal(audit.auditResults.length, 4, 'Має бути 4 перевірки у звіті аудиту');

  for (const res of audit.auditResults) {
    assert.equal(res.status, 'PASSED', `Перевірка ${res.testId} має статус PASSED`);
  }
});
