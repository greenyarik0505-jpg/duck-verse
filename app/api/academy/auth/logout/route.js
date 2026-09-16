import { NextResponse } from 'next/server';
import { COOKIE_CONFIG } from '../../../../../lib/academy/auth/session';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Сесію успішно завершено',
  });

  // Безпечне відкликання cookie на стороні клієнта
  response.cookies.set(COOKIE_CONFIG.name, '', {
    httpOnly: COOKIE_CONFIG.httpOnly,
    secure: COOKIE_CONFIG.secure,
    sameSite: COOKIE_CONFIG.sameSite,
    path: COOKIE_CONFIG.path,
    maxAge: 0,
  });

  return response;
}
