import { NextResponse } from 'next/server';
import { verifySignedSessionToken, COOKIE_CONFIG } from '../../../../../lib/academy/auth/session';
import { findUserById } from '../../../../../lib/academy/auth/store';
import { ROLE_PERMISSIONS } from '../../../../../lib/academy/auth/roles';

export async function GET(request) {
  const sessionCookie = request.cookies.get(COOKIE_CONFIG.name);

  if (!sessionCookie || !sessionCookie.value) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  const { valid, session, error } = verifySignedSessionToken(sessionCookie.value);
  if (!valid || !session) {
    return NextResponse.json({ authenticated: false, error }, { status: 401 });
  }

  const user = findUserById(session.userId);
  if (!user) {
    return NextResponse.json({ authenticated: false, error: 'USER_NOT_FOUND' }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      parentConsent: Boolean(user.parentConsent?.granted),
      permissions: ROLE_PERMISSIONS[user.role] || [],
    },
  });
}
