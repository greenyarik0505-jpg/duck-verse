import assert from 'assert';
import {
  createTeam,
  getTeamDetails,
  createTeamInvite,
  acceptTeamInvite,
  revokeTeamInvite,
  submitTeamRetrospective,
  archiveTeam,
  _resetCohortsStateForTests,
} from '../lib/academy/cohorts/cohorts.js';
import { ACADEMY_ROLES } from '../lib/academy/auth/roles.js';

console.log('--- 👥 ТЕСТУВАННЯ COHORTS, TEAMS & INVITATIONS (SCRUM-94) ---');

_resetCohortsStateForTests();

const testOwner = { id: 'student_eva_01', username: 'Eva Coder', role: ACADEMY_ROLES.STUDENT };
const newStudent = { id: 'student_viktor_77', username: 'Viktor Coder', role: ACADEMY_ROLES.STUDENT };
const unauthorizedStudent = { id: 'student_stranger_99', username: 'Stranger Coder', role: ACADEMY_ROLES.STUDENT };

// Тест 1: Створення команди з лімітом місткості
console.log('1. Тест створення команди...');
const team = createTeam({
  name: 'Cyber Duck Pioneers',
  ownerUser: testOwner,
  capacity: 3,
});
assert(team.id.startsWith('team-'));
assert.strictEqual(team.name, 'Cyber Duck Pioneers');
assert.strictEqual(team.capacity, 3);
assert.strictEqual(team.members.length, 1);
assert.strictEqual(team.members[0].role, 'owner');
console.log(`✅ Команду створено: ${team.name}, місткість: ${team.capacity}`);

// Тест 2: Створення одноразового інвайту (72h TTL)
console.log('2. Тест створення одноразового інвайту...');
const invite = createTeamInvite({
  teamId: team.id,
  invitedEmail: 'viktor@example.com',
  targetRole: 'member',
  actor: testOwner,
  expiresHours: 72,
});
assert(invite.token.startsWith('team-inv-'));
assert(new Date(invite.expiresAt) > new Date());
console.log(`✅ Одноразовий інвайт згенеровано, токен: ${invite.token.substring(0, 15)}...`);

// Тест 3: Успішне прийняття інвайту
console.log('3. Тест прийняття інвайту новим учасником...');
const acceptRes = acceptTeamInvite({
  token: invite.token,
  acceptingUser: newStudent,
});
assert.strictEqual(acceptRes.success, true);
assert.strictEqual(acceptRes.memberCount, 2);

const teamAfterJoin = getTeamDetails({ teamId: team.id, requestingUser: newStudent });
assert(teamAfterJoin.members.some(m => m.userId === newStudent.id));
console.log('✅ Учасник успішно приєднався до команди, новий розмір:', teamAfterJoin.members.length);

// Тест 4: Блокування повторного використання токена (Single-Use Token Guarantee)
console.log('4. Тест блокування повторного використання одноразового інвайту...');
assert.throws(
  () => {
    acceptTeamInvite({
      token: invite.token,
      acceptingUser: { id: 'another_user', username: 'Another' },
    });
  },
  (err) => {
    assert.strictEqual(err.code, 'INVITE_ALREADY_USED');
    return true;
  },
  'Використаний токен повинен відхилятися з помилкою INVITE_ALREADY_USED'
);
console.log('✅ Повторне використання токена заблоковано (INVITE_ALREADY_USED)');

// Тест 5: Відкликання запрошення власником команди
console.log('5. Тест відкликання інвайту керівником...');
const invite2 = createTeamInvite({
  teamId: team.id,
  invitedEmail: 'revoke_me@example.com',
  actor: testOwner,
});

const revokeRes = revokeTeamInvite({
  token: invite2.token,
  actor: testOwner,
});
assert.strictEqual(revokeRes.revoked, true);

assert.throws(
  () => {
    acceptTeamInvite({
      token: invite2.token,
      acceptingUser: { id: 'some_user_33', username: 'User 33' },
    });
  },
  (err) => {
    assert.strictEqual(err.code, 'INVITE_REVOKED');
    return true;
  },
  'Відкликаний токен повинен відхилятися'
);
console.log('✅ Відкликання запрошення спрацювало надійно (INVITE_REVOKED)');

// Тест 6: Захист від ескалації привілеїв (Role Escalation Prevention)
console.log('6. Тест захисту від ескалації привілеїв...');
assert.throws(
  () => {
    createTeamInvite({
      teamId: team.id,
      invitedEmail: 'escalate@example.com',
      targetRole: 'owner', // Студент не має права призначати іншого owner
      actor: testOwner,
    });
  },
  (err) => {
    assert.strictEqual(err.code, 'ROLE_ESCALATION_BLOCKED');
    return true;
  },
  'Спроба призначити роль Owner без прав адміна повинна блокуватися'
);
console.log('✅ Ескалацію привілеїв заблоковано (ROLE_ESCALATION_BLOCKED)');

// Тест 7: Ізоляція даних між командами (Multi-tenant IDOR protection)
console.log('7. Тест ізоляції даних команди від сторонніх користувачів...');
assert.throws(
  () => {
    getTeamDetails({
      teamId: team.id,
      requestingUser: unauthorizedStudent,
    });
  },
  (err) => {
    assert.strictEqual(err.code, 'UNAUTHORIZED_COHORT_ACCESS');
    return true;
  },
  'Сторонній учень не повинен мати доступу до деталей команди'
);
console.log('✅ Ізоляція даних команди працює надійно (UNAUTHORIZED_COHORT_ACCESS)');

// Тест 8: Командна ретроспектива та архівація
console.log('8. Тест проведення командної ретроспективи та архівації...');
const retro = submitTeamRetrospective({
  teamId: team.id,
  actor: newStudent,
  items: {
    whatWentWell: 'Гарна командна комунікація.',
    whatToImprove: 'Потрібно швидше переглядати PR.',
    actionItems: 'Встановити щоденні 15-хвилинні дейлі.',
  },
});
assert.strictEqual(retro.whatWentWell, 'Гарна командна комунікація.');

const archiveRes = archiveTeam({
  teamId: team.id,
  actor: testOwner,
});
assert.strictEqual(archiveRes.status, 'ARCHIVED');
console.log('✅ Ретроспективу збережено та команду успішно переведено в архів');

console.log('--- 🚀 ВСІ 8 ТЕСТІВ COHORTS & TEAMS (SCRUM-94) УСПІШНО ПРОЙДЕНО! ---');
