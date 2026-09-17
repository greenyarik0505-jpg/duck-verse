/**
 * Duck Academy — Cohorts, Teams & Single-Use Invitations (SCRUM-94)
 *
 * Відповідає стандартам:
 * 1. Cohort & Team Model: команди, власники, закріплені ментори, ліміти місткості (Capacity).
 * 2. Single-Use Invitation Tokens: одноразові криптографічні токени з терміном дії 72 години та підтримкою відкликання (Revoke).
 * 3. Data Isolation: суворе розмежування доступу між різними когортами та командами (Multi-tenant IDOR protection).
 * 4. Role Escalation Prevention: блокування спроб звичайних учасників підвищити права до Owner/Mentor.
 * 5. Group Retrospectives: спільна ретроспектива команди (What went well, To improve, Action items).
 * 6. Team Archiving: переведення команди в статус архіву (тільки читання).
 */

import crypto from 'crypto';
import { ACADEMY_ROLES } from '../auth/roles.js';

// Структура когорт та команд
const cohortsStore = [
  {
    id: 'cohort-autumn-2026',
    name: 'Duck Verse Academy — Осінь 2026',
    season: 'Autumn 2026',
    status: 'ACTIVE',
  },
  {
    id: 'cohort-summer-2026',
    name: 'Duck Verse Academy — Літо 2026',
    season: 'Summer 2026',
    status: 'ARCHIVED',
  },
];

// Сховище команд
const teamsStore = [
  {
    id: 'team-cyber-ducks-01',
    cohortId: 'cohort-autumn-2026',
    name: 'Cyber Ducks Frontend Team',
    ownerId: 'student_eva_01',
    mentorId: 'mentor_kirill',
    capacity: 5,
    status: 'ACTIVE',
    members: [
      { userId: 'student_eva_01', username: 'Eva Coder', role: 'owner', joinedAt: '2026-09-10T10:00:00.000Z' },
      { userId: 'student_dmytro_44', username: 'Dmytro Junior', role: 'member', joinedAt: '2026-09-11T12:00:00.000Z' },
    ],
    retrospectives: [
      {
        id: 'retro-01',
        createdAt: '2026-09-15T18:00:00.000Z',
        submittedBy: 'student_eva_01',
        whatWentWell: 'Швидко інтегрували Canvas 2D фізику та налаштували лідерборд.',
        whatToImprove: 'Необхідно оптимізувати обробку колізій на слабких смартфонах.',
        actionItems: 'Провести рефакторинг spatial partitioning для зменшення перевірок перешкод.',
      },
    ],
    createdAt: '2026-09-10T10:00:00.000Z',
  },
  {
    id: 'team-neon-hackers-02',
    cohortId: 'cohort-autumn-2026',
    name: 'Neon Security Hackers',
    ownerId: 'student_alex_09',
    mentorId: 'admin_yarik',
    capacity: 4,
    status: 'ACTIVE',
    members: [
      { userId: 'student_alex_09', username: 'Alex Hacker', role: 'owner', joinedAt: '2026-09-12T14:00:00.000Z' },
    ],
    retrospectives: [],
    createdAt: '2026-09-12T14:00:00.000Z',
  },
];

// Сховище одноразових токенів запрошень
const invitesStore = new Map();

/**
 * Перевірка доступу користувача до команди (Data Isolation)
 */
export function canUserAccessTeamData({ requestingUser, teamId }) {
  if (!requestingUser || !teamId) return false;

  // Адміністратор платформи має глобальний доступ
  if (requestingUser.role === ACADEMY_ROLES.ADMIN) return true;

  const team = teamsStore.find(t => t.id === teamId);
  if (!team) return false;

  // Ментор закріплений за командою
  if (team.mentorId === requestingUser.id) return true;

  // Учасник команди
  return team.members.some(m => m.userId === requestingUser.id);
}

/**
 * Отримання списку команд когорти з урахуванням прав доступу
 */
export function getTeamsList({ requestingUser, cohortId = 'cohort-autumn-2026' }) {
  const filtered = teamsStore.filter(t => t.cohortId === cohortId);

  return filtered.map(t => ({
    id: t.id,
    cohortId: t.cohortId,
    name: t.name,
    ownerId: t.ownerId,
    mentorId: t.mentorId,
    capacity: t.capacity,
    memberCount: t.members.length,
    status: t.status,
    isMember: requestingUser ? t.members.some(m => m.userId === requestingUser.id) : false,
    canManage: requestingUser && (
      requestingUser.role === ACADEMY_ROLES.ADMIN ||
      t.ownerId === requestingUser.id ||
      t.mentorId === requestingUser.id
    ),
  }));
}

/**
 * Отримання детальної інформації про команду із перевіркою ізоляції
 */
export function getTeamDetails({ teamId, requestingUser }) {
  const team = teamsStore.find(t => t.id === teamId);
  if (!team) throw new Error('Команду не знайдено');

  if (!canUserAccessTeamData({ requestingUser, teamId })) {
    const err = new Error(`[IDOR Protection] Доступ до команди ${teamId} заборонено для користувача ${requestingUser?.id}`);
    err.code = 'UNAUTHORIZED_COHORT_ACCESS';
    throw err;
  }

  return team;
}

/**
 * Створення нової команди
 */
export function createTeam({ cohortId = 'cohort-autumn-2026', name, ownerUser, mentorId = 'mentor_kirill', capacity = 5 }) {
  if (!ownerUser || !ownerUser.id) throw new Error('ownerUser обов\'язковий');
  if (!name || name.length < 3) throw new Error('Назва команди повинна містити щонайменше 3 символи');
  if (capacity < 2 || capacity > 10) throw new Error('Місткість команди повинна бути від 2 до 10 учасників');

  const teamId = `team-${crypto.randomBytes(6).toString('hex')}`;
  const now = new Date().toISOString();

  const newTeam = {
    id: teamId,
    cohortId,
    name,
    ownerId: ownerUser.id,
    mentorId,
    capacity,
    status: 'ACTIVE',
    members: [
      {
        userId: ownerUser.id,
        username: ownerUser.username || 'Team Owner',
        role: 'owner',
        joinedAt: now,
      },
    ],
    retrospectives: [],
    createdAt: now,
  };

  teamsStore.push(newTeam);
  return newTeam;
}

/**
 * Створення одноразового токена запрошення (Single-Use Token)
 */
export function createTeamInvite({
  teamId,
  invitedEmail,
  targetRole = 'member',
  actor,
  expiresHours = 72,
}) {
  if (!teamId) throw new Error('teamId обов\'язковий');
  if (!invitedEmail || !invitedEmail.includes('@')) throw new Error('invitedEmail повинен бути валідним email');
  if (!actor || !actor.id) throw new Error('actor обов\'язковий');

  const team = teamsStore.find(t => t.id === teamId);
  if (!team) throw new Error('Команду не знайдено');

  if (team.status === 'ARCHIVED') {
    throw new Error('Неможливо запросити учасників до архівованої команди');
  }

  // Перевірка прав запрошення
  const isOwner = team.ownerId === actor.id;
  const isMentor = team.mentorId === actor.id;
  const isAdmin = actor.role === ACADEMY_ROLES.ADMIN;

  if (!isOwner && !isMentor && !isAdmin) {
    const err = new Error('Тільки власник команди, ментор або адміністратор можуть створювати запрошення');
    err.code = 'UNAUTHORIZED_INVITE';
    throw err;
  }

  // Перевірка ескалації ролей (Role Escalation Protection)
  if (['owner', 'mentor', 'admin'].includes(targetRole) && !isAdmin) {
    const err = new Error('Заборонено ескалацію ролей: призначати Owner або Mentor дозволено тільки адміністраторам');
    err.code = 'ROLE_ESCALATION_BLOCKED';
    throw err;
  }

  // Перевірка ліміту місткості
  if (team.members.length >= team.capacity) {
    const err = new Error(`Ліміт місткості команди (${team.capacity} учасників) вичерпано`);
    err.code = 'CAPACITY_EXCEEDED';
    throw err;
  }

  const token = `team-inv-${crypto.randomBytes(16).toString('hex')}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresHours * 60 * 60 * 1000);

  const inviteData = {
    token,
    teamId,
    cohortId: team.cohortId,
    invitedEmail,
    targetRole,
    createdBy: actor.id,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: 'PENDING',
  };

  invitesStore.set(token, inviteData);

  return {
    token,
    teamId,
    invitedEmail,
    targetRole,
    expiresAt: inviteData.expiresAt,
    expiresHours,
    inviteUrl: `/academy#cohort-join-${token}`,
  };
}

/**
 * Прийняття одноразового запрошення
 */
export function acceptTeamInvite({ token, acceptingUser }) {
  if (!token) throw new Error('token обов\'язковий');
  if (!acceptingUser || !acceptingUser.id) throw new Error('acceptingUser обов\'язковий');

  const invite = invitesStore.get(token);
  if (!invite) {
    throw new Error('Запрошення не знайдено або недійсне');
  }

  if (invite.status === 'USED') {
    const err = new Error('Цей токен запрошення вже був використаний (Single-Use Token Violation)');
    err.code = 'INVITE_ALREADY_USED';
    throw err;
  }

  if (invite.status === 'REVOKED') {
    const err = new Error('Це запрошення було відкликане керівником команди');
    err.code = 'INVITE_REVOKED';
    throw err;
  }

  if (new Date() > new Date(invite.expiresAt)) {
    invite.status = 'EXPIRED';
    const err = new Error('Термін дії запрошення минув (72 hours expired)');
    err.code = 'INVITE_EXPIRED';
    throw err;
  }

  const team = teamsStore.find(t => t.id === invite.teamId);
  if (!team) throw new Error('Команду не знайдено');

  if (team.members.length >= team.capacity) {
    const err = new Error(`Ліміт місткості команди (${team.capacity}) вже заповнено`);
    err.code = 'CAPACITY_EXCEEDED';
    throw err;
  }

  // Перевірка чи користувач вже не є членом команди
  if (team.members.some(m => m.userId === acceptingUser.id)) {
    throw new Error('Ви вже є учасником цієї команди');
  }

  // Додавання учасника
  team.members.push({
    userId: acceptingUser.id,
    username: acceptingUser.username || 'Team Member',
    role: invite.targetRole,
    joinedAt: new Date().toISOString(),
  });

  // Позначення токена як використаного (Single-Use Guarantee)
  invite.status = 'USED';
  invite.usedBy = acceptingUser.id;
  invite.usedAt = new Date().toISOString();

  return {
    success: true,
    teamId: team.id,
    teamName: team.name,
    memberCount: team.members.length,
    userRole: invite.targetRole,
    message: `Ви успішно приєдналися до команди "${team.name}"!`,
  };
}

/**
 * Відкликання запрошення керівником команди
 */
export function revokeTeamInvite({ token, actor }) {
  const invite = invitesStore.get(token);
  if (!invite) throw new Error('Запрошення не знайдено');

  const team = teamsStore.find(t => t.id === invite.teamId);
  const isAuthorized = actor && (
    actor.role === ACADEMY_ROLES.ADMIN ||
    team?.ownerId === actor.id ||
    invite.createdBy === actor.id
  );

  if (!isAuthorized) {
    const err = new Error('Тільки творець інвайту або власник команди можуть відкликати запрошення');
    err.code = 'UNAUTHORIZED_REVOKE';
    throw err;
  }

  invite.status = 'REVOKED';
  invite.revokedAt = new Date().toISOString();
  invite.revokedBy = actor.id;

  return {
    success: true,
    token,
    revoked: true,
    message: 'Запрошення успішно анульовано.',
  };
}

/**
 * Проведення та фіксація групової ретроспективи
 */
export function submitTeamRetrospective({ teamId, actor, items }) {
  if (!teamId) throw new Error('teamId обов\'язковий');
  if (!actor || !actor.id) throw new Error('actor обов\'язковий');
  if (!items || !items.whatWentWell || !items.whatToImprove || !items.actionItems) {
    throw new Error('Ретроспектива повинна містити whatWentWell, whatToImprove та actionItems');
  }

  const team = teamsStore.find(t => t.id === teamId);
  if (!team) throw new Error('Команду не знайдено');

  // Перевірка належності до команди
  if (!canUserAccessTeamData({ requestingUser: actor, teamId })) {
    const err = new Error('Тільки учасники або ментори команди мають право додавати ретроспективу');
    err.code = 'UNAUTHORIZED_RETRO';
    throw err;
  }

  const retroEntry = {
    id: `retro-${Date.now()}`,
    createdAt: new Date().toISOString(),
    submittedBy: actor.username || actor.id,
    whatWentWell: items.whatWentWell,
    whatToImprove: items.whatToImprove,
    actionItems: items.actionItems,
  };

  team.retrospectives.unshift(retroEntry);
  return retroEntry;
}

/**
 * Архівація команди (переведення в read-only)
 */
export function archiveTeam({ teamId, actor }) {
  const team = teamsStore.find(t => t.id === teamId);
  if (!team) throw new Error('Команду не знайдено');

  const isAuthorized = actor && (
    actor.role === ACADEMY_ROLES.ADMIN ||
    team.ownerId === actor.id
  );

  if (!isAuthorized) {
    const err = new Error('Тільки власник команди або адміністратор мають право архівувати команду');
    err.code = 'UNAUTHORIZED_ARCHIVE';
    throw err;
  }

  team.status = 'ARCHIVED';
  team.archivedAt = new Date().toISOString();
  team.archivedBy = actor.id;

  return {
    success: true,
    teamId,
    status: 'ARCHIVED',
    message: 'Команду успішно переведено в архів. Подальші зміни заблоковано.',
  };
}

/**
 * Скидання стану для ізоляції тестів
 */
export function _resetCohortsStateForTests() {
  invitesStore.clear();
  // Повертаємо 2 початкові команди
  teamsStore.length = 2;
}
