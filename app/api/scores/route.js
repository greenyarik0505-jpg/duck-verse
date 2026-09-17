import { NextResponse } from 'next/server';
import { scoresRepository } from '../../../lib/storage/scoresRepository';
import {
  ALLOWED_GAMES,
  MAX_PAYLOAD_BYTES,
  validateScore,
  sanitizeUsername,
} from '../../../lib/scores/validation';

// Rate limiting in-memory map for anti-abuse protection
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 хв
const MAX_REQUESTS_PER_WINDOW = 30;

function checkRateLimit(ip) {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  validTimestamps.push(now);
  rateLimitMap.set(ip, validTimestamps);
  return true;
}

/**
 * GET /api/scores
 * Повертає список рекордів із пагінацією та стабільним сортуванням.
 * Параметри запиту:
 * - game: slug гри (за замовчуванням 'geometry_dash')
 * - limit: кількість записів (за замовчуванням 20, max 100)
 * - offset: зсув (за замовчуванням 0)
 * - sortBy: 'score' або 'date'
 * - order: 'desc' або 'asc'
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const game = searchParams.get('game') || 'geometry_dash';

    if (!ALLOWED_GAMES.has(game)) {
      return NextResponse.json(
        { success: false, error: 'Невідомий ідентифікатор гри' },
        { status: 400 }
      );
    }

    const limit = searchParams.get('limit') || 20;
    const offset = searchParams.get('offset') || 0;
    const sortBy = searchParams.get('sortBy') || 'score';
    const order = searchParams.get('order') || 'desc';

    const result = await scoresRepository.getScores({
      game,
      limit,
      offset,
      sortBy,
      order
    });

    return NextResponse.json(
      {
        success: true,
        game,
        scores: result.scores,
        ...result
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30'
        }
      }
    );
  } catch (err) {
    console.error('[API /scores GET] Помилка отримання рекордів:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Не вдалося завантажити рекорди',
        details: err.message
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/scores
 * Додає новий результат гри із валідацією, санітизацією та підтримкою ідемпотентності.
 * Тіло запиту:
 * {
 *   "username": "Player1",
 *   "game": "geometry_dash",
 *   "score": "100%",
 *   "idempotencyKey": "optional-uuid"
 * }
 */
export async function POST(request) {
  try {
    // 1. Check Content-Type
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json')) {
      return NextResponse.json(
        { success: false, error: 'Очікується заголовок Content-Type: application/json' },
        { status: 415 }
      );
    }

    // 2. Anti-abuse rate limiting per client IP
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown-client';

    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { success: false, error: 'Забагато запитів. Зачекайте 1 хвилину перед повторною відправкою.' },
        { status: 429 }
      );
    }

    // 3. Read body safely & verify size
    const rawText = await request.text();
    if (new TextEncoder().encode(rawText).length > MAX_PAYLOAD_BYTES) {
      return NextResponse.json(
        { success: false, error: 'Розмір запиту перевищує ліміт (максимум 8 КБ)' },
        { status: 413 }
      );
    }

    let body;
    try {
      body = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Некоректний JSON у тілі запиту' },
        { status: 400 }
      );
    }

    const { username, game, score, idempotencyKey } = body || {};

    // 4. Validate game allowlist
    if (!game || !ALLOWED_GAMES.has(game)) {
      return NextResponse.json(
        { success: false, error: 'Невідома або недозволена гра' },
        { status: 400 }
      );
    }

    // 5. Validate & sanitize username
    const validUsername = sanitizeUsername(username);
    if (!validUsername) {
      return NextResponse.json(
        {
          success: false,
          error: "Ім'я гравця має містити від 2 до 30 символів (букви, цифри, пробіли, дефіси)"
        },
        { status: 400 }
      );
    }

    // 6. Validate score format & range
    if (!validateScore(game, score)) {
      return NextResponse.json(
        { success: false, error: 'Некоректний формат або діапазон очок для цієї гри' },
        { status: 400 }
      );
    }

    // 7. Store new record safely in persistent repository
    const formattedScore = typeof score === 'string' ? score.trim() : String(score);
    const result = await scoresRepository.addScore({
      username: validUsername,
      game,
      score: formattedScore,
      idempotencyKey
    });

    return NextResponse.json(
      {
        success: true,
        record: result.record,
        duplicate: result.duplicate
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[API /scores POST] Помилка збереження рекорду:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Внутрішня помилка обробки запиту',
        details: err.message
      },
      { status: 500 }
    );
  }
}
