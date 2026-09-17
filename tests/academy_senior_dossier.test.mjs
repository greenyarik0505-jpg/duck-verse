import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import {
  METRIC_DEFINITIONS,
  createDefaultSeniorDossier,
  sanitizeSeniorDossier,
  exportSeniorDossierToMarkdown,
  validateNarrative,
  validateDossierAntiToxicSafeguards,
} from '../lib/academy/portfolio/dossier.js';

test('1. Metric Definitions Schema: defines 6 core metrics with definition, source, and privacy rule', () => {
  const expectedKeys = [
    'PULL_REQUESTS',
    'CODE_REVIEWS',
    'RELEASES',
    'INCIDENTS',
    'AUTOMATED_TESTS',
    'LEARNING_MILESTONES',
  ];

  for (const key of expectedKeys) {
    const def = METRIC_DEFINITIONS[key];
    assert.ok(def, `Missing metric definition for ${key}`);
    assert.ok(def.name, `Missing name for ${key}`);
    assert.ok(def.nameUk, `Missing Ukrainian name for ${key}`);
    assert.ok(def.definition && def.definition.length > 10, `Missing definition for ${key}`);
    assert.ok(def.source && def.source.length > 3, `Missing data source for ${key}`);
    assert.ok(def.privacyRule && def.privacyRule.length > 5, `Missing privacy rule for ${key}`);
    assert.ok(def.benchmarkContext, `Missing senior benchmark context for ${key}`);
  }
});

test('2. Default Senior Dossier Generation: populates valid seed data with metrics and narratives', () => {
  const dossier = createDefaultSeniorDossier('user-yarik-lead', 'Yarik0505');
  assert.equal(dossier.userId, 'user-yarik-lead');
  assert.equal(dossier.userDisplayName, 'Yarik0505');
  assert.ok(dossier.metrics.pull_requests.count >= 20);
  assert.ok(dossier.metrics.automated_tests.count >= 100);
  assert.ok(dossier.narratives.length >= 2);
  assert.ok(dossier.verifiedEvidences.length >= 3);
});

test('3. Anti-Toxic Safeguards Validation: ensures zero peer-comparison ranking and blocks raw PII', () => {
  const cleanDossier = createDefaultSeniorDossier();
  const cleanCheck = validateDossierAntiToxicSafeguards(cleanDossier);
  assert.equal(cleanCheck.valid, true);
  assert.equal(cleanCheck.antiToxicCertified, true);
  assert.equal(cleanCheck.violations.length, 0);

  // Toxic comparison insertion
  const toxicDossier = {
    ...cleanDossier,
    summary: 'Rank #1 in cohort, faster than 90% of students',
  };
  const toxicCheck = validateDossierAntiToxicSafeguards(toxicDossier);
  assert.equal(toxicCheck.valid, false);
  assert.ok(toxicCheck.violations.some((v) => v.includes('rank #') || v.includes('faster than 90%')));

  // Raw PII insertion
  const piiDossier = {
    ...cleanDossier,
    userEmail: 'real_student@personal_domain.com',
  };
  const piiCheck = validateDossierAntiToxicSafeguards(piiDossier);
  assert.equal(piiCheck.valid, false);
  assert.ok(piiCheck.violations.some((v) => v.includes('Raw email')));
});

test('4. STAR Narrative Validation: validates problem, solution, result, and lessons learned', () => {
  const validEntry = {
    title: 'Zero-Defect Release Pipeline',
    category: 'architecture',
    problem: 'Manual deployments led to intermittent hydration warnings and human oversight.',
    solution: 'Engineered an automated release checklist and CDP smoke runner before production release.',
    result: 'Zero production defects across 18 consecutive releases.',
    lessonLearned: 'Automated verification eliminates cognitive fatigue in release engineering.',
  };
  const validCheck = validateNarrative(validEntry);
  assert.equal(validCheck.valid, true);
  assert.equal(validCheck.errors.length, 0);

  // Incomplete entry
  const invalidEntry = {
    title: 'Fix',
    category: 'testing',
    problem: 'Short',
    solution: '',
    result: '',
    lessonLearned: 'N/A',
  };
  const invalidCheck = validateNarrative(invalidEntry);
  assert.equal(invalidCheck.valid, false);
  assert.ok(invalidCheck.errors.length >= 3);
});

test('5. Sanitized Dossier Transformation: respects metric visibility and masks sensitive metadata', () => {
  const dossier = createDefaultSeniorDossier('usr-test', 'Student Leader');
  // Toggle one metric to invisible
  dossier.metrics.incidents.visible = false;

  const sanitized = sanitizeSeniorDossier(dossier, {
    maskedAuthorName: true,
  });

  assert.equal(sanitized.author, 'DuckVerse Certified Senior Learner');
  assert.equal(sanitized.antiToxicCertified, true);
  assert.ok(sanitized.metrics.pull_requests);
  assert.equal(sanitized.metrics.incidents, undefined, 'Hidden metric must be omitted from sanitized export');
  assert.ok(sanitized.metrics.automated_tests);
});

test('6. Markdown Export Formatting: renders structured tables, narratives, and certification headers', () => {
  const dossier = createDefaultSeniorDossier();
  const sanitized = sanitizeSeniorDossier(dossier);
  const markdown = exportSeniorDossierToMarkdown(sanitized);

  assert.ok(markdown.includes('# 🎓 Senior Engineering Portfolio'));
  assert.ok(markdown.includes('DuckVerse Anti-Toxic & Evidence-Based Portfolio Certified ✅'));
  assert.ok(markdown.includes('| Метрика | Показник |'));
  assert.ok(markdown.includes('Злиті Pull Requests'));
  assert.ok(markdown.includes('STAR Narrative'));
  assert.ok(markdown.includes('🚨 Проблема:'));
  assert.ok(markdown.includes('💡 Технічне рішення:'));
  assert.ok(markdown.includes('📈 Досягнутий результат:'));
  assert.ok(markdown.includes('🧠 Винесений урок (Lesson Learned):'));
  assert.ok(markdown.includes('Жодних токсичних рейтингів та порівнянь.'));
});

test('7. Evidence Tracing and Verification: links concrete artifacts and references', () => {
  const dossier = createDefaultSeniorDossier();
  assert.ok(dossier.verifiedEvidences.length >= 3);
  const prEvidence = dossier.verifiedEvidences.find((e) => e.type === 'PR');
  assert.ok(prEvidence);
  assert.ok(prEvidence.reference.includes('PR #'));
  assert.ok(prEvidence.link);

  const releaseEvidence = dossier.verifiedEvidences.find((e) => e.type === 'RELEASE');
  assert.ok(releaseEvidence);
  assert.ok(releaseEvidence.title);
});

test('8. Senior Dossier API Route and UI Component: files exist and export expected endpoints', () => {
  const apiRoutePath = path.resolve('app/api/academy/senior-dossier/route.js');
  const componentPath = path.resolve('components/academy/SeniorPortfolioDossierView.jsx');

  assert.ok(fs.existsSync(apiRoutePath), 'API route file must exist');
  assert.ok(fs.existsSync(componentPath), 'UI component file must exist');

  const apiContent = fs.readFileSync(apiRoutePath, 'utf8');
  assert.ok(apiContent.includes('export async function GET'));
  assert.ok(apiContent.includes('export async function POST'));
  assert.ok(apiContent.includes('add_narrative'));
  assert.ok(apiContent.includes('export_markdown'));
});
