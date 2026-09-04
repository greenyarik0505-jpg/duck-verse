import { NextResponse } from 'next/server';

// In-memory score cache with fallback for Vercel Serverless
let highScores = [
  { username: 'Yarik0505', game: 'geometry_dash', score: '100%', date: '2026-09-04' },
  { username: 'Степаненко Дмитро', game: 'geometry_dash', score: '92%', date: '2026-09-04' },
  { username: 'Кирил Пушкарук', game: 'geometry_dash', score: '88%', date: '2026-09-04' }
];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const game = searchParams.get('game') || 'geometry_dash';
  const filtered = highScores.filter(s => s.game === game);
  return NextResponse.json({ success: true, scores: filtered });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, game, score } = body;
    if (!username || !game || !score) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newRecord = {
      username,
      game,
      score,
      date: new Date().toISOString().split('T')[0]
    };

    highScores.unshift(newRecord);
    if (highScores.length > 50) highScores.pop();

    return NextResponse.json({ success: true, record: newRecord });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 500 });
  }
}
