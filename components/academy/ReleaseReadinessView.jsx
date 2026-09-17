'use client';

import { useState, useEffect, useCallback } from 'react';

export default function ReleaseReadinessView({ currentUser }) {
  const [releaseData, setReleaseData] = useState(null);
  const [activeTab, setActiveTab] = useState('checklist'); // 'checklist' | 'evidence' | 'approval' | 'history'
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  // Локальний стан підпису ментора
  const [mentorNotes, setMentorNotes] = useState('Всі 6 гейтів якості пройдено на 100%, тести зелені, CDP верифіковано.');
  const [testUserRole, setTestUserRole] = useState(currentUser?.role || 'mentor');

  const mentorActor = {
    id: testUserRole === 'mentor' ? 'mentor-yarik' : testUserRole === 'admin' ? 'admin-kirill' : 'student-yurko',
    role: testUserRole,
    name: testUserRole === 'mentor' ? 'Yarik0505 (Mentor)' : testUserRole === 'admin' ? 'Кирил (Адмін)' : 'Юрко (Учень)',
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/academy/ops/release?role=${mentorActor.role}&name=${encodeURIComponent(mentorActor.name)}`);
      const data = await res.json();
      if (data.success) {
        setReleaseData(data);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [mentorActor.role, mentorActor.name]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Перемикання чекбокса гейта
  const handleToggleGate = async (gateId, currentChecked) => {
    try {
      setLoading(true);
      const res = await fetch('/api/academy/ops/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_gate',
          gateId,
          isChecked: !currentChecked,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      setActionMessage(`❌ Помилка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Підпис Change Approval ментором
  const handleApproveRelease = async () => {
    if (!releaseData?.activeDraft) return;
    try {
      setLoading(true);
      const res = await fetch('/api/academy/ops/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve_release',
          releaseId: releaseData.activeDraft.id,
          mentorActor,
          notes: mentorNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage('✅ Реліз успішно підписано ментором (Change Approval Signed)! Реліз готовий до деплою.');
        fetchData();
      } else {
        setActionMessage(`🛡️ Відхилено захисним бар'єром: ${data.error}`);
      }
    } catch (err) {
      setActionMessage(`❌ Помилка мережі: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Виконання релізу в історію
  const handleExecuteRelease = async () => {
    if (!releaseData?.activeDraft) return;
    try {
      setLoading(true);
      const res = await fetch('/api/academy/ops/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute_release',
          releaseId: releaseData.activeDraft.id,
          outcome: 'SUCCESSFUL_DEPLOY',
          followUpTasks: [
            'Моніторинг черги запитів та P95 latency протягом 2 годин',
            'Оновити Changelog у репозиторії та сповістити спільноту',
          ],
          deployer: mentorActor.name,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`🎉 Реліз ${data.record.versionTag} успішно зафіксовано в реєстрі деплоїв!`);
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

  const draft = releaseData?.activeDraft;
  const validation = releaseData?.validation;

  return (
    <div
      id="academy-release-readiness-section"
      className="academy-skills-section my-8 p-6 rounded-2xl bg-slate-900/90 border border-purple-500/30 shadow-2xl backdrop-blur-md text-slate-100"
    >
      {/* Заголовок та метадані */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              SCRUM-118
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              6 Quality Gates
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Risk-Based Approvals
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Evidence Traceability
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span>🚀 Release Readiness Checklist & Change Approval</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Професійний інженерний бар'єр перед релізом у продакшн: перевірка 6 гейтів якості, погодження ментором для High-Risk змін та фіксація доказів.
          </p>
        </div>

        {/* Перемикач ролі для тестування захисту */}
        <div className="flex flex-col items-start lg:items-end gap-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Роль для тестування погодження:</span>
          <div className="inline-flex rounded-lg bg-slate-900 p-1 border border-slate-700">
            {['mentor', 'admin', 'child'].map((r) => (
              <button
                key={r}
                onClick={() => setTestUserRole(r)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  testUserRole === r
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {r === 'mentor' && '🧑‍🏫 Ментор (Yarik)'}
                {r === 'admin' && '👑 Адмін'}
                {r === 'child' && '👶 Учень (Блокування)'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Сповіщення */}
      {actionMessage && (
        <div className="mt-4 p-3 rounded-xl bg-slate-800/80 border border-purple-500/40 text-sm text-purple-200 flex items-center justify-between animate-fadeIn">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage('')} className="bg-transparent hover:bg-slate-700 text-slate-400 hover:text-white rounded p-1 ml-3 transition-all">
            ✕
          </button>
        </div>
      )}

      {/* Статус поточного активного релізу */}
      {draft && (
        <div className="mt-6 p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm font-bold text-purple-400">{draft.versionTag}</span>
              <span className="text-xs text-slate-400">({draft.targetSprint})</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  draft.riskLevel === 'HIGH_RISK'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}
              >
                {draft.riskLevel}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  validation?.ready
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {validation?.ready ? '🟢 READY FOR DEPLOY' : '🔒 GATE BLOCKED'}
              </span>
            </div>
            <p className="text-xs text-slate-300">{draft.summary}</p>
          </div>

          <div className="flex items-center gap-2">
            {validation?.ready ? (
              <button
                onClick={handleExecuteRelease}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white shadow-md transition-all"
              >
                🚀 Випустити реліз (Deploy)
              </button>
            ) : (
              <div className="text-right text-xs text-rose-400">
                <span>Блокування: {validation?.blockedReason}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Навігаційні вкладки */}
      <div className="flex flex-wrap gap-2 mt-6 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('checklist')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'checklist'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/60 border border-slate-700/50'
          }`}
        >
          📋 Чекліст 6 гейтів якості
        </button>
        <button
          onClick={() => setActiveTab('evidence')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'evidence'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/60 border border-slate-700/50'
          }`}
        >
          📎 Трасованість доказів (Evidence Links)
        </button>
        <button
          onClick={() => setActiveTab('approval')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all relative ${
            activeTab === 'approval'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/60 border border-slate-700/50'
          }`}
        >
          ✍️ Погодження ментора (Change Approval)
          {!draft?.mentorApproval && draft?.riskLevel === 'HIGH_RISK' && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-amber-500 text-slate-950 font-black rounded-full animate-pulse">
              1
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'history'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-700/60 border border-slate-700/50'
          }`}
        >
          📜 Реєстр релізів & Follow-ups
        </button>
      </div>

      {/* ВМІСТ ТАБІВ */}
      <div className="mt-6">
        {/* ТАБ 1: ЧЕКЛІСТ 6 ГЕЙТІВ ЯКОСТІ */}
        {activeTab === 'checklist' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {releaseData?.qualityGates?.map((gate) => {
                const isChecked = !!draft?.gatesChecked?.[gate.id];
                return (
                  <div
                    key={gate.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isChecked
                        ? 'bg-slate-950/50 border-emerald-500/30'
                        : 'bg-rose-950/20 border-rose-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleGate(gate.id, isChecked)}
                          className="w-4 h-4 rounded border-slate-700 text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                        <span className="font-bold text-sm text-white">{gate.name}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isChecked
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {isChecked ? 'PASSED' : 'REQUIRED'}
                      </span>
                    </div>

                    <ul className="text-xs text-slate-400 space-y-1 pl-6 list-disc">
                      {gate.requirements.map((req, idx) => (
                        <li key={idx}>{req}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ТАБ 2: ДОКАЗИ ГОТОВНОСТІ (EVIDENCE LINKS) */}
        {activeTab === 'evidence' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-purple-400">
                📎 Трасованість доказів (Evidence Traceability)
              </h3>
              <p className="text-xs text-slate-400">
                Згідно регламенту, реліз не може бути переведений у стан готовності без посилань на PR, задачу в Jira, протокол юніт-тестів та скріншот перевірки живого середовища.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-500 font-medium mb-1">1. Pull Request URL:</div>
                  <a
                    href={draft?.evidenceLinks?.prUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-cyan-400 hover:underline break-all"
                  >
                    {draft?.evidenceLinks?.prUrl || 'Не вказано'}
                  </a>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-500 font-medium mb-1">2. Jira Issue Key:</div>
                  <span className="font-mono text-emerald-400 font-bold">
                    {draft?.evidenceLinks?.jiraKey || 'Не вказано'}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-500 font-medium mb-1">3. Test Execution Evidence:</div>
                  <span className="font-mono text-white">
                    {draft?.evidenceLinks?.testEvidence || 'Не вказано'}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-500 font-medium mb-1">4. Live Verification Artifact:</div>
                  <span className="font-mono text-purple-300">
                    {draft?.evidenceLinks?.screenshotArtifact || 'Не вказано'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ТАБ 3: ПОГОДЖЕННЯ МЕНТОРА (CHANGE APPROVAL) */}
        {activeTab === 'approval' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-purple-400">
                ✍️ Цифровий підпис ментора для High-Risk змін
              </h3>
              <p className="text-xs text-slate-400">
                Зміни високого та критичного рівня ризику вимагають обов'язкового підтвердження ментором або лідом. Звичайний учень не може підписати власний реліз.
              </p>

              {draft?.mentorApproval ? (
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-300 text-sm">✅ Change Approval Підписано</span>
                    <span className="text-slate-500">
                      {new Date(draft.mentorApproval.approvedAt).toLocaleString()}
                    </span>
                  </div>
                  <div>Підписав: <strong>{draft.mentorApproval.approvedByName}</strong></div>
                  <div className="text-slate-400 italic">Примітки: «{draft.mentorApproval.notes}»</div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Примітки рецензента (Review Notes):</label>
                    <input
                      type="text"
                      value={mentorNotes}
                      onChange={(e) => setMentorNotes(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-slate-400">
                      Погоджувач: <strong>{mentorActor.name}</strong> ({mentorActor.role})
                    </span>
                    <button
                      onClick={handleApproveRelease}
                      disabled={loading}
                      className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 font-bold text-xs text-white shadow-md transition-all"
                    >
                      ✍️ Підписати Change Approval
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ТАБ 4: РЕЄСТР РЕЛІЗІВ ТА FOLLOW-UPS */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-300">📜 Реєстр проведених релізів</h3>
            <div className="space-y-3">
              {releaseData?.releaseHistory?.map((rel) => (
                <div key={rel.id} className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-purple-300">{rel.versionTag}</span>
                      <span className="text-xs text-white font-semibold">{rel.summary}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rel.outcome === 'SUCCESSFUL_DEPLOY'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {rel.outcome}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    Деплой виконав: <strong>{rel.deployedBy}</strong> | Час: {new Date(rel.deployedAt).toLocaleString()}
                  </p>

                  {rel.followUpTasks?.length > 0 && (
                    <div className="pt-2 border-t border-slate-900 text-xs">
                      <span className="text-slate-400 font-semibold">Follow-up завдання:</span>
                      <ul className="list-disc pl-5 text-slate-400 mt-1 space-y-0.5">
                        {rel.followUpTasks.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
