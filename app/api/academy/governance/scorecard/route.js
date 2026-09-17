import { NextResponse } from 'next/server';
import {
  evaluateGovernanceScorecard,
  SCORECARD_RUBRIC_VERSION,
  SCORECARD_EFFECTIVE_DATE,
  SCORECARD_CHANGELOG,
  EVIDENCE_DIMENSIONS,
  PASSING_SCORECARD_FIXTURE,
  FAILING_SCORECARD_FIXTURE
} from '../../../../../lib/academy/governance/governance_scorecard';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fixture = searchParams.get('fixture');

    let submission = PASSING_SCORECARD_FIXTURE;
    if (fixture === 'failing') {
      submission = FAILING_SCORECARD_FIXTURE;
    }

    const evaluation = evaluateGovernanceScorecard(submission);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      rubricVersion: SCORECARD_RUBRIC_VERSION,
      effectiveDate: SCORECARD_EFFECTIVE_DATE,
      changelog: SCORECARD_CHANGELOG,
      dimensions: Object.values(EVIDENCE_DIMENSIONS).map((d) => ({
        id: d.id,
        name: d.name,
        weight: d.weight,
        description: d.description
      })),
      evaluation
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, submission, note, dispute } = body;

    if (action === 'add_mentor_note') {
      const existing = submission || PASSING_SCORECARD_FIXTURE;
      const updatedNotes = [...(existing.mentorNotes || []), note];
      const evaluation = evaluateGovernanceScorecard({ ...existing, mentorNotes: updatedNotes });
      return NextResponse.json({ success: true, evaluation });
    }

    if (action === 'add_dispute') {
      const existing = submission || PASSING_SCORECARD_FIXTURE;
      const updatedDisputes = [...(existing.disputes || []), dispute];
      const evaluation = evaluateGovernanceScorecard({ ...existing, disputes: updatedDisputes });
      return NextResponse.json({ success: true, evaluation });
    }

    const evaluation = evaluateGovernanceScorecard(body.submission || body);
    return NextResponse.json({
      success: true,
      evaluation
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
