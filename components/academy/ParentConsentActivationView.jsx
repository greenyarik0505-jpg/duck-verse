'use client';

import React, { useState, useEffect, useCallback, useId } from 'react';

export default function ParentConsentActivationView() {
  const [accounts, setAccounts] = useState([]);
  const [scopes, setScopes] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [policyVersion, setPolicyVersion] = useState('v1.2-2026-child-safety');
  const [loading, setLoading] = useState(true);

  // Form states
  const [newUsername, setNewUsername] = useState('');
  const [newAge, setNewAge] = useState(10);
  const [newParentEmail, setNewParentEmail] = useState('');
  const [lastCreatedToken, setLastCreatedToken] = useState(null);

  // Selected account for testing feature access
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedFeatureKey, setSelectedFeatureKey] = useState('social_chat');
  const [testAccessResult, setTestAccessResult] = useState(null);

  // Custom scopes selection for approval
  const [approvingScopes, setApprovingScopes] = useState({});

  const usernameInputId = useId();
  const ageInputId = useId();
  const parentEmailInputId = useId();
  const accountSelectId = useId();
  const featureSelectId = useId();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/academy/identity/consent');
      const data = await res.json();
      if (data.success) {
        setAccounts(data.accounts || []);
        setScopes(data.scopes || []);
        setPolicyVersion(data.policyVersion || 'v1.2');
        setAuditLogs(data.auditLogs || []);
        if (data.accounts?.length > 0) {
          setSelectedAccountId(prev => prev || data.accounts[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load consent data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!newUsername.trim()) return;

    try {
      const res = await fetch('/api/academy/identity/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request_consent',
          childUsername: newUsername.trim(),
          age: Number(newAge),
          parentEmail: newParentEmail.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLastCreatedToken(data.rawToken);
        setNewUsername('');
        fetchData();
      } else {
        alert(data.error || 'Помилка реєстрації');
      }
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  const handleApprove = async (accId, tokenToUse) => {
    try {
      const chosenScopes = approvingScopes[accId] || scopes.map(s => s.id);
      const res = await fetch('/api/academy/identity/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve_consent',
          accountId: accId,
          token: tokenToUse,
          scopesGranted: chosenScopes,
          parentName: 'Батьки (Portal Approval)',
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || 'Помилка погодження');
      }
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };

  const handleReject = async (accId) => {
    try {
      const res = await fetch('/api/academy/identity/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject_consent',
          accountId: accId,
          reason: 'Батьки відхилили запит на активацію в порталі',
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Reject failed:', err);
    }
  };

  const handleRevoke = async (accId) => {
    try {
      const res = await fetch('/api/academy/identity/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revoke_consent',
          accountId: accId,
          reason: 'Згода відкликана через панель батьківського контролю',
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Revoke failed:', err);
    }
  };

  const handleCheckAccess = async () => {
    if (!selectedAccountId) return;
    try {
      const res = await fetch('/api/academy/identity/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check_access',
          accountId: selectedAccountId,
          featureKey: selectedFeatureKey,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestAccessResult(data.access);
      }
    } catch (err) {
      console.error('Access check failed:', err);
    }
  };

  const toggleScopeSelection = (accId, scopeId) => {
    setApprovingScopes(prev => {
      const current = prev[accId] || scopes.map(s => s.id);
      if (current.includes(scopeId)) {
        return { ...prev, [accId]: current.filter(id => id !== scopeId) };
      } else {
        return { ...prev, [accId]: [...current, scopeId] };
      }
    });
  };

  const pendingCount = accounts.filter(a => a.status === 'pending').length;
  const approvedCount = accounts.filter(a => a.status === 'approved').length;
  const rejectedCount = accounts.filter(a => a.status === 'rejected').length;
  const expiredCount = accounts.filter(a => a.status === 'expired').length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🛡️</span>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Батьківська згода та вікова активація
              </h2>
              <p className="text-sm text-slate-400">
                Age-appropriate activation workflow, рольові дозволи та захист приватності неповнолітніх
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/80">
            COPPA / GDPR-K Ready
          </span>
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/80">
            Політика: {policyVersion}
          </span>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Очікує згоди</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{pendingCount}</div>
          <div className="text-[11px] text-amber-500/80 mt-1">Потребує підтвердження</div>
        </div>
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Активовано</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{approvedCount}</div>
          <div className="text-[11px] text-emerald-500/80 mt-1">Згода надана або 13+</div>
        </div>
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Відхилено / Revoked</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{rejectedCount}</div>
          <div className="text-[11px] text-rose-500/80 mt-1">Обмежений режим</div>
        </div>
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Прострочено</div>
          <div className="text-2xl font-bold text-slate-400 mt-1">{expiredCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Час токена вичерпано</div>
        </div>
      </div>

      {/* State Machine Diagram */}
      <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <span>🔄</span> Життєвий цикл активації акаунта (State Machine)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900/90 border border-amber-900/40 rounded-lg p-3 space-y-1">
            <div className="font-bold text-amber-400 flex items-center justify-between">
              <span>1. Pending Approval</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">State</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Дитина &lt; 13 років реєструється. Генерується SHA-256 токен згоди, надсилається email батькам.
            </p>
          </div>
          <div className="bg-slate-900/90 border border-emerald-900/40 rounded-lg p-3 space-y-1">
            <div className="font-bold text-emerald-400 flex items-center justify-between">
              <span>2. Approved</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">State</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Батьки погоджують умови й обирають доступні дозволи. Розблоковуються соціальні та ШІ-функції.
            </p>
          </div>
          <div className="bg-slate-900/90 border border-rose-900/40 rounded-lg p-3 space-y-1">
            <div className="font-bold text-rose-400 flex items-center justify-between">
              <span>3. Rejected / Revoked</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">State</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Батьки відхиляють запит або відкликають згоду в будь-який момент. Залишається лише офлайн-навчання.
            </p>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 space-y-1">
            <div className="font-bold text-slate-300 flex items-center justify-between">
              <span>4. Expired</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">State</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Якщо токен не підтверджено протягом 48 годин, запит стає недійсним і потребує перевипуску.
            </p>
          </div>
        </div>
      </div>

      {/* Main interactive grid: Left Registration & Simulator, Right Verification Portal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Account Creation & Age Gate (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Registration Box */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
              <span>👶</span> Віковий шлюз та реєстрація
            </h3>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor={usernameInputId} className="block text-xs font-medium text-slate-400 mb-1">
                  Ім’я користувача (Child Username)
                </label>
                <input
                  id={usernameInputId}
                  type="text"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  placeholder="наприклад, danilo_game"
                  className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor={ageInputId} className="text-xs font-medium text-slate-400">
                    Вік студента: <span className="text-white font-bold">{newAge} років</span>
                  </label>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                    newAge < 13 ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}>
                    {newAge < 13 ? 'Потрібна згода батьків (< 13)' : '13+ Пряма активація'}
                  </span>
                </div>
                <input
                  id={ageInputId}
                  type="range"
                  min="7"
                  max="18"
                  value={newAge}
                  onChange={e => setNewAge(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              {newAge < 13 && (
                <div>
                  <label htmlFor={parentEmailInputId} className="block text-xs font-medium text-slate-400 mb-1">
                    Email батьків / опікуна (для відправки токена)
                  </label>
                  <input
                    id={parentEmailInputId}
                    type="email"
                    value={newParentEmail}
                    onChange={e => setNewParentEmail(e.target.value)}
                    placeholder="parent@example.com"
                    className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    🔒 Email маскується при збереженні (мінімізація персональних даних).
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-sm transition-all shadow-md"
              >
                {newAge < 13 ? 'Ініціювати запит згоди батьків' : 'Створити акаунт 13+'}
              </button>
            </form>

            {lastCreatedToken && (
              <div className="bg-amber-950/40 border border-amber-800/80 rounded-lg p-3 text-xs space-y-1">
                <div className="text-amber-300 font-semibold flex items-center gap-1">
                  <span>✉️</span> Згенеровано тестовий токен згоди:
                </div>
                <div className="font-mono bg-slate-900 px-2 py-1 rounded text-cyan-300 select-all">
                  {lastCreatedToken}
                </div>
                <p className="text-slate-400 text-[11px]">
                  Скопіюйте цей токен або використайте кнопку погодження нижче.
                </p>
              </div>
            )}
          </div>

          {/* Feature Access Simulator */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
              <span>🧪</span> Симулятор перевірки доступу до функцій
            </h3>
            <div className="space-y-3">
              <div>
                <label htmlFor={accountSelectId} className="block text-xs font-medium text-slate-400 mb-1">
                  Виберіть тестовий акаунт:
                </label>
                <select
                  id={accountSelectId}
                  value={selectedAccountId}
                  onChange={e => {
                    setSelectedAccountId(e.target.value);
                    setTestAccessResult(null);
                  }}
                  className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.childUsername} ({acc.age} р.) — [{acc.status.toUpperCase()}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor={featureSelectId} className="block text-xs font-medium text-slate-400 mb-1">
                  Цільова функція:
                </label>
                <select
                  id={featureSelectId}
                  value={selectedFeatureKey}
                  onChange={e => {
                    setSelectedFeatureKey(e.target.value);
                    setTestAccessResult(null);
                  }}
                  className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  {scopes.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.isRestricted ? '(Обмежено для дітей)' : '(Безпечна база)'}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleCheckAccess}
                className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition-all"
              >
                Перевірити дозвіл (checkAccountFeatureAccess)
              </button>

              {testAccessResult && (
                <div className={`p-3 rounded-lg border text-xs space-y-1 ${
                  testAccessResult.allowed
                    ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/50 border-rose-800 text-rose-300'
                }`}>
                  <div className="font-bold flex items-center gap-1.5">
                    <span>{testAccessResult.allowed ? '✅ ДОЗВОЛЕНО' : '⛔ ЗАБЛОКОВАНО'}</span>
                  </div>
                  <div className="text-slate-300 text-[11px]">
                    Причина: {testAccessResult.reason}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Parent Portal & Scopes Configuration (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
                <span>👪</span> Портал батьківського контролю та верифікації
              </h3>
              <span className="text-xs text-slate-400">
                Записів: {accounts.length}
              </span>
            </div>

            {loading ? (
              <div className="text-center py-8 text-slate-500 text-sm">Завантаження...</div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">Акаунтів немає</div>
            ) : (
              <div className="space-y-4">
                {accounts.map(acc => {
                  const isPending = acc.status === 'pending';
                  const isApproved = acc.status === 'approved';
                  const isRejected = acc.status === 'rejected';
                  const isExpired = acc.status === 'expired';

                  const currentSelectedScopes = approvingScopes[acc.id] || acc.allowedScopes || scopes.map(s => s.id);

                  return (
                    <div
                      key={acc.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isPending
                          ? 'bg-amber-950/20 border-amber-800/60'
                          : isApproved
                          ? 'bg-emerald-950/20 border-emerald-800/60'
                          : isRejected
                          ? 'bg-rose-950/20 border-rose-800/60'
                          : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      {/* Top row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{acc.childUsername}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {acc.age} років
                          </span>
                          {acc.parentEmailMasked && (
                            <span className="text-[11px] text-slate-400">
                              (Email: <code className="text-cyan-300">{acc.parentEmailMasked}</code>)
                            </span>
                          )}
                        </div>
                        <span className={`text-xs px-2.5 py-0.5 font-bold rounded-full ${
                          isPending
                            ? 'bg-amber-900/60 text-amber-300 border border-amber-700'
                            : isApproved
                            ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                            : isRejected
                            ? 'bg-rose-900/60 text-rose-300 border border-rose-700'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {acc.status.toUpperCase()}
                        </span>
                      </div>

                      {/* Scopes checklist for approval or viewing */}
                      <div className="my-3 text-xs space-y-2">
                        <div className="text-slate-400 font-medium">
                          {isPending ? 'Виберіть дозволи для надання згоди:' : 'Активні дозволи:'}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {scopes.map(s => {
                            const isChecked = isPending
                              ? currentSelectedScopes.includes(s.id)
                              : (acc.allowedScopes || []).includes(s.id);
                            return (
                              <label
                                key={s.id}
                                className={`flex items-start gap-2 p-2 rounded border text-[11px] ${
                                  isChecked
                                    ? 'bg-slate-900/90 border-cyan-800/80 text-cyan-200'
                                    : 'bg-slate-950/40 border-slate-800 text-slate-500'
                                } ${isPending ? 'cursor-pointer hover:border-cyan-600' : 'cursor-default'}`}
                              >
                                {isPending ? (
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleScopeSelection(acc.id, s.id)}
                                    className="mt-0.5 accent-cyan-500"
                                  />
                                ) : (
                                  <span className="mt-0.5">{isChecked ? '✓' : '✗'}</span>
                                )}
                                <div>
                                  <div className="font-semibold text-white">{s.name}</div>
                                  <div className="text-[10px] text-slate-400">{s.description}</div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Metadata row */}
                      <div className="text-[11px] text-slate-400 border-t border-slate-800/60 pt-2 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          Політика: <span className="text-slate-300">{acc.policyVersion}</span>
                          {acc.consentRecord?.approvedAt && (
                            <span className="ml-2">
                              • Підтверджено: {new Date(acc.consentRecord.approvedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(acc.id, acc.tokenRawForDemo)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs transition-colors"
                              >
                                Надати згоду (Approve)
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReject(acc.id)}
                                className="px-3 py-1 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 font-semibold rounded text-xs transition-colors"
                              >
                                Відхилити
                              </button>
                            </>
                          )}
                          {isApproved && acc.requiresParentConsent && (
                            <button
                              type="button"
                              onClick={() => handleRevoke(acc.id)}
                              className="px-3 py-1 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 font-semibold rounded text-xs transition-colors"
                            >
                              Відкликати згоду (Revoke)
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Privacy & Minimization Audit Log */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
              <span>📋</span> Аудит подій та дотримання приватності (Privacy Log)
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {auditLogs.slice(0, 5).map(log => (
                <div key={log.id} className="text-xs p-2.5 rounded bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-cyan-400">{log.action}</span>
                    <span className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-slate-300">{log.details}</div>
                  <div className="text-[10px] text-slate-500">Виконавець: {log.actor}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
