import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { calculateScores } from '../src/utils/scoring.js';
import { answerOptions } from '../src/config/answerOptions.js';
import { buildReportHtml } from '../src/utils/reportHtml.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const domains = JSON.parse(fs.readFileSync(path.join(root, 'src/data/domains.json'), 'utf8'));
const questions = JSON.parse(fs.readFileSync(path.join(root, 'src/data/questions.json'), 'utf8'));
const generatedAt = '2026-10-23T10:00:00.000Z';
const assessment = { organisationName: '<script>alert(1)</script> & "Co"', assessorName: "Student's <name>", completedAt: generatedAt };
const score = (answer) => calculateScores({ answers: Object.fromEntries(questions.map((q) => [q.id, answer])), domains, questions, answerOptions });
const result = score('yes');
const build = (changes = {}) => buildReportHtml({ assessment, result, scan: null, generatedAt, ...changes });
const html = build();
function test(name, run) {
  try { run(); console.log(`PASS ${name}`); }
  catch (error) { console.error(`FAIL ${name}: ${error.message}`); process.exitCode = 1; }
}

test('escapes organisation and assessor text', () => {
  assert.ok(!html.includes(assessment.organisationName));
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;Co&quot;'));
  assert.ok(html.includes('Student&#39;s &lt;name&gt;'));
});
test('contains CSP and no scripts or external resources', () => {
  assert.ok(!html.toLowerCase().includes('<script'));
  assert.ok(html.includes('<meta http-equiv="Content-Security-Policy"'));
  assert.ok(html.includes("default-src 'none'; style-src 'unsafe-inline'; img-src data:"));
  assert.ok(!/<(?:link|iframe|img)\b|@import|url\(/i.test(html));
});
test('all Yes has 100 and no gaps; all No has Level 1', () => {
  assert.ok(html.includes('100%'));
  assert.ok(html.includes('No gaps found'));
  const noHtml = build({ result: score('no') });
  assert.ok(noHtml.includes('Level 1: Initial'));
  for (const question of questions) assert.ok(noHtml.includes(question.recommendation.replaceAll('&', '&amp;').replaceAll("'", '&#39;')));
});
test('scan is optional and scan counts and hostile paths are escaped', () => {
  assert.ok(!html.includes('<h2>Early-sign scan</h2>'));
  const scan = { rootPath: '/tmp/<folder>', finishedAt: generatedAt, status: 'completed', filesScanned: 123,
    counts: { high: 7, medium: 4, low: 2 }, findings: [{ severity: 'high', relativePath: '<img src=x onerror=alert(1)>', title: 'Rule <title>', reason: 'A & B' }] };
  const withScan = build({ scan });
  assert.ok(withScan.includes('<h2>Early-sign scan</h2>'));
  for (const count of ['Files scanned: 123', 'High: 7', 'Medium: 4', 'Low: 2']) assert.ok(withScan.includes(count));
  assert.ok(withScan.includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert.ok(!withScan.includes(scan.findings[0].relativePath));
  assert.ok(withScan.includes('/tmp/&lt;folder&gt;'));
  assert.ok(withScan.includes('Rule &lt;title&gt;'));
  assert.ok(withScan.includes('A &amp; B'));
});
test('every domain appears', () => {
  for (const domain of domains) assert.ok(html.includes(domain.name.replaceAll('&', '&amp;')));
});
test('complete standalone document under 2 MB', () => {
  assert.equal(typeof html, 'string');
  assert.ok(html.startsWith('<!DOCTYPE html>'));
  assert.ok(html.endsWith('</html>'));
  assert.ok(Buffer.byteLength(html, 'utf8') < 2 * 1024 * 1024);
});

test('caps and recommendation text use the supplied scoring result', () => {
  const answers = Object.fromEntries(questions.map((question) => [question.id, 'yes']));
  for (const question of questions.filter((q) => q.weight === 3).slice(0, 3)) answers[question.id] = 'no';
  const capped = calculateScores({ answers, domains, questions, answerOptions });
  assert.equal(capped.overall.capped, true);
  const cappedHtml = build({ result: capped });
  assert.ok(cappedHtml.includes(capped.overall.cappedReason));
  const hostile = '<tag> & "quoted"';
  const changed = { ...capped, recommendations: [{ ...capped.recommendations[0], domainName: hostile, questionText: hostile, recommendation: hostile }] };
  const escaped = build({ result: changed });
  assert.ok(!escaped.includes(hostile));
  assert.equal(escaped.split('&lt;tag&gt; &amp; &quot;quoted&quot;').length - 1, 3);
});
test('scan lists at most 25 retained findings without changing counts', () => {
  const scan = { rootPath: '/tmp', finishedAt: generatedAt, status: 'limit-reached', filesScanned: 99,
    counts: { high: 88, medium: 0, low: 0 }, findings: Array.from({ length: 30 }, (_, i) => ({ severity: 'high', relativePath: `finding-${i}.locked`, title: 'Rule' })) };
  const withScan = build({ scan });
  assert.ok(withScan.includes('finding-24.locked'));
  assert.ok(!withScan.includes('finding-25.locked'));
  assert.ok(withScan.includes('High: 88'));
  assert.equal(scan.findings.length, 30);
});
