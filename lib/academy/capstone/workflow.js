import crypto from 'crypto';

/**
 * Duck Academy — 6-Етапний Capstone Workflow та випускний реліз
 * Ключ задачі Jira: SCRUM-58 (Level 4)
 */

export const CAPSTONE_GATES = [
  {
    id: 'gate_1_brief',
    step: 1,
    title: 'Product Brief & Architecture',
    desc: 'Опис проблеми, скоуп, user stories, вибір архітектури та аналіз ризиків',
    requiredEvidence: ['brief_spec', 'adr_document'],
  },
  {
    id: 'gate_2_branch_pr',
    step: 2,
    title: 'Git Branch & Pull Request',
    desc: 'Робоча гілка, семантичні коміти та відкритий PR у main із прив’язкою до Jira',
    requiredEvidence: ['jira_issue', 'github_pr'],
  },
  {
    id: 'gate_3_ci',
    step: 3,
    title: 'Automated CI/CD Validation',
    desc: 'Успішне проходження компіляції, лінтингу та 100% проходження тестів',
    requiredEvidence: ['ci_build_passed', 'tests_passed'],
  },
  {
    id: 'gate_4_review',
    step: 4,
    title: 'Mentor Code Review',
    desc: 'Перевірка за 6-вимірною рубрикою Duck Academy (бал >= 24/30)',
    requiredEvidence: ['mentor_approval', 'rubric_score_24_plus'],
  },
  {
    id: 'gate_5_release',
    step: 5,
    title: 'Production Release & Rollback Plan',
    desc: 'Деплой на живий продакшен Vercel, release notes та план відкату',
    requiredEvidence: ['production_url', 'release_notes', 'rollback_plan'],
  },
  {
    id: 'gate_6_retrospective',
    step: 6,
    title: 'Post-Release Retrospective',
    desc: 'Аналіз результатів, технічні висновки та фіксація досягнень',
    requiredEvidence: ['retro_notes', 'graduation_checklist'],
  },
];

// Імутабельне сховище прогресу Capstone
const capstoneStore = new Map();

export function getOrCreateCapstoneProgress(studentId) {
  if (!capstoneStore.has(studentId)) {
    capstoneStore.set(studentId, {
      studentId,
      currentStep: 1,
      completedGates: [],
      gateEvidence: {},
      isGraduated: false,
      graduationCertificate: null,
      history: [],
      createdAt: new Date().toISOString(),
    });
  }
  return capstoneStore.get(studentId);
}

/**
 * Валідація та перехід через етап (Gate Submission)
 */
export function submitCapstoneGate({ studentId, gateId, evidence = {} }) {
  const progress = getOrCreateCapstoneProgress(studentId);
  const gateIndex = CAPSTONE_GATES.findIndex((g) => g.id === gateId);

  if (gateIndex === -1) {
    throw new Error(`Невідомий етап Capstone: ${gateId}`);
  }

  const gate = CAPSTONE_GATES[gateIndex];

  // Перевірка послідовності: не можна перестрибувати етапи
  if (gate.step > progress.currentStep) {
    throw new Error(`Не можна переходити до кроку ${gate.step}, доки не завершено крок ${progress.currentStep}`);
  }

  // Перевірка наявності необхідних свідчень
  const missingEvidence = gate.requiredEvidence.filter((req) => !evidence[req]);
  if (missingEvidence.length > 0) {
    return {
      success: false,
      error: 'MISSING_EVIDENCE',
      message: `Відсутні обов’язкові свідчення для етапу ${gate.title}: ${missingEvidence.join(', ')}`,
      missingEvidence,
    };
  }

  // Збереження свідчень та просування
  if (!progress.completedGates.includes(gateId)) {
    progress.completedGates.push(gateId);
  }
  progress.gateEvidence[gateId] = { ...evidence, submittedAt: new Date().toISOString() };
  progress.currentStep = Math.min(CAPSTONE_GATES.length + 1, gate.step + 1);

  progress.history.push({
    gateId,
    status: 'completed',
    timestamp: new Date().toISOString(),
  });

  return {
    success: true,
    progress,
    nextGate: CAPSTONE_GATES.find((g) => g.step === progress.currentStep) || null,
  };
}

/**
 * Генерація офіційного випускного сертифіката Duck Academy
 */
export function issueGraduationCertificate(studentId, trackId = 'track-frontend-gaming') {
  const progress = getOrCreateCapstoneProgress(studentId);

  if (progress.completedGates.length < CAPSTONE_GATES.length) {
    throw new Error(
      `Неможливо завершити випуск: пройдено лише ${progress.completedGates.length} з ${CAPSTONE_GATES.length} обов'язкових етапів`
    );
  }

  const certData = {
    certificateId: `DA-GRAD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    studentId,
    trackId,
    title: 'Duck Verse Full-Stack Game & Platform Engineer',
    graduationDate: new Date().toISOString(),
    status: 'HONOR_GRADUATE',
    totalGatesCompleted: CAPSTONE_GATES.length,
    verificationHash: crypto
      .createHash('sha256')
      .update(`${studentId}:${trackId}:${Date.now()}`)
      .digest('hex')
      .substring(0, 16),
  };

  progress.isGraduated = true;
  progress.graduationCertificate = certData;

  return certData;
}
