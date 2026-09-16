/**
 * Duck Academy — Contracts & Type Definitions (SCRUM-56)
 * Описує строгий інтерфейс уроків, подій прогресу та свідоцтв про виконання.
 */

/**
 * @typedef {'draft' | 'published' | 'deprecated'} LessonStatus
 * @typedef {'github_pr' | 'jira_issue' | 'test_run' | 'mentor_review' | 'quiz'} EvidenceType
 * @typedef {'lesson_start' | 'checkpoint' | 'submit_evidence' | 'mentor_pass' | 'mentor_revision'} ProgressEventType
 */

export const EVIDENCE_TYPES = {
  GITHUB_PR: 'github_pr',
  JIRA_ISSUE: 'jira_issue',
  TEST_RUN: 'test_run',
  MENTOR_REVIEW: 'mentor_review',
  QUIZ: 'quiz'
};

export const PROGRESS_EVENT_TYPES = {
  START: 'lesson_start',
  CHECKPOINT: 'checkpoint',
  SUBMIT: 'submit_evidence',
  PASS: 'mentor_pass',
  REVISION: 'mentor_revision'
};

/**
 * Валідує об'єкт уроку на відповідність обов'язковому контракту
 */
export function validateLessonContract(lesson) {
  const errors = [];
  if (!lesson.id || typeof lesson.id !== 'string') errors.push(`Урок не має валідного 'id'`);
  if (!lesson.trackId || typeof lesson.trackId !== 'string') errors.push(`Урок '${lesson.id}' не має 'trackId'`);
  if (typeof lesson.level !== 'number') errors.push(`Урок '${lesson.id}' не має числового 'level'`);
  if (!lesson.title || typeof lesson.title !== 'string') errors.push(`Урок '${lesson.id}' не має 'title'`);
  if (!lesson.summary || typeof lesson.summary !== 'string') errors.push(`Урок '${lesson.id}' не має 'summary'`);
  if (!Array.isArray(lesson.prerequisites)) errors.push(`Урок '${lesson.id}' повинен містити масив 'prerequisites'`);
  if (!Array.isArray(lesson.acceptanceCriteria) || lesson.acceptanceCriteria.length === 0) {
    errors.push(`Урок '${lesson.id}' повинен містити хоча б один 'acceptanceCriteria'`);
  }
  if (!Array.isArray(lesson.requiredEvidence) || lesson.requiredEvidence.length === 0) {
    errors.push(`Урок '${lesson.id}' повинен містити масив 'requiredEvidence'`);
  }
  return errors;
}
