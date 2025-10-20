const { app, BrowserWindow } = require("electron");
const path = require("path");

/**
 * MAIN WINDOW: Global reference to prevent garbage collection
 */

let mainWindow;

/**
 * CREATE WINDOW: Initializes the main application window
 */

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    console.log('Loading from Vite at http://localhost:3000');
    
    try {
      await mainWindow.loadURL('http://localhost:3000');
      mainWindow.webContents.openDevTools();
      console.log('Vite loaded successfully');
    } catch (error) {
      console.error('Failed to load Vite:', error.message);
      console.error('Make sure Vite is running: npm run dev');
    }
  } else {
    console.log('Loading from build directory');
    await mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

/**
 * APP LIFECYCLE: Handles application initialization and window management
 */

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