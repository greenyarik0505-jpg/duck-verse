/**
 * Duck Academy — Content Versioning & Publishing Workflow (SCRUM-84)
 * 
 * Керування навчальним контентом як production-системою:
 * 1. Життєвий цикл: DRAFT -> IN_REVIEW -> APPROVED -> PUBLISHED / SCHEDULED -> DEPRECATED / ARCHIVED.
 * 2. Quality Gates: links, code snippets, acceptance criteria, Jira keys, metadata.
 * 3. Reviewer Approval: заборона самосхвалення автором (Separation of Duties).
 * 4. Content Diff & Downstream Impact (Affected Lessons).
 * 5. Rollback: відкат до стабільних версій зі збереженням студентського прогресу.
 * 6. Deprecation: міграційні шляхи для застарілих уроків.
 * 7. Audit Trail: фіксація дій author, reviewer, publisher, timestamp.
 */

import { CURRICULUM_REGISTRY } from '../registry.js';
import { ACADEMY_ROLES } from '../auth/roles.js';

export const CONTENT_STATES = {
  DRAFT: 'draft',
  IN_REVIEW: 'in_review',
  APPROVED: 'approved',
  SCHEDULED: 'scheduled',
  PUBLISHED: 'published',
  DEPRECATED: 'deprecated',
  ARCHIVED: 'archived',
};

// In-memory сховище версій уроків та аудит-трейлу
const contentVersionStore = new Map();
const auditLogStore = [];

/**
 * Ініціалізація початкових версій контенту з CURRICULUM_REGISTRY
 */
function initLessonStore(lessonId) {
  if (contentVersionStore.has(lessonId)) {
    return contentVersionStore.get(lessonId);
  }

  const baseLesson = CURRICULUM_REGISTRY.find(l => l.id === lessonId);
  const initialVersion = '1.0.0';
  const initialRecord = {
    lessonId,
    activeVersion: initialVersion,
    status: baseLesson ? (baseLesson.status || CONTENT_STATES.PUBLISHED) : CONTENT_STATES.PUBLISHED,
    versions: [
      {
        version: initialVersion,
        status: CONTENT_STATES.PUBLISHED,
        publishedAt: '2026-09-01T00:00:00.000Z',
        author: { id: 'team_lead_yarik', username: 'Yarik0505', role: ACADEMY_ROLES.ADMIN },
        reviewer: { id: 'mentor_dima', username: 'admin_dima', role: ACADEMY_ROLES.ADMIN },
        data: baseLesson ? { ...baseLesson } : { id: lessonId, title: 'Lesson', prerequisites: [], acceptanceCriteria: [] },
      }
    ],
    drafts: [],
    deprecation: null,
  };

  contentVersionStore.set(lessonId, initialRecord);
  return initialRecord;
}

// Попередня ініціалізація для всіх уроків реєстру
for (const lesson of CURRICULUM_REGISTRY) {
  initLessonStore(lesson.id);
}

/**
 * Запис події в аудит-трейл
 */
function recordAudit({ action, lessonId, version, actor, reviewer = null, reason = null, details = {} }) {
  const entry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    action,
    lessonId,
    version,
    actor: {
      id: actor?.id || 'unknown',
      username: actor?.username || 'Unknown',
      role: actor?.role || 'guest',
    },
    reviewer: reviewer ? {
      id: reviewer.id,
      username: reviewer.username,
      role: reviewer.role,
    } : null,
    reason,
    details,
  };
  auditLogStore.unshift(entry);
  return entry;
}

/**
 * Оцінка Quality Gates для навчального контенту
 *
 * @param {Object} content Контент уроку
 * @returns {{ passed: boolean, gates: Object, errors: string[] }}
 */
export function validateQualityGates(content) {
  const errors = [];
  const gates = {
    links: true,
    codeSnippets: true,
    criteria: true,
    jiraKey: true,
    metadata: true,
  };

  // 1. Перевірка назви та опису (Metadata)
  if (!content.title || typeof content.title !== 'string' || content.title.trim().length < 5) {
    gates.metadata = false;
    errors.push('Заголовок уроку (title) повинен містити щонайменше 5 символів.');
  }
  if (!content.summary || typeof content.summary !== 'string' || content.summary.trim().length < 15) {
    gates.metadata = false;
    errors.push('Опис уроку (summary) повинен містити щонайменше 15 символів.');
  }

  // 2. Перевірка критеріїв прийому (Acceptance Criteria >= 2)
  if (!Array.isArray(content.acceptanceCriteria) || content.acceptanceCriteria.length < 2) {
    gates.criteria = false;
    errors.push('Урок повинен мати щонайменше 2 чіткі критерії прийому (acceptanceCriteria).');
  }

  // 3. Перевірка валідності Jira ключа (формат SCRUM-XX)
  if (!content.jiraKey || !/^SCRUM-\d+$/.test(content.jiraKey)) {
    gates.jiraKey = false;
    errors.push(`Ключ Jira повинен відповідати формату SCRUM-XX (отримано: ${content.jiraKey}).`);
  }

  // 4. Перевірка посилань на безпеку та валідність (без javascript: / порожніх href)
  if (content.links && Array.isArray(content.links)) {
    for (const link of content.links) {
      if (!link.url || link.url.startsWith('javascript:') || link.url.includes('<script>')) {
        gates.links = false;
        errors.push(`Виявлено небезпечне або некоректне посилання: ${link.url}`);
        break;
      }
    }
  }

  // 5. Перевірка прикладів коду (якщо передані)
  if (content.codeSnippets && Array.isArray(content.codeSnippets)) {
    for (const snippet of content.codeSnippets) {
      if (!snippet.code || snippet.code.trim().length === 0) {
        gates.codeSnippets = false;
        errors.push('Приклади коду (codeSnippets) не можуть бути порожніми.');
        break;
      }
    }
  }

  const passed = Object.values(gates).every(Boolean);
  return { passed, gates, errors };
}

/**
 * Розрахунок різниці між версіями контенту (Content Diff)
 */
export function calculateContentDiff(oldVersionData = {}, newVersionData = {}) {
  const fields = ['title', 'summary', 'estimatedMinutes', 'prerequisites', 'acceptanceCriteria', 'jiraKey'];
  const diffs = [];

  for (const f of fields) {
    const oldVal = oldVersionData[f];
    const newVal = newVersionData[f];
    const isDifferent = JSON.stringify(oldVal) !== JSON.stringify(newVal);

    if (isDifferent) {
      diffs.push({
        field: f,
        oldValue: oldVal !== undefined ? oldVal : null,
        newValue: newVal !== undefined ? newVal : null,
      });
    }
  }

  return {
    hasChanges: diffs.length > 0,
    diffCount: diffs.length,
    diffs,
  };
}

/**
 * Пошук уроків, що залежать від зміненого (Affected Downstream Lessons)
 */
export function findAffectedDownstreamLessons(lessonId, curriculum = CURRICULUM_REGISTRY) {
  return curriculum
    .filter(l => Array.isArray(l.prerequisites) && l.prerequisites.includes(lessonId))
    .map(l => ({
      id: l.id,
      title: l.title,
      level: l.level,
      jiraKey: l.jiraKey,
    }));
}

/**
 * Створення нового драфту версії уроку
 */
export function createDraft({ lessonId, updates = {}, author }) {
  if (!lessonId) throw new Error('lessonId обов\'язковий');
  if (!author || !author.id) throw new Error('author обов\'язковий');

  const record = initLessonStore(lessonId);
  const activeVerObj = record.versions.find(v => v.version === record.activeVersion) || record.versions[0];
  const baseData = activeVerObj ? activeVerObj.data : {};

  // Формування нової чернетки
  const draftVersion = `draft-${Date.now()}`;
  const proposedData = {
    ...baseData,
    ...updates,
    id: lessonId,
  };

  const draftObj = {
    draftId: `draft-${lessonId}-${Date.now()}`,
    lessonId,
    draftVersion,
    status: CONTENT_STATES.DRAFT,
    createdAt: new Date().toISOString(),
    author: {
      id: author.id,
      username: author.username || 'Author',
      role: author.role || ACADEMY_ROLES.CHILD,
    },
    reviewer: null,
    data: proposedData,
    qualityGates: validateQualityGates(proposedData),
  };

  record.drafts.push(draftObj);
  recordAudit({
    action: 'CREATE_DRAFT',
    lessonId,
    version: draftVersion,
    actor: author,
    details: { draftId: draftObj.draftId },
  });

  return draftObj;
}

/**
 * Відправка драфту на рев'ю (Transition to IN_REVIEW)
 */
export function submitForReview({ lessonId, draftId, actor }) {
  const record = initLessonStore(lessonId);
  const draft = record.drafts.find(d => d.draftId === draftId);
  if (!draft) throw new Error(`Драфт з ID ${draftId} не знайдено`);

  // Обов'язкова перевірка Quality Gates
  const qg = validateQualityGates(draft.data);
  draft.qualityGates = qg;

  if (!qg.passed) {
    const errorMsg = `Quality Gates не пройдено: ${qg.errors.join('; ')}`;
    const err = new Error(errorMsg);
    err.code = 'QUALITY_GATES_FAILED';
    err.errors = qg.errors;
    throw err;
  }

  draft.status = CONTENT_STATES.IN_REVIEW;
  recordAudit({
    action: 'SUBMIT_FOR_REVIEW',
    lessonId,
    version: draft.draftVersion,
    actor,
    details: { draftId },
  });

  return draft;
}

/**
 * Схвалення драфту рев'ювером (Transition to APPROVED)
 * ВИМОГА: Separation of duties — автор не може схвалити власний драфт!
 */
export function approveDraft({ lessonId, draftId, reviewer }) {
  if (!reviewer || !reviewer.id) throw new Error('reviewer обов\'язковий');
  
  // Дозвіл схвалювати мають тільки ментори або адміни
  const allowedRoles = [ACADEMY_ROLES.MENTOR, ACADEMY_ROLES.ADMIN];
  if (!allowedRoles.includes(reviewer.role)) {
    throw new Error('Тільки ментори або адміністратори мають право схвалювати навчальний контент');
  }

  const record = initLessonStore(lessonId);
  const draft = record.drafts.find(d => d.draftId === draftId);
  if (!draft) throw new Error(`Драфт з ID ${draftId} не знайдено`);

  if (draft.status !== CONTENT_STATES.IN_REVIEW) {
    throw new Error(`Драфт повинен мати статус in_review для схвалення (поточний: ${draft.status})`);
  }

  // Захист від самосхвалення автором (Separation of duties)
  if (draft.author.id === reviewer.id) {
    const err = new Error('Автор контенту не може схвалити власний драфт (вимога Separation of Duties)');
    err.code = 'AUTHOR_CANNOT_APPROVE';
    throw err;
  }

  draft.status = CONTENT_STATES.APPROVED;
  draft.reviewer = {
    id: reviewer.id,
    username: reviewer.username,
    role: reviewer.role,
  };
  draft.approvedAt = new Date().toISOString();

  recordAudit({
    action: 'APPROVE_CONTENT',
    lessonId,
    version: draft.draftVersion,
    actor: reviewer,
    reviewer,
    details: { draftId },
  });

  return draft;
}

/**
 * Публікація схваленого контенту (PUBLISHED або SCHEDULED)
 */
export function publishContent({ lessonId, draftId, publisher, scheduleAt = null }) {
  const record = initLessonStore(lessonId);
  const draft = record.drafts.find(d => d.draftId === draftId);
  if (!draft) throw new Error(`Драфт з ID ${draftId} не знайдено`);

  if (draft.status !== CONTENT_STATES.APPROVED) {
    throw new Error(`Можна публікувати лише схвалений контент (поточний статус: ${draft.status})`);
  }

  const now = new Date();
  const isScheduled = scheduleAt && new Date(scheduleAt) > now;

  // Визначення нової семантичної версії (наприклад v1.1.0)
  const currentVerParts = record.activeVersion.split('.').map(Number);
  const nextVersion = `${currentVerParts[0]}.${currentVerParts[1] + 1}.0`;

  if (isScheduled) {
    draft.status = CONTENT_STATES.SCHEDULED;
    draft.scheduleAt = scheduleAt;
    recordAudit({
      action: 'SCHEDULE_PUBLISH',
      lessonId,
      version: nextVersion,
      actor: publisher,
      details: { scheduleAt, draftId },
    });
    return { status: CONTENT_STATES.SCHEDULED, scheduleAt, version: nextVersion };
  }

  // Миттєва публікація
  const publishedVersionObj = {
    version: nextVersion,
    status: CONTENT_STATES.PUBLISHED,
    publishedAt: now.toISOString(),
    author: draft.author,
    reviewer: draft.reviewer,
    publisher: {
      id: publisher.id,
      username: publisher.username,
      role: publisher.role,
    },
    data: draft.data,
  };

  record.versions.unshift(publishedVersionObj);
  record.activeVersion = nextVersion;
  record.status = CONTENT_STATES.PUBLISHED;

  // Видалення драфту зі списку активних після публікації
  record.drafts = record.drafts.filter(d => d.draftId !== draftId);

  recordAudit({
    action: 'PUBLISH_CONTENT',
    lessonId,
    version: nextVersion,
    actor: publisher,
    reviewer: draft.reviewer,
    details: { draftId, publishedVersion: nextVersion },
  });

  return publishedVersionObj;
}

/**
 * Відкат до попередньої стабільної версії (Rollback)
 * ВИМОГА: Зберігає виконаний студентський прогрес та історію свідчень!
 */
export function rollbackLesson({ lessonId, targetVersion, actor, reason = 'Rollback to stable version' }) {
  const record = initLessonStore(lessonId);
  const targetVerObj = record.versions.find(v => v.version === targetVersion);
  if (!targetVerObj) {
    throw new Error(`Версію ${targetVersion} не знайдено в історії уроку ${lessonId}`);
  }

  const previousActive = record.activeVersion;
  record.activeVersion = targetVersion;
  record.status = CONTENT_STATES.PUBLISHED;

  recordAudit({
    action: 'ROLLBACK_CONTENT',
    lessonId,
    version: targetVersion,
    actor,
    reason,
    details: { fromVersion: previousActive, toVersion: targetVersion },
  });

  return {
    success: true,
    lessonId,
    rolledBackTo: targetVersion,
    fromVersion: previousActive,
    activeData: targetVerObj.data,
  };
}

/**
 * Позначення уроку як застарілого (Deprecation) з міграційним шляхом
 */
export function deprecateLesson({ lessonId, actor, reason = 'Lesson replaced', replacementLessonId = null }) {
  const record = initLessonStore(lessonId);
  record.status = CONTENT_STATES.DEPRECATED;
  record.deprecation = {
    deprecatedAt: new Date().toISOString(),
    deprecatedBy: actor?.username || 'Admin',
    reason,
    replacementLessonId,
  };

  recordAudit({
    action: 'DEPRECATE_LESSON',
    lessonId,
    version: record.activeVersion,
    actor,
    reason,
    details: { replacementLessonId },
  });

  return {
    success: true,
    lessonId,
    status: CONTENT_STATES.DEPRECATED,
    deprecation: record.deprecation,
  };
}

/**
 * Отримання навчальної програми, доступної учням
 * ВИМОГА: Учні НІКОЛИ не бачать неперевірені чернетки (DRAFT / IN_REVIEW)!
 */
export function getStudentVisibleCurriculum(userRole = ACADEMY_ROLES.CHILD) {
  const isPrivileged = [ACADEMY_ROLES.MENTOR, ACADEMY_ROLES.ADMIN].includes(userRole);
  const visible = [];

  for (const baseLesson of CURRICULUM_REGISTRY) {
    const record = contentVersionStore.get(baseLesson.id);
    if (!record) {
      visible.push(baseLesson);
      continue;
    }

    // Якщо роль учня чи гостя, показуємо ТІЛЬКИ опубліковані чи депрековані
    if (!isPrivileged) {
      if (record.status === CONTENT_STATES.PUBLISHED || record.status === CONTENT_STATES.DEPRECATED) {
        const activeVerObj = record.versions.find(v => v.version === record.activeVersion);
        visible.push({
          ...(activeVerObj ? activeVerObj.data : baseLesson),
          version: record.activeVersion,
          contentStatus: record.status,
          deprecation: record.deprecation,
        });
      }
    } else {
      // Ментори та адміни бачать всі версії з їхніми статусами
      const activeVerObj = record.versions.find(v => v.version === record.activeVersion);
      visible.push({
        ...(activeVerObj ? activeVerObj.data : baseLesson),
        version: record.activeVersion,
        contentStatus: record.status,
        draftsCount: record.drafts.length,
        deprecation: record.deprecation,
      });
    }
  }

  return visible;
}

/**
 * Отримання повного стану версій та аудит-логу уроку
 */
export function getLessonContentDetails(lessonId) {
  const record = initLessonStore(lessonId);
  const affected = findAffectedDownstreamLessons(lessonId);
  const audits = auditLogStore.filter(a => a.lessonId === lessonId);

  return {
    lessonId,
    activeVersion: record.activeVersion,
    status: record.status,
    versions: record.versions,
    drafts: record.drafts,
    deprecation: record.deprecation,
    affectedLessons: affected,
    auditTrail: audits,
  };
}

/**
 * Отримання повного аудит-логу системи публікацій
 */
export function getFullPublishAuditLog(limit = 50) {
  return auditLogStore.slice(0, limit);
}
