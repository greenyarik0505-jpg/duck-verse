'use client';

import React, { useState, useMemo } from 'react';
import {
  evaluateGovernanceScorecard,
  SCORECARD_RUBRIC_VERSION,
  SCORECARD_EFFECTIVE_DATE,
  PASSING_SCORECARD_FIXTURE,
  FAILING_SCORECARD_FIXTURE
} from '../../lib/academy/governance/governance_scorecard';

export default function EngineeringGovernanceScorecardView() {
  const [selectedPreset, setSelectedPreset] = useState('passing'); // 'passing' | 'failing' | 'custom'
  const [mentorNotes, setMentorNotes] = useState(() => [
    {
      mentor: 'Mentor Team Lead',
      comment: 'Exemplary DevSecOps PR: clean branch naming, full test coverage, and complete audit trail.',
      date: '2026-09-17'
    }
  ]);
  const [disputes, setDisputes] = useState([]);
  const [newDisputeText, setNewDisputeText] = useState('');
  const [newMentorNoteText, setNewMentorNoteText] = useState('');
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [showMentorForm, setShowMentorForm] = useState(false);

  // Custom PR state
  const [customBranch, setCustomBranch] = useState('feature/SCRUM-146-scorecard');
  const [customTitle, setCustomTitle] = useState('[SCRUM-146] Engineering governance scorecard');
  const [customCi, setCustomCi] = useState('SUCCESS');
  const [customTestsRate, setCustomTestsRate] = useState(1.0);
  const [customApprovals, setCustomApprovals] = useState(2);
  const [customSecurity, setCustomSecurity] = useState(true);
  const [customDeployment, setCustomDeployment] = useState(true);

  const activeSubmission = useMemo(() => {
    if (selectedPreset === 'passing') {
      return { ...PASSING_SCORECARD_FIXTURE, mentorNotes, disputes };
    }
    if (selectedPreset === 'failing') {
      return { ...FAILING_SCORECARD_FIXTURE, mentorNotes, disputes };
    }
    return {
      prNumber: 99,
      branchName: customBranch,
      prTitle: customTitle,
      commitMessages: [customTitle],
      ciStatus: customCi,
      testsPassRate: customTestsRate,
      approvalsCount: customApprovals,
      securityScanClean: customSecurity,
      hasDeploymentEvidence: customDeployment,
      deploymentUrl: 'https://duck-verse.vercel.app',
      author: 'Yarik0505',
      mentorNotes,
      disputes
    };
  }, [
    selectedPreset,
    mentorNotes,
    disputes,
    customBranch,
    customTitle,
    customCi,
    customTestsRate,
    customApprovals,
    customSecurity,
    customDeployment
  ]);

  const scorecard = useMemo(() => {
    return evaluateGovernanceScorecard(activeSubmission);
  }, [activeSubmission]);

  const handleAddDispute = (e) => {
    e.preventDefault();
    if (!newDisputeText.trim()) return;
    setDisputes((prev) => [
      ...prev,
      {
        id: `disp-${Date.now()}`,
        author: 'Learner Yarik',
        argument: newDisputeText.trim(),
        date: new Date().toISOString().split('T')[0]
      }
    ]);
    setNewDisputeText('');
    setShowDisputeForm(false);
  };

  const handleAddMentorNote = (e) => {
    e.preventDefault();
    if (!newMentorNoteText.trim()) return;
    setMentorNotes((prev) => [
      ...prev,
      {
        mentor: 'Senior Mentor',
        comment: newMentorNoteText.trim(),
        date: new Date().toISOString().split('T')[0]
      }
    ]);
    setNewMentorNoteText('');
    setShowMentorForm(false);
  };

  return (
    <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-6 shadow-2xl backdrop-blur-md text-white my-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-emerald-500/20 pb-4 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <h2 className="text-xl font-black tracking-wider uppercase bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Engineering Governance Scorecard for PR & Release Evidence
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
            <span>Objective quality rubric (SCRUM-146)</span>
            <span className="text-emerald-400 font-mono font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
              Rubric {SCORECARD_RUBRIC_VERSION}
            </span>
            <span>Effective: <strong className="text-slate-200">{SCORECARD_EFFECTIVE_DATE}</strong></span>
            <span className="text-cyan-400 font-medium">🛡️ Minimal PII Shield Active</span>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="flex bg-slate-800/90 rounded-lg p-1 border border-slate-700">
          <button
            onClick={() => setSelectedPreset('passing')}
            className={`px-3 py-1 text-xs font-bold rounded transition-all ${
              selectedPreset === 'passing'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ✓ Exemplar PR (100%)
          </button>
          <button
            onClick={() => setSelectedPreset('failing')}
            className={`px-3 py-1 text-xs font-bold rounded transition-all ${
              selectedPreset === 'failing'
                ? 'bg-rose-700 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚠️ Remediation Sample
          </button>
          <button
            onClick={() => setSelectedPreset('custom')}
            className={`px-3 py-1 text-xs font-bold rounded transition-all ${
              selectedPreset === 'custom'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚙️ Custom Evaluator
          </button>
        </div>
      </div>

      {/* KPI Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Total Quality Score</div>
            <div className="text-2xl font-black text-emerald-400">
              {scorecard.totalScore} <span className="text-sm text-slate-500">/ {scorecard.maxScore}</span>
            </div>
          </div>
          <span className="text-2xl">🎯</span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Quality Rating</div>
            <div className="text-base font-black text-cyan-300">
              {scorecard.qualityRating}
            </div>
          </div>
          <span className="text-2xl">⭐</span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Release Decision</div>
            <div className="text-base font-black">
              {scorecard.passedOverall ? (
                <span className="text-emerald-400">✓ APPROVED FOR MERGE</span>
              ) : (
                <span className="text-rose-400">⚠️ REMEDIATION NEEDED</span>
              )}
            </div>
          </div>
          <span className="text-2xl">{scorecard.passedOverall ? '🚀' : '🛡️'}</span>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">PR Author</div>
            <div className="text-base font-mono font-bold text-purple-300">
              {scorecard.author}
            </div>
          </div>
          <span className="text-2xl">👤</span>
        </div>
      </div>

      {/* Custom Simulator Controls (if selected) */}
      {selectedPreset === 'custom' && (
        <div className="mb-6 bg-slate-800/90 border border-cyan-500/40 rounded-xl p-4 space-y-3">
          <div className="text-xs font-bold uppercase text-cyan-300">Custom PR Evidence Evaluator</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Branch Name</label>
              <input
                type="text"
                value={customBranch}
                onChange={(e) => setCustomBranch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-cyan-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">PR Title</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">CI Status</label>
              <select
                value={customCi}
                onChange={(e) => setCustomCi(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200"
              >
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILED">FAILED</option>
                <option value="PENDING">PENDING</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Non-punitive Remediation Guidance Drawer */}
      {scorecard.remediations.length > 0 && (
        <div className="mb-6 bg-amber-950/40 border-2 border-amber-500/60 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">💡</span>
            <h3 className="text-sm font-black uppercase text-amber-300">
              Constructive Remediation Guidance ({scorecard.remediations.length})
            </h3>
          </div>
          <p className="text-xs text-slate-300 mb-3">
            Evidence gaps are educational growth steps. Complete the following actions to achieve full compliance:
          </p>

          <div className="space-y-2">
            {scorecard.remediations.map((rem, idx) => (
              <div
                key={idx}
                className="bg-slate-900/80 border border-amber-500/30 rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-300">{rem.dimension}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-black uppercase ${
                      rem.urgency === 'CRITICAL' ? 'bg-rose-600 text-white' : (rem.urgency === 'HIGH' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300')
                    }`}>
                      {rem.urgency}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 mt-1 font-mono">{rem.advice}</div>
                </div>
                <span className="text-xs text-teal-400 font-bold shrink-0">🔧 Крок виправлення</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7 Evidence Dimensions Table */}
      <div className="space-y-3 mb-6">
        <h3 className="text-sm font-black uppercase text-slate-300 flex items-center gap-2">
          <span>📐</span>
          <span>7 Evidence Dimensions Breakdown</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {scorecard.dimensionResults.map((dim) => (
            <div
              key={dim.id}
              className={`bg-slate-800/80 border rounded-xl p-3.5 flex items-start justify-between gap-3 ${
                dim.passed ? 'border-emerald-500/30' : 'border-rose-500/30'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-200">{dim.name}</span>
                  <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400">
                    Max: {dim.maxScore} SP
                  </span>
                </div>
                <p className="text-xs text-slate-400">{dim.detail}</p>
              </div>

              <div className="text-right shrink-0">
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  dim.passed
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {dim.score} / {dim.maxScore}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dispute & Mentor Notes Feedback Calibration Section */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-700 pb-3 mb-3 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-base">💬</span>
            <h3 className="text-sm font-black uppercase text-slate-200">
              Dispute Loop & Mentor Calibration Notes
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDisputeForm(!showDisputeForm)}
              className="text-xs px-3 py-1 bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-500/40 rounded font-bold transition-all"
            >
              ⚖️ Оскаржити бал
            </button>
            <button
              onClick={() => setShowMentorForm(!showMentorForm)}
              className="text-xs px-3 py-1 bg-teal-900/60 hover:bg-teal-800 text-teal-200 border border-teal-500/40 rounded font-bold transition-all"
            >
              ✍️ Додати Mentor Note
            </button>
          </div>
        </div>

        {/* Dispute Form Modal/Inline */}
        {showDisputeForm && (
          <form onSubmit={handleAddDispute} className="mb-4 bg-slate-900 p-3 rounded-lg border border-purple-500/30 space-y-2">
            <label className="block text-xs font-bold text-purple-300">Аргументація оскарження (Dispute Note):</label>
            <textarea
              value={newDisputeText}
              onChange={(e) => setNewDisputeText(e.target.value)}
              placeholder="Наприклад: 'Тести пройшли в альтернативному CI-контейнері з 100% покриттям, посилання додано.'"
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              rows={2}
            />
            <button type="submit" className="text-xs px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold">
              Надіслати оскарження
            </button>
          </form>
        )}

        {/* Mentor Form Modal/Inline */}
        {showMentorForm && (
          <form onSubmit={handleAddMentorNote} className="mb-4 bg-slate-900 p-3 rounded-lg border border-teal-500/30 space-y-2">
            <label className="block text-xs font-bold text-teal-300">Коментар ментора (Mentor Calibration):</label>
            <textarea
              value={newMentorNoteText}
              onChange={(e) => setNewMentorNoteText(e.target.value)}
              placeholder="Наприклад: 'Вимогу щодо другого рев'ювера погоджено ментором у зв'язку з винятковою автономністю.'"
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
              rows={2}
            />
            <button type="submit" className="text-xs px-3 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded font-bold">
              Зберегти коментар
            </button>
          </form>
        )}

        {/* List of Notes & Disputes */}
        <div className="space-y-2">
          {scorecard.mentorNotes.map((note, i) => (
            <div key={i} className="bg-slate-900/60 p-2.5 rounded border border-teal-500/20 text-xs">
              <div className="flex items-center justify-between text-teal-300 font-bold mb-1">
                <span>👨‍🏫 {note.mentor}</span>
                <span className="text-[10px] text-slate-400">{note.date}</span>
              </div>
              <p className="text-slate-300">{note.comment}</p>
            </div>
          ))}

          {scorecard.disputes.map((disp, i) => (
            <div key={i} className="bg-slate-900/60 p-2.5 rounded border border-purple-500/20 text-xs">
              <div className="flex items-center justify-between text-purple-300 font-bold mb-1">
                <span>⚖️ Оскарження: {disp.author}</span>
                <span className="text-[10px] text-slate-400">{disp.date}</span>
              </div>
              <p className="text-slate-300">{disp.argument}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
