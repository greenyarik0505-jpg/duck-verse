import { NextResponse } from 'next/server';
import {
  getObservabilityState,
  simulateControlledIncident,
  resolveIncident,
  createStructuredLog
} from '../../../../lib/academy/observability/slo';

export async function GET() {
  const state = getObservabilityState();
  return NextResponse.json({
    success: true,
    ...state
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action = 'simulate', type = 'latency_spike', logData } = body;

    if (action === 'simulate') {
      const res = simulateControlledIncident(type);
      return NextResponse.json({ success: true, ...res });
    }

    if (action === 'resolve') {
      const res = resolveIncident();
      return NextResponse.json({ success: true, ...res });
    }

    if (action === 'log') {
      const logEntry = createStructuredLog(logData || {});
      return NextResponse.json({ success: true, logEntry });
    }

    return NextResponse.json(
      { success: false, error: 'Невідома дія (action)' },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 400 }
    );
  }
}
