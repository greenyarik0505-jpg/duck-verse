import crypto from 'crypto';

export const RECOVERY_TYPES = {
  FORGOTTEN_CREDENTIALS: {
    id: 'FORGOTTEN_CREDENTIALS',
    name: 'Забутий пароль / облікові дані',
    tier: 'L1',
    severity: 'LOW',
    defaultOwner: 'L1 Support / Self-Service',
    requiresCoolingOff: false,
  },
  LOCKED_OUT_2FA: {
    id: 'LOCKED_OUT_2FA',
    name: 'Втрата другого фактора (2FA Lockout)',
    tier: 'L2',
    severity: 'MEDIUM',
    defaultOwner: 'L2 Security Mentor',
    requiresCoolingOff: false,
  },
  SUSPECTED_ATO: {
    id: 'SUSPECTED_ATO',
    name: 'Підозра захоплення акаунта (Account Takeover)',
    tier: 'L3',
    severity: 'HIGH',
    defaultOwner: 'Security Incident Lead / SIRT',
    requiresCoolingOff: false,
    requiresEmergencyFreeze: true,
  },
  IRREVERSIBLE_RESET: {
    id: 'IRREVERSIBLE_RESET',
    name: 'Незворотне скидання даних / видалення профілю',
    tier: 'L3_DUAL',
    severity: 'CRITICAL',
    defaultOwner: 'Platform Admin + Mentor Co-Sign',
    requiresCoolingOff: true,
    coolingOffHoursDefault: 24,
  },
};

export const COOLING_OFF_STATUS = {
  PENDING_COOLING_OFF: 'PENDING_COOLING_OFF',
  CANCELLED: 'CANCELLED',
  EXECUTED: 'EXECUTED',
};

export function maskEmail(email) {
  if (!email || !email.includes('@')) return '***@***.***';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0] || '*'}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

export function maskIp(ip) {
  if (!ip) return '0.0.0.0';
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

export function sanitizeUserForSupport(user) {
  if (!user) return null;
  const { password, sessionToken, authToken, rawToken, ...safeData } = user;
  return {
    ...safeData,
    email: maskEmail(user.email),
    parentEmail: user.parentEmail ? maskEmail(user.parentEmail) : null,
    ipHash: user.lastIp ? maskIp(user.lastIp) : null,
    hasActiveCredentials: Boolean(password || authToken),
    dataShieldActive: true,
  };
}

let mockTickets = [
  {
    id: 'tkt-rec-101',
    accountId: 'usr-student-04',
    username: 'bogdan_spammer',
    maskedEmail: 'b***n@example.com',
    type: 'SUSPECTED_ATO',
    tier: 'L3',
    status: 'INVESTIGATING',
    owner: 'Security Incident Lead',
    reason: 'Аномальний вхід з нової підмережі та масова зміна налаштувань',
    emergencyFrozen: true,
    incidentCode: 'ATO-92B1F4',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    oobVerified: false,
  },
  {
    id: 'tkt-rec-102',
    accountId: 'usr-student-03',
    username: 'kyrylo_coder',
    maskedEmail: 'k***o@example.com',
    type: 'LOCKED_OUT_2FA',
    tier: 'L2',
    status: 'IN_REVIEW',
    owner: 'Степаненко Дмитро (Mentor)',
    reason: 'Втрата доступу до автентифікатора після оновлення телефону',
    emergencyFrozen: false,
    incidentCode: null,
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    oobVerified: true,
  },
];

let mockCoolingOffActions = [
  {
    id: 'cool-act-001',
    accountId: 'usr-student-03',
    username: 'kyrylo_coder',
    actionType: 'IRREVERSIBLE_DATA_RESET',
    status: COOLING_OFF_STATUS.PENDING_COOLING_OFF,
    initiatedBy: 'admin_yarik',
    reason: 'Запит батьків на повне скидання навчального прогресу для перезапуску',
    initiatedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 20 * 3600 * 1000).toISOString(),
    coolingOffHours: 24,
    doubleConfirmationPhrase: 'RESET-KYRYLO',
  },
];

let mockAuditLogs = [
  {
    id: 'log-rec-001',
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    action: 'ATO_EMERGENCY_FREEZE',
    targetAccountId: 'usr-student-04',
    targetUsername: 'bogdan_spammer',
    actor: 'admin_yarik',
    actorRole: 'admin',
    reason: 'Аномальний сплеск трафіку та підозра на перехоплення сесії',
    details: 'Сесії анульовано, встановлено статус EMERGENCY_FROZEN, сповіщення надіслано батькам.',
  },
];

export function getRecoveryTickets() {
  return [...mockTickets];
}

export function getCoolingOffActions() {
  const now = Date.now();
  mockCoolingOffActions = mockCoolingOffActions.map(act => {
    if (act.status === COOLING_OFF_STATUS.PENDING_COOLING_OFF && new Date(act.expiresAt).getTime() < now) {
      return { ...act, status: COOLING_OFF_STATUS.EXECUTED };
    }
    return act;
  });
  return [...mockCoolingOffActions];
}

export function getRecoveryAuditLogs() {
  return [...mockAuditLogs];
}

export function createRecoveryTicket({ accountId, username, email, type, reason, actor }) {
  if (!accountId || !username || !reason || !reason.trim()) {
    return { success: false, error: 'Заповніть усі обов’язкові поля запиту' };
  }

  const recConfig = RECOVERY_TYPES[type] || RECOVERY_TYPES.FORGOTTEN_CREDENTIALS;
  const maskedEmail = maskEmail(email);
  const now = new Date().toISOString();
  const ticketId = `tkt-rec-${Date.now().toString(36)}`;

  let incidentCode = null;
  let emergencyFrozen = false;

  if (recConfig.requiresEmergencyFreeze) {
    incidentCode = `ATO-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    emergencyFrozen = true;
  }

  const newTicket = {
    id: ticketId,
    accountId,
    username,
    maskedEmail,
    type: recConfig.id,
    tier: recConfig.tier,
    status: 'OPEN',
    owner: recConfig.defaultOwner,
    reason: reason.trim(),
    emergencyFrozen,
    incidentCode,
    createdAt: now,
    oobVerified: false,
  };

  mockTickets.unshift(newTicket);

  mockAuditLogs.unshift({
    id: `log-rec-${Date.now()}`,
    timestamp: now,
    action: 'RECOVERY_TICKET_CREATED',
    targetAccountId: accountId,
    targetUsername: username,
    actor: actor?.username || 'user',
    actorRole: actor?.role || 'student',
    reason: reason.trim(),
    details: `Створено інцидент відновлення (${recConfig.id}) з рівнем ${recConfig.tier}.`,
  });

  return { success: true, ticket: newTicket };
}

export function escalateRecoveryTicket({ ticketId, newTier, newOwner, actor, reason }) {
  if (!reason || !reason.trim()) {
    return { success: false, error: 'Причина ескалації обов’язкова для аудиту' };
  }

  const ticket = mockTickets.find(t => t.id === ticketId);
  if (!ticket) {
    return { success: false, error: 'Квиток відновлення не знайдено' };
  }

  const prevTier = ticket.tier;
  ticket.tier = newTier;
  if (newOwner) ticket.owner = newOwner;
  ticket.status = 'ESCALATED';

  const now = new Date().toISOString();
  mockAuditLogs.unshift({
    id: `log-rec-${Date.now()}`,
    timestamp: now,
    action: 'RECOVERY_TICKET_ESCALATED',
    targetAccountId: ticket.accountId,
    targetUsername: ticket.username,
    actor: actor.username || actor.id,
    actorRole: actor.role,
    reason: reason.trim(),
    details: `Ескалація з ${prevTier} до ${newTier}. Новий власник: ${ticket.owner}`,
  });

  return { success: true, ticket };
}

export function executeAtoEmergencyFreeze({ accountId, actor, reason }) {
  if (!reason || !reason.trim()) {
    return { success: false, error: 'Причина негайного заморожування обов’язкова' };
  }

  const ticket = mockTickets.find(t => t.accountId === accountId);
  const now = new Date().toISOString();
  const incidentCode = `ATO-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  if (ticket) {
    ticket.emergencyFrozen = true;
    ticket.incidentCode = incidentCode;
    ticket.status = 'EMERGENCY_FROZEN';
  }

  mockAuditLogs.unshift({
    id: `log-rec-${Date.now()}`,
    timestamp: now,
    action: 'ATO_EMERGENCY_FREEZE',
    targetAccountId: accountId,
    targetUsername: ticket?.username || accountId,
    actor: actor.username || actor.id,
    actorRole: actor.role,
    reason: reason.trim(),
    details: `Код інциденту: ${incidentCode}. Усі сесії інвалідовано. Потрібна OOB-верифікація.`,
  });

  return { success: true, incidentCode, accountId };
}

export function initiateIrreversibleAction({
  accountId,
  username,
  actionType,
  actor,
  reason,
  confirmationInput,
  expectedConfirmation,
  coolingOffHours = 24,
}) {
  if (!reason || !reason.trim()) {
    return { success: false, error: 'Вкажіть обов’язкову причину для незворотної дії' };
  }

  // Double confirmation check
  if (!confirmationInput || confirmationInput.trim() !== expectedConfirmation.trim()) {
    return {
      success: false,
      error: `Помилка подвійного підтвердження: введено "${confirmationInput || ''}", очікувалось "${expectedConfirmation}"`,
    };
  }

  const now = Date.now();
  const expiresAt = new Date(now + coolingOffHours * 3600 * 1000).toISOString();

  const newAction = {
    id: `cool-act-${Date.now().toString(36)}`,
    accountId,
    username,
    actionType,
    status: COOLING_OFF_STATUS.PENDING_COOLING_OFF,
    initiatedBy: actor.username || actor.id,
    reason: reason.trim(),
    initiatedAt: new Date(now).toISOString(),
    expiresAt,
    coolingOffHours,
    doubleConfirmationPhrase: expectedConfirmation,
  };

  mockCoolingOffActions.unshift(newAction);

  mockAuditLogs.unshift({
    id: `log-rec-${Date.now()}`,
    timestamp: newAction.initiatedAt,
    action: 'COOLING_OFF_INITIATED',
    targetAccountId: accountId,
    targetUsername: username,
    actor: actor.username || actor.id,
    actorRole: actor.role,
    reason: reason.trim(),
    details: `Запущено період охолодження (${coolingOffHours} год) для ${actionType}. Очікує завершення або скасування.`,
  });

  return { success: true, action: newAction };
}

export function cancelCoolingOffAction({ actionId, actor, reason }) {
  const action = mockCoolingOffActions.find(a => a.id === actionId);
  if (!action) {
    return { success: false, error: 'Дію не знайдено' };
  }

  if (action.status !== COOLING_OFF_STATUS.PENDING_COOLING_OFF) {
    return { success: false, error: `Дія вже в статусі ${action.status}` };
  }

  const now = new Date().toISOString();
  action.status = COOLING_OFF_STATUS.CANCELLED;
  action.cancelledAt = now;
  action.cancelReason = reason || 'Скасовано за запитом користувача або адміністратора';

  mockAuditLogs.unshift({
    id: `log-rec-${Date.now()}`,
    timestamp: now,
    action: 'COOLING_OFF_CANCELLED',
    targetAccountId: action.accountId,
    targetUsername: action.username,
    actor: actor.username || actor.id,
    actorRole: actor.role,
    reason: action.cancelReason,
    details: `Незворотну операцію успішно відхилено протягом періоду охолодження.`,
  });

  return { success: true, action };
}

export function verifyPostActionResolution({ ticketId, actor, verificationNotes }) {
  const ticket = mockTickets.find(t => t.id === ticketId);
  if (!ticket) {
    return { success: false, error: 'Квиток не знайдено' };
  }

  ticket.status = 'RESOLVED';
  ticket.oobVerified = true;
  ticket.resolvedAt = new Date().toISOString();
  ticket.verificationNotes = verificationNotes || 'Особу верифіковано через OOB канал';

  mockAuditLogs.unshift({
    id: `log-rec-${Date.now()}`,
    timestamp: ticket.resolvedAt,
    action: 'RECOVERY_RESOLVED_VERIFIED',
    targetAccountId: ticket.accountId,
    targetUsername: ticket.username,
    actor: actor.username || actor.id,
    actorRole: actor.role,
    reason: ticket.verificationNotes,
    details: 'Інцидент успішно закрито після підтвердження особи та перевірки безпеки.',
  });

  return { success: true, ticket };
}

export function resetMockData() {
  mockTickets = [];
  mockCoolingOffActions = [];
  mockAuditLogs = [];
}
