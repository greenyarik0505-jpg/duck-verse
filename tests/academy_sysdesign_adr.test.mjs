import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DOMAIN_BOUNDARIES,
  ADR_REGISTRY,
  validateAdrStructure,
  runArchitectureReviewCheckpoint
} from '../lib/academy/sysdesign/adr.js';

test('System Design — Domain Boundaries Structure', () => {
  const expectedDomains = ['hub', 'games', 'academy', 'auth', 'data', 'integrations'];
  const actualDomains = Object.keys(DOMAIN_BOUNDARIES);

  assert.deepEqual(actualDomains.sort(), expectedDomains.sort(), 'Усі 6 доменів повинні бути визначені');

  for (const [domainKey, domain] of Object.entries(DOMAIN_BOUNDARIES)) {
    assert.equal(domain.id, domainKey, `Domain ID ${domainKey} повинен співпадати`);
    assert.ok(domain.name, `Domain ${domainKey} повинен мати назву`);
    assert.ok(domain.description, `Domain ${domainKey} повинен мати опис`);
    assert.ok(Array.isArray(domain.responsibilities) && domain.responsibilities.length > 0, `Domain ${domainKey} повинен мати список обов'язків`);
    assert.ok(Array.isArray(domain.allowedIncoming), `Domain ${domainKey} повинен мати allowedIncoming`);
    assert.ok(Array.isArray(domain.allowedOutgoing), `Domain ${domainKey} повинен мати allowedOutgoing`);
  }
});

test('System Design — ADR Registry Validation', () => {
  assert.ok(ADR_REGISTRY.length >= 2, 'Має бути щонайменше 2 зареєстрованих ADR');

  for (const adr of ADR_REGISTRY) {
    const valResult = validateAdrStructure(adr);
    assert.equal(valResult.valid, true, `ADR ${adr.id} має бути валідним: ${valResult.errors.join(', ')}`);
    assert.ok(adr.filePath, `ADR ${adr.id} повинен мати шлях до файлу`);
    assert.ok(adr.domains.length > 0, `ADR ${adr.id} повинен мати хоча б один домен`);
    assert.ok(adr.rejectedOptions.length > 0, `ADR ${adr.id} повинен мати відхилені варіанти`);
    assert.ok(adr.rollbackPlan, `ADR ${adr.id} повинен мати план відкату`);
  }
});

test('System Design — validateAdrStructure rejects incomplete ADR', () => {
  const badAdr = {
    id: 'INVALID',
    title: 'Short',
    status: 'UnknownStatus',
    owner: '',
    jiraKey: 'INVALID-KEY',
    domains: [],
    rejectedOptions: [],
    rollbackPlan: ''
  };

  const valResult = validateAdrStructure(badAdr);
  assert.equal(valResult.valid, false, 'Неповний ADR не повинен бути валідним');
  assert.ok(valResult.errors.length >= 5, 'Повинно повернутися декілька помилок валідації');
});

test('System Design — Architecture Review Checkpoint Approval', () => {
  const goodProposal = {
    jiraKey: 'SCRUM-66',
    domains: ['academy', 'hub'],
    securityImpact: 'Реалізовано RBAC перевірку сесії та валідацію вхідних даних',
    performanceImpact: 'SLA відповіді API < 50ms, відсутність впливу на 60 FPS ігрового циклу',
    rejectedAlternatives: 'Відхилено монолітну архітектуру SPA через блокування головного потоку Canvas',
    rollbackStrategy: 'Feature flag вимкнення та миттєвий Vercel rollback до попереднього деплою'
  };

  const checkpoint = runArchitectureReviewCheckpoint(goodProposal);
  assert.equal(checkpoint.approved, true, 'Валідна пропозиція має бути схвалена');
  assert.equal(checkpoint.score, 100, 'Всі 6 критеріїв мають дати 100 балів');
  assert.equal(checkpoint.checks.length, 6, 'Має бути рівно 6 перевірок якості');
  assert.equal(checkpoint.recommendations.length, 0, 'Не повинно бути рекомендацій при 100 балах');
});

test('System Design — Architecture Review Checkpoint Rejection with Recommendations', () => {
  const incompleteProposal = {
    jiraKey: 'SCRUM-999',
    domains: ['non_existent_domain'],
    securityImpact: '', // Missing
    performanceImpact: '', // Missing
    rejectedAlternatives: '', // Missing
    rollbackStrategy: '' // Missing
  };

  const checkpoint = runArchitectureReviewCheckpoint(incompleteProposal);
  assert.equal(checkpoint.approved, false, 'Неповна пропозиція повинна бути відхилена');
  assert.ok(checkpoint.score < 80, 'Бал має бути нижче порогу 80');
  assert.ok(checkpoint.recommendations.length >= 4, 'Має бути щонайменше 4 рекомендації для виправлення');
  assert.match(checkpoint.verdict, /ПОТРЕБУЄ ДООПРАЦЮВАННЯ/);
});
