import assert from 'assert';
import {
  createSignedSessionToken,
  verifySignedSessionToken,
  sanitizeUser,
} from '../lib/academy/auth/session.js';
import {
  ACADEMY_ROLES,
  ACADEMY_PERMISSIONS,
  hasPermission,
  canAccessResource,
} from '../lib/academy/auth/roles.js';
import {
  registerUser,
  authenticateUser,
  findUserByUsername,
} from '../lib/academy/auth/store.js';

console.log('--- 🛡️ ТЕСТУВАННЯ БЕЗПЕКИ ТА АВТОРИЗАЦІЇ DUCK ACADEMY (SCRUM-54) ---');

// 1. Криптографічний підпис та захист від підробки токенів
console.log('1. Тест криптографічного підпису сесій...');
const testUser = {
  id: 'user_test_child_1',
  username: 'little_duck',
  role: ACADEMY_ROLES.CHILD,
  parentConsent: true,
};

const token = createSignedSessionToken(testUser, 10000);
const verification = verifySignedSessionToken(token);
assert.strictEqual(verification.valid, true, 'Підписаний токен має успішно проходити валідацію');
assert.strictEqual(verification.session.userId, testUser.id);
assert.strictEqual(verification.session.role, ACADEMY_ROLES.CHILD);
console.log('✅ Підпис валідного токена успішно верифіковано');

// Спроба підробки payload (зміна ролі на admin)
const parts = token.split('.');
const tamperedPayload = Buffer.from(
  JSON.stringify({ ...JSON.parse(Buffer.from(parts[0], 'base64').toString()), role: 'admin' })
).toString('base64url');
const forgedToken = `${tamperedPayload}.${parts[1]}`;

const forgedVerification = verifySignedSessionToken(forgedToken);
assert.strictEqual(
  forgedVerification.valid,
  false,
  'Підроблений токен зі зміненою роллю має бути категорично відхилений'
);
assert.strictEqual(forgedVerification.error, 'INVALID_SIGNATURE');
console.log('✅ Захист від підробки токена (tampering) спрацював коректно');

// Спроба використати прострочений токен
const expiredToken = createSignedSessionToken(testUser, -1000);
const expiredVerification = verifySignedSessionToken(expiredToken);
assert.strictEqual(expiredVerification.valid, false, 'Прострочений токен має відхилятися');
assert.strictEqual(expiredVerification.error, 'SESSION_EXPIRED');
console.log('✅ Перевірка TTL сесії та прострочених токенів працює');

// 2. Безпечна серіалізація користувача (захист від витоку паролів)
console.log('2. Тест санітизації даних користувача...');
const userWithSecrets = {
  id: 'user_1',
  username: 'duck_coder',
  passwordHash: 'deadbeef12345678',
  salt: 'secret_salt_999',
  role: ACADEMY_ROLES.CHILD,
  parentConsent: { granted: true },
};
const cleanUser = sanitizeUser(userWithSecrets);
assert.strictEqual(cleanUser.passwordHash, undefined, 'passwordHash не повинен виходити на клієнт');
assert.strictEqual(cleanUser.salt, undefined, 'salt не повинен виходити на клієнт');
assert.strictEqual(cleanUser.username, 'duck_coder');
console.log('✅ Санітизація об’єкта користувача гарантує відсутність паролів у сесії');

// 3. Захист від вертикальної ескалації привілеїв (Vertical Privilege Escalation)
console.log('3. Тест вертикальної ескалації привілеїв (Vertical Privilege Escalation)...');
const childUser = { id: 'child_1', role: ACADEMY_ROLES.CHILD };
const mentorUser = { id: 'mentor_1', role: ACADEMY_ROLES.MENTOR };

// Дитина намагається затвердити урок або керувати користувачами
const childAdminAttempt = canAccessResource({
  user: childUser,
  resourceOwnerId: childUser.id,
  requiredPermission: ACADEMY_PERMISSIONS.APPROVE_LESSON,
});
assert.strictEqual(childAdminAttempt.allowed, false);
assert.strictEqual(childAdminAttempt.reason, 'VERTICAL_PRIVILEGE_VIOLATION');
console.log('✅ Вертикальна ескалація дитини заблокована (APPROVE_LESSON заборонено)');

// Ментор має право затвердити урок
const mentorApproveAttempt = canAccessResource({
  user: mentorUser,
  resourceOwnerId: childUser.id,
  requiredPermission: ACADEMY_PERMISSIONS.APPROVE_LESSON,
});
assert.strictEqual(mentorApproveAttempt.allowed, true);
console.log('✅ Ментор має право перевіряти та затверджувати уроки');

// 4. Захист від горизонтальної ескалації привілеїв (Horizontal Privilege Escalation)
console.log('4. Тест горизонтальної ескалації привілеїв (Horizontal Privilege Escalation)...');
const childA = { id: 'child_alice', role: ACADEMY_ROLES.CHILD };
const childB_id = 'child_bob';

// Дитина A намагається отримати доступ до прогресу дитини B
const horizontalAttempt = canAccessResource({
  user: childA,
  resourceOwnerId: childB_id,
  requiredPermission: ACADEMY_PERMISSIONS.READ_OWN_PROGRESS,
});
assert.strictEqual(horizontalAttempt.allowed, false);
assert.strictEqual(horizontalAttempt.reason, 'HORIZONTAL_PRIVILEGE_VIOLATION');
console.log('✅ Горизонтальна ескалація між учнями заблокована (Alice не може читати Bob)');

// Дитина A отримує доступ до власного прогресу
const ownAccessAttempt = canAccessResource({
  user: childA,
  resourceOwnerId: childA.id,
  requiredPermission: ACADEMY_PERMISSIONS.READ_OWN_PROGRESS,
});
assert.strictEqual(ownAccessAttempt.allowed, true);
console.log('✅ Учень має повний доступ до власного прогресу');

// 5. Тестування автентифікації та згоди батьків
console.log('5. Тест автентифікації та згоди батьків (Parental Consent)...');
const authenticatedChild = authenticateUser('student_yarik', 'DuckPass123!');
assert.ok(authenticatedChild, 'Демо-користувач student_yarik має успішно автентифікуватися');
assert.strictEqual(authenticatedChild.role, ACADEMY_ROLES.CHILD);
assert.strictEqual(authenticatedChild.parentConsent.granted, true);
assert.strictEqual(authenticatedChild.parentConsent.scope, 'educational_only');
console.log('✅ Автентифікація успішна, згода батьків збережена з мінімальним збором даних');

// 6. Тестування акаунтів команди адміністраторів (Ярик, Діма, Кирил)
console.log('6. Тест автентифікації адміністраторів команди...');
const adminYarik = authenticateUser('Yarik0505', 'YarikPass2026!');
assert.ok(adminYarik, 'Адміністратор Yarik0505 має успішно автентифікуватися');
assert.strictEqual(adminYarik.role, ACADEMY_ROLES.ADMIN);

const adminDima = authenticateUser('admin_dima', 'DimaPass2026!');
assert.ok(adminDima, 'Адміністратор admin_dima має успішно автентифікуватися');
assert.strictEqual(adminDima.role, ACADEMY_ROLES.ADMIN);

const adminKirill = authenticateUser('admin_kirill', 'KirillPass2026!');
assert.ok(adminKirill, 'Адміністратор admin_kirill має успішно автентифікуватися');
assert.strictEqual(adminKirill.role, ACADEMY_ROLES.ADMIN);
console.log('✅ Автентифікація команди адмінів (Yarik0505, admin_dima, admin_kirill) пройшла успішно');

console.log('\n🎉 ВСІ АВТОМАТИЗОВАНІ ТЕСТИ БЕЗПЕКИ ТА АВТОРИЗАЦІЇ (SCRUM-54) УСПІШНО ПРОЙДЕНО!');
