'use client';

import React, { useState, useEffect, useCallback, useId } from 'react';

const MOCK_ACTORS = [
  { id: 'usr-admin-01', username: 'admin_yarik', role: 'admin', name: 'Yarik0505 (Адміністратор)' },
  { id: 'usr-mentor-02', username: 'mentor_dmytro', role: 'mentor', name: 'Степаненко Дмитро (Ментор)' },
  { id: 'usr-parent-05', username: 'olena_parent', role: 'parent', name: 'Олена (Батьки kyrylo_coder)', linkedChildIds: ['usr-student-03'] },
  { id: 'usr-student-03', username: 'kyrylo_coder', role: 'student', name: 'Кирило (Студент)' },
];

export default function AccountLifecycleAdminView() {
  const [currentActor, setCurrentActor] = useState(MOCK_ACTORS[0]);
  const [accounts, setAccounts] = useState([]);
  const [invites, setInvites] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [rbacMatrix, setRbacMatrix] = useState({});
  const [loading, setLoading] = useState(true);

  // Filter state
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Invite creation form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('student');
  const [inviteTtl, setInviteTtl] = useState(48);

  // Selected for bulk actions
  const [selectedAccountIds, setSelectedAccountIds] = useState([]);
  const [bulkReason, setBulkReason] = useState('');
  const [bulkConfirmed, setBulkConfirmed] = useState(false);

  // Single action modal / state
  const [actionTarget, setActionTarget] = useState(null); // account to suspend/reactivate
  const [actionType, setActionType] = useState(''); // 'SUSPEND' | 'REACTIVATE'
  const [actionReason, setActionReason] = useState('');
  const [actionConfirmed, setActionConfirmed] = useState(false);

  // Access check simulator
  const [simAccountId, setSimAccountId] = useState('');
  const [simOperation, setSimOperation] = useState('READ_DATA');
  const [simResult, setSimResult] = useState(null);

  const actorSelectId = useId();
  const inviteEmailId = useId();
  const inviteRoleId = useId();
  const simAccountSelectId = useId();
  const simOperationSelectId = useId();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/academy/identity/lifecycle');
      const data = await res.json();
      if (data.success) {
        setAccounts(data.accounts || []);
        setInvites(data.invites || []);
        setAuditLogs(data.auditLogs || []);
        setRbacMatrix(data.rbacMatrix || {});
        if (data.accounts?.length > 0) {
          setSimAccountId(prev => prev || data.accounts[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load lifecycle data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      const res = await fetch('/api/academy/identity/lifecycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_invite',
          email: inviteEmail.trim(),
          role: inviteRole,
          ttlHours: Number(inviteTtl),
          actor: currentActor,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setInviteEmail('');
        fetchData();
      } else {
        alert(data.error || 'Помилка створення запрошення');
      }
    } catch (err) {
      console.error('Invite failed:', err);
    }
  };

  const handleRevokeInvite = async (inviteId) => {
    try {
      const res = await fetch('/api/academy/identity/lifecycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revoke_invite',
          inviteId,
          actor: currentActor,
          reason: 'Скасовано адміністратором через консоль',
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || 'Помилка скасування');
      }
    } catch (err) {
      console.error('Revoke invite failed:', err);
    }
  };

  const handleExecuteSingleAction = async () => {
    if (!actionTarget || !actionReason.trim()) return;

    try {
      const endpointAction = actionType === 'SUSPEND' ? 'suspend_account' : 'reactivate_account';
      const body = {
        action: endpointAction,
        accountId: actionTarget.id,
        actor: currentActor,
        reason: actionReason.trim(),
        confirmed: actionConfirmed,
      };

      const res = await fetch('/api/academy/identity/lifecycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setActionTarget(null);
        setActionReason('');
        setActionConfirmed(false);
        fetchData();
      } else {
        alert(data.error || 'Дію відхилено системою безпеки');
      }
    } catch (err) {
      console.error('Action failed:', err);
    }
  };

  const handleExecuteBulkAction = async (bulkType) => {
    if (selectedAccountIds.length === 0 || !bulkReason.trim() || !bulkConfirmed) {
      alert('Будь ласка, вкажіть причину та підтвердіть чекбокс для масової дії');
      return;
    }

    try {
      const res = await fetch('/api/academy/identity/lifecycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_action',
          bulkAction: bulkType,
          targetIds: selectedAccountIds,
          actor: currentActor,
          reason: bulkReason.trim(),
          confirmed: bulkConfirmed,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedAccountIds([]);
        setBulkReason('');
        setBulkConfirmed(false);
        fetchData();
      } else {
        alert(data.error || 'Помилка масової дії');
      }
    } catch (err) {
      console.error('Bulk action failed:', err);
    }
  };

  const handleVerifyAccess = async () => {
    if (!simAccountId) return;
    try {
      const res = await fetch('/api/academy/identity/lifecycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_access',
          accountId: simAccountId,
          operation: simOperation,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSimResult(data.access);
      }
    } catch (err) {
      console.error('Access verification failed:', err);
    }
  };

  const toggleAccountSelection = (id) => {
    setSelectedAccountIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const filteredAccounts = accounts.filter(acc => {
    if (statusFilter === 'ALL') return true;
    return acc.status === statusFilter;
  });

  const activeCount = accounts.filter(a => a.status === 'ACTIVE').length;
  const suspendedCount = accounts.filter(a => a.status === 'SUSPENDED').length;
  const pendingInvitesCount = invites.filter(i => i.status === 'PENDING').length;

  const currentPermissions = rbacMatrix[currentActor.role] || {};

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎛️</span>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
              Консоль життєвого циклу акаунтів (Admin & Mentor)
            </h2>
            <p className="text-sm text-slate-400">
              Suspend, Reactivate, Invitations з TTL, строгий RBAC аудит та блокування небезпечних масових дій
            </p>
          </div>
        </div>

        {/* Actor Selector (Simulation) */}
        <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-700/80 rounded-xl p-2">
          <label htmlFor={actorSelectId} className="text-xs text-slate-400 font-medium pl-1">
            Діяти від імені:
          </label>
          <select
            id={actorSelectId}
            value={currentActor.id}
            onChange={e => {
              const selected = MOCK_ACTORS.find(a => a.id === e.target.value);
              if (selected) setCurrentActor(selected);
            }}
            className="text-xs bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-cyan-300 font-semibold focus:outline-none"
          >
            {MOCK_ACTORS.map(actor => (
              <option key={actor.id} value={actor.id}>
                {actor.name} [{actor.role.toUpperCase()}]
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* RBAC Active Role Banner */}
      <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-base">🔐</span>
          <span className="text-slate-300">
            Поточна активна роль: <strong className="text-cyan-400 uppercase">{currentActor.role}</strong>
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">
            Право інвайту: {currentPermissions.canInviteRoles?.length > 0 ? currentPermissions.canInviteRoles.join(', ') : 'Немає'}
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">
            Право блокування: {currentPermissions.canSuspendRoles?.length > 0 ? currentPermissions.canSuspendRoles.join(', ') : 'Немає'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
            currentPermissions.canBulkAction ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'
          }`}>
            {currentPermissions.canBulkAction ? 'Масові дії дозволені' : 'Масові дії заборонені'}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Всього акаунтів</div>
          <div className="text-2xl font-bold text-white mt-1">{accounts.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Зареєстровано в системі</div>
        </div>
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Активні користувачі</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{activeCount}</div>
          <div className="text-[11px] text-emerald-500/80 mt-1">Повний доступ до платформи</div>
        </div>
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Призупинені (Suspended)</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{suspendedCount}</div>
          <div className="text-[11px] text-rose-500/80 mt-1">Доступ повністю заблоковано</div>
        </div>
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Активні інвайти (TTL)</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{pendingInvitesCount}</div>
          <div className="text-[11px] text-amber-500/80 mt-1">Очікують реєстрації</div>
        </div>
      </div>

      {/* Two-Column Grid: Left Invites & Simulation, Right Accounts & Bulk Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Invites & Access Gate Simulator (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Create Invite Box */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
              <span>✉️</span> Створення запрошення (Invite with TTL)
            </h3>
            <form onSubmit={handleCreateInvite} className="space-y-4">
              <div>
                <label htmlFor={inviteEmailId} className="block text-xs font-medium text-slate-400 mb-1">
                  Email одержувача
                </label>
                <input
                  id={inviteEmailId}
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="student@school.org"
                  className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor={inviteRoleId} className="block text-xs font-medium text-slate-400 mb-1">
                    Роль у системі
                  </label>
                  <select
                    id={inviteRoleId}
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="student">Student (Учень)</option>
                    <option value="mentor">Mentor (Ментор)</option>
                    <option value="parent">Parent (Батьки)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Термін дії (TTL): <span className="text-white font-bold">{inviteTtl} год.</span>
                  </label>
                  <select
                    value={inviteTtl}
                    onChange={e => setInviteTtl(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    <option value={24}>24 години (1 день)</option>
                    <option value={48}>48 годин (2 дні)</option>
                    <option value={72}>72 години (3 дні)</option>
                    <option value={168}>168 годин (7 днів)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm transition-all shadow-md"
              >
                Згенерувати безпечний токен інвайту
              </button>
            </form>
          </div>

          {/* Invites List */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-base font-semibold text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span>📨</span> Активні запрошення ({invites.length})
              </span>
            </h3>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {invites.map(inv => {
                const isPending = inv.status === 'PENDING';
                return (
                  <div key={inv.id} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{inv.email}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isPending ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px] flex items-center justify-between">
                      <span>Роль: <strong className="text-slate-300 uppercase">{inv.role}</strong> (TTL: {inv.ttlHours}h)</span>
                      <span className="font-mono bg-slate-950 px-1.5 py-0.5 rounded text-cyan-400">{inv.token}</span>
                    </div>
                    {isPending && (
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => handleRevokeInvite(inv.id)}
                          className="px-2 py-0.5 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded text-[10px] transition-colors"
                        >
                          Відкликати (Revoke)
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Suspended User Simulator */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
              <span>🛡️</span> Симулятор доступу (verifyAccountAccess Gate)
            </h3>
            <div className="space-y-3">
              <div>
                <label htmlFor={simAccountSelectId} className="block text-xs font-medium text-slate-400 mb-1">
                  Тестовий акаунт:
                </label>
                <select
                  id={simAccountSelectId}
                  value={simAccountId}
                  onChange={e => {
                    setSimAccountId(e.target.value);
                    setSimResult(null);
                  }}
                  className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.username} [{acc.status}] ({acc.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor={simOperationSelectId} className="block text-xs font-medium text-slate-400 mb-1">
                  Спроба операції:
                </label>
                <select
                  id={simOperationSelectId}
                  value={simOperation}
                  onChange={e => {
                    setSimOperation(e.target.value);
                    setSimResult(null);
                  }}
                  className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="LOGIN">Автентифікація (Login Session)</option>
                  <option value="READ_DATA">Читання навчальних даних (Learner Data)</option>
                  <option value="SUBMIT_ASSIGNMENT">Здача випускного проекту (Capstone Submit)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleVerifyAccess}
                className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition-all"
              >
                Виконати перевірку гейта доступу
              </button>

              {simResult && (
                <div className={`p-3 rounded-lg border text-xs space-y-1 ${
                  simResult.allowed
                    ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/50 border-rose-800 text-rose-300'
                }`}>
                  <div className="font-bold flex items-center gap-1.5">
                    <span>{simResult.allowed ? '✅ ДОСТУП ДОЗВОЛЕНО' : '⛔ ДОСТУП ЗАБЛОКОВАНО'}</span>
                  </div>
                  <div className="text-slate-300 text-[11px]">{simResult.message}</div>
                  {simResult.reason && (
                    <div className="text-rose-400 text-[10px] mt-1">
                      Офіційна причина: <strong>{simResult.reason}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: User Accounts Table & Bulk Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
                <span>👥</span> Реєстр користувачів та операції життєвого циклу
              </h3>
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
                {['ALL', 'ACTIVE', 'SUSPENDED'].map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded font-medium transition-all ${
                      statusFilter === st ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {st === 'ALL' ? 'Всі' : st === 'ACTIVE' ? 'Активні' : 'Призупинені'}
                  </button>
                ))}
              </div>
            </div>

            {/* Bulk Action Bar (Safeguarded) */}
            {selectedAccountIds.length > 0 && (
              <div className="bg-indigo-950/40 border border-indigo-800/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                    <span>⚡</span> Панель масових дій (Обрано: {selectedAccountIds.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedAccountIds([])}
                    className="text-[11px] text-slate-400 hover:text-white"
                  >
                    Скасувати вибір
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <input
                    type="text"
                    value={bulkReason}
                    onChange={e => setBulkReason(e.target.value)}
                    placeholder="Обов’язкова причина для масової дії (аудит-лог)..."
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                  <label className="flex items-center gap-2 text-slate-300 text-[11px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bulkConfirmed}
                      onChange={e => setBulkConfirmed(e.target.checked)}
                      className="accent-indigo-500"
                    />
                    <span>Я підтверджую застосування до обраних акаунтів (Safeguard Confirmation)</span>
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleExecuteBulkAction('BULK_SUSPEND')}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded text-xs transition-colors"
                  >
                    Призупинити обрані (Bulk Suspend)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExecuteBulkAction('BULK_REACTIVATE')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs transition-colors"
                  >
                    Реактивувати обрані (Bulk Reactivate)
                  </button>
                </div>
              </div>
            )}

            {/* Accounts List */}
            {loading ? (
              <div className="text-center py-8 text-slate-500 text-sm">Завантаження...</div>
            ) : (
              <div className="space-y-3">
                {filteredAccounts.map(acc => {
                  const isSuspended = acc.status === 'SUSPENDED';
                  const isSelf = acc.id === currentActor.id;
                  const isSelected = selectedAccountIds.includes(acc.id);

                  return (
                    <div
                      key={acc.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isSuspended ? 'bg-rose-950/20 border-rose-800/60' : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleAccountSelection(acc.id)}
                            className="accent-cyan-500"
                          />
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-2">
                              <span>{acc.username}</span>
                              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                                {acc.role}
                              </span>
                              {isSelf && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                                  Ви
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">{acc.email}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2.5 py-0.5 font-bold rounded-full ${
                            isSuspended
                              ? 'bg-rose-900/60 text-rose-300 border border-rose-700'
                              : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                          }`}>
                            {acc.status}
                          </span>

                          {/* Action Buttons */}
                          {isSuspended ? (
                            <button
                              type="button"
                              onClick={() => {
                                setActionTarget(acc);
                                setActionType('REACTIVATE');
                                setActionReason('Акаунт відновлено після перевірки');
                                setActionConfirmed(true);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded text-xs transition-colors"
                            >
                              Реактивувати
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isSelf}
                              onClick={() => {
                                setActionTarget(acc);
                                setActionType('SUSPEND');
                                setActionReason('');
                                setActionConfirmed(false);
                              }}
                              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                                isSelf
                                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                  : 'bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300'
                              }`}
                            >
                              {isSelf ? 'Самодія заборонена' : 'Призупинити'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Suspension details banner if suspended */}
                      {isSuspended && acc.suspensionInfo && (
                        <div className="mt-3 p-2.5 rounded bg-rose-950/40 border border-rose-900/50 text-[11px] text-rose-300 space-y-0.5">
                          <div className="font-semibold">⚠️ Інформація про блокування:</div>
                          <div>Причина: {acc.suspensionInfo.reason}</div>
                          <div className="text-slate-400 text-[10px]">
                            Виконавець: {acc.suspensionInfo.suspendedBy} • {new Date(acc.suspensionInfo.suspendedAt).toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Modal / Drawer */}
          {actionTarget && (
            <div className="bg-slate-950 border border-cyan-800/80 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-sm font-bold text-white">
                  {actionType === 'SUSPEND' ? '⛔ Підтвердження блокування' : '✅ Підтвердження відновлення'}
                </h4>
                <button
                  type="button"
                  onClick={() => setActionTarget(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ✕ Закрити
                </button>
              </div>

              <p className="text-xs text-slate-300">
                Ви збираєтеся {actionType === 'SUSPEND' ? 'призупинити' : 'реактивувати'} акаунт{' '}
                <strong className="text-white">{actionTarget.username}</strong> ({actionTarget.email}).
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Обов’язкова причина для аудиту:
                </label>
                <input
                  type="text"
                  value={actionReason}
                  onChange={e => setActionReason(e.target.value)}
                  placeholder="Вкажіть конкретну причину дії..."
                  className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white"
                  required
                />
              </div>

              {actionType === 'SUSPEND' && (
                <label className="flex items-center gap-2 text-slate-300 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={actionConfirmed}
                    onChange={e => setActionConfirmed(e.target.checked)}
                    className="accent-rose-500"
                  />
                  <span>Я усвідомлюю, що це заблокує вхід та доступ до навчальних матеріалів</span>
                </label>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActionTarget(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
                >
                  Скасувати
                </button>
                <button
                  type="button"
                  onClick={handleExecuteSingleAction}
                  className={`px-4 py-1.5 font-bold rounded text-xs text-white transition-colors ${
                    actionType === 'SUSPEND' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  {actionType === 'SUSPEND' ? 'Призупинити акаунт' : 'Реактивувати акаунт'}
                </button>
              </div>
            </div>
          )}

          {/* Audit Logs */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
              <span>📋</span> Журнал аудиту життєвого циклу акаунтів (Lifecycle Audit)
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {auditLogs.slice(0, 5).map(log => (
                <div key={log.id} className="text-xs p-2.5 rounded bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-cyan-400">{log.action}</span>
                    <span className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-slate-300">
                    {log.targetUsername ? `Користувач: ${log.targetUsername} • ` : ''}
                    {log.reason}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Виконавець: {log.actor} [{log.actorRole?.toUpperCase()}]
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
