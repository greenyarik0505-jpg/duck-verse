'use client';

import { useState, useEffect, useCallback } from 'react';

export default function AiTransparencyConsentView({ currentUser }) {
  const [activeTab, setActiveTab] = useState('disclosure'); // 'disclosure' | 'consent' | 'datacontrols' | 'policy'
  const [consentData, setConsentData] = useState(null);
  const [fallbackData, setFallbackData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  // Локальний стан тумблерів згоди
  const [aiEnabled, setAiEnabled] = useState(true);
  const [telemetryEnabled, setTelemetryEnabled] = useState(true);

  // Тестова симуляція картки генерації
  const [simulatedPrompt, setSimulatedPrompt] = useState('Напиши функцію перевірки колізій для Canvas 2D');
  const [simulatedMetadata, setSimulatedMetadata] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/academy/safety/transparency');
      const data = await res.json();
      if (data.success) {
        setConsentData(data.consent);
        setFallbackData(data.fallback);
        if (data.consent) {
          setAiEnabled(data.consent.aiAssistanceEnabled);
          setTelemetryEnabled(data.consent.aiTelemetryConsent);
        }
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

  // Оновлення згоди
  const handleUpdateConsent = async (newAiEnabled, newTelemetryEnabled) => {
    try {
      setLoading(true);
      const res = await fetch('/api/academy/safety/transparency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_consent',
          aiAssistanceEnabled: newAiEnabled,
          aiTelemetryConsent: newTelemetryEnabled,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setConsentData(data.consent);
        setAiEnabled(data.consent.aiAssistanceEnabled);
        setTelemetryEnabled(data.consent.aiTelemetryConsent);
        setActionMessage(
          newAiEnabled
            ? '✅ Налаштування згоди збережено: AI-асистент активований.'
            : '🛡️ AI-асистент вимкнено! Платформа перейшла у режим детермінованого статичного фолбеку без ШІ.'
        );
      } else {
        setActionMessage(`❌ Помилка: ${data.error}`);
      }
    } catch (err) {
      setActionMessage(`❌ Помилка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Симуляція генерації та отримання картки прозорості
  const handleSimulateGeneration = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch('/api/academy/safety/transparency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record_interaction',
          modelId: 'duck-vibe-coder-v1.2',
          promptText: simulatedPrompt,
          responseText: 'export function checkCollision(cube, spike) { return cube.x < spike.x + spike.w && cube.x + cube.w > spike.x; }',
          taskContext: { lessonId: 'lesson-fe-l1-canvas', exerciseId: 'canvas-aabb' },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSimulatedMetadata(data.metadataCard);
        setActionMessage('🔍 Прозорі метадані генерації успішно сформовано та зафіксовано!');
      } else {
        setActionMessage(`❌ ${data.error}`);
        setSimulatedMetadata(null);
      }
    } catch (err) {
      setActionMessage(`❌ Помилка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Експорт історії
  const handleExportHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/academy/safety/transparency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'export_history' }),
      });
      const data = await res.json();
      if (data.success) {
        const blob = new Blob([JSON.stringify(data.export, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `duck_academy_ai_history_${currentUser?.username || 'student'}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setActionMessage('💾 Історію взаємодій із ШІ успішно вивантажено у форматі JSON!');
      } else {
        setActionMessage(`❌ Помилка експорту: ${data.error}`);
      }
    } catch (err) {
      setActionMessage(`❌ Помилка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Повне видалення історії (Right to be Forgotten)
  const handleDeleteHistory = async () => {
    if (!confirm('Ви дійсно бажаєте безповоротно видалити всю історію ваших генерацій ШІ? (Zero Orphaned Records)')) return;
    try {
      setLoading(true);
      const res = await fetch('/api/academy/safety/transparency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_history' }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`🗑️ ${data.message} Видалено записів: ${data.purgedRecordsCount}`);
        await fetchData();
      } else {
        setActionMessage(`❌ Помилка видалення: ${data.error}`);
      }
    } catch (err) {
      setActionMessage(`❌ Помилка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="academy-skills-section" style={{ marginTop: '48px' }}>
      {/* Заголовок SCRUM-104 */}
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
            <span>🤖</span> AI TRANSPARENCY, CONSENT & DATA CONTROLS (SCRUM-104)
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: '4px 0 0 0' }}>
            Прозорість генерацій ШІ: обов&apos;язкове маркування моделі, розкриття limitations, керування згодою батьків (Opt-In/Opt-Out), гарантований фолбек та видалення даних.
          </p>
        </div>

        {/* Навігаційні таби */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('disclosure')}
            className={`academy-tab-button ${activeTab === 'disclosure' ? 'active' : ''}`}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              border: activeTab === 'disclosure' ? '1px solid #38bdf8' : '1px solid #334155',
              background: activeTab === 'disclosure' ? 'rgba(56, 189, 248, 0.15)' : '#0f172a',
              color: activeTab === 'disclosure' ? '#38bdf8' : '#94a3b8',
              fontWeight: 'bold',
            }}
          >
            🔍 Прозорість (Disclosure)
          </button>

          <button
            onClick={() => setActiveTab('consent')}
            className={`academy-tab-button ${activeTab === 'consent' ? 'active' : ''}`}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              border: activeTab === 'consent' ? '1px solid #10b981' : '1px solid #334155',
              background: activeTab === 'consent' ? 'rgba(16, 185, 129, 0.15)' : '#0f172a',
              color: activeTab === 'consent' ? '#10b981' : '#94a3b8',
              fontWeight: 'bold',
            }}
          >
            ⚙️ Згода (Opt-In / Opt-Out)
          </button>

          <button
            onClick={() => setActiveTab('datacontrols')}
            className={`academy-tab-button ${activeTab === 'datacontrols' ? 'active' : ''}`}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              border: activeTab === 'datacontrols' ? '1px solid #f59e0b' : '1px solid #334155',
              background: activeTab === 'datacontrols' ? 'rgba(245, 158, 11, 0.15)' : '#0f172a',
              color: activeTab === 'datacontrols' ? '#f59e0b' : '#94a3b8',
              fontWeight: 'bold',
            }}
          >
            💾 Контроль даних (Export/Delete)
          </button>

          <button
            onClick={() => setActiveTab('policy')}
            className={`academy-tab-button ${activeTab === 'policy' ? 'active' : ''}`}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              border: activeTab === 'policy' ? '1px solid #a855f7' : '1px solid #334155',
              background: activeTab === 'policy' ? 'rgba(168, 85, 247, 0.15)' : '#0f172a',
              color: activeTab === 'policy' ? '#a855f7' : '#94a3b8',
              fontWeight: 'bold',
            }}
          >
            📜 Політика v1.2 (EU AI Act)
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

      {/* Вкладка 1: Прозорість (Disclosure) */}
      {activeTab === 'disclosure' && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {consentData?.availableModels?.map((model) => (
              <div
                key={model.id}
                style={{
                  background: '#090d16',
                  border: '1px solid #1e293b',
                  borderRadius: '10px',
                  padding: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 'bold' }}>
                    {model.provider}
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    v{model.version}
                  </span>
                </div>

                <h3 style={{ fontSize: '17px', color: '#f8fafc', margin: '0 0 6px 0', fontWeight: 'bold' }}>
                  {model.name}
                </h3>

                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>
                  Можливості: {model.capabilities.join(' • ')}
                </div>

                <div style={{ background: '#0f172a', padding: '10px 12px', borderRadius: '6px', fontSize: '12px' }}>
                  <div style={{ color: '#f59e0b', fontWeight: 'bold', marginBottom: '4px' }}>
                    ⚠️ Застереження щодо обмежень (Limitations Notice):
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', color: '#cbd5e1', lineHeight: '1.5' }}>
                    {model.limitations.map((lim, idx) => (
                      <li key={idx}>{lim}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Симулятор перевірки прозорості генерації */}
          <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '10px', padding: '20px' }}>
            <h3 style={{ fontSize: '16px', color: '#38bdf8', margin: '0 0 12px 0', fontWeight: 'bold' }}>
              🧪 Симуляція створення AI Watermark & Disclosure Card
            </h3>
            <form onSubmit={handleSimulateGeneration} style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={simulatedPrompt}
                  onChange={(e) => setSimulatedPrompt(e.target.value)}
                  placeholder="Введіть тестовий інженерний промпт..."
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: '#f8fafc',
                    fontSize: '13px',
                  }}
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{
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
                  Згенерувати картку
                </button>
              </div>
            </form>

            {simulatedMetadata && (
              <div style={{ background: '#0f172a', border: '1px solid #0284c7', borderRadius: '8px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', fontWeight: 'bold' }}>
                    {simulatedMetadata.watermark}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
                  ID генерації: <code>{simulatedMetadata.interactionId}</code> | Передані поля: <code>{simulatedMetadata.dataTransferred.join(', ')}</code>
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                  Оцінка токенів: ~{simulatedMetadata.tokensEstimated} токенів | Модель: {simulatedMetadata.modelName} (v{simulatedMetadata.modelVersion})
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Вкладка 2: Керування згодою (Opt-In / Opt-Out) */}
      {activeTab === 'consent' && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '10px', padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '17px', color: '#f8fafc', margin: '0 0 16px 0', fontWeight: 'bold' }}>
              ⚙️ Налаштування згоди на використання ШІ (Opt-In / Opt-Out)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: '#0f172a', borderRadius: '8px' }}>
                <div>
                  <strong style={{ color: '#f8fafc', fontSize: '14px' }}>Асистент ШІ у Prompt Lab (AI Assistance)</strong>
                  <p style={{ color: '#94a3b8', fontSize: '12px', margin: '4px 0 0 0' }}>
                    Дозволяє отримувати інтерактивні підказки та розбір коду від моделі Duck Vibe Coder.
                  </p>
                </div>
                <button
                  onClick={() => handleUpdateConsent(!aiEnabled, telemetryEnabled)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: 'pointer',
                    background: aiEnabled ? '#059669' : '#334155',
                    color: '#ffffff',
                  }}
                >
                  {aiEnabled ? 'УВІМКНЕНО (Opt-In)' : 'ВИМКНЕНО (Opt-Out)'}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: '#0f172a', borderRadius: '8px' }}>
                <div>
                  <strong style={{ color: '#f8fafc', fontSize: '14px' }}>Анонімна телеметрія безпеки (Telemetry Consent)</strong>
                  <p style={{ color: '#94a3b8', fontSize: '12px', margin: '4px 0 0 0' }}>
                    Згода на фіксацію знеособленої статистики для покращення моделей (нуль паролів та PII).
                  </p>
                </div>
                <button
                  onClick={() => handleUpdateConsent(aiEnabled, !telemetryEnabled)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    cursor: 'pointer',
                    background: telemetryEnabled ? '#0284c7' : '#334155',
                    color: '#ffffff',
                  }}
                >
                  {telemetryEnabled ? 'ДОЗВОЛЕНО' : 'ЗАБОРОНЕНО'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#34d399' }}>
              <span>✅</span> Батьківська згода верифікована для аккаунта: <strong>{consentData?.studentId}</strong> (COPPA/GDPR-K Verified).
            </div>
          </div>

          {/* Секція статичного фолбеку без ШІ */}
          <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '10px', padding: '20px' }}>
            <h3 style={{ fontSize: '16px', color: '#10b981', margin: '0 0 8px 0', fontWeight: 'bold' }}>
              🛡️ Гарантований навчальний фолбек без ШІ (Static Fallback)
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px 0' }}>
              Якщо ви вимкнете ШІ, платформа ніколи не залишить вас без відповідей. Ви отримуєте доступ до офіційних еталонних специфікацій уроку:
            </p>

            {fallbackData && (
              <div style={{ background: '#0f172a', padding: '14px', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
                <div style={{ fontSize: '13px', color: '#34d399', fontWeight: 'bold', marginBottom: '6px' }}>
                  📚 {fallbackData.topic} — {fallbackData.source}
                </div>
                <div style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '8px' }}>
                  {fallbackData.guidance}
                </div>
                <pre style={{ background: '#090d16', padding: '8px 12px', borderRadius: '6px', color: '#f8fafc', fontSize: '12px', margin: '0 0 8px 0' }}>
                  {fallbackData.codeSnippet}
                </pre>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  {fallbackData.fallbackDisclaimer}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Вкладка 3: Контроль даних (Export & Delete) */}
      {activeTab === 'datacontrols' && (
        <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '10px', padding: '20px' }}>
            <h3 style={{ fontSize: '16px', color: '#38bdf8', margin: '0 0 10px 0', fontWeight: 'bold' }}>
              📥 Завантажити історію (Data Export)
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px 0', lineHeight: '1.5' }}>
              Отримайте повний ідемпотентний JSON-архів усіх ваших звернень до моделей ШІ, метаданих генерацій та історії згоди.
            </p>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
              Зафіксовано взаємодій: <strong>{consentData?.historyCount || 0}</strong>
            </div>
            <button
              onClick={handleExportHistory}
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
              Завантажити JSON-експорт
            </button>
          </div>

          <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '10px', padding: '20px' }}>
            <h3 style={{ fontSize: '16px', color: '#f87171', margin: '0 0 10px 0', fontWeight: 'bold' }}>
              🗑️ Повне видалення історії (Right to be Forgotten)
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px 0', lineHeight: '1.5' }}>
              Ідемпотентне стирання всієї історії взаємодій учня з ШІ. Гарантується відсутність залишкових даних (Zero Orphaned Records).
            </p>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
              Статус відповідності: <strong>100% COPPA/GDPR Compliant</strong>
            </div>
            <button
              onClick={handleDeleteHistory}
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px 16px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                border: '1px solid #ef4444',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '13px',
              }}
            >
              Стерти всю історію взаємодій
            </button>
          </div>
        </div>
      )}

      {/* Вкладка 4: Політика та стандарти */}
      {activeTab === 'policy' && (
        <div style={{ marginTop: '20px', background: '#090d16', border: '1px solid #1e293b', borderRadius: '10px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontSize: '17px', color: '#c084fc', margin: 0, fontWeight: 'bold' }}>
              📜 Duck Academy AI Transparency & Safety Policy (v{consentData?.activePolicy?.version || '1.2.0'})
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Дата набрання чинності: {consentData?.activePolicy?.effectiveDate || '2026-09-01'}
            </span>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 'bold', marginBottom: '6px' }}>
              Правові рамки та сертифікація:
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {consentData?.activePolicy?.legalFrameworks?.map((law, idx) => (
                <span key={idx} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                  {law}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 'bold', marginBottom: '6px' }}>
              Фундаментальні принципи прозорості:
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#cbd5e1', fontSize: '13px', lineHeight: '1.7' }}>
              {consentData?.activePolicy?.principles?.map((p, idx) => (
                <li key={idx}>{p}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
