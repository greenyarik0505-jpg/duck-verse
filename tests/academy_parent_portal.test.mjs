import assert from 'assert';
import {
  canParentAccessChild,
  createGuardianInvite,
  acceptGuardianInvite,
  revokeGuardianAccess,
  getStudentGuardians,
  generateWeeklyProgressReport,
  getChildrenForParent,
  getPortalAuditLog,
} from '../lib/academy/portal/guardian.js';
import { ACADEMY_ROLES } from '../lib/academy/auth/roles.js';

console.log('--- 👨‍👩‍👧 ТЕСТУВАННЯ PARENT/MENTOR PORTAL & WEEKLY REPORT (SCRUM-86) ---');

const testStudent = { id: 'student_eva_01', username: 'Eva Coder', role: ACADEMY_ROLES.STUDENT };
const testParent = { id: 'parent_olena_01', username: 'Olena (Mother)', role: 'parent' };
const testMentor = { id: 'mentor_dmytro_01', username: 'Dmytro Mentor', role: ACADEMY_ROLES.MENTOR };
const testAdmin = { id: 'admin_yarik_01', username: 'Yarik0505', role: ACADEMY_ROLES.ADMIN };
const testStranger = { id: 'parent_stranger_99', username: 'Stranger', role: 'parent' };

// Тест 1: Створення безпечного запрошення (Consent-based invite)
console.log('1. Тест створення consent-based запрошення опікуна...');
const invite = createGuardianInvite({
  studentId: testStudent.id,
  parentEmail: 'olena.parent@example.com',
  relation: 'mother',
  actor: testStudent,
});

assert(invite.token.startsWith('inv-'), 'Токен запрошення повинен мати префікс inv-');
assert.strictEqual(invite.studentId, testStudent.id);
assert.strictEqual(invite.status, 'pending');
assert(new Date(invite.expiresAt) > new Date(), 'Термін дії має бути в майбутньому (72h)');
console.log(`✅ Запрошення успішно створено з токеном: ${invite.token.substring(0, 10)}...`);

// Тест 2: Заборона доступу до прийняття запрошення
console.log('2. Перевірка відсутності доступу до прийняття запрошення...');
assert.strictEqual(
  canParentAccessChild(testParent.id, testStudent.id),
  false,
  'Батько не повинен мати доступу до прийняття інвайту'
);

assert.throws(
  () => {
    generateWeeklyProgressReport({
      studentId: testStudent.id,
      requestingUser: testStranger,
    });
  },
  (err) => {
    assert.strictEqual(err.code, 'UNAUTHORIZED_PARENT_ACCESS');
    return true;
  },
  'Неавторизований батько не має права читати звіт учня'
);
console.log('✅ Неавторизований доступ успішно заблоковано (UNAUTHORIZED_PARENT_ACCESS)');

// Тест 3: Прийняття запрошення та встановлення зв\'язку (Parent-Child Binding)
console.log('3. Тест прийняття запрошення батьками...');
const acceptResult = acceptGuardianInvite({
  token: invite.token,
  parentUser: testParent,
});
assert.strictEqual(acceptResult.success, true);
assert.strictEqual(canParentAccessChild(testParent.id, testStudent.id), true, 'Зв\'язок має бути активний');

const childrenList = getChildrenForParent(testParent.id);
assert(childrenList.some(c => c.studentId === testStudent.id), 'Учень повинен відображатися у списку дітей');

const guardiansList = getStudentGuardians(testStudent.id);
assert(guardiansList.some(g => g.parentId === testParent.id), 'Батько повинен відображатися в опікунах учня');
console.log('✅ Двосторонній зв\'язок Parent-Child встановлено успішно');

// Тест 4: Генерація Weekly Report для пов\'язаних батьків із динамікою (Progress Delta)
console.log('4. Тест генерації щотижневого звіту (Weekly Report) із динамікою...');
const report = generateWeeklyProgressReport({
  studentId: testStudent.id,
  requestingUser: testParent,
});

assert(report.reportId.startsWith('rep-'), 'Звіт повинен мати унікальний ідентифікатор');
assert(report.progressDelta, 'Звіт повинен містити об\'єкт progressDelta');
assert(report.progressDelta.overallScoreDelta > 0, 'Дельта успішності повинна бути позитивною');
assert(Array.isArray(report.completedSkillsThisWeek), 'Звіт повинен містити освоєні за тиждень навички');
assert(report.nextRecommendedStep, 'Звіт повинен рекомендувати наступний крок');
console.log(`✅ Weekly Report сформовано: дельта росту +${report.progressDelta.overallScoreDelta}%`);

// Тест 5: Захист приватності учня (Zero PII & Privacy Shield)
console.log('5. Перевірка Privacy Shield у щотижневому звіті...');
assert.strictEqual(report.privacyShield.piiSanitized, true);
assert.strictEqual(report.privacyShield.privateCodeProtected, true);
assert.strictEqual(report.privacyShield.privateNotesExcluded, true);
assert(!('password' in report), 'Звіт не може містити паролі');
assert(!('privateNotes' in report), 'Звіт не може містити приватні нотатки');
console.log('✅ Privacy Shield активний: вихідний код і персональні дані надійно приховані');

// Тест 6: Доступ Менторів та Адміністраторів
console.log('6. Перевірка доступу для Менторів та Адмінів...');
const mentorReport = generateWeeklyProgressReport({
  studentId: testStudent.id,
  requestingUser: testMentor,
});
assert.strictEqual(mentorReport.weekNumber, report.weekNumber);

const adminReport = generateWeeklyProgressReport({
  studentId: testStudent.id,
  requestingUser: testAdmin,
});
assert.strictEqual(adminReport.weekNumber, report.weekNumber);
console.log('✅ Ментор і Адміністратор мають належний авторизований доступ');

// Тест 7: Миттєве відкликання доступу (Instant Revoke Access)
console.log('7. Тест миттєвого відкликання доступу батьків (Revoke)...');
const revokeResult = revokeGuardianAccess({
  studentId: testStudent.id,
  parentId: testParent.id,
  actor: testStudent,
});
assert.strictEqual(revokeResult.revoked, true);
assert.strictEqual(canParentAccessChild(testParent.id, testStudent.id), false, 'Після revoke доступ має бути false');

assert.throws(
  () => {
    generateWeeklyProgressReport({
      studentId: testStudent.id,
      requestingUser: testParent,
    });
  },
  (err) => err.code === 'UNAUTHORIZED_PARENT_ACCESS',
  'Після відкликання доступу звіт недоступний'
);
console.log('✅ Миттєве відкликання доступу спрацювало бездоганно');

// Тест 8: Аудит логу дій опікунів
console.log('8. Перевірка журналу аудиту порталу...');
const auditLog = getPortalAuditLog();
assert(auditLog.length >= 4, 'Аудит повинен зафіксувати всі дії');
const actions = auditLog.map(a => a.action);
assert(actions.includes('CREATE_GUARDIAN_INVITE'), 'Аудит має зафіксувати створення запрошення');
assert(actions.includes('ACCEPT_GUARDIAN_INVITE'), 'Аудит має зафіксувати прийняття');
assert(actions.includes('VIEW_WEEKLY_REPORT'), 'Аудит має зафіксувати перегляд звіту');
assert(actions.includes('REVOKE_GUARDIAN_ACCESS'), 'Аудит має зафіксувати відкликання');
console.log('✅ Повний аудит дій збережено в системі');

console.log('--- 🚀 ВСІ ТЕСТИ PARENT/MENTOR PORTAL (SCRUM-86) УСПІШНО ПРОЙДЕНО! ---');
