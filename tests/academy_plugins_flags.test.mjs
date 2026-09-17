import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FEATURE_FLAGS,
  PLUGIN_REGISTRY,
  MIGRATIONS_REGISTRY,
  isFeatureEnabled,
  setFeatureFlag,
  loadPluginSafely,
  runMigration,
  rollbackMigration,
  getPluginState
} from '../lib/academy/plugins/flags.js';

test('Feature Flags — Core Evaluation, Defaults & Kill Switch', () => {
  // 1. Активний прапорець (enable_academy_core)
  assert.equal(isFeatureEnabled('enable_academy_core'), true, 'Academy Core має бути ввімкнений за замовчуванням');

  // 2. Неіснуючий прапорець
  assert.equal(isFeatureEnabled('non_existing_flag_xyz'), false, 'Неіснуючий прапорець має повертати false');

  // 3. Експериментальний вимкнений прапорець
  assert.equal(isFeatureEnabled('enable_dark_launch_lab'), false, 'Dark launch lab за замовчуванням вимкнено');

  // 4. Kill Switch блокує фічу навіть якщо enabled === true
  setFeatureFlag('enable_academy_core', { killSwitchActive: true }, { role: 'admin' });
  assert.equal(isFeatureEnabled('enable_academy_core'), false, 'Kill Switch повинен миттєво вимикати фічу');

  // Відновлення
  setFeatureFlag('enable_academy_core', { killSwitchActive: false }, { role: 'admin' });
  assert.equal(isFeatureEnabled('enable_academy_core'), true, 'Після деактивації Kill Switch доступ відновлюється');
});

test('Feature Flags — Security & RBAC Guard', () => {
  // Звичайний учень (child) або гість не має права змінювати прапорці
  assert.throws(
    () => {
      setFeatureFlag('enable_academy_core', { enabled: false }, { role: 'child', username: 'student_yarik' });
    },
    /Недостатньо прав/
  );

  // Ментор або адмін мають право
  const updateResult = setFeatureFlag('enable_cyber_flap', { enabled: true }, { role: 'mentor', username: 'mentor_bob' });
  assert.equal(updateResult.success, true);
  assert.equal(updateResult.flag.updatedBy, 'mentor_bob');
});

test('Plugin Contract — Safe Sandboxing & Fault Isolation (Graceful Degradation)', () => {
  // 1. Валідний плагін (Cyber Flap Duck)
  const validLoad = loadPluginSafely('plugin-cyber-flap');
  assert.equal(validLoad.success, true);
  assert.equal(validLoad.fallbackActive, false);
  assert.equal(validLoad.initResult.status, 'READY');

  // 2. Неіснуючий плагін
  const missingLoad = loadPluginSafely('plugin-unknown-404');
  assert.equal(missingLoad.success, false);
  assert.equal(missingLoad.fallbackActive, true);

  // 3. Збійний плагін (Fault Injection) — ядро перехоплює помилку без крашу
  const faultyLoad = loadPluginSafely('plugin-faulty-demo');
  assert.equal(faultyLoad.success, false);
  assert.equal(faultyLoad.fallbackActive, true);
  assert.ok(faultyLoad.error.includes('Simulated runtime exception'), 'Помилка пісочниці перехоплюється');
  assert.ok(faultyLoad.message.includes('безпечний Fallback'), 'Активується захисний Fallback');
});

test('Zero-Downtime Migrations — Idempotence & Backward Compatible Rollback', () => {
  // 1. Перевірка списку міграцій
  assert.ok(MIGRATIONS_REGISTRY.length >= 3, 'Повинно бути щонайменше 3 зареєстровані міграції');

  // 2. Ідемпотентність: повторний запуск уже виконаної міграції 001
  const idempotentResult = runMigration('001_initial_schema');
  assert.equal(idempotentResult.success, true);
  assert.ok(idempotentResult.message.includes('Ідемпотентний пропуск'));

  // 3. Відкат міграції 003
  const rollbackResult = rollbackMigration('003_capstone_certificates');
  assert.equal(rollbackResult.success, true);
  assert.ok(rollbackResult.message.includes('успішно відкочено'));

  // 4. Повторне застосування міграції 003
  const rerunResult = runMigration('003_capstone_certificates');
  assert.equal(rerunResult.success, true);
  assert.ok(rerunResult.message.includes('успішно виконано'));

  // 5. Отримання загального стану плагінів та міграцій
  const state = getPluginState();
  assert.ok(state.flags);
  assert.ok(state.plugins.length >= 3);
  assert.equal(state.migrations.currentVersion, 3);
});
