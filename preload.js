const { contextBridge, ipcRenderer, desktopCapturer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openChat: () => ipcRenderer.send('open-chat'),
  hideChat: () => ipcRenderer.send('hide-chat'),
  onChatOpened: (callback) => {
    ipcRenderer.removeAllListeners('chat-opened');
    ipcRenderer.on('chat-opened', (_event) => callback());
  },
  getPrimaryDisplay: () => ipcRenderer.invoke('get-primary-display'),
  saveCapture: (payload) => ipcRenderer.invoke('save-capture', payload),
  startCursorAnimation: () => ipcRenderer.send('start-animation'),
  onStartAnimation: (callback) => {
    ipcRenderer.removeAllListeners('start-animation');
    ipcRenderer.on('start-animation', (_event, points) => callback(points));
  },
  animationComplete: () => ipcRenderer.send('animation-complete'),
  showPermissionDialog: () => ipcRenderer.send('request-permission-dialog'),
  closePermissionDialog: () => ipcRenderer.send('close-permission-dialog'),
  openSystemSettings: () => ipcRenderer.send('open-permission-settings')
});

contextBridge.exposeInMainWorld('captureAPI', {
  capturePrimaryDisplay: async (displayId, width, height) => {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: {
          width: Math.max(1, Math.floor(width)),
          height: Math.max(1, Math.floor(height))
        }
      });
      const matchingSource = sources.find((source) => source.display_id === String(displayId));
      if (!matchingSource) {
        return { ok: false, reason: 'missing-source' };
      }
      const size = matchingSource.thumbnail.getSize();
      return {
        ok: true,
        dataURL: matchingSource.thumbnail.toDataURL(),
        width: size.width,
        height: size.height
      };
    } catch (error) {
      return { ok: false, reason: 'permission-denied', message: error.message };
    }
  }
});
