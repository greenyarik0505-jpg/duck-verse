'use client';

import { useState, useEffect, useCallback } from 'react';

export default function CohortTeamsView({ currentUser }) {
  const [activeTab, setActiveTab] = useState('teams'); // 'teams' | 'manage' | 'retro' | 'permissions'
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('team-cyber-ducks-01');
  const [selectedTeamDetails, setSelectedTeamDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [generatedInvite, setGeneratedInvite] = useState(null);

  // Форма нової команди
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamCapacity, setNewTeamCapacity] = useState(5);

  // Форма інвайту
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');

  // Форма ретроспективи
  const [retroForm, setRetroForm] = useState({
    whatWentWell: '',
    whatToImprove: '',
    actionItems: '',
  });

  // Завантаження списку команд
  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/academy/cohorts?view=teams');
      const data = await res.json();
      if (data.success) {
        setTeams(data.teams || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  // Завантаження деталей обраної команди
  const fetchTeamDetails = useCallback(async (teamId) => {
    if (!teamId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/academy/cohorts?view=details&teamId=${teamId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedTeamDetails(data.team);
      } else {
        setSelectedTeamDetails(null);
      }
    } catch {
      setSelectedTeamDetails(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  useEffect(() => {
    if (selectedTeamId) {
      fetchTeamDetails(selectedTeamId);
    }
  }, [selectedTeamId, fetchTeamDetails]);

  // Створення нової команди
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch('/api/academy/cohorts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_team',
          name: newTeamName,
          capacity: Number(newTeamCapacity),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`🎉 Команду "${data.team.name}" успішно створено!`);
        setNewTeamName('');
        await fetchTeams();
        setSelectedTeamId(data.team.id);
        setActiveTab('teams');
      } else {
        setActionMessage(`Помилка: ${data.error}`);
      }
    } catch (err) {
      setActionMessage(`Помилка мережі: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Створення одноразового інвайту
  const handleCreateInvite = async (e) => {
    e.preventDefault();
    if (!selectedTeamId) return;
    try {
      setLoading(true);
      const res = await fetch('/api/academy/cohorts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_invite',
          teamId: selectedTeamId,
          invitedEmail: inviteEmail,
          targetRole: inviteRole,
          expiresHours: 72,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedInvite(data.invite);
        setActionMessage(`📩 Одноразовий інвайт для ${data.invite.invitedEmail} успішно згенеровано (дійсний 72 год)!`);
        setInviteEmail('');
      } else {
        setActionMessage(`Помилка створення інвайту: ${data.error}`);
      }
    } catch (err) {
      setActionMessage(`Помилка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Відкликання інвайту
  const handleRevokeInvite = async (token) => {
    try {
      setLoading(true);
      const res = await fetch('/api/academy/cohorts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revoke_invite',
          token,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedInvite(null);
        setActionMessage('🚫 Запрошення успішно анульовано.');
      }
    } catch (err) {
      setActionMessage(`Помилка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Додавання ретроспективи
  const handleSubmitRetro = async (e) => {
    e.preventDefault();
    if (!selectedTeamId) return;
    try {
      setLoading(true);
      const res = await fetch('/api/academy/cohorts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_retro',
          teamId: selectedTeamId,
          items: retroForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage('✅ Командну ретроспективу успішно збережено!');
        setRetroForm({ whatWentWell: '', whatToImprove: '', actionItems: '' });
        await fetchTeamDetails(selectedTeamId);
      } else {
        setActionMessage(`Помилка: ${data.error}`);
      }
    } catch (err) {
      setActionMessage(`Помилка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Архівація команди
  const handleArchiveTeam = async (teamId) => {
    if (!confirm('Ви впевнені, що бажаєте заархівувати команду? Подальші зміни будуть заблоковані.')) return;
    try {
      setLoading(true);
      const res = await fetch('/api/academy/cohorts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'archive_team',
          teamId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage('📦 ' + data.result.message);
        await fetchTeams();
        await fetchTeamDetails(teamId);
      } else {
        setActionMessage(`Помилка: ${data.error}`);
      }
    } catch (err) {
      setActionMessage(`Помилка: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="academy-skills-section" style={{ marginTop: '48px' }}>
      {/* Заголовок SCRUM-94 */}
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
            <span>👥</span> COHORTS, TEAMS & INVITATIONS (SCRUM-94)
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: '4px 0 0 0' }}>
            Управління когортами, студентськими командами, одноразовими інвайтами (72h), ізоляцією даних та командними ретроспективами.
          </p>
        </div>

        {/* Навігаційні таби */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('teams')}
            className={`academy-tab-button ${activeTab === 'teams' ? 'active' : ''}`}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              border: activeTab === 'teams' ? '1px solid #38bdf8' : '1px solid #334155',
              background: activeTab === 'teams' ? 'rgba(56, 189, 248, 0.15)' : '#0f172a',
              color: activeTab === 'teams' ? '#38bdf8' : '#94a3b8',
              fontWeight: 'bold',
            }}
          >
            👥 Команди когорти ({teams.length})
          </button>

          <button
            onClick={() => setActiveTab('manage')}
            className={`academy-tab-button ${activeTab === 'manage' ? 'active' : ''}`}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              border: activeTab === 'manage' ? '1px solid #10b981' : '1px solid #334155',
              background: activeTab === 'manage' ? 'rgba(16, 185, 129, 0.15)' : '#0f172a',
              color: activeTab === 'manage' ? '#10b981' : '#94a3b8',
              fontWeight: 'bold',
            }}
          >
            ➕ Створити / Інвайти
          </button>

          <button
            onClick={() => setActiveTab('retro')}
            className={`academy-tab-button ${activeTab === 'retro' ? 'active' : ''}`}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              border: activeTab === 'retro' ? '1px solid #f59e0b' : '1px solid #334155',
              background: activeTab === 'retro' ? 'rgba(245, 158, 11, 0.15)' : '#0f172a',
              color: activeTab === 'retro' ? '#f59e0b' : '#94a3b8',
              fontWeight: 'bold',
            }}
          >
            🔄 Ретроспектива
          </button>

          <button
            onClick={() => setActiveTab('permissions')}
            className={`academy-tab-button ${activeTab === 'permissions' ? 'active' : ''}`}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              border: activeTab === 'permissions' ? '1px solid #a855f7' : '1px solid #334155',
              background: activeTab === 'permissions' ? 'rgba(168, 85, 247, 0.15)' : '#0f172a',
              color: activeTab === 'permissions' ? '#a855f7' : '#94a3b8',
              fontWeight: 'bold',
            }}
          >
            🛡️ Матриця прав
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

      {/* ТАБ 1: КОМАНДИ КОГОРТИ */}
      {activeTab === 'teams' && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {teams.map(t => (
              <div
                key={t.id}
                onClick={() => setSelectedTeamId(t.id)}
                style={{
                  padding: '18px',
                  borderRadius: '10px',
                  background: selectedTeamId === t.id ? 'rgba(56, 189, 248, 0.1)' : 'rgba(15, 23, 42, 0.8)',
                  border: selectedTeamId === t.id ? '1px solid #38bdf8' : '1px solid #1e293b',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  transition: 'border 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      background: t.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                      color: t.status === 'ACTIVE' ? '#10b981' : '#94a3b8',
                      border: t.status === 'ACTIVE' ? '1px solid #10b981' : '1px solid #64748b',
                    }}
                  >
                    {t.status === 'ACTIVE' ? '🟢 Активна' : '📦 Архів'}
                  </span>

                  <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 'bold' }}>
                    {t.memberCount}/{t.capacity} учасників
                  </span>
                </div>

                <h4 style={{ margin: '4px 0 0 0', fontSize: '16px', color: '#f8fafc' }}>
                  {t.name}
                </h4>

                <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                  <span>Лідер: <code style={{ color: '#e2e8f0' }}>{t.ownerId}</code></span>
                  <span>Ментор: <code style={{ color: '#a855f7' }}>{t.mentorId}</code></span>
                </div>

                <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    {t.isMember ? '✓ Ви є учасником' : '○ Чужа команда (ізольовано)'}
                  </span>
                  {t.canManage && t.status === 'ACTIVE' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArchiveTeam(t.id);
                      }}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: '#334155',
                        color: '#cbd5e1',
                        border: 'none',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      Архівувати
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Деталі обраної команди */}
          {selectedTeamDetails && (
            <div
              style={{
                marginTop: '24px',
                padding: '20px',
                borderRadius: '10px',
                background: '#0b1120',
                border: '1px solid #1e293b',
              }}
            >
              <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#38bdf8' }}>
                📋 Склад команди: {selectedTeamDetails.name} ({selectedTeamDetails.members?.length}/{selectedTeamDetails.capacity})
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                {selectedTeamDetails.members?.map(m => (
                  <div
                    key={m.userId}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '6px',
                      background: '#1e293b',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#f8fafc' }}>
                        {m.username}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>ID: {m.userId}</div>
                    </div>
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        background: m.role === 'owner' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: m.role === 'owner' ? '#38bdf8' : '#10b981',
                      }}
                    >
                      {m.role.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ТАБ 2: СТВОРИТИ КОМАНДУ ТА ІНВАЙТИ */}
      {activeTab === 'manage' && (
        <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', flexWrap: 'wrap' }}>
          {/* Створення команди */}
          <form
            onSubmit={handleCreateTeam}
            style={{
              padding: '20px',
              borderRadius: '10px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid #1e293b',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <h4 style={{ margin: 0, fontSize: '16px', color: '#10b981' }}>
              ➕ Створити нову команду
            </h4>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                Назва команди:
              </label>
              <input
                type="text"
                required
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="наприклад: Duck Hackers L2"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: '#0b1120',
                  border: '1px solid #334155',
                  color: '#fff',
                  fontSize: '13px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                Максимальна місткість (2-10 учасників):
              </label>
              <input
                type="number"
                min={2}
                max={10}
                value={newTeamCapacity}
                onChange={(e) => setNewTeamCapacity(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: '#0b1120',
                  border: '1px solid #334155',
                  color: '#fff',
                  fontSize: '13px',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                background: '#10b981',
                color: '#0f172a',
                fontWeight: 'bold',
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer',
                alignSelf: 'flex-start',
              }}
            >
              Створити команду
            </button>
          </form>

          {/* Генерація одноразового інвайту */}
          <form
            onSubmit={handleCreateInvite}
            style={{
              padding: '20px',
              borderRadius: '10px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid #1e293b',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <h4 style={{ margin: 0, fontSize: '16px', color: '#38bdf8' }}>
              📩 Одноразове запрошення (Single-Use Token)
            </h4>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                Email майбутнього учасника:
              </label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="student@example.com"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: '#0b1120',
                  border: '1px solid #334155',
                  color: '#fff',
                  fontSize: '13px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                Цільова роль:
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: '#0b1120',
                  border: '1px solid #334155',
                  color: '#fff',
                  fontSize: '13px',
                }}
              >
                <option value="member">Member (Учасник)</option>
                <option value="mentor">Mentor (Тільки для Admin)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                background: '#38bdf8',
                color: '#0f172a',
                fontWeight: 'bold',
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer',
                alignSelf: 'flex-start',
              }}
            >
              Згенерувати одноразовий інвайт (72h)
            </button>

            {generatedInvite && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '12px',
                  borderRadius: '6px',
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid #38bdf8',
                  fontSize: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>Токен: {generatedInvite.token}</span>
                  <button
                    onClick={() => handleRevokeInvite(generatedInvite.token)}
                    type="button"
                    style={{
                      padding: '3px 6px',
                      borderRadius: '4px',
                      background: '#f43f5e',
                      color: '#fff',
                      border: 'none',
                      fontSize: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    Відкликати
                  </button>
                </div>
                <div style={{ color: '#94a3b8', marginTop: '4px' }}>URL: {generatedInvite.inviteUrl}</div>
                <div style={{ color: '#10b981', marginTop: '2px' }}>Дійсний 72 години (Одноразове використання)</div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* ТАБ 3: РЕТРОСПЕКТИВА */}
      {activeTab === 'retro' && (
        <div style={{ marginTop: '20px' }}>
          <form
            onSubmit={handleSubmitRetro}
            style={{
              padding: '20px',
              borderRadius: '10px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid #1e293b',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              marginBottom: '20px',
            }}
          >
            <h4 style={{ margin: 0, fontSize: '16px', color: '#f59e0b' }}>
              🔄 Додати командну ретроспективу (Sprint Retro)
            </h4>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#10b981', marginBottom: '4px', fontWeight: 'bold' }}>
                🟢 Що вдалося (What went well):
              </label>
              <textarea
                required
                rows={2}
                value={retroForm.whatWentWell}
                onChange={(e) => setRetroForm({ ...retroForm, whatWentWell: e.target.value })}
                placeholder="Успіхи спринту, закриті задачі Jira..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: '#0b1120',
                  border: '1px solid #334155',
                  color: '#fff',
                  fontSize: '13px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#f59e0b', marginBottom: '4px', fontWeight: 'bold' }}>
                🟡 Що можна покращити (What to improve):
              </label>
              <textarea
                required
                rows={2}
                value={retroForm.whatToImprove}
                onChange={(e) => setRetroForm({ ...retroForm, whatToImprove: e.target.value })}
                placeholder="Складнощі, вузькі місця у пайплайні..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: '#0b1120',
                  border: '1px solid #334155',
                  color: '#fff',
                  fontSize: '13px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#38bdf8', marginBottom: '4px', fontWeight: 'bold' }}>
                🔵 Екшн-айтеми (Action Items):
              </label>
              <textarea
                required
                rows={2}
                value={retroForm.actionItems}
                onChange={(e) => setRetroForm({ ...retroForm, actionItems: e.target.value })}
                placeholder="Конкретні кроки на наступний тиждень..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: '#0b1120',
                  border: '1px solid #334155',
                  color: '#fff',
                  fontSize: '13px',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                background: '#f59e0b',
                color: '#0f172a',
                fontWeight: 'bold',
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer',
                alignSelf: 'flex-start',
              }}
            >
              Зберегти ретроспективу
            </button>
          </form>

          {/* Історія ретроспектив */}
          {selectedTeamDetails?.retrospectives?.map(r => (
            <div
              key={r.id}
              style={{
                marginBottom: '12px',
                padding: '16px',
                borderRadius: '8px',
                background: '#0b1120',
                border: '1px solid #1e293b',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', color: '#94a3b8' }}>
                <span>Автор: <strong style={{ color: '#f8fafc' }}>{r.submittedBy}</strong></span>
                <span>{new Date(r.createdAt).toLocaleString('uk-UA')}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', fontSize: '13px' }}>
                <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <strong style={{ color: '#10b981' }}>🟢 Що вдалося:</strong>
                  <p style={{ margin: '4px 0 0 0', color: '#e2e8f0' }}>{r.whatWentWell}</p>
                </div>
                <div style={{ padding: '10px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                  <strong style={{ color: '#f59e0b' }}>🟡 Що покращити:</strong>
                  <p style={{ margin: '4px 0 0 0', color: '#e2e8f0' }}>{r.whatToImprove}</p>
                </div>
                <div style={{ padding: '10px', background: 'rgba(56, 189, 248, 0.08)', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                  <strong style={{ color: '#38bdf8' }}>🔵 Екшн-айтеми:</strong>
                  <p style={{ margin: '4px 0 0 0', color: '#e2e8f0' }}>{r.actionItems}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ТАБ 4: МАТРИЦЯ ПРАВ */}
      {activeTab === 'permissions' && (
        <div style={{ marginTop: '20px' }}>
          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'rgba(168, 85, 247, 0.08)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              marginBottom: '16px',
            }}
          >
            <h4 style={{ margin: 0, color: '#a855f7', fontSize: '15px' }}>
              🛡️ Рольова матриця та гарантія ізоляції когорт (Multi-Tenant Boundaries)
            </h4>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>
              Суворий розподіл прав запобігає ескалації привілеїв та несанкціонованому витоку навчальних даних між когортами.
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', color: '#cbd5e1' }}>
              <thead>
                <tr style={{ background: '#0b1120', borderBottom: '1px solid #334155' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Операція</th>
                  <th style={{ padding: '10px', textAlign: 'center', color: '#38bdf8' }}>Owner (Лідер)</th>
                  <th style={{ padding: '10px', textAlign: 'center', color: '#a855f7' }}>Mentor</th>
                  <th style={{ padding: '10px', textAlign: 'center', color: '#10b981' }}>Member (Учень)</th>
                  <th style={{ padding: '10px', textAlign: 'center', color: '#f43f5e' }}>Admin</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '10px' }}>Створення одноразового інвайту (72h)</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#10b981' }}>✓ Так</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#10b981' }}>✓ Так</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#f43f5e' }}>✕ Ні</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#10b981' }}>✓ Так</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '10px' }}>Призначення ментора / зміна ролі</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#f43f5e' }}>✕ Заблоковано</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#f43f5e' }}>✕ Заблоковано</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#f43f5e' }}>✕ Заблоковано</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#10b981' }}>✓ Так</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '10px' }}>Проведення ретроспективи команди</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#10b981' }}>✓ Так</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#10b981' }}>✓ Так</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#10b981' }}>✓ Так</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#10b981' }}>✓ Так</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '10px' }}>Архівація команди (Read-only)</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#10b981' }}>✓ Так</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#f43f5e' }}>✕ Ні</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#f43f5e' }}>✕ Ні</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#10b981' }}>✓ Так</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px' }}>Доступ до даних інших когорт</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#f43f5e' }}>✕ Ізольовано</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#f43f5e' }}>✕ Тільки свої</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#f43f5e' }}>✕ Ізольовано</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#10b981' }}>✓ Так</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
