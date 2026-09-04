# 🌌 Duck Verse — Game Hub

[![GitHub License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Atlassian Jira](https://img.shields.io/badge/Jira-SCRUM-0052CC.svg)](https://gta6-sliv-cyberleek.atlassian.net)
[![Platform](https://img.shields.io/badge/platform-Web%20%7C%20HTML5%20%7C%20Canvas-00f3ff.svg)](#)

**Duck Verse** — это неоновый мультиверс игровой портал (Game Hub) с киберпанк стилистикой, процедурным звуковым 8-битным синтезатором на Web Audio API, встроенной системой очков, валюты (QuackCoins) и достижений.

---

## 🎮 Доступные игры и дорожная карта

| Игра | Жанр | Статус | Описание |
| :--- | :--- | :--- | :--- |
| **Geometry Dash Neon** | Ритм-платформер | 📋 *Запланирован в Jira (SCRUM-6)* | Культовый ритм-экшен с прыжками через шипы, батутами и прогрессом |
| **Cyber Flap** | Аркадный раннер | ✅ *Готово* | Реактивный полет через лазерные барьеры со сбором монет |
| **Galactic Invaders** | Space Shooter | ✅ *Готово* | Космический аркадный шутер с волнами противников |
| **Multiverse Tycoon** | Idle / Кликер | ✅ *Готово* | Кликер с авто-крякерами и квантовыми апгрейдами дохода |
| **Arcade Hunter** | Reflex Shooter | ✅ *Готово* | Неоновый тир на реакцию с комбо-множителями |

---

## 📋 План разработки Geometry Dash в Jira

В Jira проекте [SCRUM](https://gta6-sliv-cyberleek.atlassian.net) создан эпик **`SCRUM-6`** с декомпозицией:
1. `SCRUM-7`: Базовая физика куба и отзывчивое управление
2. `SCRUM-8`: Препятствия, интерактивные объекты и хитбоксы
3. `SCRUM-9`: Музыкальный движок и ритм-синхронизация (130 BPM)
4. `SCRUM-10`: Дизайн первого уровня (Neon Madness) и прогресс-бар
5. `SCRUM-11`: Визуальные эффекты, частицы и шлейф
6. `SCRUM-12`: Магазин кастомизации и скины куба
7. `SCRUM-13`: Тестирование задержки ввода (Input Lag) и релиз в хабе

---

## 🚀 Быстрый запуск

Для запуска игрового портала локально откройте терминал в папке проекта и выполните:

```bash
# С помощью Python:
python -m http.server 8000
```

или

```bash
# С помощью Node.js:
npx serve .
```

После этого откройте в браузере: `http://localhost:8000`

---

## 🛠️ Стек технологий
* **UI**: HTML5, Modern CSS (Glassmorphism, Neon Cyberpunk, Flexbox & Grid)
* **Движки игр**: HTML5 Canvas 2D API (60 FPS)
* **Аудио**: Web Audio API (процедурный 8-битный звуковой синтезатор без внешних файлов)
* **Управление проектом**: Atlassian Jira Cloud (`mcp-atlassian`)
