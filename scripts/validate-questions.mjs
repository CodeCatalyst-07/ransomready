import { readFile } from 'node:fs/promises';

const expectedPrefixes = {
  backup: 'BKP', access: 'ACC', patching: 'PAT', email: 'EML',
  network: 'NET', detection: 'DET', incident: 'INC', awareness: 'AWR',
};
const textFields = ['id', 'domainId', 'text', 'why', 'recommendation'];
const isText = (value) => typeof value === 'string' && value.trim().length > 0;
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
let failures = 0;

function check(condition, message) {
  console.log(`${condition ? 'PASS' : 'FAIL'}: ${message}`);
  if (!condition) failures += 1;
}

async function validate() {
  // Resolve from this script so validation does not depend on the working directory.
  const [domains, questions] = await Promise.all([
    readFile(new URL('../src/data/domains.json', import.meta.url), 'utf8').then(JSON.parse),
    readFile(new URL('../src/data/questions.json', import.meta.url), 'utf8').then(JSON.parse),
  ]);

  check(Array.isArray(domains), 'Domains data is an array');
  check(Array.isArray(questions), 'Questions data is an array');
  if (!Array.isArray(domains) || !Array.isArray(questions)) return;

  check(domains.length === 8, `Expected 8 domains; found ${domains.length}`);
  const domainIds = new Set();
  const orders = new Set();
  for (const [index, domain] of domains.entries()) {
    const label = `Domain ${index + 1}`;
    const valid = isObject(domain)
      && ['id', 'name', 'description'].every((field) => isText(domain[field]))
      && Number.isInteger(domain.order) && domain.order >= 1 && domain.order <= 8;
    check(valid, `${label} has non-empty id, name, description and an order from 1 to 8`);
    if (!valid) continue;
    check(Object.hasOwn(expectedPrefixes, domain.id), `${label} uses an expected domain ID: ${domain.id}`);
    check(!domainIds.has(domain.id), `${label} ID is unique: ${domain.id}`);
    check(!orders.has(domain.order), `${label} order is unique: ${domain.order}`);
    domainIds.add(domain.id);
    orders.add(domain.order);
  }
  check(Object.keys(expectedPrefixes).every((id) => domainIds.has(id)), 'All 8 required domain IDs are present');

  const questionIds = new Set();
  for (const [index, question] of questions.entries()) {
    const label = isObject(question) && isText(question.id) ? question.id : `Question ${index + 1}`;
    const valid = isObject(question) && textFields.every((field) => isText(question[field]));
    check(valid, `${label} has all required non-empty text fields`);
    if (!isObject(question)) continue;
    check([1, 2, 3].includes(question.weight), `${label} weight is 1, 2 or 3`);
    check(domainIds.has(question.domainId), `${label} references an existing domain`);
    check(isText(question.id) && !questionIds.has(question.id), `${label} has a unique, non-empty ID`);
    questionIds.add(question.id);
    const prefix = expectedPrefixes[question.domainId];
    check(Boolean(prefix) && new RegExp(`^${prefix}-0[1-4]$`).test(question.id), `${label} uses its domain prefix and a number from 01 to 04`);
    check(typeof question.text === 'string' && /^(Does your organisation\b|Are\b)/.test(question.text.trim())
      && question.text.trim().endsWith('?'), `${label} uses the required question wording`);
  }

  for (const id of Object.keys(expectedPrefixes)) {
    const members = questions.filter((question) => isObject(question) && question.domainId === id);
    check(members.length === 4, `${id}: exactly 4 questions (found ${members.length})`);
    check(members.some((question) => question.weight === 3), `${id}: at least one critical (weight-3) question`);
  }
  check(questions.length === 32, `Expected 32 questions; found ${questions.length}`);

  console.log(failures === 0
    ? `PASS: Question bank validated — ${domains.length} domains and ${questions.length} questions.`
    : `FAIL: Question bank has ${failures} failed checks.`);
}

try {
  await validate();
} catch (error) {
  console.error(`FAIL: Could not validate the question bank: ${error.message}`);
  failures += 1;
}
if (failures > 0) process.exitCode = 1;
