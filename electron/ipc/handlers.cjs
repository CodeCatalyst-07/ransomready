const { app, ipcMain } = require('electron');

function registerIpcHandlers() {
  ipcMain.handle('app:get-info', () => ({
    name: app.getName(),
    version: app.getVersion(),
    versions: {
      electron: process.versions.electron,
      node: process.versions.node,
      chrome: process.versions.chrome,
    },
  }));
}

module.exports = { registerIpcHandlers };
