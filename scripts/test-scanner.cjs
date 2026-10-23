const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { classifyFileName, severityOrder, compareSeverity } = require('../electron/scanner/rules.cjs');
const { scanFolder } = require('../electron/scanner/scanner.cjs');
const { createStorage } = require('../electron/storage.cjs');
let failures = 0;
async function test(name, run) {
  try { await run(); console.log(`PASS ${name}`); }
  catch (error) { failures += 1; console.error(`FAIL ${name}: ${error.stack}`); }
}
async function main() {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'ransomready-scanner-test-'));
  const tree = path.join(temp, 'tree');
  const blocked = path.join(tree, 'blocked');
  try {
    await test('ransom note case and separators', () => {
      for (const name of ['DECRYPT.txt', 'How To Recover Files.HTML', 'how-to-restore.htm', 'restore_files.rtf', 'YOUR_FILES.url', 'ransom.hta']) {
        assert.equal(classifyFileName(name).severity, 'high');
        assert.equal(classifyFileName(name).ruleId, 'ransom-note-name');
      }
    });
    await test('ordinary and benign extra extensions stay clean', () => {
      for (const name of ['readme.txt', 'notes.txt', 'report.docx', 'photo.jpg', 'archive.zip', 'summary_2024.xlsx', 'report.docx.bak']) assert.equal(classifyFileName(name), null);
    });
    await test('family, generic, unusual extra extension and priority', () => {
      assert.equal(classifyFileName('report.docx.WNCRY').ruleId, 'family-extension');
      assert.equal(classifyFileName('budget.xlsx.locked').severity, 'medium');
      assert.equal(classifyFileName('report.docx.x7k2q9').severity, 'low');
      assert.equal(classifyFileName('ransom.docx.txt').ruleId, 'ransom-note-name');
      assert.equal(classifyFileName('report.docx.wncry').severity, 'high');
      assert.equal(classifyFileName('report.docx.ab').severity, 'low');
      assert.equal(classifyFileName('report.docx.a'), null);
      assert.equal(classifyFileName('report.docx.abcdefghij'), null);
      assert.deepEqual(severityOrder, ['high', 'medium', 'low']);
      assert.ok(compareSeverity('high', 'low') < 0);
    });
    for (const dir of ['nested', 'empty', 'node_modules', 'blocked']) await fs.mkdir(path.join(tree, dir), { recursive: true });
    const files = { 'nested/report.docx.wncry': 'demo one', 'HOW_TO_RECOVER.txt': 'demo two', 'notes.txt': 'normal', 'nested/photo.jpg': 'normal image name', 'node_modules/hidden.locked': 'skipped', 'blocked/file.txt': 'permission test' };
    for (const [name, text] of Object.entries(files)) await fs.writeFile(path.join(tree, name), text);
    await test('tree counts, empty folder, paths, metadata and skipped folder', async () => {
      const result = await scanFolder(tree);
      assert.equal(result.status, 'completed');
      assert.equal(result.filesScanned, 5);
      assert.equal(result.foldersScanned, 4);
      assert.equal(result.foldersSkipped, 1);
      assert.deepEqual(result.counts, { high: 2, medium: 0, low: 0 });
      assert.deepEqual(result.findings.map((f) => f.relativePath).sort(), ['HOW_TO_RECOVER.txt', path.join('nested', 'report.docx.wncry')].sort());
      assert.ok(result.findings.every((f) => f.sizeBytes > 0 && !Number.isNaN(Date.parse(f.modifiedAt))));
    });
    await test('outside symlink is never followed', async () => {
      const outside = path.join(temp, 'outside'); await fs.mkdir(outside); await fs.writeFile(path.join(outside, 'outside.locked'), 'demo');
      try { await fs.symlink(outside, path.join(tree, 'link'), 'dir'); }
      catch (error) { console.log(`SKIP symlink creation refused: ${error.code}`); return; }
      const result = await scanFolder(tree);
      assert.ok(result.symlinksSkipped >= 1); assert.equal(result.filesScanned, 5);
    });
    await test('cancellation stops immediately', async () => { const result = await scanFolder(tree, { shouldCancel: () => true }); assert.equal(result.status, 'cancelled'); assert.equal(result.filesScanned, 0); });
    await test('cancellation after a 500-entry yield', async () => {
      const many = path.join(temp, 'many'); await fs.mkdir(many);
      for (let i = 0; i < 510; i += 1) await fs.writeFile(path.join(many, `${i}.txt`), 'demo');
      let checks = 0;
      const result = await scanFolder(many, { shouldCancel: () => ++checks > 1 });
      assert.equal(result.status, 'cancelled'); assert.equal(result.filesScanned, 499);
    });
    await test('maxFiles stops at limit', async () => { const result = await scanFolder(tree, { limits: { maxFiles: 1 } }); assert.equal(result.status, 'limit-reached'); assert.equal(result.filesScanned, 1); });
    await test('maxDepth skips deeper folders', async () => { const result = await scanFolder(tree, { limits: { maxDepth: 0 } }); assert.equal(result.foldersScanned, 1); assert.ok(result.foldersSkipped >= 4); });
    await test('unreadable folder is counted without throwing', async () => {
      if (process.platform === 'win32') { console.log('SKIP chmod on Windows'); return; }
      await fs.chmod(blocked, 0);
      try {
        try { const dir = await fs.opendir(blocked); await dir.close(); console.log('SKIP current user bypasses chmod restrictions'); return; }
        catch (error) { assert.ok(['EACCES', 'EPERM'].includes(error.code)); }
        assert.ok((await scanFolder(tree)).skippedUnreadable >= 1);
      } finally { await fs.chmod(blocked, 0o700); }
    });
    await test('maxFindings truncates storage while preserving counts', async () => { const result = await scanFolder(tree, { limits: { maxFindings: 1 } }); assert.equal(result.truncated, true); assert.equal(result.findings.length, 1); assert.equal(result.counts.high, 2); });
    await test('READ-ONLY PROOF contents and mtimes unchanged', async () => {
      const snapshot = async () => Promise.all(Object.keys(files).map(async (name) => { const file = path.join(tree, name); return { name, content: await fs.readFile(file, 'utf8'), mtime: (await fs.stat(file)).mtimeMs }; }));
      const before = await snapshot(); await scanFolder(tree); assert.deepEqual(await snapshot(), before);
    });
    await test('scanner never opens file contents', async () => {
      const readFile = fs.readFile;
      const open = fs.open;
      fs.readFile = fs.open = async () => { throw new Error('Content access forbidden'); };
      try { assert.equal((await scanFolder(tree)).counts.high, 2); }
      finally { fs.readFile = readFile; fs.open = open; }
    });
    await test('severity then relative-path sorting and progress throttle', async () => {
      const mixed = path.join(temp, 'mixed'); await fs.mkdir(mixed);
      for (const name of ['z.docx.x7k2q9', 'b.locked', 'z.wncry', 'a.wncry']) await fs.writeFile(path.join(mixed, name), 'demo');
      const times = [];
      const result = await scanFolder(mixed, { onProgress: (data) => {
        assert.deepEqual(Object.keys(data), ['filesScanned', 'foldersScanned', 'findingsCount']);
        times.push(Date.now());
      } });
      assert.deepEqual(result.findings.map((f) => f.name), ['a.wncry', 'z.wncry', 'b.locked', 'z.docx.x7k2q9']);
      for (let i = 1; i < times.length; i += 1) assert.ok(times[i] - times[i - 1] >= 250);
    });
    await test('missing root read error is counted', async () => {
      assert.equal((await scanFolder(path.join(temp, 'missing'))).skippedUnreadable, 1);
    });
    const storage = createStorage(path.join(temp, 'storage'));
    await test('missing latest scan is null', async () => assert.equal(await storage.getLatestScan(), null));
    await test('scan storage round trip', async () => { const result = await scanFolder(tree); await storage.saveScan(result); assert.deepEqual(await storage.getLatestScan(), result); });
    await test('oversized and malformed results rejected', async () => {
      for (const data of [null, [], {}, { findings: {} }, { findings: Array(501).fill({}) }, { findings: [], padding: 'x'.repeat(1024 * 1024) }]) await assert.rejects(storage.saveScan(data), /Scan/);
    });
    await test('corrupt latest scan is null', async () => { await fs.writeFile(path.join(temp, 'storage', 'latest-scan.json'), '{bad'); assert.equal(await storage.getLatestScan(), null); });
  } finally {
    await fs.chmod(blocked, 0o700).catch(() => {});
    await fs.rm(temp, { recursive: true, force: true });
  }
  process.exitCode = failures ? 1 : 0;
}
main().catch((error) => { console.error(`FAIL setup: ${error.stack}`); process.exitCode = 1; });
