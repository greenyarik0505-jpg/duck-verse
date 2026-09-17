import { NextResponse } from 'next/server';
import {
  LEADERSHIP_PILLARS,
  getMentoringSessions,
  createMentoringSession,
  submitLearnerSelfReview,
  amendMentoringFeedback,
  calculateRotationReport,
  exportAnonymizedFeedbackExamples,
  resetLeadershipLoopStore,
} from '@/lib/academy/mentoring/leadership_loop';

export async function GET() {
  try {
    const sessions = getMentoringSessions();
    const rotationReport = calculateRotationReport();
    const anonymizedSamples = exportAnonymizedFeedbackExamples();

    return NextResponse.json({
      success: true,
      sessions,
      pillars: LEADERSHIP_PILLARS,
      rotationReport,
      anonymizedSamples,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch mentoring leadership data' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'create_session') {
      const {
        prReference,
        jiraKey,
        mentorName,
        mentorId,
        learnerName,
        learnerId,
        preReviewGoal,
        observableFeedback,
        praiseHighlight,
        improvementTip,
        scores,
      } = body;

      const res = createMentoringSession({
        prReference,
        jiraKey,
        mentorName,
        mentorId,
        learnerName,
        learnerId,
        preReviewGoal,
        observableFeedback,
        praiseHighlight,
        improvementTip,
        scores,
      });

      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        session: res.session,
        sessions: getMentoringSessions(),
        rotationReport: calculateRotationReport(),
      });
    }

    if (action === 'submit_self_review') {
      const { sessionId, reflection, blindSpotsDiscovered, nextExperiment } = body;
      const res = submitLearnerSelfReview({
        sessionId,
        reflection,
        blindSpotsDiscovered,
        nextExperiment,
      });

      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        session: res.session,
        sessions: getMentoringSessions(),
      });
    }

    if (action === 'amend_feedback') {
      const {
        sessionId,
        amendedBy,
        amendmentReason,
        newFeedback,
        newPraise,
        newTip,
        newScores,
      } = body;

      const res = amendMentoringFeedback({
        sessionId,
        amendedBy,
        amendmentReason,
        newFeedback,
        newPraise,
        newTip,
        newScores,
      });

      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        session: res.session,
        sessions: getMentoringSessions(),
      });
    }

    if (action === 'calculate_rotation') {
      const rotationReport = calculateRotationReport();
      return NextResponse.json({
        success: true,
        rotationReport,
      });
    }

    if (action === 'reset') {
      const res = resetLeadershipLoopStore();
      return NextResponse.json({
        success: true,
        sessions: res.sessions,
        rotationReport: calculateRotationReport(),
      });
    }

    return NextResponse.json(
      { success: false, error: `Unsupported action: ${action}` },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
