'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function CertificateContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [certData, setCertData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setError('Токен сертифіката відсутній.');
      setLoading(false);
      return;
    }

    fetch(`/api/academy/certificate?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.certificate) {
          setCertData(data.certificate);
        } else {
          setError(data.error === 'CERTIFICATE_EXPIRED' ? 'Термін дії цього сертифіката минув.' :
                   data.error === 'CERTIFICATE_REVOKED' ? 'Цей сертифікат було відкликано автором.' :
                   'Невалідний цифровий підпис сертифіката.');
        }
      })
      .catch((err) => {
        setError('Помилка під час верифікації сертифіката.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060913] text-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-mono text-sm text-slate-400">Перевірка цифрового підпису HMAC...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#060913] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-rose-800/50 rounded-2xl p-6 text-center shadow-2xl">
          <span className="text-4xl block mb-3">⚠️</span>
          <h2 className="text-lg font-bold text-rose-400 mb-2">Сертифікат не верифіковано</h2>
          <p className="text-sm text-slate-300 mb-6">{error}</p>
          <Link
            href="/academy"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold rounded-xl transition"
          >
            ← Повернутися до Duck Academy
          </Link>
        </div>
      </div>
    );
  }

  const issueDate = certData?.iat ? new Date(certData.iat).toLocaleDateString('uk-UA') : '2026-09-17';
  const expireDate = certData?.exp ? new Date(certData.exp).toLocaleDateString('uk-UA') : '2026-10-17';

  return (
    <div className="min-h-screen bg-[#060913] text-white flex flex-col items-center justify-center p-4 py-12">
      <div className="max-w-2xl w-full bg-gradient-to-b from-[#110f24] to-[#0a0d1a] border-2 border-purple-500/40 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Certificate Header */}
        <div className="text-center relative z-10 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/15 border border-purple-400/30 rounded-full text-xs font-mono text-purple-300 mb-4">
            <span>🛡️</span>
            <span>Cryptographically Verified Certificate</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-['Orbitron',sans-serif] text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300 mb-2">
            DUCK ACADEMY
          </h1>
          <p className="text-xs uppercase tracking-widest text-slate-400 font-mono">
            Certificate of Engineering Excellence
          </p>
        </div>

        {/* Recipient */}
        <div className="text-center relative z-10 my-8 py-6 border-y border-purple-500/20">
          <span className="text-xs text-slate-400 block mb-1 font-mono">Цим засвідчується, що інженер</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Rajdhani',sans-serif] mb-2 text-cyan-300">
            {certData?.displayName || 'Duck Master'}
          </h2>
          <p className="text-sm text-slate-300 max-w-lg mx-auto">
            успішно виконав інженерний трек <strong className="text-purple-300">{certData?.trackTitle}</strong>,
            захистив свідоцтва виконаних завдань (PR, Jira, Automated Tests) та здав Senior Engineering Rubric.
          </p>
        </div>

        {/* Metadata Footer */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono relative z-10 text-slate-400">
          <div>
            <span className="block text-slate-500">ID Сертифіката:</span>
            <span className="text-purple-300 font-bold">{certData?.certId?.slice(0, 16)}...</span>
          </div>
          <div>
            <span className="block text-slate-500">Дата видачі:</span>
            <span className="text-slate-200">{issueDate}</span>
          </div>
          <div>
            <span className="block text-slate-500">Дійсний до:</span>
            <span className="text-slate-200">{expireDate}</span>
          </div>
        </div>

        {/* Action Link */}
        <div className="text-center mt-8 pt-6 border-t border-slate-800/80 relative z-10">
          <Link
            href="/academy"
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 underline transition"
          >
            ← Перейти до Duck Academy
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CertificatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#060913]" />}>
      <CertificateContent />
    </Suspense>
  );
}
