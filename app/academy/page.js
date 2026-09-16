'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ACADEMY_TRACKS, getLessonsByTrack, isLessonUnlocked } from '../../lib/academy/registry';
import { isAcademyEnabled, ACADEMY_CONFIG } from '../../lib/academy/config';

export default function AcademyPage() {
  const [selectedTrackId, setSelectedTrackId] = useState('track-frontend-gaming');
  // Initial completed/in-progress simulated state for student
  const [completedLessons, setCompletedLessons] = useState(['lesson-fe-l0-arch']);

  const enabled = isAcademyEnabled();
  const selectedTrack = ACADEMY_TRACKS.find((t) => t.id === selectedTrackId) || ACADEMY_TRACKS[0];
  const trackLessons = getLessonsByTrack(selectedTrackId);

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

      {/* Main Content */}
      <main className="academy-main">
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

