import crypto from 'crypto';

export const ACCOUNT_STATUS = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  INVITED: 'INVITED',
  DEACTIVATED: 'DEACTIVATED',
};

export const INVITE_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REVOKED: 'REVOKED',
  EXPIRED: 'EXPIRED',
};

export const ROLES = {
  ADMIN: 'admin',
  MENTOR: 'mentor',
  PARENT: 'parent',
  STUDENT: 'student',
};

export const RBAC_LIFECYCLE_MATRIX = {
  [ROLES.ADMIN]: {
    canInviteRoles: [ROLES.MENTOR, ROLES.PARENT, ROLES.STUDENT],
    canSuspendRoles: [ROLES.MENTOR, ROLES.PARENT, ROLES.STUDENT],
    canReactivateRoles: [ROLES.MENTOR, ROLES.PARENT, ROLES.STUDENT],
    canBulkAction: true,
  },
  [ROLES.MENTOR]: {
    canInviteRoles: [ROLES.STUDENT],
    canSuspendRoles: [ROLES.STUDENT],
    canReactivateRoles: [ROLES.STUDENT],
    canBulkAction: true,
  },
  [ROLES.PARENT]: {
    canInviteRoles: [],
    canSuspendRoles: [ROLES.STUDENT], // only their linked children
    canReactivateRoles: [ROLES.STUDENT],
    canBulkAction: false,
  },
  [ROLES.STUDENT]: {
    canInviteRoles: [],
    canSuspendRoles: [],
    canReactivateRoles: [],
    canBulkAction: false,
  },
};

let mockAccounts = [
  {
    id: 'usr-admin-01',
    username: 'admin_yarik',
    email: 'yarik_admin@duckverse.io',
    role: ROLES.ADMIN,
    status: ACCOUNT_STATUS.ACTIVE,
    createdAt: new Date(Date.now() - 60 * 86400 * 1000).toISOString(),
    lastLoginAt: new Date(Date.now() - 3600 * 1000).toISOString(),
    suspensionInfo: null,
  },
  {
    id: 'usr-mentor-02',
    username: 'mentor_dmytro',
    email: 'dmytro@duckverse.io',
    role: ROLES.MENTOR,
    status: ACCOUNT_STATUS.ACTIVE,
    createdAt: new Date(Date.now() - 40 * 86400 * 1000).toISOString(),
    lastLoginAt: new Date(Date.now() - 7200 * 1000).toISOString(),
    suspensionInfo: null,
  },
  {
    id: 'usr-student-03',
    username: 'kyrylo_coder',
    email: 'kyrylo@example.com',
    role: ROLES.STUDENT,
    status: ACCOUNT_STATUS.ACTIVE,
    parentId: 'usr-parent-05',
    createdAt: new Date(Date.now() - 20 * 86400 * 1000).toISOString(),
    lastLoginAt: new Date(Date.now() - 1800 * 1000).toISOString(),
    suspensionInfo: null,
  },
  {
    id: 'usr-student-04',
    username: 'bogdan_spammer',
    email: 'bogdan@example.com',
    role: ROLES.STUDENT,
    status: ACCOUNT_STATUS.SUSPENDED,
    parentId: null,
    createdAt: new Date(Date.now() - 15 * 86400 * 1000).toISOString(),
    lastLoginAt: new Date(Date.now() - 5 * 86400 * 1000).toISOString(),
    suspensionInfo: {
      suspendedBy: 'admin_yarik',
      reason: 'Порушення правил спільноти: спам у загальному чаті когорти',
      suspendedAt: new Date(Date.now() - 3 * 86400 * 1000).toISOString(),
    },
  },
  {
    id: 'usr-parent-05',
    username: 'olena_parent',
    email: 'olena@example.com',
    role: ROLES.PARENT,
    status: ACCOUNT_STATUS.ACTIVE,
    linkedChildIds: ['usr-student-03'],
    createdAt: new Date(Date.now() - 25 * 86400 * 1000).toISOString(),
    lastLoginAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    suspensionInfo: null,
  },
];

let mockInvites = [
  {
    id: 'inv-001',
    email: 'new_student@school.org',
    role: ROLES.STUDENT,
    token: 'INV-A7F92C',
    tokenHash: crypto.createHash('sha256').update('INV-A7F92C').digest('hex'),
    status: INVITE_STATUS.PENDING,
    invitedBy: 'mentor_dmytro',
    ttlHours: 48,
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 42 * 3600 * 1000).toISOString(),
  },
  {
    id: 'inv-002',
    email: 'external_mentor@partner.ua',
    role: ROLES.MENTOR,
    token: 'INV-88E31B',
    tokenHash: crypto.createHash('sha256').update('INV-88E31B').digest('hex'),
    status: INVITE_STATUS.REVOKED,
    invitedBy: 'admin_yarik',
    ttlHours: 24,
    createdAt: new Date(Date.now() - 30 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    revokedAt: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
    revokeReason: 'Запрошення скасовано: ментор відмовився від участі',
  },
];

let mockAuditLogs = [
  {
    id: 'log-lc-001',
    timestamp: new Date(Date.now() - 3 * 86400 * 1000).toISOString(),
    action: 'ACCOUNT_SUSPENDED',
    targetAccountId: 'usr-student-04',
    targetUsername: 'bogdan_spammer',
    actor: 'admin_yarik',
    actorRole: ROLES.ADMIN,
    reason: 'Порушення правил спільноти: спам у загальному чаті когорти',
  },
  {
    id: 'log-lc-002',
    timestamp: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
    action: 'INVITE_REVOKED',
    targetAccountId: null,
    targetUsername: 'external_mentor@partner.ua',
    actor: 'admin_yarik',
    actorRole: ROLES.ADMIN,
    reason: 'Запрошення скасовано: ментор відмовився від участі',
  },
];

export function getAccounts() {
  return [...mockAccounts];
}

export function getInvites() {
  const now = Date.now();
  mockInvites = mockInvites.map(inv => {
    if (inv.status === INVITE_STATUS.PENDING && new Date(inv.expiresAt).getTime() < now) {
      return { ...inv, status: INVITE_STATUS.EXPIRED };
    }
    return inv;
  });
  return [...mockInvites];
}

export function getAuditLogs() {
  return [...mockAuditLogs];
}

export function canManageAccount(actor, targetAccount, operation) {
  if (!actor || !targetAccount) return { allowed: false, reason: 'Невалідні параметри суб’єкта чи об’єкта' };

  const actorRole = actor.role || ROLES.STUDENT;
  const permissions = RBAC_LIFECYCLE_MATRIX[actorRole];

  if (!permissions) {
    return { allowed: false, reason: `Роль ${actorRole} не має доступу до життєвого циклу` };
  }

  // Parent can only manage their own linked child
  if (actorRole === ROLES.PARENT) {
    const isLinked = actor.linkedChildIds?.includes(targetAccount.id) || targetAccount.parentId === actor.id;
    if (!isLinked) {
      return { allowed: false, reason: 'Батьки можуть керувати тільки прив’язаними акаунтами своїх дітей' };
    }
  }

  if (operation === 'SUSPEND') {
    if (!permissions.canSuspendRoles.includes(targetAccount.role)) {
      return { allowed: false, reason: `Роль ${actorRole} не має прав призупиняти акаунти з роллю ${targetAccount.role}` };
    }
  }

  if (operation === 'REACTIVATE') {
    if (!permissions.canReactivateRoles.includes(targetAccount.role)) {
      return { allowed: false, reason: `Роль ${actorRole} не має прав реактивувати акаунти з роллю ${targetAccount.role}` };
    }
  }

  return { allowed: true };
}

export function createInvite({ email, role, ttlHours = 48, actor }) {
  if (!email || !email.includes('@')) {
    return { success: false, error: 'Вкажіть коректний email для запрошення' };
  }
  if (!actor) {
    return { success: false, error: 'Необхідна авторизація' };
  }

  const permissions = RBAC_LIFECYCLE_MATRIX[actor.role];
  if (!permissions || !permissions.canInviteRoles.includes(role)) {
    return { success: false, error: `Роль ${actor.role} не має права запрошувати роль ${role}` };
  }

  const token = `INV-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const now = Date.now();
  const expiresAt = new Date(now + ttlHours * 3600 * 1000).toISOString();

  const newInvite = {
    id: `inv-${Date.now().toString(36)}`,
    email,
    role,
    token,
    tokenHash,
    status: INVITE_STATUS.PENDING,
    invitedBy: actor.username || actor.id,
    ttlHours,
    createdAt: new Date(now).toISOString(),
    expiresAt,
  };

  mockInvites.unshift(newInvite);
  mockAuditLogs.unshift({
    id: `log-lc-${Date.now()}`,
    timestamp: newInvite.createdAt,
    action: 'INVITE_CREATED',
    targetAccountId: null,
    targetUsername: email,
    actor: actor.username || actor.id,
    actorRole: actor.role,
    reason: `Створено запрошення для ролі ${role} з терміном дії ${ttlHours} год.`,
  });

  return { success: true, invite: newInvite };
}

export function revokeInvite({ inviteId, actor, reason = 'Скасовано адміністратором' }) {
  const invite = mockInvites.find(i => i.id === inviteId);
  if (!invite) {
    return { success: false, error: 'Запрошення не знайдено' };
  }
  if (invite.status !== INVITE_STATUS.PENDING) {
    return { success: false, error: `Запрошення вже в статусі ${invite.status}` };
  }

  invite.status = INVITE_STATUS.REVOKED;
  invite.revokedAt = new Date().toISOString();
  invite.revokeReason = reason;

  mockAuditLogs.unshift({
    id: `log-lc-${Date.now()}`,
    timestamp: invite.revokedAt,
    action: 'INVITE_REVOKED',
    targetAccountId: null,
    targetUsername: invite.email,
    actor: actor.username || actor.id,
    actorRole: actor.role,
    reason,
  });

  return { success: true, invite };
}

export function suspendAccount({ accountId, actor, reason, confirmed = true }) {
  if (!reason || !reason.trim()) {
    return { success: false, error: 'Причина блокування обов’язкова для аудиту' };
  }
  if (!confirmed) {
    return { success: false, error: 'Потрібне підтвердження небезпечної дії (confirmation required)' };
  }

  const target = mockAccounts.find(a => a.id === accountId);
  if (!target) {
    return { success: false, error: 'Акаунт не знайдено' };
  }

  // Safeguard 1: Self-suspension is strictly prohibited
  if (actor.id === target.id) {
    return { success: false, error: 'Самоблокування суворо заборонене правилами безпеки' };
  }

  // Safeguard 2: Last active admin protection
  if (target.role === ROLES.ADMIN) {
    const activeAdmins = mockAccounts.filter(a => a.role === ROLES.ADMIN && a.status === ACCOUNT_STATUS.ACTIVE);
    if (activeAdmins.length <= 1 && activeAdmins[0].id === target.id) {
      return { success: false, error: 'Заборонено призупиняти останнього активного адміністратора системи' };
    }
  }

  // RBAC validation
  const check = canManageAccount(actor, target, 'SUSPEND');
  if (!check.allowed) {
    return { success: false, error: check.reason };
  }

  const now = new Date().toISOString();
  target.status = ACCOUNT_STATUS.SUSPENDED;
  target.suspensionInfo = {
    suspendedBy: actor.username || actor.id,
    reason: reason.trim(),
    suspendedAt: now,
  };

  mockAuditLogs.unshift({
    id: `log-lc-${Date.now()}`,
    timestamp: now,
    action: 'ACCOUNT_SUSPENDED',
    targetAccountId: target.id,
    targetUsername: target.username,
    actor: actor.username || actor.id,
    actorRole: actor.role,
    reason: reason.trim(),
  });

  return { success: true, account: target };
}

export function reactivateAccount({ accountId, actor, reason }) {
  if (!reason || !reason.trim()) {
    return { success: false, error: 'Причина розблокування обов’язкова для аудиту' };
  }

  const target = mockAccounts.find(a => a.id === accountId);
  if (!target) {
    return { success: false, error: 'Акаунт не знайдено' };
  }

  if (target.status !== ACCOUNT_STATUS.SUSPENDED) {
    return { success: false, error: `Акаунт вже має статус ${target.status}` };
  }

  // RBAC validation
  const check = canManageAccount(actor, target, 'REACTIVATE');
  if (!check.allowed) {
    return { success: false, error: check.reason };
  }

  const now = new Date().toISOString();
  target.status = ACCOUNT_STATUS.ACTIVE;
  target.suspensionInfo = null;

  mockAuditLogs.unshift({
    id: `log-lc-${Date.now()}`,
    timestamp: now,
    action: 'ACCOUNT_REACTIVATED',
    targetAccountId: target.id,
    targetUsername: target.username,
    actor: actor.username || actor.id,
    actorRole: actor.role,
    reason: reason.trim(),
  });

  return { success: true, account: target };
}

export function verifyAccountAccess(account, operation = 'READ_DATA') {
  if (!account) {
    return { allowed: false, code: 'UNAUTHENTICATED', message: 'Користувач не автентифікований' };
  }

  if (account.status === ACCOUNT_STATUS.SUSPENDED) {
    return {
      allowed: false,
      code: 'ACCOUNT_SUSPENDED',
      message: 'Акаунт призупинено адміністрацією. Вхід та доступ до навчальних даних заблоковано.',
      reason: account.suspensionInfo?.reason || 'Причину не вказано',
      suspendedAt: account.suspensionInfo?.suspendedAt,
    };
  }

  if (account.status === ACCOUNT_STATUS.DEACTIVATED) {
    return {
      allowed: false,
      code: 'ACCOUNT_DEACTIVATED',
      message: 'Акаунт деактивовано.',
    };
  }

  return {
    allowed: true,
    code: 'ACCESS_GRANTED',
    message: `Доступ до операції ${operation} дозволено.`,
  };
}

export function executeBulkLifecycleAction({ action, targetIds, actor, reason, confirmed = false }) {
  if (!confirmed) {
    return { success: false, error: 'Масові дії вимагають явного прапорця підтвердження (confirmed: true)' };
  }
  if (!targetIds || !Array.isArray(targetIds) || targetIds.length === 0) {
    return { success: false, error: 'Оберіть хоча б один акаунт для масової дії' };
  }
  if (!reason || !reason.trim()) {
    return { success: false, error: 'Вкажіть причину для журналу аудиту' };
  }

  const permissions = RBAC_LIFECYCLE_MATRIX[actor.role];
  if (!permissions?.canBulkAction) {
    return { success: false, error: `Роль ${actor.role} не має права виконувати масові операції` };
  }

  const results = [];
  let affectedCount = 0;
  let skippedCount = 0;

  for (const accountId of targetIds) {
    if (accountId === actor.id) {
      skippedCount++;
      results.push({ id: accountId, success: false, error: 'Пропущено: самодія заборонена' });
      continue;
    }

    if (action === 'BULK_SUSPEND') {
      const res = suspendAccount({ accountId, actor, reason, confirmed: true });
      if (res.success) {
        affectedCount++;
        results.push({ id: accountId, success: true });
      } else {
        skippedCount++;
        results.push({ id: accountId, success: false, error: res.error });
      }
    } else if (action === 'BULK_REACTIVATE') {
      const res = reactivateAccount({ accountId, actor, reason });
      if (res.success) {
        affectedCount++;
        results.push({ id: accountId, success: true });
      } else {
        skippedCount++;
        results.push({ id: accountId, success: false, error: res.error });
      }
    } else {
      return { success: false, error: `Невідома масова дія: ${action}` };
    }
  }

  mockAuditLogs.unshift({
    id: `log-lc-${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: `BULK_${action}`,
    targetAccountId: null,
    targetUsername: `${affectedCount} акаунтів`,
    actor: actor.username || actor.id,
    actorRole: actor.role,
    reason: `Масова операція (${action}): застосовано до ${affectedCount}, пропущено ${skippedCount}. Причина: ${reason}`,
  });

  return { success: true, affectedCount, skippedCount, results };
}

export function resetMockData() {
  mockAccounts = [];
  mockInvites = [];
  mockAuditLogs = [];
}
