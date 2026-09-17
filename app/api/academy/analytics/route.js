import { NextResponse } from 'next/server';
import {
  getProductAnalyticsSnapshot,
  ingestAnalyticsEvent,
  detectPiiInPayload,
  calculateLearningKpis,
  getPlatformHealthMetrics,
} from '@/lib/academy/analytics/taxonomy.js';

export async function GET() {
  try {
    const snapshot = getProductAnalyticsSnapshot();
    return NextResponse.json({ success: true, ...snapshot });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || 'Помилка отримання продуктової аналітики' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'ingest_event': {
        const { event } = body;
        if (!event) {
          return NextResponse.json({ success: false, error: 'Відсутнє поле event' }, { status: 400 });
        }
        const outcome = ingestAnalyticsEvent(event);
        return NextResponse.json({ success: true, ...outcome });
      }

      case 'check_pii': {
        const { payload } = body;
        const result = detectPiiInPayload(payload);
        return NextResponse.json({ success: true, ...result });
      }

      case 'get_kpis': {
        const kpis = calculateLearningKpis();
        return NextResponse.json({ success: true, kpis });
      }

      case 'get_health': {
        const health = getPlatformHealthMetrics();
        return NextResponse.json({ success: true, health });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Невідома дія (action): ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    const isPiiBlocked = error.message && error.message.includes('PII Shield');
    const isValidation = error.message && error.message.includes('схеми');
    const status = isPiiBlocked ? 403 : isValidation ? 422 : 400;

    return NextResponse.json(
      { success: false, error: error.message || 'Помилка обробки події аналітики' },
      { status }
    );
  }
}
