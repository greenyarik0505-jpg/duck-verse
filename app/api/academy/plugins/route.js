import { NextResponse } from 'next/server';
import { verifySignedSessionToken, COOKIE_CONFIG } from '../../../../lib/academy/auth/session';
import { ACADEMY_ROLES } from '../../../../lib/academy/auth/roles';
import {
  getPluginState,
  isFeatureEnabled,
  setFeatureFlag,
  loadPluginSafely,
  runMigration,
  rollbackMigration
} from '../../../../lib/academy/plugins/flags';

export async function GET(request) {
  try {
    const state = getPluginState();
    return NextResponse.json({ success: true, ...state });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Помилка отримання стану плагінів' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, flagKey, updates, pluginId, migrationId } = body;

    // Опціональна перевірка сесії (якщо передано кукі)
    const sessionCookie = request.cookies.get(COOKIE_CONFIG.name);
    let sessionUser = { role: 'guest', username: 'guest' };

    if (sessionCookie && sessionCookie.value) {
      const { valid, session } = verifySignedSessionToken(sessionCookie.value);
      if (valid && session) {
        sessionUser = session;
      }
    }

    // 1. Дія: Оновлення прапорця або активація Kill Switch
    if (action === 'set_flag' || action === 'toggle_kill_switch') {
      if (sessionUser.role !== ACADEMY_ROLES.ADMIN && sessionUser.role !== ACADEMY_ROLES.MENTOR) {
        return NextResponse.json(
          {
            error: 'PRIVILEGE_VIOLATION',
            message: 'Тільки ментор або адміністратор має право змінювати конфігурацію Feature Flags'
          },
          { status: 403 }
        );
      }

      const result = setFeatureFlag(flagKey, updates, sessionUser);
      return NextResponse.json({ success: true, ...result });
    }

    // 2. Дія: Безпечне тестування плагіна в ізольованій пісочниці
    if (action === 'test_plugin') {
      const result = loadPluginSafely(pluginId);
      return NextResponse.json(result);
    }

    // 3. Дія: Запуск міграції даних
    if (action === 'run_migration') {
      if (sessionUser.role !== ACADEMY_ROLES.ADMIN && sessionUser.role !== ACADEMY_ROLES.MENTOR) {
        return NextResponse.json(
          {
            error: 'PRIVILEGE_VIOLATION',
            message: 'Тільки ментор або адміністратор має право запускати міграції бази даних'
          },
          { status: 403 }
        );
      }

      const result = runMigration(migrationId);
      return NextResponse.json(result);
    }

    // 4. Дія: Відкат міграції даних (Rollback)
    if (action === 'rollback_migration') {
      if (sessionUser.role !== ACADEMY_ROLES.ADMIN && sessionUser.role !== ACADEMY_ROLES.MENTOR) {
        return NextResponse.json(
          {
            error: 'PRIVILEGE_VIOLATION',
            message: 'Тільки адміністратор має право виконувати відкат міграцій'
          },
          { status: 403 }
        );
      }

      const result = rollbackMigration(migrationId);
      return NextResponse.json(result);
    }

    // 5. Дія: Оцінка доступності прапорця (Evaluate flag)
    if (action === 'evaluate_flag') {
      const enabled = isFeatureEnabled(flagKey, { userId: sessionUser.userId });
      return NextResponse.json({ success: true, flagKey, enabled });
    }

    return NextResponse.json(
      { error: `Невідома дія: ${action}` },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Помилка виконання операції плагінів' },
      { status: 500 }
    );
  }
}
