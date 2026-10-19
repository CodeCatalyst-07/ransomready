const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const { registerIpcHandlers } = require('./ipc/handlers.cjs');

const isDevelopment = process.env.ELECTRON_DEV === 'true';

function createWindow() {
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'RansomReady',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  // This app only needs its own UI, so reject new windows and navigation away.
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event) => event.preventDefault());

  if (isDevelopment) {
    window.loadURL('http://localhost:5173');
    window.webContents.openDevTools();
  } else {
    window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  app.setName('RansomReady');
  // Register once, rather than each time macOS recreates a window.
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
