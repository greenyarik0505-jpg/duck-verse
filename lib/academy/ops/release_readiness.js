/**
 * Duck Academy — Release Readiness Checklist & Change Approval Engine (SCRUM-118)
 *
 * Відповідає вимогам:
 * 1. 6 обов'язкових гейтів якості: PR review, CI pipeline, Security/Privacy, Accessibility/UX, Performance/SLO, Rollback plan.
 * 2. Ризик-орієнтоване погодження: High-Risk та Critical релізи вимагають явного схвалення ментором (Explicit Mentor Approval).
 * 3. Трасованість доказів: заборона релізу без Evidence Links (PR, Jira, Tests, Screenshot).
 * 4. Пострелізний реєстр: фіксація результатів деплою та follow-up завдань.
 */

import crypto from 'crypto';

export const RELEASE_QUALITY_GATES = [
  {
    id: 'pr_review',
    name: 'PR Review Gate',
    category: 'process',
    requirements: [
      'Мінімум 2 approving reviews від колег/ментора',
      'Усі коментарі в гілці обговорення закрито (Conversations resolved)',
      'Коміти відповідають формату Conventional Commits із ключем Jira',
    ],
  },
  {
    id: 'ci_pipeline',
    name: 'CI Pipeline Gate',
    category: 'quality',
    requirements: [
      'ESLint лінтинг завершився з 0 помилками (Clean Lint)',
      'Next.js збірка зібрала всі маршрути без помилок компіляції',
      '100% юніт-тестів проекту успішно пройдено (npm test)',
    ],
  },
  {
    id: 'security_privacy',
    name: 'Security & Privacy Gate',
    category: 'security',
    requirements: [
      'Відсутність відкритих секретів, API-ключів та паролів у репозиторії',
      'PII Shield перевірено на відповідність стандартам COPPA та GDPR-K',
      'Залежності перевірено npm audit (0 критичних вразливостей)',
    ],
  },
  {
    id: 'accessibility_ux',
    name: 'Accessibility & UX Gate',
    category: 'ux',
    requirements: [
      'Мобільна адаптивність перевірена для екранів від 360px',
      'Формулювання повідомлень зрозумілі для дітей та батьків',
      'Клавіатурна навігація та семантичні контрасти дотримані',
    ],
  },
  {
    id: 'performance_slo',
    name: 'Performance & SLO Gate',
    category: 'performance',
    requirements: [
      'Стабільні 60 FPS для Canvas 2D рушіїв',
      'P95 затримка API відповідей менша за 250 мс',
      'Відсутність витоків пам\'яті у хуках useEffect та WebSocket',
    ],
  },
  {
    id: 'rollback_plan',
    name: 'Rollback & Runbook Gate',
    category: 'reliability',
    requirements: [
      'Підготовлено план швидкого відкату (Revert PR runbook)',
      'Зворотна сумісність збережених даних та сесій гарантована',
      'Відсутність деструктивних міграцій, що блокують відкат',
    ],
  },
];

export const CHANGE_RISK_LEVELS = {
  LOW_RISK: {
    level: 'LOW_RISK',
    name: 'Низький ризик',
    description: 'Косметичні правки UI, опечатки, документація.',
    requiresMentorApproval: false,
  },
  MEDIUM_RISK: {
    level: 'MEDIUM_RISK',
    name: 'Помірний ризик',
    description: 'Нові уроки, доповнення каталогу ігор, нові юніт-тести.',
    requiresMentorApproval: false,
  },
  HIGH_RISK: {
    level: 'HIGH_RISK',
    name: 'Високий ризик',
    description: 'Зміни сесій, ролей, Scores API, взаємодія з Jira, AI Safety.',
    requiresMentorApproval: true,
  },
  CRITICAL: {
    level: 'CRITICAL',
    name: 'Критичний ризик',
    description: 'Архітектурні рефакторинги, міграція структур даних, платіжні операції.',
    requiresMentorApproval: true,
  },
};

// Поточний стан у пам'яті
let activeReleaseDraft = null;
let releaseHistory = [];

// Ініціалізація даних
function initSampleData() {
  if (!activeReleaseDraft) {
    activeReleaseDraft = {
      id: 'rel-draft-v1.4.0',
      versionTag: 'v1.4.0',
      targetSprint: 'Sprint 8',
      summary: 'Реліз модулів AI Safety Policy, Product Analytics та Public Status',
      riskLevel: 'HIGH_RISK',
      gatesChecked: {
        pr_review: true,
        ci_pipeline: true,
        security_privacy: true,
        accessibility_ux: true,
        performance_slo: true,
        rollback_plan: true,
      },
      evidenceLinks: {
        prUrl: 'https://github.com/greenyarik0505-jpg/duck-verse/pull/38',
        jiraKey: 'SCRUM-114',
        testEvidence: '82/82 tests passing (100% green)',
        screenshotArtifact: 'live_public_status_page.png',
      },
      mentorApproval: null, // { approvedBy, approvedByName, approvedAt, notes }
      status: 'PENDING_APPROVAL', // 'DRAFT' | 'PENDING_APPROVAL' | 'READY_FOR_DEPLOY' | 'DEPLOYED'
    };
  }

  if (releaseHistory.length === 0) {
    releaseHistory = [
      {
        id: 'rel-hist-v1.3.0',
        versionTag: 'v1.3.0',
        summary: 'Реліз модулів Mentor Office Hours (SCRUM-99) та Individual Learning Plan (SCRUM-100)',
        deployedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
        outcome: 'SUCCESSFUL_DEPLOY',
        riskLevel: 'HIGH_RISK',
        deployedBy: 'Yarik0505 (Team Lead)',
        mentorApproval: {
          approvedBy: 'mentor-yarik',
          approvedByName: 'Yarik0505',
          approvedAt: new Date(Date.now() - 25 * 3600000).toISOString(),
          notes: 'Всі 56 юніт-тестів та CDP перевірка пройдені без зауважень.',
        },
        evidenceLinks: {
          prUrl: 'https://github.com/greenyarik0505-jpg/duck-verse/pull/33',
          jiraKey: 'SCRUM-100',
          testEvidence: '56/56 passing',
          screenshotArtifact: 'live_individual_learning_plan.png',
        },
        followUpTasks: [
          'Моніторити навантаження на систему букінгу протягом перших 24 годин',
          'Оновити матрицю вибіркових курсів на батьківському порталі',
        ],
      },
    ];
  }
}
initSampleData();

// 1. Валідація готовності релізу (Release Readiness Gate Validator)
export function validateReleaseReadiness(draft = activeReleaseDraft) {
  if (!draft) {
    return { ready: false, blockedReason: 'NO_ACTIVE_DRAFT', missingRequirements: ['Відсутній релізний чернетковий запис.'] };
  }

  const missingGates = [];
  for (const gate of RELEASE_QUALITY_GATES) {
    if (!draft.gatesChecked || !draft.gatesChecked[gate.id]) {
      missingGates.push(gate.name);
    }
  }

  const missingEvidence = [];
  if (!draft.evidenceLinks?.prUrl) missingEvidence.push('Pull Request URL');
  if (!draft.evidenceLinks?.jiraKey) missingEvidence.push('Jira Issue Key');
  if (!draft.evidenceLinks?.testEvidence) missingEvidence.push('Test Execution Evidence');
  if (!draft.evidenceLinks?.screenshotArtifact) missingEvidence.push('Live Verification Screenshot');

  const riskConfig = CHANGE_RISK_LEVELS[draft.riskLevel] || CHANGE_RISK_LEVELS.MEDIUM_RISK;
  let mentorApprovalMissing = false;
  if (riskConfig.requiresMentorApproval && !draft.mentorApproval) {
    mentorApprovalMissing = true;
  }

  const allClear = missingGates.length === 0 && missingEvidence.length === 0 && !mentorApprovalMissing;

  return {
    ready: allClear,
    riskLevel: draft.riskLevel,
    requiresMentorApproval: riskConfig.requiresMentorApproval,
    hasMentorApproval: !!draft.mentorApproval,
    missingGates,
    missingEvidence,
    mentorApprovalMissing,
    blockedReason: !allClear
      ? missingGates.length > 0
        ? 'MISSING_QUALITY_GATES'
        : missingEvidence.length > 0
        ? 'MISSING_EVIDENCE_LINKS'
        : 'HIGH_RISK_REQUIRES_MENTOR_APPROVAL'
      : null,
  };
}

// 2. Схвалення релізу ментором (Explicit Mentor Sign-off for High-Risk)
export function approveHighRiskRelease(releaseId, mentorActor, notes = 'Схвалено для продакшн релізу') {
  if (!mentorActor || (mentorActor.role !== 'mentor' && mentorActor.role !== 'admin')) {
    throw new Error('Тільки ментор або адміністратор має право підписувати Change Approval для High-Risk змін!');
  }

  if (activeReleaseDraft?.id !== releaseId) {
    throw new Error(`Чернетку релізу "${releaseId}" не знайдено.`);
  }

  activeReleaseDraft.mentorApproval = {
    approvedBy: mentorActor.id,
    approvedByName: mentorActor.name || mentorActor.username || 'Mentor',
    approvedAt: new Date().toISOString(),
    notes,
  };

  const validation = validateReleaseReadiness(activeReleaseDraft);
  activeReleaseDraft.status = validation.ready ? 'READY_FOR_DEPLOY' : 'PENDING_APPROVAL';

  return { draft: activeReleaseDraft, validation };
}

// 3. Фіксація виконаного релізу в історії (Execute Release Record)
export function executeReleaseRecord(releaseId, outcome = 'SUCCESSFUL_DEPLOY', followUpTasks = [], deployer = 'Team Lead') {
  if (activeReleaseDraft?.id !== releaseId) {
    throw new Error(`Чернетку "${releaseId}" не знайдено.`);
  }

  const validation = validateReleaseReadiness(activeReleaseDraft);
  if (!validation.ready && outcome === 'SUCCESSFUL_DEPLOY') {
    throw new Error(`Неможливо зафіксувати успішний реліз: не пройдено всі гейти (${validation.blockedReason})!`);
  }

  const completedRecord = {
    id: activeReleaseDraft.id,
    versionTag: activeReleaseDraft.versionTag,
    summary: activeReleaseDraft.summary,
    deployedAt: new Date().toISOString(),
    outcome, // 'SUCCESSFUL_DEPLOY' | 'ROLLBACK_TRIGGERED'
    riskLevel: activeReleaseDraft.riskLevel,
    deployedBy: typeof deployer === 'object' ? deployer.name || deployer.username : deployer,
    mentorApproval: activeReleaseDraft.mentorApproval,
    evidenceLinks: activeReleaseDraft.evidenceLinks,
    followUpTasks: followUpTasks.length > 0 ? followUpTasks : ['Моніторинг стабільності метрик 24 години'],
  };

  releaseHistory.unshift(completedRecord);
  activeReleaseDraft = null;

  return completedRecord;
}

// 4. Оновлення чекбоксів гейтів у чернетці (для інтерактивного чекліста)
export function toggleReleaseGate(gateId, isChecked) {
  if (!activeReleaseDraft) {
    throw new Error('Немає активної чернетки релізу.');
  }

  if (!activeReleaseDraft.gatesChecked) {
    activeReleaseDraft.gatesChecked = {};
  }

  activeReleaseDraft.gatesChecked[gateId] = isChecked;
  const validation = validateReleaseReadiness(activeReleaseDraft);
  activeReleaseDraft.status = validation.ready ? 'READY_FOR_DEPLOY' : 'PENDING_APPROVAL';

  return { draft: activeReleaseDraft, validation };
}

// 5. Отримання повного знімка стану Release Readiness (для API та UI)
export function getReleaseReadinessSnapshot(currentUser = { role: 'mentor' }) {
  const validation = activeReleaseDraft ? validateReleaseReadiness(activeReleaseDraft) : null;

  return {
    qualityGates: RELEASE_QUALITY_GATES,
    riskLevels: Object.values(CHANGE_RISK_LEVELS),
    activeDraft: activeReleaseDraft,
    validation,
    releaseHistory,
    canSignApproval: currentUser?.role === 'mentor' || currentUser?.role === 'admin',
  };
}

// Хелпер для тестів
export function __resetReleaseEngineForTests() {
  activeReleaseDraft = null;
  releaseHistory = [];
  initSampleData();
}
