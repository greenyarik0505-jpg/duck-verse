'use client';

import React, { useState, useMemo } from 'react';
import {
  MASTERY_LEVELS,
  SKILL_TAXONOMY,
  LESSON_CATALOG,
  calculateLearnerProgress
} from '../../lib/academy/dashboard/learningMap';

export default function LearningMapDashboard({
  completedLessons = ['lesson-fe-l0-arch'],
  onSelectLesson,
  currentUser = { username: 'Курсант Duck Verse', role: 'child' }
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'skills' | 'levels'

  const progressData = useMemo(() => {
    return calculateLearnerProgress(completedLessons, currentUser);
  }, [completedLessons, currentUser]);

  const { tier, progress, skills, recommendedNextTask } = progressData;

  return (
    <div className="bg-slate-900/95 border border-cyan-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-lg text-white my-6">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-cyan-500/20 pb-5 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-bounce">{tier.badge}</span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-wide uppercase bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
                  Мапа навчання & Рівні майстерності
                </h2>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800 font-mono">
                  SCRUM-51
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Персональний навчальний кокпіт: прогрес, навички та наступна рекомендована місія
              </p>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2" role="tablist" aria-label="Learning map tabs">
          {[
            { id: 'overview', label: '🎯 Огляд & Місія' },
            { id: 'skills', label: '📊 Skill Map' },
            { id: 'levels', label: '🏆 Рівні (L0-L9)' }
          ].map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              tabIndex={0}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveTab(tab.id);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
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

      {/* Tab 1: Overview & Recommended Next Task */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Progress Overview Hero Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Current Tier Badge Card */}
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Твій поточний рівень:
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{tier.badge}</span>
                  <h3 className="text-lg font-black text-cyan-300">{tier.title}</h3>
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">{tier.description}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-700/50 flex justify-between text-xs text-slate-400 font-mono">
                <span>Діапазон: {tier.range.join(' - ')}</span>
                <span className="text-cyan-400 font-bold">Обов’язково: {tier.minRequiredLessons}+ місій</span>
              </div>
            </div>

            {/* Completion Percentage Progress Ring / Bar */}
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                    Загальний прогрес програми:
                  </span>
                  <span className="text-sm font-mono font-black text-cyan-400">
                    {progress.overallPercentage}%
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800 mb-3">
                  <div
                    className="bg-gradient-to-r from-cyan-500 via-teal-400 to-indigo-500 h-3 rounded-full transition-all duration-500 shadow-md shadow-cyan-500/50"
                    style={{ width: `${progress.overallPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Виконано місій:</span>
                  <span className="font-bold text-white font-mono">
                    {progress.completedCount} / {progress.totalLessons}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700/50 text-[11px] text-slate-400">
                <span>🛡️ Прогрес зафіксовано на підставі виконаних тестів та перевірених Pull Request.</span>
              </div>
            </div>

            {/* Hero Card: Single Recommended Next Task */}
            <div className="bg-gradient-to-br from-cyan-950/40 via-indigo-950/40 to-slate-900 border-2 border-cyan-500/60 rounded-xl p-5 shadow-xl shadow-cyan-500/10 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-cyan-500 text-slate-950 tracking-wider">
                    ⚡ Наступна рекомендована задача
                  </span>
                  {recommendedNextTask && (
                    <span className="text-xs font-mono font-bold text-cyan-300">
                      {recommendedNextTask.storyPoints} SP
                    </span>
                  )}
                </div>

                {recommendedNextTask ? (
                  <>
                    <h4 className="text-sm font-extrabold text-white mt-1 leading-snug">
                      {recommendedNextTask.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
                        Рівень: {recommendedNextTask.level}
                      </span>
                      <a
                        href={`https://gta6-sliv-cyberleek.atlassian.net/browse/${recommendedNextTask.jiraKey}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-cyan-400 hover:underline font-mono"
                        title="Відкрити задачу в Jira"
                      >
                        📋 {recommendedNextTask.jiraKey}
                      </a>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-300 mt-2">
                    Всі місії програми успішно пройдено! Ти готовий до випуску.
                  </p>
                )}
              </div>

              {recommendedNextTask && (
                <button
                  tabIndex={0}
                  onClick={() => onSelectLesson && onSelectLesson(recommendedNextTask.id)}
                  className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs py-2 px-3 rounded-lg shadow-lg shadow-cyan-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-300 active:scale-95"
                >
                  🚀 {recommendedNextTask.actionableText}
                </button>
              )}
            </div>
          </div>

          {/* Empty State Banner for Brand New Students */}
          {progress.isNewStudent && (
            <div className="bg-indigo-950/40 border border-indigo-500/40 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-4xl">👋</span>
                <div>
                  <h4 className="font-extrabold text-white text-sm">Ласкаво просимо до Duck Academy, новий курсанте!</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Твій навчальний трек готовий. Розпочни з першої обов’язкової місії [SCRUM-56] (Рівень L0), щоб відкрити наступні завдання.
                  </p>
                </div>
              </div>
              <button
                tabIndex={0}
                onClick={() => onSelectLesson && onSelectLesson('lesson-fe-l0-arch')}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs px-4 py-2 rounded-lg shrink-0 shadow-md transition-all"
              >
                Почати з L0 ➔
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Skill Map */}
      {activeTab === 'skills' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skills.map((skill) => (
              <div
                key={skill.id}
                className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 hover:border-cyan-500/40 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{skill.icon}</span>
                    <h4 className="font-bold text-white text-sm">{skill.name}</h4>
                  </div>
                  <span className="text-xs font-mono font-black text-cyan-400">
                    {skill.score}%
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800 mb-2">
                  <div
                    className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${skill.score}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">{skill.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Mastery Levels (L0-L9) */}
      {activeTab === 'levels' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.values(MASTERY_LEVELS).map((lvl) => {
              const isCurrent = tier.id === lvl.id;
              return (
                <div
                  key={lvl.id}
                  className={`rounded-xl p-4 border transition-all ${
                    isCurrent
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-lg shadow-cyan-500/20'
                      : 'bg-slate-800/50 border-slate-700/70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{lvl.badge}</span>
                    {isCurrent && (
                      <span className="text-[10px] bg-cyan-500 text-slate-950 px-2 py-0.5 rounded font-black uppercase">
                        Активний
                      </span>
                    )}
                  </div>
                  <h4 className="font-extrabold text-white text-sm mb-1">{lvl.title}</h4>
                  <div className="text-[10px] text-cyan-300 font-mono mb-2">
                    Рівні: {lvl.range.join(', ')}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{lvl.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
