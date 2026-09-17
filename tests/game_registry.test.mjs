import { GAME_REGISTRY, getGameById, getGamesByCategory, searchGames, validateGameRegistry } from '../lib/games/registry.js';
import { validateGameContract, ALLOWED_CATEGORIES, ALLOWED_STATUSES, ALLOWED_ENGINE_TYPES } from '../lib/games/contract.js';

console.log('--- 🧪 ТЕСТУВАННЯ GAME CONTRACT & REGISTRY (SCRUM-40) ---');

// Тест 1: Офіційний GAME_REGISTRY проходить валідацію контракту
try {
  const isValid = validateGameRegistry(GAME_REGISTRY);
  if (isValid) {
    console.log(`✅ Тест 1 пройдено: Офіційний GAME_REGISTRY (${GAME_REGISTRY.length} ігор) повністю відповідає контракту.`);
  }
} catch (e) {
  console.error('❌ Тест 1 провалено:', e.message);
  process.exit(1);
}

// Тест 2: Перевірка повноти полів кожного запису
for (const game of GAME_REGISTRY) {
  const errors = validateGameContract(game);
  if (errors.length > 0) {
    console.error(`❌ Тест 2 провалено для гри '${game.id}':`, errors);
    process.exit(1);
  }
  if (!game.controls?.summary) {
    console.error(`❌ Тест 2 провалено: гра '${game.id}' не має controls.summary`);
    process.exit(1);
  }
}
console.log('✅ Тест 2 пройдено: Усі ігри містять controls, scoring та accessibility.');

// Тест 3: Виявлення дублікатів id
const duplicateRegistry = [
  ...GAME_REGISTRY,
  { ...GAME_REGISTRY[0], title: 'Клон гри' }
];
try {
  validateGameRegistry(duplicateRegistry);
  console.error('❌ Тест 3 провалено: Реєстр із дублікатом id мав викликати виняток.');
  process.exit(1);
} catch (e) {
  if (e.message.includes('Дублікат ідентифікатора')) {
    console.log('✅ Тест 3 пройдено: Дублікат ID успішно відхилено валідатором.');
  } else {
    console.error('❌ Тест 3 провалено: неочікуване повідомлення про помилку:', e.message);
    process.exit(1);
  }
}

// Тест 4: Відхилення невалідних категорій або engineType
const badCategoryGame = {
  ...GAME_REGISTRY[0],
  id: 'invalid-game',
  category: 'super-hero-unknown'
};
const badCatErrors = validateGameContract(badCategoryGame);
if (badCatErrors.some((err) => err.includes('неприпустиму категорію'))) {
  console.log('✅ Тест 4.1 пройдено: Неприпустима категорія успішно заблокована.');
} else {
  console.error('❌ Тест 4.1 провалено: Неприпустима категорія не викликала помилки.');
  process.exit(1);
}

const badEngineGame = {
  ...GAME_REGISTRY[0],
  id: 'bad-engine',
  engineType: 'flash_player_obsolete'
};
const badEngineErrors = validateGameContract(badEngineGame);
if (badEngineErrors.some((err) => err.includes('неприпустимий engineType'))) {
  console.log('✅ Тест 4.2 пройдено: Неприпустимий engineType успішно заблокований.');
} else {
  console.error('❌ Тест 4.2 провалено: Неприпустимий engineType не викликав помилки.');
  process.exit(1);
}

// Тест 5: Перевірка функцій вибірки (getGamesByCategory, searchGames, getGameById)
const actionGames = getGamesByCategory('action');
if (actionGames.length >= 2 && actionGames.every((g) => g.category === 'action')) {
  console.log('✅ Тест 5.1 пройдено: Фільтрація за категорією повертає точні збіги.');
} else {
  console.error('❌ Тест 5.1 провалено.');
  process.exit(1);
}

const searchResults = searchGames('Geometry');
if (searchResults.some((g) => g.id === 'geometry_dash')) {
  console.log('✅ Тест 5.2 пройдено: Пошук коректно знаходить гру за заголовком.');
} else {
  console.error('❌ Тест 5.2 провалено.');
  process.exit(1);
}

const defaultFallback = getGameById('non_existent_id');
if (defaultFallback && defaultFallback.id === GAME_REGISTRY[0].id) {
  console.log('✅ Тест 5.3 пройдено: Невідомий ID безпечно повертає фолбек на флагман.');
} else {
  console.error('❌ Тест 5.3 провалено.');
  process.exit(1);
}

console.log('\n🎉 ВСІ АВТОМАТИЗОВАНІ ТЕСТИ GAME REGISTRY & CONTRACT УСПІШНО ПРОЙДЕНО!');
