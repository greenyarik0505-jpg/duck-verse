import { NextResponse } from 'next/server';
import { verifyCertificateToken, revokeCertificate } from '../../../../lib/academy/portfolio/certificate';

/**
 * GET /api/academy/certificate?token=...
 * Публічна верифікація сертифіката за підписаним токеном
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Параметр token є обов\'язковим' },
      { status: 400 }
    );
  }

  const result = verifyCertificateToken(token);

  if (!result.valid) {
    const status = result.error === 'CERTIFICATE_EXPIRED' ? 410 :
                   result.error === 'CERTIFICATE_REVOKED' ? 403 : 401;
    return NextResponse.json(
      { success: false, error: result.error, expiredAt: result.expiredAt },
      { status }
    );
  }

  return NextResponse.json({
    success: true,
    certificate: result.certificate
  });
}

/**
 * POST /api/academy/certificate
 * Відкликання (Revoke) посилання на сертифікат
 * Тіло запиту: { certificateId: string }
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.certificateId) {
      return NextResponse.json(
        { success: false, error: 'Поле certificateId є обов\'язковим' },
        { status: 400 }
      );
    }

    const success = revokeCertificate(body.certificateId);
    return NextResponse.json({
      success,
      certificateId: body.certificateId,
      status: 'REVOKED'
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
