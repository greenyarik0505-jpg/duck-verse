/**
 * Duck Verse — Game Contract & Validation (SCRUM-40)
 * Стандартизований контракт для всіх ігор у хабі:
 * метадані, тип рушія, керування, скоринг та доступність (a11y).
 */

export const ALLOWED_CATEGORIES = ['action', 'arcade', 'puzzle', 'casual'];
export const ALLOWED_STATUSES = ['playable', 'coming_soon', 'maintenance', 'deprecated'];
export const ALLOWED_ENGINE_TYPES = ['canvas', 'react', 'dom'];

/**
 * Валідує одиничний об'єкт гри на відповідність контракту Duck Verse Game.
 * @param {Object} game - об'єкт конфігурації гри
 * @returns {string[]} список знайдених помилок (порожній, якщо валідно)
 */
export function validateGameContract(game) {
  const errors = [];

  if (!game || typeof game !== 'object') {
    return ['Конфігурація гри повинна бути непустим об\'єктом'];
  }

  // Обов'язкові текстові поля
  if (!game.id || typeof game.id !== 'string' || !/^[a-z0-9_-]+$/.test(game.id)) {
    errors.push(`Гра має невалідний 'id': очікується непорожній slug [a-z0-9_-]+, отримано '${game.id}'`);
  }
  if (!game.title || typeof game.title !== 'string') {
    errors.push(`Гра '${game.id || 'unknown'}' не має обов'язкового поля 'title'`);
  }
  if (!game.desc || typeof game.desc !== 'string') {
    errors.push(`Гра '${game.id || 'unknown'}' не має обов'язкового поля 'desc'`);
  }
  if (!game.tag || typeof game.tag !== 'string') {
    errors.push(`Гра '${game.id || 'unknown'}' не має обов'язкового поля 'tag'`);
  }
  if (!game.badge || typeof game.badge !== 'string') {
    errors.push(`Гра '${game.id || 'unknown'}' не має обов'язкового поля 'badge'`);
  }
  if (!game.icon || typeof game.icon !== 'string') {
    errors.push(`Гра '${game.id || 'unknown'}' не має обов'язкового поля 'icon'`);
  }

  // Категорія
  if (!ALLOWED_CATEGORIES.includes(game.category)) {
    errors.push(`Гра '${game.id}' має неприпустиму категорію '${game.category}'. Дозволені: ${ALLOWED_CATEGORIES.join(', ')}`);
  }

  // Статус
  if (!ALLOWED_STATUSES.includes(game.status)) {
    errors.push(`Гра '${game.id}' має неприпустимий статус '${game.status}'. Дозволені: ${ALLOWED_STATUSES.join(', ')}`);
  }

  // Тип рушія та шлях
  if (!ALLOWED_ENGINE_TYPES.includes(game.engineType)) {
    errors.push(`Гра '${game.id}' має неприпустимий engineType '${game.engineType}'. Дозволені: ${ALLOWED_ENGINE_TYPES.join(', ')}`);
  }
  if (!game.enginePath || typeof game.enginePath !== 'string') {
    errors.push(`Гра '${game.id}' не має обов'язкового поля 'enginePath'`);
  }

  // Контракт керування (controls)
  if (!game.controls || typeof game.controls !== 'object') {
    errors.push(`Гра '${game.id}' повинна містити об'єкт 'controls'`);
  } else {
    if (!game.controls.summary || typeof game.controls.summary !== 'string') {
      errors.push(`Гра '${game.id}' повинна містити 'controls.summary' для HUD та футера`);
    }
  }

  // Контракт підрахунку очок (scoring)
  if (!game.scoring || typeof game.scoring !== 'object') {
    errors.push(`Гра '${game.id}' повинна містити об'єкт 'scoring'`);
  } else {
    if (!game.scoring.type || typeof game.scoring.type !== 'string') {
      errors.push(`Гра '${game.id}' повинна містити 'scoring.type'`);
    }
  }

  return errors;
}

/**
 * Валідує весь реєстр ігор на унікальність id та дотримання контракту кожною грою.
 * @param {Array} registry - масив ігор GAME_REGISTRY
 * @throws {Error} якщо виявлено невалідні записи або дублікати id
 * @returns {boolean} true, якщо всі перевірки пройдені
 */
export function validateGameRegistry(registry) {
  if (!Array.isArray(registry) || registry.length === 0) {
    throw new Error('GAME_REGISTRY повинен бути непорожнім масивом');
  }

  const seenIds = new Set();
  const allErrors = [];

  for (let i = 0; i < registry.length; i++) {
    const game = registry[i];
    const contractErrors = validateGameContract(game);

    if (game && game.id) {
      if (seenIds.has(game.id)) {
        contractErrors.push(`Дублікат ідентифікатора гри: '${game.id}' вже використовується`);
      } else {
        seenIds.add(game.id);
      }
    }

    if (contractErrors.length > 0) {
      allErrors.push(`[Помилка у грі #${i + 1} (${game?.id || 'невідомо'})]: ${contractErrors.join('; ')}`);
    }
  }

  if (allErrors.length > 0) {
    throw new Error(`Помилки валідації GAME_REGISTRY:\n${allErrors.join('\n')}`);
  }

  return true;
}
