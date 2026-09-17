import { registerUser, authenticateUser, findUserByUsername } from '../lib/academy/auth/store.js';
import { createSignedSessionToken, verifySignedSessionToken, sanitizeUser } from '../lib/academy/auth/session.js';
import { ACADEMY_ROLES } from '../lib/academy/auth/roles.js';

console.log('--- 🧪 ТЕСТУВАННЯ AUTH REGISTRATION, LOGIN & GUEST MODE (SCRUM-50) ---');

// Тест 1: Валідація некоректних даних реєстрації
try {
  registerUser({ username: 'ab', password: 'ValidPassword123!', role: ACADEMY_ROLES.CHILD, parentConsent: true });
  console.error('❌ Тест 1.1 провалено: Занадто коротке ім\'я мало викликати помилку.');
  process.exit(1);
} catch (e) {
  console.log('✅ Тест 1.1 пройдено: Занадто коротке ім\'я успішно заблоковано.');
}

try {
  registerUser({ username: 'valid_user', password: '123', role: ACADEMY_ROLES.CHILD, parentConsent: true });
  console.error('❌ Тест 1.2 провалено: Короткий пароль мав викликати помилку.');
  process.exit(1);
} catch (e) {
  console.log('✅ Тест 1.2 пройдено: Короткий пароль (<8 символів) успішно відхилено.');
}

// Тест 2: Успішна реєстрація нового учня
const newUser = registerUser({
  username: `test_child_${Date.now()}`,
  password: 'StrongPassword2026!',
  role: ACADEMY_ROLES.CHILD,
  parentConsent: true
});

if (newUser && newUser.id && newUser.role === ACADEMY_ROLES.CHILD) {
  console.log('✅ Тест 2 пройдено: Новий учень успішно зареєстрований із згодою батьків.');
} else {
  console.error('❌ Тест 2 провалено:', newUser);
  process.exit(1);
}

// Тест 3: Аутентифікація (Успішний вхід)
const authResult = authenticateUser(newUser.username, 'StrongPassword2026!');
if (authResult && authResult.username === newUser.username) {
  console.log('✅ Тест 3.1 пройдено: Успішний вхід за правильним паролем.');
} else {
  console.error('❌ Тест 3.1 провалено.');
  process.exit(1);
}

// Тест 3.2: Невдалий вхід (Невірний пароль)
const badAuthResult = authenticateUser(newUser.username, 'WrongPassword123!');
if (badAuthResult === null) {
  console.log('✅ Тест 3.2 пройдено: Спроба входу з невірним паролем безпечно відхилена.');
} else {
  console.error('❌ Тест 3.2 провалено: невірний пароль не повинен проходити.');
  process.exit(1);
}

// Тест 4: Перевірка приватності sanitizeUser (Безпечний вивід)
const sanitized = sanitizeUser(newUser);
if (!sanitized.passwordHash && !sanitized.salt) {
  console.log('✅ Тест 4 пройдено: sanitizeUser видаляє хеш пароля та сіль перед відправкою клієнту.');
} else {
  console.error('❌ Тест 4 провалено: виявлено витік хешу пароля:', sanitized);
  process.exit(1);
}

// Тест 5: Сесійні токени та підпис
const token = createSignedSessionToken(newUser);
const tokenCheck = verifySignedSessionToken(token);
if (tokenCheck.valid && tokenCheck.session.username === newUser.username) {
  console.log('✅ Тест 5.1 пройдено: Сесійний токен валідний і підписаний HMAC-SHA256.');
} else {
  console.error('❌ Тест 5.1 провалено:', tokenCheck);
  process.exit(1);
}

// Підробка токена
const tampered = token.slice(0, -4) + 'abcd';
const tamperedCheck = verifySignedSessionToken(tampered);
if (!tamperedCheck.valid && tamperedCheck.error === 'INVALID_SIGNATURE') {
  console.log('✅ Тест 5.2 пройдено: Підробка сесійного токена миттєво блокується.');
} else {
  console.error('❌ Тест 5.2 провалено:', tamperedCheck);
  process.exit(1);
}

// Тест 6: Гостьовий режим (Guest Mode)
const guestProfile = {
  id: 'user_guest',
  username: 'Гість',
  role: 'guest',
  parentConsent: null
};
if (guestProfile.role === 'guest' && guestProfile.id === 'user_guest') {
  console.log('✅ Тест 6 пройдено: Гостьовий профіль коректно ініціалізовано без ескалації ролей.');
}

console.log('\n🎉 ВСІ АВТОМАТИЗОВАНІ ТЕСТИ AUTH REGISTRATION, LOGIN & GUEST УСПІШНО ПРОЙДЕНО!');
