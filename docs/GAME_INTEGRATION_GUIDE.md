# 🎮 Duck Verse — Інструкція з підключення нової гри (Game Integration Guide)

> **SCRUM-40**: Єдиний контракт ігор та validation registry.

Цей посібник описує регламент підключення нових ігор до платформи **Duck Verse**. Завдяки єдиному контракту нова гра інтегрується без ручних змін у верстці каталогу, пошуку чи фільтрах.

---

## 📋 1. Єдиний контракт гри (`GameContract`)

Кожна гра, що додається до `lib/games/registry.js`, зобов'язана містити наступні поля:

| Поле | Тип | Опис / Допустимі значення |
| :--- | :--- | :--- |
| `id` | `string` | Унікальний slug (`/^[a-z0-9_-]+$/`), наприклад `'quantum_runner'` |
| `title` | `string` | Повна назва гри для карток та заголовків |
| `tag` | `string` | Короткий бейдж жанру (наприклад `'РИТМ ТА ЕКШЕН'`) |
| `badge` | `string` | Маркетинговий бейдж (`'🔥 ДОСТУПНО'`, `'🟣 НОВИНКА'`, `'СКОРО'`) |
| `desc` | `string` | Детальний опис механіки та сюжету гри |
| `rating` | `string` | Рейтинг гри (наприклад `'5.0 ★'`) |
| `players` | `string` | Кількість активних гравців (наприклад `'14.2k'`) |
| `category` | `string` | Один з: `'action'`, `'arcade'`, `'puzzle'`, `'casual'` |
| `engineType` | `string` | Тип рушія: `'canvas'`, `'react'`, `'dom'` |
| `enginePath` | `string` | Шлях до скрипту або компонента (наприклад `'/games/game_runner.js'`) |
| `engineClass` | `string\|null` | Назва глобального класу для canvas/dom (наприклад `'QuantumRunnerGame'`) |
| `icon` | `string` | Емодзі або іконка гри |
| `isFlagship` | `boolean` | `true` лише для головного флагмана (Geometry Dash) |
| `status` | `string` | Один з: `'playable'`, `'coming_soon'`, `'maintenance'`, `'deprecated'` |
| `controls` | `object` | Метадані керування: `summary`, `keyboard`, `mouse`, `touch` |
| `scoring` | `object` | Метадані скорингу: `type`, `unit`, `highScoreKey` |
| `accessibility` | `object` | Доступність: `ariaLabel`, `keyboardSupport`, `screenReaderInstructions` |

---

## 🛠️ 2. Покроковий процес інтеграції

### Крок 1: Створення файлу рушія гри
Створіть файл рушія:
- **Canvas-гра**: `public/games/game_<назва>.js` із класом `window.<Назва>Game(canvas, onScore, onWin, onAddCoins)`.
- **React-гра**: `components/games/<Назва>.jsx` із колбеками `onAddCoins` та `onVictory`.
- **DOM-гра**: `public/games/game_<назва>.js` із монтуванням у переданий контейнер.

### Крок 2: Додавання запису до `lib/games/registry.js`
Вставте об'єкт гри у масив `GAME_REGISTRY`:

```javascript
{
  id: 'quantum_runner',
  title: 'Quantum Runner',
  tag: 'КІБЕР-РАННЕР',
  badge: '🟣 НОВИНКА',
  desc: 'Долайте лазерні лабіринти та збирайте енергетичні сфери!',
  rating: '4.9 ★',
  players: '1.2k',
  category: 'arcade',
  engineType: 'canvas',
  enginePath: '/games/game_quantum_runner.js',
  engineClass: 'QuantumRunnerGame',
  icon: '⚡',
  isFlagship: false,
  status: 'playable',
  controls: {
    summary: 'Пробіл / ↑ — стрибок | R — рестарт | Esc — вихід',
    keyboard: [
      { keys: ['Space', 'ArrowUp'], description: 'Стрибок' },
      { keys: ['KeyR'], description: 'Рестарт' },
      { keys: ['Escape'], description: 'Вихід' }
    ],
    mouse: 'Клік — стрибок',
    touch: 'Тап — стрибок'
  },
  scoring: {
    type: 'points',
    unit: 'pts',
    highScoreKey: 'duckverse_quantum_score'
  },
  accessibility: {
    ariaLabel: 'Quantum Runner: аркадний раннер',
    keyboardSupport: true,
    screenReaderInstructions: 'Стрибайте через перешкоди клавішею Пробіл.'
  }
}
```

### Крок 3: Перевірка контракту та тестів
Запустіть автоматичну перевірку:
```bash
npm test
npm run build
```
Якщо в об'єкті пропущено обов'язкове поле або вказано невалідну категорію чи статус, валідатор `validateGameRegistry` викине помилку із точним описом проблеми ще під час збірки!

---

## 🔒 3. Безпека та Fallback поведінка
- При виклику `getGameById('невідомий_id')` система безпечно повертає флагманську гру замість викиду помилки (Null Object Pattern).
- При збої завантаження скрипту в `GameModal.jsx` відображається панель відновлення з кнопкою перезавантаження.
