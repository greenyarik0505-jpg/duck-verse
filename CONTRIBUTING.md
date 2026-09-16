# 🤝 Правила співпраці та розробки Duck Verse

Ласкаво просимо до команди розробки **Duck Verse**! Нижче описані стандарти коду, правила гілок та робочий процес із Jira.

---

## 👥 Склад команди та зони відповідальності

| Учасник команди | Роль | Основний стек | Ключові задачі в Jira |
| :--- | :--- | :--- | :--- |
| **Yarik0505** | Lead Frontend & DevOps | Next.js 15, Vercel, Tailwind | `SCRUM-14`, `SCRUM-15`, `SCRUM-12`, `SCRUM-13` |
| **Степаненко Дмитро** | Gameplay & Physics | HTML5 Canvas, Physics 2D | `SCRUM-7`, `SCRUM-8`, `SCRUM-11` |
| **Кирил Пушкарук** | Audio & Level Design / State | Web Audio API, Next.js API, Game Design | `SCRUM-9`, `SCRUM-10`, `SCRUM-16` |

---

## 🌿 Стратегія роботи з Git (Branching)

1. **Головна гілка**: `main` (завжди робоча, автоматично деплоїться на Vercel).
2. **Іменування гілок під задачі в Jira**:
   ```bash
   git checkout -b feature/SCRUM-14-nextjs-setup
   git checkout -b feature/SCRUM-7-cube-physics
   git checkout -b feature/SCRUM-9-audio-engine
   ```
3. **Формат комітів**:
   - `feat(SCRUM-XX): короткий опис нової фічі`
   - `fix(SCRUM-XX): виправлення багу`
   - `refactor(SCRUM-XX): покращення структури коду`

---

## 🚀 Деплой на Vercel
- Кожен відкритий Pull Request автоматично отримує **Vercel Preview URL** для тестування гри на телефоні та ПК.
- Мердж у `main` оновлює Production середовище.

---

## 🛡️ CI Quality Gate & Локальна перевірка (SCRUM-37)

Кожен Pull Request проходить обов’язковий пайплайн GitHub Actions (`.github/workflows/ci.yml`), який блокує злиття при будь-якій помилці лінтингу, тестів чи компіляції.

### Обов’язкові команди локальної перевірки перед відкриттям PR:

1. **Встановлення залежностей відповідно до lock-файлу**:
   ```bash
   npm ci
   ```
2. **Перевірка якості коду (ESLint CLI)**:
   ```bash
   npm run lint
   ```
3. **Запуск усіх автоматизованих тестів (Node.js Test Runner)**:
   ```bash
   npm test
   ```
4. **Перевірка збірки проекту (Next.js Production Build)**:
   ```bash
   npm run build
   ```

> ⚠️ **Важливо**: CI виконує перевірки у чистій ізольованій машині (`ubuntu-latest`) без використання production-секретів для статичних перевірок. Усі тести повинні успішно проходити без зовнішніх залежностей.

---

## 📋 Оновлення Jira
- Перед початком роботи: перевести задачу в **В работе**.
- Після створення Pull Request: перевести задачу в **In Review**.
- Після мерджу в `main`: перевести задачу в **Готово**.
