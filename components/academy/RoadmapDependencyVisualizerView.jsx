'use client';

import React, { useState, useMemo } from 'react';
import {
  buildDependencyGraph,
  getNextAvailableTasks,
  filterForChildView,
  generateBlockedWorkAlerts,
  BROKEN_CIRCULAR_FIXTURE,
  BROKEN_MISSING_PREREQ_FIXTURE,
  DEFAULT_ROADMAP_ISSUES,
  TASK_EXECUTION_STATE
} from '../../lib/academy/governance/roadmap_visualizer';

export default function RoadmapDependencyVisualizerView() {
  const [selectedRole, setSelectedRole] = useState('mentor'); // 'mentor' | 'child'
  const [activeFixture, setActiveFixture] = useState('live'); // 'live' | 'circular' | 'missing'
  const [alertHistory, setAlertHistory] = useState({});
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState({});

  // Active issues based on fixture selection
  const rawIssues = useMemo(() => {
    if (activeFixture === 'circular') return BROKEN_CIRCULAR_FIXTURE.issues;
    if (activeFixture === 'missing') return BROKEN_MISSING_PREREQ_FIXTURE.issues;
    return DEFAULT_ROADMAP_ISSUES;
  }, [activeFixture]);

  // Evaluated Graph
  const graph = useMemo(() => {
    const fullGraph = buildDependencyGraph(rawIssues);
    if (selectedRole === 'child') {
      return filterForChildView(fullGraph, '712020:d66a7a94-b2f2-4434-9582-8190026d3c20');
    }
    return fullGraph;
  }, [rawIssues, selectedRole]);

  // Next Available Tasks
  const nextAvailableTasks = useMemo(() => {
    return getNextAvailableTasks(
      graph,
      selectedRole === 'child' ? '712020:d66a7a94-b2f2-4434-9582-8190026d3c20' : null
    );
  }, [graph, selectedRole]);

  // Blocked-Work Alerts
  const alertsData = useMemo(() => {
    return generateBlockedWorkAlerts(graph, { recentAlertHistory: alertHistory });
  }, [graph, alertHistory]);

  const handleDismissAlert = (alertId) => {
    setAcknowledgedAlerts((prev) => ({ ...prev, [alertId]: true }));
    setAlertHistory((prev) => ({ ...prev, [alertId]: Date.now() }));
  };

  return (
    <div className="bg-slate-900/90 border border-teal-500/30 rounded-xl p-6 shadow-2xl backdrop-blur-md text-white my-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-teal-500/20 pb-4 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <h2 className="text-xl font-black tracking-wider uppercase bg-gradient-to-r from-teal-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
              Roadmap Dependency Visualizer & Blocked-Work Alerts
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Jira link-driven dependency graph, cycle detection, child learning path & actionable unblocking alerts (SCRUM-138)
          </p>
        </div>

        {/* Role & Fixture Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-800/90 rounded-lg p-1 border border-slate-700">
            <button
              onClick={() => setSelectedRole('mentor')}
              className={`px-3 py-1 text-xs font-bold rounded transition-all ${
                selectedRole === 'mentor'
                  ? 'bg-teal-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              👨‍🏫 Mentor (Full Team)
            </button>
            <button
              onClick={() => setSelectedRole('child')}
              className={`px-3 py-1 text-xs font-bold rounded transition-all ${
                selectedRole === 'child'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🧒 Child (Personal Path)
            </button>
          </div>

          <div className="flex bg-slate-800/90 rounded-lg p-1 border border-slate-700">
            <button
              onClick={() => setActiveFixture('live')}
              className={`px-2.5 py-1 text-xs font-semibold rounded ${
                activeFixture === 'live' ? 'bg-slate-700 text-teal-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              🟢 Live Jira DAG
            </button>
            <button
              onClick={() => setActiveFixture('circular')}
              className={`px-2.5 py-1 text-xs font-semibold rounded ${
                activeFixture === 'circular' ? 'bg-rose-900/80 text-rose-300' : 'text-slate-400 hover:text-rose-300'
              }`}
              title="Test circular dependency error signaling"
            >
              🔄 Broken: Cycle
            </button>
            <button
              onClick={() => setActiveFixture('missing')}
              className={`px-2.5 py-1 text-xs font-semibold rounded ${
                activeFixture === 'missing' ? 'bg-amber-900/80 text-amber-300' : 'text-slate-400 hover:text-amber-300'
              }`}
              title="Test missing prerequisite error signaling"
            >
              ⚠️ Broken: Missing Link
            </button>
          </div>
        </div>
      </div>

      {/* Error Signaling Banners */}
      {graph.hasCycles && (
        <div className="mb-6 bg-rose-950/70 border-2 border-rose-500 rounded-xl p-4 flex items-start gap-3 text-rose-200 animate-pulse">
          <span className="text-2xl">🚨</span>
          <div>
            <div className="text-sm font-black tracking-wide uppercase text-rose-400">
              CRITICAL: Circular Dependency Detected in Jira Roadmap Links!
            </div>
            <p className="text-xs text-rose-300 mt-1">
              Deadlock cycle detected: {graph.cycles.map((c) => c.join(' ➔ ')).join(' | ')}.
              Engineering pipeline blocked until cycle is broken.
            </p>
          </div>
        </div>
      )}

      {graph.hasMissingPrerequisites && (
        <div className="mb-6 bg-amber-950/70 border-2 border-amber-500 rounded-xl p-4 flex items-start gap-3 text-amber-200">
          <span className="text-2xl">⚠️</span>
          <div>
            <div className="text-sm font-black tracking-wide uppercase text-amber-400">
              Warning: Missing Prerequisite References in Jira!
            </div>
            <p className="text-xs text-amber-300 mt-1">
              The following referenced tasks do not exist in the active graph:{' '}
              {graph.missingPrerequisites.map((m) => `${m.issueKey} ➔ ${m.missingKey}`).join(', ')}.
            </p>
          </div>
        </div>
      )}

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-3 text-center">
          <div className="text-xs text-slate-400">Всього задач</div>
          <div className="text-xl font-black text-slate-200">{graph.summary.totalTasks}</div>
        </div>
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-lg p-3 text-center">
          <div className="text-xs text-emerald-400">Завершено (Done)</div>
          <div className="text-xl font-black text-emerald-300">{graph.summary.doneCount}</div>
        </div>
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-lg p-3 text-center">
          <div className="text-xs text-amber-400">В роботі (In Progress)</div>
          <div className="text-xl font-black text-amber-300">{graph.summary.inProgressCount}</div>
        </div>
        <div className="bg-cyan-950/40 border border-cyan-500/40 rounded-lg p-3 text-center">
          <div className="text-xs text-cyan-400">Доступно (Ready)</div>
          <div className="text-xl font-black text-cyan-300">{graph.summary.readyCount}</div>
        </div>
        <div className="bg-rose-950/40 border border-rose-500/40 rounded-lg p-3 text-center">
          <div className="text-xs text-rose-400">Заблоковано (Blocked)</div>
          <div className="text-xl font-black text-rose-300">{graph.summary.blockedCount}</div>
        </div>
      </div>

      {/* Next Available Tasks Spotlight */}
      <div className="mb-6 bg-cyan-950/30 border border-cyan-500/40 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">🚀</span>
          <h3 className="text-sm font-black uppercase text-cyan-300">
            Next Available Tasks (Unblocked & Ready to Start)
          </h3>
        </div>
        {nextAvailableTasks.length === 0 ? (
          <p className="text-xs text-slate-400">
            {graph.summary.blockedCount > 0
              ? 'All remaining tasks are currently blocked by pending prerequisites.'
              : 'All scheduled roadmap tasks have been successfully completed!'}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {nextAvailableTasks.map((t) => (
              <div
                key={t.key}
                className="bg-slate-800/90 border border-cyan-500/50 rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                      {t.key}
                    </span>
                    <span className="text-xs text-slate-300 font-semibold">{t.summary}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex gap-3">
                    <span>Рівень: <strong className="text-slate-200">{t.level}</strong></span>
                    <span>Виконавець: <strong className="text-teal-300">{t.owner}</strong></span>
                  </div>
                </div>
                <span className="text-xs font-bold text-cyan-300 bg-cyan-500/20 px-2.5 py-1 rounded-full border border-cyan-500/40">
                  ⚡ Можна брати
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actionable Blocked-Work Alerts */}
      {alertsData.alerts.length > 0 && (
        <div className="mb-6 bg-slate-800/70 border border-rose-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-base">🛡️</span>
              <h3 className="text-sm font-black uppercase text-rose-300">
                Actionable Blocked-Work Alerts ({alertsData.alerts.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">
              Anti-spam protection active (cooldown 60m)
            </span>
          </div>

          <div className="space-y-2">
            {alertsData.alerts.map((alert) => {
              const isAcknowledged = acknowledgedAlerts[alert.id];
              return (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border flex flex-col md:flex-row md:items-center md:justify-between gap-3 transition-all ${
                    isAcknowledged
                      ? 'bg-slate-900/40 border-slate-800 opacity-60'
                      : 'bg-rose-950/30 border-rose-500/40'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-rose-400 font-mono bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/30">
                        {alert.blockedIssueKey}
                      </span>
                      <span className="text-xs font-semibold text-slate-200">
                        {alert.taskSummary} ({alert.owner})
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${
                        alert.urgency === 'HIGH' ? 'bg-rose-600 text-white' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {alert.urgency}
                      </span>
                    </div>
                    <div className="text-xs text-amber-300/90 flex items-center gap-1.5">
                      <span>💡 Actionable Step:</span>
                      <span className="text-slate-300">{alert.actionableNextStep}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleDismissAlert(alert.id)}
                      disabled={isAcknowledged}
                      className={`text-xs px-3 py-1 rounded font-bold transition-all ${
                        isAcknowledged
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-rose-700/80 hover:bg-rose-600 text-white shadow'
                      }`}
                    >
                      {isAcknowledged ? '✓ Сповіщено' : '🔔 Сповістити власника'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dependency Graph Node Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-black uppercase text-slate-300 flex items-center gap-2">
          <span>🗺️</span>
          <span>Jira Roadmap Nodes & Execution Flow</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {graph.nodes.map((node) => {
            let stateBadge;
            let cardBorder;
            if (node.executionState === TASK_EXECUTION_STATE.DONE) {
              stateBadge = <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded border border-emerald-500/30 font-bold">✓ DONE</span>;
              cardBorder = 'border-emerald-500/20';
            } else if (node.executionState === TASK_EXECUTION_STATE.IN_PROGRESS) {
              stateBadge = <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded border border-amber-500/30 font-bold animate-pulse">⚡ IN PROGRESS</span>;
              cardBorder = 'border-amber-500/40';
            } else if (node.executionState === TASK_EXECUTION_STATE.READY_TO_START) {
              stateBadge = <span className="bg-cyan-500/20 text-cyan-300 text-[10px] px-2 py-0.5 rounded border border-cyan-500/30 font-bold">🚀 READY</span>;
              cardBorder = 'border-cyan-500/40';
            } else {
              stateBadge = <span className="bg-rose-500/20 text-rose-300 text-[10px] px-2 py-0.5 rounded border border-rose-500/30 font-bold">🔒 BLOCKED</span>;
              cardBorder = 'border-rose-500/40';
            }

            return (
              <div
                key={node.key}
                className={`bg-slate-800/80 border ${cardBorder} rounded-xl p-4 flex flex-col justify-between hover:bg-slate-800 transition-all`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-black text-teal-300 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-500/30">
                        {node.key}
                      </span>
                      <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-bold">
                        {node.level}
                      </span>
                      {node.isElective && (
                        <span className="text-[10px] bg-purple-900/60 text-purple-300 px-1.5 py-0.5 rounded font-bold">
                          ELECTIVE
                        </span>
                      )}
                    </div>
                    {stateBadge}
                  </div>

                  <h4 className="text-xs font-bold text-slate-100 mb-2 leading-relaxed">
                    {node.summary}
                  </h4>

                  <div className="text-[11px] text-slate-400 space-y-1 mb-3">
                    <div>Owner: <span className="text-slate-200 font-semibold">{node.owner}</span></div>
                    {node.prerequisiteKeys && node.prerequisiteKeys.length > 0 && (
                      <div>
                        Prerequisites:{' '}
                        <span className="font-mono text-cyan-300">
                          {node.prerequisiteKeys.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {node.isBlocked && node.blockers.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-700/60 text-[11px] text-rose-300 bg-rose-950/20 p-2 rounded">
                    <span className="font-bold">⛔ Blocked by:</span>
                    <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                      {node.blockers.map((b) => (
                        <li key={b.key}>
                          <span className="font-mono font-bold text-rose-400">{b.key}</span>: {b.summary} ({b.owner})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
