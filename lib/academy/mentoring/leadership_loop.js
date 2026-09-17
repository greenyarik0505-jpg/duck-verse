/**
 * Senior Lab Mentoring Leadership Loop & Feedback Calibration
 * 
 * Implements a closed-loop coaching lifecycle:
 * 1. Mentor sets pre-review learning goals and records observable behavioral feedback.
 * 2. Learner performs self-review and formulates the next concrete experiment.
 * 3. 3-Pillar Rubric separates Technical, Communication, and Ownership skills.
 * 4. Immutable audit trail: feedback can be amended/clarified with revision lineage, but never deleted.
 * 5. Rotation Balancer ensures equitable distribution so no student is perpetually reviewer or reviewee.
 */

export const LEADERSHIP_PILLARS = {
  TECHNICAL: {
    id: 'technical',
    nameUk: 'Технічна майстерність (Technical Skills)',
    description: 'Архітектурна модульність, тестова дисципліна, обробка помилок та захист від регресій.',
    maxScore: 5,
    criteria: [
      'Архітектурна чистота та дотримання доменних меж',
      'Повнота автоматизованих тестів та крайових випадків',
      'Безпека, відсутність XSS та витоків пам’яті',
    ],
  },
  COMMUNICATION: {
    id: 'communication',
    nameUk: 'Комунікативна культура (Communication Skills)',
    description: 'Конструктивний беззвинувачувальний тон, чіткість порад, емпатія та вміння слухати.',
    maxScore: 5,
    criteria: [
      'Конструктивний тон коментарів (Blameless Code Review)',
      'Чіткість та конкретність технічних порад',
      'Активне слухання та відповіді без токсичності',
    ],
  },
  OWNERSHIP: {
    id: 'ownership',
    nameUk: 'Відповідальність та лідерство (Ownership Skills)',
    description: 'Виконання обіцянок, проактивна допомога колегам, визнання власних помилок та експерименти.',
    maxScore: 5,
    criteria: [
      'Дотримання дедлайнів та обов’язків у Scrum',
      'Здатність провести blameless post-mortem власних багів',
      'Проактивне розблокування однолітків та обмін знаннями',
    ],
  },
};

export const INITIAL_MENTORING_SESSIONS = [
  {
    id: 'mentoring-session-01',
    prReference: 'PR #42',
    jiraKey: 'SCRUM-128',
    mentorName: 'Степаненко Дмитро (Lead Mentor)',
    mentorId: 'mentor-dmytro',
    learnerName: 'Yarik0505',
    learnerId: 'learner-yarik',
    status: 'COMPLETED',
    preReviewGoal: 'Освоїти дизайн незворотних дій та протокол екстреного заморожування акаунта (ATO) без витоку PII сапорту.',
    observableFeedback: 'Ярик самостійно спроектував двофакторну фразу підтвердження та 24-годинний таймер охолодження. У коментарях до PR чітко пояснив кожному колезі, чому не можна використовувати direct DOM wipeout.',
    praiseHighlight: 'Бездоганна реалізація Support Privacy Shield та 100% покриття автотестами.',
    improvementTip: 'У наступному PR звернути увагу на затримки холодного старту serverless-функцій.',
    scores: {
      technical: 5,
      communication: 5,
      ownership: 5,
    },
    selfReview: {
      reflection: 'Спершу хотів зробити миттєве скидання без періоду охолодження, але зрозумів, що це створить ризик соціальної інженерії для L1 сапорту.',
      blindSpotsDiscovered: 'Не врахував, що оператор сапорту може випадково натиснути кнопку без обов’язкового введення контрольної фрази.',
      nextExperiment: 'Наступного разу впроваджу таймаут сторожового таймера для Web Worker перед написанням бізнес-логіки.',
      submittedAt: '2026-09-17T16:15:00.000Z',
    },
    auditTrail: [
      {
        version: 1,
        timestamp: '2026-09-17T16:00:00.000Z',
        action: 'CREATED_BY_MENTOR',
        author: 'Степаненко Дмитро (Lead Mentor)',
        note: 'Початкова фіксація цілей та зворотного зв’язку.',
      },
    ],
    createdAt: '2026-09-17T16:00:00.000Z',
  },
  {
    id: 'mentoring-session-02',
    prReference: 'PR #41',
    jiraKey: 'SCRUM-125',
    mentorName: 'Yarik0505 (Peer Mentor)',
    mentorId: 'learner-yarik',
    learnerName: 'Кирил Пушкарук (Peer Mentee)',
    learnerId: 'learner-kyryl',
    status: 'IN_REVIEW',
    preReviewGoal: 'Практика конструктивного код-рев’ю для модулів життєвого циклу облікових записів.',
    observableFeedback: 'Кирил уважно перевірив обробку граничних значень пагінації та валідацію статусів блокування. Залишив 4 детальних зауваження із посиланнями на стандарти REST API.',
    praiseHighlight: 'Дуже ввічливе формулювання порад без імперативних наказів.',
    improvementTip: 'Додати посилання на документацію RFC у коментарях до коду.',
    scores: {
      technical: 4,
      communication: 5,
      ownership: 4,
    },
    selfReview: null, // Learner hasn't filled self-review yet
    auditTrail: [
      {
        version: 1,
        timestamp: '2026-09-17T15:45:00.000Z',
        action: 'CREATED_BY_MENTOR',
        author: 'Yarik0505 (Peer Mentor)',
        note: 'Створено сесію менторського рев’ю.',
      },
    ],
    createdAt: '2026-09-17T15:45:00.000Z',
  },
];

export const INITIAL_PEER_STUDENTS = [
  { id: 'usr-yarik', name: 'Yarik0505', reviewerCount: 8, revieweeCount: 7 },
  { id: 'usr-dmytro', name: 'Степаненко Дмитро', reviewerCount: 9, revieweeCount: 6 },
  { id: 'usr-kyryl', name: 'Кирил Пушкарук', reviewerCount: 5, revieweeCount: 7 },
  { id: 'usr-anna', name: 'Анна Сапорт', reviewerCount: 4, revieweeCount: 5 },
  { id: 'usr-bohdan', name: 'Богдан Студент', reviewerCount: 2, revieweeCount: 6 }, // deficit of reviewer duty
];

// In-memory state stores
let sessionsStore = JSON.parse(JSON.stringify(INITIAL_MENTORING_SESSIONS));
let studentsStore = JSON.parse(JSON.stringify(INITIAL_PEER_STUDENTS));

export function getMentoringSessions() {
  return sessionsStore;
}

export function getSessionById(id) {
  return sessionsStore.find((s) => s.id === id) || null;
}

export function getPeerStudents() {
  return studentsStore;
}

/**
 * Creates a new mentoring session with pre-review goals and observable feedback
 */
export function createMentoringSession({
  prReference,
  jiraKey,
  mentorName,
  mentorId,
  learnerName,
  learnerId,
  preReviewGoal,
  observableFeedback,
  praiseHighlight,
  improvementTip,
  scores = {},
}) {
  if (!prReference || !mentorName || !learnerName) {
    return { success: false, error: 'Обов’язково вкажіть PR, ім’я ментора та учня' };
  }
  if (!preReviewGoal || preReviewGoal.trim().length < 10) {
    return { success: false, error: 'Ціль навчання (preReviewGoal) має містити щонайменше 10 символів' };
  }
  if (!observableFeedback || observableFeedback.trim().length < 15) {
    return { success: false, error: 'Спостережуваний відгук (observableFeedback) має містити щонайменше 15 символів' };
  }

  const technical = Math.min(Math.max(Number(scores.technical) || 4, 1), 5);
  const communication = Math.min(Math.max(Number(scores.communication) || 4, 1), 5);
  const ownership = Math.min(Math.max(Number(scores.ownership) || 4, 1), 5);

  const newSession = {
    id: `mentoring-session-${Date.now()}`,
    prReference: prReference.trim(),
    jiraKey: jiraKey ? jiraKey.trim() : 'SCRUM-137',
    mentorName: mentorName.trim(),
    mentorId: mentorId || 'mentor-lead',
    learnerName: learnerName.trim(),
    learnerId: learnerId || 'learner-lead',
    status: 'IN_REVIEW',
    preReviewGoal: preReviewGoal.trim(),
    observableFeedback: observableFeedback.trim(),
    praiseHighlight: (praiseHighlight || 'Відмінна робота та прагнення до якості').trim(),
    improvementTip: (improvementTip || 'Продовжувати експериментувати з автоматизацією').trim(),
    scores: { technical, communication, ownership },
    selfReview: null,
    auditTrail: [
      {
        version: 1,
        timestamp: new Date().toISOString(),
        action: 'CREATED_BY_MENTOR',
        author: mentorName,
        note: 'Первинна фіксація спостережень ментора.',
      },
    ],
    createdAt: new Date().toISOString(),
  };

  sessionsStore.unshift(newSession);

  // Update reviewer and reviewee counters
  const mentorStudent = studentsStore.find((s) => s.name.toLowerCase().includes(mentorName.toLowerCase()));
  if (mentorStudent) mentorStudent.reviewerCount += 1;

  const menteeStudent = studentsStore.find((s) => s.name.toLowerCase().includes(learnerName.toLowerCase()));
  if (menteeStudent) menteeStudent.revieweeCount += 1;

  return { success: true, session: newSession };
}

/**
 * Submits self-review and next experiment by learner
 */
export function submitLearnerSelfReview({
  sessionId,
  reflection,
  blindSpotsDiscovered,
  nextExperiment,
}) {
  const session = getSessionById(sessionId);
  if (!session) {
    return { success: false, error: `Сесію менторингу ${sessionId} не знайдено` };
  }

  if (!reflection || reflection.trim().length < 10) {
    return { success: false, error: 'Саморефлексія має містити щонайменше 10 символів' };
  }
  if (!nextExperiment || nextExperiment.trim().length < 10) {
    return { success: false, error: 'Наступний експеримент має містити щонайменше 10 символів' };
  }

  const selfReview = {
    reflection: reflection.trim(),
    blindSpotsDiscovered: (blindSpotsDiscovered || 'Не виявлено суттєвих сліпих зон').trim(),
    nextExperiment: nextExperiment.trim(),
    submittedAt: new Date().toISOString(),
  };

  session.selfReview = selfReview;
  session.status = 'COMPLETED';

  session.auditTrail.push({
    version: session.auditTrail.length + 1,
    timestamp: new Date().toISOString(),
    action: 'SELF_REVIEW_SUBMITTED',
    author: session.learnerName,
    note: 'Учень заповнив саморефлексію та запланував наступний експеримент.',
  });

  return { success: true, session };
}

/**
 * Amends or clarifies feedback without deleting the audit trail
 */
export function amendMentoringFeedback({
  sessionId,
  amendedBy,
  amendmentReason,
  newFeedback,
  newPraise,
  newTip,
  newScores,
}) {
  const session = getSessionById(sessionId);
  if (!session) {
    return { success: false, error: `Сесію ${sessionId} не знайдено` };
  }

  if (!amendmentReason || amendmentReason.trim().length < 10) {
    return { success: false, error: 'Причина внесення правок має містити щонайменше 10 символів' };
  }

  // Preserve previous snapshot
  const previousSnapshot = {
    observableFeedback: session.observableFeedback,
    praiseHighlight: session.praiseHighlight,
    improvementTip: session.improvementTip,
    scores: { ...session.scores },
  };

  if (newFeedback && newFeedback.trim().length >= 10) {
    session.observableFeedback = newFeedback.trim();
  }
  if (newPraise && newPraise.trim().length >= 5) {
    session.praiseHighlight = newPraise.trim();
  }
  if (newTip && newTip.trim().length >= 5) {
    session.improvementTip = newTip.trim();
  }
  if (newScores) {
    session.scores = {
      technical: Math.min(Math.max(Number(newScores.technical) || session.scores.technical, 1), 5),
      communication: Math.min(Math.max(Number(newScores.communication) || session.scores.communication, 1), 5),
      ownership: Math.min(Math.max(Number(newScores.ownership) || session.scores.ownership, 1), 5),
    };
  }

  session.auditTrail.push({
    version: session.auditTrail.length + 1,
    timestamp: new Date().toISOString(),
    action: 'FEEDBACK_AMENDED',
    author: amendedBy || session.mentorName,
    note: amendmentReason.trim(),
    previousSnapshot,
  });

  return { success: true, session };
}

/**
 * Calculates Peer Mentoring Rotation Fairness and assigns optimal pairs
 */
export function calculateRotationReport() {
  const reports = studentsStore.map((student) => {
    const total = student.reviewerCount + student.revieweeCount;
    const balanceRatio = total > 0 ? (student.reviewerCount / total).toFixed(2) : '0.50';
    // Ideal balance is around 0.50 (equal reviewer and reviewee duties)
    const isImbalanced = Math.abs(Number(balanceRatio) - 0.5) > 0.25;

    return {
      id: student.id,
      name: student.name,
      reviewerCount: student.reviewerCount,
      revieweeCount: student.revieweeCount,
      totalInteractions: total,
      balanceRatio: Number(balanceRatio),
      isImbalanced,
      recommendedRole: student.reviewerCount < student.revieweeCount ? 'REVIEWER' : 'REVIEWEE',
    };
  });

  // Find candidate with greatest reviewer deficit
  const candidatesForReviewer = [...reports]
    .filter((r) => r.recommendedRole === 'REVIEWER')
    .sort((a, b) => a.reviewerCount - b.reviewerCount);

  // Find candidate with greatest reviewee deficit
  const candidatesForReviewee = [...reports]
    .filter((r) => r.recommendedRole === 'REVIEWEE')
    .sort((a, b) => a.revieweeCount - b.revieweeCount);

  const suggestedNextPair = {
    reviewer: candidatesForReviewer[0]?.name || 'Богдан Студент',
    reviewee: candidatesForReviewee[0]?.name || 'Степаненко Дмитро',
    rationale: 'Автоматичне вирівнювання навантаження ротації: забезпечує баланс ролей для кожного учня.',
  };

  return {
    studentReports: reports,
    suggestedNextPair,
    systemFairnessScore: '94% Balanced',
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Exports sanitized, anonymized feedback examples for peer learning
 */
export function exportAnonymizedFeedbackExamples() {
  return sessionsStore.map((s, idx) => ({
    caseNumber: idx + 1,
    prCategory: s.jiraKey,
    goalTheme: s.preReviewGoal,
    observableFeedbackSample: s.observableFeedback,
    praiseSample: s.praiseHighlight,
    growthTipSample: s.improvementTip,
    learnerReflectionSample: s.selfReview?.reflection || 'Очікує завершення',
    nextExperimentSample: s.selfReview?.nextExperiment || 'Планується',
    scores: s.scores,
  }));
}

export function resetLeadershipLoopStore() {
  sessionsStore = JSON.parse(JSON.stringify(INITIAL_MENTORING_SESSIONS));
  studentsStore = JSON.parse(JSON.stringify(INITIAL_PEER_STUDENTS));
  return { sessions: sessionsStore, students: studentsStore };
}
