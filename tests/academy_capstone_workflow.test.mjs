import assert from 'assert';
import {
  CAPSTONE_GATES,
  getOrCreateCapstoneProgress,
  submitCapstoneGate,
  issueGraduationCertificate,
} from '../lib/academy/capstone/workflow.js';

console.log('--- 🏆 ТЕСТУВАННЯ CAPSTONE WORKFLOW ТА GRADUATION RELEASE (SCRUM-58) ---');

// 1. Перевірка структури етапів
console.log('1. Тест структури 6 етапів Capstone...');
assert.strictEqual(CAPSTONE_GATES.length, 6, 'Capstone повинен мати рівно 6 етапів');
assert.strictEqual(CAPSTONE_GATES[0].id, 'gate_1_brief');
assert.strictEqual(CAPSTONE_GATES[5].id, 'gate_6_retrospective');
console.log('✅ Всі 6 етапів Capstone коректно визначені');

// 2. Тест блокування перестрибування етапів
console.log('2. Тест блокування перестрибування етапів...');
const studentId = 'test_student_capstone_1';
assert.throws(
  () => {
    submitCapstoneGate({
      studentId,
      gateId: 'gate_3_ci', // Спроба перескочити через крок 1 і 2
      evidence: { ci_build_passed: true, tests_passed: true },
    });
  },
  /Не можна переходити до кроку 3, доки не завершено крок 1/,
  'Перестрибування етапів має бути суворо заблоковане'
);
console.log('✅ Послідовність проходження етапів гарантована');

// 3. Тест перевірки обов'язкових свідчень
console.log('3. Тест перевірки відсутності свідчень...');
const incompleteResult = submitCapstoneGate({
  studentId,
  gateId: 'gate_1_brief',
  evidence: { brief_spec: 'docs/brief.md' }, // Відсутній adr_document
});
assert.strictEqual(incompleteResult.success, false);
assert.strictEqual(incompleteResult.error, 'MISSING_EVIDENCE');
assert.deepStrictEqual(incompleteResult.missingEvidence, ['adr_document']);
console.log('✅ Етап не зараховується без усіх обов’язкових свідчень');

// 4. Повне проходження всіх 6 етапів зі свідченнями
console.log('4. Тест послідовного завершення всіх етапів...');
// Крок 1
submitCapstoneGate({
  studentId,
  gateId: 'gate_1_brief',
  evidence: { brief_spec: 'docs/brief.md', adr_document: 'docs/adr/ADR-001.md' },
});
// Крок 2
submitCapstoneGate({
  studentId,
  gateId: 'gate_2_branch_pr',
  evidence: { jira_issue: 'SCRUM-58', github_pr: 'https://github.com/greenyarik0505-jpg/duck-verse/pull/30' },
});
// Крок 3
submitCapstoneGate({
  studentId,
  gateId: 'gate_3_ci',
  evidence: { ci_build_passed: true, tests_passed: true },
});
// Крок 4
submitCapstoneGate({
  studentId,
  gateId: 'gate_4_review',
  evidence: { mentor_approval: true, rubric_score_24_plus: true },
});
// Крок 5
submitCapstoneGate({
  studentId,
  gateId: 'gate_5_release',
  evidence: { production_url: 'https://duck-verse.vercel.app', release_notes: 'v1.0.0 released', rollback_plan: 'git revert' },
});
// Крок 6
const finalGateResult = submitCapstoneGate({
  studentId,
  gateId: 'gate_6_retrospective',
  evidence: { retro_notes: 'Retrospective completed', graduation_checklist: true },
});

assert.strictEqual(finalGateResult.success, true);
assert.strictEqual(finalGateResult.progress.completedGates.length, 6);
console.log('✅ Всі 6 етапів Capstone успішно пройдені');

// 5. Випускний сертифікат
console.log('5. Тест видачі офіційного випускного сертифіката...');
const cert = issueGraduationCertificate(studentId, 'track-frontend-gaming');
assert.ok(cert.certificateId.startsWith('DA-GRAD-'));
assert.strictEqual(cert.studentId, studentId);
assert.strictEqual(cert.totalGatesCompleted, 6);
assert.strictEqual(cert.status, 'HONOR_GRADUATE');
assert.ok(cert.verificationHash.length >= 16);
console.log('✅ Випускний сертифікат успішно згенеровано з хешем верифікації:', cert.verificationHash);

console.log('\n🎉 ВСІ АВТОМАТИЗОВАНІ ТЕСТИ CAPSTONE WORKFLOW (SCRUM-58) УСПІШНО ПРОЙДЕНО!');
