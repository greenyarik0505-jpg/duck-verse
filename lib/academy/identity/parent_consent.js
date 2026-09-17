import crypto from 'crypto';

export const ACTIVATION_STATES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
};

export const AGE_THRESHOLD = 13;
export const CURRENT_POLICY_VERSION = 'v1.2-2026-child-safety';

export const FEATURE_SCOPES = [
  {
    id: 'curriculum_access',
    name: 'Базовий навчальний план',
    description: 'Доступ до навчальних матеріалів, уроків та тестів',
    isRestricted: false,
    category: 'education',
  },
  {
    id: 'offline_practice',
    name: 'Офлайн та соло-практика',
    description: 'Практичні вправи та локальні інтерактивні симуляції',
    isRestricted: false,
    category: 'education',
  },
  {
    id: 'social_chat',
    name: 'Командний чат та обговорення',
    description: 'Спілкування з однолітками в захищених академічних кімнатах',
    isRestricted: true,
    category: 'social',
  },
  {
    id: 'public_showcase',
    name: 'Публічна вітрина проектів',
    description: 'Демонстрація випускних робіт у публічному каталозі Академії',
    isRestricted: true,
    category: 'social',
  },
  {
    id: 'cohort_team_work',
    name: 'Групові проекти та когорти',
    description: 'Спільна розробка проектів у складі навчальної команди',
    isRestricted: true,
    category: 'collaboration',
  },
  {
    id: 'ai_tutor_generative',
    name: 'Генеративний ШІ-тьютор',
    description: 'Персоналізовані підказки та діалог з навчальним асистентом',
    isRestricted: true,
    category: 'ai',
  },
  {
    id: 'public_leaderboard',
    name: 'Відображення у лідерборді',
    description: 'Участь у відкритих академічних рейтингах успішності',
    isRestricted: true,
    category: 'social',
  },
];

export function hashConsentToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function maskEmail(email) {
  if (!email || !email.includes('@')) return '***@***.***';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0] || '*'}***@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

export function determineAgeCategory(age) {
  const numericAge = Number(age);
  if (numericAge < AGE_THRESHOLD) {
    return {
      category: 'child_under_13',
      requiresParentConsent: true,
      legalStandard: 'COPPA / GDPR-K (Підлягає обов’язковій згоді батьків)',
    };
  }
  return {
    category: 'minor_or_adult',
    requiresParentConsent: false,
    legalStandard: 'Standard Digital Consent (Пряма реєстрація)',
  };
}

let mockAccounts = [
  {
    id: 'acc-child-001',
    childUsername: 'artem_coder',
    age: 10,
    parentEmailMasked: 'o***a@example.com',
    status: ACTIVATION_STATES.PENDING,
    requiresParentConsent: true,
    tokenHash: hashConsentToken('CONSENT-TOKEN-001'),
    tokenRawForDemo: 'CONSENT-TOKEN-001',
    expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    policyVersion: CURRENT_POLICY_VERSION,
    consentRecord: null,
    allowedScopes: ['curriculum_access', 'offline_practice'],
    createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
  },
  {
    id: 'acc-child-002',
    childUsername: 'sofia_dev',
    age: 11,
    parentEmailMasked: 'm***k@example.com',
    status: ACTIVATION_STATES.APPROVED,
    requiresParentConsent: true,
    tokenHash: hashConsentToken('CONSENT-TOKEN-002'),
    tokenRawForDemo: 'CONSENT-TOKEN-002',
    expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    policyVersion: CURRENT_POLICY_VERSION,
    consentRecord: {
      parentName: 'Марія К.',
      approvedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      policyVersion: CURRENT_POLICY_VERSION,
      scopesGranted: [
        'curriculum_access',
        'offline_practice',
        'cohort_team_work',
        'ai_tutor_generative',
      ],
      ipHash: hashConsentToken('192.168.1.50'),
    },
    allowedScopes: [
      'curriculum_access',
      'offline_practice',
      'cohort_team_work',
      'ai_tutor_generative',
    ],
    createdAt: new Date(Date.now() - 86400 * 1000).toISOString(),
  },
  {
    id: 'acc-child-003',
    childUsername: 'maks_pro',
    age: 12,
    parentEmailMasked: 't***s@example.com',
    status: ACTIVATION_STATES.EXPIRED,
    requiresParentConsent: true,
    tokenHash: hashConsentToken('CONSENT-TOKEN-003'),
    tokenRawForDemo: 'CONSENT-TOKEN-003',
    expiresAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), // expired
    policyVersion: 'v1.1-legacy',
    consentRecord: null,
    allowedScopes: ['curriculum_access', 'offline_practice'],
    createdAt: new Date(Date.now() - 5 * 86400 * 1000).toISOString(),
  },
  {
    id: 'acc-teen-004',
    childUsername: 'dmytro_15',
    age: 15,
    parentEmailMasked: null,
    status: ACTIVATION_STATES.APPROVED,
    requiresParentConsent: false,
    tokenHash: null,
    tokenRawForDemo: null,
    expiresAt: null,
    policyVersion: CURRENT_POLICY_VERSION,
    consentRecord: {
      parentName: 'Self (Age 15+)',
      approvedAt: new Date(Date.now() - 10 * 86400 * 1000).toISOString(),
      policyVersion: CURRENT_POLICY_VERSION,
      scopesGranted: FEATURE_SCOPES.map(s => s.id),
    },
    allowedScopes: FEATURE_SCOPES.map(s => s.id),
    createdAt: new Date(Date.now() - 10 * 86400 * 1000).toISOString(),
  },
];

let auditLogs = [
  {
    id: 'log-001',
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    accountId: 'acc-child-002',
    action: 'CONSENT_GRANTED',
    details: 'Батьківська згода надана для 4 скоупів за політикою v1.2-2026-child-safety',
    actor: 'Марія К. (Parent)',
  },
  {
    id: 'log-002',
    timestamp: new Date(Date.now() - 3600 * 1000).toISOString(),
    accountId: 'acc-child-001',
    action: 'INVITATION_ISSUED',
    details: 'Створено запит на згоду батьків, токен надіслано на o***a@example.com',
    actor: 'System / Child Registration',
  },
];

export function getAccounts() {
  // refresh expired state
  const now = Date.now();
  mockAccounts = mockAccounts.map(acc => {
    if (
      acc.status === ACTIVATION_STATES.PENDING &&
      acc.expiresAt &&
      new Date(acc.expiresAt).getTime() < now
    ) {
      return { ...acc, status: ACTIVATION_STATES.EXPIRED };
    }
    return acc;
  });
  return [...mockAccounts];
}

export function registerAccount({ childUsername, age, parentEmail, rawToken = null }) {
  const numericAge = Number(age);
  const ageInfo = determineAgeCategory(numericAge);
  const accountId = `acc-${Date.now().toString(36)}`;
  const now = new Date().toISOString();

  if (!ageInfo.requiresParentConsent) {
    const allScopes = FEATURE_SCOPES.map(s => s.id);
    const newAccount = {
      id: accountId,
      childUsername,
      age: numericAge,
      parentEmailMasked: null,
      status: ACTIVATION_STATES.APPROVED,
      requiresParentConsent: false,
      tokenHash: null,
      tokenRawForDemo: null,
      expiresAt: null,
      policyVersion: CURRENT_POLICY_VERSION,
      consentRecord: {
        parentName: 'Self (Age 13+)',
        approvedAt: now,
        policyVersion: CURRENT_POLICY_VERSION,
        scopesGranted: allScopes,
      },
      allowedScopes: allScopes,
      createdAt: now,
    };
    mockAccounts.unshift(newAccount);
    auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: now,
      accountId,
      action: 'DIRECT_ACTIVATION',
      details: `Акаунт активовано безпосередньо (вік: ${numericAge})`,
      actor: childUsername,
    });
    return { account: newAccount, rawToken: null };
  }

  const generatedToken = rawToken || `TOKEN-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const tokenHash = hashConsentToken(generatedToken);
  const expiresAt = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
  const maskedParentEmail = maskEmail(parentEmail);

  const baselineScopes = FEATURE_SCOPES.filter(s => !s.isRestricted).map(s => s.id);

  const newAccount = {
    id: accountId,
    childUsername,
    age: numericAge,
    parentEmailMasked: maskedParentEmail,
    status: ACTIVATION_STATES.PENDING,
    requiresParentConsent: true,
    tokenHash,
    tokenRawForDemo: generatedToken,
    expiresAt,
    policyVersion: CURRENT_POLICY_VERSION,
    consentRecord: null,
    allowedScopes: baselineScopes,
    createdAt: now,
  };

  mockAccounts.unshift(newAccount);
  auditLogs.unshift({
    id: `log-${Date.now()}`,
    timestamp: now,
    accountId,
    action: 'INVITATION_ISSUED',
    details: `Створено запит на згоду для ${childUsername}, токен надіслано на ${maskedParentEmail}`,
    actor: 'System / Child Registration',
  });

  return { account: newAccount, rawToken: generatedToken };
}

export function approveParentConsent({ accountId, token, scopesGranted, parentName = 'Parent/Guardian' }) {
  const account = mockAccounts.find(a => a.id === accountId);
  if (!account) {
    return { success: false, error: 'Акаунт не знайдено' };
  }

  if (account.status === ACTIVATION_STATES.EXPIRED || (account.expiresAt && new Date(account.expiresAt).getTime() < Date.now())) {
    account.status = ACTIVATION_STATES.EXPIRED;
    return { success: false, error: 'Термін дії токена згоди вичерпано (Expired). Потрібно запросити новий.' };
  }

  if (token) {
    const inputHash = hashConsentToken(token.trim());
    if (inputHash !== account.tokenHash) {
      return { success: false, error: 'Невірний токен згоди' };
    }
  }

  const baselineScopes = FEATURE_SCOPES.filter(s => !s.isRestricted).map(s => s.id);
  const finalScopes = Array.from(new Set([...baselineScopes, ...(scopesGranted || [])]));
  const now = new Date().toISOString();

  account.status = ACTIVATION_STATES.APPROVED;
  account.policyVersion = CURRENT_POLICY_VERSION;
  account.consentRecord = {
    parentName,
    approvedAt: now,
    policyVersion: CURRENT_POLICY_VERSION,
    scopesGranted: finalScopes,
  };
  account.allowedScopes = finalScopes;

  auditLogs.unshift({
    id: `log-${Date.now()}`,
    timestamp: now,
    accountId: account.id,
    action: 'CONSENT_GRANTED',
    details: `Батьківська згода надана (${parentName}) для ${finalScopes.length} скоупів за версією ${CURRENT_POLICY_VERSION}`,
    actor: parentName,
  });

  return { success: true, account };
}

export function rejectParentConsent({ accountId, reason = 'Відхилено батьками/опікуном' }) {
  const account = mockAccounts.find(a => a.id === accountId);
  if (!account) {
    return { success: false, error: 'Акаунт не знайдено' };
  }

  const baselineScopes = FEATURE_SCOPES.filter(s => !s.isRestricted).map(s => s.id);
  const now = new Date().toISOString();

  account.status = ACTIVATION_STATES.REJECTED;
  account.consentRecord = {
    rejectedAt: now,
    reason,
  };
  account.allowedScopes = baselineScopes;

  auditLogs.unshift({
    id: `log-${Date.now()}`,
    timestamp: now,
    accountId: account.id,
    action: 'CONSENT_REJECTED',
    details: `Згоду відхилено. Причина: ${reason}`,
    actor: 'Parent/Guardian',
  });

  return { success: true, account };
}

export function revokeParentConsent({ accountId, reason = 'Відкликано з ініціативи батьків' }) {
  const account = mockAccounts.find(a => a.id === accountId);
  if (!account) {
    return { success: false, error: 'Акаунт не знайдено' };
  }

  const baselineScopes = FEATURE_SCOPES.filter(s => !s.isRestricted).map(s => s.id);
  const now = new Date().toISOString();

  account.status = ACTIVATION_STATES.REJECTED;
  account.consentRecord = {
    revokedAt: now,
    reason,
  };
  account.allowedScopes = baselineScopes;

  auditLogs.unshift({
    id: `log-${Date.now()}`,
    timestamp: now,
    accountId: account.id,
    action: 'CONSENT_REVOKED',
    details: `Згоду скасовано. Усі обмежені функції заблоковано. Причина: ${reason}`,
    actor: 'Parent/Guardian',
  });

  return { success: true, account };
}

export function checkFeatureAccess(account, featureKey) {
  if (!account) {
    return { allowed: false, reason: 'Акаунт не знайдено' };
  }

  const feature = FEATURE_SCOPES.find(f => f.id === featureKey);
  if (!feature) {
    return { allowed: false, reason: 'Невідома функція' };
  }

  if (!feature.isRestricted) {
    return { allowed: true, reason: 'Базова безпечна навчальна функція' };
  }

  // If age >= 13, user has direct access
  if (account.age >= AGE_THRESHOLD) {
    return { allowed: true, reason: 'Вік 13+ (Direct User Consent)' };
  }

  // If age < 13, must be in APPROVED state and feature scope must be in allowedScopes
  if (account.status !== ACTIVATION_STATES.APPROVED) {
    return {
      allowed: false,
      reason: `Потрібна згода батьків. Поточний статус акаунта: ${account.status}`,
    };
  }

  if (!account.allowedScopes || !account.allowedScopes.includes(featureKey)) {
    return {
      allowed: false,
      reason: 'Батьки не надали дозвіл на цю конкретну категорію',
    };
  }

  return { allowed: true, reason: `Дозволено згодою батьків (${account.policyVersion})` };
}

export function getAuditLog() {
  return [...auditLogs];
}

export function resetMockData() {
  // for tests
  mockAccounts = [];
  auditLogs = [];
}
