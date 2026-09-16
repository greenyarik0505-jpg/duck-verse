/**
 * Duck Verse — Persistent Scores Schema & Migrations (SCRUM-41)
 * Версіонована схема даних для рекордів, гравців та індексів.
 */

export const SCHEMA_VERSION = '1.0.0';

/**
 * Парсить значення рекорду в число для точного порівняння та сортування.
 * Підтримує відсотки ("100%"), бали ("1500 pts", "1500") та інші одиниці.
 * @param {string|number} rawScore
 * @returns {number}
 */
export function parseNumericScore(rawScore) {
  if (typeof rawScore === 'number') return rawScore;
  if (!rawScore || typeof rawScore !== 'string') return 0;
  const cleaned = rawScore.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Валідує структуру одиничного запису рекорду.
 * @param {Object} record
 * @returns {string[]} масив помилок
 */
export function validateScoreRecord(record) {
  const errors = [];
  if (!record || typeof record !== 'object') {
    return ['Запис рекорду повинен бути об\'єктом'];
  }
  if (!record.id || typeof record.id !== 'string') {
    errors.push('Запис повинен містити строковий id');
  }
  if (!record.username || typeof record.username !== 'string' || record.username.trim().length === 0) {
    errors.push('Запис повинен містити непусте ім\'я користувача (username)');
  }
  if (!record.game || typeof record.game !== 'string') {
    errors.push('Запис повинен містити ідентифікатор гри (game)');
  }
  if (record.score === undefined || record.score === null) {
    errors.push('Запис повинен містити score');
  }
  if (!record.date || typeof record.date !== 'string') {
    errors.push('Запис повинен містити дату у форматі YYYY-MM-DD');
  }
  return errors;
}

/**
 * Створює початковий порожній стан сховища з версіонуванням та індексами.
 */
export function createDefaultStorage() {
  const initialRecords = [
    {
      id: 'seed-1',
      username: 'Yarik0505',
      game: 'geometry_dash',
      score: '100%',
      numericScore: 100,
      date: '2026-09-04',
      createdAt: '2026-09-04T12:00:00.000Z'
    },
    {
      id: 'seed-2',
      username: 'Степаненко Дмитро',
      game: 'geometry_dash',
      score: '92%',
      numericScore: 92,
      date: '2026-09-04',
      createdAt: '2026-09-04T12:05:00.000Z'
    },
    {
      id: 'seed-3',
      username: 'Кирил Пушкарук',
      game: 'geometry_dash',
      score: '88%',
      numericScore: 88,
      date: '2026-09-04',
      createdAt: '2026-09-04T12:10:00.000Z'
    }
  ];

  return migrateStorage({
    version: SCHEMA_VERSION,
    records: initialRecords,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Мігрує або оптимізує структуру сховища до актуальної версії.
 * Будує індекси за грою, гравцем і датою.
 * @param {Object} data
 * @returns {Object} мігрована структура
 */
export function migrateStorage(data) {
  if (!data || typeof data !== 'object') {
    return createDefaultStorage();
  }

  const records = Array.isArray(data.records) ? data.records : [];
  const normalizedRecords = [];
  const indexByGame = {};
  const indexByPlayer = {};
  const indexByDate = {};

  for (const item of records) {
    if (!item || !item.username || !item.game || item.score === undefined) continue;

    const id = item.id || `rec-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const date = item.date || new Date().toISOString().split('T')[0];
    const numericScore = item.numericScore !== undefined ? item.numericScore : parseNumericScore(item.score);

    const record = {
      id,
      username: String(item.username).trim().slice(0, 32),
      game: String(item.game).trim().toLowerCase(),
      score: String(item.score),
      numericScore,
      date,
      idempotencyKey: item.idempotencyKey || null,
      createdAt: item.createdAt || new Date().toISOString()
    };

    normalizedRecords.push(record);

    // Індекс за грою
    if (!indexByGame[record.game]) indexByGame[record.game] = [];
    indexByGame[record.game].push(record.id);

    // Індекс за гравцем
    if (!indexByPlayer[record.username]) indexByPlayer[record.username] = [];
    indexByPlayer[record.username].push(record.id);

    // Індекс за датою
    if (!indexByDate[record.date]) indexByDate[record.date] = [];
    indexByDate[record.date].push(record.id);
  }

  return {
    version: SCHEMA_VERSION,
    records: normalizedRecords,
    indices: {
      byGame: indexByGame,
      byPlayer: indexByPlayer,
      byDate: indexByDate
    },
    updatedAt: new Date().toISOString()
  };
}
