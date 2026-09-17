import { NextResponse } from 'next/server';
import {
  buildDependencyGraph,
  getNextAvailableTasks,
  filterForChildView,
  generateBlockedWorkAlerts,
  BROKEN_CIRCULAR_FIXTURE,
  BROKEN_MISSING_PREREQ_FIXTURE,
  DEFAULT_ROADMAP_ISSUES
} from '../../../../../lib/academy/governance/roadmap_visualizer';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'mentor';
    const childId = searchParams.get('childId') || '712020:d66a7a94-b2f2-4434-9582-8190026d3c20';
    const fixture = searchParams.get('fixture');

    let issues = DEFAULT_ROADMAP_ISSUES;
    if (fixture === 'circular') {
      issues = BROKEN_CIRCULAR_FIXTURE.issues;
    } else if (fixture === 'missing_prereq') {
      issues = BROKEN_MISSING_PREREQ_FIXTURE.issues;
    }

    let graph = buildDependencyGraph(issues);

    if (role === 'child') {
      graph = filterForChildView(graph, childId);
    }

    const nextTasks = getNextAvailableTasks(graph, role === 'child' ? childId : null);
    const alertsData = generateBlockedWorkAlerts(graph);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      role,
      graph,
      nextAvailableTasks: nextTasks,
      alerts: alertsData.alerts,
      alertsSummary: {
        active: alertsData.activeCount,
        suppressed: alertsData.suppressedCount
      }
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
    const { issues, links, role, childId, recentAlertHistory } = body;

    if (!issues || !Array.isArray(issues)) {
      return NextResponse.json(
        { success: false, error: 'Invalid payload: "issues" array is required' },
        { status: 400 }
      );
    }

    let graph = buildDependencyGraph(issues, links);

    if (role === 'child' && childId) {
      graph = filterForChildView(graph, childId);
    }

    const nextTasks = getNextAvailableTasks(graph, role === 'child' ? childId : null);
    const alertsData = generateBlockedWorkAlerts(graph, { recentAlertHistory: recentAlertHistory || {} });

    return NextResponse.json({
      success: true,
      graph,
      nextAvailableTasks: nextTasks,
      alerts: alertsData.alerts,
      hasCycles: graph.hasCycles,
      cycles: graph.cycles,
      hasMissingPrerequisites: graph.hasMissingPrerequisites,
      missingPrerequisites: graph.missingPrerequisites
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
