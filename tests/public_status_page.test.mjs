import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_COMPONENTS,
  sanitizePublicText,
  createIncident,
  updateIncidentStatus,
  resolveIncident,
  setComponentStatus,
  calculateOverallSystemStatus,
  getStatusPageSnapshot,
  __resetStatusEngineForTests,
} from '../lib/status/engine.js';

test.beforeEach(() => {
  __resetStatusEngineForTests();
});

test('1. Core Components: 5 mandatory components exist and initialize as operational', () => {
  const snapshot = getStatusPageSnapshot();
  const componentIds = snapshot.components.map((c) => c.id);

  assert.ok(componentIds.includes('hub'));
  assert.ok(componentIds.includes('games'));
  assert.ok(componentIds.includes('auth'));
  assert.ok(componentIds.includes('scores'));
  assert.ok(componentIds.includes('learning'));

  for (const comp of snapshot.components) {
    assert.equal(comp.status, 'operational');
  }

  const overall = calculateOverallSystemStatus();
  assert.equal(overall.code, 'ALL_SYSTEMS_OPERATIONAL');
});

test('2. Incident Reporting: creates incident with required start time, impact summary and next update', () => {
  const incident = createIncident({
    title: 'Уповільнення синхронізації рекордів',
    severity: 'MINOR',
    impactSummary: 'Рекорди можуть з\'являтися в лідерборді із затримкою до 5 хвилин.',
    affectedComponents: ['scores'],
    nextUpdateDue: 'протягом 20 хвилин',
    initialMessage: 'Досліджуємо сплеск навантаження на базу даних.',
  });

  assert.ok(incident.id.startsWith('INC-'));
  assert.equal(incident.status, 'investigating');
  assert.ok(incident.startedAt);
  assert.equal(incident.impactSummary, 'Рекорди можуть з\'являтися в лідерборді із затримкою до 5 хвилин.');
  assert.equal(incident.nextUpdateDue, 'протягом 20 хвилин');
  assert.equal(incident.updates.length, 1);

  // Affected component status should change to degraded
  const snapshot = getStatusPageSnapshot();
  const scoresComp = snapshot.components.find((c) => c.id === 'scores');
  assert.equal(scoresComp.status, 'degraded');

  // Overall system status should now be PARTIAL_DEGRADATION
  assert.equal(snapshot.overall.code, 'PARTIAL_DEGRADATION');
});

test('3. Privacy & Security Shield: sanitizes emails, secrets, and internal IPs from public updates', () => {
  const dirtyText = 'Помилка на сервері 192.168.1.55 для юзера admin@duck.local з ключем token: super_secret_123';
  const { sanitized, hasLeaks, detectedLeaks } = sanitizePublicText(dirtyText);

  assert.equal(hasLeaks, true);
  assert.ok(detectedLeaks.includes('Email Address'));
  assert.ok(detectedLeaks.includes('Internal IP Address'));
  assert.ok(detectedLeaks.includes('Password / API Secret'));

  assert.ok(!sanitized.includes('admin@duck.local'));
  assert.ok(!sanitized.includes('192.168.1.55'));
  assert.ok(!sanitized.includes('super_secret_123'));
  assert.ok(sanitized.includes('[REDACTED EMAIL]'));
  assert.ok(sanitized.includes('[INTERNAL ADDR]'));

  // When creating an incident with sensitive data, it must be automatically sanitized
  const inc = createIncident({
    title: 'Проблема на 10.0.0.12',
    impactSummary: 'Зв\'яжіться з support@duckverse.com',
  });
  assert.ok(!inc.title.includes('10.0.0.12'));
  assert.ok(!inc.impactSummary.includes('support@duckverse.com'));
});

test('4. Incident Lifecycle: progresses through investigating -> identified -> monitoring -> resolved', () => {
  const inc = createIncident({
    title: 'Уповільнення Canvas 2D рушія',
    severity: 'MAJOR',
    impactSummary: 'Ігри можуть працювати при зниженому FPS.',
    affectedComponents: ['games'],
  });

  assert.equal(inc.status, 'investigating');

  // Step 2: Identified
  const step2 = updateIncidentStatus(inc.id, {
    status: 'identified',
    message: 'Виявлено надмірне навантаження на WebGL контекст. Готуємо патч оптимізації.',
    nextUpdateDue: 'протягом 15 хвилин',
  });
  assert.equal(step2.status, 'identified');
  assert.equal(step2.updates.length, 2);

  // Step 3: Monitoring
  const step3 = updateIncidentStatus(inc.id, {
    status: 'monitoring',
    message: 'Патч розгорнуто. Проводимо перевірку стабільності FPS.',
    nextUpdateDue: 'протягом 10 хвилин',
  });
  assert.equal(step3.status, 'monitoring');

  // Step 4: Resolved
  const resolved = resolveIncident(inc.id, {
    resolutionMessage: 'Оптимізацію підтверджено, стабільні 60 FPS відновлено.',
    rootCause: 'Витік пам\'яті при перемиканні шейдерів.',
    correctiveActions: 'Додано обов\'язкове очищення текстур при зміні скінів.',
  });
  assert.equal(resolved.status, 'resolved');
  assert.ok(resolved.resolvedAt);
  assert.equal(resolved.postMortem.downtimeMinutes >= 0, true);
  assert.ok(resolved.postIncidentUrl);

  // Games component should return to operational
  const snapshot = getStatusPageSnapshot();
  const gamesComp = snapshot.components.find((c) => c.id === 'games');
  assert.equal(gamesComp.status, 'operational');
});

test('5. Resolved Incident Archive: moved to archive with valid post-incident link', () => {
  const inc = createIncident({
    title: 'Короткочасний збій авторизації',
    severity: 'CRITICAL',
    impactSummary: 'Неможливо було зайти в систему.',
    affectedComponents: ['auth'],
  });

  resolveIncident(inc.id, {
    resolutionMessage: 'Сесії відновлено.',
    rootCause: 'Таймаут Redis кешу.',
    correctiveActions: 'Налаштовано автоматичний фейловер.',
  });

  const snapshot = getStatusPageSnapshot();
  assert.equal(snapshot.activeIncidents.length, 0);
  assert.ok(snapshot.resolvedIncidents.some((r) => r.id === inc.id));
  const archived = snapshot.resolvedIncidents.find((r) => r.id === inc.id);
  assert.equal(archived.postIncidentUrl, `/status/incidents/${inc.id}`);
  assert.equal(archived.postMortem.rootCause, 'Таймаут Redis кешу.');
});

test('6. Aggregated Status Logic: accurately reflects system state based on component degradation', () => {
  // 1. All Operational
  assert.equal(calculateOverallSystemStatus().code, 'ALL_SYSTEMS_OPERATIONAL');

  // 2. Set one degraded
  setComponentStatus('scores', 'degraded');
  assert.equal(calculateOverallSystemStatus().code, 'PARTIAL_DEGRADATION');

  // 3. Set one outage
  setComponentStatus('hub', 'outage');
  assert.equal(calculateOverallSystemStatus().code, 'MAJOR_OUTAGE');

  // 4. Set maintenance
  setComponentStatus('hub', 'operational');
  setComponentStatus('scores', 'maintenance');
  assert.equal(calculateOverallSystemStatus().code, 'UNDER_MAINTENANCE');
});

test('7. Validation: Rejects invalid component status or missing incident payload', () => {
  assert.throws(() => {
    setComponentStatus('hub', 'invalid_status_xyz');
  }, /Неприпустимий статус/);

  assert.throws(() => {
    setComponentStatus('non_existing_comp', 'operational');
  }, /не існує/);

  assert.throws(() => {
    createIncident({ title: '' });
  }, /Обов'язково вкажіть заголовок/);
});

test('8. Snapshot Completeness: returns uptime, components, incidents, and timestamp', () => {
  const snapshot = getStatusPageSnapshot();
  assert.ok(snapshot.overall);
  assert.equal(snapshot.components.length, 5);
  assert.ok(snapshot.uptime90Days);
  assert.ok(snapshot.lastCheckedAt);
  assert.ok(Array.isArray(snapshot.activeIncidents));
  assert.ok(Array.isArray(snapshot.resolvedIncidents));
});
