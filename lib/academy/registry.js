/**
 * Duck Academy — Curriculum Registry (SCRUM-56)
 * Модульний реєстр курсів, уроків, граф передумов (prerequisites)
 * та обов'язкових свідоцтв про виконання (evidence).
 */

import { validateLessonContract, EVIDENCE_TYPES } from './types.js';

export const ACADEMY_TRACKS = [
  {
    id: 'track-frontend-gaming',
    title: 'Frontend & Game Engineering',
    tagline: 'Next.js 15, Canvas 2D, Web Audio API та інтерактивні ігрові хаби',
    icon: '⚡',
    levels: 'Level 0 – 4',
    lead: 'Yarik0505'
  },
  {
    id: 'track-devsecops',
    title: 'DevSecOps & Platform Governance',
    tagline: 'CI/CD, автоматизація GitHub/Jira, governance scorecard і безпека релізів',
    icon: '🛡️',
    levels: 'Level 0 – 9',
    lead: 'Yarik0505'
  },
  {
    id: 'track-ai-safety',
    title: 'AI Safety & System Design',
    tagline: 'Child-safe AI policy, RBAC, модерація контенту та архітектура систем',
    icon: '🤖',
    levels: 'Level 0 – 6',
    lead: 'Yarik0505'
  }
];

export const CURRICULUM_REGISTRY = [
  // ── Track 1: Frontend & Game Engineering ──────────────────────────────
  {
    id: 'lesson-fe-l0-arch',
    jiraKey: 'SCRUM-56',
    trackId: 'track-frontend-gaming',
    level: 0,
    title: 'Curriculum Registry & Feature Architecture',
    summary: 'Створення модульного фундаменту Duck Academy з версіонуванням та графом залежностей.',
    estimatedMinutes: 60,
    prerequisites: [],
    acceptanceCriteria: [
      'Уроки додаються через типізований контракт',
      'Невалідний реєстр або циклічні залежності блокують білд із детальним поясненням',
      'Граф передумов візуалізується в UI та пов’язаний із Jira',
      'Є ADR з обґрунтуванням trade-offs'
    ],
    requiredEvidence: [EVIDENCE_TYPES.GITHUB_PR, EVIDENCE_TYPES.JIRA_ISSUE],
    status: 'published'
  },
  {
    id: 'lesson-fe-l1-auth',
    jiraKey: 'SCRUM-54',
    trackId: 'track-frontend-gaming',
    level: 1,
    title: 'Auth Backend, Sessions & Role Hierarchy',
    summary: 'Реалізація автентифікації, захищених сесій та ролей (child, mentor, admin).',
    estimatedMinutes: 90,
    prerequisites: ['lesson-fe-l0-arch'],
    acceptanceCriteria: [
      'Protected routes перевіряють session і role на сервері',
      'Child не має доступу до чужих даних прогресу',
      'Parent-consent потік активується без надлишкового збору даних'
    ],
    requiredEvidence: [EVIDENCE_TYPES.GITHUB_PR, EVIDENCE_TYPES.TEST_RUN],
    status: 'published'
  },
  {
    id: 'lesson-fe-l2-jira-sync',
    jiraKey: 'SCRUM-53',
    trackId: 'track-frontend-gaming',
    level: 2,
    title: 'Jira & GitHub Progress Integration',
    summary: 'Двосторонній read-only зв’язок навчальних завдань із реальними Jira issues та GitHub PR.',
    estimatedMinutes: 75,
    prerequisites: ['lesson-fe-l1-auth'],
    acceptanceCriteria: [
      'Учень бачить статус пов’язаного Jira issue та GitHub PR',
      'Secrets та токени не зберігаються у клієнтському коді',
      'Передбачено надійний fallback у разі недоступності API'
    ],
    requiredEvidence: [EVIDENCE_TYPES.GITHUB_PR, EVIDENCE_TYPES.JIRA_ISSUE],
    status: 'published'
  },
  {
    id: 'lesson-fe-l3-mentor',
    jiraKey: 'SCRUM-57',
    trackId: 'track-frontend-gaming',
    level: 3,
    title: 'Mentor Dashboard & Code-Review Rubric',
    summary: 'Панель ментора для перевірки коду, шкала оцінювання якості та калібрування фідбеку.',
    estimatedMinutes: 90,
    prerequisites: ['lesson-fe-l2-jira-sync'],
    acceptanceCriteria: [
      'Ментор переглядає здані роботи учнів за стандартизованою рубрикою',
      'Учень отримує структурований зворотний зв’язок'
    ],
    requiredEvidence: [EVIDENCE_TYPES.MENTOR_REVIEW],
    status: 'published'
  },
  {
    id: 'lesson-fe-l4-capstone',
    jiraKey: 'SCRUM-58',
    trackId: 'track-frontend-gaming',
    level: 4,
    title: 'Capstone Workflow & Graduation Release',
    summary: 'Фінальний дипломний випуск: самостійний міні-проект та демонстрація в портфоліо.',
    estimatedMinutes: 120,
    prerequisites: ['lesson-fe-l3-mentor'],
    acceptanceCriteria: [
      'Випускний проект розгорнуто на продакшені з перевіреним CI пайплайном',
      'Пройдено фінальне рев’ю та отримано оцінку за рубрикою'
    ],
    requiredEvidence: [EVIDENCE_TYPES.GITHUB_PR, EVIDENCE_TYPES.TEST_RUN, EVIDENCE_TYPES.MENTOR_REVIEW],
    status: 'published'
  },

  // ── Track 2: DevSecOps & Platform Governance ──────────────────────────
  {
    id: 'lesson-devops-l0-baseline',
    jiraKey: 'SCRUM-142',
    trackId: 'track-devsecops',
    level: 0,
    title: 'Repository Provisioning & Permissions Automation',
    summary: 'Автоматизоване створення безпечного робочого репозиторію з branch protection та правилами Least Privilege.',
    estimatedMinutes: 60,
    prerequisites: ['lesson-fe-l0-arch'],
    acceptanceCriteria: [
      'Новий репозиторій автоматично отримує README, AGENTS.md, templates та CI',
      'Branch protection налаштовано без можливості прямого пушу в main'
    ],
    requiredEvidence: [EVIDENCE_TYPES.GITHUB_PR],
    status: 'published'
  },
  {
    id: 'lesson-devops-l5-sysdesign',
    jiraKey: 'SCRUM-66',
    trackId: 'track-devsecops',
    level: 5,
    title: 'System Design & Architecture Decision Records (ADR)',
    summary: 'Проектування розподілених систем, документування компромісів та захист архітектурних рішень.',
    estimatedMinutes: 90,
    prerequisites: ['lesson-devops-l0-baseline'],
    acceptanceCriteria: [
      'Сформовано ADR із розділами Context, Decision, Consequences та Migration Plan',
      'Архітектура пройшла колегіальне рев’ю'
    ],
    requiredEvidence: [EVIDENCE_TYPES.GITHUB_PR, EVIDENCE_TYPES.MENTOR_REVIEW],
    status: 'published'
  },
  {
    id: 'lesson-devops-l7-observability',
    jiraKey: 'SCRUM-72',
    trackId: 'track-devsecops',
    level: 7,
    title: 'Observability Architecture & SLO Dashboard',
    summary: 'Метрики надійності, журнал подій, моніторинг латентності та дашборди Service Level Objectives.',
    estimatedMinutes: 90,
    prerequisites: ['lesson-devops-l5-sysdesign'],
    acceptanceCriteria: [
      'Визначено ключові SLO/SLI метрики системи',
      'Налаштовано сповіщення про перевищення бюджету помилок (error budget)'
    ],
    requiredEvidence: [EVIDENCE_TYPES.TEST_RUN],
    status: 'published'
  },
  {
    id: 'lesson-devops-l8-plugins',
    jiraKey: 'SCRUM-73',
    trackId: 'track-devsecops',
    level: 8,
    title: 'Plugin Architecture, Feature Flags & Zero-Downtime Migrations',
    summary: 'Розширюваність платформи через плагіни, безпечне розгортання функцій під прапорцями та міграції.',
    estimatedMinutes: 100,
    prerequisites: ['lesson-devops-l7-observability'],
    acceptanceCriteria: [
      'Нова функція вмикається/вимикається динамічно без редеплою коду',
      'Міграції бази даних не блокують роботу сайту'
    ],
    requiredEvidence: [EVIDENCE_TYPES.GITHUB_PR, EVIDENCE_TYPES.TEST_RUN],
    status: 'published'
  },
  {
    id: 'lesson-devops-l9-governance',
    jiraKey: 'SCRUM-70',
    trackId: 'track-devsecops',
    level: 9,
    title: 'Engineering Governance & Release Scorecard',
    summary: 'Об’єктивна система оцінки відповідності інженерним стандартам (Scorecard) перед кожним релізом.',
    estimatedMinutes: 120,
    prerequisites: ['lesson-devops-l8-plugins'],
    acceptanceCriteria: [
      'Реліз перевіряється на наявність CI, тестів, security audit та рев’ю',
      'Результат scorecard фіксується у вигляді аудит-звіту'
    ],
    requiredEvidence: [EVIDENCE_TYPES.GITHUB_PR, EVIDENCE_TYPES.MENTOR_REVIEW],
    status: 'published'
  },

  // ── Track 3: AI Safety & System Design ────────────────────────────────
  {
    id: 'lesson-ai-l1-safety',
    jiraKey: 'SCRUM-110',
    trackId: 'track-ai-safety',
    level: 1,
    title: 'Child-Safe AI Policy & Model Controls',
    summary: 'Контроль відповідей ШІ, фільтрація токсичного контенту та дитяча безпека у взаємодії з моделями.',
    estimatedMinutes: 60,
    prerequisites: ['lesson-fe-l0-arch'],
    acceptanceCriteria: [
      'ШІ-інструкції відповідають суворим правилам безпеки для неповнолітніх',
      'Будь-яка спроба джейлбрейку або небезпечного запиту безпечно блокується'
    ],
    requiredEvidence: [EVIDENCE_TYPES.TEST_RUN],
    status: 'published'
  },
  {
    id: 'lesson-ai-l6-privacy-rbac',
    jiraKey: 'SCRUM-71',
    trackId: 'track-ai-safety',
    level: 6,
    title: 'Privacy, RBAC & Parent-Consent Audit',
    summary: 'Рольовий доступ до даних, аудит запитів, батьківський контроль та видалення облікових записів.',
    estimatedMinutes: 90,
    prerequisites: ['lesson-ai-l1-safety'],
    acceptanceCriteria: [
      'Учень має повний доступ до експорту та видалення власних даних (GDPR/COPPA compliance)',
      'Батьківська згода зберігається у формі криптографічного аудиторського запису'
    ],
    requiredEvidence: [EVIDENCE_TYPES.TEST_RUN, EVIDENCE_TYPES.MENTOR_REVIEW],
    status: 'published'
  }
];

/**
 * Валідує цілісність усього навчального реєстру.
 * Перевіряє унікальність ID, відсутність циклів та коректність передумов.
 * При виявленні помилок генерує чіткий виняток, який блокує збірку.
 */
export function validateCurriculumRegistry() {
  const lessonMap = new Map();
  const allErrors = [];

  // 1. Перевірка контрактів кожного уроку та унікальності ID
  for (const lesson of CURRICULUM_REGISTRY) {
    if (lessonMap.has(lesson.id)) {
      allErrors.push(`Дублікат ID уроку: '${lesson.id}' виявлено у реєстрі.`);
    }
    lessonMap.set(lesson.id, lesson);

    const contractErrors = validateLessonContract(lesson);
    if (contractErrors.length > 0) {
      allErrors.push(...contractErrors);
    }
  }

  // 2. Перевірка існування prerequisites
  for (const lesson of CURRICULUM_REGISTRY) {
    for (const prereqId of lesson.prerequisites) {
      if (!lessonMap.has(prereqId)) {
        allErrors.push(`Урок '${lesson.id}' посилається на неіснуючу передумову (prerequisite): '${prereqId}'`);
      }
    }
  }

  // 3. Перевірка на відсутність циклів (Cycle detection via DFS)
  const visited = new Map(); // 0 = unvisited, 1 = visiting (in stack), 2 = visited
  for (const id of lessonMap.keys()) {
    visited.set(id, 0);
  }

  function detectCycle(currentId, path) {
    visited.set(currentId, 1);
    const lesson = lessonMap.get(currentId);
    if (lesson && Array.isArray(lesson.prerequisites)) {
      for (const prereqId of lesson.prerequisites) {
        if (!lessonMap.has(prereqId)) continue;
        if (visited.get(prereqId) === 1) {
          allErrors.push(`Виявлено циклічну залежність у prerequisites: ${[...path, currentId, prereqId].join(' -> ')}`);
          return true;
        }
        if (visited.get(prereqId) === 0) {
          if (detectCycle(prereqId, [...path, currentId])) return true;
        }
      }
    }
    visited.set(currentId, 2);
    return false;
  }

  for (const id of lessonMap.keys()) {
    if (visited.get(id) === 0) {
      detectCycle(id, []);
    }
  }

  if (allErrors.length > 0) {
    const errorMsg = `[CRITICAL] Помилка валідації реєстру Duck Academy:\n- ` + allErrors.join('\n- ');
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  return true;
}

// Запускаємо валідацію реєстру на етапі імпорту, щоб невалідний реєстр гарантовано блокував збірку
validateCurriculumRegistry();

/**
 * Отримує всі уроки за вказаним треком
 */
export function getLessonsByTrack(trackId) {
  return CURRICULUM_REGISTRY.filter((l) => l.trackId === trackId).sort((a, b) => a.level - b.level);
}

/**
 * Перевіряє, чи розблоковано урок для учня з набором пройдених уроків
 */
export function isLessonUnlocked(lessonId, completedLessonIds = []) {
  const lesson = CURRICULUM_REGISTRY.find((l) => l.id === lessonId);
  if (!lesson) return false;
  if (!lesson.prerequisites || lesson.prerequisites.length === 0) return true;
  return lesson.prerequisites.every((reqId) => completedLessonIds.includes(reqId));
}
