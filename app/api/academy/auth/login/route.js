import { NextResponse } from 'next/server';
import { authenticateUser } from '../../../../../lib/academy/auth/store';
import { createSignedSessionToken, sanitizeUser, COOKIE_CONFIG } from '../../../../../lib/academy/auth/session';

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Вкажіть логін та пароль' },
        { status: 400 }
      );
    }

    const user = authenticateUser(username, password);
    if (!user) {
      return NextResponse.json(
        { error: 'Невірні облікові дані' },
        { status: 401 }
      );
    }

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
      { error: 'Внутрішня помилка сервера аутентифікації' },
      { status: 500 }
    );
  }
}
