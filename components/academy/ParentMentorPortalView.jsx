'use client';

import React, { useState, useEffect, useCallback } from 'react';

export default function ParentMentorPortalView({ currentUser }) {
  const [report, setReport] = useState(null);
  const [guardians, setGuardians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('report'); // report | access | mentor
  const [parentEmail, setParentEmail] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [inviteToken, setInviteToken] = useState('');

  const studentId = currentUser?.id || 'user_guest';

  const fetchPortalData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [repRes, guarRes] = await Promise.all([
        fetch(`/api/academy/portal?studentId=${studentId}&view=report`),
        fetch(`/api/academy/portal?studentId=${studentId}&view=guardians`),
      ]);

      const repJson = await repRes.json();
      const guarJson = await guarRes.json();

      if (repJson.success && repJson.report) {
        setReport(repJson.report);
      } else {
        setErrorMsg(repJson.error || 'Не вдалося завантажити щотижневий звіт.');
      }

      if (guarJson.success && guarJson.guardians) {
        setGuardians(guarJson.guardians);
      }
    } catch {
      setErrorMsg('Помилка зв\'язку із сервером батьківського порталу.');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchPortalData();
  }, [fetchPortalData]);

  const handleCreateInvite = async (e) => {
    e.preventDefault();
    if (!parentEmail || !parentEmail.includes('@')) {
      setErrorMsg('Введіть коректну email-адресу батьків або опікуна.');
      return;
    }

    setActionMsg('');
    setErrorMsg('');
    try {
      const res = await fetch('/api/academy/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_invite',
          studentId,
          parentEmail,
          relation: 'parent',
        }),
      });
      const json = await res.json();
      if (json.success && json.invite) {
        setActionMsg(`Запрошення для ${parentEmail} успішно згенеровано!`);
        setInviteToken(json.invite.token);
        setParentEmail('');
        fetchPortalData();
      } else {
        setErrorMsg(json.error || 'Помилка створення запрошення.');
      }
    } catch {
      setErrorMsg('Мережева помилка створення запрошення.');
    }
  };

  const handleRevoke = async (parentId) => {
    setActionMsg('');
    setErrorMsg('');
    try {
      const res = await fetch('/api/academy/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revoke_access',
          studentId,
          parentId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setActionMsg('Доступ опікуна успішно анульовано (Revoked).');
        fetchPortalData();
      }
    } catch {}
  };

  return (
    <div className="academy-skills-section" style={{ marginTop: '36px' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>👨‍👩‍👧</span>
            <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '20px', color: '#38bdf8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Parent & Mentor Portal (SCRUM-86)
            </h2>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 0 0' }}>
            Безпечний огляд прогресу для батьків та менторів, щотижневий звіт із динамікою (Weekly Delta) та захист приватності.
          </p>
        </div>

        {/* View Tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('report')}
            style={{
              background: activeTab === 'report' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              color: activeTab === 'report' ? '#38bdf8' : '#94a3b8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              padding: '6px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: 'Orbitron, monospace',
              fontSize: '12px'
            }}
          >
            📊 Щотижневий звіт
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('access')}
            style={{
              background: activeTab === 'access' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              color: activeTab === 'access' ? '#38bdf8' : '#94a3b8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              padding: '6px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: 'Orbitron, monospace',
              fontSize: '12px'
            }}
          >
            🛡️ Доступ опікунів ({guardians.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mentor')}
            style={{
              background: activeTab === 'mentor' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              color: activeTab === 'mentor' ? '#38bdf8' : '#94a3b8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              padding: '6px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: 'Orbitron, monospace',
              fontSize: '12px'
            }}
          >
            🎓 Менторський огляд
          </button>
        </div>
      </header>

      {/* Action Messages */}
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

      {loading && !report ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
          <div className="game-spinner" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontFamily: 'Orbitron, monospace', fontSize: '12px' }}>Завантаження даних порталу...</p>
        </div>
      ) : (
        <div>
          {/* Tab 1: Weekly Progress Report */}
          {activeTab === 'report' && report && (
            <div>
              {/* Progress Delta Banner */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 95, 70, 0.3))',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '10px',
                padding: '16px 20px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '14px'
              }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#6ee7b7', fontFamily: 'Orbitron, monospace', textTransform: 'uppercase' }}>
                    Звіт за {report.period} • Учень: {report.childName}
                  </span>
                  <h3 style={{ margin: '4px 0 6px 0', fontSize: '18px', color: '#f8fafc', fontFamily: 'Orbitron, sans-serif' }}>
                    Динаміка за тиждень: <strong style={{ color: '#34d399' }}>+{report.progressDelta?.overallScoreDelta}% росту</strong>
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#d1fae5' }}>
                    {report.summary}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ background: 'rgba(2, 6, 23, 0.5)', padding: '8px 14px', borderRadius: '6px', textAlign: 'center' }}>
                    <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Уроків пройдено</span>
                    <strong style={{ fontSize: '16px', color: '#38bdf8', fontFamily: 'Orbitron, monospace' }}>+{report.progressDelta?.completedLessonsThisWeek}</strong>
                  </div>
                  <div style={{ background: 'rgba(2, 6, 23, 0.5)', padding: '8px 14px', borderRadius: '6px', textAlign: 'center' }}>
                    <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>PR верифіковано</span>
                    <strong style={{ fontSize: '16px', color: '#38bdf8', fontFamily: 'Orbitron, monospace' }}>+{report.progressDelta?.verifiedPrCountThisWeek}</strong>
                  </div>
                </div>
              </div>

              {/* Skills Growth Cards & Next Step */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                {/* Skills Breakdown */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: '8px',
                  padding: '16px 20px'
                }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#f8fafc', fontFamily: 'Orbitron, monospace' }}>
                    📈 Компетенції з найвищим ростом:
                  </h4>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {report.completedSkillsThisWeek?.map(s => (
                      <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(2, 6, 23, 0.4)', borderRadius: '6px' }}>
                        <span style={{ fontSize: '13px', color: '#cbd5e1' }}>{s.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>{s.progress}</span>
                          <strong style={{ fontSize: '12px', color: '#34d399', fontFamily: 'Orbitron, monospace' }}>{s.growth}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Next Step & Blockers */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: '8px',
                  padding: '16px 20px'
                }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#f8fafc', fontFamily: 'Orbitron, monospace' }}>
                    🎯 Наступний крок учня:
                  </h4>
                  {report.nextRecommendedStep && (
                    <div style={{ padding: '12px', background: 'rgba(2, 132, 199, 0.15)', border: '1px solid rgba(2, 132, 199, 0.4)', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ padding: '2px 6px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', borderRadius: '4px', fontSize: '11px', fontFamily: 'Orbitron, monospace' }}>
                          {report.nextRecommendedStep.jiraKey}
                        </span>
                        <strong style={{ color: '#f8fafc', fontSize: '13px' }}>{report.nextRecommendedStep.title}</strong>
                      </div>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#cbd5e1' }}>
                        Фокус: {report.nextRecommendedStep.recommendedFocus}
                      </p>
                    </div>
                  )}

                  <div style={{ marginTop: '14px' }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>Активні блокери: </span>
                    <strong style={{ fontSize: '12px', color: '#34d399' }}>Немає блокерів, навчання йде за планом!</strong>
                  </div>
                </div>
              </div>

              {/* Privacy Shield Notice */}
              <div style={{
                padding: '12px 18px',
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '12px',
                color: '#94a3b8'
              }}>
                <span style={{ fontSize: '20px' }}>🛡️</span>
                <div>
                  <strong style={{ color: '#cbd5e1' }}>Privacy Shield Захист: </strong>
                  {report.privacyShield?.dataRetentionNotice}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Guardian Access Management */}
          {activeTab === 'access' && (
            <div style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '8px',
              padding: '20px'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#f8fafc', fontFamily: 'Orbitron, monospace' }}>
                Керування доступом опікунів (Consent-Based Invitation)
              </h3>

              {/* Invite Form */}
              <form onSubmit={handleCreateInvite} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
                <input
                  type="email"
                  placeholder="Введіть email батька або опікуна..."
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  style={{
                    flex: '1 1 280px',
                    padding: '8px 14px',
                    background: '#090d16',
                    border: '1px solid #0284c7',
                    borderRadius: '6px',
                    color: '#f8fafc',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  className="academy-auth-btn"
                  style={{ padding: '8px 16px', fontSize: '12px' }}
                >
                  📨 Надіслати запрошення
                </button>
              </form>

              {inviteToken && (
                <div style={{ padding: '12px', background: 'rgba(56, 189, 248, 0.1)', border: '1px dashed #0284c7', borderRadius: '6px', marginBottom: '20px', fontSize: '12px' }}>
                  <span style={{ color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Одноразовий токен запрошення (дійсний 72 години):</span>
                  <code style={{ color: '#38bdf8', fontSize: '13px' }}>{inviteToken}</code>
                </div>
              )}

              {/* Active Guardians List */}
              <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#f8fafc', fontFamily: 'Orbitron, monospace' }}>
                Активні опікуни з доступом до звіту: {guardians.length}
              </h4>

              {guardians.length === 0 ? (
                <div style={{ padding: '16px', background: 'rgba(2, 6, 23, 0.4)', borderRadius: '6px', color: '#94a3b8', fontSize: '13px' }}>
                  Наразі немає підключених опікунів. Використайте форму вище, щоб запросити батьків.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '8px' }}>
                  {guardians.map(g => (
                    <div key={g.parentId} style={{
                      padding: '10px 14px',
                      background: 'rgba(2, 6, 23, 0.5)',
                      borderRadius: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}>
                      <div>
                        <strong style={{ color: '#f8fafc', fontSize: '13px' }}>{g.parentId}</strong>
                        <span style={{ color: '#10b981', fontSize: '11px', marginLeft: '8px' }}>● Активний</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRevoke(g.parentId)}
                        style={{
                          padding: '4px 10px',
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          color: '#f87171',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontFamily: 'Orbitron, monospace'
                        }}
                      >
                        Миттєво відкликати (Revoke)
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Mentor Technical View */}
          {activeTab === 'mentor' && (
            <div style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '8px',
              padding: '20px'
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#f8fafc', fontFamily: 'Orbitron, monospace' }}>
                🎓 Менторський технічний огляд (Senior Reviewer Scope)
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 16px 0' }}>
                Ментори мають повний доступ до 6-вимірної рубрики (SCRUM-57), Pull Requests та артефактів збірок.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                {report?.verifiedSources?.map(s => (
                  <div key={s.name} style={{ padding: '12px', background: 'rgba(2, 6, 23, 0.5)', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                    <strong style={{ color: '#38bdf8', fontSize: '13px', display: 'block', marginBottom: '4px' }}>{s.name}</strong>
                    <span style={{ fontSize: '11px', color: '#34d399' }}>✓ Верифіковано ментором</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
