import { NextResponse } from 'next/server';
import {
  TEAM_MEMBERS,
  QUARTERLY_ROADMAP,
  RISK_REGISTER,
  TECH_RADAR,
  GRADUATION_GATES,
  calculateWorkloadFairness,
  triageNewTask,
  validateGovernanceModel
} from '../../../../lib/academy/governance/roadmap';

export async function GET() {
  try {
    const validation = validateGovernanceModel();
    const fairness = calculateWorkloadFairness();

    return NextResponse.json({
      success: true,
      data: {
        team: TEAM_MEMBERS,
        roadmap: QUARTERLY_ROADMAP,
        workload: fairness,
        risks: RISK_REGISTER,
        techRadar: TECH_RADAR,
        graduationGates: GRADUATION_GATES,
        validation
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve governance model', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const result = triageNewTask(body);

    if (!result.valid) {
      return NextResponse.json(
        { success: false, errors: result.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Task triaged successfully',
      task: result.triagedTask
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid task triage request', details: error.message },
      { status: 400 }
    );
  }
}
