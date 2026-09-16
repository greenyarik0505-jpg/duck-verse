/**
 * Duck Academy — Contracts & Type Definitions (SCRUM-56 & SCRUM-44)
 * Описує строгий інтерфейс уроків, стан прогресу, чекпоінти та свідоцтва про виконання.
 */

/**
 * @typedef {'draft' | 'published' | 'deprecated'} LessonStatus
 * @typedef {'github_pr' | 'jira_issue' | 'test_run' | 'mentor_review' | 'quiz'} EvidenceType
 * @typedef {'lesson_start' | 'checkpoint' | 'submit_evidence' | 'mentor_pass' | 'mentor_revision'} ProgressEventType
 * @typedef {'locked' | 'available' | 'in_progress' | 'submitted' | 'completed'} LessonProgressState
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

export const LESSON_PROGRESS_STATES = {
  LOCKED: 'locked',
  AVAILABLE: 'available',
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  COMPLETED: 'completed'
};

export const CURRENT_CONTENT_VERSION = '1.2.0';

/**
 * Валідує об'єкт уроку на відповідність обов'язковому контракту (SCRUM-44)
 */
export function validateLessonContract(lesson) {
  const errors = [];
  if (!lesson || typeof lesson !== 'object') {
    return ['Урок повинен бути об\'єктом'];
  }
  if (!lesson.id || typeof lesson.id !== 'string') errors.push(`Урок не має валідного 'id'`);
  if (!lesson.trackId || typeof lesson.trackId !== 'string') errors.push(`Урок '${lesson.id || 'unknown'}' не має 'trackId'`);
  if (typeof lesson.level !== 'number') errors.push(`Урок '${lesson.id || 'unknown'}' не має числового 'level'`);
  if (!lesson.title || typeof lesson.title !== 'string') errors.push(`Урок '${lesson.id || 'unknown'}' не має 'title'`);
  if (!lesson.summary || typeof lesson.summary !== 'string') errors.push(`Урок '${lesson.id || 'unknown'}' не має 'summary'`);
  if (!Array.isArray(lesson.prerequisites)) errors.push(`Урок '${lesson.id || 'unknown'}' повинен містити масив 'prerequisites'`);
  if (!Array.isArray(lesson.acceptanceCriteria) || lesson.acceptanceCriteria.length === 0) {
    errors.push(`Урок '${lesson.id || 'unknown'}' повинен містити хоча б один 'acceptanceCriteria'`);
  }
  if (!Array.isArray(lesson.requiredEvidence) || lesson.requiredEvidence.length === 0) {
    errors.push(`Урок '${lesson.id || 'unknown'}' повинен містити масив 'requiredEvidence'`);
  }
  return errors;
}
