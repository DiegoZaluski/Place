const { BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let controlWindow = null;

// URL RESOLUTION
const getWindowURL = () => {
  const correctPath = path.join(process.cwd(), '../index.html');
  const testPaths = [correctPath, path.join(__dirname, '../../../index.html')];
  for (const testPath of testPaths) {
    if (fs.existsSync(testPath)) {
      return `file://${testPath}#/control`;
    }
  }
  return 'http://localhost:3000/#/control';
};

const createControlWindow = (exj) => {
  if (controlWindow) {
    controlWindow.focus();
    return controlWindow;
  }

  const preloadPath = path.join(__dirname, '../../preload.cjs');
  console.log('Preload path:', preloadPath);
  console.log('Preload exists:', fs.existsSync(preloadPath));

  controlWindow = new BrowserWindow({
    width: 484,
    height: 80,
    minWidth: 48,
    minHeight: 48,
    x: 20,
    y: 20,
    useContentSize: true,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    alwaysOnTop: true,
    level: 'system',
    visibleOnAllWorkspaces: true,
    type: 'toolbar',
    frame: false,
    skipTaskbar: true,
    resizable: true,
    movable: true,
    show: false,
    hasShadow: false,
    transparent: true,
    vibrancy: 'sidebar', //bluer macOS
    backgroundMaterial: 'acrylic', //bluer windows 10/11 os
    // backgroundColor: 'rgba(18, 61, 201, 1)'
  });

  controlWindow.webContents.on('did-fail-load', () => {
    controlWindow.loadURL('http://localhost:3000/#/control');
  });

  controlWindow.setAlwaysOnTop(true, 'screen-saver');
  controlWindow.setVisibleOnAllWorkspaces(true, {
    visibleOnFullScreen: true,
    skipTransformProcessType: true,
  });

  const url = getWindowURL();
  controlWindow.loadURL(url);

  controlWindow.webContents.on('dom-ready', () => {

    controlWindow.webContents.executeJavaScript(exj);
  });

  controlWindow.once('ready-to-show', () => {
    controlWindow?.show();
    controlWindow.setAlwaysOnTop(true, 'screen-saver');
  });

  controlWindow.on('closed', () => {
    controlWindow = null;
  });

  return controlWindow;
};

// WINDOW MANAGEMENT FUNCTIONS
const getControlWindow = () => controlWindow;
const closeControlWindow = () => {
  controlWindow?.close();
  controlWindow = null;
};
const showControlWindow = () => {
  controlWindow?.show();
  controlWindow?.focus();
  controlWindow?.setAlwaysOnTop(true, 'screen-saver');
};
const hideControlWindow = () => controlWindow?.hide();

module.exports = {
  createControlWindow,
  getControlWindow,
  closeControlWindow,
  showControlWindow,
  hideControlWindow,
  
};
