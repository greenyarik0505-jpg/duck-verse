import { NextResponse } from 'next/server';
import {
  METRIC_DEFINITIONS,
  createDefaultSeniorDossier,
  sanitizeSeniorDossier,
  exportSeniorDossierToMarkdown,
  validateNarrative,
  validateDossierAntiToxicSafeguards,
} from '@/lib/academy/portfolio/dossier';

// In-memory state for Senior Portfolio Dossier
let currentDossier = createDefaultSeniorDossier();

export async function GET() {
  try {
    const antiToxicReport = validateDossierAntiToxicSafeguards(currentDossier);
    const sanitizedView = sanitizeSeniorDossier(currentDossier);

    return NextResponse.json({
      success: true,
      dossier: currentDossier,
      metricDefinitions: METRIC_DEFINITIONS,
      antiToxicReport,
      sanitizedView,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve senior dossier' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'add_narrative') {
      const { title, category, problem, solution, result, lessonLearned } = body;
      const validation = validateNarrative({ title, category, problem, solution, result, lessonLearned });

      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: validation.errors.join(', ') },
          { status: 400 }
        );
      }

      const newNarrative = {
        id: `narrative-${Date.now()}`,
        title: title.trim(),
        category: category || 'architecture',
        problem: problem.trim(),
        solution: solution.trim(),
        result: result.trim(),
        lessonLearned: lessonLearned.trim(),
        createdAt: new Date().toISOString(),
        verifiedByMentor: false,
      };

      currentDossier.narratives.unshift(newNarrative);
      currentDossier.updatedAt = new Date().toISOString();

      return NextResponse.json({
        success: true,
        narrative: newNarrative,
        dossier: currentDossier,
      });
    }

    if (action === 'toggle_metric') {
      const { metricKey } = body;
      if (!currentDossier.metrics[metricKey]) {
        return NextResponse.json(
          { success: false, error: `Metric ${metricKey} not found` },
          { status: 404 }
        );
      }

      currentDossier.metrics[metricKey].visible = !currentDossier.metrics[metricKey].visible;
      currentDossier.updatedAt = new Date().toISOString();

      return NextResponse.json({
        success: true,
        metrics: currentDossier.metrics,
        sanitizedView: sanitizeSeniorDossier(currentDossier),
      });
    }

    if (action === 'export_markdown') {
      const options = body.options || {};
      const sanitized = sanitizeSeniorDossier(currentDossier, options);
      const markdown = exportSeniorDossierToMarkdown(sanitized);

      return NextResponse.json({
        success: true,
        markdown,
        exportedAt: sanitized.exportedAt,
      });
    }

    if (action === 'export_json') {
      const options = body.options || {};
      const sanitized = sanitizeSeniorDossier(currentDossier, options);

      return NextResponse.json({
        success: true,
        sanitized,
      });
    }

    if (action === 'reset') {
      currentDossier = createDefaultSeniorDossier();
      return NextResponse.json({
        success: true,
        dossier: currentDossier,
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
