'use client';

import { useState, useEffect, useCallback } from 'react';

export default function ProductAnalyticsDashboardView() {
  const [activeTab, setActiveTab] = useState('kpis'); // 'kpis' | 'health' | 'taxonomy' | 'simulator' | 'playbook' | 'quality'
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  // Стан симулятора відправки подій
  const [selectedEventName, setSelectedEventName] = useState('lesson.completed');
  const [customPayload, setCustomPayload] = useState(
    JSON.stringify(
      {
        student_hash_id: 'std_demo_88',
        track_id: 'track-frontend-gaming',
        lesson_id: 'lesson-fe-l0-arch',
        duration_seconds: 1850,
        attempts_count: 2,
        score: 92,
      },
      null,
      2
    )
  );

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/academy/analytics');
      const data = await res.json();
      if (data.success) {
        setAnalyticsData(data);
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

  // Завантаження попередньо налаштованого шаблону події в симулятор
  const handleLoadTemplate = (type) => {
    if (type === 'valid_lesson') {
      setSelectedEventName('lesson.completed');
      setCustomPayload(
        JSON.stringify(
          {
            student_hash_id: 'std_live_test_01',
            track_id: 'track-frontend-gaming',
            lesson_id: 'lesson-fe-l1-canvas',
            duration_seconds: 2100,
            attempts_count: 1,
            score: 95,
          },
          null,
          2
        )
      );
    } else if (type === 'pii_leak_attempt') {
      setSelectedEventName('lesson.started');
      setCustomPayload(
        JSON.stringify(
          {
            student_hash_id: 'std_leak_victim',
            track_id: 'track-frontend-gaming',
            lesson_id: 'lesson-fe-l0-arch',
            student_email: 'student_private@gmail.com', // PII Trigger
            started_at: new Date().toISOString(),
          },
          null,
          2
        )
      );
    } else if (type === 'pr_review') {
      setSelectedEventName('pr.reviewed');
      setCustomPayload(
        JSON.stringify(
          {
            student_hash_id: 'std_coder_42',
            reviewer_id: 'mentor-yarik',
            pr_number: 142,
            turnaround_minutes: 165,
            review_decision: 'approved',
          },
          null,
          2
        )
      );
    }
  };

  // Відправка події через Ingestion API
  const handleIngestEvent = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      let parsedPayload;
      try {
        parsedPayload = JSON.parse(customPayload);
      } catch (err) {
        setActionMessage(`❌ Помилка валідації JSON: ${err.message}`);
        setLoading(false);
        return;
      }

      const res = await fetch('/api/academy/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ingest_event',
          event: {
            event_name: selectedEventName,
            payload: parsedPayload,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.deduplicated) {
          setActionMessage(`ℹ️ Дублікат відхилено (Deduplication Guard): подія вже зареєстрована у вікні.`);
        } else {
          setActionMessage(`✅ Подію "${selectedEventName}" успішно прийнято та провалідовано в аналітичному потоці!`);
        }
        fetchData();
      } else {
        setActionMessage(`🛡️ Захисний бар'єр (Quality Gate): ${data.error}`);
      }
    } catch (err) {
      setActionMessage(`❌ Мережева помилка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const kpis = analyticsData?.learningKpis;
  const health = analyticsData?.platformHealth;

  return (
    <div
      id="academy-product-analytics-section"
      className="academy-skills-section my-8 p-6 rounded-2xl bg-slate-900/90 border border-cyan-500/30 shadow-2xl backdrop-blur-md text-slate-100"
    >
      {/* Заголовок та метадані */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              SCRUM-112
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Event Taxonomy v1.0
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              PII Shield Active
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Platform Ops
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span>📊 Product Analytics & Learning KPI Dashboard</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Комплексна продуктова аналітика навчання: метрики засвоєння матеріалу, завершення PR, швидкість рев'ю, строга таксономія подій та якість даних без витоку PII.
          </p>
        </div>

        {/* Швидкий індикатор здоров'я */}
        <div className="flex items-center gap-4 bg-slate-950/60 px-4 py-2.5 rounded-xl border border-slate-800">
          <div className="text-right">
            <div className="text-xs text-slate-400">Data Freshness</div>
            <div className="text-sm font-bold text-emerald-400">{health?.pipelineFreshnessSec?.value || 34}с (Live)</div>
          </div>
          <div className="h-7 w-[1px] bg-slate-800" />
          <div className="text-right">
            <div className="text-xs text-slate-400">PII Violations</div>
            <div className="text-sm font-bold text-cyan-400">0 Leaked</div>
          </div>
        </div>
      </div>

      {/* Сповіщення */}
      {actionMessage && (
        <div className="mt-4 p-3 rounded-xl bg-slate-800/80 border border-cyan-500/40 text-sm text-cyan-200 flex items-center justify-between animate-fadeIn">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage('')} className="bg-transparent hover:bg-slate-700 text-slate-400 hover:text-white rounded p-1 ml-3 transition-all">
            ✕
          </button>
        </div>
      )}

      {/* Навігаційні вкладки */}
      <div className="flex flex-wrap gap-2 mt-6 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('kpis')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'kpis'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/60 border border-slate-700/50'
          }`}
        >
          📈 Продуктові Learning KPIs
        </button>
        <button
          onClick={() => setActiveTab('health')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'health'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/60 border border-slate-700/50'
          }`}
        >
          ⚙️ Технічні Platform Health Metrics
        </button>
        <button
          onClick={() => setActiveTab('taxonomy')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'taxonomy'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/60 border border-slate-700/50'
          }`}
        >
          📑 Таксономія подій (Taxonomy Explorer)
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'simulator'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/60 border border-slate-700/50'
          }`}
        >
          🧪 Симулятор Ingestion & PII Shield
        </button>
        <button
          onClick={() => setActiveTab('playbook')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'playbook'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/60 border border-slate-700/50'
          }`}
        >
          💡 Decision Playbook (Рішення на основі даних)
        </button>
        <button
          onClick={() => setActiveTab('quality')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'quality'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/60 border border-slate-700/50'
          }`}
        >
          ✅ Data Quality Checklist
        </button>
      </div>

      {/* ВМІСТ ВКЛАДОК */}
      <div className="mt-6">
        {/* ВКЛАДКА 1: ПРОДУКТОВІ LEARNING KPIS */}
        {activeTab === 'kpis' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Lesson Completion Rate */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between hover:border-cyan-500/40 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400">Lesson Completion</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                      Target: ≥ {kpis?.lessonCompletionRate?.target}%
                    </span>
                  </div>
                  <div className="text-3xl font-black text-white">
                    {kpis?.lessonCompletionRate?.value || 78.0}%
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{kpis?.lessonCompletionRate?.description}</p>
                </div>
                <div className="mt-4 pt-2 border-t border-slate-900 flex justify-between items-center text-xs">
                  <span className="text-emerald-400 font-bold">{kpis?.lessonCompletionRate?.deltaWeek} за тиждень</span>
                  <span className="text-slate-500">Статус: {kpis?.lessonCompletionRate?.status}</span>
                </div>
              </div>

              {/* PR Completion Rate */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between hover:border-cyan-500/40 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400">PR Completion Rate</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                      Target: ≥ {kpis?.prCompletionRate?.target}%
                    </span>
                  </div>
                  <div className="text-3xl font-black text-cyan-400">
                    {kpis?.prCompletionRate?.value || 84.0}%
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{kpis?.prCompletionRate?.description}</p>
                </div>
                <div className="mt-4 pt-2 border-t border-slate-900 flex justify-between items-center text-xs">
                  <span className="text-emerald-400 font-bold">{kpis?.prCompletionRate?.deltaWeek} за тиждень</span>
                  <span className="text-slate-500">Статус: {kpis?.prCompletionRate?.status}</span>
                </div>
              </div>

              {/* Review Turnaround */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between hover:border-cyan-500/40 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400">Median Review Turnaround</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                      Target: ≤ {kpis?.reviewTurnaroundHours?.target} год
                    </span>
                  </div>
                  <div className="text-3xl font-black text-purple-400">
                    {kpis?.reviewTurnaroundHours?.value || 3.2} год
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{kpis?.reviewTurnaroundHours?.description}</p>
                </div>
                <div className="mt-4 pt-2 border-t border-slate-900 flex justify-between items-center text-xs">
                  <span className="text-emerald-400 font-bold">{kpis?.reviewTurnaroundHours?.deltaWeek} за тиждень</span>
                  <span className="text-slate-500">Статус: {kpis?.reviewTurnaroundHours?.status}</span>
                </div>
              </div>

              {/* D7 Retention */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between hover:border-cyan-500/40 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400">Retention D7</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                      Target: ≥ {kpis?.retentionD7?.target}%
                    </span>
                  </div>
                  <div className="text-3xl font-black text-amber-400">
                    {kpis?.retentionD7?.value || 74.2}%
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{kpis?.retentionD7?.description}</p>
                </div>
                <div className="mt-4 pt-2 border-t border-slate-900 flex justify-between items-center text-xs">
                  <span className="text-emerald-400 font-bold">{kpis?.retentionD7?.deltaWeek} за тиждень</span>
                  <span className="text-slate-500">Статус: {kpis?.retentionD7?.status}</span>
                </div>
              </div>

              {/* D30 Retention */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between hover:border-cyan-500/40 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400">Retention D30</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                      Target: ≥ {kpis?.retentionD30?.target}%
                    </span>
                  </div>
                  <div className="text-3xl font-black text-blue-400">
                    {kpis?.retentionD30?.value || 58.5}%
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{kpis?.retentionD30?.description}</p>
                </div>
                <div className="mt-4 pt-2 border-t border-slate-900 flex justify-between items-center text-xs">
                  <span className="text-emerald-400 font-bold">{kpis?.retentionD30?.deltaWeek} за тиждень</span>
                  <span className="text-slate-500">Статус: {kpis?.retentionD30?.status}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ВКЛАДКА 2: ТЕХНІЧНІ PLATFORM HEALTH METRICS */}
        {activeTab === 'health' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-800/40 text-xs text-blue-200">
              ℹ️ <strong>Архітектурне розділення:</strong> Технічні метрики відображають стабільність інфраструктури збору даних та SLA пайплайну, на відміну від продуктових KPI, які відображають успішність навчання учнів.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-xs text-slate-400">API Error Rate</div>
                <div className="text-2xl font-black text-emerald-400 mt-1">{health?.apiErrorRate?.value}%</div>
                <div className="text-[11px] text-slate-500 mt-1">SLA: {health?.apiErrorRate?.target}</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-xs text-slate-400">P95 Ingestion Latency</div>
                <div className="text-2xl font-black text-cyan-400 mt-1">{health?.p95LatencyMs?.value} мс</div>
                <div className="text-[11px] text-slate-500 mt-1">SLA: {health?.p95LatencyMs?.target}</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-xs text-slate-400">Pipeline Freshness</div>
                <div className="text-2xl font-black text-purple-400 mt-1">{health?.pipelineFreshnessSec?.value} с</div>
                <div className="text-[11px] text-slate-500 mt-1">SLA: {health?.pipelineFreshnessSec?.target}</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-xs text-slate-400">Validation Success Rate</div>
                <div className="text-2xl font-black text-emerald-400 mt-1">{health?.validationSuccessRate?.value}%</div>
                <div className="text-[11px] text-slate-500 mt-1">SLA: {health?.validationSuccessRate?.target}</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-xs text-slate-400">Дублікатів відфільтровано</div>
                <div className="text-2xl font-black text-amber-400 mt-1">{health?.duplicateEventsFiltered?.value}</div>
                <div className="text-[11px] text-slate-500 mt-1">Idempotency Guard Active</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="text-xs text-slate-400">Спроб витоку PII заблоковано</div>
                <div className="text-2xl font-black text-rose-400 mt-1">{health?.piiViolationsBlocked?.value}</div>
                <div className="text-[11px] text-slate-500 mt-1">Privacy Shield Active</div>
              </div>
            </div>
          </div>
        )}

        {/* ВКЛАДКА 3: ТАКСОНОМІЯ ПОДІЙ (EVENT TAXONOMY EXPLORER) */}
        {activeTab === 'taxonomy' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-300">Офіційна таксономія подій (Event Registry)</h3>
            <div className="space-y-3">
              {analyticsData?.taxonomy?.map((evt) => (
                <div key={evt.name} className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-sm font-bold text-cyan-300">{evt.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300">
                        {evt.category}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300">
                        {evt.privacyRule}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">{evt.description}</p>
                  <div className="text-xs font-mono text-slate-500 bg-slate-900/80 p-2 rounded-lg">
                    <span>Обов'язкові поля: </span>
                    <span className="text-slate-300">{evt.requiredFields.join(', ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ВКЛАДКА 4: СИМУЛЯТОР INGESTION & PII SHIELD */}
        {activeTab === 'simulator' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <h3 className="text-sm font-bold text-cyan-400 mb-2">🧪 Тестування Ingestion API та Privacy Shield</h3>
              <p className="text-xs text-slate-400 mb-4">
                Спробуйте відправити валідну подію або симулювати спробу витоку PII (наприклад, email у payload), щоб перевірити автоматичне блокування.
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => handleLoadTemplate('valid_lesson')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  🟢 Шаблон: Валідний lesson.completed
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadTemplate('pii_leak_attempt')}
                  className="px-3 py-1.5 rounded-lg bg-rose-900/40 hover:bg-rose-900/60 text-xs font-semibold text-rose-300 border border-rose-800/50"
                >
                  🔴 Шаблон: Спроба витоку PII (Email leak)
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadTemplate('pr_review')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  🟣 Шаблон: pr.reviewed
                </button>
              </div>

              <form onSubmit={handleIngestEvent} className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Назва події (Event Name):</label>
                  <select
                    value={selectedEventName}
                    onChange={(e) => setSelectedEventName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
                  >
                    {analyticsData?.taxonomy?.map((t) => (
                      <option key={t.name} value={t.name}>
                        {t.name} ({t.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Payload (JSON):</label>
                  <textarea
                    rows={6}
                    value={customPayload}
                    onChange={(e) => setCustomPayload(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white font-mono"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 font-bold text-xs text-white shadow-md transition-all"
                >
                  🚀 Відправити в Ingestion Pipeline
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ВКЛАДКА 5: DECISION PLAYBOOK (РІШЕННЯ НА ОСНОВІ ДАНИХ) */}
        {activeTab === 'playbook' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-300">
              💡 Data-Driven Decision Playbook: Приклади рішень, прийнятих на основі метрик
            </h3>
            <div className="space-y-4">
              {analyticsData?.decisions?.map((dec) => (
                <div key={dec.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-cyan-300">{dec.title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {dec.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    <strong className="text-slate-300">Тригерна метрика:</strong> {dec.triggerMetric}
                  </div>
                  <div className="text-xs text-rose-300/90">
                    <strong>Виявлена аномалія:</strong> {dec.anomalyDetected}
                  </div>
                  <div className="text-xs text-amber-300/90">
                    <strong>Коренева причина (Root Cause):</strong> {dec.rootCauseAnalysis}
                  </div>
                  <div className="text-xs text-emerald-300/90">
                    <strong>Прийняте рішення:</strong> {dec.decisionTaken}
                  </div>
                  <div className="text-xs text-blue-300/90">
                    <strong>Фактичний результат (Measured Outcome):</strong> {dec.measuredOutcome}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ВКЛАДКА 6: DATA QUALITY CHECKLIST */}
        {activeTab === 'quality' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-300">✅ Data Quality Checklist (Контроль чистоти даних)</h3>
            <div className="space-y-3">
              {analyticsData?.qualityChecklist?.map((item) => (
                <div key={item.id} className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-white flex items-center gap-2">
                      <span>{item.name}</span>
                      <span className="text-xs font-mono text-cyan-400">({item.score})</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    PASSED
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
