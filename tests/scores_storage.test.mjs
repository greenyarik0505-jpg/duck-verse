import { scoresRepository } from '../lib/storage/scoresRepository.js';
import { parseNumericScore, validateScoreRecord } from '../lib/storage/schema.js';

console.log('--- 🧪 ТЕСТУВАННЯ PERSISTENT SCORES STORAGE (SCRUM-41) ---');

// Скидаємо репозиторій до початкового стану для чистоти тесту
scoresRepository.resetForTesting();

// Тест 1: Перевірка парсера числових очок
const p1 = parseNumericScore('100%');
const p2 = parseNumericScore('2500 pts');
const p3 = parseNumericScore(85);
if (p1 === 100 && p2 === 2500 && p3 === 85) {
  console.log('✅ Тест 1 пройдено: parseNumericScore коректно конвертує відсотки, бали та числа.');
} else {
  console.error('❌ Тест 1 провалено:', { p1, p2, p3 });
  process.exit(1);
}

// Тест 2: Отримання початкових рекордів (seed data)
const initial = await scoresRepository.getScores({ game: 'geometry_dash' });
if (initial.scores.length >= 3 && initial.total >= 3) {
  console.log(`✅ Тест 2 пройдено: Отримано ${initial.total} початкових записів із сховища.`);
} else {
  console.error('❌ Тест 2 провалено: очікувалося щонайменше 3 записи, отримано:', initial);
  process.exit(1);
}

// Тест 3: Перевірка сортування (найвищий результат першим)
const scores = initial.scores.map((s) => s.numericScore);
const isSorted = scores.every((val, i, arr) => !i || arr[i - 1] >= val);
if (isSorted) {
  console.log('✅ Тест 3 пройдено: Рекорди повернуто у стабільно відсортованому спадному порядку.');
} else {
  console.error('❌ Тест 3 провалено: рекорди не відсортовані:', scores);
  process.exit(1);
}

// Тест 4: Додавання нового рекорду
const addResult = await scoresRepository.addScore({
  username: 'TestCyberDuck',
  game: 'geometry_dash',
  score: '99%',
  idempotencyKey: 'test-key-uuid-1'
});
if (addResult.success && addResult.record && !addResult.duplicate) {
  console.log('✅ Тест 4.1 пройдено: Новий рекорд успішно додано до сховища.');
} else {
  console.error('❌ Тест 4.1 провалено:', addResult);
  process.exit(1);
}

// Перевіряємо, що новий рекорд з'явився у вибірці
const afterAdd = await scoresRepository.getScores({ game: 'geometry_dash' });
const found = afterAdd.scores.find((s) => s.username === 'TestCyberDuck');
if (found && found.numericScore === 99) {
  console.log('✅ Тест 4.2 пройдено: Новий рекорд присутній в оновленій вибірці.');
} else {
  console.error('❌ Тест 4.2 провалено.');
  process.exit(1);
}

// Тест 5: Ідемпотентність повторного POST запиту
const duplicateResult = await scoresRepository.addScore({
  username: 'TestCyberDuck',
  game: 'geometry_dash',
  score: '99%',
  idempotencyKey: 'test-key-uuid-1'
});
if (duplicateResult.success && duplicateResult.duplicate === true) {
  console.log('✅ Тест 5 пройдено: Повторне збереження з тим самим idempotencyKey визначено як дублікат.');
} else {
  console.error('❌ Тест 5 провалено:', duplicateResult);
  process.exit(1);
}

// Тест 6: Пагінація (limit, offset, hasMore)
const page1 = await scoresRepository.getScores({ game: 'geometry_dash', limit: 2, offset: 0 });
const page2 = await scoresRepository.getScores({ game: 'geometry_dash', limit: 2, offset: 2 });
if (page1.scores.length === 2 && page1.hasMore === true && page2.scores.length >= 1) {
  console.log('✅ Тест 6 пройдено: Пагінація limit/offset/hasMore працює коректно.');
} else {
  console.error('❌ Тест 6 провалено:', { page1, page2 });
  process.exit(1);
}

// Тест 7: Валідація некоректного запису
const validationErrors = validateScoreRecord({ id: 'bad' });
if (validationErrors.length >= 3) {
  console.log('✅ Тест 7 пройдено: Схема відхилила неповний запис рекорду.');
} else {
  console.error('❌ Тест 7 провалено:', validationErrors);
  process.exit(1);
}

console.log('\n🎉 ВСІ АВТОМАТИЗОВАНІ ТЕСТИ SCORES STORAGE УСПІШНО ПРОЙДЕНО!');
