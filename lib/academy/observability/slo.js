/**
 * Duck Verse Academy — Observability Architecture, Metrics & SLO Dashboard (L7: SCRUM-72)
 * Структуроване логування, наскрізні correlation IDs, розрахунок Error Budgets та правила алертингу з Runbooks.
 */

export const SLO_DEFINITIONS = {
  availability: {
    id: 'availability',
    name: 'Доступність API (Availability)',
    sliMetric: 'Успішні відповіді HTTP 2xx/3xx без 5xx помилок',
    target: 99.9,
    unit: '%',
    currentSli: 99.95,
    errorBudgetTotalPercent: 0.1,
    runbookId: 'RUNBOOK-01-API-OUTAGE',
    severity: 'critical',
    owner: 'Platform Team (Yarik0505)'
  },
  latency: {
    id: 'latency',
    name: 'Латентність запитів (p95 Latency)',
    sliMetric: '95-й перцентиль часу обробки Route Handlers',
    target: 150,
    unit: 'ms',
    currentSli: 48,
    errorBudgetTotalPercent: 5.0,
    runbookId: 'RUNBOOK-02-LATENCY-SPIKE',
    severity: 'warning',
    owner: 'Backend / API Team'
  },
  game_fps: {
    id: 'game_fps',
    name: 'Кадрова частота рушія (Canvas 60 FPS)',
    sliMetric: 'Частка ігрових кадрів із частотою >= 55 FPS',
    target: 99.0,
    unit: '%',
    currentSli: 99.8,
    errorBudgetTotalPercent: 1.0,
    runbookId: 'RUNBOOK-03-CANVAS-FPS-DROP',
    severity: 'warning',
    owner: 'Game Dev Team'
  },
  auth_security: {
    id: 'auth_security',
    name: 'Безпека автентифікації (Zero IDOR / Escalation)',
    sliMetric: 'Успішно заблоковані несанкціоновані спроби доступу',
    target: 100.0,
    unit: '%',
    currentSli: 100.0,
    errorBudgetTotalPercent: 0.0,
    runbookId: 'RUNBOOK-04-SECURITY-BREACH',
    severity: 'critical',
    owner: 'Security / Compliance'
  }
};

export const RUNBOOKS = {
  'RUNBOOK-01-API-OUTAGE': {
    id: 'RUNBOOK-01-API-OUTAGE',
    title: 'Дії при масовому збої API (HTTP 5xx Outage)',
    severity: 'CRITICAL',
    steps: [
      '1. Перевірити Vercel Deployment Dashboard на наявність Crash Loops.',
      '2. Перевірити логи на необроблені винятки (Unhandled Exceptions).',
      '3. Якщо збій пов’язаний із останнім релізом — виконати Instant Rollback.',
      '4. Оповістити команду в Jira SCRUM та створити Post-Mortem тікет.'
    ]
  },
  'RUNBOOK-02-LATENCY-SPIKE': {
    id: 'RUNBOOK-02-LATENCY-SPIKE',
    title: 'Дії при сплеску затримки відповідей (Latency Spike > 150ms)',
    severity: 'WARNING',
    steps: [
      '1. Визначити маршрут-джерело затримки за correlationId.',
      '2. Перевірити розміри payload та час cold-start безсерверних функцій.',
      '3. Оптимізувати звернення до кешу в пам’яті (TTL 60s).'
    ]
  },
  'RUNBOOK-03-CANVAS-FPS-DROP': {
    id: 'RUNBOOK-03-CANVAS-FPS-DROP',
    title: 'Дії при падінні частоти кадрів гри нижче 55 FPS',
    severity: 'WARNING',
    steps: [
      '1. Перевірити, чи не відбувається мутація React DOM у головному циклі requestAnimationFrame.',
      '2. Перевірити аллокацію об’єктів у циклі гри (Garbage Collection pauses).',
      '3. Переконатися у відсутності innerHTML очисток.'
    ]
  },
  'RUNBOOK-04-SECURITY-BREACH': {
    id: 'RUNBOOK-04-SECURITY-BREACH',
    title: 'Дії при спробі IDOR або ескалації привілеїв',
    severity: 'CRITICAL',
    steps: [
      '1. Негайно перевірити IP та correlationId зловмисника в аудиті.',
      '2. Анулювати активні сесії підозрілого облікового запису.',
      '3. Провести ротацію секрету підпису HMAC_SECRET.',
      '4. Зафіксувати інцидент у Security Ledger.'
    ]
  }
};

// Стан поточних метрик та інцидентів
let liveState = {
  totalRequests: 12540,
  failedRequests: 6,
  averageLatencyMs: 42,
  p95LatencyMs: 48,
  activeAlerts: [],
  simulatedIncident: null,
  recentLogs: []
};

/**
 * Генерує наскрізний correlation ID
 */
export function generateCorrelationId() {
  const hex = Math.random().toString(16).substring(2, 10);
  return `req-${Date.now().toString(36)}-${hex}`;
}

/**
 * Створює структурований лог без витоку персональних даних
 */
export function createStructuredLog(payload = {}) {
  const correlationId = payload.correlationId || generateCorrelationId();
  const timestamp = new Date().toISOString();

  // Захист від PII: санітизація чутливих даних
  const sanitizedMeta = { ...(payload.metadata || {}) };
  delete sanitizedMeta.password;
  delete sanitizedMeta.token;
  delete sanitizedMeta.secret;
  delete sanitizedMeta.cookie;

  const logEntry = {
    timestamp,
    correlationId,
    releaseVersion: payload.releaseVersion || 'v1.7.0',
    component: payload.component || 'academy_engine',
    level: payload.level || 'INFO',
    action: payload.action || 'REQUEST_PROCESSED',
    durationMs: payload.durationMs || 0,
    status: payload.status || 200,
    hasPii: false,
    metadata: sanitizedMeta
  };

  liveState.recentLogs.unshift(logEntry);
  if (liveState.recentLogs.length > 20) {
    liveState.recentLogs.pop();
  }

  return logEntry;
}

/**
 * Розраховує залишок бюджету помилок (Error Budget)
 */
export function calculateErrorBudget(total, failed, targetSloPercent = 99.9) {
  if (!total || total === 0) {
    return {
      allowedFailureRate: 100 - targetSloPercent,
      actualFailureRate: 0,
      budgetRemainingPercent: 100,
      burnRate: 0,
      status: 'HEALTHY'
    };
  }

  const actualFailureRate = (failed / total) * 100;
  const allowedFailureRate = 100 - targetSloPercent;
  const budgetConsumedPercent = (actualFailureRate / allowedFailureRate) * 100;
  const budgetRemainingPercent = Math.max(0, Math.min(100, 100 - budgetConsumedPercent));

  let status = 'HEALTHY';
  if (budgetRemainingPercent <= 0) {
    status = 'EXHAUSTED';
  } else if (budgetRemainingPercent < 40) {
    status = 'DEGRADED';
  }

  return {
    allowedFailureRate: Number(allowedFailureRate.toFixed(3)),
    actualFailureRate: Number(actualFailureRate.toFixed(3)),
    budgetRemainingPercent: Number(budgetRemainingPercent.toFixed(1)),
    burnRate: Number((budgetConsumedPercent / 100).toFixed(2)),
    status
  };
}

/**
 * Симулятор контрольованого інциденту (Preview demo з контрольованою помилкою)
 */
export function simulateControlledIncident(type = 'latency_spike') {
  const correlationId = generateCorrelationId();

  if (type === 'latency_spike') {
    liveState.p95LatencyMs = 280; // Перевищення порогу 150ms!
    const alert = {
      id: `alert-${Date.now()}`,
      sloId: 'latency',
      title: 'SLO Violation: p95 Latency 280ms > 150ms Target',
      severity: 'WARNING',
      triggeredAt: new Date().toISOString(),
      correlationId,
      runbookId: 'RUNBOOK-02-LATENCY-SPIKE',
      resolved: false
    };
    liveState.activeAlerts.push(alert);
    liveState.simulatedIncident = {
      type,
      correlationId,
      alert,
      description: 'Контрольована симуляція: ін’єкція штучної затримки обробки запитів'
    };

    createStructuredLog({
      correlationId,
      component: 'api_route_handler',
      level: 'WARN',
      action: 'LATENCY_SPIKE_DETECTED',
      durationMs: 280,
      status: 200
    });
  } else if (type === 'error_burst') {
    liveState.failedRequests += 25; // Сплеск 5xx помилок
    const alert = {
      id: `alert-${Date.now()}`,
      sloId: 'availability',
      title: 'SLO Violation: Availability dropped below 99.9%',
      severity: 'CRITICAL',
      triggeredAt: new Date().toISOString(),
      correlationId,
      runbookId: 'RUNBOOK-01-API-OUTAGE',
      resolved: false
    };
    liveState.activeAlerts.push(alert);
    liveState.simulatedIncident = {
      type,
      correlationId,
      alert,
      description: 'Контрольована симуляція: сплеск HTTP 500 відповідей'
    };

    createStructuredLog({
      correlationId,
      component: 'api_gateway',
      level: 'ERROR',
      action: 'SERVER_ERROR_BURST',
      durationMs: 15,
      status: 500
    });
  }

  return {
    success: true,
    incident: liveState.simulatedIncident
  };
}

/**
 * Очищення симуляції / відновлення нормального стану
 */
export function resolveIncident() {
  liveState.p95LatencyMs = 48;
  liveState.activeAlerts = [];
  liveState.simulatedIncident = null;

  createStructuredLog({
    action: 'INCIDENT_RESOLVED',
    level: 'INFO',
    metadata: { note: 'All SLOs returned to nominal operating limits' }
  });

  return {
    success: true,
    message: 'Інцидент успішно усунено, всі метрики повернено до норми'
  };
}

/**
 * Отримання поточного стану SLO та метрик
 */
export function getObservabilityState() {
  const errorBudget = calculateErrorBudget(liveState.totalRequests, liveState.failedRequests, 99.9);

  return {
    slos: SLO_DEFINITIONS,
    runbooks: RUNBOOKS,
    metrics: {
      totalRequests: liveState.totalRequests,
      failedRequests: liveState.failedRequests,
      p95LatencyMs: liveState.p95LatencyMs,
      errorBudget
    },
    activeAlerts: liveState.activeAlerts,
    simulatedIncident: liveState.simulatedIncident,
    recentLogs: liveState.recentLogs.slice(0, 5),
    updatedAt: new Date().toISOString()
  };
}
