import assert from 'assert';
import {
  AUDIT_EVENT_TYPES,
  recordAuditEvent,
  getAuditEvents,
  generateMachineReadableExport,
  executeAccountDeletion,
  getRetentionPolicies,
  sanitizeAuditMetadata,
  _resetAuditStateForTests,
} from '../lib/academy/audit/compliance.js';
import { ACADEMY_ROLES } from '../lib/academy/auth/roles.js';

console.log('--- 📋 ТЕСТУВАННЯ AUDIT LOG, DATA EXPORT & ACCOUNT DELETION (SCRUM-88) ---');

// Скидання стану для чистого прогону тестів
_resetAuditStateForTests();

const studentUser = { id: 'student_dmytro_44', username: 'Dmytro Junior', role: ACADEMY_ROLES.STUDENT };
const mentorUser = { id: 'mentor_kirill_22', username: 'Kirill Mentor', role: ACADEMY_ROLES.MENTOR };
const adminUser = { id: 'admin_yarik_01', username: 'Yarik0505', role: ACADEMY_ROLES.ADMIN };
const strangerUser = { id: 'user_stranger_99', username: 'Anonymous Attacker', role: 'guest' };

// Тест 1: Реєстрація подій аудиту
console.log('1. Тест реєстрації подій аудиту (LOGIN, CONSENT_UPDATE, ROLE_CHANGE, REVIEW_ACCESS)...');
const loginEvt = recordAuditEvent({
  eventType: AUDIT_EVENT_TYPES.LOGIN,
  actor: studentUser,
  metadata: { loginMethod: 'oauth_duck', browser: 'CyberBrowser' },
});
assert.strictEqual(loginEvt.eventType, AUDIT_EVENT_TYPES.LOGIN);
assert.strictEqual(loginEvt.actorId, studentUser.id);
assert(loginEvt.id.startsWith('audit-evt-'));
assert(loginEvt.ipHash, 'Подія повинна містити хеш IP-адреси');

const reviewEvt = recordAuditEvent({
  eventType: AUDIT_EVENT_TYPES.REVIEW_ACCESS,
  actor: mentorUser,
  targetUserId: studentUser.id,
  metadata: { lessonId: 'lesson-fe-l0-arch', rubricScore: 28 },
});
assert.strictEqual(reviewEvt.eventType, AUDIT_EVENT_TYPES.REVIEW_ACCESS);
console.log('✅ Події аудиту успішно зареєстровано.');

// Тест 2: Санітизація метаданих (Data Redaction — нуль витоку паролів та токенів)
console.log('2. Тест санітизації метаданих (Zero Secret/Token Leak)...');
const dirtyPayload = {
  username: 'test_user',
  password: 'super_secret_password_123',
  token: 'jwt.token.secret',
  cookie: 'session=abc12345',
  apiKey: 'api-xyz-secret-key',
  nested: {
    secret: 'deep_secret_value',
    safeField: 'visible_data',
  },
};

const cleaned = sanitizeAuditMetadata(dirtyPayload);
assert.strictEqual(cleaned.password, '[REDACTED_SECRET]');
assert.strictEqual(cleaned.token, '[REDACTED_SECRET]');
assert.strictEqual(cleaned.cookie, '[REDACTED_SECRET]');
assert.strictEqual(cleaned.apiKey, '[REDACTED_SECRET]');
assert.strictEqual(cleaned.nested.secret, '[REDACTED_SECRET]');
assert.strictEqual(cleaned.nested.safeField, 'visible_data');

const sanitizedEvent = recordAuditEvent({
  eventType: AUDIT_EVENT_TYPES.LOGIN,
  actor: studentUser,
  metadata: dirtyPayload,
});
assert.strictEqual(sanitizedEvent.metadata.password, '[REDACTED_SECRET]');
assert.strictEqual(sanitizedEvent.metadata.token, '[REDACTED_SECRET]');
console.log('✅ Redaction Policy працює бездоганно: всі чутливі поля замінено на [REDACTED_SECRET].');

// Тест 3: Машиночитаний експорт даних (GDPR Art. 20 Data Portability)
console.log('3. Тест генерації машиночитаного JSON-експорту...');
const exportData = generateMachineReadableExport({
  targetUserId: studentUser.id,
  requestingUser: studentUser,
});
assert.strictEqual(exportData.exportFormatVersion, '1.0.0-gdpr');
assert.strictEqual(exportData.subject.userId, studentUser.id);
assert(exportData.integrityChecksum, 'Експорт повинен містити контрольну суму SHA-256');
assert(exportData.educationalProgress.length > 0, 'Експорт повинен містити навчальний прогрес');
assert(exportData.competenciesSummary.overallScore > 0, 'Експорт повинен містити зведення компетенцій');
console.log(`✅ Машиночитаний експорт згенеровано, SHA-256: ${exportData.integrityChecksum.substring(0, 16)}...`);

// Тест 4: IDOR захист при спробі чужого експорту
console.log('4. Тест блокування IDOR при неавторизованому експорті даних...');
assert.throws(
  () => {
    generateMachineReadableExport({
      targetUserId: studentUser.id,
      requestingUser: strangerUser,
    });
  },
  (err) => {
    assert.strictEqual(err.code, 'UNAUTHORIZED_EXPORT_ACCESS');
    return true;
  },
  'Чужий користувач не має права експортувати дані'
);
console.log('✅ IDOR блокування експорту спрацювало коректно (UNAUTHORIZED_EXPORT_ACCESS).');

// Тест 5: Каскадне видалення облікового запису (GDPR Art. 17 Right to be Forgotten)
console.log('5. Тест каскадного видалення облікового запису...');
const deletionResult = executeAccountDeletion({
  targetUserId: studentUser.id,
  requestingUser: studentUser,
  confirmationToken: 'valid-token',
  reason: 'Запит користувача на видалення',
});
assert.strictEqual(deletionResult.success, true);
assert.strictEqual(deletionResult.status, 'DELETED');
assert.strictEqual(deletionResult.purgedItems.userProfilePurged, true);
assert(deletionResult.purgedItems.progressRecordsPurged > 0);
assert(deletionResult.anonymizedAuditCount > 0, 'Події аудиту учня повинні бути анонімізовані');
console.log('✅ Каскадне видалення успішно виконано, анонімізовано записів:', deletionResult.anonymizedAuditCount);

// Тест 6: Ідемпотентність повторного видалення
console.log('6. Тест ідемпотентності повторного видалення акаунту...');
const repeatDeletion = executeAccountDeletion({
  targetUserId: studentUser.id,
  requestingUser: studentUser,
  confirmationToken: 'valid-token',
});
assert.strictEqual(repeatDeletion.success, true);
assert.strictEqual(repeatDeletion.status, 'ALREADY_DELETED');
console.log('✅ Повторне видалення повернуло ALREADY_DELETED без збоїв системи.');

// Тест 7: Рольовий фільтр перегляду журналу аудиту (Role-based Audit Viewer)
console.log('7. Тест рольової фільтрації журналу аудиту...');
// Адмін бачить всі записи
const adminView = getAuditEvents({ requestingUser: adminUser, limit: 100 });
assert(adminView.length >= 4, 'Адміністратор повинен бачити всі події системи');

// Ментор бачить тільки події рецензування та свої
const mentorView = getAuditEvents({ requestingUser: mentorUser, limit: 100 });
assert(mentorView.every(e => e.eventType === AUDIT_EVENT_TYPES.REVIEW_ACCESS || e.actorId === mentorUser.id));

// Гість або учень не бачить чужих адміністративних логів
const strangerView = getAuditEvents({ requestingUser: strangerUser, limit: 100 });
assert.strictEqual(strangerView.length, 0, 'Сторонній користувач не має доступу до чужих подій');
console.log('✅ Рольове розмежування журналів аудиту (RBAC) працює надійно.');

// Тест 8: Перевірка політик збереження (Retention Policies)
console.log('8. Перевірка конфігурації політик збереження (Retention Policies)...');
const policies = getRetentionPolicies();
assert.strictEqual(policies.TELEMETRY.days, 30);
assert.strictEqual(policies.EDUCATIONAL_RECORDS.days, 180);
assert.strictEqual(policies.SECURITY_AUDIT.days, 365);
console.log('✅ Політики збереження відповідають інженерному стандарту 30/180/365 днів.');

console.log('--- 🚀 ВСІ 8 ТЕСТІВ AUDIT LOG & ACCOUNT DELETION (SCRUM-88) УСПІШНО ПРОЙДЕНО! ---');
