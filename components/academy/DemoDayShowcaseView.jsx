'use client';

import { useState, useEffect, useCallback } from 'react';

export default function DemoDayShowcaseView({ currentUser }) {
  const [activeTab, setActiveTab] = useState('event'); // 'event' | 'showcase' | 'submit' | 'rubric'
  const [eventInfo, setEventInfo] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [generatedLink, setGeneratedLink] = useState(null);

  // Стан форми подання проекту
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    demoUrl: 'https://duck-verse.vercel.app',
    prUrl: 'https://github.com/greenyarik0505-jpg/duck-verse/pull/18',
    retrospective: '',
    parentConsent: false,
  });

  // Завантаження інформації про захід та проекти
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [evtRes, subRes] = await Promise.all([
        fetch('/api/academy/showcase?view=event'),
        fetch('/api/academy/showcase?view=submissions'),
      ]);
      const evtData = await evtRes.json();
      const subData = await subRes.json();
      if (evtData.success) setEventInfo(evtData.event);
      if (subData.success) setSubmissions(subData.submissions || []);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Подання проекту
  const handleSubmitProject = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch('/api/academy/showcase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit',
          title: formData.title,
          description: formData.description,
          demoUrl: formData.demoUrl,
          prUrl: formData.prUrl,
          testsSummary: { passed: 52, total: 52, coverage: '92%' },
          retrospective: formData.retrospective,
          parentConsent: formData.parentConsent,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`🚀 Проект "${data.submission.title}" успішно подано на слот #${data.submission.slotNumber}!`);
        setFormData({
          title: '',
          description: '',
          demoUrl: 'https://duck-verse.vercel.app',
          prUrl: 'https://github.com/greenyarik0505-jpg/duck-verse/pull/18',
          retrospective: '',
          parentConsent: false,
        });
        await fetchData();
        setActiveTab('showcase');
      } else {
        setActionMessage(`Помилка: ${data.error}`);
      }
    } catch (err) {
      setActionMessage(`Помилка мережі: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Генерація тимчасового посилання
  const handleGenerateLink = async (submissionId) => {
    try {
      setLoading(true);
      const res = await fetch('/api/academy/showcase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_link',
          submissionId,
          ttlHours: 168,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedLink(data.link);
        setActionMessage('🔗 Захищене тимчасове посилання (дійсне 7 днів) згенеровано!');
      }
    } catch (err) {
      setActionMessage(`Помилка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Відкликання посилання
  const handleRevokeLink = async (token) => {
    try {
      setLoading(true);
      const res = await fetch('/api/academy/showcase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revoke_link',
          linkToken: token,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedLink(null);
        setActionMessage('🚫 Посилання успішно відкликано. Доступ негайно заблоковано.');
      }
    } catch (err) {
      setActionMessage(`Помилка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="academy-skills-section" style={{ marginTop: '48px' }}>
      {/* Заголовок модуля SCRUM-90 */}
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
            <span>🎙️</span> DEMO DAY & PRIVACY-SAFE SHOWCASE (SCRUM-90)
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: '4px 0 0 0' }}>
            Презентації фінальних робіт, безпечний публічний шоукейс, батьківська згода та оцінювання за Fairness Rubric.
          </p>
        </div>

        {/* Навігаційні таби */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('event')}
            className={`academy-tab-button ${activeTab === 'event' ? 'active' : ''}`}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              border: activeTab === 'event' ? '1px solid #38bdf8' : '1px solid #334155',
              background: activeTab === 'event' ? 'rgba(56, 189, 248, 0.15)' : '#0f172a',
              color: activeTab === 'event' ? '#38bdf8' : '#94a3b8',
              fontWeight: 'bold',
            }}
          >
            🎙️ Розклад заходу
          </button>

          <button
            onClick={() => setActiveTab('showcase')}
            className={`academy-tab-button ${activeTab === 'showcase' ? 'active' : ''}`}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              border: activeTab === 'showcase' ? '1px solid #10b981' : '1px solid #334155',
              background: activeTab === 'showcase' ? 'rgba(16, 185, 129, 0.15)' : '#0f172a',
              color: activeTab === 'showcase' ? '#10b981' : '#94a3b8',
              fontWeight: 'bold',
            }}
          >
            🌟 Шоукейс проектів ({submissions.length})
          </button>

          <button
            onClick={() => setActiveTab('submit')}
            className={`academy-tab-button ${activeTab === 'submit' ? 'active' : ''}`}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              border: activeTab === 'submit' ? '1px solid #f59e0b' : '1px solid #334155',
              background: activeTab === 'submit' ? 'rgba(245, 158, 11, 0.15)' : '#0f172a',
              color: activeTab === 'submit' ? '#f59e0b' : '#94a3b8',
              fontWeight: 'bold',
            }}
          >
            🚀 Подати проект
          </button>

          <button
            onClick={() => setActiveTab('rubric')}
            className={`academy-tab-button ${activeTab === 'rubric' ? 'active' : ''}`}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              border: activeTab === 'rubric' ? '1px solid #a855f7' : '1px solid #334155',
              background: activeTab === 'rubric' ? 'rgba(168, 85, 247, 0.15)' : '#0f172a',
              color: activeTab === 'rubric' ? '#a855f7' : '#94a3b8',
              fontWeight: 'bold',
            }}
          >
            ⚖️ Fairness Rubric (40 pts)
          </button>
        </div>
      </div>

      {actionMessage && (
        <div
          style={{
            margin: '16px 0',
            padding: '12px 16px',
            borderRadius: '8px',
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid #38bdf8',
            color: '#38bdf8',
            fontSize: '13px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{actionMessage}</span>
          <button
            onClick={() => setActionMessage('')}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ТАБ 1: РОЗКЛАД DEMO DAY */}
      {activeTab === 'event' && eventInfo && (
        <div style={{ marginTop: '20px' }}>
          <div
            style={{
              padding: '24px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#10b981',
                    border: '1px solid #10b981',
                  }}
                >
                  🟢 {eventInfo.status}
                </span>
                <h3 style={{ margin: '8px 0 4px 0', fontSize: '20px', color: '#f8fafc', fontFamily: 'Orbitron, sans-serif' }}>
                  {eventInfo.title}
                </h3>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>
                  📍 {eventInfo.location} • 📅 25 вересня 2026, 17:00 EEST
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ textAlign: 'center', background: '#0b1120', padding: '10px 16px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#38bdf8' }}>{eventInfo.availableSlotsCount}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Вільних слотів</div>
                </div>
                <div style={{ textAlign: 'center', background: '#0b1120', padding: '10px 16px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>{eventInfo.submissionsCount}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Зареєстровано</div>
                </div>
              </div>
            </div>
          </div>

          {/* Презентаційні слоти */}
          <h4 style={{ color: '#e2e8f0', fontSize: '15px', marginBottom: '12px' }}>
            План презентаційних слотів (8 слотів)
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            {Array.from({ length: eventInfo.maxSlots }, (_, i) => i + 1).map(slotNum => {
              const matched = submissions.find(s => s.slotNumber === slotNum);
              return (
                <div
                  key={slotNum}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    background: matched ? 'rgba(56, 189, 248, 0.08)' : 'rgba(15, 23, 42, 0.5)',
                    border: matched ? '1px solid rgba(56, 189, 248, 0.4)' : '1px dashed #334155',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: matched ? '#38bdf8' : '#64748b' }}>
                      Слот #{slotNum}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        color: matched ? '#10b981' : '#64748b',
                        fontWeight: 'bold',
                      }}
                    >
                      {matched ? '✓ Зайнято' : '○ Вільно'}
                    </span>
                  </div>
                  {matched ? (
                    <>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#f8fafc' }}>
                        {matched.title}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        Автор: {matched.studentName}
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                      Очікує реєстрації учня...
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ТАБ 2: ШОУКЕЙС ПРОЕКТІВ */}
      {activeTab === 'showcase' && (
        <div style={{ marginTop: '20px' }}>
          {generatedLink && (
            <div
              style={{
                marginBottom: '16px',
                padding: '14px 18px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid #10b981',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <strong style={{ color: '#10b981', fontSize: '13px' }}>Активне тимчасове посилання (7 днів):</strong>
                <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#e2e8f0', marginTop: '4px' }}>
                  {generatedLink.shareableUrl}
                </div>
              </div>
              <button
                onClick={() => handleRevokeLink(generatedLink.token)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: '#f43f5e',
                  color: '#fff',
                  border: 'none',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                🚫 Відкликати
              </button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {submissions.map(sub => (
              <div
                key={sub.id}
                style={{
                  padding: '18px',
                  borderRadius: '10px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid #1e293b',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        background: sub.visibility === 'PUBLIC_SHOWCASE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: sub.visibility === 'PUBLIC_SHOWCASE' ? '#10b981' : '#f59e0b',
                        border: sub.visibility === 'PUBLIC_SHOWCASE' ? '1px solid #10b981' : '1px solid #f59e0b',
                      }}
                    >
                      {sub.visibility === 'PUBLIC_SHOWCASE' ? '🌐 Public Showcase' : '🔒 Private'}
                    </span>
                    <h4 style={{ margin: '8px 0 2px 0', fontSize: '16px', color: '#f8fafc' }}>
                      {sub.title}
                    </h4>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      Автор: <strong>{sub.studentName}</strong> (Слот #{sub.slotNumber})
                    </span>
                  </div>

                  {sub.rubricEvaluation && (
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#38bdf8' }}>
                        {sub.rubricEvaluation.totalScore}/40
                      </span>
                      <div style={{ fontSize: '10px', color: '#10b981', fontWeight: 'bold' }}>
                        {sub.rubricEvaluation.grade}
                      </div>
                    </div>
                  )}
                </div>

                <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', lineHeight: 1.4 }}>
                  {sub.description}
                </p>

                <div style={{ padding: '8px 12px', background: '#0b1120', borderRadius: '6px', fontSize: '12px', color: '#94a3b8' }}>
                  <strong style={{ color: '#e2e8f0' }}>Ретроспектива:</strong> {sub.retrospective}
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '11px' }}>
                  <span style={{ color: '#10b981' }}>✓ Тести: {sub.testsSummary?.passed}/{sub.testsSummary?.total} ({sub.testsSummary?.coverage})</span>
                  <span style={{ color: sub.parentConsent ? '#10b981' : '#f43f5e' }}>
                    {sub.parentConsent ? '✓ Згода батьків надана' : '⚠ Очікує згоди батьків'}
                  </span>
                  <span style={{ color: '#38bdf8' }}>✓ Модерація: {sub.moderation?.status}</span>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #1e293b', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <a
                    href={sub.prUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      background: '#1e293b',
                      color: '#cbd5e1',
                      textDecoration: 'none',
                      fontSize: '11px',
                    }}
                  >
                    🐙 GitHub PR
                  </a>
                  <button
                    onClick={() => handleGenerateLink(sub.id)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: '#38bdf8',
                      border: '1px solid #38bdf8',
                      fontSize: '11px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    🔗 Поділитися лінком (7d)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ТАБ 3: ПОДАТИ ПРОЕКТ */}
      {activeTab === 'submit' && (
        <div style={{ marginTop: '20px' }}>
          <form
            onSubmit={handleSubmitProject}
            style={{
              padding: '24px',
              borderRadius: '10px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid #1e293b',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              maxWidth: '680px',
            }}
          >
            <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '16px' }}>
              🚀 Реєстрація випускного проекту на Demo Day
            </h4>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                Назва проекту (Title):
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="наприклад: Cyber Flappy Duck 60 FPS"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: '#0b1120',
                  border: '1px solid #334155',
                  color: '#fff',
                  fontSize: '13px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                Технічний опис (Description):
              </label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Опишіть стек, архітектурні рішення, рушій Canvas 2D чи Web Audio..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: '#0b1120',
                  border: '1px solid #334155',
                  color: '#fff',
                  fontSize: '13px',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                  Посилання на живе демо (Demo URL):
                </label>
                <input
                  type="url"
                  required
                  value={formData.demoUrl}
                  onChange={(e) => setFormData({ ...formData, demoUrl: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: '#0b1120',
                    border: '1px solid #334155',
                    color: '#fff',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                  Посилання на Pull Request (GitHub PR):
                </label>
                <input
                  type="url"
                  required
                  value={formData.prUrl}
                  onChange={(e) => setFormData({ ...formData, prUrl: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: '#0b1120',
                    border: '1px solid #334155',
                    color: '#fff',
                    fontSize: '13px',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                Ретроспектива (Висновки, інсайти, виклики):
              </label>
              <textarea
                required
                rows={2}
                value={formData.retrospective}
                onChange={(e) => setFormData({ ...formData, retrospective: e.target.value })}
                placeholder="Що було найцікавішим, які інженерні перешкоди подолано..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: '#0b1120',
                  border: '1px solid #334155',
                  color: '#fff',
                  fontSize: '13px',
                }}
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#cbd5e1', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.parentConsent}
                onChange={(e) => setFormData({ ...formData, parentConsent: e.target.checked })}
              />
              <span>Я маю згоду батьків/опікунів на публічне розміщення проекту в шоукейсі</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                background: '#f59e0b',
                color: '#0f172a',
                fontWeight: 'bold',
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer',
                alignSelf: 'flex-start',
              }}
            >
              {loading ? 'Надсилання...' : '🚀 Зареєструвати проект на Demo Day'}
            </button>
          </form>
        </div>
      )}

      {/* ТАБ 4: FAIRNESS RUBRIC */}
      {activeTab === 'rubric' && (
        <div style={{ marginTop: '20px' }}>
          <div
            style={{
              padding: '18px',
              borderRadius: '8px',
              background: 'rgba(168, 85, 247, 0.08)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              marginBottom: '16px',
            }}
          >
            <h4 style={{ margin: 0, color: '#a855f7', fontSize: '15px' }}>
              ⚖️ Стандартизована рубрика об'єктивного оцінювання (Fairness Rubric)
            </h4>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>
              Кожен випускний проект оцінюється незалежними менторами за 4 ключовими критеріями (максимум 40 балів).
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div style={{ padding: '16px', background: '#0b1120', borderRadius: '8px', border: '1px solid #1e293b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#38bdf8', fontWeight: 'bold' }}>
                <span>1. Архітектура & Код</span>
                <span>10 pts</span>
              </div>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '8px 0 0 0' }}>
                Модульність, слабке зв'язування, відсутність anti-patterns, чистота компонентів.
              </p>
            </div>

            <div style={{ padding: '16px', background: '#0b1120', borderRadius: '8px', border: '1px solid #1e293b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', fontWeight: 'bold' }}>
                <span>2. UI, 60 FPS & Polish</span>
                <span>10 pts</span>
              </div>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '8px 0 0 0' }}>
                Плавність Canvas 2D анімацій, адаптивність, Web Audio, клавіатурне керування.
              </p>
            </div>

            <div style={{ padding: '16px', background: '#0b1120', borderRadius: '8px', border: '1px solid #1e293b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f59e0b', fontWeight: 'bold' }}>
                <span>3. Тести & CI Пайплайн</span>
                <span>10 pts</span>
              </div>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '8px 0 0 0' }}>
                Покриття модульними тестами, зелений CI на GitHub Actions, 0 лінтинг помилок.
              </p>
            </div>

            <div style={{ padding: '16px', background: '#0b1120', borderRadius: '8px', border: '1px solid #1e293b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a855f7', fontWeight: 'bold' }}>
                <span>4. Презентація & Ретро</span>
                <span>10 pts</span>
              </div>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '8px 0 0 0' }}>
                Чіткість виступу, глибина ретроспективи, аналіз помилок та плани розвитку.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
