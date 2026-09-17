/**
 * Duck Verse — Scores Repository (SCRUM-41)
 * Багаторівневе надійне сховище рекордів:
 * 1. Vercel KV / Upstash Redis (якщо налаштовані змінні середовища)
 * 2. Persistent Filesystem Storage (.data/scores.json / os.tmpdir())
 * 3. Graceful In-Memory fallback із початковими даними
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  createDefaultStorage,
  migrateStorage,
  parseNumericScore,
  validateScoreRecord
} from './schema.js';

class ScoresRepository {
  constructor() {
    this.memoryState = createDefaultStorage();
    this.storageKey = 'duckverse:scores:v1';
    this.filePath = this._resolveStorageFilePath();
    this._initFromFile();
  }

  _resolveStorageFilePath() {
    try {
      const localDataDir = path.join(process.cwd(), '.data');
      if (!fs.existsSync(localDataDir)) {
        fs.mkdirSync(localDataDir, { recursive: true });
      }
      return path.join(localDataDir, 'scores.json');
    } catch {
      // Fallback для serverless read-only кореня
      return path.join(os.tmpdir(), 'duckverse_scores.json');
    }
  }

  _initFromFile() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        if (raw) {
          const parsed = JSON.parse(raw);
          this.memoryState = migrateStorage(parsed);
        }
      } else {
        this._persistToFile();
      }
    } catch (err) {
      console.warn('[ScoresRepository] Не вдалося завантажити локальний файл, використовується in-memory fallback:', err.message);
    }
  }

  _persistToFile() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.memoryState, null, 2), 'utf-8');
    } catch (err) {
      // Graceful degradation: serverless sandbox може забороняти запис
      console.warn('[ScoresRepository] Попередження запису у файл:', err.message);
    }
  }

  /**
   * Перевірка наявності Vercel KV або Upstash REST конфігурації
   */
  _getKvConfig() {
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    if (url && token) {
      return { url: url.replace(/\/$/, ''), token };
    }
    return null;
  }

  /**
   * Завантаження з KV з тайм-аутом
   */
  async _loadFromKv() {
    const kv = this._getKvConfig();
    if (!kv) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    try {
      const res = await fetch(`${kv.url}/get/${this.storageKey}`, {
        headers: { Authorization: `Bearer ${kv.token}` },
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!res.ok) return null;
      const data = await res.json();
      if (data && data.result) {
        const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
        return migrateStorage(parsed);
      }
    } catch (err) {
      console.warn('[ScoresRepository] Помилка або таймаут KV GET, fallback на локальне сховище:', err.message);
    }
    return null;
  }

  /**
   * Збереження в KV з тайм-аутом
   */
  async _saveToKv(state) {
    const kv = this._getKvConfig();
    if (!kv) return false;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    try {
      const res = await fetch(`${kv.url}/set/${this.storageKey}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kv.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(JSON.stringify(state)),
        signal: controller.signal
      });
      clearTimeout(timeout);
      return res.ok;
    } catch (err) {
      console.warn('[ScoresRepository] Помилка або таймаут KV SET:', err.message);
      return false;
    }
  }

  /**
   * Отримати поточний синхронізований стан сховища
   */
  async _getState() {
    const remoteState = await this._loadFromKv();
    if (remoteState) {
      this.memoryState = remoteState;
      this._persistToFile();
      return this.memoryState;
    }
    return this.memoryState;
  }

  /**
   * Отримати рекорди для гри із сортуванням та пагінацією.
   * @param {Object} options
   * @param {string} options.game - ідентифікатор гри
   * @param {number} [options.limit=20] - ліміт повернених записів
   * @param {number} [options.offset=0] - зсув пагінації
   * @param {string} [options.sortBy='score'] - поле сортування ('score' | 'date')
   * @param {string} [options.order='desc'] - порядок ('asc' | 'desc')
   */
  async getScores({ game = 'geometry_dash', limit = 20, offset = 0, sortBy = 'score', order = 'desc' } = {}) {
    const state = await this._getState();
    const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const safeOffset = Math.max(0, parseInt(offset, 10) || 0);

    const targetGame = String(game || 'geometry_dash').trim().toLowerCase();
    let records = state.records.filter((r) => r.game === targetGame);

    // Стабільне сортування
    records.sort((a, b) => {
      if (sortBy === 'date') {
        const cmp = new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime();
        return order === 'asc' ? -cmp : cmp;
      }
      // За замовчуванням: за числовим скором, а при рівності — за датою (новіші вище)
      const diff = (b.numericScore || 0) - (a.numericScore || 0);
      if (diff !== 0) return order === 'asc' ? -diff : diff;
      return new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime();
    });

    const total = records.length;
    const paginated = records.slice(safeOffset, safeOffset + safeLimit);

    return {
      scores: paginated,
      total,
      limit: safeLimit,
      offset: safeOffset,
      hasMore: safeOffset + safeLimit < total
    };
  }

  /**
   * Зберегти новий рекорд із перевіркою валідності та ідемпотентності.
   * @param {Object} payload
   * @param {string} payload.username
   * @param {string} payload.game
   * @param {string|number} payload.score
   * @param {string} [payload.idempotencyKey]
   */
  async addScore({ username, game, score, idempotencyKey = null }) {
    const trimmedUser = String(username || '').trim().slice(0, 32);
    const targetGame = String(game || '').trim().toLowerCase();
    const cleanScore = String(score || '').trim();
    const today = new Date().toISOString().split('T')[0];

    const state = await this._getState();

    // Перевірка ідемпотентності 1: за переданим idempotencyKey
    if (idempotencyKey) {
      const existingByKey = state.records.find((r) => r.idempotencyKey === idempotencyKey);
      if (existingByKey) {
        return { success: true, record: existingByKey, duplicate: true };
      }
    }

    // Перевірка ідемпотентності 2: однаковий гравець, гра, скор та дата сьогодні
    const existingDuplicate = state.records.find(
      (r) => r.username === trimmedUser && r.game === targetGame && r.score === cleanScore && r.date === today
    );
    if (existingDuplicate) {
      return { success: true, record: existingDuplicate, duplicate: true };
    }

    const numericScore = parseNumericScore(cleanScore);
    const newRecord = {
      id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      username: trimmedUser,
      game: targetGame,
      score: cleanScore,
      numericScore,
      date: today,
      idempotencyKey,
      createdAt: new Date().toISOString()
    };

    const errors = validateScoreRecord(newRecord);
    if (errors.length > 0) {
      throw new Error(`Невалідна структура рекорду: ${errors.join(', ')}`);
    }

    state.records.unshift(newRecord);

    // Обмежуємо загальний розмір історії на гру 100 найкращими записами для економії сховища
    const gameRecords = state.records.filter((r) => r.game === targetGame);
    if (gameRecords.length > 100) {
      const excessIds = new Set(gameRecords.slice(100).map((r) => r.id));
      state.records = state.records.filter((r) => !excessIds.has(r.id));
    }

    // Оновлюємо індекси та час
    const updatedState = migrateStorage(state);
    this.memoryState = updatedState;
    this._persistToFile();
    await this._saveToKv(updatedState);

    return { success: true, record: newRecord, duplicate: false };
  }

  /**
   * Скидання стану для тестів
   */
  resetForTesting() {
    this.memoryState = createDefaultStorage();
    this._persistToFile();
  }
}

// Singleton екземпляр
export const scoresRepository = new ScoresRepository();
