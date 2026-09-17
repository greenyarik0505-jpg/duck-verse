'use client';

import React, { useState, useEffect, useCallback, useId } from 'react';

const DEMO_ACTORS = [
  { id: 'usr-admin-01', username: 'admin_yarik', role: 'admin', name: 'Yarik0505 (Admin & Security Lead)' },
  { id: 'usr-mentor-02', username: 'mentor_dmytro', role: 'mentor', name: 'Степаненко Дмитро (L2 Security Mentor)' },
  { id: 'usr-support-01', username: 'support_anna', role: 'support_l1', name: 'Анна (L1 Support Specialist)' },
];

export default function RecoverySupportSafeguardsView() {
  const [currentActor, setCurrentActor] = useState(DEMO_ACTORS[0]);
  const [tickets, setTickets] = useState([]);
  const [coolingOffActions, setCoolingOffActions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // ATO Freeze form
  const [freezeAccountId, setFreezeAccountId] = useState('usr-student-04');
  const [freezeReason, setFreezeReason] = useState('Аномальний вхід з невідомої підмережі та підозра на перехоплення сесії');

  // Irreversible action form
  const [targetUsername, setTargetUsername] = useState('bogdan_spammer');
  const [actionType, setActionType] = useState('IRREVERSIBLE_DATA_RESET');
  const [actionReason, setActionReason] = useState('Запит на повне скидання прогресу курсу');
  const [confirmationInput, setConfirmationInput] = useState('');
  const [expectedPhrase, setExpectedPhrase] = useState('CONFIRM-RESET-BOGDAN');

  // Post verification form
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('Особу верифіковано через дзвінок батькам (OOB телефонний канал)');

  // Privacy preview state
  const [privacyTab, setPrivacyTab] = useState('support'); // 'support' | 'raw'

  const actorSelectId = useId();
  const freezeAccountSelectId = useId();
  const freezeReasonInputId = useId();
  const confirmInputId = useId();
  const ticketSelectId = useId();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/academy/identity/recovery');
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets || []);
        setCoolingOffActions(data.coolingOffActions || []);
        setAuditLogs(data.auditLogs || []);
        if (data.tickets?.length > 0) {
          setSelectedTicketId(prev => prev || data.tickets[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load recovery data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEmergencyFreeze = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/academy/identity/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'emergency_freeze',
          accountId: freezeAccountId,
          actor: currentActor,
          reason: freezeReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`🚨 Акаунт успішно заморожено! Згенеровано код інциденту: ${data.incidentCode}`);
        fetchData();
      } else {
        alert(data.error || 'Помилка виконання');
      }
    } catch (err) {
      console.error('Freeze failed:', err);
    }
  };

  const handleInitiateIrreversible = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/academy/identity/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'initiate_irreversible',
          accountId: 'usr-student-04',
          username: targetUsername,
          actionType,
          actor: currentActor,
          reason: actionReason,
          confirmationInput,
          expectedConfirmation: expectedPhrase,
          coolingOffHours: 24,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('⏳ Незворотну дію поставлено на період охолодження (Cooling-off: 24 год)!');
        setConfirmationInput('');
        fetchData();
      } else {
        alert(data.error || 'Помилка підтвердження');
      }
    } catch (err) {
      console.error('Initiate failed:', err);
    }
  };

  const handleCancelCoolingOff = async (actionId) => {
    try {
      const res = await fetch('/api/academy/identity/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel_cooling_off',
          actionId,
          actor: currentActor,
          reason: 'Скасовано за запитом батьків/користувача під час періоду охолодження',
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ Операцію успішно скасовано! Дані збережено.');
        fetchData();
      } else {
        alert(data.error || 'Помилка скасування');
      }
    } catch (err) {
      console.error('Cancel failed:', err);
    }
  };

  const handleResolveTicket = async () => {
    if (!selectedTicketId) return;
    try {
      const res = await fetch('/api/academy/identity/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_resolution',
          ticketId: selectedTicketId,
          actor: currentActor,
          verificationNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('🎉 Інцидент успішно верифіковано та закрито!');
        fetchData();
      } else {
        alert(data.error || 'Помилка закриття');
      }
    } catch (err) {
      console.error('Resolve failed:', err);
    }
  };

  const openTicketsCount = tickets.filter(t => t.status !== 'RESOLVED').length;
  const frozenCount = tickets.filter(t => t.emergencyFrozen).length;
  const pendingCoolingOffCount = coolingOffActions.filter(a => a.status === 'PENDING_COOLING_OFF').length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🛡️</span>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-400 via-rose-300 to-orange-400 bg-clip-text text-transparent">
              Безпека відновлення доступу та бар’єри незворотних дій
            </h2>
            <p className="text-sm text-slate-400">
              Recovery support escalation, ATO emergency freeze runbook, zero-knowledge privacy shield та cooling-off 24h
            </p>
          </div>
        </div>

        {/* Actor Switcher */}
        <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-700/80 rounded-xl p-2">
          <label htmlFor={actorSelectId} className="text-xs text-slate-400 font-medium pl-1">
            Оператор сапорту:
          </label>
          <select
            id={actorSelectId}
            value={currentActor.id}
            onChange={e => {
              const sel = DEMO_ACTORS.find(a => a.id === e.target.value);
              if (sel) setCurrentActor(sel);
            }}
            className="text-xs bg-slate-900 border border-slate-700 rounded px-2 py-1 text-amber-300 font-semibold focus:outline-none"
          >
            {DEMO_ACTORS.map(actor => (
              <option key={actor.id} value={actor.id}>
                {actor.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Відкриті запити</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{openTicketsCount}</div>
          <div className="text-[11px] text-amber-500/80 mt-1">Очікують розслідування</div>
        </div>
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Заморожені (ATO)</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{frozenCount}</div>
          <div className="text-[11px] text-rose-500/80 mt-1">Emergency Frozen сесії</div>
        </div>
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Період охолодження</div>
          <div className="text-2xl font-bold text-sky-400 mt-1">{pendingCoolingOffCount}</div>
          <div className="text-[11px] text-sky-500/80 mt-1">Cooling-off (24 години)</div>
        </div>
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Стандарт безпеки</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">100%</div>
          <div className="text-[11px] text-emerald-500/80 mt-1">Zero-Knowledge Support</div>
        </div>
      </div>

      {/* Support Privacy Shield Inspector */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
              <span>🔒</span> Support Privacy Shield (Zero Knowledge Support)
            </h3>
            <p className="text-xs text-slate-400">
              Співробітники підтримки ніколи не бачать паролі, відкриті токени сесій чи незамаскований email
            </p>
          </div>
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
            <button
              type="button"
              onClick={() => setPrivacyTab('support')}
              className={`px-3 py-1 rounded font-medium transition-all ${
                privacyTab === 'support' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Що бачить Support (Sanitized)
            </button>
            <button
              type="button"
              onClick={() => setPrivacyTab('raw')}
              className={`px-3 py-1 rounded font-medium transition-all ${
                privacyTab === 'raw' ? 'bg-rose-900/60 text-rose-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              Сирі дані в БД (Заблоковано)
            </button>
          </div>
        </div>

        {privacyTab === 'support' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-slate-400 font-semibold">Email користувача:</span>
              <div className="font-mono text-cyan-300 text-sm">b***n@example.com</div>
              <span className="text-[10px] text-emerald-400">✓ Замасковано за COPPA/GDPR</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-slate-400 font-semibold">Пароль / Хеш пароля:</span>
              <div className="font-mono text-slate-500 text-sm">[NEVER VISIBLE TO SUPPORT]</div>
              <span className="text-[10px] text-emerald-400">✓ Повний Zero-Knowledge захист</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-slate-400 font-semibold">IP-адреса сесії:</span>
              <div className="font-mono text-cyan-300 text-sm">7f83b1657ff1... (SHA-256)</div>
              <span className="text-[10px] text-emerald-400">✓ Хешовано без збереження геолокації</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-slate-400 font-semibold">Посилання відновлення:</span>
              <div className="font-mono text-amber-300 text-sm">[Sent directly to verified email]</div>
              <span className="text-[10px] text-emerald-400">✓ Доставка без посередника</span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-rose-950/20 border border-rose-900/60 text-xs text-rose-300 space-y-2">
            <div className="font-bold flex items-center gap-1.5">
              <span>⛔</span> Спроба доступу до сирих облікових даних заблокована політикою Least Privilege:
            </div>
            <p className="text-slate-400">
              Платформа забороняє виведення відкритих секретів навіть для ролі супер-адміністратора. Відновлення доступу здійснюється виключно через криптографічно підписані посилання, що надсилаються на перевірені контакти батьків або студентів.
            </p>
          </div>
        )}
      </div>

      {/* Grid: Left ATO Freeze & OOB, Right Irreversible Cooling-off & Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: ATO Freeze & OOB Verification (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* ATO Freeze Runbook Form */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
              <span>🚨</span> Account Takeover (ATO) Emergency Freeze Protocol
            </h3>
            <p className="text-xs text-slate-400">
              Миттєве анулювання всіх активних сесій та блокування входу при підозрі на злам (Runbook v1.0.0)
            </p>

            <form onSubmit={handleEmergencyFreeze} className="space-y-3">
              <div>
                <label htmlFor={freezeAccountSelectId} className="block text-xs font-medium text-slate-400 mb-1">
                  Цільовий акаунт під підозрою:
                </label>
                <select
                  id={freezeAccountSelectId}
                  value={freezeAccountId}
                  onChange={e => setFreezeAccountId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="usr-student-04">bogdan_spammer (usr-student-04)</option>
                  <option value="usr-student-03">kyrylo_coder (usr-student-03)</option>
                </select>
              </div>

              <div>
                <label htmlFor={freezeReasonInputId} className="block text-xs font-medium text-slate-400 mb-1">
                  Обґрунтування для протоколу інциденту:
                </label>
                <input
                  id={freezeReasonInputId}
                  type="text"
                  value={freezeReason}
                  onChange={e => setFreezeReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>❄️</span> Виконати Emergency Freeze & Анулювати сесії
              </button>
            </form>
          </div>

          {/* Ticket Queue & OOB Verification */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-base font-semibold text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span>🎫</span> Черга запитів відновлення ({tickets.length})
              </span>
            </h3>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {tickets.map(tkt => (
                <div
                  key={tkt.id}
                  className={`p-3.5 rounded-lg border text-xs space-y-1.5 ${
                    tkt.emergencyFrozen
                      ? 'bg-rose-950/30 border-rose-800/80'
                      : tkt.status === 'RESOLVED'
                      ? 'bg-emerald-950/20 border-emerald-800/60'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{tkt.username} ({tkt.maskedEmail})</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      tkt.emergencyFrozen
                        ? 'bg-rose-900 text-rose-200 border border-rose-700'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {tkt.emergencyFrozen ? 'FROZEN (ATO)' : tkt.status}
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px]">{tkt.reason}</div>
                  <div className="text-[10px] text-slate-500 flex items-center justify-between">
                    <span>Рівень: <strong className="text-amber-300">{tkt.tier}</strong> • Власник: {tkt.owner}</span>
                    {tkt.incidentCode && (
                      <span className="font-mono bg-slate-950 px-1.5 py-0.5 rounded text-rose-400 font-bold">
                        {tkt.incidentCode}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Post-Action OOB Resolution Form */}
            <div className="border-t border-slate-800/80 pt-3 space-y-2">
              <div className="text-xs font-semibold text-slate-300">Пострелізна OOB-верифікація та закриття:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  id={ticketSelectId}
                  value={selectedTicketId}
                  onChange={e => setSelectedTicketId(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  {tickets.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.username} [{t.id}]
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={verificationNotes}
                  onChange={e => setVerificationNotes(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <button
                type="button"
                onClick={handleResolveTicket}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs transition-colors"
              >
                Підтвердити OOB-перевірку та закрити інцидент
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Irreversible Actions with Cooling-off & Audit (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Irreversible Action Form with Double Confirmation */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
              <span>⚠️</span> Незворотні дії: Double-Confirmation & Cooling-off
            </h3>
            <p className="text-xs text-slate-400">
              Повне скидання даних або видалення акаунта вимагає введення контрольної фрази та активує 24-годинний період охолодження
            </p>

            <form onSubmit={handleInitiateIrreversible} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Цільовий користувач для скидання:
                </label>
                <input
                  type="text"
                  value={targetUsername}
                  onChange={e => {
                    setTargetUsername(e.target.value);
                    setExpectedPhrase(`CONFIRM-RESET-${e.target.value.toUpperCase()}`);
                  }}
                  className="w-full px-3 py-1.5 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Обов’язкова контрольна фраза (Double Confirmation):
                </label>
                <div className="text-[11px] text-amber-400 font-mono mb-1">
                  Введіть точно: <code className="bg-slate-900 px-1.5 py-0.5 rounded text-white">{expectedPhrase}</code>
                </div>
                <input
                  id={confirmInputId}
                  type="text"
                  value={confirmationInput}
                  onChange={e => setConfirmationInput(e.target.value)}
                  placeholder={expectedPhrase}
                  className="w-full px-3 py-1.5 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-sm transition-all shadow-md"
              >
                Поставити на Cooling-Off (24 години)
              </button>
            </form>
          </div>

          {/* Active Cooling-off Actions List */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-base font-semibold text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span>⏳</span> Активні операції в періоді охолодження ({coolingOffActions.length})
              </span>
            </h3>

            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {coolingOffActions.map(act => {
                const isPending = act.status === 'PENDING_COOLING_OFF';
                return (
                  <div
                    key={act.id}
                    className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                      isPending ? 'bg-sky-950/20 border-sky-800/80' : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{act.username} — {act.actionType}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isPending ? 'bg-sky-950 text-sky-300 border border-sky-800' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {act.status}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px]">{act.reason}</div>
                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span>Ініціатор: {act.initiatedBy}</span>
                      <span>Діє до: {new Date(act.expiresAt).toLocaleTimeString()}</span>
                    </div>
                    {isPending && (
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => handleCancelCoolingOff(act.id)}
                          className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-semibold transition-colors"
                        >
                          Скасувати дію (Cancel during Cooling-off)
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Audit Logs */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
              <span>📋</span> Журнал операцій підтримки та аудиту
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {auditLogs.slice(0, 5).map(log => (
                <div key={log.id} className="text-xs p-2.5 rounded bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-amber-400">{log.action}</span>
                    <span className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-slate-300">
                    {log.targetUsername ? `Користувач: ${log.targetUsername} • ` : ''}
                    {log.details || log.reason}
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
