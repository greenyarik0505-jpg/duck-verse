import { NextResponse } from 'next/server';
import {
  getReleaseReadinessSnapshot,
  validateReleaseReadiness,
  approveHighRiskRelease,
  executeReleaseRecord,
  toggleReleaseGate,
} from '@/lib/academy/ops/release_readiness.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'mentor';
    const name = searchParams.get('name') || 'Mentor';

    const snapshot = getReleaseReadinessSnapshot({ role, name });
    return NextResponse.json({ success: true, ...snapshot });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || 'Помилка отримання релізного статусу' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'validate': {
        const validation = validateReleaseReadiness();
        return NextResponse.json({ success: true, validation });
      }

      case 'approve_release': {
        const { releaseId, mentorActor, notes } = body;
        const result = approveHighRiskRelease(releaseId, mentorActor, notes);
        return NextResponse.json({ success: true, ...result });
      }

      case 'execute_release': {
        const { releaseId, outcome, followUpTasks, deployer } = body;
        const record = executeReleaseRecord(releaseId, outcome, followUpTasks, deployer);
        return NextResponse.json({ success: true, record });
      }

      case 'toggle_gate': {
        const { gateId, isChecked } = body;
        const result = toggleReleaseGate(gateId, isChecked);
        return NextResponse.json({ success: true, ...result });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Невідома дія: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    const isAuth = error.message && error.message.includes('Тільки ментор');
    const status = isAuth ? 403 : 400;

    return NextResponse.json(
      { success: false, error: error.message || 'Помилка виконання релізної операції' },
      { status }
    );
  }
}
