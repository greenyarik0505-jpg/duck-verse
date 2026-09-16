import {
  buildPortfolioView,
  generateCertificate,
  verifyCertificateToken,
  revokeCertificate,
  SENIOR_RUBRIC_DIMENSIONS
} from '../lib/academy/portfolio/certificate.js';

console.log('--- 🧪 ТЕСТУВАННЯ PORTFOLIO & SKILLS CERTIFICATE (SCRUM-47) ---');

// Тест 1: Побудова приватного портфоліо з верифікованими свідченнями
const portfolio = buildPortfolioView({
  learnerId: 'learner-101',
  displayName: 'Duck Master',
  completedLessonIds: ['lesson-fe-l0-arch'],
  rubricScores: { tradeoffs: 5, security: 5, performance: 4, maintainability: 5 },
  mentorFeedback: 'Усі контракти виконано.'
});

if (portfolio.completedLessonsCount === 1 && portfolio.lessons[0].evidence.githubPr.includes('pulls')) {
  console.log('✅ Тест 1 пройдено: Портфоліо агрегує верифіковані свідчення (PR, Jira, тести).');
} else {
  console.error('❌ Тест 1 провалено:', portfolio);
  process.exit(1);
}

// Тест 2: Генерація валідного криптографічного сертифіката
const certResult = generateCertificate({
  learnerId: 'learner-101',
  displayName: 'Duck Master',
  trackId: 'track-frontend-gaming',
  completedLessonIds: ['lesson-fe-l0-arch'],
  expiresInDays: 30
});

if (certResult.token && certResult.certificateId && certResult.shareUrl) {
  console.log('✅ Тест 2 пройдено: Сертифікат та підписаний токен успішно згенеровано.');
} else {
  console.error('❌ Тест 2 провалено:', certResult);
  process.exit(1);
}

// Тест 3: Верифікація незміненого сертифіката
const verified = verifyCertificateToken(certResult.token);
if (verified.valid && verified.certificate.displayName === 'Duck Master') {
  console.log('✅ Тест 3 пройдено: Цифровий HMAC-підпис сертифіката валідний.');
} else {
  console.error('❌ Тест 3 провалено:', verified);
  process.exit(1);
}

// Тест 4: Перевірка приватності (Zero leakage of emails or secrets)
const payloadString = JSON.stringify(verified.certificate);
if (!payloadString.includes('@') && !payloadString.includes('secret') && !payloadString.includes('password')) {
  console.log('✅ Тест 4 пройдено: Публічний токен не містить email або приватних секретів.');
} else {
  console.error('❌ Тест 4 провалено: виявлено витік чутливих даних у токені:', payloadString);
  process.exit(1);
}

// Тест 5: Захист від модифікації (Tampering protection)
const parts = certResult.token.split('.');
const tamperedToken = `${parts[0].slice(0, -4)}AAAA.${parts[1]}`;
const tamperedVerify = verifyCertificateToken(tamperedToken);
if (!tamperedVerify.valid && tamperedVerify.error === 'INVALID_SIGNATURE') {
  console.log('✅ Тест 5 пройдено: Підробка даних у токені миттєво відхилена (INVALID_SIGNATURE).');
} else {
  console.error('❌ Тест 5 провалено: модифікований токен не повинен проходити валідацію:', tamperedVerify);
  process.exit(1);
}

// Тест 6: Термін дії (Expiration test)
const expiredCert = generateCertificate({
  learnerId: 'learner-101',
  displayName: 'Duck Master',
  trackId: 'track-frontend-gaming',
  completedLessonIds: ['lesson-fe-l0-arch'],
  expiresInDays: -1 // вже прострочений
});
const expiredVerify = verifyCertificateToken(expiredCert.token);
if (!expiredVerify.valid && expiredVerify.error === 'CERTIFICATE_EXPIRED') {
  console.log('✅ Тест 6 пройдено: Прострочений сертифікат безпечно відхилено (CERTIFICATE_EXPIRED).');
} else {
  console.error('❌ Тест 6 провалено:', expiredVerify);
  process.exit(1);
}

// Тест 7: Відкликання сертифіката (Revocation flow)
revokeCertificate(certResult.certificateId);
const revokedVerify = verifyCertificateToken(certResult.token);
if (!revokedVerify.valid && revokedVerify.error === 'CERTIFICATE_REVOKED') {
  console.log('✅ Тест 7 пройдено: Відкликаний сертифікат позначено як недійсний (CERTIFICATE_REVOKED).');
} else {
  console.error('❌ Тест 7 провалено:', revokedVerify);
  process.exit(1);
}

console.log('\n🎉 ВСІ АВТОМАТИЗОВАНІ ТЕСТИ PORTFOLIO & CERTIFICATE УСПІШНО ПРОЙДЕНО!');
