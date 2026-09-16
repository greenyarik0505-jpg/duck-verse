import { NextResponse } from 'next/server';
import {
  CAPSTONE_GATES,
  getOrCreateCapstoneProgress,
  submitCapstoneGate,
  issueGraduationCertificate,
} from '../../../../../lib/academy/capstone/workflow';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId') || 'user_student_yarik';

  const progress = getOrCreateCapstoneProgress(studentId);
  return NextResponse.json({
    gates: CAPSTONE_GATES,
    progress,
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, studentId = 'user_student_yarik', gateId, evidence, trackId } = body;

    if (action === 'graduate') {
      const certificate = issueGraduationCertificate(studentId, trackId);
      return NextResponse.json({ success: true, certificate });
    }

    if (action === 'submit_gate') {
      const result = submitCapstoneGate({ studentId, gateId, evidence });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Невідома дія (action)' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
