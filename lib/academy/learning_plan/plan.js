/**
 * Duck Academy — Individual Learning Plan (ILP) & Adaptive Path Engine (SCRUM-100)
 *
 * Відповідає вимогам:
 * 1. Strategic Goals: Індивідуальні інженерні спеціалізації (Frontend, Audio, Full-Stack, DevSecOps).
 * 2. Electives Catalog: Додаткові вибіркові дисципліни з контролем Prerequisites та Workload.
 * 3. Adaptive Recommendation: Алгоритм визначення наступного кроку на базі прогресу та прогалин компетенцій.
 * 4. Mentor-Approved Exceptions: Контрольований обхід передумов за наявності обґрунтування та схвалення ментором.
 * 5. Versioning & Audit Trail: Незмінний журнал ревізій кожного плану (v1, v2, ...).
 * 6. Dynamic Progress Recalculation: Автоматичний розрахунок прогресу за планом.
 */

import crypto from 'crypto';
import { ACADEMY_ROLES } from '../auth/roles.js';

// Каталог стратегічних цілей навчання
export const AVAILABLE_GOALS = {
  'fe-architect': {
    id: 'fe-architect',
    title: 'Frontend Game Architect',
    description: 'Фокус на високопродуктивних інтерфейсах Next.js 15, Canvas 2D рушіях та реактивному стані React 19.',
    recommendedWeeklyHours: 8,
    requiredCoreLessons: ['lesson-fe-l0-arch', 'lesson-fe-l1-canvas'],
  },
  'audio-dsp': {
    id: 'audio-dsp',
    title: 'Web Audio & DSP Engineer',
    description: 'Фокус на цифровому синтезі звуку 130 BPM, Web Audio API, буферизації та низьколатентних аудіо-рушіях.',
    recommendedWeeklyHours: 10,
    requiredCoreLessons: ['lesson-fe-l0-arch', 'lesson-fe-l1-canvas'],
  },
  'fullstack-next': {
    id: 'fullstack-next',
    title: 'Full-Stack Next.js Developer',
    description: 'Фокус на серверних Route Handlers, оптимізації рендерингу, безпеці сесій та REST API.',
    recommendedWeeklyHours: 10,
    requiredCoreLessons: ['lesson-fe-l0-arch'],
  },
  'devsecops-lead': {
    id: 'devsecops-lead',
    title: 'DevSecOps & Platform Engineer',
    description: 'Фокус на безпеці CI/CD пайплайнів, аудиті вразливостей, secret hygiene та автоматизації.',
    recommendedWeeklyHours: 6,
    requiredCoreLessons: ['lesson-fe-l0-arch'],
  },
};

// Каталог вибіркових дисциплін (Electives)
export const ELECTIVES_CATALOG = [
  {
    id: 'elec-canvas-shaders',
    title: 'Advanced Canvas Shaders & Neon FX',
    description: 'Математика світлових неонових ефектів, блум та оптимізація 60 FPS для HTML5 Canvas.',
    prerequisites: ['lesson-fe-l0-arch', 'lesson-fe-l1-canvas'],
    workloadHours: 4,
    difficulty: 'INTERMEDIATE',
    category: 'Graphics & VFX',
  },
  {
    id: 'elec-synth-dsp',
    title: 'DSP Audio Filters & Frequency Modulation',
    description: 'Фільтри низьких та високих частот, модуляція гармонік та синтез спецефектів у реальному часі.',
    prerequisites: ['lesson-fe-l1-canvas'],
    workloadHours: 5,
    difficulty: 'ADVANCED',
    category: 'Audio Engineering',
  },
  {
    id: 'elec-vibe-engineering',
    title: 'Advanced Vibe-Prompting & AI Spec Driving',
    description: 'Складання надійних інженерних промптів для ШІ, створення спек та верифікація згенерованого коду.',
    prerequisites: ['lesson-fe-l0-arch'],
    workloadHours: 3,
    difficulty: 'BEGINNER',
    category: 'AI & Methodologies',
  },
  {
    id: 'elec-distributed-ratelimit',
    title: 'Distributed Rate Limiting & Sliding Windows',
    description: 'Алгоритми Token Bucket та Sliding Window для захисту API від перевантажень.',
    prerequisites: ['lesson-fe-l0-arch'],
    workloadHours: 6,
    difficulty: 'ADVANCED',
    category: 'Backend & Security',
  },
  {
    id: 'elec-chaos-testing',
    title: 'Chaos Engineering & Crash Injection',
    description: 'Стрес-тестування системи: симуляція збоїв мережі, затримок пам’яті та аварійного відновлення.',
    prerequisites: ['lesson-fe-l1-canvas'],
    workloadHours: 5,
    difficulty: 'ADVANCED',
    category: 'DevSecOps & Reliability',
  },
];

// Сховища даних
const plansStore = new Map();
const auditTrailStore = [];
const exceptionsStore = [];

/**
 * Отримання або створення дефолтного плану учня
 */
export function getStudentLearningPlan({ studentId, completedLessons = [] }) {
  if (!studentId) throw new Error('studentId обов\'язковий');

  let plan = plansStore.get(studentId);
  if (!plan) {
    plan = {
      id: `ilp-${studentId}`,
      studentId,
      targetGoal: 'fe-architect',
      targetWeeklyHours: 8,
      selectedElectives: [],
      approvedExceptions: [], // Список electiveId зі знятими передумовами
      version: 1,
      createdAt: '2026-09-17T12:00:00.000Z',
      updatedAt: '2026-09-17T12:00:00.000Z',
    };
    plansStore.set(studentId, plan);

    // Початковий запис в аудит
    auditTrailStore.push({
      id: `aud-${crypto.randomBytes(4).toString('hex')}`,
      studentId,
      version: 1,
      changedBy: studentId,
      changeType: 'PLAN_INITIALIZED',
      details: 'Ініціалізація базового індивідуального плану навчання (v1)',
      timestamp: plan.createdAt,
    });
  }

  // Динамічний розрахунок прогресу
  const goalConfig = AVAILABLE_GOALS[plan.targetGoal] || AVAILABLE_GOALS['fe-architect'];
  const totalTrackItems = goalConfig.requiredCoreLessons.length + plan.selectedElectives.length;
  const completedCoreCount = goalConfig.requiredCoreLessons.filter(lId => completedLessons.includes(lId)).length;
  // Елективи вважаємо пройденими, якщо вони є у completedLessons
  const completedElectivesCount = plan.selectedElectives.filter(eId => completedLessons.includes(eId)).length;
  const totalCompleted = completedCoreCount + completedElectivesCount;
  const progressPercentage = totalTrackItems > 0 ? Math.round((totalCompleted / totalTrackItems) * 100) : 0;

  const studentAudit = auditTrailStore
    .filter(a => a.studentId === studentId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const studentExceptions = exceptionsStore
    .filter(e => e.studentId === studentId)
    .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

  return {
    ...plan,
    goalDetails: goalConfig,
    progressPercentage,
    totalCompleted,
    totalTrackItems,
    auditTrail: studentAudit,
    exceptions: studentExceptions,
  };
}

/**
 * Оновлення цілей навчання та щотижневого навантаження
 */
export function updateLearningPlanGoals({ studentId, targetGoal, targetWeeklyHours, actor }) {
  if (!studentId) throw new Error('studentId обов\'язковий');
  if (!AVAILABLE_GOALS[targetGoal]) throw new Error(`Невідома ціль: ${targetGoal}`);

  const hours = Number(targetWeeklyHours);
  if (isNaN(hours) || hours < 2 || hours > 40) {
    throw new Error('Щотижневе навантаження має бути між 2 та 40 годинами');
  }

  const isAuthorized = actor && (
    actor.id === studentId ||
    actor.role === ACADEMY_ROLES.MENTOR ||
    actor.role === ACADEMY_ROLES.ADMIN
  );
  if (!isAuthorized) {
    const err = new Error('Недостатньо прав для оновлення навчального плану');
    err.code = 'UNAUTHORIZED_PLAN_UPDATE';
    throw err;
  }

  const plan = plansStore.get(studentId) || getStudentLearningPlan({ studentId });
  const oldGoal = plan.targetGoal;
  const oldHours = plan.targetWeeklyHours;

  plan.targetGoal = targetGoal;
  plan.targetWeeklyHours = hours;
  plan.version += 1;
  plan.updatedAt = new Date().toISOString();
  plansStore.set(studentId, plan);

  // Запис в аудит
  auditTrailStore.push({
    id: `aud-${crypto.randomBytes(4).toString('hex')}`,
    studentId,
    version: plan.version,
    changedBy: actor.username || actor.id,
    changeType: 'GOALS_UPDATED',
    details: `Зміна цілі з "${oldGoal}" на "${targetGoal}", навантаження: ${oldHours}h -> ${hours}h/тиждень`,
    timestamp: plan.updatedAt,
  });

  return getStudentLearningPlan({ studentId });
}

/**
 * Оновлення переліку обраних вибіркових дисциплін (Electives)
 */
export function updateSelectedElectives({ studentId, electiveIds = [], completedLessons = [], actor }) {
  if (!studentId) throw new Error('studentId обов\'язковий');
  const isAuthorized = actor && (
    actor.id === studentId ||
    actor.role === ACADEMY_ROLES.MENTOR ||
    actor.role === ACADEMY_ROLES.ADMIN
  );
  if (!isAuthorized) {
    const err = new Error('Недостатньо прав для зміни вибіркових дисциплін');
    err.code = 'UNAUTHORIZED_ELECTIVES_UPDATE';
    throw err;
  }

  const plan = plansStore.get(studentId) || getStudentLearningPlan({ studentId });

  // Перевірка передумов (Prerequisites) для кожного обраного курсу
  for (const elecId of electiveIds) {
    const elective = ELECTIVES_CATALOG.find(e => e.id === elecId);
    if (!elective) throw new Error(`Вибірковий курс ${elecId} не знайдено`);

    const hasWaivedException = plan.approvedExceptions.includes(elecId);
    if (!hasWaivedException) {
      const missingPrereqs = elective.prerequisites.filter(p => !completedLessons.includes(p));
      if (missingPrereqs.length > 0) {
        const err = new Error(`Неможливо обрати курс "${elective.title}": не виконано обов'язкові передумови (${missingPrereqs.join(', ')}). Подайте заявку на виняток з обґрунтуванням.`);
        err.code = 'PREREQUISITES_NOT_MET';
        err.missingPrerequisites = missingPrereqs;
        throw err;
      }
    }
  }

  const oldElectives = [...plan.selectedElectives];
  plan.selectedElectives = electiveIds;
  plan.version += 1;
  plan.updatedAt = new Date().toISOString();
  plansStore.set(studentId, plan);

  auditTrailStore.push({
    id: `aud-${crypto.randomBytes(4).toString('hex')}`,
    studentId,
    version: plan.version,
    changedBy: actor.username || actor.id,
    changeType: 'ELECTIVES_CHANGED',
    details: `Оновлено вибіркові дисципліни: [${oldElectives.join(', ')}] -> [${electiveIds.join(', ')}]`,
    timestamp: plan.updatedAt,
  });

  return getStudentLearningPlan({ studentId, completedLessons });
}

/**
 * Подання заявки на виняток щодо prerequisites
 */
export function requestPrerequisiteException({ studentId, electiveId, explanation, actor }) {
  if (!studentId || !electiveId) throw new Error('studentId та electiveId обов\'язкові');
  if (!explanation || explanation.trim().length < 15) {
    throw new Error('Обґрунтування запиту на обхід prerequisites повинно містити щонайменше 15 символів');
  }

  const elective = ELECTIVES_CATALOG.find(e => e.id === electiveId);
  if (!elective) throw new Error('Вибірковий курс не знайдено');

  const exceptionId = `exc-${crypto.randomBytes(5).toString('hex')}`;
  const now = new Date().toISOString();

  const newException = {
    id: exceptionId,
    studentId,
    studentName: actor?.username || 'Student',
    electiveId,
    electiveTitle: elective.title,
    requiredPrerequisites: elective.prerequisites,
    explanation: explanation.trim(),
    status: 'PENDING',
    reviewerNotes: null,
    reviewedBy: null,
    requestedAt: now,
    reviewedAt: null,
  };

  exceptionsStore.push(newException);

  // Запис в аудит
  auditTrailStore.push({
    id: `aud-${crypto.randomBytes(4).toString('hex')}`,
    studentId,
    version: (plansStore.get(studentId)?.version || 1),
    changedBy: actor?.username || studentId,
    changeType: 'EXCEPTION_REQUESTED',
    details: `Подано запит на виняток для курсу "${elective.title}": "${explanation.trim().substring(0, 50)}..."`,
    timestamp: now,
  });

  return newException;
}

/**
 * Менторський перегляд та погодження винятку (Review Exception)
 */
export function reviewPrerequisiteException({ exceptionId, decision, reviewerNotes, mentorUser }) {
  if (!exceptionId || !decision) throw new Error('exceptionId та decision обов\'язкові');
  if (!['APPROVED', 'REJECTED'].includes(decision)) {
    throw new Error('Неприпустиме рішення: очікується APPROVED або REJECTED');
  }

  const isMentorOrAdmin = mentorUser && (
    mentorUser.role === ACADEMY_ROLES.MENTOR ||
    mentorUser.role === ACADEMY_ROLES.ADMIN ||
    mentorUser.role === 'team_lead'
  );

  if (!isMentorOrAdmin) {
    const err = new Error('Тільки викладачі (mentor/admin) мають право погоджувати винятки передумов');
    err.code = 'UNAUTHORIZED_REVIEW';
    throw err;
  }

  const exception = exceptionsStore.find(e => e.id === exceptionId);
  if (!exception) throw new Error('Запит на виняток не знайдено');

  const now = new Date().toISOString();
  exception.status = decision;
  exception.reviewerNotes = reviewerNotes || (decision === 'APPROVED' ? 'Погоджено ментором' : 'Відхилено ментором');
  exception.reviewedBy = mentorUser.username || mentorUser.id;
  exception.reviewedAt = now;

  const plan = plansStore.get(exception.studentId) || getStudentLearningPlan({ studentId: exception.studentId });

  if (decision === 'APPROVED') {
    if (!plan.approvedExceptions.includes(exception.electiveId)) {
      plan.approvedExceptions.push(exception.electiveId);
    }
    if (!plan.selectedElectives.includes(exception.electiveId)) {
      plan.selectedElectives.push(exception.electiveId);
    }
    plan.version += 1;
    plan.updatedAt = now;
    plansStore.set(exception.studentId, plan);
  }

  auditTrailStore.push({
    id: `aud-${crypto.randomBytes(4).toString('hex')}`,
    studentId: exception.studentId,
    version: plan.version,
    changedBy: mentorUser.username || mentorUser.id,
    changeType: decision === 'APPROVED' ? 'EXCEPTION_APPROVED' : 'EXCEPTION_REJECTED',
    details: `Ментор ${mentorUser.username || mentorUser.id} ${decision === 'APPROVED' ? 'схвалив' : 'відхилив'} виняток для "${exception.electiveTitle}". Примітка: ${exception.reviewerNotes}`,
    timestamp: now,
  });

  return {
    success: true,
    exception,
    updatedPlanVersion: plan.version,
  };
}

/**
 * Адаптивний розрахунок рекомендованого наступного кроку (Adaptive Next Step)
 */
export function calculateAdaptiveNextStep({ studentId, completedLessons = [] }) {
  const plan = getStudentLearningPlan({ studentId, completedLessons });
  const goal = plan.goalDetails;

  // 1. Перевіряємо обов'язкові уроки цільового треку
  const missingCoreLesson = goal.requiredCoreLessons.find(lId => !completedLessons.includes(lId));
  if (missingCoreLesson) {
    return {
      type: 'CORE',
      moduleId: missingCoreLesson,
      title: missingCoreLesson === 'lesson-fe-l0-arch' ? 'Архітектурний базис Duck Academy (L0)' : 'Ігрова фізика Canvas 2D (L1)',
      rationale: `Обов'язкова передумова для досягнення цілі "${goal.title}". Забезпечує базову інженерну компетенцію.`,
      estimatedHours: 4,
      isMandatory: true,
    };
  }

  // 2. Якщо ядро пройдено, перевіряємо обрані electives
  const nextElective = plan.selectedElectives
    .map(eId => ELECTIVES_CATALOG.find(e => e.id === eId))
    .find(e => e && !completedLessons.includes(e.id));

  if (nextElective) {
    return {
      type: 'ELECTIVE',
      moduleId: nextElective.id,
      title: nextElective.title,
      rationale: `Обраний вибірковий курс за вашою спеціалізацією. Навантаження: ${nextElective.workloadHours} год.`,
      estimatedHours: nextElective.workloadHours,
      isMandatory: false,
    };
  }

  // 3. Якщо всі поточні завдання завершено — пропонуємо рекомендований електив
  const recommendedUnselected = ELECTIVES_CATALOG.find(e => !plan.selectedElectives.includes(e.id));
  return {
    type: 'COMPLETED_OR_ADVANCED',
    moduleId: recommendedUnselected?.id || 'capstone-project',
    title: recommendedUnselected ? `Рекомендовано: ${recommendedUnselected.title}` : 'Випускний Capstone проект',
    rationale: 'Усі базові цілі виконано! Перейдіть до поглибленої практики або дипломного проекту.',
    estimatedHours: 8,
    isMandatory: false,
  };
}

/**
 * Скидання стану для ізоляції тестів
 */
export function _resetLearningPlanStateForTests() {
  plansStore.clear();
  auditTrailStore.length = 0;
  exceptionsStore.length = 0;
}
