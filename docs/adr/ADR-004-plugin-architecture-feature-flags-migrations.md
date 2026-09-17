# 🏛️ ADR-004: Архітектура плагінів, Feature Flags та Zero-Downtime міграцій даних

- **Статус**: Accepted
- **Власник (Owner)**: Yarik0505 (Team Lead, greenyarik0505@gmail.com)
- **Дата створення**: 2026-09-17
- **Версія**: v1.0
- **Дата перегляду (Review Date)**: 2026-12-17
- **Пов'язана задача Jira**: SCRUM-73
- **Цільовий Pull Request**: feature/SCRUM-73-plugin-architecture-feature-flags
- **Версія релізу**: v1.8.0

---

## 1. Контекст та постановка проблеми (Context & Problem Statement)

З розвитком Duck Verse виникає потреба підключати нові міні-ігри та навчальні модулі від різних учасників команди (Ярік, Дмитро, Кирил) без ризику поламати ядро платформи. Крім того, недороблені або експериментальні фічі не повинні випадково ставати видимими всім користувачам без поступового розгортання (gradual rollout) та аварійного вимкнення (kill switch).

Необхідно впровадити:
1. **Feature Flag модель**: статус життєвого циклу (`experimental`, `beta`, `ga`, `deprecated`), відсоток доступності (rollout %), дата виведення з експлуатації (expiry) та миттєвий Kill Switch.
2. **Plugin Contract Specification**: стандартизований маніфест плагіна, пісочниця (safe sandbox) та гарантія того, що падіння стороннього плагіна не призводить до відмови хабу (Graceful Degradation).
3. **Ідемпотентні міграції даних**: міграції схем зі зворотною сумісністю (Expand & Contract pattern), можливістю повторного виконання та безпечного відкату (Rollback).

---

## 2. Критерії оцінки рішення (Decision Drivers)

1. **Ізоляція від збоїв (Fault Tolerance)**: Збій або помилка у плагіні перехоплюються Error Boundary і не крашать React додаток.
2. **Серверна верифікація прапорців (Server-Enforced Flags)**: Захищені функції перевіряються на бекенді, а не лише в клієнтському JS.
3. **Цілісність даних (Data Safety)**: Міграції виконуються без простою (zero downtime) і мають збережені снапшоти для відкату.

---

## 3. Специфікація Feature Flags Duck Verse

| Прапорець (Flag Key) | Опис | Власник | Lifecycle | Kill Switch | Default |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `enable_academy_core` | Базовий модуль Duck Academy | Yarik0505 | `ga` | Так | `true` |
| `enable_cyber_flap` | Міні-гра Cyber Flap Duck | Степаненко Дмитро | `beta` | Так | `true` |
| `enable_galactic_invaders`| Міні-гра Galactic Invaders | Степаненко Дмитро | `beta` | Так | `true` |
| `enable_quack_clicker`| Міні-гра Quack Clicker Tycoon | Кирил Пушкарук | `beta` | Так | `true` |
| `enable_neon_hacker` | Гра Неоновий Взломщик | Кирил Пушкарук | `beta` | Так | `true` |
| `enable_dark_launch_lab` | Експериментальна лаба prompt engineering | Yarik0505 | `experimental` | Так | `false` |

---

## 4. Специфікація контракту плагіна (Plugin Contract)

Кожен плагін повинен експортувати маніфест:
```javascript
{
  id: 'plugin-flappy-duck',
  version: '1.2.0',
  name: 'Cyber Flap Duck',
  entryPoint: '/games/game_flappy.js',
  sandbox: { allowLocalStorage: true, allowAudio: true, allowDomWipe: false },
  onInit: () => {},
  onDestroy: () => {}
}
```

---

## 5. Стратегія міграцій даних (Expand & Contract)

1. **Фаза Expand**: Додаються нові поля з дефолтними значеннями, старі поля залишаються робочими.
2. **Фаза Dual-write**: Новий код записує дані в обидва формати.
3. **Фаза Contract**: Після успішного релізу старі поля видаляються плановою міграцією.

---

## 6. Стратегія валідації

- Автоматичні тести безпечного перехоплення помилок плагіна (fault injection).
- Тест ідемпотентності міграцій (повторний запуск не пошкоджує дані).
- Тест відкату (Rollback).
- Live-перевірка у продакшені на duck-verse.vercel.app.
