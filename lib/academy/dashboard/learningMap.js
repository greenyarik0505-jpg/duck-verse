/**
 * Duck Academy — Learning Map & Level Progression Engine (SCRUM-51)
 * 
 * Production model for learner dashboard:
 * - 4 Mastery Levels: Beginner, Junior, Middle, Senior
 * - 6 Core Skills: Git, UI, API, Testing, Security, Architecture
 * - Single recommended next task determination (no chaotic dumping)
 * - Deterministic, non-fabricated progress calculation from completed lessons
 * - Privacy-safe: zero cross-student data leakage
 */

export const MASTERY_LEVELS = Object.freeze({
  BEGINNER: {
    id: 'beginner',
    title: 'Beginner (Курсант)',
    range: ['L0', 'L1'],
    badge: '🌱',
    description: 'Стартові концепції веб-розробки, основи Git, розуміння архітектури Game Hub та запуск першого коду.',
    minRequiredLessons: 0
  },
  JUNIOR: {
    id: 'junior',
    title: 'Junior (Інженер-розробник)',
    range: ['L2', 'L3', 'L4'],
    badge: '⚡',
    description: 'Тестування з навмисними помилками, Vibe-coding prompt lab, створення портфоліо та отримання сертифіката.',
    minRequiredLessons: 2
  },
  MIDDLE: {
    id: 'middle',
    title: 'Middle (Системний інженер)',
    range: ['L5', 'L6', 'L7'],
    badge: '🛡️',
    description: 'System design та ADR, перевірка безпеки RBAC, аудит приватності COPPA та SLO моніторинг стабільності.',
    minRequiredLessons: 5
  },
  SENIOR: {
    id: 'senior',
    title: 'Senior (Архітектор платформи)',
    range: ['L8', 'L9'],
    badge: '👑',
    description: 'Плагінна архітектура, безпечні міграції даних, Feature Flags, Chaos Engineering та Engineering Governance.',
    minRequiredLessons: 8
  }
});

export const SKILL_TAXONOMY = Object.freeze({
  GIT: {
    id: 'git',
    name: 'Git & Workflows',
    icon: '🐙',
    description: 'Робота з гілками, Pull Requests, конфліктами та лінійним версіонуванням.'
  },
  UI: {
    id: 'ui',
    name: 'UI & Canvas 2D',
    icon: '🎨',
    description: 'Next.js 15 App Router, React 19, Tailwind CSS, 60 FPS HTML5 Canvas.'
  },
  API: {
    id: 'api',
    name: 'API & Data Contracts',
    icon: '⚡',
    description: "Серверні роути Next.js, валідація схем, пагінація та анти-аб'юз захист."
  },
  TESTING: {
    id: 'testing',
    name: 'Testing & QA',
    icon: '🧪',
    description: 'Автоматизовані тести Node.js, contract testing, assertions, регресійний контроль.'
  },
  SECURITY: {
    id: 'security',
    name: 'Security & Privacy',
    icon: '🔒',
    description: 'Захист персональних даних (Zero PII, COPPA), RBAC, HMAC-SHA256 токени.'
  },
  ARCHITECTURE: {
    id: 'architecture',
    name: 'System Architecture',
    icon: '🏛️',
    description: 'Domain boundaries, ADRs, DAG-залежності, Feature Flags, SLO дашборди.'
  }
});

export const LESSON_CATALOG = Object.freeze([
  {
    id: 'lesson-fe-l0-arch',
    level: 'L0',
    tier: 'beginner',
    title: 'Огляд архітектури хабу та середовища розробки',
    jiraKey: 'SCRUM-56',
    storyPoints: 3,
    skills: { architecture: 40, ui: 30, git: 30 },
    prerequisites: []
  },
  {
    id: 'lesson-fe-l1-auth',
    level: 'L1',
    tier: 'beginner',
    title: 'Аутентифікація, сесії та ролі користувачів',
    jiraKey: 'SCRUM-54',
    storyPoints: 5,
    skills: { security: 50, api: 30, ui: 20 },
    prerequisites: ['lesson-fe-l0-arch']
  },
  {
    id: 'lesson-fe-l2-testing',
    level: 'L2',
    tier: 'junior',
    title: 'Модульне тестування та перевірка контрактів',
    jiraKey: 'SCRUM-44',
    storyPoints: 5,
    skills: { testing: 60, architecture: 20, git: 20 },
    prerequisites: ['lesson-fe-l1-auth']
  },
  {
    id: 'lesson-fe-l3-prompts',
    level: 'L3',
    tier: 'junior',
    title: 'Vibe-coding: Лабораторія ШІ-промптів та інженерії',
    jiraKey: 'SCRUM-45',
    storyPoints: 5,
    skills: { testing: 30, ui: 30, architecture: 40 },
    prerequisites: ['lesson-fe-l2-testing']
  },
  {
    id: 'lesson-fe-l4-portfolio',
    level: 'L4',
    tier: 'junior',
    title: 'Портфоліо та криптографічний сертифікат навичок',
    jiraKey: 'SCRUM-47',
    storyPoints: 8,
    skills: { security: 40, architecture: 30, git: 30 },
    prerequisites: ['lesson-fe-l3-prompts']
  },
  {
    id: 'lesson-fe-l5-sysdesign',
    level: 'L5',
    tier: 'middle',
    title: 'System Design: Доменні межі та Architecture Decision Records',
    jiraKey: 'SCRUM-66',
    storyPoints: 8,
    skills: { architecture: 60, testing: 20, security: 20 },
    prerequisites: ['lesson-fe-l4-portfolio']
  },
  {
    id: 'lesson-fe-l6-privacy',
    level: 'L6',
    tier: 'middle',
    title: 'Приватність, RBAC-матриця та аудит COPPA',
    jiraKey: 'SCRUM-71',
    storyPoints: 8,
    skills: { security: 70, api: 20, architecture: 10 },
    prerequisites: ['lesson-fe-l5-sysdesign']
  },
  {
    id: 'lesson-fe-l7-observability',
    level: 'L7',
    tier: 'middle',
    title: 'Спостережуваність: SLI/SLO метрики та Error Budgets',
    jiraKey: 'SCRUM-72',
    storyPoints: 8,
    skills: { architecture: 40, testing: 40, api: 20 },
    prerequisites: ['lesson-fe-l6-privacy']
  },
  {
    id: 'lesson-fe-l8-plugins',
    level: 'L8',
    tier: 'senior',
    title: 'Архітектура плагінів, Feature Flags та міграції даних',
    jiraKey: 'SCRUM-73',
    storyPoints: 13,
    skills: { architecture: 50, security: 30, api: 20 },
    prerequisites: ['lesson-fe-l7-observability']
  },
  {
    id: 'lesson-fe-l9-governance',
    level: 'L9',
    tier: 'senior',
    title: 'Engineering Governance, Tech Radar та випускний реліз',
    jiraKey: 'SCRUM-70',
    storyPoints: 13,
    skills: { architecture: 40, git: 30, testing: 30 },
    prerequisites: ['lesson-fe-l8-plugins']
  }
]);

/**
 * Deterministically calculates student's learning map, level, skill scores,
 * and recommends the single optimal next task.
 */
export function calculateLearnerProgress(completedLessonIds = [], user = {}) {
  const completedSet = new Set(Array.isArray(completedLessonIds) ? completedLessonIds : []);
  const totalLessons = LESSON_CATALOG.length;
  const completedCount = LESSON_CATALOG.filter(l => completedSet.has(l.id)).length;
  const overallPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  // 1. Determine Current Mastery Tier
  let currentTier = MASTERY_LEVELS.BEGINNER;
  if (completedCount >= MASTERY_LEVELS.SENIOR.minRequiredLessons) {
    currentTier = MASTERY_LEVELS.SENIOR;
  } else if (completedCount >= MASTERY_LEVELS.MIDDLE.minRequiredLessons) {
    currentTier = MASTERY_LEVELS.MIDDLE;
  } else if (completedCount >= MASTERY_LEVELS.JUNIOR.minRequiredLessons) {
    currentTier = MASTERY_LEVELS.JUNIOR;
  }

  // 2. Calculate Skill Radar / Competencies
  const skillPoints = { git: 0, ui: 0, api: 0, testing: 0, security: 0, architecture: 0 };
  const maxPossiblePoints = { git: 0, ui: 0, api: 0, testing: 0, security: 0, architecture: 0 };

  LESSON_CATALOG.forEach(lesson => {
    Object.entries(lesson.skills).forEach(([skillKey, weight]) => {
      maxPossiblePoints[skillKey] = (maxPossiblePoints[skillKey] || 0) + weight;
      if (completedSet.has(lesson.id)) {
        skillPoints[skillKey] = (skillPoints[skillKey] || 0) + weight;
      }
    });
  });

  const skillMatrix = Object.entries(SKILL_TAXONOMY).map(([key, meta]) => {
    const earned = skillPoints[meta.id] || 0;
    const max = maxPossiblePoints[meta.id] || 100;
    const percent = max > 0 ? Math.min(100, Math.round((earned / max) * 100)) : 0;
    return {
      id: meta.id,
      name: meta.name,
      icon: meta.icon,
      description: meta.description,
      score: percent
    };
  });

  // 3. Determine Exactly ONE Recommended Next Task (DAG unblocked)
  let recommendedNextTask = null;
  for (const lesson of LESSON_CATALOG) {
    if (!completedSet.has(lesson.id)) {
      const isUnblocked = lesson.prerequisites.every(prereqId => completedSet.has(prereqId));
      if (isUnblocked) {
        recommendedNextTask = {
          id: lesson.id,
          title: lesson.title,
          level: lesson.level,
          tier: lesson.tier,
          jiraKey: lesson.jiraKey,
          storyPoints: lesson.storyPoints,
          actionableText: `Розпочати місію [${lesson.jiraKey}] (${lesson.level})`
        };
        break;
      }
    }
  }

  // If all completed
  if (!recommendedNextTask && completedCount === totalLessons) {
    recommendedNextTask = {
      id: 'capstone-complete',
      title: 'Всі обов’язкові місії пройдено! Отримай випускний сертифікат.',
      level: 'L9',
      tier: 'senior',
      jiraKey: 'SCRUM-58',
      storyPoints: 21,
      actionableText: 'Перейти до випускного Capstone'
    };
  }

  // 4. Empty State flag for brand new learners
  const isNewStudent = completedCount === 0;

  return {
    student: {
      username: user.username || 'Курсант Duck Verse',
      role: user.role || 'child'
    },
    tier: currentTier,
    progress: {
      completedCount,
      totalLessons,
      overallPercentage,
      isNewStudent
    },
    skills: skillMatrix,
    recommendedNextTask,
    catalog: LESSON_CATALOG.map(l => ({
      id: l.id,
      title: l.title,
      level: l.level,
      tier: l.tier,
      jiraKey: l.jiraKey,
      completed: completedSet.has(l.id),
      unlocked: l.prerequisites.every(p => completedSet.has(p))
    }))
  };
}
