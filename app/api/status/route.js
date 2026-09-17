import { NextResponse } from 'next/server';
import {
  getStatusPageSnapshot,
  createIncident,
  updateIncidentStatus,
  resolveIncident,
  setComponentStatus,
} from '@/lib/status/engine.js';

export async function GET() {
  try {
    const snapshot = getStatusPageSnapshot();
    return NextResponse.json({ success: true, ...snapshot });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || 'Помилка отримання статусу сервісів' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'report_incident': {
        const { title, severity, impactSummary, affectedComponents, nextUpdateDue, initialMessage } = body;
        const incident = createIncident({ title, severity, impactSummary, affectedComponents, nextUpdateDue, initialMessage });
        return NextResponse.json({ success: true, incident });
      }

      case 'update_incident': {
        const { incidentId, status, message, nextUpdateDue } = body;
        const incident = updateIncidentStatus(incidentId, { status, message, nextUpdateDue });
        return NextResponse.json({ success: true, incident });
      }

      case 'resolve_incident': {
        const { incidentId, resolutionMessage, rootCause, correctiveActions } = body;
        const incident = resolveIncident(incidentId, { resolutionMessage, rootCause, correctiveActions });
        return NextResponse.json({ success: true, incident });
      }

      case 'set_component_status': {
        const { componentId, newStatus } = body;
        const component = setComponentStatus(componentId, newStatus);
        return NextResponse.json({ success: true, component });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Невідома дія: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || 'Помилка обробки інциденту' },
      { status: 400 }
    );
  }
}
