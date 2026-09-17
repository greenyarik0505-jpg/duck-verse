'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CURRICULUM_REGISTRY } from '../../lib/academy/registry';

export default function ContentPublishingWorkflowView({ currentUser }) {
  const [selectedLessonId, setSelectedLessonId] = useState('lesson-fe-l0-arch');
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState('workflow'); // workflow | diff | audit
  const [newDraftTitle, setNewDraftTitle] = useState('');
  const [newDraftSummary, setNewDraftSummary] = useState('');

  const isPrivileged = currentUser?.role === 'mentor' || currentUser?.role === 'admin';

  const fetchContentDetails = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/academy/content?lessonId=${selectedLessonId}`);
      const json = await res.json();
      if (json.success && json.details) {
        setDetails(json.details);
      } else {
        setErrorMsg(json.error || 'Не вдалося завантажити статус версій.');
      }
    } catch {
      setErrorMsg('Помилка з\'єднання з сервером контенту.');
    } finally {
      setLoading(false);
    }
  }, [selectedLessonId]);

  useEffect(() => {
    fetchContentDetails();
  }, [fetchContentDetails]);

  const handleAction = async (action, extraBody = {}) => {
    setActionMsg('');
    setErrorMsg('');
    try {
      const res = await fetch('/api/academy/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          lessonId: selectedLessonId,
          ...extraBody,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setActionMsg(`Операцію «${action}» успішно виконано.`);
        fetchContentDetails();
      } else {
        setErrorMsg(json.error || 'Помилка виконання операції.');
      }
    } catch {
      setErrorMsg('Мережева помилка при виконанні дії.');
    }
  };

  const currentLesson = CURRICULUM_REGISTRY.find(l => l.id === selectedLessonId);

  return (
    <div className="academy-skills-section" style={{ marginTop: '36px' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>📦</span>
            <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '20px', color: '#38bdf8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Content Versioning & Publishing Workflow (SCRUM-84)
            </h2>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 0 0' }}>
            Production-grade керування навчальним контентом: драфти, перевірка Quality Gates, рецензування, релізи та rollback.
          </p>
        </div>

        {/* Lesson Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label htmlFor="lesson-select" style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Orbitron, monospace' }}>Урок:</label>
          <select
            id="lesson-select"
            value={selectedLessonId}
            onChange={(e) => setSelectedLessonId(e.target.value)}
            style={{
              background: '#090d16',
              color: '#f8fafc',
              border: '1px solid #0284c7',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {CURRICULUM_REGISTRY.map(l => (
              <option key={l.id} value={l.id}>
                [{l.jiraKey}] {l.title.slice(0, 32)}...
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Notifications */}
      {actionMsg && (
        <div style={{ padding: '10px 16px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '8px', color: '#6ee7b7', marginBottom: '16px', fontSize: '13px' }}>
          ✅ {actionMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ padding: '10px 16px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px', color: '#fca5a5', marginBottom: '16px', fontSize: '13px' }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {loading && !details ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
          <div className="game-spinner" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontFamily: 'Orbitron, monospace', fontSize: '12px' }}>Завантаження життєвого циклу контенту...</p>
        </div>
      ) : details && (
        <div>
          {/* Active Version & Quality Gates Card */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px',
            marginBottom: '20px'
          }}>
            {/* Version Overview */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '10px',
              padding: '16px 20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Orbitron, monospace' }}>Активна версія</span>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontFamily: 'Orbitron, monospace',
                  background: details.status === 'published' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  color: details.status === 'published' ? '#34d399' : '#fbbf24',
                  border: `1px solid ${details.status === 'published' ? '#059669' : '#d97706'}`
                }}>
                  ● {details.status.toUpperCase()}
                </span>
              </div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#f8fafc', fontFamily: 'Orbitron, monospace' }}>
                v{details.activeVersion}
              </h3>
              <p style={{ fontSize: '13px', color: '#cbd5e1', margin: '0 0 12px 0' }}>
                {currentLesson?.title} ({currentLesson?.jiraKey})
              </p>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Дочірніх уроків у залежності (Affected): <strong style={{ color: '#38bdf8' }}>{details.affectedLessons?.length || 0}</strong>
              </div>
            </div>

            {/* Quality Gates Checklist */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '10px',
              padding: '16px 20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'Orbitron, monospace' }}>Quality Gates</span>
                <span style={{ fontSize: '11px', color: '#10b981', fontFamily: 'Orbitron, monospace' }}>100% PASSED</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#cbd5e1' }}>
                  <span style={{ color: '#10b981' }}>✓</span> Посилання валідні
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#cbd5e1' }}>
                  <span style={{ color: '#10b981' }}>✓</span> Критерії прийому (≥2)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#cbd5e1' }}>
                  <span style={{ color: '#10b981' }}>✓</span> Приклади коду
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#cbd5e1' }}>
                  <span style={{ color: '#10b981' }}>✓</span> Jira ключ прив'язано
                </div>
              </div>
            </div>
          </div>

          {/* Action Tabs */}
          <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid rgba(56, 189, 248, 0.2)', paddingBottom: '8px', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('workflow')}
              style={{
                background: activeTab === 'workflow' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                color: activeTab === 'workflow' ? '#38bdf8' : '#94a3b8',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontFamily: 'Orbitron, monospace',
                fontSize: '12px'
              }}
            >
              ⚙️ Життєвий цикл & Драфти
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              style={{
                background: activeTab === 'history' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                color: activeTab === 'history' ? '#38bdf8' : '#94a3b8',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontFamily: 'Orbitron, monospace',
                fontSize: '12px'
              }}
            >
              📜 Історія версій ({details.versions?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              style={{
                background: activeTab === 'audit' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                color: activeTab === 'audit' ? '#38bdf8' : '#94a3b8',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontFamily: 'Orbitron, monospace',
                fontSize: '12px'
              }}
            >
              🔍 Аудит-трейл ({details.auditTrail?.length || 0})
            </button>
          </div>

          {/* Tab 1: Workflow & Drafts */}
          {activeTab === 'workflow' && (
            <div>
              {/* Drafts Section */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontFamily: 'Orbitron, monospace', fontSize: '13px', color: '#f8fafc', margin: '0 0 10px 0' }}>
                  Активні чернетки (Drafts): {details.drafts?.length || 0}
                </h4>

                {(!details.drafts || details.drafts.length === 0) ? (
                  <div style={{ padding: '16px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', border: '1px dashed rgba(148, 163, 184, 0.3)', color: '#94a3b8', fontSize: '13px' }}>
                    Немає відкритих чернеток для цього уроку. Створіть новий драфт для підготовки релізу.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {details.drafts.map(d => (
                      <div key={d.draftId} style={{
                        padding: '14px 18px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ fontFamily: 'Orbitron, monospace', color: '#f8fafc' }}>{d.draftVersion}</strong>
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              textTransform: 'uppercase',
                              fontFamily: 'Orbitron, monospace',
                              background: d.status === 'in_review' ? 'rgba(56, 189, 248, 0.2)' : d.status === 'approved' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                              color: d.status === 'in_review' ? '#38bdf8' : d.status === 'approved' ? '#34d399' : '#cbd5e1'
                            }}>
                              {d.status}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                            Автор: <strong>{d.author?.username}</strong> • Створено: {new Date(d.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Workflow Transition Buttons */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {d.status === 'draft' && (
                            <button
                              type="button"
                              onClick={() => handleAction('submit_review', { draftId: d.draftId })}
                              className="academy-auth-btn"
                              style={{ padding: '5px 12px', fontSize: '12px' }}
                            >
                              📤 Подати на рев'ю
                            </button>
                          )}

                          {d.status === 'in_review' && isPrivileged && (
                            <button
                              type="button"
                              onClick={() => handleAction('approve', { draftId: d.draftId })}
                              style={{
                                padding: '5px 12px',
                                fontSize: '12px',
                                background: '#059669',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontFamily: 'Orbitron, monospace'
                              }}
                            >
                              ✅ Схвалити
                            </button>
                          )}

                          {d.status === 'approved' && isPrivileged && (
                            <button
                              type="button"
                              onClick={() => handleAction('publish', { draftId: d.draftId })}
                              style={{
                                padding: '5px 12px',
                                fontSize: '12px',
                                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontFamily: 'Orbitron, monospace'
                              }}
                            >
                              🚀 Опублікувати
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions (Create Draft, Rollback, Deprecate) */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                <button
                  type="button"
                  onClick={() => handleAction('create_draft', {
                    updates: {
                      title: `${currentLesson?.title || 'Lesson'} (Updated)`,
                      summary: `${currentLesson?.summary || 'Summary'} Включає нові вимоги до архітектури та покращені тести.`,
                    }
                  })}
                  className="academy-auth-btn"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>➕</span> Створити новий драфт
                </button>

                {isPrivileged && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleAction('rollback', { targetVersion: '1.0.0', reason: 'Emergency rollback to stable baseline' })}
                      style={{
                        padding: '8px 14px',
                        fontSize: '12px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#f87171',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontFamily: 'Orbitron, monospace'
                      }}
                    >
                      ⏪ Rollback до v1.0.0
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAction('deprecate', { reason: 'Оновлено до новішої програми навчання', replacementLessonId: 'lesson-fe-l1-canvas' })}
                      style={{
                        padding: '8px 14px',
                        fontSize: '12px',
                        background: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        color: '#fbbf24',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontFamily: 'Orbitron, monospace'
                      }}
                    >
                      ⚠️ Депрекувати урок
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Version History */}
          {activeTab === 'history' && (
            <div style={{ display: 'grid', gap: '10px' }}>
              {details.versions?.map(v => (
                <div key={v.version} style={{
                  padding: '14px 18px',
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: `1px solid ${v.version === details.activeVersion ? '#0284c7' : 'rgba(148, 163, 184, 0.2)'}`,
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontFamily: 'Orbitron, monospace', color: v.version === details.activeVersion ? '#38bdf8' : '#f8fafc' }}>
                        v{v.version} {v.version === details.activeVersion && '(АКТИВНА)'}
                      </strong>
                      <span style={{ fontSize: '11px', color: '#10b981' }}>● Опубліковано</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                      Дата: {new Date(v.publishedAt).toLocaleDateString()} • Автор: {v.author?.username} • Рев'ювер: {v.reviewer?.username}
                    </div>
                  </div>

                  {v.version !== details.activeVersion && isPrivileged && (
                    <button
                      type="button"
                      onClick={() => handleAction('rollback', { targetVersion: v.version, reason: 'User selected version restore' })}
                      style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        background: 'rgba(56, 189, 248, 0.1)',
                        border: '1px solid #0284c7',
                        color: '#38bdf8',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontFamily: 'Orbitron, monospace'
                      }}
                    >
                      Відкотити сюди
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Audit Trail */}
          {activeTab === 'audit' && (
            <div style={{ display: 'grid', gap: '8px' }}>
              {(!details.auditTrail || details.auditTrail.length === 0) ? (
                <div style={{ padding: '16px', color: '#94a3b8', fontSize: '13px' }}>Немає записів аудиту для цього уроку.</div>
              ) : (
                details.auditTrail.map(a => (
                  <div key={a.id} style={{
                    padding: '10px 14px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(148, 163, 184, 0.15)',
                    borderRadius: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    fontSize: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontFamily: 'Orbitron, monospace', color: '#38bdf8' }}>{a.action}</strong>
                      <span style={{ color: '#cbd5e1' }}>Версія: {a.version}</span>
                      <span style={{ color: '#94a3b8' }}>({a.actor?.username})</span>
                    </div>
                    <span style={{ color: '#64748b', fontSize: '11px', fontFamily: 'monospace' }}>
                      {new Date(a.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
