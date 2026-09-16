# 🏛️ ADR-004: Engineering Governance, Learning Roadmap & Tech Radar

- **Статус**: Accepted
- **Власник (Owner)**: Yarik0505 (Team Lead, greenyarik0505@gmail.com)
- **Дата створення**: 2026-09-17
- **Версія**: v1.0
- **Дата перегляду (Review Date)**: 2026-12-17
- **Пов'язана задача Jira**: SCRUM-70
- **Цільовий Pull Request**: feature/SCRUM-70-engineering-governance-roadmap
- **Версія релізу**: v1.8.0

---

## 1. Контекст та постановка проблеми (Context & Problem Statement)

Зі зростанням Duck Verse від прототипу гри до багатомодульної платформи навчання (Duck Academy) та ігрового хабу виникла потреба в довгострокових інженерних правилах (Engineering Governance).
Без чіткого регламенту виникають типові інженерні ризики:
1. **Нерівномірність навантаження (Workload Imbalance)**: Перевантаження одного розробника або прихована нерівність у розподілі Story Points та складності.
2. **Технічний хаос у залежностях та паттернах**: Використання неперевірених бібліотек або небезпечних практик (наприклад, мутація `innerHTML`, що ламає React DOM).
3. **Відсутність прозорого плану (Roadmap Transparency)**: Неможливість передбачити дату релізу модуля або визначити залежності між задачами (prerequisites).
4. **Нестандартизоване оцінювання учнів/розробників**: Суб'єктивність замість прозорого вимірюваного Quality Bar.

---

## 2. Критерії та рішення (Governance Framework)

### 2.1. Розподіл обов'язків та команди (Engineering Roles)
- **Yarik0505**: Team Lead, UI/UX Hub, Next.js App Router, Архітектура платформи, Деплой та Governance.
- **Степаненко Дмитро**: Physics & Gameplay Lead, 60 FPS Canvas рушії, хітбокси, механіки перешкод, аркади.
- **Кирил Пушкарук**: Audio, Backend & Security Lead, 130 BPM Web Audio синтезатор, API, Anti-Abuse та криптографічні токени.

### 2.2. Квартальний Roadmap (Q1-Q4 2026)
Кожен квартал має чітку тему, ліміт Story Points (Capacity: ~110-120 SP) та вимірювані віхи (Milestones):
- **Q1 2026**: Core Engine, Hub Architecture & Vercel Launch.
- **Q2 2026**: Academy Curriculum L0-L4 & Player Identity (COPPA, Auth, DAG).
- **Q3 2026**: Advanced Labs (L5-L7), SLO Observability, ADR Reviews & Mentorship.
- **Q4 2026**: Senior Labs (L8-L9), Chaos Engineering & Graduation Release.

### 2.3. Tech Radar (ADOPT / TRIAL / ASSESS / HOLD)
- **ADOPT**: Next.js 15, React 19, Tailwind CSS, Node.js Native Test Runner (`node:test`), ESLint CLI, Web Audio API, Canvas 2D.
- **TRIAL**: Vercel KV / Upstash, Web Vitals Telemetry, HMAC-SHA256 tokens.
- **ASSESS**: Playwright E2E matrix, Wasm physics.
- **HOLD (Заборонено)**: `innerHTML = ''` у React компонентах, прямий push у `main`, неструктуроване логування PII.

### 2.4. Реєстр ризиків (Risk Register)
Кожен технічний ризик має категорію, ймовірність, вплив, розрахунковий бал (Score = Probability × Impact), призначеного власника (Owner) та стратегію мітигації.

### 2.5. Graduation Gates (Quality Bar)
Поріг успішного випуску учня/розробника становить **80%** за 6 вимірами стандартизованої рубрики:
1. Architecture & Clean Boundaries (20%)
2. Automated Tests & Regression Proof (25%)
3. Security, Privacy & Zero PII (20%)
4. 60 FPS & Responsive Budgets (15%)
5. ADRs & Technical Writing (10%)
6. Jira/PR Collaboration & Git Hygiene (10%)

---

## 3. Наслідки (Consequences)

### Позитивні:
- Кожна нова задача проходить стандартизований тріаж (`triageNewTask`) без втрати контексту.
- Навантаження команди прозоре та збалансоване (workload fairness check).
- Заборонені практики зафіксовані в Tech Radar (HOLD) та перевіряються автоматичними тестами.
- Довгостроковий розвиток Duck Verse гарантований чіткою послідовністю залежностей: `Prerequisite → Implementation → Verification → Release`.
