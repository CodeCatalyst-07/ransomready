import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { calculateScores } from '../src/utils/scoring.js';
import { getLevelForPercent } from '../src/config/maturityLevels.js';
import { answerOptions } from '../src/config/answerOptions.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const domains = JSON.parse(fs.readFileSync(path.join(root, 'src/data/domains.json'), 'utf8'));
const questions = JSON.parse(fs.readFileSync(path.join(root, 'src/data/questions.json'), 'utf8'));
const allAnswers = (answer) => Object.fromEntries(questions.map((q) => [q.id, answer]));
const score = (answers) => calculateScores({ answers, domains, questions, answerOptions });
const totalWeight = questions.reduce((sum, q) => sum + q.weight, 0);
const criticalQuestions = questions.filter((q) => q.weight === 3);
const tests = [];
const test = (name, run) => tests.push({ name, run });

test('all yes: 100%, Level 5, no cap or recommendations', () => {
  const result = score(allAnswers('yes'));
  assert.equal(result.overall.percent, 100);
  assert.equal(result.overall.level.level, 5);
  assert.equal(result.overall.capped, false);
  assert.equal(result.recommendations.length, 0);
  assert.equal(result.stats.yes, 32);
});

test('all no: 0%, Level 1, 32 recommendations, eight zero domains', () => {
  const result = score(allAnswers('no'));
  assert.equal(result.overall.percent, 0);
  assert.equal(result.overall.level.level, 1);
  assert.equal(result.recommendations.length, 32);
  assert.equal(result.domains.length, 8);
  assert.ok(result.domains.every((domain) => domain.percent === 0));
  assert.equal(result.stats.criticalGaps, criticalQuestions.length);
});

test('all unsure matches all no percents and recommendation count', () => {
  const no = score(allAnswers('no'));
  const unsure = score(allAnswers('unsure'));
  assert.equal(unsure.overall.percent, no.overall.percent);
  assert.deepEqual(unsure.domains.map((d) => d.percent), no.domains.map((d) => d.percent));
  assert.equal(unsure.recommendations.length, no.recommendations.length);
  assert.equal(unsure.stats.unsure, 32);
});

test('all partial: 50%, Level 3, no critical gaps', () => {
  const result = score(allAnswers('partial'));
  assert.equal(result.overall.percent, 50);
  assert.equal(result.overall.level.level, 3);
  assert.equal(result.stats.criticalGaps, 0);
});

test('weighted maths: only weight-3 questions answered yes', () => {
  const answers = Object.fromEntries(questions.map((q) => [q.id, q.weight === 3 ? 'yes' : 'no']));
  const earned = criticalQuestions.reduce((sum, q) => sum + q.weight, 0);
  const expected = Math.round(earned / totalWeight * 1000) / 10;
  const result = score(answers);
  assert.equal(result.overall.points, earned);
  assert.equal(result.overall.maxPoints, totalWeight);
  assert.equal(result.overall.percent, expected);
});

test('backup domain at zero, other domains at 100, weighted overall', () => {
  const answers = allAnswers('yes');
  const backupQuestions = questions.filter((q) => q.domainId === 'backup');
  backupQuestions.forEach((q) => { answers[q.id] = 'no'; });
  const lost = backupQuestions.reduce((sum, q) => sum + q.weight, 0);
  const result = score(answers);
  assert.equal(result.domains.find((d) => d.id === 'backup').percent, 0);
  assert.ok(result.domains.filter((d) => d.id !== 'backup').every((d) => d.percent === 100));
  assert.equal(result.overall.percent, Math.round((totalWeight - lost) / totalWeight * 1000) / 10);
});

test('all maturity level boundaries', () => {
  const percents = [0, 24.9, 25, 49.9, 50, 69.9, 70, 84.9, 85, 100];
  assert.deepEqual(percents.map((p) => getLevelForPercent(p).level), [1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
});

test('three critical gaps cap a high score; two do not; domains stay uncapped', () => {
  const answers = allAnswers('yes');
  criticalQuestions.slice(0, 3).forEach((q, i) => { answers[q.id] = i === 0 ? 'unsure' : 'no'; });
  const result = score(answers);
  assert.equal(result.stats.criticalGaps, 3);
  assert.ok(result.overall.percent >= 70);
  assert.ok(result.overall.uncappedLevel.level >= 4);
  assert.equal(result.overall.capped, true);
  assert.equal(result.overall.level.level, 2);
  assert.equal(result.overall.cappedReason, 'Level limited to Developing because 3 critical gaps remain.');
  result.domains.forEach((d) => assert.deepEqual(d.level, getLevelForPercent(d.percent)));
  answers[criticalQuestions[2].id] = 'yes';
  const two = score(answers);
  assert.equal(two.stats.criticalGaps, 2);
  assert.equal(two.overall.capped, false);
  assert.deepEqual(two.overall.level, two.overall.uncappedLevel);
});

test('recommendations: scores, labels, and every sorting tie-break', () => {
  const answers = Object.fromEntries(questions.map((q, i) => [q.id, i % 2 ? 'partial' : 'no']));
  const { recommendations } = score(answers);
  assert.equal(recommendations[0].weight, 3);
  assert.ok(['no', 'unsure'].includes(recommendations[0].answer));
  const domainOrder = (id) => domains.find((d) => d.id === id).order;
  for (let i = 1; i < recommendations.length; i += 1) {
    const a = recommendations[i - 1];
    const b = recommendations[i];
    assert.ok(a.priorityScore >= b.priorityScore);
    if (a.priorityScore === b.priorityScore) {
      assert.ok(a.weight >= b.weight);
      if (a.weight === b.weight) {
        assert.ok(domainOrder(a.domainId) <= domainOrder(b.domainId));
        if (a.domainId === b.domainId) assert.ok(a.questionId < b.questionId);
      }
    }
  }
  for (const weight of [1, 2, 3]) {
    const question = questions.find((q) => q.weight === weight);
    const noAnswers = allAnswers('yes');
    noAnswers[question.id] = 'no';
    const no = score(noAnswers).recommendations[0];
    const partialAnswers = { ...noAnswers, [question.id]: 'partial' };
    const partial = score(partialAnswers).recommendations[0];
    assert.ok(partial.priorityScore < no.priorityScore);
  }
  const first = recommendations[0];
  const question = questions.find((q) => q.id === first.questionId);
  assert.equal(first.questionText, question.text);
  assert.equal(first.recommendation, question.recommendation);
  assert.equal(first.priority, 'High');
});

test('missing answers, invalid answers and missing inputs throw clearly', () => {
  const answers = allAnswers('yes');
  delete answers[questions[0].id];
  assert.throws(() => score(answers), /Missing answer.*BKP-01/);
  answers[questions[0].id] = 'maybe';
  assert.throws(() => score(answers), /Invalid answer.*BKP-01/);
  assert.throws(() => calculateScores(), /requires answers, domains, questions and answerOptions/);
  assert.throws(() => calculateScores(null), /requires/);
  for (const key of ['answers', 'domains', 'questions', 'answerOptions']) {
    const input = { answers: allAnswers('yes'), domains, questions, answerOptions };
    delete input[key];
    assert.throws(() => calculateScores(input), /requires/);
  }
});

test('determinism, no input mutation, and extra answer keys ignored', () => {
  const answers = allAnswers('partial');
  const before = JSON.stringify({ answers, domains, questions, answerOptions });
  assert.deepEqual(score(answers), score(answers));
  assert.equal(JSON.stringify({ answers, domains, questions, answerOptions }), before);
  assert.deepEqual(score({ ...answers, unknown: 'invalid' }), score(answers));
  assert.deepEqual(calculateScores({ answers, domains: [...domains].reverse(), questions: [...questions].reverse(), answerOptions }), score(answers));
});

test('round once before level lookup for both overall and domains', () => {
  // 69.96 rounds to 70, crossing the Managed boundary.
  const result = calculateScores({
    answers: { sample: 'partial' }, domains: [{ id: 'sample', name: 'Sample', order: 1 }],
    questions: [{ id: 'sample', domainId: 'sample', weight: 1 }],
    answerOptions: [{ id: 'partial', score: 0.6996 }],
  });
  assert.equal(result.overall.percent, 70);
  assert.equal(result.overall.level.level, 4);
  assert.equal(result.domains[0].percent, 70);
  assert.equal(result.domains[0].level.level, 4);
});

let failed = 0;
for (const { name, run } of tests) {
  try { run(); console.log(`PASS ${name}`); }
  catch (error) { failed += 1; console.error(`FAIL ${name}\n${error.stack}`); }
}
console.log(`${tests.length - failed}/${tests.length} scoring tests passed.`);
if (failed) process.exitCode = 1;
