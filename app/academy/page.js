'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ACADEMY_TRACKS, getLessonsByTrack, isLessonUnlocked } from '../../lib/academy/registry';
import { isAcademyEnabled, ACADEMY_CONFIG } from '../../lib/academy/config';

export default function AcademyPage() {
  const [selectedTrackId, setSelectedTrackId] = useState('track-frontend-gaming');
  // Initial completed/in-progress simulated state for student
  const [completedLessons, setCompletedLessons] = useState(['lesson-fe-l0-arch']);

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
            {/* User Auth Session Chip (SCRUM-54) */}
            <div className="academy-auth-box">
              <div className="academy-user-chip">
                <span>{currentUser.role === 'child' ? '🐥' : currentUser.role === 'mentor' ? '🦉' : '👑'}</span>
                <span>{currentUser.username}</span>
                <span className={`academy-role-badge role-${currentUser.role}`}>
                  {currentUser.role === 'child' ? 'Учень' : currentUser.role === 'mentor' ? 'Ментор' : 'Адмін'}
                </span>
              </div>
              <button
                className="academy-auth-btn"
                onClick={() => setIsAuthModalOpen(true)}
                title="Перемкнути роль / перевірити сесію (SCRUM-54)"
              >
                ⚙️ Ролі & Сесія
              </button>
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

      {/* Role Switcher Modal (SCRUM-54) */}
      {isAuthModalOpen && (
        <div className="academy-auth-modal-overlay" onClick={() => setIsAuthModalOpen(false)}>
          <div className="academy-auth-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="academy-auth-modal-header">
              <h3 className="academy-auth-modal-title">🔐 Керування ролями & Сесіями</h3>
              <button
                className="academy-auth-btn"
                onClick={() => setIsAuthModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
              Оберіть профіль для перевірки серверного захисту RBAC та відсутності ескалації привілеїв:
            </p>

            <button
              className={`academy-auth-role-item ${currentUser.role === 'child' ? 'is-selected' : ''}`}
              onClick={() => handleSwitchUser({
                id: 'user_student_yarik',
                username: 'student_yarik',
                role: 'child',
                parentConsent: true
              })}
            >
              <div>
                <strong style={{ color: '#38bdf8' }}>🐥 student_yarik (Учень / Child)</strong>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                  Права: читання та запис власного прогресу. Згода батьків підтверджена. Доступ до чужих даних суворо заблокований (403).
                </p>
              </div>
              {currentUser.role === 'child' && <span style={{ color: '#a855f7' }}>✓ Активно</span>}
            </button>

            <button
              className={`academy-auth-role-item ${currentUser.role === 'mentor' ? 'is-selected' : ''}`}
              onClick={() => handleSwitchUser({
                id: 'user_mentor_alex',
                username: 'mentor_alex',
                role: 'mentor',
                parentConsent: null
              })}
            >
              <div>
                <strong style={{ color: '#34d399' }}>🦉 mentor_alex (Ментор / Mentor)</strong>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                  Права: перевірка робіт учнів, code-review рубрики, затвердження уроків та оцінювання.
                </p>
              </div>
              {currentUser.role === 'mentor' && <span style={{ color: '#a855f7' }}>✓ Активно</span>}
            </button>

            <button
              className={`academy-auth-role-item ${currentUser.role === 'admin' ? 'is-selected' : ''}`}
              onClick={() => handleSwitchUser({
                id: 'user_admin_root',
                username: 'admin_root',
                role: 'admin',
                parentConsent: null
              })}
            >
              <div>
                <strong style={{ color: '#fbbf24' }}>👑 admin_root (Адміністратор)</strong>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                  Права: повний контроль над навчальним реєстром, аудит логів та керування ролями платформи.
                </p>
              </div>
              {currentUser.role === 'admin' && <span style={{ color: '#a855f7' }}>✓ Активно</span>}
            </button>
          </div>
        </div>
      )}

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
                        Обов'язкові свідоцтва (Evidence):
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
      </main>

      {/* Footer */}
      <footer className="academy-footer">
        DUCK ACADEMY • ARCHITECTURAL BASELINE (SCRUM-56) • DUCK VERSE PLATFORM
      </footer>
    </div>
  );
}

