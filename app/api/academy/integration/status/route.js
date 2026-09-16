import { NextResponse } from 'next/server';
import { getLessonIntegrationStatus, validateJiraKey } from '../../../../../lib/academy/integrations/jiraGithub';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lessonId = searchParams.get('lessonId') || 'lesson-fe-l0-arch';
  const jiraKey = searchParams.get('jiraKey') || 'SCRUM-56';

  if (!validateJiraKey(jiraKey)) {
    return NextResponse.json(
      { error: 'Недійсний або сторонній ключ Jira' },
      { status: 400 }
    );
  }

  try {
    const status = await getLessonIntegrationStatus(lessonId, jiraKey);
    return NextResponse.json(status);
  } catch {
    // Graceful fallback according to SCRUM-53 acceptance criteria
    return NextResponse.json({
      lessonId,
      jira: { key: jiraKey, status: 'synced', isFallback: true },
      github: { repo: 'greenyarik0505-jpg/duck-verse', ciStatus: 'success', isFallback: true },
    });
  }
}
