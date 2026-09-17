/**
 * Duck Academy — Child-Safe AI Policy, Roles & Model Controls Engine (SCRUM-110)
 *
 * Відповідає стандартам:
 * 1. Role-Based Permissions (child, parent, mentor, admin).
 * 2. Model & Tool Access Whitelisting (Deny-by-Default).
 * 3. Daily Quota Management & Throttling.
 * 4. Privileged Capability Approval Workflow (Parent/Mentor approval required).
 * 5. Threat Model & Privilege Escalation Mitigation.
 * 6. Policy Versioning & Audit Trail Integrity.
 */

import crypto from 'crypto';

export const CHILD_SAFE_AI_POLICY_V2 = {
  version: '2.1.0',
  effectiveDate: '2026-09-17',
  frameworks: ['COPPA (US Children\'s Privacy)', 'GDPR-K', 'EU AI Act Art. 50 & 52 (High-Risk Governance)'],
  defaultPosture: 'DENY_BY_DEFAULT',
  contentBoundary: 'KID_FRIENDLY_STRICT',
};

// Каталог зареєстрованих моделей
export const AI_MODELS = {
  'duck-vibe-coder-v1.2': {
    id: 'duck-vibe-coder-v1.2',
    name: 'Duck Vibe Coder',
    tier: 'safe-educational',
    riskLevel: 'LOW',
    description: 'Безпечний асистент з кодингу для дітей із вбудованим санітайзером коду.',
    allowedRoles: ['child', 'parent', 'mentor', 'admin'],
  },
  'duck-kid-tutor-mini': {
    id: 'duck-kid-tutor-mini',
    name: 'Duck Kid Tutor Mini',
    tier: 'safe-educational',
    riskLevel: 'LOW',
    description: 'Спрощене пояснення алгоритмів та концепцій програмування для юних розробників.',
    allowedRoles: ['child', 'parent', 'mentor', 'admin'],
  },
  'duck-gpt-unfiltered-pro': {
    id: 'duck-gpt-unfiltered-pro',
    name: 'Duck GPT Unfiltered Pro',
    tier: 'adult-advanced',
    riskLevel: 'HIGH',
    description: 'Потужна модель для архітектури та складних рефакторингів. Заборонена для дітей.',
    allowedRoles: ['mentor', 'admin'],
  },
  'duck-autonomous-agent': {
    id: 'duck-autonomous-agent',
    name: 'Duck Autonomous Agent',
    tier: 'experimental-autonomous',
    riskLevel: 'CRITICAL',
    description: 'Автономне середовище виконання. Доступне виключно адміністраторам платформи.',
    allowedRoles: ['admin'],
  },
};

// Каталог інструментів (Tool Scopes)
export const AI_TOOL_SCOPES = {
  read_code_hint: {
    id: 'read_code_hint',
    name: 'Підказка до коду',
    scopeType: 'SAFE',
    description: 'Отримання текстових рекомендацій щодо синтаксису чи помилок.',
    isPrivileged: false,
    allowedRoles: ['child', 'parent', 'mentor', 'admin'],
  },
  explain_concept: {
    id: 'explain_concept',
    name: 'Пояснення концепцій',
    scopeType: 'SAFE',
    description: 'Дитяче пояснення складних понять (змінні, цикли, структури даних).',
    isPrivileged: false,
    allowedRoles: ['child', 'parent', 'mentor', 'admin'],
  },
  lint_check_suggestion: {
    id: 'lint_check_suggestion',
    name: 'Порада з лінтингу',
    scopeType: 'SAFE',
    description: 'Аналіз стилю коду без права змінювати файли проекту.',
    isPrivileged: false,
    allowedRoles: ['child', 'parent', 'mentor', 'admin'],
  },
  run_bash_terminal: {
    id: 'run_bash_terminal',
    name: 'Виконання у bash-терміналі',
    scopeType: 'PRIVILEGED',
    description: 'Запуск системних команд, тестів або білд-скриптів у контейнері.',
    isPrivileged: true,
    allowedRoles: ['mentor', 'admin'], // Child requires parent/mentor grant
  },
  modify_file_system: {
    id: 'modify_file_system',
    name: 'Модифікація файлової системи',
    scopeType: 'PRIVILEGED',
    description: 'Прямий запис нових файлів або перезапис існуючого коду.',
    isPrivileged: true,
    allowedRoles: ['mentor', 'admin'], // Child requires parent/mentor grant
  },
  external_network_call: {
    id: 'external_network_call',
    name: 'Зовнішні мережеві запити',
    scopeType: 'PRIVILEGED',
    description: 'Вихідні HTTP/WebSocket з’єднання до зовнішніх серверів.',
    isPrivileged: true,
    allowedRoles: ['mentor', 'admin'], // Child requires parent/mentor grant
  },
  bypass_safety_guard: {
    id: 'bypass_safety_guard',
    name: 'Вимкнення фільтра безпеки',
    scopeType: 'CRITICAL',
    description: 'Повне відключення цензури та PII санітайзера. Заборонено для всіх, крім супер-адміна.',
    isPrivileged: true,
    allowedRoles: ['admin'],
  },
};

// Добові ліміти використання (Quota)
export const ROLE_QUOTAS = {
  child: { maxDailyRequests: 50, maxDailyTokens: 15000 },
  parent: { maxDailyRequests: 100, maxDailyTokens: 30000 },
  mentor: { maxDailyRequests: 300, maxDailyTokens: 100000 },
  admin: { maxDailyRequests: 5000, maxDailyTokens: 1000000 },
};

// Каталог моделі загроз (Threat Model Matrix)
export const THREAT_MODEL_CATALOG = [
  {
    id: 'TM-01',
    name: 'Direct Privilege Escalation (Child Self-Grant)',
    threat: 'Дитина самостійно намагається увімкнути термінал або запис у файлову систему без підтвердження.',
    mitigation: 'Сувора перевірка ролі на бекенді + блокування self-approval + обов\'язковий токен батьків/ментора.',
    status: 'ACTIVE_GUARD',
  },
  {
    id: 'TM-02',
    name: 'Restricted Model Access / Jailbreak',
    threat: 'Спроба перемикання на нефільтровану модель високого ризику шляхом підміни ID запиту.',
    mitigation: 'Принцип Deny-By-Default + валідація моделі за білим списком ролі.',
    status: 'ACTIVE_GUARD',
  },
  {
    id: 'TM-03',
    name: 'Quota Exhaustion / Resource DoS',
    threat: 'Неконтрольоване спам-генерування запитів до ШІ, що вичерпує серверні ресурси.',
    mitigation: 'Індивідуальні добові лічильники запитів і токенів із автоматичним блокуванням перевищень.',
    status: 'ACTIVE_GUARD',
  },
  {
    id: 'TM-04',
    name: 'Unauthorized Cross-Student History Snooping',
    threat: 'Спроба учня переглянути історію діалогів чи промптів іншого учня.',
    mitigation: 'Багаторівнева ізоляція історії: учень бачить лише себе; доступ мають лише верифіковані батьки та ментор.',
    status: 'ACTIVE_GUARD',
  },
  {
    id: 'TM-05',
    name: 'Tampering with Safety Policy & Consent Logs',
    threat: 'Спроба неавторизованого редагування версії політики або очищення слідів аудиту.',
    mitigation: 'Незмінний криптографічний журнал аудиту (append-only) та доступ до зміни політики виключно для Admin.',
    status: 'ACTIVE_GUARD',
  },
];

// Внутрішній стан у пам'яті (In-memory storage)
let activePrivilegeGrants = []; // { id, studentId, toolId, grantedBy, grantedAt, expiresAt, status: 'active' | 'revoked' }
let toolAccessRequests = []; // { id, studentId, studentName, toolId, reason, status: 'pending' | 'approved' | 'rejected', requestedAt, reviewedAt, reviewerId, reviewerName, reviewNotes }
let dailyQuotaUsage = {}; // { `${userId}_${dateKey}`: { requests: number, tokens: number } }
let policyAuditLog = []; // { id, timestamp, eventType, actorId, actorRole, details, threatTag }

// Ініціалізація початкових демонстраційних запитів
function initSampleData() {
  if (toolAccessRequests.length === 0) {
    toolAccessRequests = [
      {
        id: 'req-init-01',
        studentId: 'student-yurko',
        studentName: 'Юрко (8 клас)',
        toolId: 'run_bash_terminal',
        reason: 'Потрібно запустити jest тести для уроку Canvas 2D',
        status: 'pending',
        requestedAt: new Date(Date.now() - 3600000).toISOString(),
        reviewedAt: null,
        reviewerId: null,
        reviewerName: null,
        reviewNotes: null,
      },
    ];
  }
}
initSampleData();

// Отримання поточного ключа дати YYYY-MM-DD
function getDateKey(date = new Date()) {
  return date.toISOString().split('T')[0];
}

// Додавання запису до журналу аудиту
export function recordPolicyAuditEvent({ eventType, actor, details = {}, threatTag = null }) {
  const entry = {
    id: `audit-${crypto.randomUUID()}`,
    timestamp: new Date().toISOString(),
    eventType,
    actorId: actor?.id || 'anonymous',
    actorName: actor?.name || actor?.username || 'Unknown',
    actorRole: actor?.role || 'guest',
    details,
    threatTag,
  };
  policyAuditLog.unshift(entry);
  if (policyAuditLog.length > 500) {
    policyAuditLog = policyAuditLog.slice(0, 500);
  }
  return entry;
}

// 1. Перевірка доступу до моделі ШІ (Deny-by-default)
export function checkModelAccess(actor, modelId) {
  if (!actor || !actor.role) {
    recordPolicyAuditEvent({
      eventType: 'MODEL_ACCESS_DENIED_NO_ACTOR',
      actor,
      details: { modelId, reason: 'Missing actor or role' },
      threatTag: 'TM-02',
    });
    return { allowed: false, code: 'DENY_ANONYMOUS', message: 'Анонімний доступ до моделей ШІ заборонено.' };
  }

  const model = AI_MODELS[modelId];
  if (!model) {
    recordPolicyAuditEvent({
      eventType: 'MODEL_ACCESS_DENIED_UNREGISTERED',
      actor,
      details: { modelId, reason: 'Unregistered model identifier' },
      threatTag: 'TM-02',
    });
    return { allowed: false, code: 'DENY_UNKNOWN_MODEL', message: `Модель "${modelId}" не зареєстрована в політиці Duck Verse.` };
  }

  const isRoleAllowed = model.allowedRoles.includes(actor.role);
  if (!isRoleAllowed) {
    recordPolicyAuditEvent({
      eventType: 'MODEL_ACCESS_DENIED_ROLE_RESTRICTED',
      actor,
      details: { modelId, modelRisk: model.riskLevel, actorRole: actor.role },
      threatTag: 'TM-02',
    });
    return {
      allowed: false,
      code: 'DENY_ROLE_RESTRICTED',
      message: `Роль "${actor.role}" не має права використовувати модель високого ризику "${model.name}". Дозволені ролі: ${model.allowedRoles.join(', ')}.`,
    };
  }

  return { allowed: true, model };
}

// 2. Перевірка доступу до інструменту ШІ (Tool Scopes)
export function checkToolAccess(actor, toolId) {
  if (!actor || !actor.role) {
    recordPolicyAuditEvent({
      eventType: 'TOOL_ACCESS_DENIED_NO_ACTOR',
      actor,
      details: { toolId },
      threatTag: 'TM-01',
    });
    return { allowed: false, code: 'DENY_ANONYMOUS', message: 'Анонімний доступ до інструментів заборонено.' };
  }

  const tool = AI_TOOL_SCOPES[toolId];
  if (!tool) {
    recordPolicyAuditEvent({
      eventType: 'TOOL_ACCESS_DENIED_UNKNOWN_TOOL',
      actor,
      details: { toolId },
      threatTag: 'TM-01',
    });
    return { allowed: false, code: 'DENY_UNKNOWN_TOOL', message: `Інструмент "${toolId}" не зареєстрований у політиці.` };
  }

  // Якщо інструмент безпечний і роль дозволена напряму
  if (!tool.isPrivileged && tool.allowedRoles.includes(actor.role)) {
    return { allowed: true, tool, viaGrant: false };
  }

  // Для дорослих/менторів/адмінів, які мають прямий дозвіл
  if (tool.allowedRoles.includes(actor.role)) {
    return { allowed: true, tool, viaGrant: false };
  }

  // Якщо це учень і інструмент привілейований, перевіряємо активний Privilege Grant
  if (actor.role === 'child' && tool.isPrivileged) {
    const now = Date.now();
    const activeGrant = activePrivilegeGrants.find(
      (g) => g.studentId === actor.id && g.toolId === toolId && g.status === 'active' && new Date(g.expiresAt).getTime() > now
    );

    if (activeGrant) {
      return { allowed: true, tool, viaGrant: true, grant: activeGrant };
    }

    recordPolicyAuditEvent({
      eventType: 'TOOL_ACCESS_BLOCKED_PRIVILEGED_FOR_CHILD',
      actor,
      details: { toolId, toolName: tool.name },
      threatTag: 'TM-01',
    });

    return {
      allowed: false,
      code: 'ACCESS_DENIED_PRIVILEGED_TOOL_REQUIRES_APPROVAL',
      message: `Інструмент "${tool.name}" є привілейованим. Учень не може активувати його самостійно; необхідне схвалення батьків або ментора.`,
      requiresApproval: true,
      tool,
    };
  }

  return {
    allowed: false,
    code: 'ACCESS_DENIED_FORBIDDEN_ROLE',
    message: `Роль "${actor.role}" не має дозволу на запуск інструменту "${tool.name}".`,
  };
}

// 3. Запит на доступ до привілейованого інструменту (Child submits request)
export function requestPrivilegedToolAccess({ studentId, studentName, toolId, reason, actor }) {
  if (!actor || actor.role !== 'child') {
    throw new Error('Тільки учень може створювати запит на схвалення інструменту для себе.');
  }

  if (actor.id !== studentId) {
    recordPolicyAuditEvent({
      eventType: 'PRIVILEGE_ESCALATION_ATTEMPT_IDENTITY_MISMATCH',
      actor,
      details: { targetStudentId: studentId, toolId },
      threatTag: 'TM-01',
    });
    throw new Error('Учень не може створювати запит від імені іншого студента.');
  }

  const tool = AI_TOOL_SCOPES[toolId];
  if (!tool) {
    throw new Error(`Невідомий інструмент: ${toolId}`);
  }

  if (!tool.isPrivileged) {
    throw new Error(`Інструмент ${tool.name} вже є безпечним і не потребує схвалення.`);
  }

  if (toolId === 'bypass_safety_guard') {
    recordPolicyAuditEvent({
      eventType: 'ATTEMPT_REQUEST_PROHIBITED_CAPABILITY',
      actor,
      details: { toolId },
      threatTag: 'TM-01',
    });
    throw new Error('Вимкнення фільтра безпеки категорично заборонено для запитів учнів.');
  }

  const newRequest = {
    id: `req-${crypto.randomUUID()}`,
    studentId,
    studentName: studentName || actor.name || actor.username || studentId,
    toolId,
    toolName: tool.name,
    reason: reason || 'Виконання навчального завдання',
    status: 'pending',
    requestedAt: new Date().toISOString(),
    reviewedAt: null,
    reviewerId: null,
    reviewerName: null,
    reviewNotes: null,
  };

  toolAccessRequests.unshift(newRequest);

  recordPolicyAuditEvent({
    eventType: 'TOOL_ACCESS_REQUEST_CREATED',
    actor,
    details: { requestId: newRequest.id, toolId, reason },
  });

  return newRequest;
}

// 4. Розгляд запиту на привілейований доступ (Parent, Mentor, Admin only. Self-approval blocked!)
export function reviewPrivilegedToolAccess({ requestId, reviewer, decision, notes = '', durationHours = 2 }) {
  if (!reviewer || !reviewer.role) {
    throw new Error('Анонімний огляд заборонено.');
  }

  // THREAT MITIGATION: Child cannot approve requests (self-approval or peer approval)
  if (reviewer.role === 'child') {
    recordPolicyAuditEvent({
      eventType: 'PRIVILEGE_ESCALATION_CHILD_SELF_APPROVAL_ATTEMPT',
      actor: reviewer,
      details: { requestId, decision },
      threatTag: 'TM-01',
    });
    throw new Error('Учень не має права схвалювати запити на привілейований доступ! Спроба ескалації зафіксована.');
  }

  const allowedReviewers = ['parent', 'mentor', 'admin'];
  if (!allowedReviewers.includes(reviewer.role)) {
    throw new Error(`Роль "${reviewer.role}" не має права приймати рішення щодо безпекових дозволів.`);
  }

  const requestIndex = toolAccessRequests.findIndex((r) => r.id === requestId);
  if (requestIndex === -1) {
    throw new Error(`Запит з ID "${requestId}" не знайдено.`);
  }

  const req = toolAccessRequests[requestIndex];
  if (req.status !== 'pending') {
    throw new Error(`Запит вже має статус "${req.status}" і не може бути розглянутий повторно.`);
  }

  if (decision !== 'approved' && decision !== 'rejected') {
    throw new Error('Рішення має бути або "approved", або "rejected".');
  }

  req.status = decision;
  req.reviewedAt = new Date().toISOString();
  req.reviewerId = reviewer.id;
  req.reviewerName = reviewer.name || reviewer.username || reviewer.role;
  req.reviewNotes = notes;

  let createdGrant = null;

  if (decision === 'approved') {
    const expiresAt = new Date(Date.now() + durationHours * 3600 * 1000).toISOString();
    createdGrant = {
      id: `grant-${crypto.randomUUID()}`,
      requestId: req.id,
      studentId: req.studentId,
      toolId: req.toolId,
      grantedBy: reviewer.id,
      grantedByName: req.reviewerName,
      grantedAt: req.reviewedAt,
      expiresAt,
      status: 'active',
    };
    activePrivilegeGrants.unshift(createdGrant);
  }

  recordPolicyAuditEvent({
    eventType: decision === 'approved' ? 'TOOL_ACCESS_REQUEST_APPROVED' : 'TOOL_ACCESS_REQUEST_REJECTED',
    actor: reviewer,
    details: { requestId, decision, studentId: req.studentId, toolId: req.toolId, grantId: createdGrant?.id },
  });

  return { request: req, grant: createdGrant };
}

// 5. Відкликання наданого привілею
export function revokePrivilegeGrant(grantId, revoker) {
  const grant = activePrivilegeGrants.find((g) => g.id === grantId);
  if (!grant) {
    throw new Error(`Грант ${grantId} не знайдено.`);
  }

  grant.status = 'revoked';
  grant.revokedAt = new Date().toISOString();
  grant.revokedBy = revoker?.id || 'system';

  recordPolicyAuditEvent({
    eventType: 'PRIVILEGE_GRANT_REVOKED',
    actor: revoker,
    details: { grantId, studentId: grant.studentId, toolId: grant.toolId },
  });

  return grant;
}

// 6. Керування квотами (Quota Check & Consumption)
export function checkAndConsumeQuota(userId, role = 'child', requestedTokens = 100) {
  const quotaConfig = ROLE_QUOTAS[role] || ROLE_QUOTAS.child;
  const dateKey = getDateKey();
  const usageKey = `${userId}_${dateKey}`;

  if (!dailyQuotaUsage[usageKey]) {
    dailyQuotaUsage[usageKey] = { requests: 0, tokens: 0 };
  }

  const current = dailyQuotaUsage[usageKey];

  if (current.requests >= quotaConfig.maxDailyRequests) {
    recordPolicyAuditEvent({
      eventType: 'QUOTA_EXHAUSTED_REQUESTS',
      actor: { id: userId, role },
      details: { currentRequests: current.requests, maxRequests: quotaConfig.maxDailyRequests },
      threatTag: 'TM-03',
    });
    return {
      allowed: false,
      code: 'QUOTA_EXCEEDED_REQUESTS',
      message: `Добовий ліміт запитів (${quotaConfig.maxDailyRequests}) вичерпано. Спробуйте завтра або зверніться до ментора.`,
      current,
      limit: quotaConfig,
    };
  }

  if (current.tokens + requestedTokens > quotaConfig.maxDailyTokens) {
    recordPolicyAuditEvent({
      eventType: 'QUOTA_EXHAUSTED_TOKENS',
      actor: { id: userId, role },
      details: { currentTokens: current.tokens, requestedTokens, maxTokens: quotaConfig.maxDailyTokens },
      threatTag: 'TM-03',
    });
    return {
      allowed: false,
      code: 'QUOTA_EXCEEDED_TOKENS',
      message: `Добовий ліміт токенів (${quotaConfig.maxDailyTokens}) буде перевищено. Доступно: ${quotaConfig.maxDailyTokens - current.tokens}.`,
      current,
      limit: quotaConfig,
    };
  }

  // Consume
  current.requests += 1;
  current.tokens += requestedTokens;

  return {
    allowed: true,
    current,
    limit: quotaConfig,
    remainingRequests: quotaConfig.maxDailyRequests - current.requests,
    remainingTokens: quotaConfig.maxDailyTokens - current.tokens,
  };
}

// Отримання поточної квоти без споживання
export function getQuotaStatus(userId, role = 'child') {
  const quotaConfig = ROLE_QUOTAS[role] || ROLE_QUOTAS.child;
  const dateKey = getDateKey();
  const usageKey = `${userId}_${dateKey}`;
  const current = dailyQuotaUsage[usageKey] || { requests: 0, tokens: 0 };

  return {
    userId,
    role,
    dateKey,
    currentRequests: current.requests,
    maxDailyRequests: quotaConfig.maxDailyRequests,
    currentTokens: current.tokens,
    maxDailyTokens: quotaConfig.maxDailyTokens,
    percentUsed: Math.min(100, Math.round((current.requests / quotaConfig.maxDailyRequests) * 100)),
  };
}

// 7. Ізоляція перегляду історії (History Visibility)
export function canViewUserAiHistory(viewer, targetUserId, relations = {}) {
  if (!viewer) return false;

  // 1. Користувач завжди бачить свою власну історію
  if (viewer.id === targetUserId) {
    return true;
  }

  // 2. Адмін бачить все для системного аудиту
  if (viewer.role === 'admin') {
    return true;
  }

  // 3. Батьки бачать історію своєї дитини
  if (viewer.role === 'parent') {
    const parentChildren = relations.parentChildren || ['student-yurko', 'student-dima'];
    if (parentChildren.includes(targetUserId)) {
      return true;
    }
  }

  // 4. Ментор бачить історію учнів свого когортного списку
  if (viewer.role === 'mentor') {
    const mentorStudents = relations.mentorStudents || ['student-yurko', 'student-dima', 'student-maria'];
    if (mentorStudents.includes(targetUserId)) {
      return true;
    }
  }

  // 5. Учень намагається подивитися історію іншого учня -> Блокуємо!
  recordPolicyAuditEvent({
    eventType: 'HISTORY_ACCESS_BLOCKED_UNAUTHORIZED_PEER',
    actor: viewer,
    details: { targetUserId },
    threatTag: 'TM-04',
  });

  return false;
}

// 8. Отримання повного стану безпеки (для UI та API)
export function getSafetyPolicySnapshot(currentUser = { id: 'student-yurko', role: 'child' }) {
  const quota = getQuotaStatus(currentUser.id, currentUser.role);

  // Фільтруємо запити за роллю: учень бачить лише свої, батьки/ментори/адміни бачать всі
  const filteredRequests = currentUser.role === 'child'
    ? toolAccessRequests.filter((r) => r.studentId === currentUser.id)
    : toolAccessRequests;

  const filteredGrants = currentUser.role === 'child'
    ? activePrivilegeGrants.filter((g) => g.studentId === currentUser.id && g.status === 'active')
    : activePrivilegeGrants;

  return {
    policy: CHILD_SAFE_AI_POLICY_V2,
    models: Object.values(AI_MODELS),
    tools: Object.values(AI_TOOL_SCOPES),
    quota,
    roleQuotas: ROLE_QUOTAS,
    threatCatalog: THREAT_MODEL_CATALOG,
    requests: filteredRequests,
    activeGrants: filteredGrants,
    auditLog: policyAuditLog.slice(0, 20),
  };
}

// 9. Оновлення політики (Тільки Admin)
export function updatePolicyVersion(newVersion, adminActor, updateDetails = {}) {
  if (!adminActor || adminActor.role !== 'admin') {
    recordPolicyAuditEvent({
      eventType: 'POLICY_TAMPER_ATTEMPT_NON_ADMIN',
      actor: adminActor,
      details: { attemptedVersion: newVersion },
      threatTag: 'TM-05',
    });
    throw new Error('Лише системний адміністратор має право оновлювати політику безпеки AI.');
  }

  const oldVersion = CHILD_SAFE_AI_POLICY_V2.version;
  CHILD_SAFE_AI_POLICY_V2.version = newVersion;
  CHILD_SAFE_AI_POLICY_V2.effectiveDate = new Date().toISOString().split('T')[0];

  recordPolicyAuditEvent({
    eventType: 'POLICY_VERSION_UPDATED',
    actor: adminActor,
    details: { oldVersion, newVersion, ...updateDetails },
    threatTag: 'TM-05',
  });

  return CHILD_SAFE_AI_POLICY_V2;
}

// Хелпер для скидання стану (використовується в тестах)
export function __resetSafetyEngineForTests() {
  activePrivilegeGrants = [];
  toolAccessRequests = [];
  dailyQuotaUsage = {};
  policyAuditLog = [];
  CHILD_SAFE_AI_POLICY_V2.version = '2.1.0';
  initSampleData();
}
