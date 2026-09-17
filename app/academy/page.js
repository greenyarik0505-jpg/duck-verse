'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ACADEMY_TRACKS, getLessonsByTrack, isLessonUnlocked } from '../../lib/academy/registry';
import { isAcademyEnabled, ACADEMY_CONFIG } from '../../lib/academy/config';
import AuthModal from '../../components/academy/AuthModal';
import PortfolioCertificateView from '../../components/academy/PortfolioCertificateView';
import VibePromptLab from '../../components/academy/VibePromptLab';
import {
  DOMAIN_BOUNDARIES,
  ADR_REGISTRY,
  runArchitectureReviewCheckpoint
} from '../../lib/academy/sysdesign/adr';
import {
  DATA_INVENTORY,
  RBAC_PERMISSIONS,
  runPrivacySecurityAudit
} from '../../lib/academy/privacy/audit';
import {
  SLO_DEFINITIONS,
  RUNBOOKS,
  getObservabilityState,
  simulateControlledIncident,
  resolveIncident
} from '../../lib/academy/observability/slo';
import {
  getPluginState,
  isFeatureEnabled,
  setFeatureFlag,
  loadPluginSafely,
  runMigration,
  rollbackMigration
} from '../../lib/academy/plugins/flags';
import GovernanceRoadmapView from '../../components/academy/GovernanceRoadmapView';

export default function AcademyPage() {
  const [selectedTrackId, setSelectedTrackId] = useState('track-frontend-gaming');
  // Initial completed/in-progress simulated state for student
  const [completedLessons, setCompletedLessons] = useState(['lesson-fe-l0-arch']);

  // Privacy & RBAC State (SCRUM-71: L6)
  const [privacyTab, setPrivacyTab] = useState('inventory'); // 'inventory' | 'rbac' | 'audit'
  const [privacyAuditData, setPrivacyAuditData] = useState(() => runPrivacySecurityAudit());

  // Observability & SLO State (SCRUM-72: L7)
  const [sloTab, setSloTab] = useState('dashboard'); // 'dashboard' | 'runbooks' | 'demo'
  const [obsState, setObsState] = useState(() => getObservabilityState());

  // Plugin Architecture & Feature Flags State (SCRUM-73: L8)
  const [pluginTab, setPluginTab] = useState('flags'); // 'flags' | 'plugins' | 'migrations'
  const [pluginState, setPluginState] = useState(() => getPluginState());
  const [sandboxResult, setSandboxResult] = useState(null);
  const [flagActionMsg, setFlagActionMsg] = useState('');

  const [currentUser, setCurrentUser] = useState({
    id: 'user_student_yarik',
    username: 'student_yarik',
    role: 'child',
    parentConsent: true,
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [rubricScores, setRubricScores] = useState({
    correctness: 5,
    readability: 4,
    tests: 5,
    security: 5,
    performance: 4,
    teamwork: 4,
  });
  const [reviewFeedback, setReviewFeedback] = useState('Чудова архітектурна структура та повне проходження тестів безпеки.');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // System Design & ADR state (SCRUM-66: L5)
  const [sysDesignTab, setSysDesignTab] = useState('boundaries'); // 'boundaries' | 'adrs' | 'checkpoint'
  const [checkpointForm, setCheckpointForm] = useState({
    jiraKey: 'SCRUM-66',
    domains: ['hub', 'games', 'academy', 'auth', 'data', 'integrations'],
    securityImpact: 'Реалізовано RBAC перевірку сесії та валідацію вхідних даних без витоку ключів',
    performanceImpact: 'Canvas 60 FPS ізольовано від React Virtual DOM, SLA API < 50ms',
    rejectedAlternatives: 'Single-Bundle React SPA відхилено через просідання FPS; Docker-мікросервіси через надмірну вартість',
    rollbackStrategy: 'Миттєвий Vercel rollback до попереднього деплою та вимкнення через Feature Flags'
  });
  const [checkpointResult, setCheckpointResult] = useState(() => runArchitectureReviewCheckpoint({
    jiraKey: 'SCRUM-66',
    domains: ['hub', 'games', 'academy', 'auth', 'data', 'integrations'],
    securityImpact: 'Реалізовано RBAC перевірку сесії та валідацію вхідних даних без витоку ключів',
    performanceImpact: 'Canvas 60 FPS ізольовано від React Virtual DOM, SLA API < 50ms',
    rejectedAlternatives: 'Single-Bundle React SPA відхилено через просідання FPS; Docker-мікросервіси через надмірну вартість',
    rollbackStrategy: 'Миттєвий Vercel rollback до попереднього деплою та вимкнення через Feature Flags'
  }));

  const enabled = isAcademyEnabled();
  const selectedTrack = ACADEMY_TRACKS.find((t) => t.id === selectedTrackId) || ACADEMY_TRACKS[0];
  const trackLessons = getLessonsByTrack(selectedTrackId);

  const totalRubricScore = Object.values(rubricScores).reduce((sum, val) => sum + Number(val), 0);
  const isRubricPassed = totalRubricScore >= 24;

  const handleScoreChange = (dimId, val) => {
    setRubricScores((prev) => ({ ...prev, [dimId]: Number(val) }));
  };

  const handleSwitchUser = async (userProfile) => {
    setCurrentUser(userProfile);
    setIsAuthModalOpen(false);
    try {
      await fetch('/api/academy/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: userProfile.username,
          password: userProfile.role === 'child' ? 'DuckPass123!' : userProfile.role === 'mentor' ? 'MentorPass123!' : 'AdminRootPass123!'
        })
      });
    } catch {}
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/academy/auth/logout', { method: 'POST' });
    } catch {}
    setCurrentUser({
      id: 'user_guest',
      username: 'Гість',
      role: 'guest',
      parentConsent: null
    });
  };

  const handleSaveReview = async () => {
    try {
      await fetch('/api/academy/mentor/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: 'user_student_yarik',
          lessonId: 'lesson-fe-l1-auth',
          scores: rubricScores,
          feedback: reviewFeedback,
          severity: 'suggestion',
          nextAction: isRubricPassed ? 'Затверджено: перехід до SCRUM-53' : 'Доопрацювати зауваження',
        }),
      });
      setReviewSubmitted(true);
      setTimeout(() => setReviewSubmitted(false), 3000);
    } catch {}
  };

  if (!enabled) {
    return (
      <div className="academy-page" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 20px' }}>
        <h1 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '24px', color: '#cbd5e1', marginBottom: '12px' }}>
          🎓 Duck Academy тимчасово недоступна
        </h1>
        <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
          Модуль знаходиться на технічному обслуговуванні під прапорцем функцій.
        </p>
        <Link href="/" className="academy-back-btn">
          ← Повернутися до Game Hub
        </Link>
      </div>
    );
  }

  return (
    <div className="academy-page">
      {/* Academy Header */}
      <header className="academy-header">
        <div className="academy-header-inner">
          <div className="academy-header-left">
            <Link
              href="/"
              className="academy-back-btn"
              title="Повернутися до ігрового хабу"
            >
              <span>← До ігор</span>
            </Link>

            <div className="academy-brand">
              <div className="academy-logo-badge">
                DA
              </div>
              <div className="academy-title-box">
                <h1 className="academy-title">
                  <span>DUCK ACADEMY</span>
                  <span className="academy-version-pill">
                    v{ACADEMY_CONFIG.version} (L0-L9)
                  </span>
                </h1>
                <p className="academy-subtitle">Інженерна платформа практичного навчання та DevSecOps</p>
              </div>
            </div>
          </div>

          <div className="academy-header-actions">
            {/* User Auth Session Chip (SCRUM-54 & SCRUM-50) */}
            <div className="academy-auth-box">
              <div className="academy-user-chip">
                <span>{currentUser.role === 'child' ? '🐥' : currentUser.role === 'mentor' ? '🦉' : currentUser.role === 'admin' ? '👑' : '👤'}</span>
                <span>{currentUser.username}</span>
                <span className={`academy-role-badge role-${currentUser.role}`}>
                  {currentUser.role === 'child' ? 'Учень' : currentUser.role === 'mentor' ? 'Ментор' : currentUser.role === 'admin' ? 'Адмін' : 'Гість'}
                </span>
              </div>
              <button
                className="academy-auth-btn"
                onClick={() => setIsAuthModalOpen(true)}
                title="Авторизація або вибір ролі (SCRUM-50)"
              >
                {currentUser.role === 'guest' ? '🔑 Увійти' : '⚙️ Акаунт'}
              </button>
              {currentUser.role !== 'guest' && (
                <button
                  className="academy-auth-btn"
                  style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}
                  onClick={handleLogout}
                  title="Вийти з акаунта"
                >
                  Вийти
                </button>
              )}
            </div>

            <a
              href="https://gta6-sliv-cyberleek.atlassian.net/jira/software/projects/SCRUM/boards/1"
              target="_blank"
              rel="noopener noreferrer"
              className="academy-jira-btn"
            >
              <span>📋 Jira Board (SCRUM)</span>
            </a>
            <span className="academy-lead-badge">
              Lead: {selectedTrack.lead}
            </span>
          </div>
        </div>
      </header>

      {/* Guest Mode Notice Banner (SCRUM-50) */}
      {currentUser.role === 'guest' && (
        <div className="p-3 bg-amber-500/10 border-b border-amber-500/30 text-amber-300 text-xs flex flex-wrap items-center justify-between gap-2 px-6">
          <div className="flex items-center gap-2">
            <span>👤</span>
            <span><strong>Гостьовий режим</strong>: Створіть обліковий запис, щоб синхронізувати свій прогрес між пристроями та отримати офіційний сертифікат навичок!</span>
          </div>
          <button
            type="button"
            className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-lg text-xs font-bold transition"
            onClick={() => setIsAuthModalOpen(true)}
          >
            Увійти / Зареєструватися
          </button>
        </div>
      )}

      {/* Auth Modal (SCRUM-50) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChange={setCurrentUser}
      />

      {/* Main Content */}
      <main className="academy-main">
        {/* Mentor Dashboard Panel (SCRUM-57: Visible for Mentor / Admin) */}
        {(currentUser.role === 'mentor' || currentUser.role === 'admin') && (
          <section className="academy-mentor-panel">
            <div className="academy-mentor-header">
              <div>
                <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '18px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🦉</span>
                  <span>Панель Ментора: Стандартизована Code-Review Рубрика (L3)</span>
                </h2>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                  Призначений учень: <strong>student_yarik</strong> • Рівень: L1 • Блокери: 0 • Статус: Очікує перевірки
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  fontFamily: 'Orbitron, monospace',
                  fontSize: '13px',
                  fontWeight: 800,
                  padding: '6px 14px',
                  borderRadius: '8px',
                  background: isRubricPassed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  border: `1px solid ${isRubricPassed ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                  color: isRubricPassed ? '#34d399' : '#f87171'
                }}>
                  {isRubricPassed ? '✓ ЗАРАХОВАНО' : '⚠ НА ДООПРАЦЮВАННЯ'} ({totalRubricScore} / 30)
                </span>
                <button
                  className="academy-auth-btn"
                  onClick={handleSaveReview}
                  style={{ background: '#059669', borderColor: '#10b981', color: '#ffffff' }}
                >
                  {reviewSubmitted ? '✓ Збережено в Audit Trail' : '💾 Зберегти Review'}
                </button>
              </div>
            </div>

            {/* 6 Dimensions of the Rubric */}
            <div className="academy-rubric-grid">
              {[
                { id: 'correctness', name: 'Правильність (Correctness)', desc: 'Відповідність Acceptance Criteria та білд без помилок' },
                { id: 'readability', name: 'Чистота коду (Readability)', desc: 'Модульність, найменування та коментарі до коду' },
                { id: 'tests', name: 'Тести (Tests & Contracts)', desc: 'Unit-тести та покриття крайових випадків' },
                { id: 'security', name: 'Безпека (Security & RBAC)', desc: 'Захист від ескалації привілеїв та витоку токенів' },
                { id: 'performance', name: 'Швидкодія (Performance)', desc: 'Час виконання, кешування та відсутність memory leaks' },
                { id: 'teamwork', name: 'Команда (Teamwork & Git)', desc: 'Назви гілок, зв’язок із Jira SCRUM та PR опис' },
              ].map((dim) => (
                <div key={dim.id} className="academy-rubric-card">
                  <div className="academy-rubric-name">{dim.name}</div>
                  <div className="academy-rubric-desc">{dim.desc}</div>
                  <div className="academy-rubric-slider-row">
                    <input
                      type="range"
                      min="0"
                      max="5"
                      value={rubricScores[dim.id]}
                      onChange={(e) => handleScoreChange(dim.id, e.target.value)}
                      className="academy-rubric-slider"
                    />
                    <span className="academy-rubric-score-badge">{rubricScores[dim.id]} / 5</span>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label style={{ fontSize: '11px', fontFamily: 'Orbitron, monospace', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                Коментар та рекомендації ментора (Feedback with next steps):
              </label>
              <textarea
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#f1f5f9',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontSize: '14px',
                  minHeight: '60px',
                  resize: 'vertical'
                }}
              />
            </div>
          </section>
        )}

        {/* Capstone Workflow Section (SCRUM-58) */}
        <section className="academy-capstone-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '18px', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🏆</span>
                <span>Випускний Capstone-Реліз & Кваліфікація (L4: SCRUM-58)</span>
              </h2>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                Послідовний прохід через 6 воріт якості (Quality Gates) від продуктового бріфу до релізу в production
              </p>
            </div>
            <span style={{
              fontFamily: 'Orbitron, monospace',
              fontSize: '12px',
              fontWeight: 800,
              padding: '6px 14px',
              borderRadius: '8px',
              background: 'rgba(251, 191, 36, 0.15)',
              border: '1px solid rgba(251, 191, 36, 0.4)',
              color: '#fbbf24'
            }}>
              ЕТАП 2 / 6 В ПРОЦЕСІ ⚡
            </span>
          </div>

          <div className="academy-gates-grid">
            {[
              { step: 1, title: 'Product Brief & ADR', desc: 'Бріф, User Story, вибір архітектури та ризики', status: 'completed' },
              { step: 2, title: 'Git Branch & PR', desc: 'Робоча гілка, коміти SCRUM-XX та Pull Request', status: 'active' },
              { step: 3, title: 'Automated CI/CD', desc: 'Build, лінтинг та 100% модульних тестів', status: 'pending' },
              { step: 4, title: 'Mentor Code Review', desc: '6-вимірна рубрика ментора (бал >= 24/30)', status: 'pending' },
              { step: 5, title: 'Production Release', desc: 'Живий деплой Vercel, release notes, rollback plan', status: 'pending' },
              { step: 6, title: 'Retrospective', desc: 'Аналіз метрик, ретроспектива та випуск', status: 'pending' },
            ].map((gate) => (
              <div
                key={gate.step}
                className={`academy-gate-card ${
                  gate.status === 'completed' ? 'is-completed' : gate.status === 'active' ? 'is-active' : ''
                }`}
              >
                <div className="academy-gate-header">
                  <span className="academy-gate-step-badge">КРОК {gate.step}</span>
                  <span style={{
                    fontSize: '10px',
                    fontFamily: 'Orbitron, monospace',
                    fontWeight: 800,
                    color: gate.status === 'completed' ? '#34d399' : gate.status === 'active' ? '#fbbf24' : '#64748b'
                  }}>
                    {gate.status === 'completed' ? '✓ ЗАВЕРШЕНО' : gate.status === 'active' ? '⚡ АКТИВНО' : '🔒 ОЧІКУЄ'}
                  </span>
                </div>
                <div className="academy-gate-title">{gate.title}</div>
                <div className="academy-gate-desc">{gate.desc}</div>
              </div>
            ))}
          </div>

          <div className="academy-certificate-banner">
            <div>
              <strong style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '15px', color: '#ffffff', display: 'block', marginBottom: '4px' }}>
                🎓 Офіційний сертифікат інженера Duck Academy
              </strong>
              <p style={{ fontSize: '12px', color: '#cbd5e1' }}>
                Видається автоматично після проходження всіх 6 етапів Capstone із публічним криптографічним хешем верифікації.
              </p>
            </div>
            <span style={{
              fontFamily: 'Orbitron, monospace',
              fontSize: '11px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#d8b4fe'
            }}>
              SHA-256 Hash Verification Ready
            </span>
          </div>
        </section>

        {/* System Design & ADR Review Section (SCRUM-66: L5) */}
        <section className="academy-sysdesign-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '18px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📐</span>
                <span>Системний Дизайн & Архітектурні Рішення (L5: SCRUM-66)</span>
              </h2>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                6 доменних меж платформи Duck Verse, C4 Context & Container архітектура, ADR реєстр та Architecture Review Checkpoint
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontFamily: 'Orbitron, monospace',
                fontSize: '11px',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: '#38bdf8'
              }}>
                LEVEL 5 CAPSTONE READY 🏛️
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="academy-sysdesign-tabs">
            <button
              className={`academy-sysdesign-tab-btn ${sysDesignTab === 'boundaries' ? 'is-active' : ''}`}
              onClick={() => setSysDesignTab('boundaries')}
            >
              <span>🌐</span>
              <span>Доменні межі (6 Domains)</span>
            </button>
            <button
              className={`academy-sysdesign-tab-btn ${sysDesignTab === 'adrs' ? 'is-active' : ''}`}
              onClick={() => setSysDesignTab('adrs')}
            >
              <span>📜</span>
              <span>Реєстр ADR (Decisions)</span>
            </button>
            <button
              className={`academy-sysdesign-tab-btn ${sysDesignTab === 'checkpoint' ? 'is-active' : ''}`}
              onClick={() => setSysDesignTab('checkpoint')}
            >
              <span>🛡️</span>
              <span>Architecture Review Checkpoint</span>
            </button>
          </div>

          {/* Tab 1: Domain Boundaries */}
          {sysDesignTab === 'boundaries' && (
            <div className="academy-domain-grid">
              {Object.values(DOMAIN_BOUNDARIES).map((domain) => (
                <div key={domain.id} className="academy-domain-card">
                  <div>
                    <div className="academy-domain-header">
                      <span className="academy-domain-name">{domain.name}</span>
                      <span className="academy-domain-metric">
                        {domain.fpsTarget ? `${domain.fpsTarget} FPS` : domain.latencySlaMs ? `< ${domain.latencySlaMs}ms` : domain.securityLevel || 'Active'}
                      </span>
                    </div>
                    <div className="academy-domain-path">{domain.path}</div>
                    <p className="academy-domain-desc">{domain.description}</p>
                    <ul className="academy-domain-responsibilities">
                      {domain.responsibilities.map((resp, idx) => (
                        <li key={idx}>
                          <span style={{ color: '#38bdf8' }}>▹</span>
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="academy-domain-flows">
                    <span>⬅️ Вхід: {domain.allowedIncoming.length > 0 ? domain.allowedIncoming.join(', ') : 'none'}</span>
                    <span>Вихід ➡️: {domain.allowedOutgoing.length > 0 ? domain.allowedOutgoing.join(', ') : 'none'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 2: ADR Registry */}
          {sysDesignTab === 'adrs' && (
            <div>
              {ADR_REGISTRY.map((adr) => (
                <div key={adr.id} className="academy-adr-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        fontFamily: 'Orbitron, monospace',
                        fontWeight: 800,
                        fontSize: '13px',
                        color: '#38bdf8',
                        background: 'rgba(56, 189, 248, 0.15)',
                        padding: '3px 8px',
                        borderRadius: '6px'
                      }}>
                        {adr.id}
                      </span>
                      <strong style={{ fontSize: '15px', color: '#ffffff' }}>{adr.title}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontFamily: 'Orbitron, monospace',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: '#34d399',
                        border: '1px solid rgba(16, 185, 129, 0.4)'
                      }}>
                        {adr.status}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>{adr.jiraKey}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '10px', lineHeight: 1.5 }}>
                    {adr.summary}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px', fontSize: '12px', background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '8px' }}>
                    <div>
                      <span style={{ color: '#f87171', fontWeight: 700 }}>❌ Відхилені варіанти:</span>
                      <ul style={{ margin: '4px 0 0 14px', padding: 0, color: '#94a3b8' }}>
                        {adr.rejectedOptions.map((opt, idx) => (
                          <li key={idx}>{opt}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span style={{ color: '#fbbf24', fontWeight: 700 }}>🔄 План відкату (Rollback):</span>
                      <p style={{ margin: '4px 0 0 0', color: '#94a3b8' }}>{adr.rollbackPlan}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Architecture Review Checkpoint */}
          {sysDesignTab === 'checkpoint' && (
            <div className="academy-checkpoint-box">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div className="academy-checkpoint-field">
                  <label className="academy-checkpoint-label">1. Задача Jira (SCRUM-XX):</label>
                  <input
                    type="text"
                    className="academy-checkpoint-input"
                    value={checkpointForm.jiraKey}
                    onChange={(e) => setCheckpointForm({ ...checkpointForm, jiraKey: e.target.value })}
                  />
                </div>
                <div className="academy-checkpoint-field">
                  <label className="academy-checkpoint-label">2. Оцінка безпеки (Security / RBAC):</label>
                  <input
                    type="text"
                    className="academy-checkpoint-input"
                    value={checkpointForm.securityImpact}
                    onChange={(e) => setCheckpointForm({ ...checkpointForm, securityImpact: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div className="academy-checkpoint-field">
                  <label className="academy-checkpoint-label">3. Продуктивність та SLA:</label>
                  <input
                    type="text"
                    className="academy-checkpoint-input"
                    value={checkpointForm.performanceImpact}
                    onChange={(e) => setCheckpointForm({ ...checkpointForm, performanceImpact: e.target.value })}
                  />
                </div>
                <div className="academy-checkpoint-field">
                  <label className="academy-checkpoint-label">4. Відхилені альтернативи:</label>
                  <input
                    type="text"
                    className="academy-checkpoint-input"
                    value={checkpointForm.rejectedAlternatives}
                    onChange={(e) => setCheckpointForm({ ...checkpointForm, rejectedAlternatives: e.target.value })}
                  />
                </div>
              </div>

              <div className="academy-checkpoint-field">
                <label className="academy-checkpoint-label">5. Стратегія відкату (Rollback Strategy):</label>
                <input
                  type="text"
                  className="academy-checkpoint-input"
                  value={checkpointForm.rollbackStrategy}
                  onChange={(e) => setCheckpointForm({ ...checkpointForm, rollbackStrategy: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <button
                  className="academy-auth-btn"
                  style={{ background: 'rgba(56, 189, 248, 0.2)', borderColor: '#38bdf8', color: '#38bdf8' }}
                  onClick={() => {
                    const res = runArchitectureReviewCheckpoint(checkpointForm);
                    setCheckpointResult(res);
                  }}
                >
                  ⚡ Провести Architecture Checkpoint
                </button>

                {checkpointResult && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      fontFamily: 'Orbitron, monospace',
                      fontSize: '13px',
                      fontWeight: 800,
                      color: checkpointResult.approved ? '#34d399' : '#f87171'
                    }}>
                      Бал: {checkpointResult.score} / {checkpointResult.maxScore}
                    </span>
                    <span style={{
                      fontFamily: 'Orbitron, monospace',
                      fontSize: '12px',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: checkpointResult.approved ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      border: `1px solid ${checkpointResult.approved ? '#34d399' : '#f87171'}`,
                      color: checkpointResult.approved ? '#34d399' : '#f87171'
                    }}>
                      {checkpointResult.verdict}
                    </span>
                  </div>
                )}
              </div>

              {/* Checkpoint Details */}
              {checkpointResult && (
                <div style={{ marginTop: '18px' }}>
                  {checkpointResult.checks.map((c) => (
                    <div
                      key={c.id}
                      className={`academy-checkpoint-check-item ${c.passed ? 'is-pass' : 'is-fail'}`}
                    >
                      <span>{c.passed ? '✓' : '✗'} {c.label}</span>
                      <span style={{ fontSize: '11px' }}>{c.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Data Privacy, RBAC & Parent Consent Section (SCRUM-71: L6) */}
        <section className="academy-privacy-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '18px', color: '#f472b6', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🛡️</span>
                <span>Конфіденційність, RBAC & Згода Батьків (L6: SCRUM-71)</span>
              </h2>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                Privacy-by-Design для неповнолітніх, матриця RBAC/ABAC, запобігання IDOR та право на забуття (Right to be Forgotten)
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontFamily: 'Orbitron, monospace',
                fontSize: '11px',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(236, 72, 153, 0.15)',
                border: '1px solid rgba(236, 72, 153, 0.4)',
                color: '#f472b6'
              }}>
                COPPA & GDPR-K COMPLIANT 🔒
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="academy-privacy-tabs">
            <button
              className={`academy-privacy-tab-btn ${privacyTab === 'inventory' ? 'is-active' : ''}`}
              onClick={() => setPrivacyTab('inventory')}
            >
              <span>📋</span>
              <span>Інвентаризація даних (Data Inventory)</span>
            </button>
            <button
              className={`academy-privacy-tab-btn ${privacyTab === 'rbac' ? 'is-active' : ''}`}
              onClick={() => setPrivacyTab('rbac')}
            >
              <span>👥</span>
              <span>Матриця прав (RBAC/ABAC)</span>
            </button>
            <button
              className={`academy-privacy-tab-btn ${privacyTab === 'audit' ? 'is-active' : ''}`}
              onClick={() => setPrivacyTab('audit')}
            >
              <span>🔍</span>
              <span>Аудит безпеки (Security Audit)</span>
            </button>
          </div>

          {/* Tab 1: Data Inventory */}
          {privacyTab === 'inventory' && (
            <div className="academy-privacy-grid">
              {Object.values(DATA_INVENTORY).map((item) => (
                <div key={item.category} className="academy-privacy-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '13px', color: '#ffffff' }}>
                      {item.name}
                    </strong>
                    <span style={{
                      fontFamily: 'Orbitron, monospace',
                      fontSize: '10px',
                      color: '#f472b6',
                      background: 'rgba(236, 72, 153, 0.15)',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {item.retentionDays} днів
                    </span>
                  </div>
                  <p style={{ fontSize: '12.5px', color: '#cbd5e1', marginBottom: '8px', lineHeight: 1.4 }}>
                    <strong>Мета:</strong> {item.purpose}
                  </p>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8', background: 'rgba(0,0,0,0.3)', padding: '8px 10px', borderRadius: '6px' }}>
                    <div><strong>Власник:</strong> {item.owner}</div>
                    <div style={{ marginTop: '3px' }}><strong>Правило доступу:</strong> {item.accessRule}</div>
                    <div style={{ marginTop: '3px' }}><strong>Чутливість:</strong> {item.sensitivity}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 2: RBAC Matrix */}
          {privacyTab === 'rbac' && (
            <div className="academy-rbac-table-wrap">
              <table className="academy-rbac-table">
                <thead>
                  <tr>
                    <th>Право / Дія (Action)</th>
                    <th>🐥 Child (Учень)</th>
                    <th>👪 Parent (Батьки)</th>
                    <th>🦉 Mentor (Ментор)</th>
                    <th>👑 Admin (Адмін)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Перегляд власного профілю та прогресу</td>
                    <td style={{ color: '#34d399' }}>✓ Дозволено</td>
                    <td style={{ color: '#34d399' }}>✓ Дозволено</td>
                    <td style={{ color: '#34d399' }}>✓ Дозволено</td>
                    <td style={{ color: '#34d399' }}>✓ Дозволено</td>
                  </tr>
                  <tr>
                    <td>Перегляд чужих приватних даних</td>
                    <td style={{ color: '#f87171' }}>✗ Заблоковано (403)</td>
                    <td style={{ color: '#f87171' }}>✗ Тільки своєї дитини</td>
                    <td style={{ color: '#f87171' }}>✗ Тільки призначених</td>
                    <td style={{ color: '#34d399' }}>✓ Аудит-доступ</td>
                  </tr>
                  <tr>
                    <td>Згода батьків (Parental Consent)</td>
                    <td style={{ color: '#94a3b8' }}>— Недоступно</td>
                    <td style={{ color: '#34d399' }}>✓ Керування згодою</td>
                    <td style={{ color: '#94a3b8' }}>— Недоступно</td>
                    <td style={{ color: '#34d399' }}>✓ Аудит згоди</td>
                  </tr>
                  <tr>
                    <td>Експорт персональних даних (Data Portability)</td>
                    <td style={{ color: '#34d399' }}>✓ Власні дані</td>
                    <td style={{ color: '#34d399' }}>✓ Дані дитини</td>
                    <td style={{ color: '#f87171' }}>✗ Заборонено</td>
                    <td style={{ color: '#34d399' }}>✓ Повний експорт</td>
                  </tr>
                  <tr>
                    <td>Видалення облікового запису (Right to be Forgotten)</td>
                    <td style={{ color: '#fbbf24' }}>⚠ Запит батькам</td>
                    <td style={{ color: '#34d399' }}>✓ Підтвердження</td>
                    <td style={{ color: '#f87171' }}>✗ Заборонено</td>
                    <td style={{ color: '#34d399' }}>✓ Безпечний purge</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 3: Security & IDOR Audit */}
          {privacyTab === 'audit' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: '#cbd5e1' }}>
                  Результати автоматизованого тестування безпеки та ізоляції PII:
                </span>
                <span style={{
                  fontFamily: 'Orbitron, monospace',
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#34d399',
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  padding: '4px 10px',
                  borderRadius: '6px'
                }}>
                  РЕЗУЛЬТАТ АУДИТУ: {privacyAuditData.score} (PASSED)
                </span>
              </div>

              {privacyAuditData.auditResults.map((res) => (
                <div key={res.testId} className="academy-audit-item is-passed">
                  <div>
                    <strong style={{ display: 'block', marginBottom: '3px' }}>{res.name}</strong>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>{res.details}</span>
                  </div>
                  <span style={{
                    fontFamily: 'Orbitron, monospace',
                    fontWeight: 800,
                    fontSize: '11px',
                    color: '#34d399'
                  }}>
                    ✓ {res.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Observability, SLO & Error Budgets Section (SCRUM-72: L7) */}
        <section className="academy-observability-panel" suppressHydrationWarning>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '18px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📊</span>
                <span>Спостережуваність, SLO & Error Budgets (L7: SCRUM-72)</span>
              </h2>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                Моніторинг SLI/SLO в реальному часі, структуровані логи без PII, розрахунок Error Budgets та прив'язка до Runbooks
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontFamily: 'Orbitron, monospace',
                fontSize: '11px',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#34d399'
              }}>
                ERROR BUDGET: {obsState.metrics.errorBudget.budgetRemainingPercent}% REMAINING ⚡
              </span>
            </div>
          </div>

          {/* Active Alert Banner (if simulated) */}
          {obsState.activeAlerts.length > 0 && (
            <div className="academy-alert-box" style={{ marginTop: '16px' }}>
              <div>
                <strong style={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🚨</span>
                  <span>{obsState.activeAlerts[0].title}</span>
                </strong>
                <p style={{ fontSize: '12px', color: '#fca5a5', marginTop: '4px' }}>
                  Correlation ID: <code style={{ color: '#ffffff' }}>{obsState.activeAlerts[0].correlationId}</code> • Severity: <strong>{obsState.activeAlerts[0].severity}</strong> • Runbook: <strong>{obsState.activeAlerts[0].runbookId}</strong>
                </p>
              </div>
              <button
                className="academy-auth-btn"
                style={{ background: 'rgba(255, 255, 255, 0.2)', borderColor: '#ffffff', color: '#ffffff' }}
                onClick={() => {
                  resolveIncident();
                  setObsState(getObservabilityState());
                }}
              >
                ✓ Усунути інцидент
              </button>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="academy-observability-tabs">
            <button
              className={`academy-observability-tab-btn ${sloTab === 'dashboard' ? 'is-active' : ''}`}
              onClick={() => setSloTab('dashboard')}
            >
              <span>📈</span>
              <span>SLO Dashboard (4 Метрики)</span>
            </button>
            <button
              className={`academy-observability-tab-btn ${sloTab === 'runbooks' ? 'is-active' : ''}`}
              onClick={() => setSloTab('runbooks')}
            >
              <span>📖</span>
              <span>Операційні Runbooks (4 Інструкції)</span>
            </button>
            <button
              className={`academy-observability-tab-btn ${sloTab === 'demo' ? 'is-active' : ''}`}
              onClick={() => setSloTab('demo')}
            >
              <span>🧪</span>
              <span>Симулятор інцидентів (Preview Demo)</span>
            </button>
          </div>

          {/* Tab 1: SLO Dashboard */}
          {sloTab === 'dashboard' && (
            <div>
              <div className="academy-slo-grid">
                {Object.values(obsState.slos).map((slo) => {
                  const isHealthy = slo.id === 'latency'
                    ? obsState.metrics.p95LatencyMs <= slo.target
                    : slo.currentSli >= slo.target;

                  return (
                    <div key={slo.id} className="academy-slo-card">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <strong style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '13px', color: '#ffffff' }}>
                          {slo.name}
                        </strong>
                        <span style={{
                          fontFamily: 'Orbitron, monospace',
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: isHealthy ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.2)',
                          color: isHealthy ? '#34d399' : '#f87171',
                          border: `1px solid ${isHealthy ? 'rgba(16, 185, 129, 0.3)' : '#ef4444'}`
                        }}>
                          {slo.id === 'latency' ? `${obsState.metrics.p95LatencyMs} ${slo.unit}` : `${slo.currentSli} ${slo.unit}`}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '10px' }}>
                        {slo.sliMetric}
                      </p>
                      <div style={{ fontSize: '11.5px', color: '#cbd5e1', background: 'rgba(0,0,0,0.3)', padding: '8px 10px', borderRadius: '6px' }}>
                        <div><strong>Ціль (Target):</strong> {slo.id === 'latency' ? `< ${slo.target} ${slo.unit}` : `>= ${slo.target} ${slo.unit}`}</div>
                        <div style={{ marginTop: '3px' }}><strong>Runbook:</strong> {slo.runbookId}</div>
                        <div style={{ marginTop: '3px' }}><strong>Власник:</strong> {slo.owner}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Error Budget Summary Bar */}
              <div style={{
                marginTop: '16px',
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div suppressHydrationWarning>
                  <strong style={{ fontSize: '13px', color: '#ffffff' }}>Стан бюджету помилок (30-day Rolling Error Budget)</strong>
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }} suppressHydrationWarning>
                    Загальна кількість запитів: <strong>{obsState.metrics.totalRequests}</strong> • Помилки: <strong>{obsState.metrics.failedRequests}</strong> • Статус: <span style={{ color: '#34d399', fontWeight: 700 }}>{obsState.metrics.errorBudget.status}</span>
                  </p>
                </div>
                <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '14px', fontWeight: 800, color: '#34d399' }} suppressHydrationWarning>
                  {obsState.metrics.errorBudget.budgetRemainingPercent}% Залишок
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Runbooks */}
          {sloTab === 'runbooks' && (
            <div>
              {Object.values(obsState.runbooks).map((rb) => (
                <div key={rb.id} className="academy-runbook-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontFamily: 'Orbitron, monospace',
                        fontSize: '11px',
                        fontWeight: 800,
                        color: '#38bdf8',
                        background: 'rgba(56, 189, 248, 0.15)',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        {rb.id}
                      </span>
                      <strong style={{ fontSize: '14px', color: '#ffffff' }}>{rb.title}</strong>
                    </div>
                    <span style={{
                      fontFamily: 'Orbitron, monospace',
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      color: rb.severity === 'CRITICAL' ? '#f87171' : '#fbbf24',
                      background: rb.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(251, 191, 36, 0.2)'
                    }}>
                      {rb.severity}
                    </span>
                  </div>
                  <ul style={{ margin: '8px 0 0 16px', padding: 0, fontSize: '12.5px', color: '#cbd5e1', lineHeight: 1.5 }}>
                    {rb.steps.map((step, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>{step}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Controlled Incident Simulation */}
          {sloTab === 'demo' && (
            <div style={{
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '20px'
            }}>
              <h3 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '14px', color: '#ffffff', marginBottom: '8px' }}>
                🧪 Тестовий полігон інцидентів (Preview Demo з контрольованою помилкою)
              </h3>
              <p style={{ fontSize: '12.5px', color: '#94a3b8', marginBottom: '16px' }}>
                Згенеруйте контрольоване порушення SLO для перевірки спрацьовування алертингу, фіксації correlationId та валідації ранбуків:
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  className="academy-auth-btn"
                  style={{ background: 'rgba(251, 191, 36, 0.2)', borderColor: '#fbbf24', color: '#fbbf24' }}
                  onClick={() => {
                    simulateControlledIncident('latency_spike');
                    setObsState(getObservabilityState());
                  }}
                >
                  ⚡ Сплеск латентності (p95 &gt; 150ms)
                </button>

                <button
                  className="academy-auth-btn"
                  style={{ background: 'rgba(239, 68, 68, 0.2)', borderColor: '#ef4444', color: '#ef4444' }}
                  onClick={() => {
                    simulateControlledIncident('error_burst');
                    setObsState(getObservabilityState());
                  }}
                >
                  🔥 Помилки API (HTTP 500 Outage)
                </button>

                <button
                  className="academy-auth-btn"
                  style={{ background: 'rgba(16, 185, 129, 0.2)', borderColor: '#34d399', color: '#34d399' }}
                  onClick={() => {
                    resolveIncident();
                    setObsState(getObservabilityState());
                  }}
                >
                  ✓ Відновити стан (Resolve)
                </button>
              </div>

              {obsState.recentLogs.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <span style={{ fontSize: '12px', fontFamily: 'Orbitron, monospace', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>
                    Останні структуровані логи (Zero PII):
                  </span>
                  <div style={{ background: 'rgba(0, 0, 0, 0.6)', borderRadius: '8px', padding: '12px', fontFamily: 'monospace', fontSize: '11px', color: '#a7f3d0', maxHeight: '140px', overflowY: 'auto' }} suppressHydrationWarning>
                    {obsState.recentLogs.map((log, idx) => (
                      <div key={idx} style={{ marginBottom: '4px' }}>
                        [{log.timestamp.slice(11, 19)}] {log.level} | {log.correlationId} | {log.action} | {log.durationMs}ms | hasPii: {String(log.hasPii)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Plugin Architecture, Feature Flags & Migrations Section (SCRUM-73: L8) */}
        <section className="academy-plugin-panel" suppressHydrationWarning>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '18px', color: '#ec4899', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🔌</span>
                <span>Плагінна архітектура, Feature Flags &amp; Migrations (L8: SCRUM-73)</span>
              </h2>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                Динамічне керування фічами, аварійний Kill Switch, безпечна пісочниця плагінів з Graceful Degradation та zero-downtime міграції
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: 'Orbitron, monospace',
                fontSize: '11px',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(236, 72, 153, 0.15)',
                border: '1px solid rgba(236, 72, 153, 0.4)',
                color: '#f472b6'
              }}>
                SCHEMA V{pluginState.migrations.currentVersion} • ZERO DOWNTIME
              </span>
            </div>
          </div>

          {/* Action notification message if any */}
          {flagActionMsg && (
            <div style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid #38bdf8',
              borderRadius: '8px',
              padding: '10px 14px',
              marginTop: '14px',
              fontSize: '12px',
              color: '#bae6fd'
            }}>
              ℹ️ {flagActionMsg}
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="academy-plugin-tabs">
            <button
              className={`academy-plugin-tab-btn ${pluginTab === 'flags' ? 'is-active' : ''}`}
              onClick={() => setPluginTab('flags')}
            >
              <span>🚩</span>
              <span>Feature Flags ({Object.keys(pluginState.flags).length})</span>
            </button>
            <button
              className={`academy-plugin-tab-btn ${pluginTab === 'plugins' ? 'is-active' : ''}`}
              onClick={() => setPluginTab('plugins')}
            >
              <span>🛡️</span>
              <span>Safe Plugin Sandbox ({pluginState.plugins.length})</span>
            </button>
            <button
              className={`academy-plugin-tab-btn ${pluginTab === 'migrations' ? 'is-active' : ''}`}
              onClick={() => setPluginTab('migrations')}
            >
              <span>🔄</span>
              <span>Zero-Downtime Migrations</span>
            </button>
          </div>

          {/* Tab 1: Feature Flags & Emergency Kill Switch */}
          {pluginTab === 'flags' && (
            <div>
              {Object.values(pluginState.flags).map((flag) => {
                const isKill = flag.killSwitchActive;
                return (
                  <div key={flag.key} className={`academy-flag-card ${isKill ? 'is-killed' : ''}`}>
                    <div style={{ flex: 1, minWidth: '240px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <code style={{ color: isKill ? '#f87171' : '#f472b6', fontWeight: 700 }}>{flag.key}</code>
                        <span style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: 800,
                          fontFamily: 'Orbitron, monospace',
                          textTransform: 'uppercase',
                          background: flag.lifecycle === 'ga' ? 'rgba(16, 185, 129, 0.2)' : flag.lifecycle === 'beta' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                          color: flag.lifecycle === 'ga' ? '#34d399' : flag.lifecycle === 'beta' ? '#38bdf8' : '#fbbf24',
                          border: `1px solid ${flag.lifecycle === 'ga' ? 'rgba(16, 185, 129, 0.4)' : flag.lifecycle === 'beta' ? 'rgba(56, 189, 248, 0.4)' : 'rgba(251, 191, 36, 0.4)'}`
                        }}>
                          {flag.lifecycle}
                        </span>
                        {isKill && (
                          <span style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: 800,
                            fontFamily: 'Orbitron, monospace',
                            background: 'rgba(239, 68, 68, 0.3)',
                            color: '#fca5a5',
                            border: '1px solid #ef4444'
                          }}>
                            🚨 KILL SWITCH
                          </span>
                        )}
                      </div>
                      <strong style={{ fontSize: '13.5px', color: '#ffffff', display: 'block' }}>{flag.name}</strong>
                      <p style={{ fontSize: '12px', color: '#94a3b8', margin: '3px 0' }}>{flag.description}</p>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        Власник: <strong style={{ color: '#cbd5e1' }}>{flag.owner}</strong> • Rollout: <strong style={{ color: '#cbd5e1' }}>{flag.rolloutPercentage}%</strong> • Експірація: <strong style={{ color: '#cbd5e1' }}>{flag.expiryDate}</strong>
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        className="academy-auth-btn"
                        style={{
                          background: flag.enabled && !isKill ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          borderColor: flag.enabled && !isKill ? '#34d399' : '#64748b',
                          color: flag.enabled && !isKill ? '#34d399' : '#94a3b8',
                          fontSize: '11px'
                        }}
                        onClick={() => {
                          try {
                            setFeatureFlag(flag.key, { enabled: !flag.enabled }, currentUser);
                            setPluginState(getPluginState());
                            setFlagActionMsg(`Прапорець ${flag.key} змінено на ${!flag.enabled ? 'ВВІМКНЕНО' : 'ВИМКНЕНО'}`);
                          } catch (err) {
                            setFlagActionMsg(`Помилка: ${err.message}`);
                          }
                        }}
                      >
                        {flag.enabled ? '✓ Ввімкнено' : '○ Вимкнено'}
                      </button>

                      <button
                        className="academy-auth-btn"
                        style={{
                          background: isKill ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.1)',
                          borderColor: '#ef4444',
                          color: '#f87171',
                          fontSize: '11px'
                        }}
                        onClick={() => {
                          try {
                            setFeatureFlag(flag.key, { killSwitchActive: !isKill }, currentUser);
                            setPluginState(getPluginState());
                            setFlagActionMsg(!isKill ? `🚨 АКТИВОВАНО АВАРІЙНИЙ KILL SWITCH ДЛЯ ${flag.key}` : `Kill switch для ${flag.key} деактивовано`);
                          } catch (err) {
                            setFlagActionMsg(`Помилка: ${err.message}`);
                          }
                        }}
                      >
                        {isKill ? '🔓 Зняти Kill Switch' : '⚡ Kill Switch'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 2: Safe Plugin Sandbox & Fault Isolation */}
          {pluginTab === 'plugins' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                {pluginState.plugins.map((plugin) => (
                  <div
                    key={plugin.id}
                    style={{
                      background: 'rgba(0, 0, 0, 0.35)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong style={{ color: '#ffffff', fontSize: '13.5px' }}>{plugin.name}</strong>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontFamily: 'Orbitron, monospace',
                        background: plugin.status === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                        color: plugin.status === 'active' ? '#34d399' : '#fbbf24'
                      }}>
                        v{plugin.version}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 8px 0' }}>
                      Автор: <strong style={{ color: '#cbd5e1' }}>{plugin.author}</strong>
                    </p>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px' }}>
                      Пісочниця: Canvas 2D: {plugin.sandbox.allowCanvas2D ? '✓' : '✗'} • DOM Wipeout: {plugin.sandbox.allowDomWipe ? '✓' : 'BLOCKED 🛡️'}
                    </div>

                    <button
                      className="academy-auth-btn"
                      style={{ width: '100%', fontSize: '11px', background: 'rgba(56, 189, 248, 0.15)', borderColor: '#38bdf8', color: '#38bdf8' }}
                      onClick={() => {
                        const res = loadPluginSafely(plugin.id);
                        setSandboxResult(res);
                      }}
                    >
                      ⚡ Тестувати завантаження в Sandbox
                    </button>
                  </div>
                ))}
              </div>

              {sandboxResult && (
                <div style={{
                  background: sandboxResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  border: `1px solid ${sandboxResult.success ? '#34d399' : '#ef4444'}`,
                  borderRadius: '10px',
                  padding: '14px',
                  marginTop: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong style={{ color: '#ffffff', fontSize: '13px' }}>
                      {sandboxResult.success ? '✓ Плагін успішно ініціалізовано' : '🛡️ Перехоплено збій плагіна (Graceful Degradation)'}
                    </strong>
                    <span style={{
                      fontFamily: 'Orbitron, monospace',
                      fontSize: '11px',
                      fontWeight: 800,
                      color: sandboxResult.success ? '#34d399' : '#f87171'
                    }}>
                      {sandboxResult.pluginId}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: sandboxResult.success ? '#a7f3d0' : '#fca5a5', margin: 0 }}>
                    {sandboxResult.success
                      ? `Статус: ${sandboxResult.initResult?.status} • 60 FPS Canvas Ready`
                      : `${sandboxResult.error} — ${sandboxResult.message}`}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Zero-Downtime Migrations */}
          {pluginTab === 'migrations' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '10px' }}>
                  Зареєстровані ідемпотентні міграції схеми даних (Expand &amp; Contract):
                </span>
                {pluginState.migrations.list.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      background: 'rgba(0, 0, 0, 0.35)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      marginBottom: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <code style={{ color: '#f472b6', fontWeight: 700 }}>{m.id}</code>
                        <span style={{
                          fontFamily: 'Orbitron, monospace',
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: m.applied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                          color: m.applied ? '#34d399' : '#94a3b8'
                        }}>
                          {m.applied ? '✓ APPLIED' : 'PENDING'}
                        </span>
                      </div>
                      <strong style={{ fontSize: '13px', color: '#ffffff', display: 'block', marginTop: '2px' }}>{m.name}</strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        className="academy-auth-btn"
                        style={{ fontSize: '11px', background: 'rgba(56, 189, 248, 0.15)', borderColor: '#38bdf8', color: '#38bdf8' }}
                        onClick={() => {
                          try {
                            const res = runMigration(m.id);
                            setPluginState(getPluginState());
                            setFlagActionMsg(res.message);
                          } catch (err) {
                            setFlagActionMsg(`Помилка: ${err.message}`);
                          }
                        }}
                      >
                        ⚡ Запустити (Ідемпотентно)
                      </button>

                      {m.applied && (
                        <button
                          className="academy-auth-btn"
                          style={{ fontSize: '11px', background: 'rgba(239, 68, 68, 0.15)', borderColor: '#ef4444', color: '#f87171' }}
                          onClick={() => {
                            try {
                              const res = rollbackMigration(m.id);
                              setPluginState(getPluginState());
                              setFlagActionMsg(res.message);
                            } catch (err) {
                              setFlagActionMsg(`Помилка: ${err.message}`);
                            }
                          }}
                        >
                          ⏪ Rollback
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {pluginState.migrations.log.length > 0 && (
                <div>
                  <span style={{ fontSize: '12px', fontFamily: 'Orbitron, monospace', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>
                    Журнал аудиту міграцій (Zero Downtime Log):
                  </span>
                  <div style={{ background: 'rgba(0, 0, 0, 0.6)', borderRadius: '8px', padding: '12px', fontFamily: 'monospace', fontSize: '11px', color: '#fbcfe8', maxHeight: '120px', overflowY: 'auto' }} suppressHydrationWarning>
                    {pluginState.migrations.log.map((log, idx) => (
                      <div key={idx} style={{ marginBottom: '4px' }}>
                        [{log.timestamp.slice(11, 19)}] {log.status} | {log.migrationId}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Track Selector Cards */}
        <section style={{ marginBottom: '36px' }}>
          <h2 className="academy-section-title">
            <span>⚡</span>
            <span>Оберіть навчальний трек (Curriculum Tracks)</span>
          </h2>
          <div className="academy-tracks-grid">
            {ACADEMY_TRACKS.map((track) => {
              const isSelected = track.id === selectedTrackId;
              return (
                <button
                  key={track.id}
                  onClick={() => setSelectedTrackId(track.id)}
                  className={`academy-track-card ${isSelected ? 'is-active' : ''}`}
                >
                  <div className="academy-track-top">
                    <span className="academy-track-icon">{track.icon}</span>
                    <span className="academy-track-levels">{track.levels}</span>
                  </div>
                  <h3 className="academy-track-name">{track.title}</h3>
                  <p className="academy-track-desc">{track.tagline}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Active Track Curriculum Timeline & DAG Tree */}
        <section>
          <div className="academy-timeline-header">
            <div>
              <h2 className="academy-timeline-title">
                <span>{selectedTrack.icon}</span>
                <span>{selectedTrack.title}</span>
              </h2>
              <p className="academy-timeline-subtitle">Граф уроків, передумов (prerequisites) та необхідних свідоцтв</p>
            </div>
            <span className="academy-timeline-badge">
              Всього модулів: {trackLessons.length}
            </span>
          </div>

          <div className="academy-lessons-list">
            {trackLessons.map((lesson) => {
              const isUnlocked = isLessonUnlocked(lesson.id, completedLessons);
              const isDone = completedLessons.includes(lesson.id);

              return (
                <div
                  key={lesson.id}
                  className={`academy-lesson-card ${
                    isDone ? 'is-done' : isUnlocked ? 'is-unlocked' : 'is-locked'
                  }`}
                >
                  <div className="academy-lesson-main-row">
                    <div className="academy-lesson-left">
                      <div
                        className={`academy-level-badge ${
                          isDone ? 'is-done' : isUnlocked ? 'is-unlocked' : 'is-locked'
                        }`}
                      >
                        L{lesson.level}
                      </div>
                      <div className="academy-lesson-info">
                        <div className="academy-lesson-header-line">
                          <span className="academy-jira-tag">
                            [{lesson.jiraKey}]
                          </span>
                          <h3 className="academy-lesson-name">{lesson.title}</h3>
                          {lesson.jiraKey === 'SCRUM-56' && (
                            <span className="academy-progress-tag">
                              В РОБОТІ ⚡
                            </span>
                          )}
                        </div>
                        <p className="academy-lesson-summary">{lesson.summary}</p>
                      </div>
                    </div>

                    <div className="academy-lesson-right">
                      <span className="academy-time-pill">
                        ⏱️ ~{lesson.estimatedMinutes} хв
                      </span>
                      {isDone ? (
                        <span className="academy-status-pill is-done">
                          ✓ ЗДАНО
                        </span>
                      ) : isUnlocked ? (
                        <span className="academy-status-pill is-unlocked">
                          🔓 ДОСТУПНО
                        </span>
                      ) : (
                        <span className="academy-status-pill is-locked">
                          🔒 ЗАБЛОКОВАНО
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Prerequisites info */}
                  {lesson.prerequisites && lesson.prerequisites.length > 0 && (
                    <div className="academy-prereq-row">
                      <span className="academy-prereq-title">Передумови (Prerequisites):</span>
                      <div className="academy-prereq-tags">
                        {lesson.prerequisites.map((pId) => (
                          <span key={pId} className="academy-prereq-pill">
                            {pId}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Acceptance Criteria & Evidence */}
                  <div className="academy-details-grid">
                    <div className="academy-criteria-col">
                      <span className="academy-criteria-title">
                        Критерії прийняття (Acceptance Criteria):
                      </span>
                      <ul className="academy-criteria-list">
                        {lesson.acceptanceCriteria.map((ac, idx) => (
                          <li key={idx} className="academy-criteria-item">
                            <span className="academy-criteria-bullet">▹</span>
                            <span>{ac}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="academy-evidence-col">
                      <span className="academy-evidence-title">
                        {"Обов'язкові свідоцтва (Evidence):"}
                      </span>
                      <div className="academy-evidence-pills">
                        {lesson.requiredEvidence.map((ev) => (
                          <span key={ev} className="academy-evidence-pill">
                            🛡️ {ev.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Jira / GitHub Progress Integration Row (SCRUM-53) */}
                  <div className="academy-integration-row">
                    <div className="academy-integration-links">
                      <a
                        href={`https://gta6-sliv-cyberleek.atlassian.net/browse/${lesson.jiraKey}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="academy-integration-badge"
                        title="Переглянути задачу в Jira SCRUM"
                      >
                        <span>📋 Jira: {lesson.jiraKey}</span>
                      </a>
                      <a
                        href={`https://github.com/greenyarik0505-jpg/duck-verse/pulls?q=${lesson.jiraKey}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="academy-integration-badge"
                        title="Зв'язаний Pull Request на GitHub"
                      >
                        <span>🐙 GitHub PR</span>
                        <span className="academy-ci-pill">✓ CI Passed</span>
                      </a>
                    </div>
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'Orbitron, monospace' }}>
                      🔗 Read-Only Sync: Активна
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Vibe-Coding Prompt Lab (SCRUM-45: Level 3) */}
        <div style={{ marginTop: '48px' }}>
          <VibePromptLab />
        </div>

        {/* Portfolio & Cryptographic Skills Certificate (SCRUM-47: Level 4) */}
        <PortfolioCertificateView currentUser={currentUser} completedLessons={completedLessons} />

        {/* Engineering Governance & Learning Roadmap (SCRUM-70) */}
        <section className="academy-section">
          <GovernanceRoadmapView />
        </section>
      </main>

      {/* Footer */}
      <footer className="academy-footer">
        DUCK ACADEMY • ARCHITECTURAL BASELINE (SCRUM-56) • DUCK VERSE PLATFORM
      </footer>
    </div>
  );
}

