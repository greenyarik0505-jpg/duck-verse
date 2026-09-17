'use client';

import { useState, useEffect, useCallback } from 'react';

export default function ChildSafeAiPolicyView({ currentUser }) {
  // Активний тестовий суб'єкт (дозволяє перемикатися для демонстрації ролей: дитина, батьки, ментор, адмін)
  const [selectedRole, setSelectedRole] = useState(currentUser?.role || 'child');
  const [activeTab, setActiveTab] = useState('matrix'); // 'matrix' | 'requests' | 'quota' | 'threats'
  const [policyData, setPolicyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  // Форма створення запиту на привілей
  const [reqToolId, setReqToolId] = useState('run_bash_terminal');
  const [reqReason, setReqReason] = useState('Потрібно скомпілювати шейдери та перевірити тести для модуля');

  // Інтерактивний валідатор доступу (Sandbox Check)
  const [testModelId, setTestModelId] = useState('duck-vibe-coder-v1.2');
  const [testToolId, setTestToolId] = useState('read_code_hint');
  const [evalResult, setEvalResult] = useState(null);

  const actorUser = {
    id: selectedRole === 'child' ? 'student-yurko' : selectedRole === 'parent' ? 'parent-olena' : selectedRole === 'mentor' ? 'mentor-yarik' : 'admin-kirill',
    role: selectedRole,
    name: selectedRole === 'child' ? 'Юрко (Учень)' : selectedRole === 'parent' ? 'Олена (Мама)' : selectedRole === 'mentor' ? 'Yarik0505 (Ментор)' : 'admin_kirill (Адмін)',
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/academy/safety/policy?userId=${actorUser.id}&role=${actorUser.role}&name=${encodeURIComponent(actorUser.name)}`);
      const data = await res.json();
      if (data.success) {
        setPolicyData(data);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [actorUser.id, actorUser.role, actorUser.name]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Створення запиту на привілейований інструмент
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (actorUser.role !== 'child') {
      setActionMessage('⚠️ Тільки учень може створювати запит на привілейований доступ.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/academy/safety/policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request_tool_access',
          studentId: actorUser.id,
          studentName: actorUser.name,
          toolId: reqToolId,
          reason: reqReason,
          actor: actorUser,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`✅ Запит на доступ до інструменту успішно надіслано батькам та ментору!`);
        fetchData();
      } else {
        setActionMessage(`❌ Помилка: ${data.error}`);
      }
    } catch (err) {
      setActionMessage(`❌ Помилка мережі: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Розгляд запиту (схвалення / відхилення)
  const handleReviewRequest = async (requestId, decision) => {
    try {
      setLoading(true);
      const res = await fetch('/api/academy/safety/policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'review_tool_access',
          requestId,
          reviewer: actorUser,
          decision,
          notes: decision === 'approved' ? 'Схвалено для виконання практичного завдання' : 'Відхилено за міркуваннями безпеки',
          durationHours: 2,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(
          decision === 'approved'
            ? '🛡️ Привілей схвалено на 2 години! Учень отримав тимчасовий доступ до інструменту.'
            : '🚫 Запит успішно відхилено.'
        );
        fetchData();
      } else {
        setActionMessage(`❌ Блокування ескалації: ${data.error}`);
      }
    } catch (err) {
      setActionMessage(`❌ Помилка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Симуляція споживання квоти
  const handleConsumeQuota = async (tokenAmount = 500) => {
    try {
      setLoading(true);
      const res = await fetch('/api/academy/safety/policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'consume_quota',
          userId: actorUser.id,
          role: actorUser.role,
          requestedTokens: tokenAmount,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`⚡ Виконано безпечний запит до ШІ (-${tokenAmount} токенів). Залишилось: ${data.remainingRequests} запитів.`);
        fetchData();
      } else {
        setActionMessage(`⛔ Добова квота: ${data.error || data.message}`);
      }
    } catch (err) {
      setActionMessage(`❌ Помилка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Перевірка дозволу інструменту/моделі в онлайн пісочниці
  const handleEvaluateAccess = async () => {
    try {
      setLoading(true);
      const [modelRes, toolRes] = await Promise.all([
        fetch('/api/academy/safety/policy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'check_model_access', actor: actorUser, modelId: testModelId }),
        }).then((r) => r.json()),
        fetch('/api/academy/safety/policy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'check_tool_access', actor: actorUser, toolId: testToolId }),
        }).then((r) => r.json()),
      ]);

      setEvalResult({
        modelCheck: modelRes.result,
        toolCheck: toolRes.result,
      });
    } catch (err) {
      setActionMessage(`❌ Помилка оцінки: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="academy-child-safe-ai-policy-section"
      className="academy-skills-section my-8 p-6 rounded-2xl bg-slate-900/90 border border-emerald-500/30 shadow-2xl backdrop-blur-md text-slate-100"
    >
      {/* Заголовок та метадані */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              SCRUM-110
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Policy v2.1.0
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              COPPA & GDPR-K
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Deny-by-Default
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span>🛡️ Child-Safe AI Policy, Roles & Model Controls</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Політика безпеки для дітей: розмежування ролей, доступ до моделей за білим списком, захист від ескалації прав та схвалення привілеїв батьками і менторами.
          </p>
        </div>

        {/* Перемикач активної ролі для перевірки */}
        <div className="flex flex-col items-start lg:items-end gap-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Активна роль для тестування:</span>
          <div className="inline-flex rounded-lg bg-slate-900 p-1 border border-slate-700">
            {['child', 'parent', 'mentor', 'admin'].map((role) => (
              <button
                key={role}
                onClick={() => {
                  setSelectedRole(role);
                  setEvalResult(null);
                }}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  selectedRole === role
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-transparent text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {role === 'child' && '👶 Дитина (Учень)'}
                {role === 'parent' && '👨‍👩‍👦 Батьки'}
                {role === 'mentor' && '🧑‍🏫 Ментор'}
                {role === 'admin' && '👑 Адмін'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Сповіщення про дії */}
      {actionMessage && (
        <div className="mt-4 p-3 rounded-xl bg-slate-800/80 border border-emerald-500/40 text-sm text-emerald-200 flex items-center justify-between animate-fadeIn">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage('')} className="bg-transparent hover:bg-slate-700 text-slate-400 hover:text-white rounded p-1 ml-3 transition-all">
            ✕
          </button>
        </div>
      )}

      {/* Навігаційні таби */}
      <div className="flex flex-wrap gap-2 mt-6 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'matrix'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/60 border border-slate-700/50'
          }`}
        >
          📋 Матриця ролей та інструментів
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all relative ${
            activeTab === 'requests'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/60 border border-slate-700/50'
          }`}
        >
          🔐 Схвалення привілеїв
          {policyData?.requests?.filter((r) => r.status === 'pending').length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-amber-500 text-slate-950 font-black rounded-full animate-pulse">
              {policyData.requests.filter((r) => r.status === 'pending').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('quota')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'quota'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/60 border border-slate-700/50'
          }`}
        >
          📊 Добова квота та ліміти
        </button>
        <button
          onClick={() => setActiveTab('threats')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'threats'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/60 border border-slate-700/50'
          }`}
        >
          🛡️ Модель загроз (Threat Model) & Аудит
        </button>
      </div>

      {/* ВМІСТ ТАБІВ */}
      <div className="mt-6">
        {/* ТАБ 1: МАТРИЦЯ РОЛЕЙ ТА ІНСТРУМЕНТІВ */}
        {activeTab === 'matrix' && (
          <div className="space-y-6">
            {/* Інтерактивний тест доступу */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <h3 className="text-base font-bold text-emerald-400 mb-2 flex items-center gap-2">
                <span>🧪 Симулятор перевірки доступу (Policy Evaluator)</span>
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Перевірте, чи дозволена обрана модель та інструмент для поточної ролі (
                <strong className="text-white">{actorUser.role}</strong>) згідно принципу Deny-by-Default.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Модель ШІ:</label>
                  <select
                    value={testModelId}
                    onChange={(e) => setTestModelId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  >
                    {policyData?.models?.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.tier})
                      </option>
                    ))}
                    <option value="unregistered-evil-gpt">🚫 Незареєстрована модель (Deny-Test)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Інструмент (Tool Scope):</label>
                  <select
                    value={testToolId}
                    onChange={(e) => setTestToolId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  >
                    {policyData?.tools?.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} [{t.scopeType}]
                      </option>
                    ))}
                    <option value="unregistered_root_shell">🚫 Незареєстрований інструмент (Deny-Test)</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleEvaluateAccess}
                    disabled={loading}
                    className="w-full py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white transition-all shadow-md"
                  >
                    🔍 Перевірити дозвіл
                  </button>
                </div>
              </div>

              {evalResult && (
                <div className="mt-4 p-3 rounded-lg bg-slate-900 border border-slate-700 text-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Доступ до моделі:</span>
                    {evalResult.modelCheck.allowed ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                        ✅ ДОЗВОЛЕНО
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                        🚫 ЗАБЛОКОВАНО ({evalResult.modelCheck.code})
                      </span>
                    )}
                    <span className="text-slate-400 text-xs italic">{evalResult.modelCheck.message}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Доступ до інструменту:</span>
                    {evalResult.toolCheck.allowed ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                        ✅ ДОЗВОЛЕНО {evalResult.toolCheck.viaGrant && '(через активний дозвіл)'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                        🔒 ПОТРЕБУЄ СХВАЛЕННЯ ({evalResult.toolCheck.code})
                      </span>
                    )}
                    <span className="text-slate-400 text-xs italic">{evalResult.toolCheck.message}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Каталог інструментів */}
            <div>
              <h3 className="text-sm font-bold text-slate-300 mb-3">Каталог інструментів (AI Tool Scopes)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {policyData?.tools?.map((tool) => {
                  const isSafe = !tool.isPrivileged;
                  const isAllowedForCurrentRole = tool.allowedRoles.includes(actorUser.role);
                  return (
                    <div
                      key={tool.id}
                      className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-sm text-white">{tool.name}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              isSafe
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : tool.scopeType === 'CRITICAL'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {isSafe ? '🟢 SAFE (Дитячий)' : tool.scopeType === 'CRITICAL' ? '🔴 CRITICAL' : '🟡 PRIVILEGED'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mb-2">{tool.description}</p>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-900 text-slate-500">
                        <span>Дозволені ролі: {tool.allowedRoles.join(', ')}</span>
                        {isAllowedForCurrentRole ? (
                          <span className="text-emerald-400 font-semibold">Доступно</span>
                        ) : (
                          <span className="text-amber-400 font-semibold">Потрібен дозвіл</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Каталог моделей */}
            <div>
              <h3 className="text-sm font-bold text-slate-300 mb-3">Реєстр моделей (AI Models Registry)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {policyData?.models?.map((model) => (
                  <div key={model.id} className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-sm text-white">{model.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          model.riskLevel === 'LOW'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : model.riskLevel === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {model.riskLevel === 'LOW' ? '🟢 Kid-Safe' : model.riskLevel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{model.description}</p>
                    <div className="text-xs text-slate-500">
                      <span>Дозволено для: {model.allowedRoles.join(', ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ТАБ 2: СХВАЛЕННЯ ПРИВІЛЕЇВ (APPROVAL WORKFLOW) */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            {/* Форма подачі запиту учнем */}
            {actorUser.role === 'child' ? (
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <h3 className="text-sm font-bold text-emerald-400 mb-2">
                  ✍️ Створити запит на привілейований інструмент
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Учень не може самостійно увімкнути термінал чи запис у файлову систему. Ваш запит буде відправлено батькам або ментору на розгляд.
                </p>
                <form onSubmit={handleCreateRequest} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Потрібний інструмент:</label>
                      <select
                        value={reqToolId}
                        onChange={(e) => setReqToolId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                      >
                        <option value="run_bash_terminal">Виконання у bash-терміналі (Тести/Збірка)</option>
                        <option value="modify_file_system">Модифікація файлової системи (Збереження файлів)</option>
                        <option value="external_network_call">Зовнішні мережеві запити</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Навчальне обґрунтування (Причина):</label>
                      <input
                        type="text"
                        value={reqReason}
                        onChange={(e) => setReqReason(e.target.value)}
                        placeholder="Наприклад: Запуск jest тестів для уроку Canvas 2D"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white shadow-md transition-all"
                  >
                    🚀 Надіслати запит на схвалення
                  </button>
                </form>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/40 text-xs text-blue-200">
                ℹ️ Ви увійшли як <strong>{actorUser.name}</strong> ({actorUser.role}). Ви можете розглядати та схвалювати запити учнів на тимчасовий доступ до привілейованих інструментів.
              </div>
            )}

            {/* Список запитів */}
            <div>
              <h3 className="text-sm font-bold text-slate-300 mb-3">Запити на схвалення привілеїв</h3>
              {policyData?.requests?.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-500">
                  Запитів на схвалення немає.
                </div>
              ) : (
                <div className="space-y-3">
                  {policyData?.requests?.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{req.toolName || req.toolId}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold ${
                              req.status === 'pending'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : req.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {req.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          Учень: <strong className="text-slate-300">{req.studentName}</strong> | Причина: «{req.reason}»
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Створено: {new Date(req.requestedAt).toLocaleTimeString()}
                          {req.reviewedAt && ` | Розглянув: ${req.reviewerName} (${new Date(req.reviewedAt).toLocaleTimeString()})`}
                          {req.reviewNotes && ` [${req.reviewNotes}]`}
                        </p>
                      </div>

                      {/* Кнопки схвалення */}
                      {req.status === 'pending' && (
                        <div className="flex items-center gap-2 shrink-0">
                          {actorUser.role === 'child' ? (
                            <span className="text-xs text-amber-400 italic">Очікує підтвердження ментора/батьків</span>
                          ) : (
                            <>
                              <button
                                onClick={() => handleReviewRequest(req.id, 'approved')}
                                disabled={loading}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white shadow-md transition-all"
                              >
                                ✅ Схвалити (2 год)
                              </button>
                              <button
                                onClick={() => handleReviewRequest(req.id, 'rejected')}
                                disabled={loading}
                                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 font-bold text-xs text-white shadow-md transition-all"
                              >
                                ✕ Відхилити
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Активні привілеї (Active Grants) */}
            {policyData?.activeGrants?.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-emerald-400 mb-3">Діючі привілеї (Active Privilege Grants)</h3>
                <div className="space-y-2">
                  {policyData.activeGrants.map((g) => (
                    <div
                      key={g.id}
                      className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-emerald-300">🔑 {g.toolId}</span>
                        <span className="text-slate-400 ml-2">
                          Схвалено: {g.grantedByName} | Діє до: {new Date(g.expiresAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                        АКТИВНО
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ТАБ 3: ДОБОВА КВОТА ТА ЛІМІТИ */}
        {activeTab === 'quota' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-emerald-400">
                  Добовий ліміт ШІ для ролі: <span className="text-white capitalize">{actorUser.role}</span>
                </h3>
                <span className="text-xs text-slate-400">
                  Використано: {policyData?.quota?.percentUsed || 0}%
                </span>
              </div>

              {/* Прогрес бар запитів */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Запитів сьогодні:</span>
                  <span className="font-bold text-white">
                    {policyData?.quota?.currentRequests || 0} / {policyData?.quota?.maxDailyRequests || 50}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      (policyData?.quota?.percentUsed || 0) > 80 ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${policyData?.quota?.percentUsed || 0}%` }}
                  />
                </div>
              </div>

              {/* Токени */}
              <div className="mt-4 flex justify-between text-xs text-slate-400">
                <span>Використано токенів:</span>
                <span className="font-bold text-slate-300">
                  {policyData?.quota?.currentTokens || 0} / {policyData?.quota?.maxDailyTokens || 15000}
                </span>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => handleConsumeQuota(250)}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 font-semibold text-xs text-white transition-all border border-slate-700"
                >
                  ⚡ Симулювати запит до ШІ (+250 токенів)
                </button>
              </div>
            </div>

            {/* Таблиця лімітів за ролями */}
            <div>
              <h3 className="text-sm font-bold text-slate-300 mb-3">Конфігурація квот за ролями</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {policyData?.roleQuotas &&
                  Object.entries(policyData.roleQuotas).map(([role, q]) => (
                    <div key={role} className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-center">
                      <div className="text-xs font-bold text-slate-400 capitalize mb-1">{role}</div>
                      <div className="text-lg font-black text-emerald-400">{q.maxDailyRequests}</div>
                      <div className="text-[11px] text-slate-500">запитів / день</div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {q.maxDailyTokens.toLocaleString()} токенів
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ТАБ 4: THREAT MODEL & AUDIT LOG */}
        {activeTab === 'threats' && (
          <div className="space-y-6">
            {/* Каталог загроз */}
            <div>
              <h3 className="text-sm font-bold text-slate-300 mb-3">Каталог моделі загроз (Threat Model Matrix)</h3>
              <div className="space-y-3">
                {policyData?.threatCatalog?.map((tm) => (
                  <div key={tm.id} className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-emerald-300">
                        {tm.id}: {tm.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        🛡️ {tm.status}
                      </span>
                    </div>
                    <p className="text-xs text-rose-300/90">
                      <strong>Вектор загрози:</strong> {tm.threat}
                    </p>
                    <p className="text-xs text-slate-400">
                      <strong>Захисний механізм:</strong> {tm.mitigation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Журнал аудиту */}
            <div>
              <h3 className="text-sm font-bold text-slate-300 mb-3">Журнал аудиту безпеки (Policy Audit Trail)</h3>
              <div className="max-h-64 overflow-y-auto space-y-1.5 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                {policyData?.auditLog?.length === 0 ? (
                  <div className="text-xs text-slate-500 text-center py-2">Журнал аудиту порожній.</div>
                ) : (
                  policyData?.auditLog?.map((log) => (
                    <div key={log.id} className="text-[11px] font-mono text-slate-400 border-b border-slate-900 pb-1 flex justify-between">
                      <span>
                        <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                        <strong className="text-emerald-400">{log.eventType}</strong> by {log.actorName} ({log.actorRole})
                        {log.threatTag && <span className="ml-1 text-rose-400">[{log.threatTag}]</span>}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
