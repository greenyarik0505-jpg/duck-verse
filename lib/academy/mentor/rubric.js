/**
 * Duck Academy — Code Review Рубрика та Менторський скоринг
 * Ключ задачі Jira: SCRUM-57 (Level 3)
 */

export const RUBRIC_DIMENSIONS = [
  { id: 'correctness', name: 'Правильність (Correctness)', weight: 1, maxScore: 5, desc: 'Відповідність Acceptance Criteria та коректність роботи коду' },
  { id: 'readability', name: 'Чистота коду (Readability)', weight: 1, maxScore: 5, desc: 'Архітектурна модульність, іменування та дотримання стилю' },
  { id: 'tests', name: 'Тестування (Tests & Contracts)', weight: 1, maxScore: 5, desc: 'Покриття модульними тестами та валідація крайових випадків' },
  { id: 'security', name: 'Безпека (Security & RBAC)', weight: 1, maxScore: 5, desc: 'Захист від ескалації привілеїв, санітизація, безпека сесій' },
  { id: 'performance', name: 'Швидкодія (Performance)', weight: 1, maxScore: 5, desc: 'Ефективне використання пам’яті, кешування та відсутність витоків' },
  { id: 'teamwork', name: 'Командна взаємодія (Teamwork & Git)', weight: 1, maxScore: 5, desc: 'Правильний формат гілок, зв’язок із Jira та якісний Pull Request' },
];

export const PASSING_SCORE = 24; // 24 / 30 балів

export const FEEDBACK_SEVERITIES = {
  INFO: 'info',
  SUGGESTION: 'suggestion',
  WARNING: 'warning',
  BLOCKER: 'blocker',
};

// Імутабельна історія код-рев'ю в пам'яті
const reviewHistoryStore = [];

/**
 * Розрахунок підсумкового балу за рубрикою
 */
export function calculateRubricScore(scores = {}) {
  let total = 0;
  for (const dim of RUBRIC_DIMENSIONS) {
    const val = Number(scores[dim.id]) || 0;
    const clamped = Math.max(0, Math.min(dim.maxScore, val));
    total += clamped;
  }
  return {
    totalScore: total,
    maxPossibleScore: 30,
    passed: total >= PASSING_SCORE,
  };
}

/**
 * Створення нового імутабельного рев'ю ментора
 */
export function createReview({
  mentorId,
  studentId,
  lessonId,
  scores,
  feedback,
  severity = FEEDBACK_SEVERITIES.SUGGESTION,
  nextAction,
}) {
  if (!mentorId || !studentId || !lessonId) {
    throw new Error('Обов’язково вкажіть mentorId, studentId та lessonId');
  }

  const { totalScore, passed } = calculateRubricScore(scores);

  const reviewEntry = Object.freeze({
    id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    mentorId,
    studentId,
    lessonId,
    scores: { ...scores },
    totalScore,
    passed,
    feedback: feedback || 'Роботу перевірено за єдиною рубрикою Duck Academy.',
    severity,
    nextAction: nextAction || (passed ? 'Перехід до наступного рівня' : 'Виправлення зауважень та повторний resubmit'),
    createdAt: new Date().toISOString(),
  });

  reviewHistoryStore.push(reviewEntry);
  return reviewEntry;
}

/**
 * Отримання історії рев'ю для учня (імутабельний зріз)
 */
export function getStudentReviews(studentId) {
  return reviewHistoryStore
    .filter((r) => r.studentId === studentId)
    .map((r) => ({ ...r }));
}

/**
 * Отримання списку призначених студентів ментора з останніми статусами
 */
export function getMentorStudents(mentorId) {
  return [
    {
      studentId: 'user_student_yarik',
      username: 'student_yarik',
      trackId: 'track-frontend-gaming',
      currentLevel: 1,
      blockersCount: 0,
      submissionStatus: 'pending_review',
      lastSubmissionAt: '2026-09-16T18:50:00.000Z',
    },
  ];
}
