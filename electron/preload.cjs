const { contextBridge, ipcRenderer } = require('electron');

// Expose a specific operation, never Node or the full IPC renderer.
contextBridge.exposeInMainWorld('api', {
  getAppInfo: () => ipcRenderer.invoke('app:get-info'),
  saveDraft: (draft) => ipcRenderer.invoke('assessment:save-draft', draft),
  loadDraft: () => ipcRenderer.invoke('assessment:load-draft'),
  clearDraft: () => ipcRenderer.invoke('assessment:clear-draft'),
  saveAssessment: (data) => ipcRenderer.invoke('assessment:save-completed', data),
  getLatestAssessment: () => ipcRenderer.invoke('assessment:get-latest'),
});
