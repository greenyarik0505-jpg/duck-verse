import crypto from 'crypto';

const SESSION_COOKIE_NAME = 'duck_academy_session';
const DEFAULT_SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 години

// Секретний ключ для підпису сесій
const AUTH_SECRET = process.env.ACADEMY_AUTH_SECRET || 'duck-academy-secure-salt-key-2026-matrix';

/**
 * Кодування base64url
 */
function base64UrlEncode(data) {
  return Buffer.from(data)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Декодування base64url
 */
function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Створення криптографічно підписаного сесійного токена
 * @param {Object} user Користувач { id, username, role, parentConsent }
 * @param {number} ttlMs Час життя сесії в мілісекундах
 * @returns {string} Токен у форматі payload.signature
 */
export function createSignedSessionToken(user, ttlMs = DEFAULT_SESSION_TTL_MS) {
  const now = Date.now();
  const payload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    parentConsent: Boolean(user.parentConsent),
    iat: now,
    exp: now + ttlMs,
  };

  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(payloadEncoded)
    .digest('base64url');

  return `${payloadEncoded}.${signature}`;
}

/**
 * Перевірка та валідація підписаного сесійного токена
 * @param {string} token Токен сесії
 * @returns {{ valid: boolean, session?: Object, error?: string }}
 */
export function verifySignedSessionToken(token) {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'MISSING_TOKEN' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'MALFORMED_TOKEN' };
  }

  const [payloadEncoded, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(payloadEncoded)
    .digest('base64url');

  // Захист від time-based атак порівняння сигнатур
  const isSignatureValid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );

  if (!isSignatureValid) {
    return { valid: false, error: 'INVALID_SIGNATURE' };
  }

  try {
    const payload = JSON.parse(base64UrlDecode(payloadEncoded));
    const now = Date.now();

    if (payload.exp && now > payload.exp) {
      return { valid: false, error: 'SESSION_EXPIRED' };
    }

    return { valid: true, session: payload };
  } catch {
    return { valid: false, error: 'INVALID_PAYLOAD_JSON' };
  }
}

/**
 * Безпечна серіалізація користувача для клієнтської сторони
 * (Запобігає витоку паролів та чутливих токенів)
 */
export function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    parentConsent: Boolean(user.parentConsent),
    createdAt: user.createdAt,
  };
}

export const COOKIE_CONFIG = {
  name: SESSION_COOKIE_NAME,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: DEFAULT_SESSION_TTL_MS / 1000,
};
