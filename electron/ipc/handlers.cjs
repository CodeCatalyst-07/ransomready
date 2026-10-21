const { app, ipcMain } = require('electron');
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
