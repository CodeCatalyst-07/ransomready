const { app, ipcMain, dialog, BrowserWindow, shell } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const { scanFolder } = require('../scanner/scanner.cjs');
let selectedFolder = null;
let lastScannedRoot = null;
let scanRunning = false;
let cancelRequested = false;
const { createStorage } = require('../storage.cjs');

function registerIpcHandlers() {
  const storage = createStorage(app.getPath('userData'));
  ipcMain.handle('app:get-info', () => ({
    name: app.getName(),
    version: app.getVersion(),
    dataPath: app.getPath('userData'),
    versions: {
      electron: process.versions.electron,
      node: process.versions.node,
      chrome: process.versions.chrome,
    },
  }));
  const scannerOperations = {
    'scanner:choose-folder': async (event) => {
      if (scanRunning) throw new Error('Wait for the current scan to finish before choosing another folder.');
      const choice = await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender), {
        properties: ['openDirectory'], title: 'Choose a folder to scan',
      });
      if (choice.canceled || !choice.filePaths.length) return null;
      const folder = await fs.realpath(choice.filePaths[0]);
      if (!(await fs.stat(folder)).isDirectory()) throw new Error('Choose an existing folder.');
      if (path.parse(folder).root === folder) throw new Error('A filesystem root cannot be scanned. Choose a smaller folder.');
      selectedFolder = folder;
      return { path: folder };
    },
    // No path parameter: the main process alone holds the native dialog selection.
    'scanner:start': async (event) => {
      if (scanRunning) throw new Error('A scan is already running.');
      if (!selectedFolder) throw new Error('Choose a folder before starting a scan.');
      scanRunning = true;
      cancelRequested = false;
      const root = selectedFolder;
      try {
        const result = await scanFolder(root, {
          onProgress: (data) => { if (!event.sender.isDestroyed()) event.sender.send('scanner:progress', data); },
          shouldCancel: () => cancelRequested,
        });
        await storage.saveScan(result);
        lastScannedRoot = root;
        return result;
      } finally { scanRunning = false; cancelRequested = false; }
    },
    'scanner:cancel': async () => { cancelRequested = true; return null; },
    'scanner:reveal': async (_event, relativePath) => {
      if (!lastScannedRoot) throw new Error('Run a scan before revealing a file.');
      if (typeof relativePath !== 'string' || !relativePath || path.isAbsolute(relativePath)) throw new Error('A relative file path is required.');
      const resolved = path.resolve(lastScannedRoot, relativePath);
      const outside = (target) => { const relative = path.relative(lastScannedRoot, target); return relative.startsWith('..') || path.isAbsolute(relative); };
      if (outside(resolved)) throw new Error('The file must be inside the scanned folder.');
      // Resolve symlinks again, in case a file was replaced after the scan.
      if (outside(await fs.realpath(resolved))) throw new Error('The file must be inside the scanned folder.');
      await fs.lstat(resolved);
      shell.showItemInFolder(resolved);
      return null;
    },
    'scanner:get-latest': async () => {
      const result = await storage.getLatestScan();
      if (result && !scanRunning) lastScannedRoot = result.rootPath;
      return result;
    },
  };
  for (const [channel, operation] of Object.entries(scannerOperations)) {
    ipcMain.handle(channel, async (event, payload) => {
      try { return { ok: true, data: await operation(event, payload) }; }
      catch (error) { return { ok: false, error: error.message }; }
    });
  }
  const operations = {
    'assessment:save-draft': (draft) => storage.saveDraft(draft),
    'assessment:load-draft': () => storage.loadDraft(),
    'assessment:clear-draft': () => storage.clearDraft(),
    'assessment:save-completed': (data) => storage.saveAssessment(data),
    'assessment:get-latest': () => storage.getLatestAssessment(),
  };
  for (const [channel, operation] of Object.entries(operations)) {
    ipcMain.handle(channel, async (_event, payload) => {
      try { return { ok: true, data: await operation(payload) }; }
      catch (error) { return { ok: false, error: error.message }; }
    });
  }
}

module.exports = { registerIpcHandlers };
