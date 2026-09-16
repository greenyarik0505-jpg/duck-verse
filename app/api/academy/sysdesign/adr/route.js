import { NextResponse } from 'next/server';
import {
  DOMAIN_BOUNDARIES,
  ADR_REGISTRY,
  validateAdrStructure,
  runArchitectureReviewCheckpoint
} from '../../../../../lib/academy/sysdesign/adr';

export async function GET() {
  return NextResponse.json({
    success: true,
    boundaries: DOMAIN_BOUNDARIES,
    adrs: ADR_REGISTRY
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action = 'checkpoint', proposal, adr } = body;

    if (action === 'validate_adr') {
      const result = validateAdrStructure(adr || {});
      return NextResponse.json({
        success: true,
        ...result
      });
    }

    if (action === 'checkpoint') {
      const result = runArchitectureReviewCheckpoint(proposal || {});
      return NextResponse.json({
        success: true,
        result
      });
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
