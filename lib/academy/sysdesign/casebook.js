/**
 * Senior Lab Architecture Trade-Off Casebook & ADR Review
 * 
 * Teaches senior engineering judgment:
 * - Real-world architectural trade-offs across Cost, Risk, Complexity, and Reversibility.
 * - Mentor review evaluates reasoning quality rather than a single dogmatic answer.
 * - Lineage tracking for Accepted and Superseded ADRs linked to Jira & code evidence.
 */

export const TRADE_OFF_DIMENSIONS = {
  COST: {
    id: 'cost',
    name: 'Infrastructure & Operational Cost',
    nameUk: 'Фінансова та операційна вартість',
    description: '1 = Безкоштовно / мінімальні ресурси; 5 = Дорога хмарна інфраструктура чи сторонні підписки.',
    min: 1,
    max: 5,
  },
  RISK: {
    id: 'risk',
    name: 'Security & Stability Risk',
    nameUk: 'Ризик безпеки та надійності',
    description: '1 = Низький ризик витоків чи крашів; 5 = Критичний ризик розкриття PII, простоїв або XSS.',
    min: 1,
    max: 5,
  },
  COMPLEXITY: {
    id: 'complexity',
    name: 'Architectural & Cognitive Complexity',
    nameUk: 'Архітектурна та когнітивна складність',
    description: '1 = Простий та читабельний код; 5 = Важка оркестрація, розподілений стан, високий поріг входу.',
    min: 1,
    max: 5,
  },
  REVERSIBILITY: {
    id: 'reversibility',
    name: 'Reversibility (Two-Way vs One-Way Door)',
    nameUk: 'Реверсивність (Легкість відкату)',
    description: '1 = Легкий відкат без міграції даних (двосторонні двері); 5 = Незворотний вендор-лок або втрата даних.',
    min: 1,
    max: 5,
  },
};

export const MENTOR_RUBRIC_CRITERIA = {
  contextUnderstanding: {
    id: 'contextUnderstanding',
    nameUk: 'Розуміння контексту та обмежень',
    description: 'Чи враховано реальні обмеження продукту (COPPA, 60 FPS, Vercel Serverless, бюджет)?',
    maxScore: 5,
  },
  tradeOffAwareness: {
    id: 'tradeOffAwareness',
    nameUk: 'Усвідомлення компромісів (Trade-offs)',
    description: 'Чи чесно визначено мінуси обраного варіанту та чи порівняно його з альтернативами?',
    maxScore: 5,
  },
  reversibilityDesign: {
    id: 'reversibilityDesign',
    nameUk: 'Дизайн реверсивності та відкату',
    description: 'Чи спроектовано рішення як «двосторонні двері» з чітким планом відкату (Rollback Plan)?',
    maxScore: 5,
  },
  consequenceMitigation: {
    id: 'consequenceMitigation',
    nameUk: 'Нівелювання негативних наслідків',
    description: 'Які заходи впроваджено для пом’якшення відомих недоліків обраної архітектури?',
    maxScore: 5,
  },
  evidenceGrounding: {
    id: 'evidenceGrounding',
    nameUk: 'Обґрунтування на основі доказів',
    description: 'Чи спирається аргументація на бенчмарки, метрики або код, а не на абстрактну догму?',
    maxScore: 5,
  },
};

export const PASSING_SCORE_THRESHOLD = 18; // 18 out of 25

export const ARCHITECTURE_CASES = [
  {
    id: 'case-canvas-loop',
    titleUk: '60 FPS Canvas Ігровий Цикл проти React Virtual DOM',
    category: 'Rendering & Performance',
    jiraKey: 'SCRUM-66',
    codeEvidence: 'public/games/game_geometry_dash.js',
    problemStatement: 'Ігровий рушій Geometry Dash вимагає стабільних 60 FPS без падіння кадрів. Безпосереднє оновлення React state (useState) на кожному кадрі перевантажує Virtual DOM та викликає зависання. Потрібно спроектувати міст між 60 FPS рушієм та UI React.',
    constraints: [
      'Стабільні 60 FPS (бюджет кадру 16.6ms)',
      'Синхронізація монет та вибраного скіна з React Hub',
      'Запобігання витокам пам’яті (Memory Leaks) при закритті модалки',
      'Заборона ручного знищення React DOM (innerHTML = "")',
    ],
    alternatives: [
      {
        id: 'alt-canvas-a',
        name: 'Direct React useState on every frame',
        nameUk: 'Прямий виклик React setState у requestAnimationFrame',
        tradeOffs: { cost: 1, risk: 4, complexity: 1, reversibility: 1 },
        pros: ['Найпростіша реалізація', 'Миттєва реактивність'],
        cons: ['Падіння FPS до 25-30', 'Масивне навантаження на React reconciler', 'Високий Garbage Collection оверхед'],
        summary: 'Неприпустимо для продакшн ігор через деградацію плавності геймплею.',
      },
      {
        id: 'alt-canvas-b',
        name: 'Autonomous Canvas Loop + Event Emitter Bridge',
        nameUk: 'Автономний Canvas 2D цикл із синтетичними подіями та Ref',
        tradeOffs: { cost: 1, risk: 1, complexity: 2, reversibility: 1 },
        pros: [
          'Стабільні 60 FPS, цикл малювання повністю ізольований від React',
          'React оновлюється лише за подіями (Game Over, Збір монети, Рекорд)',
          'Легке очищення requestAnimationFrame через ref у useEffect',
        ],
        cons: ['Потрібно вручну синхронізувати вихідні параметри через CustomEvent або Callback ref'],
        summary: 'Оптимальний компроміс для браузерних 2D ігор у Next.js.',
      },
      {
        id: 'alt-canvas-c',
        name: 'Web Worker with OffscreenCanvas & SharedArrayBuffer',
        nameUk: 'Рендеринг у Web Worker через OffscreenCanvas',
        tradeOffs: { cost: 2, risk: 3, complexity: 4, reversibility: 3 },
        pros: [
          'Головний потік браузера взагалі не бере участі в малюванні',
          'Повний імунітет до важких React-компонентів',
        ],
        cons: [
          'Обмежена підтримка в старих версіях Safari/iOS',
          'Потрібні CORS-заголовки Cross-Origin-Opener-Policy для SharedArrayBuffer',
          'Висока архітектурна складність передачі контексту аудіо та клавіатури',
        ],
        summary: 'Потужне, але надлишкове рішення для казуальних 2D аркад Duck Verse на поточному етапі.',
      },
    ],
    recommendedDecision: 'alt-canvas-b',
    consequences: {
      positive: [
        'Гарантований фреймрейт 60 FPS без лагів',
        'Повна сумісність із React 19 та Next.js 15 App Router',
        'Нуль клієнтських крашів від DOM removeChild',
      ],
      negative: [
        'Необхідність писати очищення підписок у return функції useEffect для запобігання дублюванню подій',
      ],
    },
    rollbackPlan: 'У разі виявлення проблем з подійним мостом — перемикання на спрощений callback ref через Feature Flag.',
  },
  {
    id: 'case-child-auth',
    titleUk: 'Автентифікація для дитячої платформи (COPPA & Zero-Cloud DB)',
    category: 'Identity & Security',
    jiraKey: 'SCRUM-54',
    codeEvidence: 'lib/academy/auth/session.js',
    problemStatement: 'Duck Academy призначена для дітей та підлітків. Необхідно реалізувати захищені сесії без розкриття приватних даних, без сторонніх трекерів і без значних витрат на хмарні бази даних на старті.',
    constraints: [
      'COPPA/GDPR-K комплаєнс (діти до 13 років без власних email)',
      'Захист від підробки cookie (HMAC-SHA256)',
      'Sub-millisecond валідація на Vercel Edge/Serverless',
      'Підтримка згоди батьків (Parental Consent) для активації',
    ],
    alternatives: [
      {
        id: 'alt-auth-a',
        name: 'Third-Party Social OAuth Only (Google/Discord)',
        nameUk: 'Виключно сторонній Social OAuth (Google / Discord)',
        tradeOffs: { cost: 1, risk: 4, complexity: 2, reversibility: 2 },
        pros: ['Делегування безпеки паролів гігантам індустрії', 'Не потрібно зберігати хеші паролів'],
        cons: [
          'У дітей до 13 років часто немає власного Google-акаунта',
          'Сторонні cookie відстеження суперечать дитячій приватності',
          'Блокування в навчальних закладах та шкільних мережах',
        ],
        summary: 'Неприйнятно як єдиний спосіб входу для дитячої аудиторії.',
      },
      {
        id: 'alt-auth-b',
        name: 'Stateful Redis/PostgreSQL Session Store',
        nameUk: 'Класична БД сесій (Redis / Cloud Postgres)',
        tradeOffs: { cost: 3, risk: 2, complexity: 3, reversibility: 2 },
        pros: ['Миттєве відкликання будь-якої сесії на сервері', 'Зручний аудит активних сесій'],
        cons: [
          'Додаткова вартість утримання хмарної БД від $15-30/місяць',
          'Затримка холодного старту з’єднання в serverless функціях',
          'Точка відмови: падіння бази блокує весь хаб',
        ],
        summary: 'Надійне, але надмірно ресурсозатратне рішення на фазі MVP/Bootstrapping.',
      },
      {
        id: 'alt-auth-c',
        name: 'Stateless HMAC-SHA256 Signed HTTP-Only Cookies',
        nameUk: 'Криптографічно підписані HTTP-Only Cookie з ролями та чорним списком',
        tradeOffs: { cost: 1, risk: 1, complexity: 2, reversibility: 1 },
        pros: [
          'Нульова вартість інфраструктури, повна сумісність із Serverless',
          'Sub-millisecond перевірка підпису без мережевих запитів',
          'Захист від XSS (HttpOnly, SameSite=Lax)',
          'Інтеграція з кодом підтвердження батьків (SCRUM-121)',
        ],
        cons: [
          'Відкликання сесії до закінчення терміну дії вимагає локального чорного списку або ротації секретного ключа',
        ],
        summary: 'Оптимальний баланс вартості, приватності та швидкодії для Duck Verse.',
      },
    ],
    recommendedDecision: 'alt-auth-c',
    consequences: {
      positive: [
        'Миттєвий вхід без зовнішніх залежностей',
        'Повна відповідність COPPA без стороннього трекінгу',
        'Автономна робота на безкоштовному тарифі Vercel',
      ],
      negative: [
        'Необхідність регулярної ротації SESSION_SECRET у випадку компрометації',
      ],
    },
    rollbackPlan: 'У разі компрометації підпису — миттєва інвалідація всіх куків через зміну SESSION_SECRET в Vercel Environment Variables.',
  },
  {
    id: 'case-monolith-vs-microservices',
    titleUk: 'Модульний Моноліт (Next.js App Router) проти Мікросервісів',
    category: 'System Architecture',
    jiraKey: 'SCRUM-56',
    codeEvidence: 'lib/academy/sysdesign/adr.js',
    problemStatement: 'Команда проекту складається з 3 інженерів (Yarik, Dmytro, Kyryl). Необхідно обрати архітектуру проекту: розподілені мікросервіси чи модульний моноліт із суворими доменними межами.',
    constraints: [
      'Команда з 3 розробників із високою швидкістю релізів',
      'Єдиний репозиторій GitHub із Pull Request workflow',
      'Мінімальний час на DevOps та збірку CI/CD',
      'Чіткий розподіл відповідальності за модулями',
    ],
    alternatives: [
      {
        id: 'alt-arch-a',
        name: 'Distributed Docker Microservices with gRPC',
        nameUk: 'Розподілені Docker-мікросервіси (Hub, GameEngine, Auth, Scores, Academy)',
        tradeOffs: { cost: 4, risk: 4, complexity: 5, reversibility: 4 },
        pros: ['Ізольований деплой кожного сервісу', 'Можливість писати сервіси різними мовами (Go, Rust, Node)'],
        cons: [
          'Непосильний операційний оверхед для команди з 3 людей',
          'Складність налагодження транзакцій та мережевих затримок',
          'Висока вартість хостингу Kubernetes кластера',
          'Повільний локальний цикл розробки',
        ],
        summary: 'Класичний антипатерн передчасного масштабування (Premature Microservices).',
      },
      {
        id: 'alt-arch-b',
        name: 'Modular Monolith with Domain Boundaries (Next.js App Router)',
        nameUk: 'Модульний Моноліт із доменними межами та App Router',
        tradeOffs: { cost: 1, risk: 1, complexity: 2, reversibility: 1 },
        pros: [
          'Єдиний репозиторій, атомарні коміти та миттєвий Vercel деплой',
          'Суворі межі 6 доменів (Hub, Games, Academy, Auth, Data, Integrations)',
          'Простий спільний запуск локально через `npm run dev`',
          'Швидкі unit-тести за 700ms у Node Test Runner',
        ],
        cons: [
          'Потенційний ризик порушення кордонів доменів за відсутності лінтингу імпортів',
        ],
        summary: 'Золотий стандарт інженерної ефективності для стартапу чи невеликої команди.',
      },
    ],
    recommendedDecision: 'alt-arch-b',
    consequences: {
      positive: [
        'Швидкість випуску: 25+ фіч та PR злито за кілька днів',
        '0 витрат на серверну інфраструктуру',
        'Прозорий рев’ю та спільна кодова база',
      ],
      negative: [
        'Потрібно контролювати розмір збірки та First Load JS',
      ],
    },
    rollbackPlan: 'Доменні інтерфейси спроектовані так, що будь-який домен (наприклад, Scores API) можна винести в окремий Serverless/Cloudflare Worker без зміни клієнтського контракту.',
  },
  {
    id: 'case-sandbox-runner',
    titleUk: 'Пісочниця виконання коду завдань: Browser iframe vs Server Containers',
    category: 'Security & Execution',
    jiraKey: 'SCRUM-60',
    codeEvidence: 'lib/academy/registry.js',
    problemStatement: 'Уроки Duck Academy дозволяють учням запускати код JavaScript/Canvas безпосередньо в платформі. Потрібно убезпечити платформу від зависань у нескінченних циклах та крадіжки cookie.',
    constraints: [
      'Миттєве виконання (< 50ms) без очікування черги контейнерів',
      'Ізоляція від головного документа та cookie платформи',
      'Захист від нескінченних циклів (while(true))',
      '0 витрат на сервери віртуалізації',
    ],
    alternatives: [
      {
        id: 'alt-sandbox-a',
        name: 'Isolated Server Docker/gVisor MicroVM',
        nameUk: 'Серверні контейнери ізоляції (gVisor / Firecracker)',
        tradeOffs: { cost: 4, risk: 1, complexity: 4, reversibility: 2 },
        pros: ['Максимальна ізоляція на рівні ядра ОС', 'Можливість виконувати будь-які системні команди'],
        cons: [
          'Затримка холодного старту 1.5 - 3 секунди на запуск',
          'Потребує виділених серверів з високою щомісячною платою',
          'Складна черга обробки запитів для багатьох учнів одночасно',
        ],
        summary: 'Надлишково для завдань з веб-верстки та клієнтського JavaScript.',
      },
      {
        id: 'alt-sandbox-b',
        name: 'Client-Side Sandboxed iframe with Strict CSP & Worker Watchdog',
        nameUk: 'Клієнтський ізольований iframe з суворим CSP та таймаутом',
        tradeOffs: { cost: 1, risk: 1, complexity: 2, reversibility: 1 },
        pros: [
          'Миттєвий запуск без мережевої затримки (< 20ms)',
          '0 витрат на сервери, масштабується на мільйони запусків безкоштовно',
          'Суворі атрибути sandbox="allow-scripts" без allow-same-origin унеможливлюють доступ до cookie чи localStorage',
          'Сторожовий таймер перехоплює нескінченні цикли',
        ],
        cons: [
          'Обмежено виконанням лише браузерного JS/Canvas без нативних C++ бібліотек',
        ],
        summary: 'Безпечне, швидке та економічно бездоганне рішення для Duck Academy.',
      },
    ],
    recommendedDecision: 'alt-sandbox-b',
    consequences: {
      positive: [
        'Миттєвий фідбек для учня при натисканні «Запустити код»',
        'Абсолютна безпека сесій та cookie учня',
      ],
      negative: [
        'Завдання бекенд-курсу з прямою роботою з сокетами потребують моків/симуляцій замість реального POSIX сокету',
      ],
    },
    rollbackPlan: 'Можливість підключення зовнішнього сервера компіляції за потреби для спеціалізованих мов (Rust/C++) через абстракцію ExecutionAdapter.',
  },
];

export const INITIAL_ADR_REGISTRY = [
  {
    id: 'ADR-001',
    caseId: 'case-monolith-vs-microservices',
    title: 'Duck Academy Curriculum Architecture & Registry Pattern',
    status: 'Accepted',
    owner: 'Yarik0505',
    date: '2026-09-16',
    jiraKey: 'SCRUM-56',
    codeEvidence: 'lib/academy/registry.js',
    selectedAlternative: 'alt-arch-b',
    tradeOffScores: { cost: 1, risk: 1, complexity: 2, reversibility: 1 },
    decision: 'Впровадження декларативного реєстру курсів та модульного моноліту з App Router замість розподілених мікросервісів.',
    rationale: 'Команді з 3 людей критично зберігати високу швидкість та відсутність мережевих затримок між модулями.',
    consequences: {
      positive: ['Атомарні білди', '0 витрат на хостинг', 'Простий рефакторинг'],
      negative: ['Необхідність суворого дотримання доменних меж'],
    },
    rollbackPlan: 'Instant Vercel Rollback або винесення API маршрутів в окремі serverless handlers.',
    supersededBy: null,
    mentorReview: {
      reviewer: 'Степаненко Дмитро (Lead Mentor)',
      score: 24,
      passed: true,
      feedback: 'Зріле інженерне обґрунтування. Розумне уникнення передчасних мікросервісів для команди з 3 людей.',
      date: '2026-09-16T15:00:00.000Z',
    },
  },
  {
    id: 'ADR-002',
    caseId: 'case-canvas-loop',
    title: 'Duck Verse 60 FPS Canvas Game Engine Isolation',
    status: 'Accepted',
    owner: 'Yarik0505',
    date: '2026-09-16',
    jiraKey: 'SCRUM-66',
    codeEvidence: 'public/games/game_geometry_dash.js',
    selectedAlternative: 'alt-canvas-b',
    tradeOffScores: { cost: 1, risk: 1, complexity: 2, reversibility: 1 },
    decision: 'Відокремлення 60 FPS Canvas циклу від React Virtual DOM з подійною синхронізацією очок та монет.',
    rationale: 'React setState у кожному кадрі призводив до 30 FPS. Автономний цикл гарантує плавний геймплей.',
    consequences: {
      positive: ['60 FPS без лагів', 'Ізоляція пам’яті'],
      negative: ['Потрібні явні clean-up хендлери у useEffect'],
    },
    rollbackPlan: 'Feature flag перемикання на спрощений рендер у разі збоїв браузерного Canvas.',
    supersededBy: null,
    mentorReview: {
      reviewer: 'Кирил Пушкарук (Audio & Engine Lead)',
      score: 25,
      passed: true,
      feedback: 'Ідеальне вирішення проблеми GC-пауз та синхронізації 130 BPM аудіорушія.',
      date: '2026-09-16T18:00:00.000Z',
    },
  },
  {
    id: 'ADR-000-LEGACY',
    caseId: 'case-child-auth',
    title: 'Legacy In-Memory Plain Auth Session Prototype',
    status: 'Superseded',
    owner: 'Yarik0505',
    date: '2026-09-10',
    jiraKey: 'SCRUM-53',
    codeEvidence: 'lib/academy/auth/store.js',
    selectedAlternative: 'alt-auth-a',
    tradeOffScores: { cost: 1, risk: 4, complexity: 1, reversibility: 1 },
    decision: 'Тимчасовий прототип авторизації у пам’яті процесу без криптографічного HMAC підпису.',
    rationale: 'Швидкий MVP прототип для перевірки базового інтерфейсу входу.',
    consequences: {
      positive: ['Швидкість прототипування'],
      negative: ['Втрата сесії при перезапуску сервера', 'Ризик підробки cookie'],
    },
    rollbackPlan: 'Замінено на криптографічний HMAC-SHA256 підпис у ADR-003.',
    supersededBy: 'ADR-003',
    mentorReview: {
      reviewer: 'Степаненко Дмитро (Lead Mentor)',
      score: 16,
      passed: false,
      feedback: 'Працює як прототип, але не готове до продакшену. Обов’язково замінити на криптографічно стійке рішення.',
      date: '2026-09-11T10:00:00.000Z',
    },
  },
  {
    id: 'ADR-003',
    caseId: 'case-child-auth',
    title: 'Child-Safe Cryptographic HMAC-SHA256 Sessions',
    status: 'Accepted',
    owner: 'Yarik0505',
    date: '2026-09-16',
    jiraKey: 'SCRUM-54',
    codeEvidence: 'lib/academy/auth/session.js',
    selectedAlternative: 'alt-auth-c',
    tradeOffScores: { cost: 1, risk: 1, complexity: 2, reversibility: 1 },
    decision: 'Використання криптографічно підписаних HttpOnly cookie з HMAC-SHA256, що замінює незахищений прототип ADR-000-LEGACY.',
    rationale: 'Забезпечує нульовий витік паролів, захист від XSS та sub-millisecond перевірку без хмарної бази даних.',
    consequences: {
      positive: ['Повна безпека сесій', 'COPPA комплаєнс', '0 серверних витрат'],
      negative: ['Необхідність ротації секрету при компрометації'],
    },
    rollbackPlan: 'Ротація секретного ключа або повернення до суворого режиму тимчасових токенів.',
    supersededBy: null,
    mentorReview: {
      reviewer: 'Степаненко Дмитро (Lead Mentor)',
      score: 25,
      passed: true,
      feedback: 'Чудова еволюція архітектурного мислення: безпечне stateless рішення замість вразливого прототипу.',
      date: '2026-09-16T19:30:00.000Z',
    },
  },
];

// In-memory store
let adrRegistry = JSON.parse(JSON.stringify(INITIAL_ADR_REGISTRY));

export function getCasebook() {
  return ARCHITECTURE_CASES;
}

export function getCaseById(caseId) {
  return ARCHITECTURE_CASES.find((c) => c.id === caseId) || null;
}

export function getAdrRegistry() {
  return adrRegistry;
}

export function getAdrById(adrId) {
  return adrRegistry.find((a) => a.id === adrId) || null;
}

/**
 * Submits a new ADR decision proposal by a learner
 */
export function submitAdrProposal({
  caseId,
  alternativeId,
  title,
  rationale,
  rollbackPlan,
  author = 'Yarik0505',
  jiraKey = 'SCRUM-136',
}) {
  const caseItem = getCaseById(caseId);
  if (!caseItem) {
    return { success: false, error: `Архітектурний кейс ${caseId} не знайдено` };
  }

  const alt = caseItem.alternatives.find((a) => a.id === alternativeId);
  if (!alt) {
    return { success: false, error: `Альтернативу ${alternativeId} не знайдено в кейсі` };
  }

  if (!title || title.trim().length < 5) {
    return { success: false, error: 'Назва ADR має містити щонайменше 5 символів' };
  }
  if (!rationale || rationale.trim().length < 20) {
    return { success: false, error: 'Аргументація (rationale) має містити щонайменше 20 символів' };
  }
  if (!rollbackPlan || rollbackPlan.trim().length < 15) {
    return { success: false, error: 'План відкату (rollback plan) має містити щонайменше 15 символів' };
  }

  const nextNum = String(adrRegistry.length + 1).padStart(3, '0');
  const newAdr = {
    id: `ADR-${nextNum}`,
    caseId,
    title: title.trim(),
    status: 'Proposed',
    owner: author,
    date: new Date().toISOString().split('T')[0],
    jiraKey: jiraKey || caseItem.jiraKey,
    codeEvidence: caseItem.codeEvidence,
    selectedAlternative: alternativeId,
    tradeOffScores: alt.tradeOffs,
    decision: alt.nameUk,
    rationale: rationale.trim(),
    consequences: {
      positive: alt.pros,
      negative: alt.cons,
    },
    rollbackPlan: rollbackPlan.trim(),
    supersededBy: null,
    mentorReview: null,
  };

  adrRegistry.push(newAdr);
  return { success: true, adr: newAdr };
}

/**
 * Conducts mentor reasoning review based on 5 standardized criteria
 */
export function reviewAdrProposal({
  adrId,
  reviewer = 'Степаненко Дмитро (Lead Mentor)',
  criteriaScores = {},
  feedback = '',
}) {
  const adr = getAdrById(adrId);
  if (!adr) {
    return { success: false, error: `ADR ${adrId} не знайдено` };
  }

  const criteriaKeys = Object.keys(MENTOR_RUBRIC_CRITERIA);
  let totalScore = 0;
  const normalizedScores = {};

  for (const key of criteriaKeys) {
    const raw = Number(criteriaScores[key]);
    const score = isNaN(raw) ? 3 : Math.min(Math.max(raw, 0), 5);
    normalizedScores[key] = score;
    totalScore += score;
  }

  const passed = totalScore >= PASSING_SCORE_THRESHOLD;
  const reviewRecord = {
    reviewer,
    score: totalScore,
    criteriaScores: normalizedScores,
    passed,
    feedback: feedback.trim() || (passed ? 'Аргументація надійна, враховано ключові компроміси.' : 'Потрібно детальніше опрацювати наслідки та реверсивність.'),
    date: new Date().toISOString(),
  };

  adr.mentorReview = reviewRecord;
  adr.status = passed ? 'Accepted' : 'Rejected';

  return {
    success: true,
    adr,
    reviewRecord,
  };
}

/**
 * Supersedes an existing ADR with a new improved decision,
 * preserving full history in the registry.
 */
export function supersedeAdr({
  oldAdrId,
  newAdrProposal,
  author = 'Yarik0505',
}) {
  const oldAdr = getAdrById(oldAdrId);
  if (!oldAdr) {
    return { success: false, error: `Старий ADR ${oldAdrId} не знайдено` };
  }

  const submission = submitAdrProposal({
    ...newAdrProposal,
    author,
  });

  if (!submission.success) {
    return submission;
  }

  const newAdr = submission.adr;
  // Mark old as Superseded
  oldAdr.status = 'Superseded';
  oldAdr.supersededBy = newAdr.id;

  // Auto-accept new if replacing a legacy ADR or review immediately
  newAdr.status = 'Accepted';
  newAdr.mentorReview = {
    reviewer: 'Степаненко Дмитро (Lead Mentor)',
    score: 25,
    passed: true,
    feedback: `Успішно замінив застарілий ${oldAdr.id}. Архітектурна еволюція збережена в історії.`,
    date: new Date().toISOString(),
  };

  return {
    success: true,
    oldAdr,
    newAdr,
  };
}

export function resetCasebookStore() {
  adrRegistry = JSON.parse(JSON.stringify(INITIAL_ADR_REGISTRY));
  return adrRegistry;
}
