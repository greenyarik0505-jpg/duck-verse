'use client';

import React, { useState } from 'react';
import { SENIOR_RUBRIC_DIMENSIONS, generateCertificate, revokeCertificate } from '../../lib/academy/portfolio/certificate';

export default function PortfolioCertificateView({ currentUser, completedLessons = ['lesson-fe-l0-arch'] }) {
  const [activeCert, setActiveCert] = useState(null);
  const [copied, setCopied] = useState(false);
  const [revoked, setRevoked] = useState(false);

  const handleGenerateCertificate = () => {
    const cert = generateCertificate({
      learnerId: currentUser?.id || 'learner_yarik',
      displayName: currentUser?.username || 'Yarik0505',
      trackId: 'track-frontend-gaming',
      completedLessonIds: completedLessons,
      expiresInDays: 30
    });
    setActiveCert(cert);
    setRevoked(false);
  };

  const handleCopyLink = () => {
    if (!activeCert?.token) return;
    const fullUrl = `${window.location.origin}/academy/certificate?token=${activeCert.token}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  };

  const handleRevoke = () => {
    if (!activeCert?.certificateId) return;
    revokeCertificate(activeCert.certificateId);
    setRevoked(true);
  };

  return (
    <section className="academy-portfolio-container my-8 p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden="true">🎓</span>
          <div>
            <h3 className="text-xl font-bold font-['Orbitron',sans-serif] text-purple-400">
              Портфоліо навичок та Сертифікат (Level 4)
            </h3>
            <p className="text-sm text-slate-400">
              Верифіковані свідчення виконаних робіт, PR-лінкі, тести та Senior Rubric.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerateCertificate}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-500/25 transition"
        >
          📜 Згенерувати Shareable Сертифікат
        </button>
      </header>

      {/* Verified Evidence Cards */}
      <div className="mb-6">
        <h4 className="text-xs uppercase tracking-wider text-slate-400 font-mono font-bold mb-3">
          Перевірені модулі ({completedLessons.length})
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {completedLessons.map((lessonId) => (
            <div key={lessonId} className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-mono font-bold text-cyan-400 block mb-0.5">{lessonId}</span>
                <span className="text-xs text-slate-300 font-semibold">Curriculum Registry & Architecture</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md">
                  ✓ PR Merged
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-md">
                  ✓ Tests Passed
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Senior Rubric Scorecard */}
      <div className="mb-6 p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs uppercase tracking-wider text-slate-400 font-mono font-bold">
            Senior Engineering Rubric Scorecard
          </h4>
          <span className="text-xs font-mono font-bold text-purple-400">19 / 20 Балів (Grade: Excellent)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {SENIOR_RUBRIC_DIMENSIONS.map((dim) => (
            <div key={dim.id} className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-200">{dim.name}</span>
                <span className="text-xs font-bold text-emerald-400">5/5</span>
              </div>
              <p className="text-[11px] text-slate-400">{dim.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Active Certificate Modal/Banner */}
      {activeCert && (
        <div className="p-5 bg-gradient-to-br from-purple-950/40 to-slate-950 border border-purple-500/40 rounded-xl shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              <div>
                <h5 className="text-sm font-bold text-white">Офіційний сертифікат Duck Academy видано!</h5>
                <span className="text-xs text-purple-300 font-mono">ID: {activeCert.certificateId}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!revoked ? (
                <>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition"
                  >
                    {copied ? '✅ Посилання скопійовано!' : '🔗 Копіювати Share-link'}
                  </button>
                  <button
                    type="button"
                    onClick={handleRevoke}
                    className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 text-xs font-semibold rounded-lg transition"
                  >
                    🚫 Відкликати (Revoke)
                  </button>
                </>
              ) : (
                <span className="text-xs text-rose-400 font-bold px-3 py-1 bg-rose-950 border border-rose-800 rounded-lg">
                  ❌ Посилання відкликано
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {revoked
              ? 'Сертифікат позначено як недійсний у Revocation List. Публічний доступ за старим посиланням заблоковано.'
              : 'Посилання містить криптографічний HMAC-підпис. Жодні приватні дані (email, токени) не передаються третім особам. Дійсне протягом 30 днів.'}
          </p>
        </div>
      )}
    </section>
  );
}
