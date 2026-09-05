import '../styles.css';

export const metadata = {
  title: 'Duck Verse — Next.js Game Hub & Geometry Dash',
  description: 'Cyberpunk Game Hub on Next.js 15 & Vercel featuring Geometry Dash Neon',
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
