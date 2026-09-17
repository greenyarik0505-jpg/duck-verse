'use client';

import React, { useState, useEffect, useCallback, useId } from 'react';

export default function SeniorPortfolioDossierView() {
  const [dossier, setDossier] = useState(null);
  const [definitions, setDefinitions] = useState({});
  const [antiToxicReport, setAntiToxicReport] = useState(null);
  const [sanitizedView, setSanitizedView] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('metrics'); // 'metrics' | 'narratives' | 'evidence' | 'export'
  const [selectedDefinition, setSelectedDefinition] = useState(null);

  // New narrative state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('architecture');
  const [newProblem, setNewProblem] = useState('');
  const [newSolution, setNewSolution] = useState('');
  const [newResult, setNewResult] = useState('');
  const [newLesson, setNewLesson] = useState('');
  const [narrativeError, setNarrativeError] = useState('');
  const [notification, setNotification] = useState('');

  // Export modal state
  const [exportFormat, setExportFormat] = useState('markdown'); // 'markdown' | 'json'
  const [exportedContent, setExportedContent] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [maskAuthor, setMaskAuthor] = useState(false);

  const titleInputId = useId();
  const categorySelectId = useId();
  const problemInputId = useId();
  const solutionInputId = useId();
  const resultInputId = useId();
  const lessonInputId = useId();

  const fetchDossierData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/academy/senior-dossier');
      const data = await res.json();
      if (data.success) {
        setDossier(data.dossier);
        setDefinitions(data.metricDefinitions || {});
        setAntiToxicReport(data.antiToxicReport);
        setSanitizedView(data.sanitizedView);
      }
    } catch (err) {
      console.error('Failed to load senior dossier:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDossierData();
  }, [fetchDossierData]);

  const handleToggleMetric = async (metricKey) => {
    try {
      const res = await fetch('/api/academy/senior-dossier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_metric', metricKey }),
      });
      const data = await res.json();
      if (data.success) {
        setDossier((prev) => ({
          ...prev,
          metrics: data.metrics,
        }));
        setSanitizedView(data.sanitizedView);
        setNotification(`Видимість метрики оновлено`);
        setTimeout(() => setNotification(''), 3000);
      }
    } catch (err) {
      console.error('Failed to toggle metric:', err);
    }
  };

  const handleAddNarrative = async (e) => {
    e.preventDefault();
    setNarrativeError('');

    if (newTitle.trim().length < 5) {
      setNarrativeError('Заголовок повинен містити щонайменше 5 символів');
      return;
    }
    if (newProblem.trim().length < 10) {
      setNarrativeError('Опис проблеми повинен містити щонайменше 10 символів');
      return;
    }
    if (newSolution.trim().length < 10) {
      setNarrativeError('Опис рішення повинен містити щонайменше 10 символів');
      return;
    }
    if (!newResult.trim()) {
      setNarrativeError('Заповніть вимірюваний результат');
      return;
    }
    if (newLesson.trim().length < 10) {
      setNarrativeError('Урок повинен містити щонайменше 10 символів');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/academy/senior-dossier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_narrative',
          title: newTitle,
          category: newCategory,
          problem: newProblem,
          solution: newSolution,
          result: newResult,
          lessonLearned: newLesson,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDossier(data.dossier);
        setNewTitle('');
        setNewProblem('');
        setNewSolution('');
        setNewResult('');
        setNewLesson('');
        setNotification('Кейс успішно додано до досьє!');
        setTimeout(() => setNotification(''), 4000);
      } else {
        setNarrativeError(data.error || 'Помилка збереження');
      }
    } catch (err) {
      setNarrativeError('Мережева помилка при збереженні кейсу');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = async (format) => {
    try {
      setExportFormat(format);
      const action = format === 'markdown' ? 'export_markdown' : 'export_json';
      const res = await fetch('/api/academy/senior-dossier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          options: { maskedAuthorName: maskAuthor },
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (format === 'markdown') {
          setExportedContent(data.markdown);
        } else {
          setExportedContent(JSON.stringify(data.sanitized, null, 2));
        }
        setShowExportModal(true);
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const copyToClipboard = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(exportedContent);
      setNotification('Скопійовано в буфер обміну!');
      setTimeout(() => setNotification(''), 3000);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-400 mb-3" />
        <p>Завантаження інженерного досьє Senior Lab...</p>
      </div>
    );
  }

  if (!dossier) return null;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 lg:p-8 backdrop-blur-sm text-slate-100 shadow-xl relative overflow-hidden">
      {/* Decorative gradient blur */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 rounded-full text-xs font-semibold uppercase tracking-wider">
              Senior Lab • Evidence Dossier
            </span>
            {antiToxicReport?.antiToxicCertified && (
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Anti-Toxic Certified (No Peer Ranking)
              </span>
            )}
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold mt-2 text-white">
            {dossier.userDisplayName} — Доказове інженерне портфоліо
          </h2>
          <p className="text-slate-400 text-sm mt-1 max-w-3xl">
            {dossier.summary}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleExport('markdown')}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-900/30 transition-all flex items-center gap-2"
          >
            <span>📥</span> Експорт Markdown
          </button>
          <button
            onClick={() => handleExport('json')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center gap-2"
          >
            <span>🧩</span> Sanitized JSON
          </button>
        </div>
      </div>

      {/* Notification toast */}
      {notification && (
        <div className="mt-4 p-3 bg-emerald-950/80 border border-emerald-700/60 rounded-xl text-emerald-300 text-sm flex items-center justify-between animate-fadeIn">
          <span>✅ {notification}</span>
          <button onClick={() => setNotification('')} className="text-xs text-emerald-400 hover:text-white bg-transparent hover:bg-emerald-900/40 rounded p-1 transition-all">✕</button>
        </div>
      )}

      {/* Anti-Toxic Principle Notice */}
      <div className="mt-6 p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl flex items-start gap-3">
        <span className="text-2xl">🛡️</span>
        <div>
          <h3 className="text-sm font-semibold text-slate-200">
            Принцип доказового портфоліо без токсичного ранжування
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
            Ми не порівнюємо дітей між собою, не створюємо токсичних &quot;лідербордів&quot; та не розкриваємо приватних деталей. 
            Кожна метрика Senior Lab підтверджена реальними артефактами (PRs, Code Reviews, Releases, CI/CD) та демонструє особисту траєкторію інженерного зростання.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mt-6 flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'metrics'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/60 hover:text-slate-200 border border-slate-700/50'
          }`}
        >
          📊 Метрики та джерела ({Object.keys(dossier.metrics || {}).length})
        </button>
        <button
          onClick={() => setActiveTab('narratives')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'narratives'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/60 hover:text-slate-200 border border-slate-700/50'
          }`}
        >
          📖 STAR Наративи та Уроки ({dossier.narratives?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('evidence')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'evidence'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/60 hover:text-slate-200 border border-slate-700/50'
          }`}
        >
          🔍 Верифіковані артефакти ({dossier.verifiedEvidences?.length || 0})
        </button>
      </div>

      {/* Tab Content: Metrics */}
      {activeTab === 'metrics' && (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(dossier.metrics || {}).map(([key, item]) => {
              const def = definitions[key.toUpperCase()] || definitions[key] || {};
              return (
                <div
                  key={key}
                  className={`p-5 rounded-xl border transition-all ${
                    item.visible
                      ? 'bg-slate-800/80 border-slate-700 hover:border-cyan-500/40'
                      : 'bg-slate-900/60 border-slate-800/80 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono px-2 py-0.5 bg-slate-700/60 text-slate-300 rounded">
                      {def.category || 'Metric'}
                    </span>
                    <button
                      onClick={() => handleToggleMetric(key)}
                      className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
                        item.visible
                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                      }`}
                      title="Перемкнути видимість у публічному портфоліо"
                    >
                      {item.visible ? '👁️ Публічно' : '🔒 Приховано'}
                    </button>
                  </div>

                  <div className="mt-3">
                    <div className="text-3xl font-extrabold text-white tracking-tight">
                      {item.count}
                    </div>
                    <div className="text-sm font-semibold text-cyan-400 mt-0.5">
                      {def.nameUk || def.name || key}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 mt-2 line-clamp-2">
                    {item.highlight}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 truncate max-w-[170px]" title={def.source}>
                      Джерело: {def.source?.split('/')[0] || 'CI'}
                    </span>
                    <button
                      onClick={() => setSelectedDefinition(def)}
                      className="text-cyan-400 hover:text-cyan-300 font-medium underline"
                    >
                      Деталі та Privacy
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab Content: Narratives */}
      {activeTab === 'narratives' && (
        <div className="mt-6 space-y-6">
          {/* Add narrative form */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <span>✍️</span> Студія кейсів: Додати новий STAR-наратив
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Senior інженер вміє розповісти про реальний досвід: Проблема → Рішення → Результат → Винесений урок.
            </p>

            <form onSubmit={handleAddNarrative} className="mt-4 space-y-4">
              {narrativeError && (
                <div className="p-3 bg-red-950/70 border border-red-800 rounded-lg text-xs text-red-300">
                  ⚠️ {narrativeError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor={titleInputId} className="block text-xs text-slate-300 mb-1">
                    Назва інженерного кейсу *
                  </label>
                  <input
                    id={titleInputId}
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Наприклад: Оптимізація рендерингу частинок або усунення hydration mismatch"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label htmlFor={categorySelectId} className="block text-xs text-slate-300 mb-1">
                    Категорія *
                  </label>
                  <select
                    id={categorySelectId}
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="architecture">Architecture & System Design</option>
                    <option value="testing">Testing & Automation</option>
                    <option value="incident">Incident Triage & Reliability</option>
                    <option value="mentoring">Mentoring & Collaboration</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={problemInputId} className="block text-xs text-slate-300 mb-1">
                    🚨 Проблема (З яким викликом зіткнулися?) *
                  </label>
                  <textarea
                    id={problemInputId}
                    rows={3}
                    value={newProblem}
                    onChange={(e) => setNewProblem(e.target.value)}
                    placeholder="Опишіть технічну проблему, симптоми або ризики для користувача..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label htmlFor={solutionInputId} className="block text-xs text-slate-300 mb-1">
                    💡 Рішення (Що було спроектовано та впроваджено?) *
                  </label>
                  <textarea
                    id={solutionInputId}
                    rows={3}
                    value={newSolution}
                    onChange={(e) => setNewSolution(e.target.value)}
                    placeholder="Архітектурний підхід, патерни, зміни у коді чи пайплайні..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={resultInputId} className="block text-xs text-slate-300 mb-1">
                    📈 Результат (Вимірюваний ефект) *
                  </label>
                  <textarea
                    id={resultInputId}
                    rows={2}
                    value={newResult}
                    onChange={(e) => setNewResult(e.target.value)}
                    placeholder="0 регресій, скорочення часу деплою на 50%, 100% проходження тестів..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label htmlFor={lessonInputId} className="block text-xs text-slate-300 mb-1">
                    🧠 Урок на майбутнє (Lesson Learned) *
                  </label>
                  <textarea
                    id={lessonInputId}
                    rows={2}
                    value={newLesson}
                    onChange={(e) => setNewLesson(e.target.value)}
                    placeholder="Чому навчила ця ситуація команду та вас особисто?"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
                >
                  {submitting ? 'Збереження...' : 'Додати кейс до досьє'}
                </button>
              </div>
            </form>
          </div>

          {/* Existing narratives list */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-300">
              Збережені інженерні наративи ({dossier.narratives?.length || 0})
            </h4>
            {dossier.narratives?.map((item) => (
              <div
                key={item.id}
                className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-5 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded text-xs font-mono uppercase">
                      {item.category}
                    </span>
                    <h5 className="text-base font-bold text-white">
                      {item.title}
                    </h5>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      item.verifiedByMentor
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {item.verifiedByMentor ? 'Верифіковано ментором ✅' : 'Очікує рев’ю ⏳'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2">
                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    <span className="font-semibold text-red-400 block mb-1">🚨 Проблема:</span>
                    <p className="text-slate-300">{item.problem}</p>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    <span className="font-semibold text-cyan-400 block mb-1">💡 Рішення:</span>
                    <p className="text-slate-300">{item.solution}</p>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    <span className="font-semibold text-emerald-400 block mb-1">📈 Результат:</span>
                    <p className="text-slate-300">{item.result}</p>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    <span className="font-semibold text-purple-400 block mb-1">🧠 Урок:</span>
                    <p className="text-slate-300">{item.lessonLearned}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: Evidence */}
      {activeTab === 'evidence' && (
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl">
            <h4 className="text-sm font-semibold text-white">Верифіковані артефакти розробки</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Кожен запис підтверджено реальними посиланнями на злиті PR, пройдені тести та випуски у продакшен.
            </p>
          </div>

          <div className="divide-y divide-slate-800 bg-slate-800/70 border border-slate-700 rounded-xl overflow-hidden">
            {dossier.verifiedEvidences?.map((ev) => (
              <div key={ev.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-800/90 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="px-2.5 py-1 bg-slate-700/60 text-cyan-300 rounded text-xs font-mono font-bold">
                    {ev.type}
                  </span>
                  <div>
                    <h5 className="text-sm font-semibold text-white">{ev.title}</h5>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">
                      Ref: {ev.reference} • Дата: {new Date(ev.verifiedAt).toLocaleString('uk-UA')}
                    </p>
                  </div>
                </div>
                {ev.link && (
                  <a
                    href={ev.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>Переглянути доказ</span> ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Definition Detail Modal */}
      {selectedDefinition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-slate-200 animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-lg font-bold text-white">
                {selectedDefinition.nameUk} ({selectedDefinition.name})
              </h4>
              <button
                onClick={() => setSelectedDefinition(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-cyan-400 block mb-0.5">Визначення (Definition):</span>
                <p className="text-slate-300 leading-relaxed">{selectedDefinition.definition}</p>
              </div>
              <div>
                <span className="font-semibold text-purple-400 block mb-0.5">Джерело даних (Source):</span>
                <p className="text-slate-300 font-mono">{selectedDefinition.source}</p>
              </div>
              <div>
                <span className="font-semibold text-emerald-400 block mb-0.5">Правило приватності (Privacy Rule):</span>
                <p className="text-slate-300">{selectedDefinition.privacyRule}</p>
              </div>
              <div>
                <span className="font-semibold text-amber-400 block mb-0.5">Контекст рівня Senior:</span>
                <p className="text-slate-300">{selectedDefinition.benchmarkContext}</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedDefinition(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
              >
                Зрозуміло
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Preview Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-4 text-slate-200 animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-lg font-bold text-white">
                Експорт досьє ({exportFormat.toUpperCase()})
              </h4>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={maskAuthor}
                  onChange={(e) => {
                    setMaskAuthor(e.target.checked);
                    handleExport(exportFormat);
                  }}
                  className="rounded border-slate-700 bg-slate-800 text-cyan-500"
                />
                Анонімізувати ім&apos;я автора (Privacy Guard)
              </label>
              <span className="text-emerald-400">🛡️ Sanitized & Anti-Toxic Safe</span>
            </div>

            <pre className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-xs font-mono text-slate-300 max-h-80 overflow-y-auto whitespace-pre-wrap">
              {exportedContent}
            </pre>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow"
              >
                📋 Копіювати в буфер
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
              >
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
