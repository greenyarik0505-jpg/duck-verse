import { NextResponse } from 'next/server';
import { verifySignedSessionToken, COOKIE_CONFIG } from '../../../../../lib/academy/auth/session';
import { canAccessResource } from '../../../../../lib/academy/auth/roles';

export async function POST(request) {
  try {
    const sessionCookie = request.cookies.get(COOKIE_CONFIG.name);
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json(
        { allowed: false, error: 'UNAUTHENTICATED' },
        { status: 401 }
      );
    }

    const { valid, session } = verifySignedSessionToken(sessionCookie.value);
    if (!valid || !session) {
      return NextResponse.json(
        { allowed: false, error: 'INVALID_OR_EXPIRED_SESSION' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { resourceOwnerId, requiredPermission } = body;

    const accessCheck = canAccessResource({
      user: {
        id: session.userId,
        role: session.role,
        username: session.username,
      },
      resourceOwnerId,
      requiredPermission,
    });

    if (!accessCheck.allowed) {
      return NextResponse.json(
        {
          allowed: false,
          reason: accessCheck.reason,
          message: accessCheck.message,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      allowed: true,
      message: 'Доступ надано згідно з матрицею безпеки Duck Academy RBAC',
    });
  } catch {
    return NextResponse.json(
      { error: 'Помилка валідації доступу до ресурсу' },
      { status: 500 }
    );
  }
}
