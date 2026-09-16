/**
 * Duck Verse Academy — System Design & Architecture Decision Records (ADR)
 * Модуль стандартизації системного дизайну, доменних меж та чекпойнту архітектурного рев'ю.
 */

export const DOMAIN_BOUNDARIES = {
  hub: {
    id: 'hub',
    name: 'Hub & Showcase UI',
    description: 'Головна вітрина, каталог ігор, фільтри жанрів, модальні вікна, налаштування та магазин скінів.',
    path: 'app/page.js, components/*',
    responsibilities: [
      'Каталог та запуск ігор',
      'Керування звуковим супроводом та монетами',
      'Швидка навігація до Duck Academy'
    ],
    allowedIncoming: ['auth', 'data'],
    allowedOutgoing: ['games', 'academy'],
    latencySlaMs: 50
  },
  games: {
    id: 'games',
    name: 'Games Engine (Canvas 2D)',
    description: 'Ізольовані ігрові рушії на HTML5 Canvas 2D із Web Audio API (60 FPS, фізика куба, колізії).',
    path: 'public/games/*, public/audio.js',
    responsibilities: [
      '60 FPS ігровий цикл без блокування React DOM',
      'Синхронізація звуку 130 BPM',
      'Емісія очок та подій Game Over'
    ],
    allowedIncoming: ['hub'],
    allowedOutgoing: ['data'],
    fpsTarget: 60
  },
  academy: {
    id: 'academy',
    name: 'Duck Academy (EdTech Engine)',
    description: 'Навчальний портал із прогресом рівнів (L0-L9), рубрикою ментора, чекпойнтами та сертифікатами.',
    path: 'app/academy/*, lib/academy/*',
    responsibilities: [
      'Реєстр навчальних курсів та критеріїв прийому',
      'Рубрика оцінювання ментора (24/30 балів)',
      'Capstone пайплайн якості та видача дипломів'
    ],
    allowedIncoming: ['hub', 'auth', 'data', 'integrations'],
    allowedOutgoing: ['auth', 'data', 'integrations'],
    latencySlaMs: 100
  },
  auth: {
    id: 'auth',
    name: 'Auth & Security (RBAC)',
    description: 'Керування безпекою, HMAC-SHA256 сесіями, ролями (student, mentor, admin) та запобігання ескалації.',
    path: 'lib/academy/auth/*, app/api/academy/auth/*',
    responsibilities: [
      'Криптографічний підпис та верифікація сесій',
      'Контроль доступу на основі ролей (RBAC)',
      'Аудит та захист від підробки cookie'
    ],
    allowedIncoming: ['hub', 'academy'],
    allowedOutgoing: [],
    securityLevel: 'High'
  },
  data: {
    id: 'data',
    name: 'Data & Persistence',
    description: 'Збереження прогресу, рекорди лідерборду (Scores API) та кешування стану.',
    path: 'app/api/scores/*, lib/academy/capstone/workflow.js',
    responsibilities: [
      'REST API лідерборду очок',
      'Збереження прогресу навчання та дипломів',
      'Захист від невалідних форматів запитів'
    ],
    allowedIncoming: ['hub', 'games', 'academy'],
    allowedOutgoing: [],
    backupStrategy: 'Atomic in-memory + local storage mirror'
  },
  integrations: {
    id: 'integrations',
    name: 'Integrations (Jira / GitHub / CI)',
    description: 'Інтеграційні адаптери для Atlassian Jira Cloud REST API, GitHub PR та Vercel CI/CD.',
    path: 'lib/academy/integrations/*, jira_helper.py',
    responsibilities: [
      'Перевірка статусу завдань Jira (SCRUM-XX)',
      'Валідація Pull Request та CI білдів GitHub',
      'Кешування відповідей зовнішніх сервісів'
    ],
    allowedIncoming: ['academy'],
    allowedOutgoing: ['external-apis'],
    timeoutMs: 3000
  }
};

export const ADR_REGISTRY = [
  {
    id: 'ADR-001',
    title: 'Duck Academy Curriculum Architecture & Registry Pattern',
    status: 'Accepted',
    owner: 'Yarik0505',
    date: '2026-09-16',
    jiraKey: 'SCRUM-56',
    filePath: 'docs/adr/ADR-001-academy-architecture.md',
    domains: ['academy', 'hub'],
    summary: 'Впровадження декларативного реєстру курсів із типізацією рівнів L0-L9 та захистом від циклічних пререквізитів.',
    rejectedOptions: [
      'Збереження структури курсів у зовнішній базі даних (відхилено через мережевий оверхед на етапі запуску)'
    ],
    rollbackPlan: 'Instant Vercel Rollback до попереднього стабільного коміту.'
  },
  {
    id: 'ADR-002',
    title: 'Duck Verse System Design & Domain Boundaries',
    status: 'Accepted',
    owner: 'Yarik0505',
    date: '2026-09-16',
    jiraKey: 'SCRUM-66',
    filePath: 'docs/adr/ADR-002-system-design-domain-boundaries.md',
    domains: ['hub', 'games', 'academy', 'auth', 'data', 'integrations'],
    summary: 'Визначення меж 6 доменів, C4 діаграми, відокремлення Canvas 60 FPS від React Virtual DOM та модульний App Router.',
    rejectedOptions: [
      'Single-Bundle React SPA (відхилено через падіння FPS при рендері Canvas)',
      'Розподілені Docker-мікросервіси (відхилено через надмірну вартість та devops-складність)'
    ],
    rollbackPlan: 'Feature Flag вимкнення нових доменних компонентів або перемикання Vercel deployment alias.'
  }
];

/**
 * Валідує структуру документа ADR
 */
export function validateAdrStructure(adr) {
  const errors = [];

  if (!adr.id || !adr.id.startsWith('ADR-')) {
    errors.push('Ідентифікатор має починатися з ADR- (наприклад ADR-003)');
  }
  if (!adr.title || adr.title.length < 5) {
    errors.push('Назва ADR має містити щонайменше 5 символів');
  }
  if (!['Proposed', 'Accepted', 'Rejected', 'Superseded'].includes(adr.status)) {
    errors.push('Невалідний статус ADR (дозволені: Proposed, Accepted, Rejected, Superseded)');
  }
  if (!adr.owner) {
    errors.push('Обов’язково вказати власника (owner)');
  }
  if (!adr.jiraKey || !adr.jiraKey.startsWith('SCRUM-')) {
    errors.push('Обов’язково зв’язати ADR із задачею Jira (SCRUM-XX)');
  }
  if (!adr.domains || !Array.isArray(adr.domains) || adr.domains.length === 0) {
    errors.push('Необхідно вказати хоча б один домен із списку доменних меж');
  }
  if (!adr.rejectedOptions || adr.rejectedOptions.length === 0) {
    errors.push('Обов’язково описати відхилені варіанти (rejected options) та причини відхилення');
  }
  if (!adr.rollbackPlan || adr.rollbackPlan.length < 10) {
    errors.push('План відкату (rollback plan) має містити конкретну стратегію');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Автоматизований Architecture Review Checkpoint для senior-фіч
 */
export function runArchitectureReviewCheckpoint(proposal = {}) {
  const checks = [];

  // 1. Jira Task Link Check
  const hasJira = Boolean(proposal.jiraKey && proposal.jiraKey.match(/^SCRUM-\d+$/));
  checks.push({
    id: 'jira_link',
    label: 'Зв’язок із Jira задачею (SCRUM-XX)',
    passed: hasJira,
    weight: 15,
    message: hasJira ? `Прив’язано до задачі ${proposal.jiraKey}` : 'Відсутній або невалідний ключ задачі Jira'
  });

  // 2. Domain Boundaries Defined Check
  const validDomains = Object.keys(DOMAIN_BOUNDARIES);
  const selectedDomains = proposal.domains || [];
  const hasDomains = selectedDomains.length > 0 && selectedDomains.every(d => validDomains.includes(d));
  checks.push({
    id: 'domain_boundaries',
    label: 'Чіткі доменні межі (Domain Boundaries)',
    passed: hasDomains,
    weight: 20,
    message: hasDomains
      ? `Задіяні домени: ${selectedDomains.join(', ')}`
      : 'Необхідно обрати валідні домени (hub, games, academy, auth, data, integrations)'
  });

  // 3. Security & RBAC Evaluation
  const hasSecurity = Boolean(proposal.securityImpact && proposal.securityImpact.length >= 10);
  checks.push({
    id: 'security_audit',
    label: 'Оцінка безпеки та захист сесій/RBAC',
    passed: hasSecurity,
    weight: 20,
    message: hasSecurity ? 'Вплив на безпеку враховано та описано' : 'Не описано вплив на безпеку (RBAC, валідація, шифрування)'
  });

  // 4. Performance & SLA Impact
  const hasPerformance = Boolean(proposal.performanceImpact && proposal.performanceImpact.length >= 10);
  checks.push({
    id: 'performance_sla',
    label: 'Оцінка продуктивності та дотримання SLA',
    passed: hasPerformance,
    weight: 15,
    message: hasPerformance ? 'Метрики продуктивності та SLA зафіксовано' : 'Не надано оцінки впливу на FPS/латентність/SLA'
  });

  // 5. Rejected Alternatives & Trade-offs
  const hasTradeoffs = Boolean(proposal.rejectedAlternatives && proposal.rejectedAlternatives.length >= 10);
  checks.push({
    id: 'rejected_alternatives',
    label: 'Аналіз відхилених альтернатив та компромісів',
    passed: hasTradeoffs,
    weight: 15,
    message: hasTradeoffs ? 'Альтернативні варіанти розглянуто та обґрунтовано відхилено' : 'Не вказано відхилені альтернативи та компроміси'
  });

  // 6. Rollback Strategy
  const hasRollback = Boolean(proposal.rollbackStrategy && proposal.rollbackStrategy.length >= 10);
  checks.push({
    id: 'rollback_strategy',
    label: 'Стратегія миттєвого відкату (Rollback Strategy)',
    passed: hasRollback,
    weight: 15,
    message: hasRollback ? 'План відкату затверджено' : 'Відсутня конкретна стратегія відкату у разі збою'
  });

  // Обчислення сумарного балу
  const score = checks.reduce((sum, c) => sum + (c.passed ? c.weight : 0), 0);
  const maxScore = 100;
  const passed = score >= 80; // Поріг схвалення архітектурного чекпойнта: 80/100

  const recommendations = [];
  if (!hasJira) recommendations.push('Створіть або прив’яжіть задачу в Jira перед проходженням рев’ю.');
  if (!hasDomains) recommendations.push('Визначте, які з 6 доменів платформи зазнають змін.');
  if (!hasSecurity) recommendations.push('Опишіть рівень привілеїв, захист від підробки та перевірку прав доступу.');
  if (!hasPerformance) recommendations.push('Вкажіть очікуваний вплив на швидкість завантаження сторінки або FPS гри.');
  if (!hasTradeoffs) recommendations.push('Наведіть щонайменше один альтернативний варіант, який було відхилено, та чому.');
  if (!hasRollback) recommendations.push('Зафіксуйте процедуру відкату (Feature flag, git revert або Vercel rollback).');

  return {
    approved: passed,
    score,
    maxScore,
    checks,
    recommendations,
    reviewedAt: new Date().toISOString(),
    verdict: passed ? 'СХВАЛЕНО (Approved for Implementation)' : 'ПОТРЕБУЄ ДООПРАЦЮВАННЯ (Revisions Required)'
  };
}
