'use client';

import { useState, useEffect, useCallback } from 'react';

export default function IndividualLearningPlanView({ currentUser, completedLessons = ['lesson-fe-l0-arch'] }) {
  const [activeTab, setActiveTab] = useState('plan'); // 'plan' | 'electives' | 'exceptions' | 'audit'
  const [plan, setPlan] = useState(null);
  const [availableGoals, setAvailableGoals] = useState({});
  const [electivesCatalog, setElectivesCatalog] = useState([]);
  const [nextStep, setNextStep] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  // Редагування цілей
  const [selectedGoal, setSelectedGoal] = useState('fe-architect');
  const [weeklyHours, setWeeklyHours] = useState(8);

  // Форма запиту на виняток
  const [exceptionElectiveId, setExceptionElectiveId] = useState('');
  const [exceptionExplanation, setExceptionExplanation] = useState('');

  // Форма рецензії ментора
  const [reviewingExceptionId, setReviewingExceptionId] = useState(null);
  const [reviewDecision, setReviewDecision] = useState('APPROVED');
  const [reviewerNotesInput, setReviewerNotesInput] = useState('');

  const isMentorOrAdmin =
    currentUser?.role === 'mentor' ||
    currentUser?.role === 'admin' ||
    currentUser?.role === 'team_lead';

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/academy/learning-plan?completedLessons=${completedLessons.join(',')}`);
      const data = await res.json();
      if (data.success) {
        setPlan(data.plan);
        setAvailableGoals(data.availableGoals || {});
        setElectivesCatalog(data.electivesCatalog || []);
        setNextStep(data.nextStep);
        if (data.plan) {
          setSelectedGoal(data.plan.targetGoal);
          setWeeklyHours(data.plan.targetWeeklyHours);
        }
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [completedLessons]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Збереження цілей
  const handleUpdateGoals = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch('/api/academy/learning-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_goals',
          targetGoal: selectedGoal,
          targetWeeklyHours: Number(weeklyHours),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`🎯 Цілі індивідуального плану оновлено! Створено ревізію v${data.plan.version}`);
        await fetchData();
      } else {
        setActionMessage(`❌ Помилка: ${data.error}`);
      }
    } catch (err) {
      setActionMessage(`❌ Помилка мережі: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Перемикання вибіркового курсу (Elective)
  const handleToggleElective = async (electiveId) => {
    if (!plan) return;
    const isCurrentlySelected = plan.selectedElectives.includes(electiveId);
    const newElectives = isCurrentlySelected
      ? plan.selectedElectives.filter(id => id !== electiveId)
      : [...plan.selectedElectives, electiveId];

    try {
      setLoading(true);
      const res = await fetch('/api/academy/learning-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'select_electives',
          electiveIds: newElectives,
          completedLessons,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`⚡ Перелік вибіркових курсів оновлено! Версія: v${data.plan.version}`);
        await fetchData();
      } else {
        setActionMessage(`❌ ${data.error}`);
        if (data.code === 'PREREQUISITES_NOT_MET') {
          setExceptionElectiveId(electiveId);
          setActiveTab('exceptions');
        }
      }
    } catch (err) {
      setActionMessage(`❌ Помилка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Подання запиту на виняток
  const handleRequestException = async (e) => {
    e.preventDefault();
    if (!exceptionElectiveId || exceptionExplanation.trim().length < 15) {
      setActionMessage('Будь ласка, оберіть курс та надайте детальне обґрунтування (від 15 символів).');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/academy/learning-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request_exception',
          electiveId: exceptionElectiveId,
          explanation: exceptionExplanation.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage('📩 Запит на виняток передумов успішно передано менторам на розгляд!');
        setExceptionExplanation('');
        await fetchData();
      } else {
        setActionMessage(`❌ Помилка: ${data.error}`);
      }
    } catch (err) {
      setActionMessage(`❌ Помилка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Рецензія ментора на виняток
  const handleReviewException = async (e) => {
    e.preventDefault();
    if (!reviewingExceptionId) return;

    try {
      setLoading(true);
      const res = await fetch('/api/academy/learning-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'review_exception',
          exceptionId: reviewingExceptionId,
          decision: reviewDecision,
          reviewerNotes: reviewerNotesInput,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`🎓 Рішення зафіксовано: ${reviewDecision}. Версія плану: v${data.updatedPlanVersion}`);
        setReviewingExceptionId(null);
        setReviewerNotesInput('');
        await fetchData();
      } else {
        setActionMessage(`❌ Помилка рецензії: ${data.error}`);
      }
    } catch (err) {
      setActionMessage(`❌ Помилка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="academy-skills-section" style={{ marginTop: '48px' }}>
      {/* Заголовок SCRUM-100 */}
      <div className="academy-skills-header">
        <div>
          <h2
            style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: '22px',
              color: '#38bdf8',
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              margin: 0,
            }}
          >
            <span>🎯</span> INDIVIDUAL LEARNING PLAN & ADAPTIVE PATH (SCRUM-100)
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: '4px 0 0 0' }}>
            Індивідуальний навчальний план поверх L0–L9: стратегічні цілі, вибіркові дисципліни (Electives), адаптивна рекомендація кроку, аудит версій та винятки передумов.
          </p>
        </div>

        {/* Навігаційні таби */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('plan')}
            className={`academy-tab-button ${activeTab === 'plan' ? 'active' : ''}`}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              border: activeTab === 'plan' ? '1px solid #38bdf8' : '1px solid #334155',
              background: activeTab === 'plan' ? 'rgba(56, 189, 248, 0.15)' : '#0f172a',
              color: activeTab === 'plan' ? '#38bdf8' : '#94a3b8',
              fontWeight: 'bold',
            }}
          >
            🎯 Мій план (v{plan?.version || 1})
          </button>

          <button
            onClick={() => setActiveTab('electives')}
            className={`academy-tab-button ${activeTab === 'electives' ? 'active' : ''}`}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              border: activeTab === 'electives' ? '1px solid #10b981' : '1px solid #334155',
              background: activeTab === 'electives' ? 'rgba(16, 185, 129, 0.15)' : '#0f172a',
              color: activeTab === 'electives' ? '#10b981' : '#94a3b8',
              fontWeight: 'bold',
            }}
          >
            ⚡ Каталог Electives ({electivesCatalog.length})
          </button>

          <button
            onClick={() => setActiveTab('exceptions')}
            className={`academy-tab-button ${activeTab === 'exceptions' ? 'active' : ''}`}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              border: activeTab === 'exceptions' ? '1px solid #f59e0b' : '1px solid #334155',
              background: activeTab === 'exceptions' ? 'rgba(245, 158, 11, 0.15)' : '#0f172a',
              color: activeTab === 'exceptions' ? '#f59e0b' : '#94a3b8',
              fontWeight: 'bold',
            }}
          >
            🔓 Винятки та Prerequisites {isMentorOrAdmin ? '👑' : ''}
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`academy-tab-button ${activeTab === 'audit' ? 'active' : ''}`}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              border: activeTab === 'audit' ? '1px solid #a855f7' : '1px solid #334155',
              background: activeTab === 'audit' ? 'rgba(168, 85, 247, 0.15)' : '#0f172a',
              color: activeTab === 'audit' ? '#a855f7' : '#94a3b8',
              fontWeight: 'bold',
            }}
          >
            📜 Журнал версій ({plan?.auditTrail?.length || 0})
          </button>
        </div>
      </div>

      {actionMessage && (
        <div
          style={{
            margin: '16px 0',
            padding: '12px 16px',
            borderRadius: '8px',
            background: actionMessage.includes('❌') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.15)',
            border: actionMessage.includes('❌') ? '1px solid #ef4444' : '1px solid #38bdf8',
            color: actionMessage.includes('❌') ? '#fca5a5' : '#7dd3fc',
            fontSize: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{actionMessage}</span>
          <button
            onClick={() => setActionMessage('')}
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Вкладка 1: Мій план та Адаптивний крок */}
      {activeTab === 'plan' && plan && (
        <div style={{ marginTop: '20px' }}>
          {/* Верхня панель статусу плану */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Поточна спеціалізація:</div>
              <div style={{ fontSize: '16px', color: '#f8fafc', fontWeight: 'bold', margin: '4px 0' }}>
                {plan.goalDetails?.title}
              </div>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                {plan.goalDetails?.description}
              </p>
            </div>

            <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '10px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Прогрес за планом:</span>
                <span style={{ fontSize: '14px', color: '#38bdf8', fontWeight: 'bold' }}>{plan.progressPercentage}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${plan.progressPercentage}%`, height: '100%', background: 'linear-gradient(90deg, #38bdf8, #10b981)' }} />
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                Завершено модулів: {plan.totalCompleted} з {plan.totalTrackItems} | Навантаження: {plan.targetWeeklyHours} год/тиждень
              </div>
            </div>

            <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Ревізія та статус:</div>
              <div style={{ fontSize: '16px', color: '#a855f7', fontWeight: 'bold', margin: '4px 0' }}>
                Версія плану v{plan.version}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Вибрано Electives: <strong>{plan.selectedElectives.length}</strong> | Знято обмежень: <strong>{plan.approvedExceptions.length}</strong>
              </div>
            </div>
          </div>

          {/* Рекомендований наступний крок (Adaptive Next Step) */}
          {nextStep && (
            <div
              style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid #0284c7',
                borderRadius: '10px',
                padding: '18px',
                marginBottom: '24px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                      background: nextStep.type === 'CORE' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                      color: nextStep.type === 'CORE' ? '#f87171' : '#34d399',
                    }}
                  >
                    {nextStep.type === 'CORE' ? 'ОБОВ’ЯЗКОВИЙ БАЗИС' : 'РЕКОМЕНДОВАНИЙ КРОК'}
                  </span>
                  <h3 style={{ fontSize: '16px', color: '#f8fafc', margin: 0, fontWeight: 'bold' }}>
                    {nextStep.title}
                  </h3>
                </div>
                <span style={{ fontSize: '12px', color: '#38bdf8' }}>
                  ⏱ Орієнтовно: ~{nextStep.estimatedHours} год
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0 }}>
                💡 <strong>Адаптивне обґрунтування:</strong> {nextStep.rationale}
              </p>
            </div>
          )}

          {/* Форма оновлення цілей */}
          <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '10px', padding: '20px' }}>
            <h3 style={{ fontSize: '16px', color: '#f8fafc', margin: '0 0 16px 0', fontWeight: 'bold' }}>
              ⚙️ Налаштувати цілі та інтенсивність плану
            </h3>
            <form onSubmit={handleUpdateGoals} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                  Бажана інженерна спеціалізація:
                </label>
                <select
                  value={selectedGoal}
                  onChange={(e) => setSelectedGoal(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: '#f8fafc',
                    fontSize: '13px',
                  }}
                >
                  {Object.values(availableGoals).map((g) => (
                    <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                  Цільове навантаження (годин на тиждень):
                </label>
                <input
                  type="number"
                  min={2}
                  max={40}
                  value={weeklyHours}
                  onChange={(e) => setWeeklyHours(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: '#f8fafc',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    fontSize: '13px',
                  }}
                >
                  {loading ? 'Збереження...' : 'Зберегти зміни та створити нову ревізію'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Вкладка 2: Каталог Electives */}
      {activeTab === 'electives' && (
        <div style={{ marginTop: '20px' }}>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '16px' }}>
            Оберіть додаткові курси для поглиблення експертизи. Курси з невиконаними передумовами потребують подання заявки на виняток.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {electivesCatalog.map((elec) => {
              const isSelected = plan?.selectedElectives?.includes(elec.id);
              const isWaived = plan?.approvedExceptions?.includes(elec.id);
              const missingPrereqs = elec.prerequisites.filter(p => !completedLessons.includes(p));
              const isLocked = missingPrereqs.length > 0 && !isWaived;

              return (
                <div
                  key={elec.id}
                  style={{
                    background: '#090d16',
                    border: isSelected ? '1px solid #10b981' : '1px solid #1e293b',
                    borderRadius: '10px',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                        {elec.category}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: 'bold',
                          background:
                            elec.difficulty === 'BEGINNER' ? 'rgba(16, 185, 129, 0.15)' :
                            elec.difficulty === 'INTERMEDIATE' ? 'rgba(245, 158, 11, 0.15)' :
                            'rgba(239, 68, 68, 0.15)',
                          color:
                            elec.difficulty === 'BEGINNER' ? '#34d399' :
                            elec.difficulty === 'INTERMEDIATE' ? '#f59e0b' :
                            '#f87171',
                        }}
                      >
                        {elec.difficulty}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '16px', color: '#f8fafc', margin: '0 0 6px 0', fontWeight: 'bold' }}>
                      {elec.title}
                    </h3>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 12px 0' }}>
                      {elec.description}
                    </p>

                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                      ⏱ Навантаження: {elec.workloadHours} год | Prerequisites: {elec.prerequisites.join(', ')}
                    </div>

                    {isLocked && (
                      <div style={{ fontSize: '11px', color: '#f87171', marginBottom: '10px' }}>
                        🔒 Не пройдено: {missingPrereqs.join(', ')}
                      </div>
                    )}
                    {isWaived && (
                      <div style={{ fontSize: '11px', color: '#34d399', marginBottom: '10px' }}>
                        ✅ Ментор погодив виняток для цього курсу
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleToggleElective(elec.id)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: isSelected ? 'rgba(239, 68, 68, 0.15)' : 'linear-gradient(135deg, #059669, #10b981)',
                      color: isSelected ? '#f87171' : '#ffffff',
                      border: isSelected ? '1px solid #ef4444' : 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '13px',
                    }}
                  >
                    {isSelected ? 'Видалити з плану' : isLocked ? 'Додати (потребує винятку)' : 'Додати до плану'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Вкладка 3: Запити на винятки та Менторський перегляд */}
      {activeTab === 'exceptions' && (
        <div style={{ marginTop: '20px' }}>
          {/* Форма подання запиту учнем */}
          <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '10px', padding: '20px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', color: '#f59e0b', margin: '0 0 12px 0', fontWeight: 'bold' }}>
              🔓 Подати запит на обхід обов&apos;язкових передумов (Prerequisite Waiver)
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px 0' }}>
              Якщо ви вже маєте релевантний досвід поза платформою, ви можете надати аргументацію менторам для дострокового відкриття вибіркового курсу.
            </p>

            <form onSubmit={handleRequestException}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                  Оберіть вибірковий курс:
                </label>
                <select
                  value={exceptionElectiveId}
                  onChange={(e) => setExceptionElectiveId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: '#f8fafc',
                    fontSize: '13px',
                  }}
                  required
                >
                  <option value="">-- Оберіть курс --</option>
                  {electivesCatalog.map((e) => (
                    <option key={e.id} value={e.id}>{e.title} (потрібно: {e.prerequisites.join(', ')})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                  Обґрунтування запиту (мінімум 15 символів):
                </label>
                <textarea
                  value={exceptionExplanation}
                  onChange={(e) => setExceptionExplanation(e.target.value)}
                  placeholder="Опишіть ваші попередні проекти, навички або аргументи на користь дострокового допуску..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: '#f8fafc',
                    fontSize: '13px',
                  }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || exceptionExplanation.trim().length < 15 || !exceptionElectiveId}
                style={{
                  padding: '10px 18px',
                  background: 'linear-gradient(135deg, #d97706, #b45309)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading || exceptionExplanation.trim().length < 15 || !exceptionElectiveId ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: '13px',
                }}
              >
                Надіслати запит менторам
              </button>
            </form>
          </div>

          {/* Список запитів на винятки */}
          <h3 style={{ fontSize: '16px', color: '#f8fafc', marginBottom: '12px' }}>
            Історія запитів на винятки ({plan?.exceptions?.length || 0})
          </h3>

          {plan?.exceptions?.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', background: '#090d16', borderRadius: '10px', border: '1px dashed #334155', color: '#94a3b8' }}>
              Запитів на винятки поки немає.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {plan?.exceptions?.map((exc) => (
                <div
                  key={exc.id}
                  style={{
                    background: '#090d16',
                    border: '1px solid #1e293b',
                    borderRadius: '10px',
                    padding: '16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                    <div>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: 'bold',
                          background:
                            exc.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.15)' :
                            exc.status === 'REJECTED' ? 'rgba(239, 68, 68, 0.15)' :
                            'rgba(245, 158, 11, 0.15)',
                          color:
                            exc.status === 'APPROVED' ? '#34d399' :
                            exc.status === 'REJECTED' ? '#f87171' :
                            '#f59e0b',
                        }}
                      >
                        {exc.status}
                      </span>
                      <strong style={{ color: '#f8fafc', marginLeft: '10px', fontSize: '15px' }}>
                        {exc.electiveTitle}
                      </strong>
                    </div>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      {new Date(exc.requestedAt).toLocaleString('uk-UA')}
                    </span>
                  </div>

                  <div style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '8px' }}>
                    <strong>Обґрунтування учня:</strong> {exc.explanation}
                  </div>

                  {exc.reviewerNotes && (
                    <div style={{ background: 'rgba(56, 189, 248, 0.08)', padding: '8px 12px', borderRadius: '4px', fontSize: '12px', color: '#93c5fd' }}>
                      <strong>Рецензія ({exc.reviewedBy}):</strong> {exc.reviewerNotes}
                    </div>
                  )}

                  {/* Кнопка для ментора/адміна */}
                  {isMentorOrAdmin && exc.status === 'PENDING' && (
                    <div style={{ marginTop: '10px' }}>
                      <button
                        onClick={() => {
                          setReviewingExceptionId(exc.id);
                          setReviewerNotesInput('');
                        }}
                        style={{
                          padding: '6px 12px',
                          background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 'bold',
                        }}
                      >
                        🎓 Розглянути заявку (Mentor Review)
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Модальне вікно рецензії ментора */}
          {reviewingExceptionId && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '20px',
              }}
            >
              <div
                style={{
                  background: '#0f172a',
                  border: '1px solid #38bdf8',
                  borderRadius: '12px',
                  padding: '24px',
                  maxWidth: '480px',
                  width: '100%',
                }}
              >
                <h3 style={{ fontSize: '18px', color: '#38bdf8', margin: '0 0 16px 0', fontFamily: 'Orbitron, sans-serif' }}>
                  Рецензія винятку передумов
                </h3>
                <form onSubmit={handleReviewException}>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                      Рішення ментора:
                    </label>
                    <select
                      value={reviewDecision}
                      onChange={(e) => setReviewDecision(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: '#090d16',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '13px',
                      }}
                    >
                      <option value="APPROVED">✅ СХВАЛИТИ (Допустити учня до курсу)</option>
                      <option value="REJECTED">❌ ВІДХИЛИТИ (Потрібно спочатку пройти базові уроки)</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                      Коментар рецензента для учня:
                    </label>
                    <textarea
                      value={reviewerNotesInput}
                      onChange={(e) => setReviewerNotesInput(e.target.value)}
                      placeholder="Вкажіть причину погодження або порадьте, що треба підтягнути..."
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: '#090d16',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '13px',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setReviewingExceptionId(null)}
                      style={{ padding: '10px 16px', background: '#1e293b', color: '#94a3b8', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                    >
                      Скасувати
                    </button>
                    <button
                      type="submit"
                      style={{
                        padding: '10px 16px',
                        background: reviewDecision === 'APPROVED' ? 'linear-gradient(135deg, #059669, #10b981)' : '#dc2626',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '13px',
                      }}
                    >
                      Підтвердити рішення
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Вкладка 4: Журнал версій та аудит */}
      {activeTab === 'audit' && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {plan?.auditTrail?.map((entry) => (
              <div
                key={entry.id}
                style={{
                  background: '#090d16',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  padding: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', fontWeight: 'bold' }}>
                      v{entry.version}
                    </span>
                    <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 'bold' }}>
                      {entry.changeType}
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      by {entry.changedBy}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                    {entry.details}
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {new Date(entry.timestamp).toLocaleString('uk-UA')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
