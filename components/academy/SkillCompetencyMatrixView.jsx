'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { COMPETENCY_AREAS } from '../../lib/academy/skills/matrix';

export default function SkillCompetencyMatrixView({ currentUser, completedLessons = [], onSelectLesson }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedComp, setSelectedComp] = useState(null);
  const [error, setError] = useState('');

  const fetchSkills = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const studentId = currentUser?.id || 'user_student_duck';
      const res = await fetch(`/api/academy/skills?studentId=${studentId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setProfile(json.data);
      } else {
        setError(json.error || 'Не вдалося завантажити матрицю компетенцій.');
      }
    } catch (err) {
      setError('Помилка підключення до сервера аналітики.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills, completedLessons]);

  if (loading) {
    return (
      <section className="academy-skills-section">
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          <div className="game-spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ fontFamily: 'Orbitron, monospace', fontSize: '13px' }}>Завантаження матриці інженерних компетенцій...</p>
        </div>
      </section>
    );
  }

  const matrix = profile?.matrix || {};
  const gap = profile?.gapAnalysis || {};
  const competencies = Object.values(matrix);

  return (
    <section className="academy-skills-section" style={{
      background: 'rgba(15, 23, 42, 0.75)',
      border: '1px solid rgba(56, 189, 248, 0.25)',
      borderRadius: '16px',
      padding: '24px',
      margin: '28px 0',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(10px)'
    }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', pb: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>📊</span>
            <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '20px', color: '#38bdf8', letterSpacing: '1px', margin: 0 }}>
              Competency Matrix & Skill Analytics (SCRUM-82)
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
            Об’єктивна матриця 7 інженерних навичок. Бали нараховуються лише за реальні свідчення: уроки, PR та рев'ю ментора.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '8px',
            padding: '6px 14px',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontFamily: 'Orbitron, monospace' }}>Середній бал</span>
            <strong style={{ fontSize: '18px', color: '#38bdf8', fontFamily: 'Orbitron, monospace' }}>{gap.overallAverageScore || 0}%</strong>
          </div>

          <button
            type="button"
            onClick={fetchSkills}
            className="academy-auth-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Оновити аналітику"
          >
            <span>🔄</span> Оновити
          </button>
        </div>
      </header>

      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px', color: '#fca5a5', marginBottom: '20px', fontSize: '13px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Gap Analysis Recommendation Banner */}
      {gap.recommendedLesson && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(180, 83, 9, 0.25))',
          border: '1px solid rgba(245, 158, 11, 0.5)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          boxShadow: '0 4px 20px rgba(245, 158, 11, 0.15)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '18px' }}>🎯</span>
              <strong style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '14px', color: '#fbbf24', textTransform: 'uppercase' }}>
                Gap Analysis: Зона найвищого пріоритету росту
              </strong>
            </div>
            <p style={{ fontSize: '13px', color: '#fef3c7', margin: 0 }}>
              {gap.recommendedLesson.reason}
            </p>
            <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '6px' }}>
              Рекомендований курс: <strong>{gap.recommendedLesson.title}</strong> ({gap.recommendedLesson.jiraKey}) • Рівень: {gap.recommendedLesson.level}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectLesson && onSelectLesson(gap.recommendedLesson.id)}
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#1c1917',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 18px',
              fontFamily: 'Orbitron, monospace',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(245, 158, 11, 0.4)',
              transition: 'transform 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            ⚡ Прокачати навичку
          </button>
        </div>
      )}

      {/* Competencies Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {competencies.map((comp) => {
          const isSelected = selectedComp?.id === comp.id;
          return (
            <div
              key={comp.id}
              onClick={() => setSelectedComp(isSelected ? null : comp)}
              style={{
                background: isSelected ? 'rgba(30, 41, 59, 0.9)' : 'rgba(15, 23, 42, 0.6)',
                border: `1px solid ${isSelected ? comp.levelColor : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: '12px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? `0 0 16px ${comp.levelColor}40` : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>{comp.icon}</span>
                  <strong style={{ color: '#f1f5f9', fontSize: '14px', fontFamily: 'Orbitron, sans-serif' }}>
                    {comp.name}
                  </strong>
                </div>
                <span style={{
                  background: `${comp.levelColor}20`,
                  border: `1px solid ${comp.levelColor}60`,
                  color: comp.levelColor,
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontFamily: 'Orbitron, monospace',
                  fontWeight: 800
                }}>
                  {comp.level}
                </span>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', background: 'rgba(0, 0, 0, 0.4)', borderRadius: '999px', height: '8px', overflow: 'hidden', margin: '10px 0', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{
                  width: `${comp.score}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${comp.levelColor}80, ${comp.levelColor})`,
                  borderRadius: '999px',
                  transition: 'width 0.6s ease'
                }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#94a3b8' }}>
                <span>Оцінка: <strong style={{ color: '#f1f5f9' }}>{comp.score}%</strong></span>
                <span>Підтверджень: <strong style={{ color: '#f1f5f9' }}>{comp.evidencesCount}</strong></span>
                <span style={{
                  color: comp.confidence === 'high' ? '#34d399' : comp.confidence === 'medium' ? '#fbbf24' : '#94a3b8'
                }}>
                  {comp.confidence === 'high' ? '●●● High' : comp.confidence === 'medium' ? '●●○ Med' : '●○○ Low'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Evidence Drawer for Selected Competency */}
      {selectedComp && (
        <div style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: `1px solid ${selectedComp.levelColor}60`,
          borderRadius: '12px',
          padding: '20px',
          marginTop: '16px',
          boxShadow: `0 8px 30px ${selectedComp.levelColor}20`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', pb: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>{selectedComp.icon}</span>
              <h3 style={{ margin: 0, fontFamily: 'Orbitron, sans-serif', fontSize: '16px', color: '#f1f5f9' }}>
                Детальні свідчення: {selectedComp.name} ({selectedComp.score}%)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedComp(null)}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>

          <p style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '16px' }}>{selectedComp.desc}</p>

          {selectedComp.evidences.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>
              Ще немає верифікованих свідчень для цієї компетенції. Завершуйте уроки та відправляйте Pull Requests!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedComp.evidences.map((ev, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '13px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px' }}>
                        {ev.type === 'lesson' ? '📘' : ev.type === 'pull_request' ? '🔀' : '🦉'}
                      </span>
                      <strong style={{ color: '#f1f5f9' }}>{ev.title}</strong>
                      {ev.jiraKey && (
                        <span style={{ fontSize: '10px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '1px 6px', borderRadius: '4px', fontFamily: 'Orbitron, monospace' }}>
                          {ev.jiraKey}
                        </span>
                      )}
                    </div>
                    {ev.feedback && (
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', fontStyle: 'italic' }}>
                        «{ev.feedback}»
                      </div>
                    )}
                  </div>
                  <span style={{ color: '#34d399', fontFamily: 'Orbitron, monospace', fontWeight: 700, fontSize: '12px' }}>
                    +{ev.weight}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
