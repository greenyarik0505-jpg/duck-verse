import { NextResponse } from 'next/server';
import { registerUser } from '../../../../../lib/academy/auth/store';
import { createSignedSessionToken, sanitizeUser, COOKIE_CONFIG } from '../../../../../lib/academy/auth/session';
import { ACADEMY_ROLES } from '../../../../../lib/academy/auth/roles';

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password, role = ACADEMY_ROLES.CHILD, parentConsent = false } = body;

    const user = registerUser({ username, password, role, parentConsent });
    const token = createSignedSessionToken(user);
    const sanitized = sanitizeUser(user);

    const response = NextResponse.json({
      success: true,
      user: sanitized,
    });

    response.cookies.set(COOKIE_CONFIG.name, token, {
      httpOnly: COOKIE_CONFIG.httpOnly,
      secure: COOKIE_CONFIG.secure,
      sameSite: COOKIE_CONFIG.sameSite,
      path: COOKIE_CONFIG.path,
      maxAge: COOKIE_CONFIG.maxAge,
    });

    return response;
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Помилка реєстрації користувача' },
      { status: 400 }
    );
  }
}
