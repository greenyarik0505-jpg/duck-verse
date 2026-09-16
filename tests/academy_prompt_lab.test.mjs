import { PROMPT_LAB_EXERCISES, evaluatePromptBrief } from '../lib/academy/vibePromptLab.js';

console.log('--- 🧪 ТЕСТУВАННЯ VIBE-CODING PROMPT LAB (SCRUM-45) ---');

// Тест 1: Перевірка наявності щонайменше 5 вправ від Beginner до Senior/Staff
if (PROMPT_LAB_EXERCISES.length >= 5) {
  console.log(`✅ Тест 1 пройдено: Лабораторія містить ${PROMPT_LAB_EXERCISES.length} вправ.`);
} else {
  console.error('❌ Тест 1 провалено: очікувалося щонайменше 5 вправ.');
  process.exit(1);
}

// Тест 2: Повнота структури кожної вправи
const requiredLevels = ['Beginner', 'Junior', 'Mid', 'Senior'];
const foundLevels = new Set(PROMPT_LAB_EXERCISES.map((e) => e.level));
for (const req of requiredLevels) {
  if (!foundLevels.has(req)) {
    console.error(`❌ Тест 2 провалено: відсутній рівень складності '${req}'.`);
    process.exit(1);
  }
}

for (const ex of PROMPT_LAB_EXERCISES) {
  if (!ex.id || !ex.title || !ex.rawIdea || !ex.weakPrompt || !ex.strongPrompt || !Array.isArray(ex.rubricCriteria)) {
    console.error(`❌ Тест 2 провалено для вправи '${ex.id}': неповна структура.`);
    process.exit(1);
  }
}
console.log('✅ Тест 2 пройдено: Усі вправи мають правильну структуру та градацію рівнів.');

// Тест 3: Оцінка слабкого промпту (повинен отримати низький бал)
const weakEval = evaluatePromptBrief(PROMPT_LAB_EXERCISES[0].weakPrompt, PROMPT_LAB_EXERCISES[0].id);
if (weakEval.score < 60 && !weakEval.passed) {
  console.log(`✅ Тест 3 пройдено: Слабкий промпт отримав оцінку ${weakEval.score}/100 і не пройшов поріг якості.`);
} else {
  console.error('❌ Тест 3 провалено: слабкий промпт не повинен проходити:', weakEval);
  process.exit(1);
}

// Тест 4: Оцінка сильного інженерного брифу (повинен отримати високий бал)
const strongEval = evaluatePromptBrief(PROMPT_LAB_EXERCISES[0].strongPrompt, PROMPT_LAB_EXERCISES[0].id);
if (strongEval.score >= 80 && strongEval.passed) {
  console.log(`✅ Тест 4 пройдено: Сильний інженерний бриф набрав ${strongEval.score}/100 і задовольнив рубрику.`);
} else {
  console.error('❌ Тест 4 провалено: сильний промпт повинен мати високий бал:', strongEval);
  process.exit(1);
}

// Тест 5: Перевірка формату експорту для Jira/PR
if (strongEval.exportMarkdown.includes('Engineering Implementation Brief') && strongEval.exportMarkdown.includes('SCRUM-45')) {
  console.log('✅ Тест 5 пройдено: Експорт для Jira task / GitHub PR успішно згенеровано.');
} else {
  console.error('❌ Тест 5 провалено:', strongEval.exportMarkdown);
  process.exit(1);
}

console.log('\n🎉 ВСІ АВТОМАТИЗОВАНІ ТЕСТИ VIBE-CODING PROMPT LAB УСПІШНО ПРОЙДЕНО!');
