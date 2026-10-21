const assert = require('node:assert/strict');
const os = require('node:os');
const fs = require('node:fs/promises');
const path = require('node:path');
const { createStorage } = require('../electron/storage.cjs');

async function main() {
  const baseDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ransomready-storage-'));
  const storage = createStorage(baseDir);
  const draft = { organisationName: 'Example College', answers: { 'BKP-01': 'yes', 'BKP-02': 'unsure' } };
  let failures = 0;
  async function test(name, run) {
    try { await run(); console.log(`PASS ${name}`); }
    catch (error) { failures += 1; console.error(`FAIL ${name}: ${error.message}`); }
  }
  try {
    await test('load when no draft returns null', async () => assert.equal(await storage.loadDraft(), null));
    await test('save then load draft', async () => {
      await storage.saveDraft(draft);
      assert.deepEqual(await storage.loadDraft(), draft);
    });
    await test('corrupt draft returns null', async () => {
      await fs.writeFile(path.join(baseDir, 'draft.json'), '{broken');
      assert.equal(await storage.loadDraft(), null);
    });
    await test('clear draft is safe even when missing', async () => {
      await storage.saveDraft(draft);
      await storage.clearDraft();
      await storage.clearDraft();
      assert.equal(await storage.loadDraft(), null);
    });
    await test('save then get latest assessment', async () => {
      assert.equal(await storage.getLatestAssessment(), null);
      const first = await storage.saveAssessment(draft);
      const latest = await storage.saveAssessment({ ...draft, organisationName: 'Second assessment' });
      assert.match(latest.id, /^assessment-\d+$/);
      assert.notEqual(first.id, latest.id);
      assert.equal(new Date(latest.completedAt).toISOString(), latest.completedAt);
      assert.deepEqual(await storage.getLatestAssessment(), latest);
      assert.deepEqual(JSON.parse(await fs.readFile(path.join(baseDir, 'assessments', `${latest.id}.json`), 'utf8')), latest);
    });
    await test('invalid answer value rejected', async () => {
      await assert.rejects(storage.saveDraft({ ...draft, answers: { q: 'maybe' } }), /Answers/);
      await assert.rejects(storage.saveAssessment({ ...draft, answers: { q: 1 } }), /Answers/);
    });
    await test('non-object payload rejected', async () => {
      for (const value of [null, [], 'text', 12]) await assert.rejects(storage.saveDraft(value), /plain object/);
      await assert.rejects(storage.saveAssessment(null), /plain object/);
      await assert.rejects(storage.saveDraft({ ...draft, answers: [] }), /Answers/);
    });
    await test('too-long organisation name rejected', async () => {
      await assert.rejects(storage.saveDraft({ ...draft, organisationName: 'x'.repeat(101) }), /100 characters/);
    });
    await test('payload of 1 MB or larger rejected', async () => {
      await assert.rejects(storage.saveAssessment({ ...draft, assessorName: 'x'.repeat(1024 * 1024) }), /under 1 MB/);
    });
    await test('queued draft save cannot recreate a cleared draft', async () => {
      await Promise.all([storage.saveDraft(draft), storage.saveDraft({ ...draft, currentStep: 2 }), storage.clearDraft()]);
      assert.equal(await storage.loadDraft(), null);
      assert.deepEqual((await fs.readdir(baseDir)).filter((name) => name.endsWith('.tmp')), []);
    });
  } finally { await fs.rm(baseDir, { recursive: true, force: true }); }
  process.exitCode = failures ? 1 : 0;
}
main().catch((error) => { console.error(`FAIL test setup: ${error.message}`); process.exitCode = 1; });
