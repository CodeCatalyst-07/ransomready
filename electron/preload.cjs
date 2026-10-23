const { contextBridge, ipcRenderer } = require('electron');

// Expose a specific operation, never Node or the full IPC renderer.
contextBridge.exposeInMainWorld('api', {
  chooseScanFolder: () => ipcRenderer.invoke('scanner:choose-folder'),
  startScan: () => ipcRenderer.invoke('scanner:start'),
  cancelScan: () => ipcRenderer.invoke('scanner:cancel'),
  revealInFolder: (relativePath) => ipcRenderer.invoke('scanner:reveal', relativePath),
  getLatestScan: () => ipcRenderer.invoke('scanner:get-latest'),
  onScanProgress: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('scanner:progress', listener);
    return () => ipcRenderer.removeListener('scanner:progress', listener);
  },
  exportReportPdf: (payload) => ipcRenderer.invoke('report:export-pdf', payload),
  getAppInfo: () => ipcRenderer.invoke('app:get-info'),
  saveDraft: (draft) => ipcRenderer.invoke('assessment:save-draft', draft),
  loadDraft: () => ipcRenderer.invoke('assessment:load-draft'),
  clearDraft: () => ipcRenderer.invoke('assessment:clear-draft'),
  saveAssessment: (data) => ipcRenderer.invoke('assessment:save-completed', data),
  getLatestAssessment: () => ipcRenderer.invoke('assessment:get-latest'),
});
