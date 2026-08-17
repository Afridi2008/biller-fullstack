const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow = null;
let serverProcess = null;

const PORT = 3000;

function getServerPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'app.asar', 'dist', 'server.cjs');
  }

  return path.join(__dirname, '..', 'dist', 'server.cjs');
}

function getServerCwd() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'app.asar');
  }

  return path.join(__dirname, '..');
}

function startServer() {
  const serverPath = getServerPath();
  const cwd = getServerCwd();

  console.log('[BILLER] Server path:', serverPath);
  console.log('[BILLER] Server cwd:', cwd);

  serverProcess = spawn(
    process.execPath,
    [serverPath],
    {
      cwd,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: String(PORT),
      },
      stdio: 'inherit',
      windowsHide: true,
    }
  );

  serverProcess.on('error', (error) => {
    console.error('[BILLER] Failed to start server:', error);
  });

  serverProcess.on('exit', (code) => {
    console.log(`[BILLER] Server exited with code ${code}`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,

    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },

    show: false,
    autoHideMenuBar: true,
  });

  mainWindow.loadURL(`http://127.0.0.1:${PORT}`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error(
      `[BILLER] Failed to load application: ${errorCode} - ${errorDescription}`
    );
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function waitForServer() {
  const maxAttempts = 30;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/`);

      if (response.ok) {
        console.log('[BILLER] Server is ready.');
        return true;
      }
    } catch {
      // Server is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.error('[BILLER] Server did not start within the expected time.');
  return false;
}

app.whenReady().then(async () => {
  startServer();

  const serverReady = await waitForServer();

  if (serverReady) {
    createWindow();
  } else {
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
});