/**
 * Duck Academy — Skill Analytics & Competency Matrix (SCRUM-82)
 *
 * Призначення:
 * 1. Компетентнісна модель з 7 інженерних напрямків: Git, UI, API, Testing, Security, Architecture, Teamwork.
 * 2. Оцінювання на основі реальних свідчень (evidence: PR, lessons, mentor reviews).
 * 3. Confidence & coverage замість фальшивої точності.
 * 4. Gap analysis та динамічні рекомендації наступного уроку.
 * 5. Data retention, privacy protection та безпечне видалення/експорт даних.
 */

import { CURRICULUM_REGISTRY } from '../registry.js';
import { canAccessResource, ACADEMY_ROLES } from '../auth/roles.js';

export const COMPETENCY_AREAS = {
  GIT: {
    id: 'git',
    name: 'Git & Version Control',
    icon: '🐙',
    desc: 'Робота з гілками, семантичні коміти SCRUM-XX, Pull Requests та рев\'ю коду',
    maxScore: 100,
    relevantLessons: ['lesson-fe-l0-arch', 'lesson-fe-l2-pr', 'lesson-fe-l4-capstone'],
  },
  UI: {
    id: 'ui',
    name: 'UI/UX & Canvas 2D',
    icon: '🎨',
    desc: 'Адаптивна верстка, анімація, Canvas рушії, доступність та продуктивність 60 FPS',
    maxScore: 100,
    relevantLessons: ['lesson-fe-l0-arch', 'lesson-fe-l1-canvas', 'lesson-fe-l4-capstone'],
  },
  API: {
    id: 'api',
    name: 'Serverless API & Data',
    icon: '⚡',
    desc: 'Next.js route handlers, валідація схем, обробка помилок та ідемпотентність',
    maxScore: 100,
    relevantLessons: ['lesson-fe-l1-canvas', 'lesson-fe-l2-pr', 'lesson-fe-l4-capstone'],
  },
  TESTING: {
    id: 'testing',
    name: 'Testing & Quality Assurance',
    icon: '🧪',
    desc: 'Модульні тести (Node test runner), smoke-тести, CDP headless верифікація',
    maxScore: 100,
    relevantLessons: ['lesson-fe-l0-arch', 'lesson-fe-l2-pr', 'lesson-fe-l3-rubric', 'lesson-fe-l4-capstone'],
  },
  SECURITY: {
    id: 'security',
    name: 'Security & Child Privacy',
    icon: '🛡️',
    desc: 'RBAC ролі, IDOR захист, санітизація, захист секретів та згода батьків',
    maxScore: 100,
    relevantLessons: ['lesson-fe-l2-pr', 'lesson-fe-l3-rubric', 'lesson-fe-l4-capstone'],
  },
  ARCHITECTURE: {
    id: 'architecture',
    name: 'System Design & Modularity',
    icon: '🏛️',
    desc: 'Clean architecture, фіксація рішень (ADR), слабке зв\'язування (decoupling)',
    maxScore: 100,
    relevantLessons: ['lesson-fe-l0-arch', 'lesson-fe-l3-rubric', 'lesson-fe-l4-capstone'],
  },
  TEAMWORK: {
    id: 'teamwork',
    name: 'Scrum Agility & Teamwork',
    icon: '🤝',
    desc: 'Дотримання Scrum-процесу, синхронізація Jira, взаємне рецензування PR',
    maxScore: 100,
    relevantLessons: ['lesson-fe-l2-pr', 'lesson-fe-l3-rubric', 'lesson-fe-l4-capstone'],
  },
};

// In-memory сховище аналітики навичок учнів (відокремлено від operational logs)
const studentAnalyticsDb = new Map();

/**
 * Оцінка рівня компетенції (Level L0..L4)
 */
export function determineLevel(score) {
  if (score >= 85) return { level: 'L4', title: 'Lead / Expert', color: '#10b981' };
  if (score >= 65) return { level: 'L3', title: 'Advanced', color: '#06b6d4' };
  if (score >= 45) return { level: 'L2', title: 'Competent', color: '#6366f1' };
  if (score >= 20) return { level: 'L1', title: 'Apprentice', color: '#f59e0b' };
  return { level: 'L0', title: 'Novice', color: '#94a3b8' };
}

/**
 * Розрахунок аналітики компетенцій на основі реальних свідчень
 *
 * @param {Object} params
 * @param {string[]} params.completedLessonIds Список ID завершених уроків
 * @param {Array} params.verifiedPrs Список верифікованих PR з прив'язкою до SCRUM-XX
 * @param {Array} params.mentorReviews Список перевірок ментора із балами за рубрикою
 * @returns {Object} Зведена матриця компетенцій
 */
export function calculateCompetencyMatrix({ completedLessonIds = [], verifiedPrs = [], mentorReviews = [] }) {
  const matrix = {};

  // Базові множники внеску одного джерела (для захисту від закриття одним комітом)
  const LESSON_WEIGHT = 20;
  const PR_WEIGHT = 15;
  const REVIEW_WEIGHT = 15;
  const MAX_PER_SOURCE = 40; // Максимальний внесок з одного типу джерела

  for (const [key, comp] of Object.entries(COMPETENCY_AREAS)) {
    const evidences = [];
    let lessonPoints = 0;
    let prPoints = 0;
    let reviewPoints = 0;

    // 1. Свідчення з уроків
    for (const lessonId of completedLessonIds) {
      if (comp.relevantLessons.includes(lessonId)) {
        const lesson = CURRICULUM_REGISTRY.find(l => l.id === lessonId);
        lessonPoints += LESSON_WEIGHT;
        evidences.push({
          type: 'lesson',
          ref: lessonId,
          title: lesson ? lesson.title : lessonId,
          jiraKey: lesson ? lesson.jiraKey : null,
          weight: LESSON_WEIGHT,
        });
      }
    }

    // 2. Свідчення з Pull Requests
    for (const pr of verifiedPrs) {
      if (!pr.skills || pr.skills.includes(comp.id)) {
        prPoints += PR_WEIGHT;
        evidences.push({
          type: 'pull_request',
          ref: pr.number ? `#${pr.number}` : pr.id,
          title: pr.title || 'Verified Pull Request',
          jiraKey: pr.jiraKey || null,
          weight: PR_WEIGHT,
        });
      }
    }

    // 3. Свідчення з рев'ю ментора
    for (const rev of mentorReviews) {
      if (rev.rubricScores && rev.rubricScores[comp.id] !== undefined) {
        const scoreVal = (rev.rubricScores[comp.id] / 5) * REVIEW_WEIGHT;
        reviewPoints += scoreVal;
        evidences.push({
          type: 'mentor_review',
          ref: rev.id || 'review',
          title: `Оцінка ментора (${rev.rubricScores[comp.id]}/5)`,
          feedback: rev.feedback || null,
          weight: Math.round(scoreVal),
        });
      }
    }

    // Обмеження максимального внеску одного джерела
    const cappedLesson = Math.min(lessonPoints, MAX_PER_SOURCE);
    const cappedPr = Math.min(prPoints, MAX_PER_SOURCE);
    const cappedReview = Math.min(reviewPoints, MAX_PER_SOURCE);

    const totalRaw = cappedLesson + cappedPr + cappedReview;
    const score = Math.min(Math.round(totalRaw), comp.maxScore);

    // Розрахунок покриття та впевненості
    const distinctSourceTypes = new Set(evidences.map(e => e.type)).size;
    let confidence = 'low';
    if (distinctSourceTypes >= 3 && evidences.length >= 4) {
      confidence = 'high';
    } else if (distinctSourceTypes >= 2 && evidences.length >= 2) {
      confidence = 'medium';
    }

    const coverage = Math.min(Math.round((evidences.length / (comp.relevantLessons.length + 2)) * 100), 100);
    const levelInfo = determineLevel(score);

    matrix[comp.id] = {
      id: comp.id,
      name: comp.name,
      icon: comp.icon,
      desc: comp.desc,
      score,
      level: levelInfo.level,
      levelTitle: levelInfo.title,
      levelColor: levelInfo.color,
      coverage,
      confidence,
      evidencesCount: evidences.length,
      evidences,
    };
  }

  return matrix;
}

/**
 * Gap Analysis: виявлення зон для розвитку та генерація персональних рекомендацій
 *
 * @param {Object} matrix Зведена матриця компетенцій
 * @param {string[]} completedLessonIds Вже пройдені уроки
 * @returns {Object} Результат аналізу прогалин
 */
export function performGapAnalysis(matrix, completedLessonIds = []) {
  const competencies = Object.values(matrix);

  // Сортуємо компетенції за зростанням балів (найслабші — першими)
  const sorted = [...competencies].sort((a, b) => a.score - b.score);
  const weakest = sorted[0] || null;
  const secondaryWeakest = sorted[1] || null;

  let recommendedLesson = null;
  if (weakest) {
    const compConfig = COMPETENCY_AREAS[weakest.id.toUpperCase()];
    if (compConfig) {
      // Знаходимо перший непройдений урок для цієї компетенції
      const nextLessonId = compConfig.relevantLessons.find(id => !completedLessonIds.includes(id));
      if (nextLessonId) {
        recommendedLesson = CURRICULUM_REGISTRY.find(l => l.id === nextLessonId) || null;
      }
    }
  }

  // Якщо всі релевантні пройдені, пропонуємо загальний наступний
  if (!recommendedLesson) {
    recommendedLesson = CURRICULUM_REGISTRY.find(l => !completedLessonIds.includes(l.id)) || null;
  }

  return {
    primaryGap: weakest ? { id: weakest.id, name: weakest.name, currentScore: weakest.score } : null,
    secondaryGap: secondaryWeakest ? { id: secondaryWeakest.id, name: secondaryWeakest.name, currentScore: secondaryWeakest.score } : null,
    overallAverageScore: Math.round(competencies.reduce((acc, c) => acc + c.score, 0) / (competencies.length || 1)),
    recommendedLesson: recommendedLesson ? {
      id: recommendedLesson.id,
      title: recommendedLesson.title,
      jiraKey: recommendedLesson.jiraKey,
      level: recommendedLesson.level,
      focusSkill: weakest ? weakest.name : 'Engineering',
      reason: `Допоможе підняти рівень компетенції «${weakest ? weakest.name : 'General'}» з поточних ${weakest ? weakest.score : 0}%`,
    } : null,
  };
}

/**
 * Отримання або збереження профілю аналітики учня
 */
export function getStudentSkillProfile(studentId, { completedLessonIds = [], verifiedPrs = [], mentorReviews = [] } = {}) {
  if (!studentId) throw new Error('studentId обов\'язковий');

  let profile = studentAnalyticsDb.get(studentId);
  if (!profile || completedLessonIds.length > 0) {
    const matrix = calculateCompetencyMatrix({ completedLessonIds, verifiedPrs, mentorReviews });
    const gapAnalysis = performGapAnalysis(matrix, completedLessonIds);

    profile = {
      studentId,
      updatedAt: new Date().toISOString(),
      matrix,
      gapAnalysis,
    };
    studentAnalyticsDb.set(studentId, profile);
  }

  return profile;
}

/**
 * Експорт аналітики навичок учня з перевіркою прав доступу (RBAC / IDOR Protection)
 */
export function exportSkillAnalytics(studentId, requestingUser) {
  const access = canAccessResource({
    user: requestingUser,
    resourceOwnerId: studentId,
    requiredPermission: null,
  });

  if (!access.allowed) {
    throw new Error(`Доступ заборонено: ${access.reason || 'UNAUTHORIZED'}`);
  }

  const profile = studentAnalyticsDb.get(studentId) || getStudentSkillProfile(studentId);
  return {
    exportType: 'skill_analytics_dossier',
    exportedAt: new Date().toISOString(),
    retentionNotice: 'Ці дані зберігаються виключно в навчальних цілях згідно з політикою мінімізації даних.',
    profile,
  };
}

/**
 * Видалення аналітики навичок (Data deletion policy)
 */
export function deleteStudentSkillAnalytics(studentId, requestingUser) {
  const access = canAccessResource({
    user: requestingUser,
    resourceOwnerId: studentId,
    requiredPermission: null,
  });

  if (!access.allowed && requestingUser.role !== ACADEMY_ROLES.ADMIN) {
    throw new Error(`Доступ заборонено: неможливо видалити аналітику іншого користувача`);
  }

  const existed = studentAnalyticsDb.has(studentId);
  studentAnalyticsDb.delete(studentId);

  return {
    success: true,
    studentId,
    deleted: existed,
    timestamp: new Date().toISOString(),
  };
}
