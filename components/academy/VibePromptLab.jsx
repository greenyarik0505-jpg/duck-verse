'use client';

import React, { useState } from 'react';
import { PROMPT_LAB_EXERCISES, evaluatePromptBrief } from '../../lib/academy/vibePromptLab';

export default function VibePromptLab({ onCompleteExercise }) {
  const [selectedExerciseId, setSelectedExerciseId] = useState(PROMPT_LAB_EXERCISES[0].id);
  const [showComparison, setShowComparison] = useState(false);
  const [userPromptText, setUserPromptText] = useState('');
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const activeExercise = PROMPT_LAB_EXERCISES.find((e) => e.id === selectedExerciseId) || PROMPT_LAB_EXERCISES[0];

  const handleSelectExercise = (id) => {
    setSelectedExerciseId(id);
    setShowComparison(false);
    setUserPromptText('');
    setEvaluationResult(null);
    setCopied(false);
  };

  const handleEvaluate = () => {
    const res = evaluatePromptBrief(userPromptText, selectedExerciseId);
    setEvaluationResult(res);
    if (res.passed && typeof onCompleteExercise === 'function') {
      onCompleteExercise(selectedExerciseId, res.score);
    }
  };

  const handleCopyEvidence = () => {
    if (!evaluationResult?.exportMarkdown) return;
    navigator.clipboard.writeText(evaluationResult.exportMarkdown).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  };

  const handleUseStrongAsTemplate = () => {
    setUserPromptText(activeExercise.strongPrompt);
    setEvaluationResult(null);
  };

  return (
    <section className="vibe-prompt-lab-container" role="region" aria-labelledby="prompt-lab-title">
      <header className="prompt-lab-header">
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden="true">🧪</span>
          <div>
            <h3 id="prompt-lab-title" className="text-xl font-bold font-['Orbitron',sans-serif] text-cyan-400">
              Vibe-Coding Prompt Lab (Level 3)
            </h3>
            <p className="text-sm text-slate-400">
              Вчимося перетворювати розмиту ідею на точний інженерний brief для AI-агентів.
            </p>
          </div>
        </div>
      </header>

      {/* Exercise Selector Tabs */}
      <div className="prompt-lab-tabs flex flex-wrap gap-2 my-4" role="tablist" aria-label="Вправи лабораторії">
        {PROMPT_LAB_EXERCISES.map((ex) => (
          <button
            key={ex.id}
            type="button"
            role="tab"
            aria-selected={ex.id === selectedExerciseId}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              ex.id === selectedExerciseId
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
            onClick={() => handleSelectExercise(ex.id)}
          >
            <span className="opacity-70 mr-1.5">[{ex.level}]</span>
            {ex.title.split('. ')[1] || ex.title}
          </button>
        ))}
      </div>

      {/* Scenario & Raw Vibe Card */}
      <div className="prompt-scenario-card bg-slate-900/90 border border-slate-800 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs uppercase tracking-wider text-cyan-400 font-semibold font-mono">
            {activeExercise.level} • {activeExercise.difficulty}
          </span>
          <button
            type="button"
            className="text-xs text-slate-400 hover:text-cyan-300 underline transition"
            onClick={() => setShowComparison((prev) => !prev)}
          >
            {showComparison ? 'Приховати порівняння промптів' : '👀 Порівняти слабкий та сильний prompt'}
          </button>
        </div>

        <h4 className="text-base font-bold text-white mb-1">{activeExercise.title}</h4>
        <p className="text-sm text-slate-300 mb-3">{activeExercise.scenario}</p>

        <div className="bg-slate-950/80 border border-slate-800/60 rounded-lg p-3">
          <span className="text-xs text-amber-400 font-mono block mb-1">{"💭 Сира \"Vibe-ідея\" (як часто формулюють у чаті):"}</span>
          <p className="text-sm font-mono text-amber-200/90 italic">&quot;{activeExercise.rawIdea}&quot;</p>
        </div>
      </div>

      {/* Comparison Drawer */}
      {showComparison && (
        <div className="prompt-comparison-drawer grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-slate-900/95 border border-slate-700/80 rounded-xl">
          <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-rose-400 text-sm font-bold">❌ Слабкий промпт (Vibe without spec)</span>
            </div>
            <p className="text-xs font-mono text-rose-200/90 mb-3 whitespace-pre-wrap">{activeExercise.weakPrompt}</p>
            <p className="text-[11px] text-slate-400 italic">{activeExercise.explanation}</p>
          </div>

          <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-emerald-400 text-sm font-bold">✅ Сильний інженерний бриф (Senior Spec)</span>
              <button
                type="button"
                className="text-[11px] bg-emerald-800/50 hover:bg-emerald-700/60 text-emerald-200 px-2 py-0.5 rounded transition"
                onClick={handleUseStrongAsTemplate}
              >
                Вставити як шаблон
              </button>
            </div>
            <p className="text-xs font-mono text-emerald-200/90 whitespace-pre-wrap max-h-60 overflow-y-auto pr-1">
              {activeExercise.strongPrompt}
            </p>
          </div>
        </div>
      )}

      {/* Interactive Prompt Editor */}
      <div className="prompt-editor-card bg-slate-900/90 border border-slate-800 rounded-xl p-4 mb-4">
        <label htmlFor="user-prompt-input" className="block text-sm font-bold text-slate-200 mb-2">
          ✍️ Ваш інженерний бриф для AI-агента:
        </label>
        <textarea
          id="user-prompt-input"
          rows={7}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs font-mono text-slate-200 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition mb-3"
          placeholder="Опишіть: Контекст (файли) -> Що зробити (кроки) -> Критерії прийому (булети) -> План верифікації (тести)..."
          value={userPromptText}
          onChange={(e) => setUserPromptText(e.target.value)}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Символів: {userPromptText.length} • Рубрика оцінює 5 інженерних критеріїв
          </div>
          <button
            type="button"
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-lg shadow-lg shadow-cyan-500/25 transition disabled:opacity-50"
            disabled={userPromptText.trim().length < 10}
            onClick={handleEvaluate}
          >
            ⚡ Оцінити якість промпту
          </button>
        </div>
      </div>

      {/* Evaluation Result & Rubric Checklist */}
      {evaluationResult && (
        <div
          className={`prompt-result-card p-4 rounded-xl border mb-4 transition-all ${
            evaluationResult.passed
              ? 'bg-slate-900/95 border-cyan-500/50 shadow-xl shadow-cyan-500/10'
              : 'bg-slate-900/95 border-amber-500/50 shadow-xl shadow-amber-500/10'
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-black font-mono px-3 py-1 rounded-lg ${
                evaluationResult.score >= 80 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                evaluationResult.score >= 60 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' :
                'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {evaluationResult.score}/100
              </span>
              <div>
                <h5 className="text-sm font-bold text-white">
                  {evaluationResult.passed ? '🎉 Критерій допуску виконано!' : '⚠️ Потрібне доопрацювання'}
                </h5>
                <p className="text-xs text-slate-300">{evaluationResult.feedback}</p>
              </div>
            </div>

            {evaluationResult.passed && (
              <button
                type="button"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold rounded-lg border border-slate-600 transition flex items-center gap-1.5"
                onClick={handleCopyEvidence}
              >
                {copied ? '✅ Скопійовано!' : '📋 Копіювати для Jira/PR'}
              </button>
            )}
          </div>

          {/* Rubric Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800">
            {evaluationResult.criteriaResults.map((crit) => (
              <div
                key={crit.key}
                className={`p-2 rounded-lg text-xs flex items-start gap-2 border ${
                  crit.passed
                    ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}
              >
                <span className="text-sm">{crit.passed ? '✅' : '⚪'}</span>
                <div>
                  <div className="font-semibold text-slate-200">{crit.name}</div>
                  <div className="text-[11px] opacity-80">{crit.hint}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
