import { NextResponse } from 'next/server';
import { evaluatePromptBrief, PROMPT_LAB_EXERCISES } from '../../../../../lib/academy/vibePromptLab';

/**
 * GET /api/academy/prompt-lab/evaluate
 * Повертає список доступних вправ лабораторії промптингу
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    exercises: PROMPT_LAB_EXERCISES.map((e) => ({
      id: e.id,
      title: e.title,
      level: e.level,
      difficulty: e.difficulty,
      scenario: e.scenario,
      rawIdea: e.rawIdea,
      weakPrompt: e.weakPrompt,
      strongPrompt: e.strongPrompt,
      explanation: e.explanation,
      rubricCriteria: e.rubricCriteria
    }))
  });
}

/**
 * POST /api/academy/prompt-lab/evaluate
 * Оцінює студентський бриф за інженерною рубрикою
 * Тіло запиту: { exerciseId: string, promptText: string }
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Порожнє тіло запиту' },
        { status: 400 }
      );
    }

    const { exerciseId, promptText } = body;
    if (!promptText || typeof promptText !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Поле promptText є обов\'язковим' },
        { status: 400 }
      );
    }

    const result = evaluatePromptBrief(promptText, exerciseId);

    return NextResponse.json({
      success: true,
      exerciseId: exerciseId || PROMPT_LAB_EXERCISES[0].id,
      ...result
    });
  } catch (err) {
    console.error('[API /academy/prompt-lab/evaluate POST] Помилка:', err);
    return NextResponse.json(
      { success: false, error: 'Помилка оцінювання промпту', details: err.message },
      { status: 500 }
    );
  }
}
