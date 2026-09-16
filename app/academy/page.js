'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ACADEMY_TRACKS, getLessonsByTrack, isLessonUnlocked } from '../../lib/academy/registry';
import { isAcademyEnabled, ACADEMY_CONFIG } from '../../lib/academy/config';

export default function AcademyPage() {
  const [selectedTrackId, setSelectedTrackId] = useState('track-frontend-gaming');
  // Initial completed/in-progress simulated state for student
  const [completedLessons, setCompletedLessons] = useState(['lesson-fe-l0-arch']);

  const enabled = isAcademyEnabled();
  const selectedTrack = ACADEMY_TRACKS.find((t) => t.id === selectedTrackId) || ACADEMY_TRACKS[0];
  const trackLessons = getLessonsByTrack(selectedTrackId);

  if (!enabled) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold text-slate-300 mb-2">🎓 Duck Academy тимчасово недоступна</h1>
        <p className="text-slate-500 mb-4">Модуль знаходиться на технічному обслуговуванні під прапорцем функцій.</p>
        <Link href="/" className="gaming-btn">
          ← Повернутися до Game Hub
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-['Rajdhani',sans-serif]">
      {/* Academy Header */}
      <header className="border-b border-purple-500/20 bg-[#0c101d]/90 backdrop-blur-md px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 transition-colors mr-2"
              title="Повернутися до ігрового хабу"
            >
              <span>← До ігор</span>
            </Link>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-purple-500/20">
              DA
            </div>
            <div>
              <h1 className="font-['Orbitron',sans-serif] text-base font-bold tracking-wider text-purple-200 flex items-center gap-2">
                <span>DUCK ACADEMY</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                  v{ACADEMY_CONFIG.version} (L0-L9)
                </span>
              </h1>
              <p className="text-xs text-slate-400">Інженерна платформа практичного навчання та DevSecOps</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://gta6-sliv-cyberleek.atlassian.net/jira/software/projects/SCRUM/boards/1"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <span>📋 Jira Board (SCRUM)</span>
            </a>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono">
              Lead: {selectedTrack.lead}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">
        {/* Track Selector Cards */}
        <section className="mb-10">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 font-mono">
            Оберіть навчальний трек (Curriculum Tracks)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ACADEMY_TRACKS.map((track) => {
              const isSelected = track.id === selectedTrackId;
              return (
                <button
                  key={track.id}
                  onClick={() => setSelectedTrackId(track.id)}
                  className={`text-left p-5 rounded-xl border transition-all relative overflow-hidden ${
                    isSelected
                      ? 'bg-purple-950/30 border-purple-500/60 shadow-lg shadow-purple-500/10'
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{track.icon}</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400">
                      {track.levels}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-white mb-1 font-['Orbitron',sans-serif]">
                    {track.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{track.tagline}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Active Track Curriculum Timeline & DAG Tree */}
        <section>
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white font-['Orbitron',sans-serif] flex items-center gap-2">
                <span>{selectedTrack.icon}</span>
                <span>{selectedTrack.title}</span>
              </h2>
              <p className="text-xs text-slate-400">Граф уроків, передумов (prerequisites) та необхідних свідоцтв</p>
            </div>
            <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-3 py-1 rounded-md border border-purple-500/20">
              Всього модулів: {trackLessons.length}
            </span>
          </div>

          <div className="space-y-4">
            {trackLessons.map((lesson, idx) => {
              const isUnlocked = isLessonUnlocked(lesson.id, completedLessons);
              const isDone = completedLessons.includes(lesson.id);

              return (
                <div
                  key={lesson.id}
                  className={`p-5 rounded-xl border transition-all ${
                    isDone
                      ? 'bg-emerald-950/20 border-emerald-500/40'
                      : isUnlocked
                      ? 'bg-slate-900/60 border-purple-500/30 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800/80 opacity-60'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                    <div className="flex items-start md:items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm font-mono border ${
                          isDone
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : isUnlocked
                            ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                            : 'bg-slate-800 border-slate-700 text-slate-500'
                        }`}
                      >
                        L{lesson.level}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-purple-400 font-bold">
                            [{lesson.jiraKey}]
                          </span>
                          <h3 className="font-bold text-base text-white">{lesson.title}</h3>
                          {lesson.jiraKey === 'SCRUM-56' && (
                            <span className="text-[10px] bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 px-2 py-0.5 rounded font-mono font-bold">
                              В РОБОТІ ⚡
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300">{lesson.summary}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-auto">
                      <span className="text-xs font-mono text-slate-400 bg-black/40 px-2.5 py-1 rounded border border-slate-800">
                        ⏱️ ~{lesson.estimatedMinutes} хв
                      </span>
                      {isDone ? (
                        <span className="text-xs px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                          ✓ ЗДАНО
                        </span>
                      ) : isUnlocked ? (
                        <span className="text-xs px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                          🔓 ДОСТУПНО
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          🔒 ЗАБЛОКОВАНО
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Prerequisites info */}
                  {lesson.prerequisites && lesson.prerequisites.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-mono text-purple-400 font-semibold">Передумови (Prerequisites):</span>
                      <div className="flex flex-wrap gap-1.5">
                        {lesson.prerequisites.map((pId) => (
                          <span key={pId} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                            {pId}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Acceptance Criteria & Evidence */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-mono text-slate-400 block mb-1.5 font-semibold">
                        Критерії прийняття (Acceptance Criteria):
                      </span>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                        {lesson.acceptanceCriteria.map((ac, idx) => (
                          <li key={idx}>{ac}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="font-mono text-slate-400 block mb-1.5 font-semibold">
                        Обов'язкові свідоцтва (Evidence):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {lesson.requiredEvidence.map((ev) => (
                          <span
                            key={ev}
                            className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/30 text-purple-300 font-mono text-[10px] uppercase"
                          >
                            🛡️ {ev.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#070b14] px-6 py-4 text-center text-xs text-slate-500">
        Duck Academy • Architectural Baseline (SCRUM-56) • Duck Verse Platform
      </footer>
    </div>
  );
}
