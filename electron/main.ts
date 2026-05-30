import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

const DATA_DIR = join(app.getPath('userData'), 'claim-data');

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getDataPath(key: string): string {
  return join(DATA_DIR, `${key}.json`);
}

async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    },
    backgroundColor: '#1e3a5f',
    show: false
  });

  // Load the app
  if (process.env.NODE_ENV === 'development' || process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173');
    // DevTools disabled by default - press F12 to open manually if needed
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(app.getAppPath(), 'dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// IPC Handlers
ipcMain.handle('save-data', async (_event, key: string, data: unknown) => {
  try {
    ensureDataDir();
    const filePath = getDataPath(key);
    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return { success: true };
  } catch (error) {
    console.error('Error saving data:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('load-data', async (_event, key: string) => {
  try {
    const filePath = getDataPath(key);
    if (!existsSync(filePath)) {
      return { success: true, data: null };
    }
    const content = readFileSync(filePath, 'utf-8');
    return { success: true, data: JSON.parse(content) };
  } catch (error) {
    console.error('Error loading data:', error);
    return { success: false, error: String(error), data: null };
  }
});

ipcMain.handle('delete-data', async (_event, key: string) => {
  try {
    const filePath = getDataPath(key);
    if (existsSync(filePath)) {
      const { unlinkSync } = require('fs');
      unlinkSync(filePath);
    }
    return { success: true };
  } catch (error) {
    console.error('Error deleting data:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('get-platform', () => {
  return process.platform;
});

ipcMain.handle('open-external', async (_event, url: string) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

// App lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});