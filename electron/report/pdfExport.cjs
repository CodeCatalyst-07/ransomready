const { app, BrowserWindow, dialog, shell } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');

async function exportReportPdf({ html, suggestedName, parentWindow }) {
  if (typeof html !== 'string' || !html.trim() || Buffer.byteLength(html, 'utf8') >= 3 * 1024 * 1024) {
    throw new Error('Report HTML must be non-empty and smaller than 3 MB.');
  }
  if (typeof suggestedName !== 'string') throw new Error('A report file name is required.');
  // The renderer supplies a name only; the native dialog owns the destination.
  let name = suggestedName.replace(/[^\p{L}\p{N} ._-]/gu, '-').trim().replace(/\.pdf$/i, '');
  name = name.slice(0, 76).trim();
  if (!name || /^[-. ]+$/.test(name)) name = 'RansomReady-Report';
  const sanitizedName = `${name}.pdf`;
  const choice = await dialog.showSaveDialog(parentWindow, {
    title: 'Save report',
    defaultPath: path.join(app.getPath('documents'), sanitizedName),
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
  });
  if (choice.canceled) return { cancelled: true };
  if (!choice.filePath) throw new Error('No report destination was selected.');
  const filePath = /\.pdf$/i.test(choice.filePath) ? choice.filePath : `${choice.filePath}.pdf`;
  let window;
  let temporaryDirectory;
  try {
    window = new BrowserWindow({
      show: false,
      webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false, javascript: false },
    });
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    window.webContents.on('will-navigate', (event) => event.preventDefault());
    temporaryDirectory = await fs.mkdtemp(path.join(app.getPath('temp'), 'ransomready-report-'));
    const temporaryFile = path.join(temporaryDirectory, 'report.html');
    await fs.writeFile(temporaryFile, html, 'utf8');
    // loadFile resolves once the document has finished loading.
    await window.loadFile(temporaryFile);
    const pdf = await window.webContents.printToPDF({
      pageSize: 'A4', printBackground: true, margins: { marginType: 'default' },
    });
    await fs.writeFile(filePath, pdf);
    shell.showItemInFolder(filePath);
    return { cancelled: false, filePath };
  } finally {
    if (window && !window.isDestroyed()) window.destroy();
    if (temporaryDirectory) await fs.rm(temporaryDirectory, { recursive: true, force: true }).catch(() => {});
  }
}
module.exports = { exportReportPdf };
