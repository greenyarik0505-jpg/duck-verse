import Link from 'next/link';
import PublicStatusView from '@/components/status/PublicStatusView';

export const metadata = {
  title: 'Статус системи | Duck Verse & Academy',
  description: 'Публічний моніторинг доступності та інцидентів платформи Duck Verse.',
};

export default function StatusPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto flex items-center justify-between pb-6 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-3 text-white hover:text-emerald-400 transition-colors">
          <span className="text-2xl">🦆</span>
          <span className="font-black text-xl tracking-tight">DUCK VERSE</span>
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
            SYSTEM STATUS
          </span>
        </Link>
        <div className="flex items-center gap-4 text-xs">
          <Link href="/academy" className="text-slate-400 hover:text-white transition-colors">
            Duck Academy →
          </Link>
          <Link href="/" className="text-slate-400 hover:text-white transition-colors">
            Ігровий Хаб →
          </Link>
        </div>
      </div>

      <PublicStatusView isStandalone={true} />

      <footer className="max-w-5xl mx-auto text-center text-xs text-slate-500 py-8 border-t border-slate-900 mt-12">
        DUCK VERSE RELIABILITY & INCIDENT COMMUNICATION (SCRUM-114) • 2026
      </footer>
    </main>
  );
}
