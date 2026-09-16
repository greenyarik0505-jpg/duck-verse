import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SLO_DEFINITIONS,
  RUNBOOKS,
  generateCorrelationId,
  createStructuredLog,
  calculateErrorBudget,
  simulateControlledIncident,
  resolveIncident,
  getObservabilityState
} from '../lib/academy/observability/slo.js';

test('Observability & SLO — Target Definitions & Runbook Links', () => {
  const expectedSlos = ['availability', 'latency', 'game_fps', 'auth_security'];
  const actualSlos = Object.keys(SLO_DEFINITIONS);

  assert.deepEqual(actualSlos.sort(), expectedSlos.sort(), 'Має бути визначено всі 4 ключові SLO');

  for (const sloKey of expectedSlos) {
    const slo = SLO_DEFINITIONS[sloKey];
    assert.ok(slo.name, `SLO ${sloKey} повинен мати назву`);
    assert.ok(slo.target > 0, `SLO ${sloKey} повинен мати цільовий показник`);
    assert.ok(slo.runbookId, `SLO ${sloKey} повинен мати прив'язаний Runbook ID`);
    assert.ok(RUNBOOKS[slo.runbookId], `Runbook ${slo.runbookId} повинен існувати в реєстрі`);
    assert.ok(RUNBOOKS[slo.runbookId].steps.length >= 3, `Runbook ${slo.runbookId} повинен мати покрокові інструкції`);
  }
});

test('Observability & SLO — Structured Logger & Zero PII in Logs', () => {
  const cid = generateCorrelationId();
  assert.ok(cid.startsWith('req-'), 'Correlation ID повинен починатися з req-');

  const logEntry = createStructuredLog({
    component: 'test_component',
    action: 'USER_LOGIN_ATTEMPT',
    metadata: {
      username: 'student_yarik',
      password: 'SuperSecretPassword123!', // Chuvlyve pole!
      token: 'bearer_token_abc' // Chuvlyve pole!
    }
  });

  assert.equal(logEntry.hasPii, false);
  assert.equal(logEntry.metadata.username, 'student_yarik');
  assert.equal(logEntry.metadata.password, undefined, 'Пароль повинен бути видалений із логів');
  assert.equal(logEntry.metadata.token, undefined, 'Токен повинен бути видалений із логів');
});

test('Observability & SLO — Error Budget Calculations', () => {
  // 1. Нульові помилки
  const healthyBudget = calculateErrorBudget(10000, 0, 99.9);
  assert.equal(healthyBudget.status, 'HEALTHY');
  assert.equal(healthyBudget.budgetRemainingPercent, 100);

  // 2. Допустима кількість помилок (5 з 10 000 при допустимих 10)
  const partialBudget = calculateErrorBudget(10000, 5, 99.9);
  assert.equal(partialBudget.status, 'HEALTHY');
  assert.equal(partialBudget.budgetRemainingPercent, 50);

  // 3. Вичерпаний бюджет (15 помилок при допустимих 10)
  const exhaustedBudget = calculateErrorBudget(10000, 15, 99.9);
  assert.equal(exhaustedBudget.status, 'EXHAUSTED');
  assert.equal(exhaustedBudget.budgetRemainingPercent, 0);
});

test('Observability & SLO — Controlled Incident Simulation & Recovery', () => {
  // 1. Симуляція інциденту затримки (latency spike)
  const simResult = simulateControlledIncident('latency_spike');
  assert.equal(simResult.success, true);
  assert.equal(simResult.incident.alert.runbookId, 'RUNBOOK-02-LATENCY-SPIKE');

  const stateDuringIncident = getObservabilityState();
  assert.equal(stateDuringIncident.metrics.p95LatencyMs, 280);
  assert.ok(stateDuringIncident.activeAlerts.length >= 1);

  // 2. Відновлення нормального стану (Resolution)
  const resResult = resolveIncident();
  assert.equal(resResult.success, true);

  const stateAfterRecovery = getObservabilityState();
  assert.equal(stateAfterRecovery.metrics.p95LatencyMs, 48);
  assert.equal(stateAfterRecovery.activeAlerts.length, 0);
});
