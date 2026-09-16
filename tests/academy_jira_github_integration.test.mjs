import assert from 'assert';
import {
  validateGithubPrUrl,
  validateJiraKey,
  getLessonIntegrationStatus,
  validateIntegrationBinding,
} from '../lib/academy/integrations/jiraGithub.js';

console.log('--- 🔗 ТЕСТУВАННЯ ІНТЕГРАЦІЇ JIRA & GITHUB ДЛЯ DUCK ACADEMY (SCRUM-53) ---');

// 1. Валідація посилань GitHub PR
console.log('1. Тест валідації GitHub PR URL...');
assert.strictEqual(
  validateGithubPrUrl('https://github.com/greenyarik0505-jpg/duck-verse/pull/18'),
  true,
  'Офіційний репозиторій має бути валідним'
);
assert.strictEqual(
  validateGithubPrUrl('https://github.com/hacker-corp/fake-duck/pull/18'),
  false,
  'Сторонній репозиторій має бути відхилений'
);
assert.strictEqual(
  validateGithubPrUrl('not_a_valid_url'),
  false,
  'Невалідна адреса має бути відхилена'
);
console.log('✅ Валідація GitHub PR успішно блокує сторонні репозиторії');

// 2. Валідація ключів Jira
console.log('2. Тест валідації ключів Jira...');
assert.strictEqual(validateJiraKey('SCRUM-53'), true, 'SCRUM-53 має бути валідним');
assert.strictEqual(validateJiraKey('SCRUM-1'), true, 'SCRUM-1 має бути валідним');
assert.strictEqual(validateJiraKey('PROJ-12'), false, 'Сторонній проект PROJ має бути відхилений');
assert.strictEqual(validateJiraKey('SCRUM'), false, 'Ключ без дефісу має бути відхилений');
assert.strictEqual(validateJiraKey('SCRUM-abc'), false, 'Ключ без номера має бути відхилений');
console.log('✅ Валідація Jira дозволяє тільки авторизовані проекти команди (SCRUM)');

// 3. Перевірка кешування та стійкості до rate limits
console.log('3. Тест кешування та стійкості...');
const status1 = await getLessonIntegrationStatus('lesson-fe-l0-arch', 'SCRUM-56');
assert.strictEqual(status1.jira.key, 'SCRUM-56');
assert.strictEqual(status1.github.ciStatus, 'success');

const status2 = await getLessonIntegrationStatus('lesson-fe-l0-arch', 'SCRUM-56');
assert.strictEqual(status1, status2, 'Кеш повертає ідентичний об’єкт без повторних запитів');
console.log('✅ Кешування статусів працює коректно');

// 4. Захист від несанкціонованого прив’язування сторонніх ресурсів
console.log('4. Тест валідації прив’язки доказів...');
const validBinding = validateIntegrationBinding({
  user: { id: 'user_student_yarik' },
  lessonId: 'lesson-fe-l0-arch',
  jiraKey: 'SCRUM-56',
  prUrl: 'https://github.com/greenyarik0505-jpg/duck-verse/pull/22',
});
assert.strictEqual(validBinding.valid, true);

const hackerBinding = validateIntegrationBinding({
  user: { id: 'user_student_yarik' },
  lessonId: 'lesson-fe-l0-arch',
  jiraKey: 'EVIL-666',
  prUrl: 'https://github.com/hacker/malware/pull/1',
});
assert.strictEqual(hackerBinding.valid, false);
console.log('✅ Захист від підключення сторонніх або шкідливих PR/Jira працює');

console.log('\n🎉 ВСІ АВТОМАТИЗОВАНІ ТЕСТИ ІНТЕГРАЦІЇ JIRA/GITHUB (SCRUM-53) УСПІШНО ПРОЙДЕНО!');
