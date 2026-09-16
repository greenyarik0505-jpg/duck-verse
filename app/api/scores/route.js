import { NextResponse } from 'next/server';
import {
  ALLOWED_GAMES,
  MAX_PAYLOAD_BYTES,
  validateScore,
  sanitizeUsername,
} from '../../../lib/scores/validation.js';

// In-memory rate limiting map: ip -> [timestamps]
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_POSTS_PER_WINDOW = 20;

function checkRateLimit(ip) {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_POSTS_PER_WINDOW) {
    return false;
  }

  validTimestamps.push(now);
  rateLimitMap.set(ip, validTimestamps);
  return true;
}

// In-memory score cache
let highScores = [
  { username: 'Yarik0505', game: 'geometry_dash', score: '100%', date: '2026-09-04' },
  { username: 'Степаненко Дмитро', game: 'geometry_dash', score: '92%', date: '2026-09-04' },
  { username: 'Кирил Пушкарук', game: 'geometry_dash', score: '88%', date: '2026-09-04' },
];

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

    const filtered = highScores.filter((s) => s.game === game);
    return NextResponse.json({ success: true, scores: filtered });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Помилка отримання рекордів' },
      { status: 500 }
    );
  }
}

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

    const { username, game, score } = body || {};

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
          error: "Ім'я гравця має містити від 2 до 30 символів (букви, цифри, пробіли, дефіси)",
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

    // 7. Store new record safely
    const formattedScore = typeof score === 'string' ? score.trim() : String(score);
    const newRecord = {
      username: validUsername,
      game,
      score: formattedScore,
      date: new Date().toISOString().split('T')[0],
    };

    highScores.unshift(newRecord);
    if (highScores.length > 50) highScores.pop();

    return NextResponse.json({ success: true, record: newRecord });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Внутрішня помилка обробки запиту' },
      { status: 500 }
    );
  }
}
