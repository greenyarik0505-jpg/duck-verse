import '../styles.css';

export const metadata = {
  title: 'Неоновий Взломщик (Neon Hacker) — Кібер-ігровий Хаб',
  description: 'Кіберпанк гра-головоломка Neon Hacker та екшен хаб на Next.js 15 & Vercel',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
