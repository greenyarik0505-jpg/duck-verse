'use client';

import React, { useState, useEffect, useCallback, useId } from 'react';

export default function MentoringLeadershipLoopView() {
  const [sessions, setSessions] = useState([]);
  const [pillars, setPillars] = useState({});
  const [rotationReport, setRotationReport] = useState(null);
  const [anonymizedSamples, setAnonymizedSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sessions'); // 'sessions' | 'self_review' | 'rotation' | 'audit'
  const [notification, setNotification] = useState('');

  // Self-Review Form state
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [reflectionInput, setReflectionInput] = useState('');
  const [blindSpotsInput, setBlindSpotsInput] = useState('');
  const [nextExperimentInput, setNextExperimentInput] = useState('');
  const [selfReviewError, setSelfReviewError] = useState('');
  const [submittingSelfReview, setSubmittingSelfReview] = useState(false);

  // Amendment Modal state
  const [amendingSession, setAmendingSession] = useState(null);
  const [amendmentReason, setAmendmentReason] = useState('');
  const [amendedFeedback, setAmendedFeedback] = useState('');
  const [amendedPraise, setAmendedPraise] = useState('');
  const [amendedTip, setAmendedTip] = useState('');
  const [amendedScores, setAmendedScores] = useState({ technical: 5, communication: 5, ownership: 5 });
  const [amendError, setAmendError] = useState('');
  const [submittingAmend, setSubmittingAmend] = useState(false);

  // New Session Modal / Form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPr, setNewPr] = useState('PR #43');
  const [newJira, setNewJira] = useState('SCRUM-133');
  const [newMentor, setNewMentor] = useState('Yarik0505 (Peer Mentor)');
  const [newLearner, setNewLearner] = useState('Богдан Студент');
  const [newGoal, setNewGoal] = useState('Освоїти формування STAR-наративів та антитоксичну санітизацію досьє.');
  const [newObservable, setNewObservable] = useState('Богдан швидко розібрався з фільтрацією PII, але потребував допомоги з форматуванням Markdown таблиці.');
  const [newPraiseVal, setNewPraiseVal] = useState('Відмінне розуміння дитячої приватності та відсутності лідербордів.');
  const [newTipVal, setNewTipVal] = useState('Перед здачею PR перевіряти наявність усіх 8 модульних тестів.');
  const [newScoresVal, setNewScoresVal] = useState({ technical: 4, communication: 5, ownership: 4 });

  const reflectionId = useId();
  const blindSpotsId = useId();
  const nextExpId = useId();
  const amendReasonId = useId();
  const amendFeedbackId = useId();

  const fetchLeadershipData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/academy/mentoring/leadership');
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions || []);
        setPillars(data.pillars || {});
        setRotationReport(data.rotationReport || null);
        setAnonymizedSamples(data.anonymizedSamples || []);

        const pending = (data.sessions || []).find((s) => !s.selfReview);
        if (pending) {
          setSelectedSessionId(pending.id);
        } else if (data.sessions?.length > 0) {
          setSelectedSessionId(data.sessions[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load mentoring leadership data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeadershipData();
  }, [fetchLeadershipData]);

  const handleSubmitSelfReview = async (e) => {
    e.preventDefault();
    setSelfReviewError('');

    if (reflectionInput.trim().length < 10) {
      setSelfReviewError('Саморефлексія повинна містити щонайменше 10 символів');
      return;
    }
    if (nextExperimentInput.trim().length < 10) {
      setSelfReviewError('Наступний експеримент повинен містити щонайменше 10 символів');
      return;
    }

    try {
      setSubmittingSelfReview(true);
      const res = await fetch('/api/academy/mentoring/leadership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_self_review',
          sessionId: selectedSessionId,
          reflection: reflectionInput,
          blindSpotsDiscovered: blindSpotsInput,
          nextExperiment: nextExperimentInput,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions);
        setReflectionInput('');
        setBlindSpotsInput('');
        setNextExperimentInput('');
        setNotification('Саморефлексію та план наступного експерименту успішно збережено!');
        setActiveTab('sessions');
        setTimeout(() => setNotification(''), 4000);
      } else {
        setSelfReviewError(data.error || 'Помилка збереження');
      }
    } catch (err) {
      setSelfReviewError('Мережева помилка');
    } finally {
      setSubmittingSelfReview(false);
    }
  };

  const handleOpenAmendModal = (session) => {
    setAmendingSession(session);
    setAmendmentReason('');
    setAmendedFeedback(session.observableFeedback || '');
    setAmendedPraise(session.praiseHighlight || '');
    setAmendedTip(session.improvementTip || '');
    setAmendedScores({ ...session.scores });
    setAmendError('');
  };

  const handleSubmitAmend = async () => {
    if (!amendingSession) return;
    setAmendError('');

    if (amendmentReason.trim().length < 10) {
      setAmendError('Обов’язково вкажіть причину уточнення відгуку (щонайменше 10 символів)');
      return;
    }

    try {
      setSubmittingAmend(true);
      const res = await fetch('/api/academy/mentoring/leadership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'amend_feedback',
          sessionId: amendingSession.id,
          amendedBy: 'Yarik0505 (Calibration Mentor)',
          amendmentReason,
          newFeedback: amendedFeedback,
          newPraise: amendedPraise,
          newTip: amendedTip,
          newScores: amendedScores,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions);
        setAmendingSession(null);
        setNotification('Відгук уточнено. Історичну ревізію зафіксовано в незмінному аудит-лозі!');
        setTimeout(() => setNotification(''), 4000);
      } else {
        setAmendError(data.error || 'Помилка калібрування');
      }
    } catch (err) {
      setAmendError('Мережева помилка при калібруванні');
    } finally {
      setSubmittingAmend(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/academy/mentoring/leadership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_session',
          prReference: newPr,
          jiraKey: newJira,
          mentorName: newMentor,
          learnerName: newLearner,
          preReviewGoal: newGoal,
          observableFeedback: newObservable,
          praiseHighlight: newPraiseVal,
          improvementTip: newTipVal,
          scores: newScoresVal,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions);
        setRotationReport(data.rotationReport);
        setShowCreateModal(false);
        setNotification('Нову менторську сесію створено!');
        setTimeout(() => setNotification(''), 3000);
      }
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  };

  const handleReset = async () => {
    try {
      const res = await fetch('/api/academy/mentoring/leadership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions);
        setRotationReport(data.rotationReport);
        setNotification('Сховище наставництва скинуто до еталонного стану');
        setTimeout(() => setNotification(''), 3000);
      }
    } catch (err) {
      console.error('Reset failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-400 mb-3" />
        <p>Завантаження циклу наставництва та калібрування...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 lg:p-8 backdrop-blur-sm text-slate-100 shadow-xl relative overflow-hidden">
      {/* Decorative gradient blur */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-xs font-semibold uppercase tracking-wider">
              Senior Lab • Mentoring Leadership Loop
            </span>
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full text-xs font-medium flex items-center gap-1.5">
              <span>🔄</span> Mentor → Learner → Next Experiment
            </span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold mt-2 text-white">
            Цикл наставництва, лідерства та калібрування зворотного зв&apos;язку
          </h2>
          <p className="text-slate-400 text-sm mt-1 max-w-3xl">
            Підготовка senior-інженерів через розвиток навичок коучингу, емпатичного рев&apos;ю, структурованої саморефлексії та справедливої ротації ролей у команді.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950/30 transition-all flex items-center gap-1.5"
          >
            <span>➕</span> Нова сесія
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-all"
          >
            🔄 Скинути
          </button>
        </div>
      </div>

      {/* Notification toast */}
      {notification && (
        <div className="mt-4 p-3 bg-emerald-950/80 border border-emerald-700/60 rounded-xl text-emerald-300 text-sm flex items-center justify-between animate-fadeIn">
          <span>✅ {notification}</span>
          <button onClick={() => setNotification('')} className="text-xs text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="mt-6 flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'sessions'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🔄 Сесії наставництва ({sessions.length})
        </button>
        <button
          onClick={() => setActiveTab('self_review')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'self_review'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          ✍️ Студія Self-Review та Експериментів
        </button>
        <button
          onClick={() => setActiveTab('rotation')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'rotation'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          ⚖️ Балансування ротації ({rotationReport?.systemFairnessScore || 'Fair'})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'audit'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          📜 Журнал калібрування та зразки ({anonymizedSamples.length})
        </button>
      </div>

      {/* TAB 1: SESSIONS & 3-PILLAR FEEDBACK */}
      {activeTab === 'sessions' && (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 space-y-4 hover:border-emerald-500/40 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-700/80">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-xs font-mono font-bold">
                        {s.prReference}
                      </span>
                      <span className="px-2.5 py-0.5 bg-slate-700 text-slate-300 rounded text-xs font-mono">
                        {s.jiraKey}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          s.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                        }`}
                      >
                        {s.status === 'COMPLETED' ? 'Повний цикл завершено ✅' : 'Очікує Self-Review ⏳'}
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-white mt-1.5">
                      Ментор: <span className="text-emerald-300">{s.mentorName}</span> ➔ Учень: <span className="text-cyan-300">{s.learnerName}</span>
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenAmendModal(s)}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
                      title="Внести калібрувальні уточнення зі збереженням історії аудиту"
                    >
                      <span>✏️</span> Уточнити відгук
                    </button>
                  </div>
                </div>

                {/* 3 Pillars Score Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block">1. Technical Excellence</span>
                      <span className="text-sm font-bold text-cyan-400">Технічні навички</span>
                    </div>
                    <span className="text-lg font-extrabold text-white font-mono px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                      {s.scores?.technical} / 5
                    </span>
                  </div>

                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block">2. Empathetic Communication</span>
                      <span className="text-sm font-bold text-emerald-400">Комунікація та тон</span>
                    </div>
                    <span className="text-lg font-extrabold text-white font-mono px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                      {s.scores?.communication} / 5
                    </span>
                  </div>

                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block">3. Extreme Ownership</span>
                      <span className="text-sm font-bold text-purple-400">Лідерство та обов&apos;язки</span>
                    </div>
                    <span className="text-lg font-extrabold text-white font-mono px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                      {s.scores?.ownership} / 5
                    </span>
                  </div>
                </div>

                {/* Goals & Observable Feedback */}
                <div className="space-y-2 text-xs">
                  <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800">
                    <span className="font-semibold text-slate-400 block mb-1">🎯 Ціль навчання перед рев&apos;ю (Pre-Review Goal):</span>
                    <p className="text-slate-200">{s.preReviewGoal}</p>
                  </div>

                  <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800">
                    <span className="font-semibold text-emerald-400 block mb-1">🔍 Спостережуваний відгук (Observable Behavioral Feedback):</span>
                    <p className="text-slate-200 leading-relaxed">{s.observableFeedback}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                    <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800 text-[11px]">
                      <span className="text-emerald-400 font-semibold block mb-0.5">🌟 Що вийшло бездоганно:</span>
                      <span className="text-slate-300">{s.praiseHighlight}</span>
                    </div>
                    <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800 text-[11px]">
                      <span className="text-amber-400 font-semibold block mb-0.5">💡 Зона росту для наступного разу:</span>
                      <span className="text-slate-300">{s.improvementTip}</span>
                    </div>
                  </div>
                </div>

                {/* Self-Review & Next Experiment Section */}
                {s.selfReview ? (
                  <div className="mt-3 pt-3 border-t border-slate-700/80 bg-slate-950/40 p-4 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between text-cyan-400 font-bold">
                      <span>🧠 Саморефлексія учня ({s.learnerName}):</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(s.selfReview.submittedAt).toLocaleDateString('uk-UA')}
                      </span>
                    </div>
                    <p className="text-slate-300">{s.selfReview.reflection}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                      <div className="bg-slate-900 p-2.5 rounded-lg">
                        <span className="text-amber-300 font-semibold block mb-0.5">Виявлені сліпі зони:</span>
                        <p className="text-slate-300 text-[11px]">{s.selfReview.blindSpotsDiscovered}</p>
                      </div>
                      <div className="bg-slate-900 p-2.5 rounded-lg">
                        <span className="text-purple-300 font-semibold block mb-0.5">🚀 Наступний запланований експеримент:</span>
                        <p className="text-slate-300 text-[11px]">{s.selfReview.nextExperiment}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-amber-300">⏳ Учень ще не заповнив саморефлексію для завершення лідерського циклу.</span>
                    <button
                      onClick={() => {
                        setSelectedSessionId(s.id);
                        setActiveTab('self_review');
                      }}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold"
                    >
                      Заповнити зараз ➔
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SELF-REVIEW & EXPERIMENT STUDIO */}
      {activeTab === 'self_review' && (
        <div className="mt-6 space-y-6">
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <span>✍️</span> Студія саморефлексії та проектування наступного експерименту
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Senior інженер вчиться не від оцінок, а від здатності критично проаналізувати свій код, виявити сліпі зони та сформулювати дієвий експеримент на наступний реліз.
            </p>

            <form onSubmit={handleSubmitSelfReview} className="mt-5 space-y-4">
              {selfReviewError && (
                <div className="p-3 bg-red-950/70 border border-red-800 rounded-lg text-xs text-red-300">
                  ⚠️ {selfReviewError}
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-300 mb-1">Оберіть сесію для саморефлексії *</label>
                <select
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.prReference} ({s.jiraKey}): Ментор {s.mentorName} ➔ {s.learnerName} [{s.selfReview ? 'Завершено' : 'Очікує'}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor={reflectionId} className="block text-xs text-slate-300 mb-1">
                  1. Саморефлексія: що вийшло вдало, а що викликало труднощі? *
                </label>
                <textarea
                  id={reflectionId}
                  rows={3}
                  value={reflectionInput}
                  onChange={(e) => setReflectionInput(e.target.value)}
                  placeholder="Оцініть власні рішення, де ви відчули впевненість, а де довелося витратити найбільше часу..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label htmlFor={blindSpotsId} className="block text-xs text-slate-300 mb-1">
                  2. Виявлені сліпі зони (Blind Spots): що стало очевидним після коментарів ментора?
                </label>
                <textarea
                  id={blindSpotsId}
                  rows={2}
                  value={blindSpotsInput}
                  onChange={(e) => setBlindSpotsInput(e.target.value)}
                  placeholder="Наприклад: не врахував затримку обчислення в сафарі або забув додати перевірку на відсутній токен..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label htmlFor={nextExpId} className="block text-xs text-slate-300 mb-1">
                  3. Наступний експеримент (Next Concrete Experiment): яку конкретну зміну ви перевірите на наступному PR? *
                </label>
                <textarea
                  id={nextExpId}
                  rows={2}
                  value={nextExperimentInput}
                  onChange={(e) => setNextExperimentInput(e.target.value)}
                  placeholder="Наприклад: перед створенням PR запущу автоскрипт верифікації через Chrome CDP або напишу тест на граничні значення..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submittingSelfReview}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950/40 transition-all disabled:opacity-50"
                >
                  {submittingSelfReview ? 'Збереження...' : 'Зафіксувати саморефлексію в аудит ➔'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: ROTATION FAIRNESS ENGINE */}
      {activeTab === 'rotation' && rotationReport && (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl">
              <span className="text-xs text-slate-400 block">Fairness Score</span>
              <span className="text-xl font-bold text-emerald-400 mt-1 block">
                {rotationReport.systemFairnessScore}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                Алгоритм запобігає перевантаженню або ізоляції учнів.
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl md:col-span-2 flex flex-col justify-between">
              <div>
                <span className="text-xs text-cyan-400 font-semibold block">
                  🎯 Рекомендована наступна пара для код-рев&apos;ю:
                </span>
                <div className="text-sm font-bold text-white mt-1">
                  Рев&apos;ювер: <span className="text-emerald-300">{rotationReport.suggestedNextPair.reviewer}</span> ➔ Автор коду: <span className="text-cyan-300">{rotationReport.suggestedNextPair.reviewee}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                {rotationReport.suggestedNextPair.rationale}
              </p>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-700 font-semibold text-sm text-white">
              Баланс ролей учнів (Reviewer vs Reviewee)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800 text-slate-300 border-b border-slate-700 font-mono">
                  <tr>
                    <th className="p-3">Учень / Інженер</th>
                    <th className="p-3 text-center">Провів рев&apos;ю (Reviewer)</th>
                    <th className="p-3 text-center">Отримав рев&apos;ю (Reviewee)</th>
                    <th className="p-3 text-center">Всього взаємодій</th>
                    <th className="p-3 text-center">Коефіцієнт балансу</th>
                    <th className="p-3">Статус ротації</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {rotationReport.studentReports.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-800/60 transition-colors">
                      <td className="p-3 font-semibold text-white">{st.name}</td>
                      <td className="p-3 text-center font-mono text-emerald-400">{st.reviewerCount}</td>
                      <td className="p-3 text-center font-mono text-cyan-400">{st.revieweeCount}</td>
                      <td className="p-3 text-center font-mono text-slate-300">{st.totalInteractions}</td>
                      <td className="p-3 text-center font-mono">
                        <span className="px-2 py-0.5 bg-slate-700 rounded">
                          {(st.balanceRatio * 100).toFixed(0)}% Reviewer
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            st.isImbalanced
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {st.isImbalanced ? `Потрібно залучити як ${st.recommendedRole}` : 'Збалансовано ✅'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT REVISIONS & ANONYMIZED SAMPLES */}
      {activeTab === 'audit' && (
        <div className="mt-6 space-y-6">
          <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl">
            <h4 className="text-sm font-semibold text-white">
              Незмінний журнал калібрування зворотного зв&apos;язку
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Згідно з інженерними стандартами, відгук можна уточнити або скоригувати, але історія початкових спостережень зберігається назавжди.
            </p>
          </div>

          {/* Audit trail list from all sessions */}
          <div className="space-y-3">
            {sessions.map((s) => (
              <div key={s.id} className="bg-slate-800/70 border border-slate-700 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-700">
                  <span className="font-bold text-white font-mono">{s.prReference} ({s.jiraKey})</span>
                  <span className="text-slate-400">Ревізій: {s.auditTrail?.length || 1}</span>
                </div>

                <div className="space-y-1.5 pt-1">
                  {s.auditTrail?.map((audit, idx) => (
                    <div key={idx} className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-xs flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.2 bg-slate-700 text-cyan-300 rounded font-mono text-[10px]">
                            v{audit.version}
                          </span>
                          <span className="font-semibold text-slate-200">{audit.action}</span>
                          <span className="text-slate-400 text-[11px]">автор: {audit.author}</span>
                        </div>
                        <p className="text-slate-300 text-[11px] mt-1">{audit.note}</p>
                      </div>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap font-mono">
                        {new Date(audit.timestamp).toLocaleTimeString('uk-UA')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Anonymized Samples for Peer Learning */}
          <div className="mt-8 space-y-3">
            <h4 className="text-sm font-semibold text-slate-300">
              Анонімізовані зразки зворотного зв&apos;язку для взаємного навчання
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {anonymizedSamples.map((sample, i) => (
                <div key={i} className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl text-xs space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400">
                    <span>Зразок #{sample.caseNumber}</span>
                    <span>Контекст: {sample.prCategory}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Ціль:</span>
                    <p className="text-slate-200">{sample.goalTheme}</p>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-cyan-400 font-semibold block mb-0.5">Спостереження ментора:</span>
                    <p className="text-slate-300 text-[11px]">{sample.observableFeedbackSample}</p>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-purple-400 font-semibold block mb-0.5">Рефлексія учня:</span>
                    <p className="text-slate-300 text-[11px]">{sample.learnerReflectionSample}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AMENDMENT MODAL */}
      {amendingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4 text-slate-200 animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono text-emerald-400">Feedback Calibration &amp; Audit Trail</span>
                <h4 className="text-base font-bold text-white">
                  Уточнення відгуку: {amendingSession.prReference} ({amendingSession.learnerName})
                </h4>
              </div>
              <button
                onClick={() => setAmendingSession(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {amendError && (
              <div className="p-3 bg-red-950/70 border border-red-800 rounded-lg text-xs text-red-300">
                ⚠️ {amendError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label htmlFor={amendReasonId} className="block text-slate-300 mb-1 font-semibold">
                  Причина внесення правок (фіксується в незмінному аудит-лозі) *
                </label>
                <input
                  id={amendReasonId}
                  type="text"
                  value={amendmentReason}
                  onChange={(e) => setAmendmentReason(e.target.value)}
                  placeholder="Наприклад: Уточнення формулювання після очної калібрувальної зустрічі"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
                />
              </div>

              <div>
                <label htmlFor={amendFeedbackId} className="block text-slate-300 mb-1 font-semibold">
                  Оновлений спостережуваний відгук
                </label>
                <textarea
                  id={amendFeedbackId}
                  rows={3}
                  value={amendedFeedback}
                  onChange={(e) => setAmendedFeedback(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Оновлена похвала</label>
                  <input
                    type="text"
                    value={amendedPraise}
                    onChange={(e) => setAmendedPraise(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Оновлена порада</label>
                  <input
                    type="text"
                    value={amendedTip}
                    onChange={(e) => setAmendedTip(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <div>
                  <span className="text-[11px] text-slate-400 block">Technical:</span>
                  <select
                    value={amendedScores.technical}
                    onChange={(e) => setAmendedScores({ ...amendedScores, technical: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-xs"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n} / 5</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Communication:</span>
                  <select
                    value={amendedScores.communication}
                    onChange={(e) => setAmendedScores({ ...amendedScores, communication: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-xs"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n} / 5</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Ownership:</span>
                  <select
                    value={amendedScores.ownership}
                    onChange={(e) => setAmendedScores({ ...amendedScores, ownership: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-xs"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n} / 5</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setAmendingSession(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Скасувати
              </button>
              <button
                onClick={handleSubmitAmend}
                disabled={submittingAmend}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all disabled:opacity-50"
              >
                {submittingAmend ? 'Збереження...' : 'Зберегти версію в аудит'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE SESSION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4 text-slate-200 animate-scaleIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-base font-bold text-white">Створити нову сесію наставництва</h4>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">PR Посилання *</label>
                  <input
                    type="text"
                    value={newPr}
                    onChange={(e) => setNewPr(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Jira Ключ *</label>
                  <input
                    type="text"
                    value={newJira}
                    onChange={(e) => setNewJira(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Ментор *</label>
                  <input
                    type="text"
                    value={newMentor}
                    onChange={(e) => setNewMentor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Учень *</label>
                  <input
                    type="text"
                    value={newLearner}
                    onChange={(e) => setNewLearner(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Ціль навчання (Pre-Review Goal) *</label>
                <textarea
                  rows={2}
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Спостережуваний відгук (Observable Feedback) *</label>
                <textarea
                  rows={2}
                  value={newObservable}
                  onChange={(e) => setNewObservable(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
                >
                  Створити сесію
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
