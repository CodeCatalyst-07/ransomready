const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const { classifyFileName } = require('../electron/scanner/rules.cjs');
const { scanFolder } = require('../electron/scanner/scanner.cjs');
async function main() {
  const folder = path.join(os.tmpdir(), 'ransomready-demo-folder');
  // Only this fixed, disposable demo directory is recreated. The scanner never writes.
  await fs.rm(folder, { recursive: true, force: true });
  const names = ['quarterly_report.docx.locked', 'HOW_TO_RECOVER_FILES.txt', 'invoices/summary_2024.xlsx.encrypted', 'finance/budget.xlsx.wncry', 'photos/holiday.jpg.x7k2q9', 'readme.txt', 'notes.txt', 'photos/holiday.jpg', 'report.docx'];
  const expected = { high: 0, medium: 0, low: 0 };
  for (const name of names) {
    const file = path.join(folder, name);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, 'Harmless demo file created by RansomReady for testing. Nothing here is real or dangerous.');
    const match = classifyFileName(path.basename(name));
    if (match) expected[match.severity] += 1;
  }
  const result = await scanFolder(folder);
  assert.deepEqual(result.counts, expected);
  assert.equal(result.filesScanned, names.length);
  console.log(folder);
  console.log(`expected: ${expected.high} high, ${expected.medium} medium, ${expected.low} low; ${names.length} files`);
  console.log('PASS demo scan matches expected counts. Choose this folder in RansomReady.');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
