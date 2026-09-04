# 🌌 Duck Verse — Next.js Game Hub & Geometry Dash

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fgreenyarik0505-jpg%2Fduck-verse)
[![Next.js 15](https://img.shields.io/badge/Next.js-15%20App%20Router-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Vercel](https://img.shields.io/badge/Hosted%20on-Vercel-000000?style=flat&logo=vercel)](https://vercel.com/)
[![Atlassian Jira](https://img.shields.io/badge/Jira-SCRUM%20Board-0052CC?style=flat&logo=jira)](https://gta6-sliv-cyberleek.atlassian.net)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Duck Verse** — це сучасний масштабований ігровий портал (**Game Hub**) на базі **Next.js 15 (App Router)** та **Vercel**, створений для швидкого підключення необмеженої кількості веб-ігор.

Флагманська перша гра хабу — культовий ритм-платформер **Geometry Dash Neon** з чесною фізикою, процедурним Web Audio синтезатором та неоновою графікою.

---

## 👥 Команда проекту та розподіл завдань (Спринт 1: "Создание игри")

Проект розробляється командою з 3 осіб з рівномірним розподілом задач у [Jira Board](https://gta6-sliv-cyberleek.atlassian.net):

| Учасник | Зона відповідальності | Призначені задачі в Jira |
| :--- | :--- | :--- |
| **Yarik0505** | **Lead Frontend & Vercel DevOps**<br>Next.js 15, Архітектура хабу, Vercel CI/CD | • `SCRUM-14`: Ініціалізація Next.js 15, Tailwind & Vercel CI/CD<br>• `SCRUM-15`: Архітектура Game Hub та Game Registry<br>• `SCRUM-12`: GD: Магазин кастомізації та скіни куба<br>• `SCRUM-13`: Тестування затримки вводу (Input Lag) та реліз |
| **Степаненко Дмитро** | **Gameplay & Physics Engineer**<br>Фізика 2D, Хітбокси, Анімації | • `SCRUM-7`: 1. GD: Базова фізика куба та чуйне керування<br>• `SCRUM-8`: 2. GD: Перешкоди, інтерактивні об'єкти (шипи, батути, орби)<br>• `SCRUM-11`: 5. GD: Візуальні ефекти, неоновий шлейф і частинки |
| **Кирил Пушкарук** | **Audio, Level Design & Backend State**<br>Web Audio API, Рівні, Next.js API | • `SCRUM-9`: 3. GD: Музичний рушій та ритм-синхронізація (130 BPM)<br>• `SCRUM-10`: 4. GD: Дизайн першого рівня (Neon Madness) та прогрес 0-100%<br>• `SCRUM-16`: Backend: Збереження прогресу, спроб і лідерборд у Vercel |

---

## 🏗️ Архітектура Game Hub

```
duck-verse/
├── app/
│   ├── api/
│   │   └── scores/route.js       # Vercel Serverless API для лідерборду та рекордів
│   ├── layout.js                 # Головний layout із шрифтами Orbitron та темною темою
│   └── page.js                   # Інтерактивна вітрина Game Hub
├── components/                   # UI компоненти хабу (картки, модалки, гаманець)
├── lib/
│   └── games/
│       ├── geometry_dash.js      # Рушій Geometry Dash (60 FPS Canvas)
│       └── registry.js           # Реєстр плагінів ігор для додавання нових ігор
├── src/                          # Локальні скрипти, аудіо-синтезатор та хелпери
├── vercel.json                   # Оптимальні налаштування для хостингу на Vercel
├── .github/                      # PR шаблони, Issue шаблони та CI пайплайн
└── CONTRIBUTING.md               # Стандарти коду та правила гілок для команди
```

---

## 🕹️ Як додати нову гру в Game Hub?

Завдяки модульній системі Game Registry, підключення нової гри займає лічені хвилини:
1. Створіть файл рушія гри в `lib/games/my_game.js`, який реалізує методи `start()` та `stop()`.
2. Зареєструйте гру у списку `lib/games/registry.js` із назвою, бейджем, категорією та іконкою.
3. Гра автоматично з'явиться у вітрині, пошуку, системі фільтрів та отримає спільний лічильник монет і рекордів!

---

## 🚀 Локальний запуск проекту

### Крок 1. Клонування репозиторію
```bash
git clone https://github.com/greenyarik0505-jpg/duck-verse.git
cd duck-verse
```

### Крок 2. Встановлення залежностей
```bash
npm install
```

### Крок 3. Запуск dev-сервера Next.js
```bash
npm run dev
```
Відкрийте [http://localhost:3000](http://localhost:3000) у браузері.

### Швидкий деплой на Vercel
Встановіть Vercel CLI або натисніть кнопку **Deploy with Vercel** угорі:
```bash
npm install -g vercel
vercel
```

---

## 📄 Ліцензія
Проект поширюється під відкритою ліцензією [MIT](LICENSE).
