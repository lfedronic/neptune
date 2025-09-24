const { app, BrowserWindow, ipcMain, screen, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let overlayWindow;
let chatWindow;
let animationWindow;
let permissionWindow;

const CURSOR_POINTS = [
  { x: 320, y: 200, message: 'Placeholder: Step 1' },
  { x: 860, y: 480, message: 'Placeholder: Step 2' },
  { x: 1280, y: 300, message: 'Placeholder: Step 3' }
];

function createOverlayWindow() {
  overlayWindow = new BrowserWindow({
    width: 56,
    height: 56,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: true,
    hasShadow: false,
    roundedCorners: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  overlayWindow.setAlwaysOnTop(true, 'screen-saver');
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlayWindow.loadFile(path.join(__dirname, 'renderer', 'overlay', 'index.html'));

  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });
}

function createChatWindow() {
  chatWindow = new BrowserWindow({
    width: 520,
    height: 120,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    vibrancy: 'fullscreen-ui',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  chatWindow.setAlwaysOnTop(true, 'screen-saver');
  chatWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  chatWindow.loadFile(path.join(__dirname, 'renderer', 'chat', 'index.html'));

  chatWindow.on('blur', () => {
    if (!chatWindow.webContents.isDevToolsOpened()) {
      chatWindow.hide();
    }
  });

  chatWindow.on('closed', () => {
    chatWindow = null;
  });
}

function createAnimationWindow() {
  const primaryBounds = screen.getPrimaryDisplay().bounds;
  animationWindow = new BrowserWindow({
    x: primaryBounds.x,
    y: primaryBounds.y,
    width: primaryBounds.width,
    height: primaryBounds.height,
    frame: false,
    show: false,
    transparent: true,
    resizable: false,
    fullscreenable: false,
    movable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  animationWindow.setAlwaysOnTop(true, 'screen-saver');
  animationWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  animationWindow.setIgnoreMouseEvents(true, { forward: true });
  animationWindow.loadFile(path.join(__dirname, 'renderer', 'animation', 'index.html'));

  animationWindow.on('closed', () => {
    animationWindow = null;
  });
}

function createPermissionWindow() {
  permissionWindow = new BrowserWindow({
    width: 420,
    height: 240,
    show: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    title: 'Screen Recording Permission Required',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  permissionWindow.loadFile(path.join(__dirname, 'renderer', 'permission', 'index.html'));

  permissionWindow.on('closed', () => {
    permissionWindow = null;
  });
}

async function saveCapture(dataUrl) {
  const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  const capturesDir = path.join(app.getPath('userData'), 'captures');
  await fs.promises.mkdir(capturesDir, { recursive: true });
  const filePath = path.join(capturesDir, `${Date.now()}.png`);
  await fs.promises.writeFile(filePath, buffer);
  return filePath;
}

function showChatWindow() {
  if (!chatWindow) {
    createChatWindow();
  }
  const display = screen.getPrimaryDisplay();
  const { width, height } = chatWindow.getBounds();
  const targetX = Math.round(display.bounds.x + (display.bounds.width - width) / 2);
  const targetY = Math.round(display.bounds.y + (display.bounds.height - height) / 2);
  chatWindow.setBounds({ x: targetX, y: targetY, width, height });
  chatWindow.show();
  chatWindow.focus();
  chatWindow.webContents.send('chat-opened');
}

function showAnimationWindow() {
  if (!animationWindow) {
    createAnimationWindow();
  }
  const display = screen.getPrimaryDisplay();
  animationWindow.setBounds(display.bounds);
  animationWindow.show();
  animationWindow.webContents.send('start-animation', CURSOR_POINTS);
}

app.whenReady().then(() => {
  createOverlayWindow();
  createChatWindow();
  createAnimationWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createOverlayWindow();
      createChatWindow();
      createAnimationWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.on('open-chat', () => {
  showChatWindow();
});

ipcMain.on('hide-chat', () => {
  if (chatWindow) {
    chatWindow.hide();
  }
});

ipcMain.handle('get-primary-display', () => {
  const primaryDisplay = screen.getPrimaryDisplay();
  return {
    id: primaryDisplay.id,
    width: primaryDisplay.size.width,
    height: primaryDisplay.size.height,
    scaleFactor: primaryDisplay.scaleFactor,
    bounds: primaryDisplay.bounds
  };
});

ipcMain.handle('save-capture', async (_event, payload) => {
  return saveCapture(payload.dataURL);
});

ipcMain.on('start-animation', () => {
  showAnimationWindow();
});

ipcMain.on('animation-complete', () => {
  if (animationWindow) {
    animationWindow.hide();
  }
});

ipcMain.on('request-permission-dialog', () => {
  if (!permissionWindow) {
    createPermissionWindow();
  }
  permissionWindow.show();
  permissionWindow.focus();
  openMacScreenRecordingSettings();
});

ipcMain.on('close-permission-dialog', () => {
  if (permissionWindow) {
    permissionWindow.hide();
  }
});

ipcMain.on('open-permission-settings', () => {
  openMacScreenRecordingSettings();
});

function openMacScreenRecordingSettings() {
  if (process.platform !== 'darwin') {
    return;
  }
  const macSettingsUrl = 'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture';
  shell.openExternal(macSettingsUrl);
}

