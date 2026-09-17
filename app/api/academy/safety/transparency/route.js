import { NextResponse } from 'next/server';
import { verifySignedSessionToken } from '../../../../../lib/academy/auth/session';
import {
  getStudentConsentAndControls,
  updateStudentAiConsent,
  recordAiInteraction,
  getFallbackAssistance,
  exportStudentAiHistory,
  deleteStudentAiHistory,
} from '../../../../../lib/academy/safety/transparency';

function getAuthenticatedUser(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/duck_academy_session=([^;]+)/);
  if (match) {
    const verified = verifySignedSessionToken(match[1]);
    if (verified.valid && verified.session) {
      return verified.session;
    }
  }
  return { userId: 'student_eva_01', username: 'Eva Coder', role: 'student' };
}

/**
 * GET /api/academy/safety/transparency
 */
export async function GET(request) {
  const currentUser = getAuthenticatedUser(request);
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId') || currentUser.userId;
  const lessonId = searchParams.get('lessonId') || undefined;

  try {
    const consentData = getStudentConsentAndControls({ studentId });
    const fallback = getFallbackAssistance({ lessonId });

    return NextResponse.json({
      success: true,
      consent: consentData,
      fallback,
      currentUser,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message, code: err.code || 'UNKNOWN_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/academy/safety/transparency
 */
export async function POST(request) {
  const currentUser = getAuthenticatedUser(request);
  const actor = {
    id: currentUser.userId,
    username: currentUser.username,
    role: currentUser.role,
  };

  try {
    const body = await request.json();
    const { action, studentId = actor.id, ...payload } = body;

    if (action === 'update_consent') {
      const updated = updateStudentAiConsent({
        studentId,
        aiAssistanceEnabled: payload.aiAssistanceEnabled,
        aiTelemetryConsent: payload.aiTelemetryConsent,
        parentConsentVerified: payload.parentConsentVerified,
        actor,
      });
      return NextResponse.json({ success: true, consent: updated });
    }

    if (action === 'record_interaction') {
      const metadataCard = recordAiInteraction({
        studentId,
        modelId: payload.modelId,
        promptText: payload.promptText,
        responseText: payload.responseText,
        taskContext: payload.taskContext,
      });
      return NextResponse.json({ success: true, metadataCard });
    }

    if (action === 'export_history') {
      const exported = exportStudentAiHistory({ studentId, actor });
      return NextResponse.json({ success: true, export: exported });
    }

    if (action === 'delete_history') {
      const result = deleteStudentAiHistory({ studentId, actor });
      return NextResponse.json(result);
    }

    if (action === 'get_fallback') {
      const fallback = getFallbackAssistance({ lessonId: payload.lessonId });
      return NextResponse.json({ success: true, fallback });
    }

    return NextResponse.json({ success: false, error: 'Невідома дія (action)' }, { status: 400 });
  } catch (err) {
    const status = err.code === 'AI_ASSISTANCE_DISABLED' ? 409 : err.code?.includes('UNAUTHORIZED') ? 403 : 400;
    return NextResponse.json({ success: false, error: err.message, code: err.code }, { status });
  }
}
