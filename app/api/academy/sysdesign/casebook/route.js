import { NextResponse } from 'next/server';
import {
  TRADE_OFF_DIMENSIONS,
  MENTOR_RUBRIC_CRITERIA,
  PASSING_SCORE_THRESHOLD,
  getCasebook,
  getAdrRegistry,
  getCaseById,
  getAdrById,
  submitAdrProposal,
  reviewAdrProposal,
  supersedeAdr,
  resetCasebookStore,
} from '@/lib/academy/sysdesign/casebook';

export async function GET() {
  try {
    const cases = getCasebook();
    const adrs = getAdrRegistry();

    return NextResponse.json({
      success: true,
      cases,
      adrs,
      tradeOffDimensions: TRADE_OFF_DIMENSIONS,
      rubricCriteria: MENTOR_RUBRIC_CRITERIA,
      passingThreshold: PASSING_SCORE_THRESHOLD,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch architecture casebook' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'submit_adr') {
      const { caseId, alternativeId, title, rationale, rollbackPlan, author, jiraKey } = body;
      const res = submitAdrProposal({
        caseId,
        alternativeId,
        title,
        rationale,
        rollbackPlan,
        author,
        jiraKey,
      });

      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        adr: res.adr,
        adrs: getAdrRegistry(),
      });
    }

    if (action === 'review_adr') {
      const { adrId, reviewer, criteriaScores, feedback } = body;
      const res = reviewAdrProposal({
        adrId,
        reviewer,
        criteriaScores,
        feedback,
      });

      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        adr: res.adr,
        reviewRecord: res.reviewRecord,
        adrs: getAdrRegistry(),
      });
    }

    if (action === 'supersede_adr') {
      const { oldAdrId, newAdrProposal, author } = body;
      const res = supersedeAdr({
        oldAdrId,
        newAdrProposal,
        author,
      });

      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        oldAdr: res.oldAdr,
        newAdr: res.newAdr,
        adrs: getAdrRegistry(),
      });
    }

    if (action === 'reset') {
      const adrs = resetCasebookStore();
      return NextResponse.json({
        success: true,
        adrs,
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
