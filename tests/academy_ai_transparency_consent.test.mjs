import assert from 'assert';
import {
  AI_MODELS_REGISTRY,
  AI_TRANSPARENCY_POLICY,
  STATIC_CURRICULUM_FALLBACKS,
  getStudentConsentAndControls,
  updateStudentAiConsent,
  recordAiInteraction,
  getFallbackAssistance,
  exportStudentAiHistory,
  deleteStudentAiHistory,
  _resetTransparencyStateForTests,
} from '../lib/academy/safety/transparency.js';
import { ACADEMY_ROLES } from '../lib/academy/auth/roles.js';

console.log('--- 🤖 ТЕСТУВАННЯ AI TRANSPARENCY, CONSENT & DATA CONTROLS (SCRUM-104) ---');

_resetTransparencyStateForTests();

const student1 = { id: 'student_eva_01', username: 'Eva Coder', role: 'student' };
const student2 = { id: 'student_viktor_02', username: 'Viktor Coder', role: 'student' };
const parent = { id: 'parent_olena', username: 'Olena Parent', role: 'parent' };
const unauthorizedUser = { id: 'guest_99', username: 'Guest', role: 'guest' };

// Тест 1: Реєстр моделей та версіонована політика v1.2
console.log('1. Тест реєстру моделей та політики v1.2...');
assert(AI_MODELS_REGISTRY['duck-vibe-coder-v1.2']);
assert(AI_MODELS_REGISTRY['duck-vibe-coder-v1.2'].limitations.length >= 2);
assert.strictEqual(AI_TRANSPARENCY_POLICY.version, '1.2.0');
assert(AI_TRANSPARENCY_POLICY.legalFrameworks.some(f => f.includes('EU AI Act')));
console.log('✅ Моделі та політику прозорості успішно верифіковано');

// Тест 2: Формування картки прозорості та водяного знака AI
console.log('2. Тест обов\'язкового маркування генерації (Transparency & Watermark)...');
const meta = recordAiInteraction({
  studentId: student1.id,
  promptText: 'Як оптимізувати Canvas 2D рушій?',
  responseText: 'Використовуйте offscreen canvas та подвійну буферизацію.',
  taskContext: { lessonId: 'lesson-fe-l1-canvas', studentSecretToken: 'SUPER_SECRET_TOKEN' },
});
assert.strictEqual(meta.isAiGenerated, true);
assert(meta.watermark.includes('Duck AI'));
assert(meta.watermark.includes('Duck Vibe Coder'));
assert(meta.tokensEstimated > 0);
assert(!meta.dataTransferred.includes('studentSecretToken'), 'Секрети вилучено з переданих метаданих');
assert(meta.dataTransferred.includes('lessonId'));
console.log(`✅ Водяний знак згенеровано: ${meta.watermark}`);

// Тест 3: Оновлення налаштувань згоди (Opt-In / Opt-Out)
console.log('3. Тест оновлення згоди учня та батьків...');
const consentRes = updateStudentAiConsent({
  studentId: student1.id,
  aiAssistanceEnabled: false, // Вимикаємо асистента
  aiTelemetryConsent: true,
  parentConsentVerified: true,
  actor: parent,
});
assert.strictEqual(consentRes.aiAssistanceEnabled, false);
assert.strictEqual(consentRes.parentConsentVerified, true);
console.log('✅ Згоду оновлено батьками: AI assistance вимкнено (Opt-Out)');

// Тест 4: Захист Opt-Out — блокування генерацій при вимкненому ШІ
console.log('4. Тест блокування викликів ШІ при вимкненій згоді...');
assert.throws(
  () => {
    recordAiInteraction({
      studentId: student1.id,
      promptText: 'Спроба виклику при Opt-Out',
      responseText: 'Відповідь',
    });
  },
  (err) => {
    assert.strictEqual(err.code, 'AI_ASSISTANCE_DISABLED');
    return true;
  }
);
console.log('✅ Opt-Out активний: виклик заблоковано помилкою AI_ASSISTANCE_DISABLED');

// Тест 5: Гарантований фолбек без ШІ (Pure Static Curriculum Fallback)
console.log('5. Тест статичного навчального фолбеку без ШІ...');
const fallback = getFallbackAssistance({ lessonId: 'lesson-fe-l1-canvas' });
assert.strictEqual(fallback.isAiGenerated, false);
assert(fallback.guidance.includes('AABB'));
assert(fallback.codeSnippet.includes('isColliding'));
assert(fallback.fallbackDisclaimer.includes('Human / Static Curriculum Reference'));
console.log('✅ Статичний фолбек успішно повернуто для учня');

// Тест 6: Ідемпотентний експорт історії взаємодії (JSON Data Export)
console.log('6. Тест експорту історії генерацій ШІ...');
const exportData = exportStudentAiHistory({ studentId: student1.id, actor: student1 });
assert.strictEqual(exportData.studentId, student1.id);
assert.strictEqual(exportData.totalInteractions, 1);
assert(exportData.interactions[0].promptSnippet.includes('Canvas 2D'));
console.log('✅ Історію успішно експортовано, взаємодій:', exportData.totalInteractions);

// Тест 7: Ідемпотентне видалення даних (Right to be Forgotten / Zero Orphaned Records)
console.log('7. Тест повного видалення історії взаємодій...');
const deleteRes = deleteStudentAiHistory({ studentId: student1.id, actor: student1 });
assert.strictEqual(deleteRes.success, true);
assert.strictEqual(deleteRes.purgedRecordsCount, 1);

// Перевірка, що історія тепер порожня
const exportAfterDelete = exportStudentAiHistory({ studentId: student1.id, actor: student1 });
assert.strictEqual(exportAfterDelete.totalInteractions, 0);

// Повторне видалення ідемпотентне (0 записів, без помилок)
const secondDelete = deleteStudentAiHistory({ studentId: student1.id, actor: student1 });
assert.strictEqual(secondDelete.success, true);
assert.strictEqual(secondDelete.purgedRecordsCount, 0);
console.log('✅ Ідемпотентне видалення підтверджено (Zero Orphaned Records)');

// Тест 8: Захист прав доступу (IDOR Protection)
console.log('8. Тест блокування неавторизованого доступу до чужої історії...');
assert.throws(
  () => {
    exportStudentAiHistory({ studentId: student1.id, actor: student2 });
  },
  (err) => {
    assert.strictEqual(err.code, 'UNAUTHORIZED_ACCESS');
    return true;
  }
);
console.log('✅ IDOR блокування спрацювало: чужий учень не має доступу (UNAUTHORIZED_ACCESS)');

console.log('--- 🚀 ВСІ ТЕСТИ AI TRANSPARENCY, CONSENT & DATA CONTROLS (SCRUM-104) ПРОЙДЕНО УСПІШНО! ---');
