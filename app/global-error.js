'use client';

export default function GlobalError({ error, reset }) {
  return (
    <html lang="uk">
      <head>
        <title>Критична помилка | Duck Verse</title>
      </head>
      <body style={{
        margin: 0,
        padding: '24px',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#080c14',
        color: '#e2e8f0',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
          background: '#0d1424',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          borderRadius: '16px',
          padding: '32px 24px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.7)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }} aria-hidden="true">🦆💥</div>
          <h1 style={{ fontSize: '20px', margin: '0 0 12px 0', color: '#fff' }}>Критичний збій хабу</h1>
          <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 24px 0' }}>
            Не вдалося завантажити кореневий інтерфейс. Спробуйте оновити сторінку або перезапустити хаб.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              background: '#0284c7',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            🔄 Перезавантажити хаб
          </button>
        </div>
      </body>
    </html>
  );
}
