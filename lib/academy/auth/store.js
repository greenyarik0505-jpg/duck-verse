import crypto from 'crypto';
import { ACADEMY_ROLES } from './roles.js';

// In-memory сховище з попередньо створеними демонстраційними акаунтами
const usersDb = new Map();

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

/**
 * Ініціалізація початкових користувачів платформи
 */
function initializeSeedUsers() {
  if (usersDb.size > 0) return;

  // 1. Учень (Child / Student)
  const childSalt = crypto.randomBytes(16).toString('hex');
  usersDb.set('user_student_duck', {
    id: 'user_student_duck',
    username: 'student_duck',
    salt: childSalt,
    passwordHash: hashPassword('DuckPass123!', childSalt),
    role: ACADEMY_ROLES.CHILD,
    parentConsent: {
      granted: true,
      grantedAt: '2026-09-16T12:00:00.000Z',
      scope: 'educational_only',
    },
    createdAt: '2026-09-16T12:00:00.000Z',
  });

  // Сумісність для тестів
  usersDb.set('user_student_yarik', {
    id: 'user_student_yarik',
    username: 'student_yarik',
    salt: childSalt,
    passwordHash: hashPassword('DuckPass123!', childSalt),
    role: ACADEMY_ROLES.CHILD,
    parentConsent: {
      granted: true,
      grantedAt: '2026-09-16T12:00:00.000Z',
      scope: 'educational_only',
    },
    createdAt: '2026-09-16T12:00:00.000Z',
  });

  // 2. Ментор (Mentor / Instructor)
  const mentorSalt = crypto.randomBytes(16).toString('hex');
  usersDb.set('user_mentor_alex', {
    id: 'user_mentor_alex',
    username: 'mentor_alex',
    salt: mentorSalt,
    passwordHash: hashPassword('MentorPass123!', mentorSalt),
    role: ACADEMY_ROLES.MENTOR,
    parentConsent: null,
    createdAt: '2026-09-16T12:00:00.000Z',
  });

  // 3. Адміністратор (Admin)
  const adminSalt = crypto.randomBytes(16).toString('hex');
  usersDb.set('user_admin_root', {
    id: 'user_admin_root',
    username: 'admin_root',
    salt: adminSalt,
    passwordHash: hashPassword('AdminRootPass123!', adminSalt),
    role: ACADEMY_ROLES.ADMIN,
    parentConsent: null,
    createdAt: '2026-09-16T12:00:00.000Z',
  });
}

initializeSeedUsers();

export function findUserById(id) {
  initializeSeedUsers();
  return usersDb.get(id) || null;
}

export function findUserByUsername(username) {
  initializeSeedUsers();
  for (const user of usersDb.values()) {
    if (user.username.toLowerCase() === username.toLowerCase()) {
      return user;
    }
  }
  return null;
}

export function registerUser({ username, password, role = ACADEMY_ROLES.CHILD, parentConsent = false }) {
  initializeSeedUsers();

  if (!username || username.length < 3) {
    throw new Error('Username має містити щонайменше 3 символи');
  }
  if (!password || password.length < 6) {
    throw new Error('Пароль має містити щонайменше 6 символів');
  }

  if (findUserByUsername(username)) {
    throw new Error('Користувач із таким іменем уже існує');
  }

  const validRoles = Object.values(ACADEMY_ROLES);
  if (!validRoles.includes(role)) {
    throw new Error(`Невалідна роль користувача: ${role}`);
  }

  const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);

  const newUser = {
    id,
    username,
    salt,
    passwordHash,
    role,
    parentConsent: role === ACADEMY_ROLES.CHILD ? {
      granted: Boolean(parentConsent),
      grantedAt: new Date().toISOString(),
      scope: 'educational_only',
    } : null,
    createdAt: new Date().toISOString(),
  };

  usersDb.set(id, newUser);
  return newUser;
}

export function authenticateUser(username, password) {
  initializeSeedUsers();
  const user = findUserByUsername(username);
  if (!user) return null;

  const candidateHash = hashPassword(password, user.salt);
  if (crypto.timingSafeEqual(Buffer.from(candidateHash), Buffer.from(user.passwordHash))) {
    return user;
  }
  return null;
}
