import { NextResponse } from 'next/server';
import {
  MASTERY_LEVELS,
  SKILL_TAXONOMY,
  LESSON_CATALOG,
  calculateLearnerProgress
} from '../../../../lib/academy/dashboard/learningMap';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const completedParam = searchParams.get('completed');
    const username = searchParams.get('username') || 'Курсант Duck Verse';
    const role = searchParams.get('role') || 'child';

    let completedLessons = [];
    if (completedParam) {
      try {
        completedLessons = JSON.parse(completedParam);
      } catch {
        completedLessons = completedParam.split(',').map(s => s.trim()).filter(Boolean);
      }
    } else {
      // Default initial state for demonstration / guest
      completedLessons = ['lesson-fe-l0-arch'];
    }

    const progressData = calculateLearnerProgress(completedLessons, { username, role });

    return NextResponse.json({
      success: true,
      data: {
        levels: MASTERY_LEVELS,
        taxonomy: SKILL_TAXONOMY,
        ...progressData
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to compute learning map progress', details: error.message },
      { status: 500 }
    );
  }
}
