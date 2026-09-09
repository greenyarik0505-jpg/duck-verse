# 🤖 AGENTS.md — Повний гайд та інструкція для ШІ-агентів (AI Pair Programmer Guide)

> **Призначення файлу**: Цей документ є головною базою знань та регламентом для будь-якої ШІ-моделі / агента, що працює над проектом **Duck Verse**. Тут зібрано все: архітектуру, роботу з Jira-таблицею задач, процес оновлення та деплою сайту, перевірку на продакшені та суворі правила розробки.

---

## 📌 1. Швидкий огляд проекту (Project Overview)

- **Назва проекту**: **Duck Verse** (Game Hub & Geometry Dash Neon)
- **Живий Production URL**: [https://duck-verse.vercel.app](https://duck-verse.vercel.app)
- **GitHub Репозиторій**: [https://github.com/greenyarik0505-jpg/duck-verse](https://github.com/greenyarik0505-jpg/duck-verse) (основна гілка: `main`)
- **Стек технологій**:
  - **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS 3
  - **Ігрові рушії**: HTML5 Canvas 2D, Web Audio API (60 FPS, синтезатор 130 BPM)
  - **Backend / API**: Next.js Serverless Route Handlers (`app/api/scores/route.js`)
  - **Хостинг та CI/CD**: Vercel Production (`duck-verse.vercel.app`)
  - **Управління задачами**: Atlassian Jira Cloud (Проект `SCRUM`)

---

## 📋 2. Робота з Jira (Таблиця задач проекту)

Проект ведеться за методологією Scrum у Jira. Для взаємодії з Jira створено скрипт-хелпер `jira_helper.py`.

### 2.1. Конфігурація та змінні середовища
Файл `.env` у корені проекту містить облікові дані:
```ini
JIRA_URL=https://gta6-sliv-cyberleek.atlassian.net
JIRA_USERNAME=greenyarik0505@gmail.com
JIRA_API_TOKEN=<ATLASSIAN_API_TOKEN>
```

### 2.2. Команда проекту (Виконавці задач)
| Учасник | Роль у проекті | Jira Account ID |
| :--- | :--- | :--- |
| **Yarik0505** (greenyarik0505@gmail.com) | Team Lead, Next.js Hub, UI/UX, Деплой | `712020:d66a7a94-b2f2-4434-9582-8190026d3c20` |
| **Степаненко Дмитро** | Фізика куба, перешкоди, шипи, хітбокси, Flappy Duck | `712020:78105bfe-a055-429c-b519-d1b35998b9af` |
| **Кирил Пушкарук** | Аудіо-рушій (130 BPM), Неоновий Взломщик, API | `712020:23aa804c-99cb-4863-9cda-ee2bfa879882` |

### 2.3. Керування задачами через `jira_helper.py`
Усі команди запускаються через Python з кореня проекту (`d:\game_project`):

1. **Переглянути список усіх задач у таблиці**:
   ```bash
   python jira_helper.py list SCRUM
   ```
2. **Створити нову задачу**:
   ```bash
   python jira_helper.py create SCRUM "Коротка назва задачі" "Детальний опис"
   ```
3. **Змінити статус задачі (Transition)**:
   ```bash
   python jira_helper.py transition <ISSUE_KEY> <TRANSITION_ID>
   ```
   *Таблиця ID переходів (Transition IDs)*:
   - `11` ➔ **К выполнению** (To Do)
   - `21` ➔ **В работе** (In Progress)
   - `31` ➔ **In Review / В процессе проверки** (Code Review)
   - `41` ➔ **Готово** (Done)
   
   *Приклад (перевести SCRUM-12 у статус "Готово")*:
   ```bash
   python jira_helper.py transition SCRUM-12 41
   ```
4. **Додати коментар до задачі**:
   ```bash
   python jira_helper.py comment SCRUM-15 "Реєстр ігор успішно протестовано та закрито."
   ```

---

## 🏆 3. Таблиця рекордів та лідерборд (Scores API)

Лідерборд та збереження рекордів реалізовано у `app/api/scores/route.js`:
- **Отримати список рекордів**: `GET /api/scores?game=geometry_dash`
- **Записати новий рекорд**: `POST /api/scores`
  - Тіло запиту:
    ```json
    {
      "username": "Player1",
      "game": "geometry_dash",
      "score": "100%"
    }
    ```

---

## 🏗️ 4. Структура файлів проекту

```
d:\game_project\
├── app/
│   ├── api/scores/route.js     # Серверний API маршрут збереження очок
│   ├── layout.js               # Головний HTML-шаблон, метатеги, Google Fonts
│   └── page.js                 # Головна сторінка хабу (каталог, модалки)
├── components/
│   ├── CategoryFilter.jsx      # Фільтрація карток ігор за жанрами
│   ├── GameCard.jsx            # Картка гри (активна або кнопка "СКОРО")
│   ├── GameModal.jsx           # Модальне вікно гри (Canvas, повний екран, рестарт)
│   ├── HeroSpotlight.jsx       # Головний промо-банер флагмана Geometry Dash
│   ├── Navbar.jsx              # Верхня навігація (баланс монет, скіни, аудіо)
│   └── SkinShopModal.jsx       # Модальне вікно магазину скінів куба
├── lib/
│   ├── games/
│   │   └── registry.js         # МОДУЛЬНИЙ РЕЄСТР ІГОР (налаштування доступності)
│   └── skins.js                # Конфігурація скінів куба та цін у монетах
├── public/
│   ├── audio.js                # Web Audio API 130 BPM синтезатор звуків
│   ├── styles.css              # Статичні стилі хабу
│   └── games/
│       ├── game_geometry_dash.js # Повний автономний рушій Geometry Dash Neon
│       ├── game_flappy.js        # Рушій Cyber Flap Duck (аркада)
│       ├── game_invaders.js      # Рушій Galactic Invaders (шутер)
│       ├── game_clicker.js       # Рушій Quack Clicker Tycoon (клікер)
│       └── game_hunter.js        # Рушій Neon Duck Hunter (казуальна)
├── .env                        # Секретні ключі Jira API
├── jira_helper.py              # CLI утиліта синхронізації з Jira
└── package.json                # Залежності Next.js, React, Tailwind
```

---

## 🔄 5. Як оновлювати сайт та деплоїти (Step-by-Step Guide)

Коли користувач просить внести зміни або оновити сайт, агент **зобов'язаний** слідувати цьому алгоритму:

### Крок 1: Внесення змін у код
- Редагувати файли акуратно. Дотримуватися правил React 19 та Next.js 15.

### Крок 2: Обов'язкова локальна перевірка збірки (Local Build)
Перед будь-яким комітом обов'язково запустити:
```bash
npm run build
```
Якщо є помилки компіляції чи лінтингу — **виправити їх до коміту**.

### Крок 3: Коміт та пуш у репозиторій GitHub
> ⚠️ **Увага для Windows PowerShell**: Не використовуйте оператор `&&`, використовуйте `;` або окремі команди!
```powershell
git add .
git commit -m "feat(або fix): опис що саме змінено"
git push origin main
```

### Крок 4: Деплой на Vercel Production
Запустити CLI команду Vercel для миттєвого релізу у продакшен:
```powershell
npx vercel --prod --yes
```
Команда виведе URL деплою та підтвердить прив'язку до `https://duck-verse.vercel.app`.

### Крок 5: ⚠️ КРИТИЧНО: Автоматизоване тестування живого сайту ("тести потом отправляй")
**Категорично заборонено** відповідати користувачу, що все готово, без перевірки живого сайту!
Запустити скрипт перевірки через Headless Chrome:
```powershell
python -c "
import urllib.request, json
# або запустити готовий verify скрипт у scratch
"
```
Критерії успіху тестування:
- Консоль браузера має 0 неперехоплених винятків (`Total unhandled exceptions: 0`).
- Немає тексту `Application error: a client-side exception has occurred`.
- Модалка гри відкривається при кліку на "ГРАТИ", і полотно `#game-canvas` рендерить гру.
- Закриття модалки повертає користувача до хабу без помилок.

---

## 🚨 6. Суворі правила та підводні камені (Must-Know Rules)

### 🔴 ПРАВИЛО 1: Заборона direct DOM wipeout (`innerHTML = ''`) у React
- **Ніколи** не очищайте контейнер через `container.innerHTML = ''` всередині компонентів, де React рендерить стан (наприклад, спінери завантаження `{loading && ...}`).
- Це ламає віртуальний DOM React, викликаючи фатальну помилку:
  `NotFoundError: Failed to execute 'removeChild' on 'Node'`.
- Завжди використовуйте декларативний підхід:
  ```jsx
  <canvas
    ref={canvasRef}
    id="game-canvas"
    width={850}
    height={480}
    style={{ display: loading ? 'none' : 'block' }}
  />
  ```

### 🔴 ПРАВИЛО 2: Статуси ігор у каталозі (Вимога замовника)
- **Тільки Geometry Dash** має статус `playable` з активною кнопкою `ГРАТИ` та бейджем `🔥 ДОСТУПНО`.
- **Усі інші 4 гри** (*Cyber Flap Duck*, *Galactic Invaders*, *Quack Clicker Tycoon*, *Neon Duck Hunter*) **ПОВИННІ** мати `status: 'coming_soon'` та бейдж `СКОРО`.
- У `components/GameCard.jsx` неактивні картки рендерять заблоковану кнопку `🔒 СКОРО` (`disabled`).
- Не розблоковувати інші ігри, доки користувач прямо про це не попросить!

### 🔴 ПРАВИЛО 3: Hydration Warnings
- Для елементів з динамічним станом клієнта (звук, баланс монет з localStorage, дати) використовуйте атрибут `suppressHydrationWarning`, щоб запобігти попередженням гідратації Next.js.

### 🔴 ПРАВИЛО 4: Синтаксис терміналу Windows
- Оболонка — `powershell`.
- Замість `npm run build && git commit` пишіть `npm run build; git commit`.
- Ніколи не викликайте команду `cd`. Працюйте з поточної робочої директорії `d:\game_project`.

---

## 📞 7. Корисні посилання та контакти

- **Production Hub**: [https://duck-verse.vercel.app](https://duck-verse.vercel.app)
- **GitHub**: [https://github.com/greenyarik0505-jpg/duck-verse](https://github.com/greenyarik0505-jpg/duck-verse)
- **Jira Cloud**: [https://gta6-sliv-cyberleek.atlassian.net](https://gta6-sliv-cyberleek.atlassian.net)
- **Дошка Jira**: Проект `SCRUM`
