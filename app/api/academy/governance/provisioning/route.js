import { NextResponse } from 'next/server';
import {
  provisionRepository,
  PERMISSIONS_MATRIX,
  DEFAULT_BRANCH_PROTECTION_RULESET,
  getStandardBaselineFiles
} from '../../../../../lib/academy/governance/repo_provisioning';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const repoName = searchParams.get('repoName') || 'duck-verse-learner-repo';
    const learnerName = searchParams.get('learnerName') || 'Student Learner';

    const baselineFiles = getStandardBaselineFiles(repoName, learnerName);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      permissionsMatrix: PERMISSIONS_MATRIX,
      branchProtectionRules: DEFAULT_BRANCH_PROTECTION_RULESET,
      baselineFilesSummary: baselineFiles.map((f) => ({ path: f.path, type: f.type }))
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
    const {
      repoName = 'duck-verse-learner-repo',
      learnerName = 'Student Learner',
      actorId = '712020:d66a7a94-b2f2-4434-9582-8190026d3c20',
      isDryRun = true,
      currentRepoState = {}
    } = body;

    const result = provisionRepository(currentRepoState, {
      repoName,
      learnerName,
      actorId,
      isDryRun
    });

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
