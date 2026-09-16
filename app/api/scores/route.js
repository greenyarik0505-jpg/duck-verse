import { NextResponse } from 'next/server';
import { scoresRepository } from '../../../lib/storage/scoresRepository';

export const dynamic = 'force-dynamic';

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
 * Додає новий результат гри із підтримкою ідемпотентності.
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
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Некоректне або порожнє тіло запиту JSON' },
        { status: 400 }
      );
    }

    const { username, game, score, idempotencyKey } = body;

    if (!username || typeof username !== 'string' || !username.trim()) {
      return NextResponse.json(
        { success: false, error: 'Поле username є обов\'язковим' },
        { status: 400 }
      );
    }
    if (!game || typeof game !== 'string' || !game.trim()) {
      return NextResponse.json(
        { success: false, error: 'Поле game є обов\'язковим' },
        { status: 400 }
      );
    }
    if (score === undefined || score === null || String(score).trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Поле score є обов\'язковим' },
        { status: 400 }
      );
    }

    const result = await scoresRepository.addScore({
      username,
      game,
      score,
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
        error: 'Не вдалося зберегти рекорд',
        details: err.message
      },
      { status: 500 }
    );
  }
}
