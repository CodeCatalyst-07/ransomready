const { contextBridge, ipcRenderer } = require('electron');

// Expose a specific operation, never Node or the full IPC renderer.
contextBridge.exposeInMainWorld('api', {
  getAppInfo: () => ipcRenderer.invoke('app:get-info'),
});
