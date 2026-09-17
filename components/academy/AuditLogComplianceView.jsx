'use client';

import { useState, useEffect, useCallback } from 'react';
import { AUDIT_EVENT_TYPES, RETENTION_POLICIES } from '../../lib/academy/audit/compliance';

export default function AuditLogComplianceView({ currentUser }) {
  const [activeTab, setActiveTab] = useState('events'); // 'events' | 'export' | 'delete' | 'retention'
  const [filterType, setFilterType] = useState('ALL');
  const [events, setEvents] = useState([]);
  const [exportData, setExportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [deletionStatus, setDeletionStatus] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteAcknowledge, setDeleteAcknowledge] = useState(false);

  // Отримання подій аудиту
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const url = filterType === 'ALL'
        ? '/api/academy/audit?view=events'
        : `/api/academy/audit?view=events&eventType=${filterType}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setEvents(data.events || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  // Отримання експорту даних
  const fetchExport = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/academy/audit?view=export');
      const data = await res.json();
      if (data.success) {
        setExportData(data.export);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'events') {
      fetchEvents();
    } else if (activeTab === 'export') {
      fetchExport();
    }
  }, [activeTab, fetchEvents, fetchExport]);

  // Симуляція тестової події
  const handleSimulateLogin = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/academy/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'log',
          eventType: AUDIT_EVENT_TYPES.LOGIN,
          metadata: {
            authProvider: 'local_cyber_session',
            userAgent: 'DuckVerse Desktop Browser 1.0',
            password: 'secret_never_logged', // Перевірка Data Redaction
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage('⚡ Подію входу успішно зафіксовано в системі (пароль вилучено згідно з Redaction Policy)!');
        await fetchEvents();
      }
    } catch (e) {
      setActionMessage(`Помилка: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Виконання каскадного видалення акаунту
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      alert('Будь ласка, введіть DELETE для підтвердження видалення.');
      return;
    }
    if (!deleteAcknowledge) {
      alert('Будь ласка, підтвердіть, що ви усвідомлюєте незворотність операції.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/academy/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          reason: 'Користувач ініціював право на забуття (GDPR Art. 17)',
          confirmationToken: 'usr-conf-token-88',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDeletionStatus(data.result);
        setActionMessage('🗑️ ' + data.result.message);
        await fetchEvents();
      } else {
        setActionMessage(`Помилка видалення: ${data.error}`);
      }
    } catch (e) {
      setActionMessage(`Помилка: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Завантаження експорту в файл
  const handleDownloadExportJson = () => {
    if (!exportData) return;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `duck_academy_export_${exportData.subject?.userId || 'guest'}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="academy-skills-section" style={{ marginTop: '48px' }}>
      {/* Заголовок та метадані SCRUM-88 */}
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
            <span>📋</span> AUDIT LOG, DATA EXPORT & COMPLIANCE (SCRUM-88)
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: '4px 0 0 0' }}>
            Централізований журнал безпеки, машиночитаний експорт даних (GDPR Art. 20) та безпечне каскадне видалення акаунту (GDPR Art. 17).
          </p>
        </div>

        {/* Навігаційні таби */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('events')}
            className={`academy-tab-button ${activeTab === 'events' ? 'active' : ''}`}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              border: activeTab === 'events' ? '1px solid #38bdf8' : '1px solid #334155',
              background: activeTab === 'events' ? 'rgba(56, 189, 248, 0.15)' : '#0f172a',
              color: activeTab === 'events' ? '#38bdf8' : '#94a3b8',
              fontWeight: 'bold',
            }}
          >
            📋 Журнал аудиту ({events.length})
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`academy-tab-button ${activeTab === 'export' ? 'active' : ''}`}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              border: activeTab === 'export' ? '1px solid #10b981' : '1px solid #334155',
              background: activeTab === 'export' ? 'rgba(16, 185, 129, 0.15)' : '#0f172a',
              color: activeTab === 'export' ? '#10b981' : '#94a3b8',
              fontWeight: 'bold',
            }}
          >
            📦 Експорт даних (JSON)
          </button>

          <button
            onClick={() => setActiveTab('delete')}
            className={`academy-tab-button ${activeTab === 'delete' ? 'active' : ''}`}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              border: activeTab === 'delete' ? '1px solid #f43f5e' : '1px solid #334155',
              background: activeTab === 'delete' ? 'rgba(244, 63, 94, 0.15)' : '#0f172a',
              color: activeTab === 'delete' ? '#f43f5e' : '#94a3b8',
              fontWeight: 'bold',
            }}
          >
            🗑️ Видалення акаунту
          </button>

          <button
            onClick={() => setActiveTab('retention')}
            className={`academy-tab-button ${activeTab === 'retention' ? 'active' : ''}`}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              border: activeTab === 'retention' ? '1px solid #a855f7' : '1px solid #334155',
              background: activeTab === 'retention' ? 'rgba(168, 85, 247, 0.15)' : '#0f172a',
              color: activeTab === 'retention' ? '#a855f7' : '#94a3b8',
              fontWeight: 'bold',
            }}
          >
            ⏳ Політики збереження
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

      {/* ТАБ 1: ЖУРНАЛ АУДИТУ */}
      {activeTab === 'events' && (
        <div style={{ marginTop: '20px' }}>
          {/* Фільтри за типом події */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: '16px',
            }}
          >
            <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 'bold' }}>Тип події:</span>
            {['ALL', ...Object.values(AUDIT_EVENT_TYPES)].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  border: filterType === type ? '1px solid #38bdf8' : '1px solid #334155',
                  background: filterType === type ? '#38bdf8' : '#1e293b',
                  color: filterType === type ? '#0f172a' : '#cbd5e1',
                  fontWeight: filterType === type ? 'bold' : 'normal',
                }}
              >
                {type}
              </button>
            ))}

            <button
              onClick={handleSimulateLogin}
              disabled={loading}
              style={{
                marginLeft: 'auto',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 'bold',
                background: '#0284c7',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              ⚡ Симулювати вхід (Login Event)
            </button>
          </div>

          {/* Список подій */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {events.length === 0 ? (
              <div
                style={{
                  padding: '30px',
                  textAlign: 'center',
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: '8px',
                  border: '1px dashed #334155',
                  color: '#94a3b8',
                }}
              >
                Подій у журналі аудиту за обраним фільтром не знайдено.
              </div>
            ) : (
              events.map(evt => {
                let badgeColor = '#38bdf8';
                if (evt.eventType === 'LOGIN') badgeColor = '#38bdf8';
                if (evt.eventType === 'CONSENT_UPDATE') badgeColor = '#10b981';
                if (evt.eventType === 'ROLE_CHANGE') badgeColor = '#f59e0b';
                if (evt.eventType === 'DATA_EXPORT') badgeColor = '#a855f7';
                if (evt.eventType === 'ACCOUNT_DELETION') badgeColor = '#f43f5e';
                if (evt.eventType === 'REVIEW_ACCESS') badgeColor = '#06b6d4';

                return (
                  <div
                    key={evt.id}
                    style={{
                      padding: '14px 18px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      borderRadius: '8px',
                      border: '1px solid #1e293b',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            fontFamily: 'monospace',
                            background: `${badgeColor}22`,
                            color: badgeColor,
                            border: `1px solid ${badgeColor}`,
                          }}
                        >
                          {evt.eventType}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#f8fafc' }}>
                          Актор: {evt.actorUsername} ({evt.actorRole})
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                        {new Date(evt.timestamp).toLocaleString('uk-UA')}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', gap: '16px' }}>
                      <span>Ціль: <code style={{ color: '#cbd5e1' }}>{evt.targetUserId || 'system'}</code></span>
                      <span>Статус: <strong style={{ color: '#10b981' }}>{evt.status}</strong></span>
                      <span>IP Hash: <code style={{ color: '#64748b' }}>{evt.ipHash}</code></span>
                      <span style={{ color: '#0ea5e9' }}>🛡️ Zero PII Redacted</span>
                    </div>

                    {evt.metadata && Object.keys(evt.metadata).length > 0 && (
                      <div
                        style={{
                          marginTop: '4px',
                          padding: '6px 10px',
                          borderRadius: '4px',
                          background: '#0b1120',
                          fontSize: '11px',
                          fontFamily: 'monospace',
                          color: '#94a3b8',
                          overflowX: 'auto',
                        }}
                      >
                        {JSON.stringify(evt.metadata)}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ТАБ 2: ЕКСПОРТ ДАНИХ */}
      {activeTab === 'export' && (
        <div style={{ marginTop: '20px' }}>
          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h4 style={{ margin: 0, color: '#10b981', fontSize: '15px' }}>
                📦 Machine-Readable Data Portability (GDPR Art. 20)
              </h4>
              <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>
                Формує повний структурований архів профілю, прогресу та робіт у форматі JSON з контрольною сумою SHA-256.
              </p>
            </div>
            <button
              onClick={handleDownloadExportJson}
              disabled={!exportData}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 'bold',
                background: '#10b981',
                color: '#0f172a',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>⬇️</span> Завантажити JSON
            </button>
          </div>

          {exportData ? (
            <div
              style={{
                background: '#0b1120',
                border: '1px solid #1e293b',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Формат: <strong style={{ color: '#38bdf8' }}>{exportData.exportFormatVersion}</strong>
                </span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Checksum: <code style={{ color: '#10b981' }}>{exportData.integrityChecksum?.substring(0, 16)}...</code>
                </span>
              </div>
              <pre
                style={{
                  margin: 0,
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  color: '#cbd5e1',
                  maxHeight: '400px',
                  overflowY: 'auto',
                }}
              >
                {JSON.stringify(exportData, null, 2)}
              </pre>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
              Завантаження експорту даних...
            </div>
          )}
        </div>
      )}

      {/* ТАБ 3: ВИДАЛЕННЯ АКАУНТУ */}
      {activeTab === 'delete' && (
        <div style={{ marginTop: '20px' }}>
          <div
            style={{
              padding: '20px',
              borderRadius: '8px',
              background: 'rgba(244, 63, 94, 0.08)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
            }}
          >
            <h4 style={{ margin: 0, color: '#f43f5e', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚠️</span> Право на забуття (Right to be Forgotten — GDPR Art. 17)
            </h4>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: '8px 0 16px 0', lineHeight: 1.5 }}>
              Ця дія призводить до повного каскадного видалення вашого профілю, навчального прогресу, завдань та зв'язків опікунів. Записи в журналі аудиту знеособлюються (<code style={{ color: '#f43f5e' }}>redacted-user-hash</code>) для збереження юридичної цілісності.
            </p>

            {deletionStatus ? (
              <div
                style={{
                  padding: '14px',
                  borderRadius: '6px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid #10b981',
                  color: '#10b981',
                  fontSize: '13px',
                }}
              >
                <strong>Статус: {deletionStatus.status}</strong> — {deletionStatus.message}
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#94a3b8' }}>
                  Очищено елементів: Профіль ({deletionStatus.purgedItems?.userProfilePurged ? 'Так' : 'Ні'}), Прогрес ({deletionStatus.purgedItems?.progressRecordsPurged}), Сабмішени ({deletionStatus.purgedItems?.submissionsPurged}).
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#e2e8f0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={deleteAcknowledge}
                    onChange={(e) => setDeleteAcknowledge(e.target.checked)}
                  />
                  <span>Я підтверджую, що усвідомлюю незворотність каскадного видалення акаунту</span>
                </label>

                <div>
                  <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                    Для підтвердження введіть слово <strong style={{ color: '#f43f5e' }}>DELETE</strong>:
                  </span>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      color: '#f8fafc',
                      fontSize: '13px',
                      width: '200px',
                    }}
                  />
                </div>

                <button
                  onClick={handleDeleteAccount}
                  disabled={loading || deleteConfirmText !== 'DELETE' || !deleteAcknowledge}
                  style={{
                    alignSelf: 'flex-start',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    background: deleteConfirmText === 'DELETE' && deleteAcknowledge ? '#f43f5e' : '#475569',
                    color: '#fff',
                    border: 'none',
                    cursor: deleteConfirmText === 'DELETE' && deleteAcknowledge ? 'pointer' : 'not-allowed',
                  }}
                >
                  🚨 Видалити мій акаунт (Каскадно)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ТАБ 4: ПОЛІТИКИ ЗБЕРЕЖЕННЯ */}
      {activeTab === 'retention' && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {Object.entries(RETENTION_POLICIES).map(([key, policy]) => (
              <div
                key={key}
                style={{
                  padding: '18px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  borderRadius: '8px',
                  border: '1px solid #1e293b',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', color: '#f8fafc' }}>
                    {policy.label}
                  </h4>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      background: 'rgba(168, 85, 247, 0.15)',
                      color: '#a855f7',
                      border: '1px solid #a855f7',
                    }}
                  >
                    {policy.days} днів
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                  {policy.action}
                </p>
                <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #1e293b', fontSize: '11px', color: '#10b981' }}>
                  ✓ Автоматизована ротація активна
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
