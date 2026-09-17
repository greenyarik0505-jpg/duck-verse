import {
  ALLOWED_GAMES,
  validateScore,
  sanitizeUsername,
} from '../lib/scores/validation.js';

console.log('--- 🛡️ ТЕСТУВАННЯ SCORES API SECURITY & VALIDATION (SCRUM-38) ---');

// Test 1: Allowlist активних ігор
const allowedExpected = ['geometry_dash', 'neon-hacker', 'invaders', 'clicker', 'flappy', 'hunter'];
for (const g of allowedExpected) {
  if (!ALLOWED_GAMES.has(g)) {
    console.error(`❌ Тест 1 провалено: Очікувана гра ${g} відсутня в allowlist.`);
    process.exit(1);
  }
}
if (ALLOWED_GAMES.has('malicious_game') || ALLOWED_GAMES.has('../etc/passwd')) {
  console.error('❌ Тест 1 провалено: Недозволена гра знайдена в allowlist.');
  process.exit(1);
}
console.log('✅ Тест 1 пройдено: Allowlist ігор містить лише санкціоновані назви.');

// Test 2: Валідація score для Geometry Dash
if (!validateScore('geometry_dash', '100%')) {
  console.error('❌ Тест 2.1: 100% має бути валідним');
  process.exit(1);
}
if (!validateScore('geometry_dash', '0%')) {
  console.error('❌ Тест 2.2: 0% має бути валідним');
  process.exit(1);
}
if (validateScore('geometry_dash', '150%')) {
  console.error('❌ Тест 2.3: 150% має бути відхилено');
  process.exit(1);
}
if (validateScore('geometry_dash', '-10%') || validateScore('geometry_dash', 'abc%')) {
  console.error('❌ Тест 2.4: Негативні або літерні проценти мають бути відхилені');
  process.exit(1);
}
console.log('✅ Тест 2 пройдено: Валідація відсотків Geometry Dash (0..100%).');

// Test 3: Валідація очок для Invaders та інших аркад
if (!validateScore('invaders', 1540) || !validateScore('invaders', '99999')) {
  console.error('❌ Тест 3.1: Валідні бали Invaders відхилені');
  process.exit(1);
}
if (validateScore('invaders', -50) || validateScore('invaders', 99999999999)) {
  console.error('❌ Тест 3.2: Негативні або надвеликі бали не відхилені');
  process.exit(1);
}
if (validateScore('invaders', 'NaN') || validateScore('invaders', null)) {
  console.error('❌ Тест 3.3: NaN або null бали не відхилені');
  process.exit(1);
}
console.log('✅ Тест 3 пройдено: Валідація числових балів аркадних ігор.');

// Test 4: Валідація та санітизація username
const validUser1 = sanitizeUsername('Player1');
const validUser2 = sanitizeUsername('  Гравець_77  ');
if (validUser1 !== 'Player1' || validUser2 !== 'Гравець_77') {
  console.error('❌ Тест 4.1: Помилка нормалізації валідних імен');
  process.exit(1);
}

// Too short, too long, or malicious characters
if (sanitizeUsername('a') !== null) {
  console.error('❌ Тест 4.2: Односимвольне ім’я не було відхилено');
  process.exit(1);
}
if (sanitizeUsername('A'.repeat(35)) !== null) {
  console.error('❌ Тест 4.3: Занадто довге ім’я не було відхилено');
  process.exit(1);
}
if (sanitizeUsername('<script>alert(1)</script>') !== null) {
  console.error('❌ Тест 4.4: XSS ін’єкція в імені не була заблокована');
  process.exit(1);
}
console.log('✅ Тест 4 пройдено: Санітизація та захист імені користувача від XSS та некоректної довжини.');

console.log('\n🎉 ВСІ АВТОМАТИЗОВАНІ ТЕСТИ SCORES SECURITY УСПІШНО ПРОЙДЕНО!');
