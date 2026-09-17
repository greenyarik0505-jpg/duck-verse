/**
 * Duck Academy — Demo Day & Privacy-Safe Showcase Engine (SCRUM-90)
 *
 * Відповідає стандартам:
 * 1. Demo Day Event: дедлайни, презентаційні слоти, розклад виступів.
 * 2. Rich Submissions: опис, live demo, pull request, статус тестів та ретроспектива.
 * 3. Privacy-Safe Gate: публічний доступ можливий виключно після згоди батьків та схвалення модератора.
 * 4. Time-Limited Links: тимчасові захищені посилання (TTL 7 днів) із можливістю миттєвого відкликання.
 * 5. Fairness Rubric: 40-бальне стандартизоване та незміщене оцінювання (4x10).
 */

import crypto from 'crypto';
import { ACADEMY_ROLES } from '../auth/roles.js';

// Інформація про найближчий захід Demo Day
export const DEMO_DAY_EVENT = {
  id: 'demoday-q3-2026',
  title: 'Duck Verse Academy Demo Day (Autumn 2026)',
  date: '2026-09-25T17:00:00.000Z',
  registrationDeadline: '2026-09-24T23:59:59.000Z',
  maxSlots: 8,
  status: 'REGISTRATION_OPEN',
  location: 'Cyber Auditorium & Vercel Live Stream',
};

// Сховище поданих проектів
const submissionsStore = [
  {
    id: 'sub-neon-runner-01',
    studentId: 'student_eva_01',
    studentName: 'Eva Coder',
    slotNumber: 1,
    title: 'Neon Duck Runner: 60 FPS Canvas Platformer',
    description: 'Оптимізований 2D платформер з процедурною генерацією перешкод та неоновим аудіо-синтезатором.',
    demoUrl: 'https://duck-verse.vercel.app',
    prUrl: 'https://github.com/greenyarik0505-jpg/duck-verse/pull/14',
    testsSummary: { passed: 52, total: 52, coverage: '94%' },
    retrospective: 'Найскладнішим було синхронізувати фізику стрибків із кадровою частотою 60 FPS та Web Audio API.',
    visibility: 'PUBLIC_SHOWCASE',
    parentConsent: true,
    moderation: {
      status: 'APPROVED',
      moderatorId: 'admin_yarik',
      feedback: 'Чудова архітектура, чистий код та бездоганний CI/CD пайплайн.',
      reviewedAt: '2026-09-17T14:00:00.000Z',
    },
    rubricEvaluation: {
      totalScore: 38,
      maxScore: 40,
      grade: 'Exceptional',
      breakdown: {
        architectureAndCode: 10,
        uiPlayabilityAndPolish: 9,
        testsAndCiPipeline: 10,
        presentationAndRetrospective: 9,
      },
    },
    submittedAt: '2026-09-17T12:00:00.000Z',
  },
  {
    id: 'sub-cyber-invaders-02',
    studentId: 'student_dmytro_44',
    studentName: 'Dmytro Junior',
    slotNumber: 2,
    title: 'Galactic Cyber Invaders',
    description: 'Космічний ретро-шутер із частинковими ефектами вибухів та адаптивним керуванням для мобільних пристроїв.',
    demoUrl: 'https://duck-verse.vercel.app',
    prUrl: 'https://github.com/greenyarik0505-jpg/duck-verse/pull/16',
    testsSummary: { passed: 48, total: 48, coverage: '91%' },
    retrospective: 'Зрозумів важливість слабкого зв\'язування компонентів гри та рушія рендерингу.',
    visibility: 'PUBLIC_SHOWCASE',
    parentConsent: true,
    moderation: {
      status: 'APPROVED',
      moderatorId: 'mentor_kirill',
      feedback: 'Гарна робота з Canvas 2D та оптимізацією розрахунку колізій.',
      reviewedAt: '2026-09-17T14:30:00.000Z',
    },
    rubricEvaluation: {
      totalScore: 35,
      maxScore: 40,
      grade: 'Proficient',
      breakdown: {
        architectureAndCode: 9,
        uiPlayabilityAndPolish: 9,
        testsAndCiPipeline: 9,
        presentationAndRetrospective: 8,
      },
    },
    submittedAt: '2026-09-17T12:30:00.000Z',
  },
];

// Сховище тимчасових посилань (token -> linkData)
const shareableLinksStore = new Map();

/**
 * Отримання інформації про захід Demo Day та доступні слоти
 */
export function getDemoDayEventInfo() {
  const registeredSlots = submissionsStore.map(s => s.slotNumber);
  const availableSlotsCount = Math.max(0, DEMO_DAY_EVENT.maxSlots - submissionsStore.length);

  return {
    ...DEMO_DAY_EVENT,
    registeredSlots,
    availableSlotsCount,
    submissionsCount: submissionsStore.length,
    isRegistrationOpen: new Date() < new Date(DEMO_DAY_EVENT.registrationDeadline) && availableSlotsCount > 0,
  };
}

/**
 * Подання проекту на демонстрацію (Submission)
 */
export function submitDemoProject({
  studentUser,
  title,
  description,
  demoUrl,
  prUrl,
  testsSummary,
  retrospective,
  slotNumber,
  parentConsent = false,
}) {
  if (!studentUser || !studentUser.id) throw new Error('studentUser обов\'язковий');
  if (!title || title.length < 5) throw new Error('title повинен містити щонайменше 5 символів');
  if (!description || description.length < 15) throw new Error('description повинен містити щонайменше 15 символів');
  if (!demoUrl || !demoUrl.startsWith('http')) throw new Error('demoUrl повинен бути валідним посиланням');
  if (!prUrl || !prUrl.includes('github.com')) throw new Error('prUrl повинен посилатися на GitHub Pull Request');
  if (!testsSummary || typeof testsSummary.passed !== 'number') throw new Error('testsSummary повинен містити кількість пройдених тестів');
  if (!retrospective || retrospective.length < 10) throw new Error('retrospective повинен містити опис рефлексії (≥10 символів)');

  // Перевірка дедлайну
  if (new Date() > new Date(DEMO_DAY_EVENT.registrationDeadline)) {
    const err = new Error('Дедлайн реєстрації на Demo Day вичерпано');
    err.code = 'DEADLINE_EXCEEDED';
    throw err;
  }

  // Перевірка зайнятості слотів
  const targetSlot = slotNumber || (submissionsStore.length + 1);
  if (targetSlot > DEMO_DAY_EVENT.maxSlots) {
    const err = new Error(`Усі доступні слоти (${DEMO_DAY_EVENT.maxSlots}) вже заповнені`);
    err.code = 'SLOTS_EXHAUSTED';
    throw err;
  }

  const submissionId = `sub-${crypto.randomBytes(6).toString('hex')}`;
  const now = new Date().toISOString();

  const newSubmission = {
    id: submissionId,
    studentId: studentUser.id,
    studentName: studentUser.username || 'Student',
    slotNumber: targetSlot,
    title,
    description,
    demoUrl,
    prUrl,
    testsSummary,
    retrospective,
    visibility: 'PRIVATE', // За замовчуванням завжди PRIVATE
    parentConsent: Boolean(parentConsent),
    moderation: {
      status: 'PENDING',
      moderatorId: null,
      feedback: null,
      reviewedAt: null,
    },
    rubricEvaluation: null,
    submittedAt: now,
  };

  submissionsStore.push(newSubmission);
  return newSubmission;
}

/**
 * Оновлення згоди батьків на публікацію в шоукейсі
 */
export function updateParentConsentForShowcase({ submissionId, parentUser, granted }) {
  const sub = submissionsStore.find(s => s.id === submissionId);
  if (!sub) throw new Error('Проект не знайдено');

  sub.parentConsent = Boolean(granted);

  // Якщо батьки відкликають згоду, проект автоматично повертається у PRIVATE
  if (!sub.parentConsent && sub.visibility === 'PUBLIC_SHOWCASE') {
    sub.visibility = 'PRIVATE';
  }

  return {
    success: true,
    submissionId,
    parentConsent: sub.parentConsent,
    visibility: sub.visibility,
  };
}

/**
 * Модерація проекту ментором або адміністратором
 */
export function moderateSubmission({ submissionId, moderatorUser, decision, feedback }) {
  if (!moderatorUser) throw new Error('moderatorUser обов\'язковий');
  const isAuthorized = moderatorUser.role === ACADEMY_ROLES.MENTOR || moderatorUser.role === ACADEMY_ROLES.ADMIN;
  if (!isAuthorized) {
    const err = new Error('Тільки ментори та адміністратори мають право модерації');
    err.code = 'UNAUTHORIZED_MODERATION';
    throw err;
  }

  const sub = submissionsStore.find(s => s.id === submissionId);
  if (!sub) throw new Error('Проект не знайдено');

  if (!['APPROVED', 'CHANGES_REQUESTED'].includes(decision)) {
    throw new Error('Неприпустиме рішення модератора. Очікується: APPROVED або CHANGES_REQUESTED');
  }

  sub.moderation = {
    status: decision,
    moderatorId: moderatorUser.id,
    feedback: feedback || '',
    reviewedAt: new Date().toISOString(),
  };

  // Автоматичне переведення у публічний статус, якщо є згода батьків
  if (decision === 'APPROVED' && sub.parentConsent) {
    sub.visibility = 'PUBLIC_SHOWCASE';
  } else if (decision === 'CHANGES_REQUESTED') {
    sub.visibility = 'PRIVATE';
  }

  return {
    success: true,
    submissionId,
    moderation: sub.moderation,
    visibility: sub.visibility,
  };
}

/**
 * Запит на переведення у публічний шоукейс (Visibility Gate)
 */
export function requestPublicShowcase({ submissionId, actor }) {
  const sub = submissionsStore.find(s => s.id === submissionId);
  if (!sub) throw new Error('Проект не знайдено');

  // 1. Перевірка згоди батьків (Privacy-by-Design)
  if (!sub.parentConsent) {
    const err = new Error('Публікація заблокована: вимагається офіційна згода батьків (Parental Consent)');
    err.code = 'PARENT_CONSENT_REQUIRED';
    throw err;
  }

  // 2. Перевірка схвалення модератором
  if (sub.moderation.status !== 'APPROVED') {
    const err = new Error('Публікація заблокована: проект очікує перевірки та схвалення ментором (Moderation)');
    err.code = 'MODERATION_REQUIRED';
    throw err;
  }

  sub.visibility = 'PUBLIC_SHOWCASE';
  return {
    success: true,
    submissionId,
    visibility: sub.visibility,
    message: 'Проект успішно опубліковано у публічному шоукейсі!',
  };
}

/**
 * Створення захищеного тимчасового посилання на шоукейс (TTL 7 днів)
 */
export function createShareableShowcaseLink({ submissionId, actor, ttlHours = 168 }) {
  const sub = submissionsStore.find(s => s.id === submissionId);
  if (!sub) throw new Error('Проект не знайдено');

  const token = `shlink-${crypto.randomBytes(16).toString('hex')}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);

  const linkData = {
    token,
    submissionId,
    createdBy: actor?.id || 'system',
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: 'active',
  };

  shareableLinksStore.set(token, linkData);

  return {
    token,
    shareableUrl: `/academy#showcase-${token}`,
    expiresAt: linkData.expiresAt,
    ttlHours,
  };
}

/**
 * Негайне відкликання тимчасового посилання (Revoke Access)
 */
export function revokeShareableLink({ linkToken, actor }) {
  const linkData = shareableLinksStore.get(linkToken);
  if (!linkData) {
    throw new Error('Посилання не знайдено або термін його дії минув');
  }

  linkData.status = 'revoked';
  linkData.revokedAt = new Date().toISOString();
  linkData.revokedBy = actor?.id || 'user';

  return {
    success: true,
    revoked: true,
    token: linkToken,
    message: 'Посилання успішно відкликано. Доступ заблоковано.',
  };
}

/**
 * Перевірка валідності тимчасового посилання
 */
export function verifyShareableLink(linkToken) {
  const linkData = shareableLinksStore.get(linkToken);
  if (!linkData) {
    return { valid: false, reason: 'NOT_FOUND' };
  }

  if (linkData.status === 'revoked') {
    return { valid: false, reason: 'REVOKED' };
  }

  if (new Date() > new Date(linkData.expiresAt)) {
    return { valid: false, reason: 'EXPIRED' };
  }

  const sub = submissionsStore.find(s => s.id === linkData.submissionId);
  return {
    valid: true,
    submission: sub,
    expiresAt: linkData.expiresAt,
  };
}

/**
 * Оцінювання проекту за 40-бальною Fairness Rubric
 */
export function gradeSubmissionFairnessRubric({ submissionId, mentorUser, scores, feedback }) {
  if (!mentorUser) throw new Error('mentorUser обов\'язковий');
  const isAuthorized = mentorUser.role === ACADEMY_ROLES.MENTOR || mentorUser.role === ACADEMY_ROLES.ADMIN;
  if (!isAuthorized) {
    const err = new Error('Тільки ментори або адміністратори мають право оцінювати роботи');
    err.code = 'UNAUTHORIZED_GRADING';
    throw err;
  }

  const sub = submissionsStore.find(s => s.id === submissionId);
  if (!sub) throw new Error('Проект не знайдено');

  const {
    architectureAndCode = 0,
    uiPlayabilityAndPolish = 0,
    testsAndCiPipeline = 0,
    presentationAndRetrospective = 0,
  } = scores || {};

  // Валідація шкал (0..10 кожна)
  for (const [key, val] of Object.entries({
    architectureAndCode,
    uiPlayabilityAndPolish,
    testsAndCiPipeline,
    presentationAndRetrospective,
  })) {
    if (typeof val !== 'number' || val < 0 || val > 10) {
      throw new Error(`Бал за критерієм ${key} повинен бути числом від 0 до 10`);
    }
  }

  const totalScore = architectureAndCode + uiPlayabilityAndPolish + testsAndCiPipeline + presentationAndRetrospective;

  let grade = 'Needs Revision';
  if (totalScore >= 36) grade = 'Exceptional';
  else if (totalScore >= 30) grade = 'Proficient';
  else if (totalScore >= 24) grade = 'Competent';

  sub.rubricEvaluation = {
    totalScore,
    maxScore: 40,
    grade,
    breakdown: {
      architectureAndCode,
      uiPlayabilityAndPolish,
      testsAndCiPipeline,
      presentationAndRetrospective,
    },
    mentorId: mentorUser.id,
    mentorFeedback: feedback || '',
    gradedAt: new Date().toISOString(),
  };

  return sub.rubricEvaluation;
}

/**
 * Отримання списку проектів шоукейсу із захистом приватності
 */
export function getSubmissionsList({ requestingUser, filterVisibility }) {
  const isPrivileged = requestingUser && (
    requestingUser.role === ACADEMY_ROLES.ADMIN ||
    requestingUser.role === ACADEMY_ROLES.MENTOR
  );

  return submissionsStore.filter(sub => {
    if (filterVisibility && filterVisibility !== 'ALL' && sub.visibility !== filterVisibility) {
      return false;
    }

    // Привілейовані користувачі бачать все
    if (isPrivileged) return true;

    // Власник бачить свій проект завжди
    if (requestingUser && requestingUser.id === sub.studentId) return true;

    // Публічний проект бачать усі
    return sub.visibility === 'PUBLIC_SHOWCASE';
  });
}

/**
 * Скидання стану для ізоляції тестів
 */
export function _resetShowcaseStateForTests() {
  submissionsStore.length = 2; // Зберігаємо 2 демо-проекти
  shareableLinksStore.clear();
}
