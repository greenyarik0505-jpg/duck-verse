'use client';

import React, { useState, useEffect, useCallback, useId } from 'react';

export default function ArchitectureCasebookView() {
  const [cases, setCases] = useState([]);
  const [adrs, setAdrs] = useState([]);
  const [tradeOffDimensions, setTradeOffDimensions] = useState({});
  const [rubricCriteria, setRubricCriteria] = useState({});
  const [passingThreshold, setPassingThreshold] = useState(18);
  const [selectedCaseId, setSelectedCaseId] = useState('case-canvas-loop');
  const [activeTab, setActiveTab] = useState('cases'); // 'cases' | 'comparator' | 'studio' | 'registry'
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState('');

  // ADR Proposal Form
  const [proposalCaseId, setProposalCaseId] = useState('case-canvas-loop');
  const [selectedAlternativeId, setSelectedAlternativeId] = useState('alt-canvas-b');
  const [proposalTitle, setProposalTitle] = useState('Автономний Canvas 2D цикл із подійною синхронізацією');
  const [proposalRationale, setProposalRationale] = useState('Відокремлення 60 FPS рендерингу від React Virtual DOM усуває падіння FPS та запобігає збоям removeChild на рівні архітектури.');
  const [proposalRollback, setProposalRollback] = useState('Feature Flag перемикання на спрощений рендер у разі браузерної несумісності або регресії.');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Review Modal State
  const [reviewingAdr, setReviewingAdr] = useState(null);
  const [reviewerName, setReviewerName] = useState('Степаненко Дмитро (Lead Mentor)');
  const [criteriaScores, setCriteriaScores] = useState({
    contextUnderstanding: 5,
    tradeOffAwareness: 5,
    reversibilityDesign: 5,
    consequenceMitigation: 4,
    evidenceGrounding: 5,
  });
  const [reviewFeedback, setReviewFeedback] = useState('Чудове інженерне обґрунтування. Всі компроміси та план відкату визначено чітко.');

  const titleInputId = useId();
  const caseSelectId = useId();
  const altSelectId = useId();
  const rationaleInputId = useId();
  const rollbackInputId = useId();
  const reviewerInputId = useId();
  const feedbackInputId = useId();

  const fetchCasebookData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/academy/sysdesign/casebook');
      const data = await res.json();
      if (data.success) {
        setCases(data.cases || []);
        setAdrs(data.adrs || []);
        setTradeOffDimensions(data.tradeOffDimensions || {});
        setRubricCriteria(data.rubricCriteria || {});
        setPassingThreshold(data.passingThreshold || 18);
      }
    } catch (err) {
      console.error('Failed to load architecture casebook data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCasebookData();
  }, [fetchCasebookData]);

  const activeCase = cases.find((c) => c.id === selectedCaseId) || cases[0];

  const handleSelectCaseForProposal = (c, alt) => {
    setProposalCaseId(c.id);
    setSelectedAlternativeId(alt.id);
    setProposalTitle(`ADR: ${alt.nameUk}`);
    setProposalRationale(`Обрано ${alt.nameUk} як оптимальний компроміс для ${c.titleUk}. Враховано вартість, ризики та простоту підтримки.`);
    setProposalRollback(c.rollbackPlan || 'Миттєвий відкат через перемикання прапорця конфігурації.');
    setActiveTab('studio');
  };

  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    setFormError('');

    if (proposalTitle.trim().length < 5) {
      setFormError('Назва ADR повинна містити щонайменше 5 символів');
      return;
    }
    if (proposalRationale.trim().length < 20) {
      setFormError('Аргументація (rationale) повинна містити щонайменше 20 символів');
      return;
    }
    if (proposalRollback.trim().length < 15) {
      setFormError('План відкату повинен містити щонайменше 15 символів');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/academy/sysdesign/casebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_adr',
          caseId: proposalCaseId,
          alternativeId: selectedAlternativeId,
          title: proposalTitle,
          rationale: proposalRationale,
          rollbackPlan: proposalRollback,
          author: 'Yarik0505',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAdrs(data.adrs);
        setNotification(`Новий ADR ${data.adr.id} успішно подано на рев'ю ментора!`);
        setActiveTab('registry');
        setTimeout(() => setNotification(''), 4000);
      } else {
        setFormError(data.error || 'Помилка подання ADR');
      }
    } catch (err) {
      setFormError('Мережева помилка при поданні ADR');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReviewModal = (adr) => {
    setReviewingAdr(adr);
    if (adr.mentorReview) {
      setCriteriaScores(adr.mentorReview.criteriaScores || {
        contextUnderstanding: 4,
        tradeOffAwareness: 4,
        reversibilityDesign: 4,
        consequenceMitigation: 4,
        evidenceGrounding: 4,
      });
      setReviewFeedback(adr.mentorReview.feedback || '');
    } else {
      setCriteriaScores({
        contextUnderstanding: 5,
        tradeOffAwareness: 4,
        reversibilityDesign: 5,
        consequenceMitigation: 4,
        evidenceGrounding: 4,
      });
      setReviewFeedback('Аргументація зріла, план відкату протестовано, відсутній оверхед для команди.');
    }
  };

  const handleScoreChange = (criterionKey, value) => {
    setCriteriaScores((prev) => ({
      ...prev,
      [criterionKey]: Number(value),
    }));
  };

  const totalScore = Object.values(criteriaScores).reduce((sum, v) => sum + (Number(v) || 0), 0);
  const isPassed = totalScore >= passingThreshold;

  const handleSubmitReview = async () => {
    if (!reviewingAdr) return;
    try {
      const res = await fetch('/api/academy/sysdesign/casebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'review_adr',
          adrId: reviewingAdr.id,
          reviewer: reviewerName,
          criteriaScores,
          feedback: reviewFeedback,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAdrs(data.adrs);
        setReviewingAdr(null);
        setNotification(`Рев'ю ADR ${data.adr.id} завершено: статус оновлено на ${data.adr.status}`);
        setTimeout(() => setNotification(''), 4000);
      }
    } catch (err) {
      console.error('Review failed:', err);
    }
  };

  const handleResetStore = async () => {
    try {
      const res = await fetch('/api/academy/sysdesign/casebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      const data = await res.json();
      if (data.success) {
        setAdrs(data.adrs);
        setNotification('Сховище ADR скинуто до еталонного стану');
        setTimeout(() => setNotification(''), 3000);
      }
    } catch (err) {
      console.error('Reset failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-400 mb-3" />
        <p>Завантаження архітектурного кейсбуку Senior Lab...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 lg:p-8 backdrop-blur-sm text-slate-100 shadow-xl relative overflow-hidden">
      {/* Decorative gradient blur */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/40 rounded-full text-xs font-semibold uppercase tracking-wider">
              Senior Lab • Architecture Trade-Offs
            </span>
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full text-xs font-medium flex items-center gap-1.5">
              <span>🚪</span> Two-Way Doors &amp; Reversible Decisions
            </span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold mt-2 text-white">
            Кейсбук архітектурних компромісів та ADR-рев&apos;ю
          </h2>
          <p className="text-slate-400 text-sm mt-1 max-w-3xl">
            Справжній інженерний системний дизайн: оцінка вартості, ризиків, складності та реверсивності рішень замість абстрактних догм. Рев&apos;ю ментора оцінює якість мислення, а не «єдину правильну відповідь».
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetStore}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5"
          >
            <span>🔄</span> Скинути до еталону
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="mt-4 p-3 bg-purple-950/80 border border-purple-700/60 rounded-xl text-purple-300 text-sm flex items-center justify-between animate-fadeIn">
          <span>✅ {notification}</span>
          <button onClick={() => setNotification('')} className="text-xs text-purple-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="mt-6 flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('cases')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'cases'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          📚 Архітектурні кейси ({cases.length})
        </button>
        <button
          onClick={() => setActiveTab('comparator')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'comparator'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          ⚖️ Матриця компромісів (Trade-Offs)
        </button>
        <button
          onClick={() => setActiveTab('studio')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'studio'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          ✍️ Студія формування ADR
        </button>
        <button
          onClick={() => setActiveTab('registry')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'registry'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🏛️ Історичний реєстр ADR ({adrs.length})
        </button>
      </div>

      {/* TAB 1: CASES */}
      {activeTab === 'cases' && (
        <div className="mt-6 space-y-6">
          {/* Case selector pills */}
          <div className="flex flex-wrap gap-2">
            {cases.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCaseId(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  c.id === selectedCaseId
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {c.titleUk}
              </button>
            ))}
          </div>

          {/* Active Case Details Card */}
          {activeCase && (
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-700/80">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded text-xs font-mono uppercase">
                      {activeCase.category}
                    </span>
                    <span className="px-2.5 py-0.5 bg-slate-700 text-slate-300 rounded text-xs font-mono">
                      Jira: {activeCase.jiraKey}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-1.5">
                    {activeCase.titleUk}
                  </h3>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Code Evidence: <span className="text-purple-300">{activeCase.codeEvidence}</span>
                </div>
              </div>

              {/* Problem statement */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  🚨 Опис проблеми та контекст
                </h4>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {activeCase.problemStatement}
                </p>
              </div>

              {/* Constraints */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  🔒 Обмеження системи (System Constraints)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {activeCase.constraints?.map((con, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-cyan-400 font-bold">✓</span>
                      <span>{con}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alternatives comparison cards */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  ⚖️ Допустимі архітектурні альтернативи
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {activeCase.alternatives?.map((alt) => {
                    const isRec = alt.id === activeCase.recommendedDecision;
                    return (
                      <div
                        key={alt.id}
                        className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                          isRec
                            ? 'bg-purple-950/40 border-purple-500/50 shadow-lg shadow-purple-950/30'
                            : 'bg-slate-900/70 border-slate-700/80 hover:border-slate-600'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-white">
                              {alt.nameUk}
                            </span>
                            {isRec && (
                              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-semibold">
                                Рекомендовано ✅
                              </span>
                            )}
                          </div>

                          {/* Trade-off badges */}
                          <div className="grid grid-cols-2 gap-1.5 my-3 text-[11px] font-mono">
                            <div className="bg-slate-800/80 p-1.5 rounded flex justify-between">
                              <span className="text-slate-400">Вартість:</span>
                              <span className="font-bold text-emerald-400">{alt.tradeOffs.cost}/5</span>
                            </div>
                            <div className="bg-slate-800/80 p-1.5 rounded flex justify-between">
                              <span className="text-slate-400">Ризик:</span>
                              <span className={`font-bold ${alt.tradeOffs.risk >= 4 ? 'text-red-400' : 'text-cyan-400'}`}>
                                {alt.tradeOffs.risk}/5
                              </span>
                            </div>
                            <div className="bg-slate-800/80 p-1.5 rounded flex justify-between">
                              <span className="text-slate-400">Складність:</span>
                              <span className="font-bold text-amber-400">{alt.tradeOffs.complexity}/5</span>
                            </div>
                            <div className="bg-slate-800/80 p-1.5 rounded flex justify-between">
                              <span className="text-slate-400">Відкат:</span>
                              <span className="font-bold text-purple-400">{alt.tradeOffs.reversibility}/5</span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed mb-3">
                            {alt.summary}
                          </p>

                          <div className="space-y-1 text-xs">
                            <div className="text-emerald-400 font-medium">Плюси:</div>
                            <ul className="list-disc list-inside text-slate-300 space-y-0.5 text-[11px]">
                              {alt.pros.slice(0, 2).map((p, i) => (
                                <li key={i}>{p}</li>
                              ))}
                            </ul>
                            <div className="text-red-400 font-medium pt-1">Мінуси:</div>
                            <ul className="list-disc list-inside text-slate-300 space-y-0.5 text-[11px]">
                              {alt.cons.slice(0, 2).map((c, i) => (
                                <li key={i}>{c}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-700/60">
                          <button
                            onClick={() => handleSelectCaseForProposal(activeCase, alt)}
                            className="w-full py-2 bg-purple-600/80 hover:bg-purple-600 text-white rounded-lg text-xs font-semibold transition-all"
                          >
                            Сформувати ADR на базі цього варіанту ➔
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Consequences and Rollback */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-700/80 text-xs">
                <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800">
                  <span className="font-semibold text-emerald-400 block mb-1">
                    📈 Очікувані позитивні та негативні наслідки:
                  </span>
                  <ul className="list-disc list-inside text-slate-300 space-y-1">
                    {activeCase.consequences?.positive.map((p, i) => (
                      <li key={i}>✅ {p}</li>
                    ))}
                    {activeCase.consequences?.negative.map((n, i) => (
                      <li key={i}>⚠️ {n}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800">
                  <span className="font-semibold text-purple-400 block mb-1">
                    🚪 План відкату (Reversibility / Two-Way Door):
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    {activeCase.rollbackPlan}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TRADE-OFF COMPARATOR */}
      {activeTab === 'comparator' && (
        <div className="mt-6 space-y-6">
          <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl">
            <h4 className="text-sm font-semibold text-white">Порівняльна матриця компромісів 4 вимірів</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              В інженерії немає «ідеальних» рішень — кожне рішення має ціну, ризик та наслідки. 
              Старші інженери шукають рішення типу «двосторонні двері» (Two-Way Doors), які легко відкотити у разі зміни умов.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs bg-slate-800/70 border border-slate-700 rounded-xl overflow-hidden">
              <thead className="bg-slate-800 text-slate-300 font-semibold border-b border-slate-700">
                <tr>
                  <th className="p-3">Кейс та Альтернатива</th>
                  <th className="p-3 text-center">Вартість (Cost)</th>
                  <th className="p-3 text-center">Ризик (Risk)</th>
                  <th className="p-3 text-center">Складність</th>
                  <th className="p-3 text-center">Реверсивність (Rollback)</th>
                  <th className="p-3">Тип рішення</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {cases.map((c) =>
                  c.alternatives.map((alt) => {
                    const isTwoWay = alt.tradeOffs.reversibility <= 2;
                    return (
                      <tr key={alt.id} className="hover:bg-slate-800/90 transition-colors">
                        <td className="p-3">
                          <div className="font-semibold text-white">{alt.nameUk}</div>
                          <div className="text-[11px] text-slate-400">{c.titleUk}</div>
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-mono">
                            {alt.tradeOffs.cost} / 5
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded font-mono border ${
                              alt.tradeOffs.risk >= 4
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                            }`}
                          >
                            {alt.tradeOffs.risk} / 5
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-mono">
                            {alt.tradeOffs.complexity} / 5
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded font-mono">
                            {alt.tradeOffs.reversibility} / 5
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 rounded text-[10px] font-semibold ${
                              isTwoWay
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {isTwoWay ? '🚪 Two-Way Door (Легкий відкат)' : '🔒 One-Way Door (Незворотне)'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: STUDIO */}
      {activeTab === 'studio' && (
        <div className="mt-6 space-y-6">
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <span>✍️</span> Студія створення та подання ADR (Architecture Decision Record)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Опишіть ваше архітектурне рішення, обґрунтування та стратегію відкату. Ментор оцінить якість аргументації за 25-бальною шкалою.
            </p>

            <form onSubmit={handleSubmitProposal} className="mt-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-950/70 border border-red-800 rounded-lg text-xs text-red-300">
                  ⚠️ {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={caseSelectId} className="block text-xs text-slate-300 mb-1">
                    Оберіть архітектурний кейс *
                  </label>
                  <select
                    id={caseSelectId}
                    value={proposalCaseId}
                    onChange={(e) => {
                      setProposalCaseId(e.target.value);
                      const targetCase = cases.find((c) => c.id === e.target.value);
                      if (targetCase && targetCase.alternatives[0]) {
                        setSelectedAlternativeId(targetCase.alternatives[0].id);
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    {cases.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.titleUk}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor={altSelectId} className="block text-xs text-slate-300 mb-1">
                    Обрана альтернатива *
                  </label>
                  <select
                    id={altSelectId}
                    value={selectedAlternativeId}
                    onChange={(e) => setSelectedAlternativeId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    {cases
                      .find((c) => c.id === proposalCaseId)
                      ?.alternatives.map((alt) => (
                        <option key={alt.id} value={alt.id}>
                          {alt.nameUk}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor={titleInputId} className="block text-xs text-slate-300 mb-1">
                  Назва ADR (Title) *
                </label>
                <input
                  id={titleInputId}
                  type="text"
                  value={proposalTitle}
                  onChange={(e) => setProposalTitle(e.target.value)}
                  placeholder="Наприклад: Duck Verse 60 FPS Canvas Game Engine Isolation"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label htmlFor={rationaleInputId} className="block text-xs text-slate-300 mb-1">
                  💡 Аргументація та чому відхилено інші варіанти (Rationale) *
                </label>
                <textarea
                  id={rationaleInputId}
                  rows={3}
                  value={proposalRationale}
                  onChange={(e) => setProposalRationale(e.target.value)}
                  placeholder="Чому цей компроміс найкращий для команди? Чому дорожчі чи складніші варіанти відхилено?"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label htmlFor={rollbackInputId} className="block text-xs text-slate-300 mb-1">
                  🚪 Стратегія відкату (Rollback &amp; Reversibility Plan) *
                </label>
                <textarea
                  id={rollbackInputId}
                  rows={2}
                  value={proposalRollback}
                  onChange={(e) => setProposalRollback(e.target.value)}
                  placeholder="Як команда повернеться до попереднього стану в разі виявлення прихованого багу або деградації?"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-950/40 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Подання...' : 'Подати ADR на розгляд ментора ➔'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: HISTORICAL REGISTRY */}
      {activeTab === 'registry' && (
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl flex items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-white">
                Історичний реєстр ADR (Architecture Decision Records)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Кожен прийнятий ADR пов&apos;язаний із Jira та кодом. Застарілі або замінені рішення позначаються як <span className="text-amber-400 font-mono">Superseded</span> та зберігаються в історії для розуміння еволюції проекту.
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg font-mono">
              Всього: {adrs.length}
            </span>
          </div>

          <div className="space-y-3">
            {adrs.map((adr) => {
              const isAccepted = adr.status === 'Accepted';
              const isSuperseded = adr.status === 'Superseded';
              const isProposed = adr.status === 'Proposed';

              return (
                <div
                  key={adr.id}
                  className={`p-5 rounded-xl border transition-all ${
                    isAccepted
                      ? 'bg-slate-800/80 border-slate-700 hover:border-purple-500/40'
                      : isSuperseded
                      ? 'bg-slate-900/60 border-amber-900/40 opacity-70'
                      : 'bg-purple-950/30 border-purple-800/60'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-700/60">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-700 text-cyan-300 rounded">
                        {adr.id}
                      </span>
                      <h5 className="text-base font-bold text-white">
                        {adr.title}
                      </h5>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          isAccepted
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : isSuperseded
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse'
                        }`}
                      >
                        {isAccepted && 'Accepted ✅'}
                        {isSuperseded && `Superseded by ${adr.supersededBy} 📜`}
                        {isProposed && 'Proposed (Очікує рев’ю) ⏳'}
                      </span>
                      <button
                        onClick={() => handleOpenReviewModal(adr)}
                        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium transition-all"
                      >
                        {adr.mentorReview ? 'Рев’ю ментора 🔍' : 'Оцінити ADR ✍️'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Рішення:</span>
                      <p className="text-slate-200 font-medium">{adr.decision}</p>
                      <span className="text-slate-400 block mt-2 mb-0.5">Обґрунтування (Rationale):</span>
                      <p className="text-slate-300 line-clamp-2">{adr.rationale}</p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-slate-400 font-mono">
                        <span>Jira Issue:</span>
                        <span className="text-purple-300 font-bold">{adr.jiraKey}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400 font-mono truncate">
                        <span>Code Evidence:</span>
                        <span className="text-cyan-300">{adr.codeEvidence}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Автор / Дата:</span>
                        <span className="text-slate-300">{adr.owner} • {adr.date}</span>
                      </div>
                      {adr.mentorReview && (
                        <div className="mt-2 pt-2 border-t border-slate-700/60 flex items-center justify-between">
                          <span className="text-slate-400">Оцінка ментора:</span>
                          <span className={`font-bold font-mono ${adr.mentorReview.passed ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {adr.mentorReview.score} / 25 ({adr.mentorReview.passed ? 'Схвалено' : 'Доопрацювання'})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MENTOR REASONING REVIEW MODAL */}
      {reviewingAdr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4 text-slate-200 animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono text-purple-400">{reviewingAdr.id} • Reasoning Evaluation</span>
                <h4 className="text-base font-bold text-white">{reviewingAdr.title}</h4>
              </div>
              <button
                onClick={() => setReviewingAdr(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Рубрика оцінює <strong>якість інженерного мислення</strong>: повноту врахування обмежень, чесність компромісів та наявність плану відкату.
            </p>

            {/* Criteria scoring sliders */}
            <div className="space-y-3 pt-2">
              {Object.entries(rubricCriteria).map(([key, crit]) => (
                <div key={key} className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/80">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-200">{crit.nameUk}</span>
                    <span className="font-mono font-bold text-cyan-400">
                      {criteriaScores[key] ?? 3} / 5
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-2">{crit.description}</p>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={criteriaScores[key] ?? 3}
                    onChange={(e) => handleScoreChange(key, e.target.value)}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>
              ))}
            </div>

            {/* Total score summary */}
            <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium">Загальний бал (Поріг: {passingThreshold}/25):</span>
              <span className={`text-base font-bold font-mono ${isPassed ? 'text-emerald-400' : 'text-red-400'}`}>
                {totalScore} / 25 — {isPassed ? 'ACCEPTED ✅' : 'REJECTED ❌'}
              </span>
            </div>

            {/* Reviewer name & feedback */}
            <div className="space-y-2 text-xs">
              <div>
                <label htmlFor={reviewerInputId} className="block text-slate-400 mb-1">Ім&apos;я рев&apos;ювера / Ментора</label>
                <input
                  id={reviewerInputId}
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs"
                />
              </div>
              <div>
                <label htmlFor={feedbackInputId} className="block text-slate-400 mb-1">Коментар та калібрувальний відгук ментора</label>
                <textarea
                  id={feedbackInputId}
                  rows={2}
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setReviewingAdr(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Скасувати
              </button>
              <button
                onClick={handleSubmitReview}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
              >
                Зберегти вердикт рев&apos;ю
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
