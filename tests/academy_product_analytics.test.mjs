import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EVENT_TAXONOMY,
  detectPiiInPayload,
  generateIdempotencyKey,
  ingestAnalyticsEvent,
  calculateLearningKpis,
  getPlatformHealthMetrics,
  DATA_DRIVEN_DECISION_CASES,
  getDataQualityChecklist,
  getProductAnalyticsSnapshot,
  __resetAnalyticsEngineForTests,
} from '../lib/academy/analytics/taxonomy.js';

test.beforeEach(() => {
  __resetAnalyticsEngineForTests();
});

test('1. Event Taxonomy: validates schema conformance and rejects unknown events', () => {
  // Valid event
  const validEvent = {
    event_name: 'lesson.started',
    payload: {
      student_hash_id: 'std_test_001',
      track_id: 'track-frontend-gaming',
      lesson_id: 'lesson-fe-l0-arch',
      started_at: new Date().toISOString(),
    },
  };
  const result = ingestAnalyticsEvent(validEvent);
  assert.equal(result.accepted, true);
  assert.equal(result.event.event_name, 'lesson.started');

  // Unknown event name
  assert.throws(() => {
    ingestAnalyticsEvent({
      event_name: 'unknown.hacker.click',
      payload: { student_hash_id: '123' },
    });
  }, /Невідома назва події/);

  // Missing required field
  assert.throws(() => {
    ingestAnalyticsEvent({
      event_name: 'lesson.completed',
      payload: {
        student_hash_id: 'std_test_001',
        track_id: 'track-frontend-gaming',
        // missing lesson_id, duration_seconds, score
      },
    });
  }, /відсутнє обов'язкове поле "lesson_id"/);

  // Wrong data type (duration_seconds must be number)
  assert.throws(() => {
    ingestAnalyticsEvent({
      event_name: 'lesson.completed',
      payload: {
        student_hash_id: 'std_test_001',
        track_id: 'track-frontend-gaming',
        lesson_id: 'lesson-fe-l0-arch',
        duration_seconds: 'not_a_number',
        score: 100,
      },
    });
  }, /Невірний тип поля "duration_seconds"/);
});

test('2. Privacy Guard: PII Shield blocks emails, phone numbers, and secrets in payload', () => {
  // Clean payload
  const clean = detectPiiInPayload({ student_hash_id: 'std_safe_01', score: 95 });
  assert.equal(clean.detected, false);

  // Payload with email
  const emailPayload = {
    student_hash_id: 'std_leak_01',
    track_id: 'track-frontend-gaming',
    lesson_id: 'lesson-fe-l0-arch',
    student_email: 'student_private@gmail.com',
  };
  assert.equal(detectPiiInPayload(emailPayload).detected, true);
  assert.throws(() => {
    ingestAnalyticsEvent({ event_name: 'lesson.started', payload: emailPayload });
  }, /Заблоковано PII Shield: виявлено конфіденційні дані типу "Email Address"/);

  // Payload with API secret / password
  const secretPayload = {
    student_hash_id: 'std_leak_02',
    track_id: 'track-frontend-gaming',
    lesson_id: 'lesson-fe-l0-arch',
    notes: 'Bearer secret_token_12345',
  };
  assert.equal(detectPiiInPayload(secretPayload).detected, true);
  assert.throws(() => {
    ingestAnalyticsEvent({ event_name: 'lesson.started', payload: secretPayload });
  }, /Заблоковано PII Shield/);
});

test('3. Deduplication Guard: rejects duplicate events with identical idempotency keys', () => {
  const event = {
    event_name: 'quiz.submitted',
    payload: {
      student_hash_id: 'std_dup_01',
      lesson_id: 'lesson-fe-l0-arch',
      score_percent: 85,
      passed: true,
    },
  };

  // First ingestion succeeds
  const first = ingestAnalyticsEvent(event);
  assert.equal(first.accepted, true);

  // Second immediate ingestion with same idempotency key is deduplicated
  const second = ingestAnalyticsEvent({ ...event, idempotency_key: first.event.idempotency_key });
  assert.equal(second.accepted, false);
  assert.equal(second.deduplicated, true);
});

test('4. Learning KPIs: calculates lesson completion rate accurately', () => {
  const kpis = calculateLearningKpis();
  assert.ok(kpis.lessonCompletionRate);
  assert.equal(typeof kpis.lessonCompletionRate.value, 'number');
  assert.ok(kpis.lessonCompletionRate.value >= 70.0);
  assert.equal(kpis.lessonCompletionRate.status, 'HEALTHY');
});

test('5. Learning KPIs: calculates PR completion rate and median review turnaround', () => {
  const kpis = calculateLearningKpis();
  assert.ok(kpis.prCompletionRate);
  assert.equal(typeof kpis.prCompletionRate.value, 'number');
  assert.ok(kpis.prCompletionRate.value >= 80.0);

  assert.ok(kpis.reviewTurnaroundHours);
  assert.equal(typeof kpis.reviewTurnaroundHours.value, 'number');
  assert.ok(kpis.reviewTurnaroundHours.value > 0);
  assert.ok(kpis.reviewTurnaroundHours.value <= 4.0);
});

test('6. Learning KPIs: calculates D7 and D30 retention rates', () => {
  const kpis = calculateLearningKpis();
  assert.ok(kpis.retentionD7);
  assert.ok(kpis.retentionD7.value >= 70.0);

  assert.ok(kpis.retentionD30);
  assert.ok(kpis.retentionD30.value >= 50.0);
});

test('7. Architectural Separation: Product Learning KPIs vs Platform Health Metrics', () => {
  const kpis = calculateLearningKpis();
  const health = getPlatformHealthMetrics();

  // Product KPIs are focused on student learning outcomes
  assert.ok(kpis.lessonCompletionRate);
  assert.ok(kpis.prCompletionRate);
  assert.ok(kpis.reviewTurnaroundHours);

  // Platform Health is focused on infrastructure SLA
  assert.ok(health.apiErrorRate);
  assert.ok(health.p95LatencyMs);
  assert.ok(health.pipelineFreshnessSec);
  assert.ok(health.validationSuccessRate);
  assert.equal(health.apiErrorRate.unit, '%');
  assert.equal(health.p95LatencyMs.unit, 'мс');
});

test('8. Decision Playbook and Data Quality Checklist validation', () => {
  assert.ok(DATA_DRIVEN_DECISION_CASES.length >= 2);
  const case1 = DATA_DRIVEN_DECISION_CASES[0];
  assert.equal(case1.id, 'DEC-2026-01');
  assert.ok(case1.anomalyDetected.includes('Completion Rate'));
  assert.ok(case1.decisionTaken);
  assert.ok(case1.measuredOutcome);

  const checklist = getDataQualityChecklist();
  assert.equal(checklist.length, 5);
  for (const check of checklist) {
    assert.equal(check.pass, true);
    assert.ok(check.score);
  }

  const snapshot = getProductAnalyticsSnapshot();
  assert.ok(snapshot.taxonomy.length >= 7);
  assert.ok(snapshot.recentEvents.length > 0);
});
