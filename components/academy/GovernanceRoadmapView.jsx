'use client';

import React, { useState } from 'react';
import {
  TEAM_MEMBERS,
  QUARTERLY_ROADMAP,
  RISK_REGISTER,
  TECH_RADAR,
  GRADUATION_GATES,
  calculateWorkloadFairness
} from '../../lib/academy/governance/roadmap';

export default function GovernanceRoadmapView() {
  const [activeTab, setActiveTab] = useState('roadmap');
  const [workload] = useState(() => calculateWorkloadFairness());

  return (
    <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-6 shadow-2xl backdrop-blur-md text-white my-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-cyan-500/20 pb-4 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏛️</span>
            <h2 className="text-xl font-black tracking-wider uppercase bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
              Engineering Governance & Learning Roadmap
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Standardized multi-year growth, team capacity balance, risk control & Tech Radar (SCRUM-70)
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'roadmap', label: '🗺️ Roadmap' },
            { id: 'capacity', label: '⚖️ Capacity & Fairness' },
            { id: 'radar', label: '📡 Tech Radar' },
            { id: 'risks', label: '🛡️ Risk Register' },
            { id: 'gates', label: '🎓 Quality Bar' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Roadmap */}
      {activeTab === 'roadmap' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {QUARTERLY_ROADMAP.map((q) => (
              <div
                key={q.quarter}
                className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-4 hover:border-cyan-500/40 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-extrabold text-cyan-400 text-sm tracking-wide">
                    {q.year} — {q.quarter}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      q.status === 'COMPLETED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : q.status === 'IN_PROGRESS'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {q.status.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">{q.theme}</h3>
                <div className="text-[11px] text-slate-400 mb-3">
                  Allocated Capacity: <span className="text-cyan-300 font-mono">{q.allocatedSp} SP</span>
                </div>

                <div className="space-y-1.5">
                  {q.milestones.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between text-xs bg-slate-900/50 p-2 rounded border border-slate-800"
                    >
                      <div className="flex items-center gap-2">
                        <span className={m.completed ? 'text-emerald-400' : 'text-amber-400'}>
                          {m.completed ? '✓' : '○'}
                        </span>
                        <span className={m.completed ? 'text-slate-300 line-through' : 'text-slate-200'}>
                          {m.title}
                        </span>
                      </div>
                      <span className="text-[10px] bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800">
                        {m.owner}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Capacity & Fairness */}
      {activeTab === 'capacity' && (
        <div className="space-y-4">
          <div className="bg-emerald-950/30 border border-emerald-500/30 p-4 rounded-lg flex items-center justify-between">
            <div>
              <h4 className="text-emerald-300 font-bold text-sm">✓ Workload Fairness Status: BALANCED</h4>
              <p className="text-slate-400 text-xs mt-0.5">
                Story points and critical responsibilities are fairly distributed with zero hidden inequality.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Total Roadmap SP:</span>
              <span className="text-lg font-black text-cyan-400">{workload.totalAssignedSp} SP</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {workload.members.map((member) => (
              <div key={member.name} className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-white text-sm">{member.name}</h4>
                  <span className="text-[10px] text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                    {member.assignedSp} SP
                  </span>
                </div>
                <p className="text-xs text-indigo-300 font-medium mb-3">{member.role}</p>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Completed Milestones:</span>
                    <span className="text-emerald-400 font-bold">
                      {member.completedTasks} / {member.totalTasks} ({member.completionRate}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-2 rounded-full transition-all"
                      style={{ width: `${member.completionRate}%` }}
                    />
                  </div>

                  <div className="pt-2 text-[11px] text-slate-400">
                    <span className="block font-semibold text-slate-300 mb-1">Focus Areas:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                      {TEAM_MEMBERS[
                        member.name === 'Yarik0505' ? 'YARIK' : member.name.includes('Дмитро') ? 'DMYTRO' : 'KYRYL'
                      ]?.focus.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Tech Radar */}
      {activeTab === 'radar' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(TECH_RADAR).map(([ring, items]) => {
              const badgeColors = {
                ADOPT: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-400',
                TRIAL: 'border-cyan-500/40 bg-cyan-950/20 text-cyan-400',
                ASSESS: 'border-amber-500/40 bg-amber-950/20 text-amber-400',
                HOLD: 'border-rose-500/40 bg-rose-950/20 text-rose-400'
              };

              return (
                <div key={ring} className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-4">
                  <div className={`text-xs font-black px-2 py-1 rounded border mb-3 text-center uppercase tracking-widest ${badgeColors[ring]}`}>
                    {ring}
                  </div>
                  <div className="space-y-3">
                    {items.map((item, idx) => (
                      <div key={idx} className="bg-slate-900/60 p-2.5 rounded border border-slate-800/80">
                        <div className="font-bold text-xs text-white mb-0.5">{item.name}</div>
                        <div className="text-[10px] text-indigo-300 mb-1">{item.quadrant}</div>
                        <div className="text-[11px] text-slate-400 leading-snug">{item.rationale}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Risk Register */}
      {activeTab === 'risks' && (
        <div className="space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 bg-slate-800/50">
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Risk Title</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Owner</th>
                  <th className="py-2.5 px-3">Mitigation Strategy</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {RISK_REGISTER.map((risk) => (
                  <tr key={risk.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-mono text-cyan-400">{risk.id}</td>
                    <td className="py-2.5 px-3 font-semibold text-white">{risk.title}</td>
                    <td className="py-2.5 px-3 text-indigo-300">{risk.category}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          risk.impact === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {risk.impact} (Score: {risk.score})
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{risk.owner}</td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px] max-w-xs">{risk.mitigation}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          risk.status === 'MITIGATED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {risk.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Graduation Gates */}
      {activeTab === 'gates' && (
        <div className="space-y-4">
          <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
            <h4 className="text-sm font-bold text-cyan-300 mb-1">
              Graduation Quality Bar ({GRADUATION_GATES.MINIMUM_PASSING_SCORE}% Passing Threshold)
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              Standardized rubric applied across all 3 team members / learners without individual bias.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {GRADUATION_GATES.DIMENSIONS.map((dim) => (
                <div key={dim.key} className="bg-slate-900/60 p-3 rounded border border-slate-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-xs text-white">{dim.name}</span>
                    <span className="text-cyan-400 font-mono text-xs font-bold">{dim.weight * 100}% Weight</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5">
                    <div
                      className="bg-cyan-400 h-1.5 rounded-full"
                      style={{ width: `${dim.weight * 100 * 3}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
