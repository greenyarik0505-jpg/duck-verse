'use client';

import { useState, useEffect, useCallback } from 'react';

export default function PublicStatusView({ isStandalone = false }) {
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [activeTab, setActiveTab] = useState('status'); // 'status' | 'incidents' | 'simulator' | 'archive'

  // Форма створення інциденту в симуляторі
  const [incTitle, setIncTitle] = useState('Короткочасна затримка збереження рекордів');
  const [incSeverity, setIncSeverity] = useState('MINOR');
  const [incImpact, setIncImpact] = useState('Ігри працюють штатно, але рекорди можуть з\'являтися в таблиці із затримкою у 2-3 хвилини.');
  const [incComponent, setIncComponent] = useState('scores');

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/status');
      const data = await res.json();
      if (data.success) {
        setStatusData(data);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Створення тестового інциденту
  const handleReportIncident = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch('/api/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'report_incident',
          title: incTitle,
          severity: incSeverity,
          impactSummary: incImpact,
          affectedComponents: [incComponent],
          nextUpdateDue: 'протягом 20 хвилин',
          initialMessage: 'Інженери зафіксували уповільнення та локалізують джерело затримок.',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`🚨 Новий інцидент [${data.incident.id}] успішно зареєстровано! Статус компонента оновлено.`);
        fetchStatus();
      } else {
        setActionMessage(`❌ Помилка: ${data.error}`);
      }
    } catch (err) {
      setActionMessage(`❌ Помилка мережі: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Оновлення статусу інциденту
  const handleUpdateIncident = async (incidentId, newStatus, message, nextUpdateDue) => {
    try {
      setLoading(true);
      const res = await fetch('/api/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_incident',
          incidentId,
          status: newStatus,
          message,
          nextUpdateDue,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`🔄 Інцидент ${incidentId} переведено у статус: ${newStatus}`);
        fetchStatus();
      }
    } catch (err) {
      setActionMessage(`❌ Помилка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Закриття інциденту (Resolve)
  const handleResolveIncident = async (incidentId) => {
    try {
      setLoading(true);
      const res = await fetch('/api/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve_incident',
          incidentId,
          resolutionMessage: 'Всі сервіси відновлено, метрики повернулися до стандартних значень.',
          rootCause: 'Пікове навантаження на чергу повідомлень бази даних.',
          correctiveActions: 'Оптимізовано кешування запитів та збільшено пул коннектів.',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`✅ Інцидент ${incidentId} успішно вирішено та переміщено в архів з Post-Incident звітом!`);
        fetchStatus();
      }
    } catch (err) {
      setActionMessage(`❌ Помилка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Пряма зміна статусу компонента
  const handleToggleComponent = async (componentId, currentStatus) => {
    const nextStatus = currentStatus === 'operational' ? 'degraded' : currentStatus === 'degraded' ? 'outage' : 'operational';
    try {
      setLoading(true);
      const res = await fetch('/api/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_component_status',
          componentId,
          newStatus: nextStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`⚙️ Статус компонента "${componentId}" змінено на ${nextStatus}.`);
        fetchStatus();
      }
    } catch (err) {
      setActionMessage(`❌ Помилка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const overall = statusData?.overall;

  return (
    <div
      id="academy-public-status-section"
      className={`academy-skills-section my-8 p-6 rounded-2xl bg-slate-900/90 border border-emerald-500/30 shadow-2xl backdrop-blur-md text-slate-100 ${
        isStandalone ? 'max-w-5xl mx-auto my-12' : ''
      }`}
    >
      {/* Заголовок та метадані */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              SCRUM-114
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Reliability UX
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Zero Leakage Shield
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Child & Parent Friendly
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span>🌐 Public Status & Incident Communication</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Публічний моніторинг сервісів платформи Duck Verse: прозоре пояснення збоїв для дітей та батьків без витоку технічних секретів.
          </p>
        </div>

        {/* Uptime & Refresh */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-950/60 px-4 py-2 rounded-xl border border-slate-800 text-right">
            <div className="text-[11px] text-slate-400">90-Day Uptime</div>
            <div className="text-sm font-black text-emerald-400">{statusData?.uptime90Days || '99.94%'}</div>
          </div>
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700"
            title="Оновити статус"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Повідомлення */}
      {actionMessage && (
        <div className="mt-4 p-3 rounded-xl bg-slate-800/80 border border-emerald-500/40 text-sm text-emerald-200 flex items-center justify-between animate-fadeIn">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage('')} className="text-slate-400 hover:text-white ml-3">
            ✕
          </button>
        </div>
      )}

      {/* Головний банер загального статусу */}
      <div
        className={`mt-6 p-5 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
          overall?.code === 'MAJOR_OUTAGE'
            ? 'bg-rose-950/40 border-rose-600/50 text-rose-200'
            : overall?.code === 'PARTIAL_DEGRADATION'
            ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
            : overall?.code === 'UNDER_MAINTENANCE'
            ? 'bg-blue-950/40 border-blue-500/50 text-blue-200'
            : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
        }`}
      >
        <div className="flex items-center gap-4">
          <span className="text-4xl">{overall?.indicator || '🟢'}</span>
          <div>
            <h3 className="text-lg font-black text-white">{overall?.label || 'Всі системи працюють стабільно'}</h3>
            <p className="text-xs opacity-90 mt-0.5">{overall?.description}</p>
          </div>
        </div>
        <div className="hidden sm:block text-right text-xs opacity-60">
          Оновлено: {new Date(statusData?.lastCheckedAt || Date.now()).toLocaleTimeString()}
        </div>
      </div>

      {/* Навігаційні таби */}
      <div className="flex flex-wrap gap-2 mt-6 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('status')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'status'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          🖥️ Статус компонентів
        </button>
        <button
          onClick={() => setActiveTab('incidents')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all relative ${
            activeTab === 'incidents'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          🚨 Активні інциденти
          {statusData?.activeIncidents?.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-rose-500 text-white font-bold rounded-full animate-pulse">
              {statusData.activeIncidents.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'simulator'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          🧪 Симулятор життєвого циклу (Ops)
        </button>
        <button
          onClick={() => setActiveTab('archive')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'archive'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          📜 Архів інцидентів & Post-Mortem
        </button>
      </div>

      {/* ВМІСТ ТАБІВ */}
      <div className="mt-6">
        {/* ТАБ 1: СТАТУС КОМПОНЕНТІВ */}
        {activeTab === 'status' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {statusData?.components?.map((comp) => {
                const isOp = comp.status === 'operational';
                const isDeg = comp.status === 'degraded';
                const isOut = comp.status === 'outage';
                return (
                  <div
                    key={comp.id}
                    className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-white">{comp.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isOp
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : isDeg
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : isOut
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {isOp ? '🟢 OPERATIONAL' : isDeg ? '🟡 DEGRADED' : isOut ? '🔴 OUTAGE' : '🔵 MAINTENANCE'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mb-3">{comp.description}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Останнє оновлення: {new Date(comp.updatedAt).toLocaleTimeString()}</span>
                      <button
                        onClick={() => handleToggleComponent(comp.id, comp.status)}
                        className="text-[10px] text-slate-400 hover:text-cyan-400 underline"
                        title="Змінити статус для перевірки"
                      >
                        Тест статусу
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ТАБ 2: АКТИВНІ ІНЦИДЕНТИ */}
        {activeTab === 'incidents' && (
          <div className="space-y-4">
            {statusData?.activeIncidents?.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-950/40 border border-slate-800 text-center space-y-2">
                <span className="text-4xl">🎉</span>
                <h4 className="text-base font-bold text-white">Всі системи працюють без нарікань!</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  На даний момент жодних активних інцидентів не зафіксовано. Усі ігри та навчальні модулі доступні для проходження.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {statusData.activeIncidents.map((inc) => (
                  <div key={inc.id} className="p-5 rounded-2xl bg-slate-950/70 border border-amber-500/40 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                          {inc.id}
                        </span>
                        <h4 className="font-bold text-base text-white">{inc.title}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                          {inc.severity}
                        </span>
                        <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                          {inc.status}
                        </span>
                      </div>
                    </div>

                    {/* Пояснення впливу для дітей/батьків */}
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                      <strong className="text-cyan-400">Вплив на користувачів (Impact): </strong>
                      <span className="text-slate-300">{inc.impactSummary}</span>
                    </div>

                    {/* Час початку та Next Update */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                      <span>Початок: {new Date(inc.startedAt).toLocaleString()}</span>
                      {inc.nextUpdateDue && (
                        <span className="text-amber-300 font-semibold">
                          ⏳ Наступне оновлення: {inc.nextUpdateDue}
                        </span>
                      )}
                    </div>

                    {/* Хронологія повідомлень */}
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <div className="text-xs font-bold text-slate-400">Хронологія оновлень (Timeline):</div>
                      <div className="space-y-1.5">
                        {inc.updates.map((u) => (
                          <div key={u.id} className="text-xs font-mono bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                            <span className="text-slate-500">[{new Date(u.timestamp).toLocaleTimeString()}]</span>{' '}
                            <strong className="text-cyan-400">[{u.status.toUpperCase()}]: </strong>
                            <span className="text-slate-300">{u.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Кнопки операцій */}
                    <div className="pt-3 border-t border-slate-800 flex flex-wrap gap-2">
                      {inc.status === 'investigating' && (
                        <button
                          onClick={() =>
                            handleUpdateIncident(
                              inc.id,
                              'identified',
                              'Причину збою виявлено. Інженери підготували патч виправлення.',
                              'протягом 15 хвилин'
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md transition-all"
                        >
                          🔍 Перевести в Identified
                        </button>
                      )}
                      {inc.status === 'identified' && (
                        <button
                          onClick={() =>
                            handleUpdateIncident(
                              inc.id,
                              'monitoring',
                              'Патч розгорнуто. Спостерігаємо за стабілізацією сервісу.',
                              'протягом 10 хвилин'
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-md transition-all"
                        >
                          👀 Перевести в Monitoring
                        </button>
                      )}
                      <button
                        onClick={() => handleResolveIncident(inc.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md transition-all"
                      >
                        ✅ Закрити інцидент (Resolve)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ТАБ 3: СИМУЛЯТОР ЖИТТЄВОГО ЦИКЛУ */}
        {activeTab === 'simulator' && (
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-emerald-400">
              🧪 Симулятор реєстрації інциденту (Platform Incident Lifecycle)
            </h3>
            <p className="text-xs text-slate-400">
              Створіть тестовий інцидент, щоб перевірити, як оновлюється статус компонентів, як працює захист від витоку секретів (Zero Leakage Shield) та формуються сповіщення для батьків і дітей.
            </p>

            <form onSubmit={handleReportIncident} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-slate-400 mb-1">Заголовок інциденту:</label>
                  <input
                    type="text"
                    value={incTitle}
                    onChange={(e) => setIncTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Рівень тяжкості:</label>
                  <select
                    value={incSeverity}
                    onChange={(e) => setIncSeverity(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  >
                    <option value="MINOR">MINOR (Незначний)</option>
                    <option value="MAJOR">MAJOR (Помірний)</option>
                    <option value="CRITICAL">CRITICAL (Критичний)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-slate-400 mb-1">Зрозумілий опис впливу (User Impact):</label>
                  <input
                    type="text"
                    value={incImpact}
                    onChange={(e) => setIncImpact(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Вражений компонент:</label>
                  <select
                    value={incComponent}
                    onChange={(e) => setIncComponent(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  >
                    <option value="scores">scores (Таблиця рекордів)</option>
                    <option value="games">games (Ігрові рушії)</option>
                    <option value="auth">auth (Аутентифікація)</option>
                    <option value="learning">learning (Duck Academy)</option>
                    <option value="hub">hub (Ігровий Хаб)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white shadow-md transition-all"
              >
                🚀 Зареєструвати новий інцидент
              </button>
            </form>
          </div>
        )}

        {/* ТАБ 4: АРХІВ ТА POST-MORTEM */}
        {activeTab === 'archive' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-300">📜 Архів вирішених інцидентів та Post-Incident Reviews</h3>
            {statusData?.resolvedIncidents?.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-500">
                Архів інцидентів порожній.
              </div>
            ) : (
              <div className="space-y-3">
                {statusData.resolvedIncidents.map((inc) => (
                  <div key={inc.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                          {inc.id}
                        </span>
                        <h4 className="font-bold text-sm text-white">{inc.title}</h4>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        RESOLVED ({inc.postMortem?.downtimeMinutes || 0} хв)
                      </span>
                    </div>

                    <p className="text-xs text-slate-400">{inc.impactSummary}</p>

                    {inc.postMortem && (
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1">
                        <div>
                          <strong className="text-amber-400">Коренева причина (Root Cause): </strong>
                          <span className="text-slate-300">{inc.postMortem.rootCause}</span>
                        </div>
                        <div>
                          <strong className="text-emerald-400">Запобіжні заходи (Corrective Actions): </strong>
                          <span className="text-slate-300">{inc.postMortem.correctiveActions}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Закрито: {new Date(inc.resolvedAt).toLocaleString()}</span>
                      {inc.postIncidentUrl && (
                        <span className="text-cyan-400 font-mono">
                          🔗 Post-Incident Review: {inc.postIncidentUrl}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
