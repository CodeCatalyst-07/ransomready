const fs = require('node:fs/promises');
const path = require('node:path');
const { classifyFileName, compareSeverity } = require('./rules.cjs');
const { skipFolders } = require('./indicators.json');
const yieldTurn = () => new Promise((resolve) => setImmediate(resolve));

async function scanFolder(rootPath, { onProgress = () => {}, shouldCancel = () => false, limits = {} } = {}) {
  const bounds = { maxFiles: 200000, maxDepth: 25, maxFindings: 500, ...limits };
  for (const key of Object.keys(bounds)) {
    if (!Number.isInteger(bounds[key]) || bounds[key] < 0) throw new Error(`Invalid scanner limit: ${key}`);
  }
  bounds.maxFindings = Math.min(bounds.maxFindings, 500);
  const started = Date.now();
  const result = { rootPath, status: 'completed', startedAt: new Date(started).toISOString(), finishedAt: null,
    durationMs: 0, filesScanned: 0, foldersScanned: 0, foldersSkipped: 0, skippedUnreadable: 0,
    symlinksSkipped: 0, counts: { high: 0, medium: 0, low: 0 }, truncated: false, findings: [] };
  let entries = 0;
  let lastProgress = -Infinity;
  function progress() {
    if (Date.now() - lastProgress < 250) return;
    lastProgress = Date.now();
    onProgress({ filesScanned: result.filesScanned, foldersScanned: result.foldersScanned,
      findingsCount: result.counts.high + result.counts.medium + result.counts.low });
  }
  async function checkpoint(force = false) {
    if (force || entries % 500 === 0) {
      await yieldTurn();
      if (shouldCancel()) { result.status = 'cancelled'; return false; }
    }
    progress();
    return true;
  }
  // Depth-first walking keeps at most maxDepth + 1 directory handles open.
  async function walk(folder, depth) {
    let directory;
    try {
      // Recheck metadata: never intentionally open a directory symlink.
      const info = await fs.lstat(folder);
      if (info.isSymbolicLink()) { result.symlinksSkipped += 1; return; }
      if (!info.isDirectory()) { result.skippedUnreadable += 1; return; }
      directory = await fs.opendir(folder);
      result.foldersScanned += 1;
      for await (const entry of directory) {
        entries += 1;
        if (!await checkpoint()) break;
        const fullPath = path.join(folder, entry.name);
        if (entry.isSymbolicLink()) { result.symlinksSkipped += 1; continue; }
        if (entry.isDirectory()) {
          if (skipFolders.includes(entry.name.toLowerCase()) || depth >= bounds.maxDepth) result.foldersSkipped += 1;
          else await walk(fullPath, depth + 1);
        } else if (entry.isFile()) {
          if (result.filesScanned >= bounds.maxFiles) { result.status = 'limit-reached'; break; }
          result.filesScanned += 1;
          const match = classifyFileName(entry.name);
          if (match) {
            try {
              const info = await fs.lstat(fullPath);
              if (info.isSymbolicLink()) { result.symlinksSkipped += 1; continue; }
              if (!info.isFile()) continue;
              result.counts[match.severity] += 1;
              if (result.findings.length < bounds.maxFindings) result.findings.push({
                relativePath: path.relative(rootPath, fullPath), name: entry.name, ...match,
                sizeBytes: info.size, modifiedAt: info.mtime.toISOString(),
              });
              else result.truncated = true;
            } catch { result.skippedUnreadable += 1; }
          }
          if (result.filesScanned >= bounds.maxFiles) result.status = 'limit-reached';
        }
        if (result.status !== 'completed') break;
      }
    } catch { result.skippedUnreadable += 1; }
    // for-await closes the directory handle even when the loop stops early.
  }
  if (await checkpoint(true)) {
    if (bounds.maxFiles === 0) result.status = 'limit-reached';
    else await walk(rootPath, 0);
  }
  if (result.status === 'completed' && shouldCancel()) result.status = 'cancelled';
  result.findings.sort((a, b) => compareSeverity(a, b) || a.relativePath.localeCompare(b.relativePath));
  result.finishedAt = new Date().toISOString();
  result.durationMs = Date.now() - started;
  return result;
}
module.exports = { scanFolder };
