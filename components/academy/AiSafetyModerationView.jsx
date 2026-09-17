'use client';

import { useState, useEffect, useCallback } from 'react';

export default function AiSafetyModerationView({ currentUser }) {
  const [activeTab, setActiveTab] = useState('report'); // 'report' | 'queue' | 'my_reports' | 'metrics'
  const [queue, setQueue] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [categories, setCategories] = useState({});
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  // Форма створення скарги
  const [reportCategory, setReportCategory] = useState('UNSAFE_HARMFUL');
  const [reportPrompt, setReportPrompt] = useState('');
  const [reportResponse, setReportResponse] = useState('');
  const [reportComment, setReportComment] = useState('');
  const [blockLocally, setBlockLocally] = useState(true);

  // Перегляд Evidence Snapshot
  const [viewingEvidenceTicket, setViewingEvidenceTicket] = useState(null);

  // Модалка модератора
  const [reviewingTicketId, setReviewingTicketId] = useState(null);
  const [selectedDecision, setSelectedDecision] = useState('WARN_STUDENT');
  const [reviewerNotesInput, setReviewerNotesInput] = useState('');

  // Модалка апеляції
  const [appealingTicketId, setAppealingTicketId] = useState(null);
  const [appealReasonInput, setAppealReasonInput] = useState('');

  const isMentorOrAdmin =
    currentUser?.role === 'mentor' ||
    currentUser?.role === 'admin' ||
    currentUser?.role === 'team_lead';

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/academy/safety');
      const data = await res.json();
      if (data.success) {
        setQueue(data.queue || []);
        setMetrics(data.metrics || null);
        setCategories(data.categories || {});
        setActions(data.actions || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Подання скарги
  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportPrompt.trim() || !reportResponse.trim()) {
      setActionMessage('Введіть текст промпту та відповіді ШІ для формування доказів.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/academy/safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'report',
          category: reportCategory,
          promptText: reportPrompt.trim(),
          responseText: reportResponse.trim(),
          userComment: reportComment.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        const isEscalated = data.ticket.status === 'ESCALATED_TO_ADMIN';
        setActionMessage(
          isEscalated
            ? '🚨 КРИТИЧНИЙ ІНЦИДЕНТ: Скаргу негайно ескаловано команді безпеки (ESCALATED_TO_ADMIN)!'
            : '✅ Скаргу успішно зареєстровано та передано в чергу модерації.'
        );
        setReportPrompt('');
        setReportResponse('');
        setReportComment('');
        await fetchData();
        setActiveTab('my_reports');
      } else {
        setActionMessage(`❌ Помилка: ${data.error}`);
      }
    } catch (err) {
      setActionMessage(`❌ Помилка мережі: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Модераторське рішення
  const handleReviewTicket = async (e) => {
    e.preventDefault();
    if (!reviewingTicketId) return;

    try {
      setLoading(true);
      const res = await fetch('/api/academy/safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'review',
          ticketId: reviewingTicketId,
          decision: selectedDecision,
          reviewerNotes: reviewerNotesInput,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`🎓 Рішення модератора зафіксовано: ${selectedDecision}. Кейс додано у feedback loop.`);
        setReviewingTicketId(null);
        setReviewerNotesInput('');
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

  // Подання апеляції
  const handleAppealTicket = async (e) => {
    e.preventDefault();
    if (!appealingTicketId || appealReasonInput.trim().length < 15) {
      setActionMessage('Обґрунтування апеляції повинно містити щонайменше 15 символів.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/academy/safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'appeal',
          ticketId: appealingTicketId,
          appealReason: appealReasonInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage('📩 Апеляцію успішно надіслано на повторний розгляд адміністрації!');
        setAppealingTicketId(null);
        setAppealReasonInput('');
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

  const getSeverityBadgeStyle = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return { background: 'rgba(239, 68, 68, 0.25)', color: '#f87171', border: '1px solid #ef4444' };
      case 'HIGH':
        return { background: 'rgba(249, 115, 22, 0.2)', color: '#fb923c', border: '1px solid #f97316' };
      case 'MEDIUM':
        return { background: 'rgba(234, 179, 8, 0.2)', color: '#facc15', border: '1px solid #eab308' };
      default:
        return { background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', border: '1px solid #0284c7' };
    }
  };

  return (
    <section className="academy-skills-section" style={{ marginTop: '48px' }}>
      {/* Заголовок SCRUM-103 */}
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
            <span>🛡️</span> AI SAFETY, REPORT & MODERATION WORKFLOW (SCRUM-103)
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: '4px 0 0 0' }}>
            Комплексна безпека штучного інтелекту: миттєвий Report & Block, черга модерації (Triage Queue), незмінний Evidence Snapshot, апеляції та AI Feedback Loop.
          </p>
        </div>

        {/* Навігаційні таби */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('report')}
            className={`academy-tab-button ${activeTab === 'report' ? 'active' : ''}`}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              border: activeTab === 'report' ? '1px solid #ef4444' : '1px solid #334155',
              background: activeTab === 'report' ? 'rgba(239, 68, 68, 0.15)' : '#0f172a',
              color: activeTab === 'report' ? '#f87171' : '#94a3b8',
              fontWeight: 'bold',
            }}
          >
            🚨 Подати скаргу (Report)
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`academy-tab-button ${activeTab === 'queue' ? 'active' : ''}`}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              border: activeTab === 'queue' ? '1px solid #f59e0b' : '1px solid #334155',
              background: activeTab === 'queue' ? 'rgba(245, 158, 11, 0.15)' : '#0f172a',
              color: activeTab === 'queue' ? '#f59e0b' : '#94a3b8',
              fontWeight: 'bold',
            }}
          >
            📥 Черга модерації ({queue.length}) {isMentorOrAdmin ? '👑' : ''}
          </button>

          <button
            onClick={() => setActiveTab('my_reports')}
            className={`academy-tab-button ${activeTab === 'my_reports' ? 'active' : ''}`}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              border: activeTab === 'my_reports' ? '1px solid #10b981' : '1px solid #334155',
              background: activeTab === 'my_reports' ? 'rgba(16, 185, 129, 0.15)' : '#0f172a',
              color: activeTab === 'my_reports' ? '#10b981' : '#94a3b8',
              fontWeight: 'bold',
            }}
          >
            ⚖️ Мої скарги та Апеляції
          </button>

          <button
            onClick={() => setActiveTab('metrics')}
            className={`academy-tab-button ${activeTab === 'metrics' ? 'active' : ''}`}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              border: activeTab === 'metrics' ? '1px solid #a855f7' : '1px solid #334155',
              background: activeTab === 'metrics' ? 'rgba(168, 85, 247, 0.15)' : '#0f172a',
              color: activeTab === 'metrics' ? '#a855f7' : '#94a3b8',
              fontWeight: 'bold',
            }}
          >
            📊 Метрики & Feedback Loop
          </button>
        </div>
      </div>

      {actionMessage && (
        <div
          style={{
            margin: '16px 0',
            padding: '12px 16px',
            borderRadius: '8px',
            background: actionMessage.includes('❌') || actionMessage.includes('🚨') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.15)',
            border: actionMessage.includes('❌') || actionMessage.includes('🚨') ? '1px solid #ef4444' : '1px solid #38bdf8',
            color: actionMessage.includes('❌') || actionMessage.includes('🚨') ? '#fca5a5' : '#7dd3fc',
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

      {/* Вкладка 1: Форма Report & Block */}
      {activeTab === 'report' && (
        <div style={{ marginTop: '20px', background: '#090d16', border: '1px solid #1e293b', borderRadius: '10px', padding: '24px' }}>
          <h3 style={{ fontSize: '17px', color: '#f87171', margin: '0 0 8px 0', fontWeight: 'bold' }}>
            🚨 Повідомити про небезпечну або токсичну відповідь ШІ
          </h3>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 20px 0' }}>
            Усі звернення створюють зашифрований Evidence Snapshot. Приватні промпти захищені від інших дітей та доступні виключно уповноваженим модераторам.
          </p>

          <form onSubmit={handleSubmitReport}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                Категорія порушення:
              </label>
              <select
                value={reportCategory}
                onChange={(e) => setReportCategory(e.target.value)}
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
                {Object.values(categories).map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.defaultSeverity}] {c.label}
                  </option>
                ))}
              </select>
              {categories[reportCategory] && (
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                  ℹ️ {categories[reportCategory].description}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                  Вхідний промпт учня:
                </label>
                <textarea
                  value={reportPrompt}
                  onChange={(e) => setReportPrompt(e.target.value)}
                  placeholder="Вставте промпт, який спричинив підозрілу поведінку..."
                  rows={4}
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

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                  Згенерована відповідь ШІ:
                </label>
                <textarea
                  value={reportResponse}
                  onChange={(e) => setReportResponse(e.target.value)}
                  placeholder="Вставте згенерований код або текстову відповідь моделі..."
                  rows={4}
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
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                Коментар чи пояснення проблеми (необов&apos;язково):
              </label>
              <input
                type="text"
                value={reportComment}
                onChange={(e) => setReportComment(e.target.value)}
                placeholder="Що саме пішло не так або чому цей контент вважається небезпечним..."
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <input
                type="checkbox"
                id="blockLocally"
                checked={blockLocally}
                onChange={(e) => setBlockLocally(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="blockLocally" style={{ fontSize: '13px', color: '#cbd5e1', cursor: 'pointer' }}>
                🚫 Миттєво приховати та заблокувати цю відповідь у моєму інтерфейсі Prompt Lab
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !reportPrompt.trim() || !reportResponse.trim()}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '13px',
              }}
            >
              {loading ? 'Надсилання...' : 'Зафіксувати скаргу та надіслати до черги'}
            </button>
          </form>
        </div>
      )}

      {/* Вкладка 2: Черга модерації (Triage Queue) */}
      {activeTab === 'queue' && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ color: '#94a3b8', fontSize: '13px' }}>
              Черга інцидентів модерації з автоматичною пріоритизацією за рівнем небезпеки.
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
                CRITICAL (365d retention)
              </span>
              <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(249, 115, 22, 0.2)', color: '#fb923c' }}>
                HIGH (90d retention)
              </span>
              <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
                LOW/MED (30d retention)
              </span>
            </div>
          </div>

          {queue.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', background: '#090d16', borderRadius: '10px', border: '1px dashed #334155', color: '#94a3b8' }}>
              Черга модерації порожня. Інцидентів безпеки не зафіксовано.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {queue.map((t) => (
                <div
                  key={t.id}
                  style={{
                    background: '#090d16',
                    border: '1px solid #1e293b',
                    borderRadius: '10px',
                    padding: '18px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold', ...getSeverityBadgeStyle(t.severity) }}>
                        {t.severity}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontWeight: 'bold',
                          background:
                            t.status === 'ESCALATED_TO_ADMIN' ? 'rgba(239, 68, 68, 0.25)' :
                            t.status === 'REVIEWED' ? 'rgba(16, 185, 129, 0.2)' :
                            'rgba(245, 158, 11, 0.2)',
                          color:
                            t.status === 'ESCALATED_TO_ADMIN' ? '#f87171' :
                            t.status === 'REVIEWED' ? '#34d399' :
                            '#f59e0b',
                        }}
                      >
                        {t.status}
                      </span>
                      <strong style={{ color: '#f8fafc', fontSize: '14px' }}>
                        {t.categoryLabel}
                      </strong>
                    </div>

                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      ID: {t.id} | {new Date(t.createdAt).toLocaleString('uk-UA')}
                    </div>
                  </div>

                  <div style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '10px' }}>
                    Автор скарги: <strong>{t.reporterUsername}</strong> | Зберігання: {t.retentionDays} днів (до {new Date(t.expiresAt).toLocaleDateString('uk-UA')})
                  </div>

                  {t.userComment && (
                    <div style={{ background: '#0f172a', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', color: '#94a3b8', marginBottom: '10px' }}>
                      💬 <strong>Коментар:</strong> {t.userComment}
                    </div>
                  )}

                  {t.reviewerNotes && (
                    <div style={{ background: 'rgba(56, 189, 248, 0.08)', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', color: '#93c5fd', marginBottom: '10px' }}>
                      🎓 <strong>Рішення модератора ({t.reviewedBy}):</strong> {t.decision} — {t.reviewerNotes}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                    <button
                      onClick={() => setViewingEvidenceTicket(t)}
                      style={{
                        padding: '6px 12px',
                        background: '#1e293b',
                        color: '#38bdf8',
                        border: '1px solid #38bdf8',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    >
                      🔍 Переглянути Evidence Snapshot
                    </button>

                    {isMentorOrAdmin && t.status !== 'REVIEWED' && (
                      <button
                        onClick={() => {
                          setReviewingTicketId(t.id);
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
                        🎓 Ухвалити рішення (Moderate)
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Модалка Evidence Snapshot */}
          {viewingEvidenceTicket && (
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
                  maxWidth: '650px',
                  width: '100%',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '18px', color: '#38bdf8', margin: 0, fontFamily: 'Orbitron, sans-serif' }}>
                    Незмінний Evidence Snapshot
                  </h3>
                  <button
                    onClick={() => setViewingEvidenceTicket(null)}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                  SHA-256 Hash: <code>{viewingEvidenceTicket.evidenceSnapshot.hash}</code> | Модель: <code>{viewingEvidenceTicket.evidenceSnapshot.modelId}</code>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold', marginBottom: '4px' }}>
                    ПРОМПТ УЧНЯ:
                  </div>
                  <pre style={{ background: '#090d16', padding: '10px', borderRadius: '6px', color: '#e2e8f0', fontSize: '12px', whiteSpace: 'pre-wrap', maxHeight: '140px', overflowY: 'auto' }}>
                    {viewingEvidenceTicket.evidenceSnapshot.promptText}
                  </pre>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold', marginBottom: '4px' }}>
                    ЗГЕНЕРОВАНА ВІДПОВІДЬ:
                  </div>
                  <pre style={{ background: '#090d16', padding: '10px', borderRadius: '6px', color: '#fca5a5', fontSize: '12px', whiteSpace: 'pre-wrap', maxHeight: '180px', overflowY: 'auto' }}>
                    {viewingEvidenceTicket.evidenceSnapshot.responseText}
                  </pre>
                </div>

                <button
                  onClick={() => setViewingEvidenceTicket(null)}
                  style={{ width: '100%', padding: '10px', background: '#1e293b', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                >
                  Закрити знімок
                </button>
              </div>
            </div>
          )}

          {/* Модалка рішення модератора */}
          {reviewingTicketId && (
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
                  border: '1px solid #10b981',
                  borderRadius: '12px',
                  padding: '24px',
                  maxWidth: '480px',
                  width: '100%',
                }}
              >
                <h3 style={{ fontSize: '18px', color: '#34d399', margin: '0 0 16px 0', fontFamily: 'Orbitron, sans-serif' }}>
                  Ухвалення модераторського рішення
                </h3>

                <form onSubmit={handleReviewTicket}>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                      Оберіть дію модерації:
                    </label>
                    <select
                      value={selectedDecision}
                      onChange={(e) => setSelectedDecision(e.target.value)}
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
                      {actions.map((act) => (
                        <option key={act} value={act}>{act}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                      Примітка модератора:
                    </label>
                    <textarea
                      value={reviewerNotesInput}
                      onChange={(e) => setReviewerNotesInput(e.target.value)}
                      placeholder="Опишіть вжиті заходи або причину відхилення скарги..."
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
                      onClick={() => setReviewingTicketId(null)}
                      style={{ padding: '10px 16px', background: '#1e293b', color: '#94a3b8', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                    >
                      Скасувати
                    </button>
                    <button
                      type="submit"
                      style={{
                        padding: '10px 16px',
                        background: 'linear-gradient(135deg, #059669, #10b981)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '13px',
                      }}
                    >
                      Застосувати санкцію
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Вкладка 3: Мої скарги та апеляції */}
      {activeTab === 'my_reports' && (
        <div style={{ marginTop: '20px' }}>
          {queue.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', background: '#090d16', borderRadius: '10px', border: '1px dashed #334155', color: '#94a3b8' }}>
              Ви ще не подавали скарг на AI-відповіді.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {queue.map((t) => (
                <div
                  key={t.id}
                  style={{
                    background: '#090d16',
                    border: '1px solid #1e293b',
                    borderRadius: '10px',
                    padding: '18px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                    <div>
                      <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold', ...getSeverityBadgeStyle(t.severity) }}>
                        {t.severity}
                      </span>
                      <strong style={{ color: '#f8fafc', marginLeft: '10px', fontSize: '15px' }}>
                        {t.categoryLabel}
                      </strong>
                    </div>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      {new Date(t.createdAt).toLocaleString('uk-UA')}
                    </span>
                  </div>

                  <div style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '8px' }}>
                    Статус розгляду: <strong style={{ color: '#38bdf8' }}>{t.status}</strong>
                  </div>

                  {t.reviewerNotes && (
                    <div style={{ background: 'rgba(56, 189, 248, 0.08)', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', color: '#93c5fd', marginBottom: '10px' }}>
                      🎓 <strong>Рішення модератора ({t.reviewedBy}):</strong> {t.decision} — {t.reviewerNotes}
                    </div>
                  )}

                  {t.appeal && (
                    <div style={{ background: 'rgba(245, 158, 11, 0.08)', borderLeft: '3px solid #f59e0b', padding: '8px 12px', borderRadius: '4px', fontSize: '12px', color: '#fde68a', marginBottom: '10px' }}>
                      ⚖️ <strong>Подано апеляцію:</strong> {t.appeal.reason} ({t.appeal.appealStatus})
                    </div>
                  )}

                  {t.status === 'REVIEWED' && !t.appeal && (
                    <button
                      onClick={() => setAppealingTicketId(t.id)}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(245, 158, 11, 0.15)',
                        color: '#f59e0b',
                        border: '1px solid #f59e0b',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    >
                      ⚖️ Оскаржити рішення (Подати апеляцію)
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Модалка подання апеляції */}
          {appealingTicketId && (
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
                  border: '1px solid #f59e0b',
                  borderRadius: '12px',
                  padding: '24px',
                  maxWidth: '480px',
                  width: '100%',
                }}
              >
                <h3 style={{ fontSize: '18px', color: '#f59e0b', margin: '0 0 16px 0', fontFamily: 'Orbitron, sans-serif' }}>
                  Подання апеляції на модерацію
                </h3>
                <form onSubmit={handleAppealTicket}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>
                      Обґрунтування апеляції (від 15 символів):
                    </label>
                    <textarea
                      value={appealReasonInput}
                      onChange={(e) => setAppealReasonInput(e.target.value)}
                      placeholder="Поясніть, чому рішення модератора є помилковим..."
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: '#090d16',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '13px',
                      }}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setAppealingTicketId(null)}
                      style={{ padding: '10px 16px', background: '#1e293b', color: '#94a3b8', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                    >
                      Скасувати
                    </button>
                    <button
                      type="submit"
                      disabled={appealReasonInput.trim().length < 15}
                      style={{
                        padding: '10px 16px',
                        background: appealReasonInput.trim().length < 15 ? '#334155' : 'linear-gradient(135deg, #d97706, #b45309)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: appealReasonInput.trim().length < 15 ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        fontSize: '13px',
                      }}
                    >
                      Надіслати апеляцію
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Вкладка 4: Метрики та Feedback Loop */}
      {activeTab === 'metrics' && metrics && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Всього інцидентів:</div>
              <div style={{ fontSize: '24px', color: '#f8fafc', fontWeight: 'bold' }}>{metrics.totalReports}</div>
            </div>

            <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Очікують розгляду:</div>
              <div style={{ fontSize: '24px', color: '#f59e0b', fontWeight: 'bold' }}>{metrics.pendingReports}</div>
            </div>

            <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Критичні (PII / Harm):</div>
              <div style={{ fontSize: '24px', color: '#f87171', fontWeight: 'bold' }}>{metrics.criticalEscalated}</div>
            </div>

            <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Benchmark Cases:</div>
              <div style={{ fontSize: '24px', color: '#10b981', fontWeight: 'bold' }}>{metrics.benchmarkCasesCount}</div>
            </div>
          </div>

          <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '10px', padding: '20px' }}>
            <h3 style={{ fontSize: '16px', color: '#38bdf8', margin: '0 0 12px 0' }}>
              🔄 AI Feedback-to-Evaluation Loop
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px 0' }}>
              Усі підтверджені порушення автоматично конвертуються у знеособлені тест-кейси регресійного тестування системних промптів Duck Academy.
            </p>

            {metrics.benchmarkCases?.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#64748b' }}>Бенчмарк-кейсів поки не сформовано.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {metrics.benchmarkCases.map((bc) => (
                  <div key={bc.id} style={{ background: '#0f172a', padding: '10px 14px', borderRadius: '6px', fontSize: '12px', color: '#cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>[{bc.category}] <code>{bc.sanitizedPattern}</code></span>
                    <span style={{ color: '#34d399', fontWeight: 'bold' }}>Action: {bc.actionTriggered}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
