'use client';

import React, { useState, useEffect, useCallback } from 'react';

export default function LearningCalendarNotificationsView({ currentUser }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('calendar'); // calendar | notifications | settings
  const [actionMsg, setActionMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const studentId = currentUser?.id || 'user_guest';

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/academy/calendar?studentId=${studentId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        setErrorMsg(json.error || 'Не вдалося завантажити розклад.');
      }
    } catch {
      setErrorMsg('Помилка зв\'язку із сервером календаря.');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDismiss = async (notificationId) => {
    try {
      const res = await fetch('/api/academy/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'dismiss_notification',
          studentId,
          notificationId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        fetchData();
      }
    } catch {}
  };

  const handleToggleQuietHours = async () => {
    if (!data?.preferences) return;
    setSaving(true);
    try {
      const newEnabled = !data.preferences.quietHours?.enabled;
      const res = await fetch('/api/academy/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_preferences',
          studentId,
          updates: {
            quietHours: {
              ...data.preferences.quietHours,
              enabled: newEnabled,
            },
          },
        }),
      });
      const json = await res.json();
      if (json.success) {
        setActionMsg(`Тихі години ${newEnabled ? 'увімкнено' : 'вимкнено'}.`);
        fetchData();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleConsent = async () => {
    if (!data?.preferences) return;
    setSaving(true);
    try {
      const currentRevoked = Boolean(data.preferences.consentRevoked);
      const action = currentRevoked ? 'restore_consent' : 'revoke_consent';
      const res = await fetch('/api/academy/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, studentId }),
      });
      const json = await res.json();
      if (json.success) {
        setActionMsg(currentRevoked ? 'Згоду на сповіщення відновлено.' : 'Згоду відкликано: всі сповіщення призупинено.');
        fetchData();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleTestReminder = async () => {
    try {
      const res = await fetch('/api/academy/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'trigger_reminder',
          studentId,
          reminderData: {
            eventType: 'lesson_deadline',
            sourceTaskId: 'SCRUM-56',
            title: 'Нагадування: Наближається дедлайн завдання [SCRUM-56]',
            message: 'Рекомендуємо закрити передумови та оформити PR для успішної верифікації навичок.',
            nextAction: {
              label: 'Перейти до уроку',
              actionUrl: '/academy#lesson-fe-l0-arch',
            },
          },
        }),
      });
      const json = await res.json();
      if (json.success) {
        const status = json.result?.status;
        if (status === 'DELIVERED') {
          setActionMsg('Сповіщення успішно доставлено в Notification Center.');
        } else if (status === 'SUPPRESSED_DUPLICATE') {
          setActionMsg('Дедуплікація спрацювала: повторне сповіщення придушено сьогодні.');
        } else if (status === 'SUPPRESSED_QUIET_HOURS') {
          setActionMsg('Тихі години активні: сповіщення призупинено.');
        } else if (status === 'SUPPRESSED_REVOKED_CONSENT') {
          setActionMsg('Згоду відкликано: сповіщення заблоковано.');
        }
        fetchData();
      }
    } catch {}
  };

  const notifications = data?.notifications || [];
  const events = data?.events || [];
  const prefs = data?.preferences || {};

  return (
    <div className="academy-skills-section" style={{ marginTop: '36px' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>📅</span>
            <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '20px', color: '#38bdf8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Learning Calendar & Smart Reminders (SCRUM-85)
            </h2>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0 0 0' }}>
            Розклад занять, нагадування про наступні кроки, тихі години та захист від спаму з обов'язковим зв'язком із Jira tasks.
          </p>
        </div>

        {/* Action Tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            style={{
              background: activeTab === 'calendar' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              color: activeTab === 'calendar' ? '#38bdf8' : '#94a3b8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              padding: '6px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: 'Orbitron, monospace',
              fontSize: '12px'
            }}
          >
            📅 Розклад ({events.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            style={{
              background: activeTab === 'notifications' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              color: activeTab === 'notifications' ? '#38bdf8' : '#94a3b8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              padding: '6px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: 'Orbitron, monospace',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🔔 Нагадування
            {notifications.length > 0 && (
              <span style={{
                background: '#ef4444',
                color: '#fff',
                borderRadius: '10px',
                padding: '1px 6px',
                fontSize: '10px',
                fontWeight: 'bold'
              }}>
                {notifications.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            style={{
              background: activeTab === 'settings' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              color: activeTab === 'settings' ? '#38bdf8' : '#94a3b8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              padding: '6px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: 'Orbitron, monospace',
              fontSize: '12px'
            }}
          >
            ⚙️ Налаштування
          </button>
        </div>
      </header>

      {/* Messages */}
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

      {loading && !data ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
          <div className="game-spinner" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontFamily: 'Orbitron, monospace', fontSize: '12px' }}>Завантаження розкладу та нагадувань...</p>
        </div>
      ) : (
        <div>
          {/* Tab 1: Calendar Grid */}
          {activeTab === 'calendar' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'Orbitron, monospace' }}>
                  Часовий пояс: <strong style={{ color: '#38bdf8' }}>{prefs.timezone || 'Europe/Kyiv'}</strong> • Тихі години: <strong style={{ color: prefs.quietHours?.enabled ? '#34d399' : '#94a3b8' }}>{prefs.quietHours?.enabled ? `${prefs.quietHours.startHour}:00–0${prefs.quietHours.endHour}:00` : 'Вимкнено'}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleTestReminder}
                  className="academy-auth-btn"
                  style={{ padding: '4px 10px', fontSize: '11px' }}
                  title="Перевірити дедуплікацію та доставку"
                >
                  ⚡ Перевірити нагадування (Test)
                </button>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '12px'
              }}>
                {events.map(ev => (
                  <div key={ev.id} style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(56, 189, 248, 0.2)',
                    borderRadius: '8px',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontFamily: 'Orbitron, monospace',
                          background: ev.eventType === 'task_blocker' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.15)',
                          color: ev.eventType === 'task_blocker' ? '#f87171' : '#38bdf8',
                          border: `1px solid ${ev.eventType === 'task_blocker' ? '#ef4444' : '#0284c7'}`
                        }}>
                          {ev.sourceTaskId}
                        </span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                          {new Date(ev.start).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#f8fafc', lineHeight: 1.4 }}>
                        {ev.title}
                      </h4>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        {new Date(ev.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {ev.nextAction && (
                        <a
                          href={ev.nextAction.actionUrl}
                          style={{
                            fontSize: '12px',
                            color: '#38bdf8',
                            textDecoration: 'none',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {ev.nextAction.label} ➔
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Notification Center */}
          {activeTab === 'notifications' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'Orbitron, monospace' }}>
                  Активні нагадування: {notifications.length}
                </span>
                <button
                  type="button"
                  onClick={handleTestReminder}
                  className="academy-auth-btn"
                  style={{ padding: '4px 10px', fontSize: '11px' }}
                >
                  ➕ Створити нагадування
                </button>
              </div>

              {notifications.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', border: '1px dashed rgba(148, 163, 184, 0.3)', color: '#94a3b8' }}>
                  <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>🎉</span>
                  Усі задачі виконано. Немає активних блокерів або нагадувань.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {notifications.map(n => (
                    <div key={n.id} style={{
                      padding: '14px 18px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '12px'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontFamily: 'Orbitron, monospace',
                            background: 'rgba(56, 189, 248, 0.15)',
                            color: '#38bdf8',
                            border: '1px solid #0284c7'
                          }}>
                            {n.sourceTaskId}
                          </span>
                          <strong style={{ color: '#f8fafc', fontSize: '14px' }}>{n.title}</strong>
                        </div>
                        <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#cbd5e1', lineHeight: 1.4 }}>
                          {n.message}
                        </p>
                        {n.nextAction && (
                          <a
                            href={n.nextAction.actionUrl}
                            style={{
                              display: 'inline-block',
                              padding: '5px 12px',
                              borderRadius: '4px',
                              background: 'rgba(2, 132, 199, 0.2)',
                              border: '1px solid #0284c7',
                              color: '#38bdf8',
                              fontSize: '12px',
                              textDecoration: 'none',
                              fontFamily: 'Orbitron, monospace'
                            }}
                          >
                            🚀 {n.nextAction.label}
                          </a>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDismiss(n.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#94a3b8',
                          fontSize: '16px',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                        title="Відхилити нагадування"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Settings & Preferences */}
          {activeTab === 'settings' && (
            <div style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '8px',
              padding: '20px'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#f8fafc', fontFamily: 'Orbitron, monospace' }}>
                Керування сповіщеннями та приватністю (Zero-Spam Policy)
              </h3>

              <div style={{ display: 'grid', gap: '16px', maxWidth: '600px' }}>
                {/* Quiet Hours Switch */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(2, 6, 23, 0.5)', borderRadius: '6px' }}>
                  <div>
                    <strong style={{ color: '#f8fafc', display: 'block', fontSize: '13px' }}>Тихі години (Quiet Hours: 22:00 – 08:00)</strong>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>Автоматично блокувати сповіщення під час відпочинку у вашому часовому поясі.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleQuietHours}
                    disabled={saving}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      border: 'none',
                      background: prefs.quietHours?.enabled ? '#059669' : '#475569',
                      color: '#fff',
                      cursor: 'pointer',
                      fontFamily: 'Orbitron, monospace',
                      fontSize: '11px'
                    }}
                  >
                    {prefs.quietHours?.enabled ? 'УВІМКНЕНО' : 'ВИМКНЕНО'}
                  </button>
                </div>

                {/* Revoke Consent Switch */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(2, 6, 23, 0.5)', borderRadius: '6px' }}>
                  <div>
                    <strong style={{ color: '#f8fafc', display: 'block', fontSize: '13px' }}>Відкликання згоди (Consent Revocation)</strong>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>Повна заборона надсилання будь-яких нагадувань на виконання вимог GDPR / приватності.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleConsent}
                    disabled={saving}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      border: 'none',
                      background: prefs.consentRevoked ? '#dc2626' : '#475569',
                      color: '#fff',
                      cursor: 'pointer',
                      fontFamily: 'Orbitron, monospace',
                      fontSize: '11px'
                    }}
                  >
                    {prefs.consentRevoked ? 'ВІДКЛИКАНО' : 'АКТИВНО'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
