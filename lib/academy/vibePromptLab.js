/**
 * Duck Academy — Vibe-Coding Prompt Lab (SCRUM-45)
 * Навчальна лабораторія інженерного промптингу для ШІ-асистентів:
 * від розмитої "vibe-ідеї" до чіткого технічного brief із критеріями прийому,
 * файлами, ризиками та тестовою верифікацією.
 */

export const PROMPT_LAB_EXERCISES = [
  {
    id: 'exercise-1-ui-mute',
    title: '1. Усунення бага зациклення звуку',
    level: 'Beginner',
    difficulty: 'Початковий',
    scenario: 'Гравці скаржаться, що фонова музика 130 BPM продовжує грати у фоні після закриття модалки гри.',
    rawIdea: 'полагодь звук щоб він не грав коли я закриваю вікно',
    weakPrompt: 'Пофікси баг зі звуком у модалці, бо він не вимикається і грає далі. Зроби красиво і швидко.',
    strongPrompt: `### Контекст
У компоненті GameModal.jsx при кліку на Escape або кнопку закриття екземпляр activeGameRef.current не викликає stopMusic(), через що Web Audio синтезатор продовжує грати в бекграунді.

### Що зробити
1. У функції handleClose() у components/GameModal.jsx додати перевірку activeGameRef.current?.stopMusic?.() та activeGameRef.current?.destroy?.().
2. Переконатися, що window.sound.toggleMute() не викликається помилково при демонтажі.
3. Додати cleanup у useEffect return() для гарантованого звільнення Web Audio контексту.

### Критерії прийому (Acceptance Criteria)
- При закритті модалки через кнопку ✕ або Esc відтворення музики миттєво зупиняється.
- Консоль браузера має 0 помилок при повторному відкритті та закритті.
- npm run build проходить без варнінгів.

### План верифікації
- Відкрити Geometry Dash, дочекатися старту треку, натиснути Esc.
- Перевірити AudioContext.state у консолі DevTools (має бути 'suspended' або зупинений вузол).`,
    explanation: 'Слабкий промпт не вказує компонент, метод рушія, очікувану поведінку та спосіб перевірки. Сильний промпт локалізує проблему до GameModal.jsx, визначає конкретні методи та вимірний план верифікації.',
    rubricCriteria: [
      { key: 'context', name: 'Контекст і локалізація файлів', description: 'Вказано компоненти або файли (GameModal.jsx, audio.js)' },
      { key: 'scope', name: 'Чіткі межі задачі', description: 'Описано конкретні кроки реалізації без розмитих вимог' },
      { key: 'acceptance', name: 'Вимірні критерії прийому', description: 'Сформульовано булети acceptance criteria' },
      { key: 'verification', name: 'План тестування і перевірки', description: 'Вказано дії для ручної або консольної перевірки' },
      { key: 'risks', name: 'Врахування граничних випадків', description: 'Згадано очищення ресурсів / unmount' }
    ]
  },
  {
    id: 'exercise-2-physics-hitbox',
    title: '2. Чесні хітбокси шипів у Geometry Dash',
    level: 'Junior',
    difficulty: 'Базовий',
    scenario: 'Кубик помирає занадто далеко від шипа, гравці відчувають несправедливість (hitbox mismatch).',
    rawIdea: 'шипи занадто великі кубик вмирає в повітрі зроби нормально',
    weakPrompt: 'Зроби хітбокси шипів меншими, щоб гра була приємною і не бісила людей.',
    strongPrompt: `### Контекст
У файлі public/games/game_geometry_dash.js колізія між гравцем (box 40x40) та шипом (трикутник 40x40) обчислюється через спрощений AABB bounding box, що спричиняє смерть при дотику до порожнього кута прямокутника.

### Завдання
1. Додати inner hitbox padding у 4px з кожного боку для об'єктів типу 'spike'.
2. Реалізувати перевірку перетину прямокутника з трикутником або звужений трапецієподібний полігон хітбокса.
3. Зберегти швидкість обчислень для стабільних 60 FPS на Canvas 2D.

### Критерії прийому
- Візуальний проліт за 2px від вершини шипа не спричиняє crash.
- Прямий контакт із тілом шипа гарантовано перезапускає раунд.
- Немає падіння FPS нижче 58 кадрів/сек.

### Верифікація
- Запустити гру на тестовому відрізку з 3 послідовними шипами.
- Перевірити в режимі відладки (якщо активний debug overlay із показом контурів).`,
    explanation: 'Сильний промпт розрізняє AABB та полігональні/внутрішні хітбокси, ставить числові допуски (4px padding) та критерій FPS.',
    rubricCriteria: [
      { key: 'context', name: 'Контекст і локалізація файлів', description: 'Вказано файл game_geometry_dash.js та механізм колізій' },
      { key: 'scope', name: 'Чіткі межі задачі', description: 'Фокус суто на хітбоксах шипів, без зміни фізики стрибка' },
      { key: 'acceptance', name: 'Вимірні критерії прийому', description: 'Конкретні правила: дотик = смерть, мікрозазор = політ' },
      { key: 'verification', name: 'План тестування і перевірки', description: 'Тест на серії шипів та перевірка FPS' },
      { key: 'risks', name: 'Врахування граничних випадків', description: 'Продуктивність циклу рендеру 60 FPS' }
    ]
  },
  {
    id: 'exercise-3-offline-scores',
    title: '3. Офлайн-черга збереження рекордів',
    level: 'Mid',
    difficulty: 'Середній',
    scenario: 'При короткочасному зникненні інтернету новий рекорд втрачається без попередження.',
    rawIdea: 'збережи рекорд якщо нема інтернету і потім відправ',
    weakPrompt: 'Додай збереження рекордів коли відпав інтернет, щоб потім вони залилися в базу.',
    strongPrompt: `### Контекст
При відправці POST /api/scores у випадку мережевого збою запит падає з помилкою, і результат гравця зникає.

### Що зробити
1. У клієнтському модулі відправки результатів перехоплювати NetworkError / 5xx.
2. Зберігати невдалі спроби у LocalStorage під ключем 'duckverse_pending_scores' із uuid та timestamp.
3. Додати слухач події window.addEventListener('online', syncPendingScores).
4. У POST /api/scores передавати 'idempotencyKey' для безпечного повторного надсилання без дублікатів.

### Критерії прийому
- При вимкненому Network у DevTools рекорд записується в чергу offline.
- При відновленні з'єднання черга автоматично спустошується успішними запитами.
- Повторна відправка повертає 200 із { duplicate: true } без подвоєння запису.

### Верифікація
- Тест у Chrome DevTools: Network -> Offline -> завершити раунд -> Network -> Online.
- Запустити npm test для перевірки ідемпотентності сховища.`,
    explanation: 'Містить архітектурний патерн Outbox/Offline Sync, обробку ідемпотентності та сценарій симуляції в DevTools.',
    rubricCriteria: [
      { key: 'context', name: 'Контекст і локалізація файлів', description: 'Зв\'язок клієнтського відправника та API роуту /api/scores' },
      { key: 'scope', name: 'Чіткі межі задачі', description: 'Черга, збереження в LocalStorage, слухач online' },
      { key: 'acceptance', name: 'Вимірні критерії прийому', description: 'Синхронізація при reconnection, дедуплікація' },
      { key: 'verification', name: 'План тестування і перевірки', description: 'DevTools Offline simulation + npm test' },
      { key: 'risks', name: 'Врахування граничних випадків', description: 'Захист від дублікатів через idempotencyKey' }
    ]
  },
  {
    id: 'exercise-4-rate-limit-security',
    title: '4. Rate limiting та античит для Scores API',
    level: 'Senior',
    difficulty: 'Просунутий',
    scenario: 'Боти надсилають підроблені рекорди (100% за 1 секунду) через прямі POST запити.',
    rawIdea: 'захисти бекенд від накрутки очок і ботів',
    weakPrompt: 'Зроби захист API від чітерів і спамерів, щоб ніхто не міг накрутити собі мільйон очок.',
    strongPrompt: `### Архітектурний контекст
Serverless Route Handler app/api/scores/route.js не перевіряє часові інтервали раунду та IP rate limit, що дозволяє генерувати спам-рекорди прямими POST запитами.

### Завдання
1. Додати перевірку валідності score payload: мінімальний час сесії гри (наприклад, Neon Madness 100% фізично триває не менше 62 секунд).
2. Реалізувати sliding-window rate limit (максимум 5 спроб запису на хвилину з одного IP) за допомогою Upstash Redis або in-memory fallback.
3. Повертати HTTP 429 Too Many Requests із заголовком Retry-After при перевищенні ліміту.
4. Логувати підозрілі запити з відхиленням без розкриття деталей алгоритму античиту в тілі відповіді.

### Критерії прийому
- Запит з результатом '100%' і тривалістю менше 60 секунд відхиляється з HTTP 422.
- 6-й запит за хвилину з одного IP отримує статус 429.
- Легітимні рекорди гравців записуються без затримок.

### Верифікація
- Написати automated integration test з імітацією 10 послідовних запитів.
- Перевірити заголовки 429 та коректність відповіді.`,
    explanation: 'Senior-рівень: враховує фізичну тривалість треку (domain logic validation), sliding-window rate limit, HTTP 429 стандарти та відсутність витоку даних безпеки.',
    rubricCriteria: [
      { key: 'context', name: 'Контекст і локалізація файлів', description: 'Вказано app/api/scores/route.js та модель безпеки' },
      { key: 'scope', name: 'Чіткі межі задачі', description: 'Доменна перевірка тривалості гри + IP rate-limit' },
      { key: 'acceptance', name: 'Вимірні критерії прийому', description: 'HTTP 422 на неможливий час, HTTP 429 на спам' },
      { key: 'verification', name: 'План тестування і перевірки', description: 'Автоматизований інтеграційний тест із чергою запитів' },
      { key: 'risks', name: 'Врахування граничних випадків', description: 'Хибнопозитивні спрацювання для повільних/швидких гравців' }
    ]
  },
  {
    id: 'exercise-5-distributed-partition',
    title: '5. Розподілений глобальний лідерборд (Zero-Cold-Start)',
    level: 'Staff',
    difficulty: 'Експертний',
    scenario: 'Під час турніру на 50,000 одночасних гравців Vercel Serverless функція забиває базу з\'єднаннями (connection pool exhaustion).',
    rawIdea: 'зроби так щоб база не падала коли грає дуже багато людей одночасно',
    weakPrompt: 'Оптимізуй лідерборд щоб він витримував великі навантаження і не падав під час стрімів.',
    strongPrompt: `### Архітектурний контекст
Прямий запис та вибірка топ-100 лідерборду з реляційної бази під час пікових навантажень (50k DAU) спричиняє connection spikes та деградацію часу відповіді до >2 секунд.

### Архітектурне рішення
1. Впровадити Read/Write Split із кешуванням:
   - GET /api/scores читає з Vercel Edge Cache (stale-while-revalidate=30, s-maxage=10).
   - POST /api/scores публікує подію у чергу/KV із зведенням через батч-процесор раз на 5 секунд.
2. Створити схему дедуплікації та рейтингового зрізу (Leaderboard Partitioning by Game & Season).
3. Забезпечити Graceful Degradation: якщо remote KV тимчасово недоступний, повертати кешований snapshot без викиду 500.

### Критерії прийому
- P99 latency на читання лідерборду становить < 50ms при 1,000 RPS.
- База даних не перевищує ліміт з'єднань (використовується connection pooling / REST driver).
- При повному відключенні сховища API віддає кешований знімок із заголовком Warning.

### План верифікації
- Навантажувальне тестування скриптом k6 або autocannon на 500 virtual users.
- Chaos-тест: симуляція падіння бекенд-бази під навантаженням.`,
    explanation: 'Staff-рівень: оперує P99 latency, Read/Write split, Edge Caching, Graceful Degradation та chaos/load testing.',
    rubricCriteria: [
      { key: 'context', name: 'Контекст і локалізація файлів', description: 'Описано архітектуру Edge Cache, KV, Serverless Route' },
      { key: 'scope', name: 'Чіткі межі задачі', description: 'Read/Write split, батчинг записів, ізоляція пулу з\'єднань' },
      { key: 'acceptance', name: 'Вимірні критерії прийому', description: 'P99 < 50ms, стабільність пулу з\'єднань' },
      { key: 'verification', name: 'План тестування і перевірки', description: 'Навантажувальний k6 тест + Chaos інжекція відмови' },
      { key: 'risks', name: 'Врахування граничних випадків', description: 'Невідповідність кешу (stale data) та fallback snapshot' }
    ]
  }
];

/**
 * Оцінює студентський промпт-бриф за 5 критеріями інженерної рубрики
 * @param {string} userText - текст промпту учня
 * @param {string} exerciseId - ідентифікатор вправи
 * @returns {Object} результат оцінки з балами та персональним фідбеком
 */
export function evaluatePromptBrief(userText, exerciseId) {
  const ex = PROMPT_LAB_EXERCISES.find((e) => e.id === exerciseId) || PROMPT_LAB_EXERCISES[0];
  const text = String(userText || '').trim();

  if (!text || text.length < 20) {
    return {
      score: 10,
      passed: false,
      criteriaResults: ex.rubricCriteria.map((c) => ({ key: c.key, name: c.name, passed: false, hint: 'Промпт занадто короткий. Опишіть деталі задачі.' })),
      feedback: 'Промпт занадто розмитий або лаконічний. ШІ-асистент без контексту змушений додумувати архітектуру, що веде до галюцинацій та багів.',
      exportMarkdown: ''
    };
  }

  const lower = text.toLowerCase();

  // 1. Context check (файли, шляхи, технології)
  const hasFiles = /\b(app|components|lib|public|games|route|modal|dash|score|css|jsx|js)\b/i.test(text) ||
                   text.includes('/') || text.includes('.js');

  // 2. Scope check (що зробити, кроки, завдання)
  const hasScope = /\b(зробити|завдання|кроки|додати|змінити|реалізувати|виправити|todo|task|steps)\b/i.test(text) ||
                   text.includes('1.') || text.includes('-');

  // 3. Acceptance Criteria check (критерії, очікуваний результат)
  const hasAcceptance = /\b(критерії|acceptance|повинно|має бути|результат|перевірка|очікується)\b/i.test(text);

  // 4. Verification check (тести, npm, консоль, запуск)
  const hasVerification = /\b(тест|test|npm|верифікація|перевірити|console|devtools|build|запустити)\b/i.test(text);

  // 5. Risks & Edge Cases check (граничні випадки, помилки, fallback, очищення)
  const hasRisks = /\b(помилк|ризик|безпек|offline|fallback|якщо|edge case|випадок|витік|очищ|timeout)\b/i.test(text);

  const criteriaResults = [
    {
      key: 'context',
      name: 'Контекст і локалізація файлів',
      passed: hasFiles,
      hint: hasFiles ? 'Чудово: вказано конкретні файли або модулі.' : 'Порада: вкажіть точні файли (наприклад, components/GameModal.jsx).'
    },
    {
      key: 'scope',
      name: 'Чіткі межі задачі та кроки',
      passed: hasScope,
      hint: hasScope ? 'Добре: описано послідовні кроки або план.' : 'Порада: розбийте задачу на пронумеровані підкроки.'
    },
    {
      key: 'acceptance',
      name: 'Вимірні критерії прийому',
      passed: hasAcceptance,
      hint: hasAcceptance ? 'Прийнято: сформульовано очікувані критерії.' : 'Порада: додайте розділ «Критерії прийому» з чіткими умовами.'
    },
    {
      key: 'verification',
      name: 'План тестування (Verification)',
      passed: hasVerification,
      hint: hasVerification ? 'Супер: вказано спосіб перевірки чи тести.' : 'Порада: напишіть, як саме перевірити результат (npm test, DevTools).'
    },
    {
      key: 'risks',
      name: 'Врахування ризиків та крайових умов',
      passed: hasRisks,
      hint: hasRisks ? 'Враховано граничні випадки та стабільність.' : 'Порада: згадайте можливі побічні ефекти або обробку помилок.'
    }
  ];

  const passedCount = criteriaResults.filter((c) => c.passed).length;
  const score = Math.round((passedCount / 5) * 100);
  const passed = score >= 60;

  let feedback = '';
  if (score >= 80) {
    feedback = '🌟 Відмінний інженерний бриф! Такий промпт дає ШІ-моделі 100% однозначність виконання без зайвих ітерацій.';
  } else if (score >= 60) {
    feedback = '👍 Хороший бриф, але бракує кількох інженерних деталей (дивіться підказки у чеклісті нижче).';
  } else {
    feedback = '⚠️ Бриф потребує доопрацювання. Додайте назви файлів, точні критерії прийому та спосіб перевірки.';
  }

  // Генерація експорту для вставки в Jira або Pull Request
  const exportMarkdown = `### 📋 Engineering Implementation Brief (${ex.title})
**Рівень**: ${ex.level} | **Оцінка якості промпту**: ${score}/100

${text}

---
*Згенеровано через Duck Academy Vibe-Coding Prompt Lab (SCRUM-45)*`;

  return {
    score,
    passed,
    criteriaResults,
    feedback,
    exportMarkdown
  };
}
