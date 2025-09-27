const { contextBridge, ipcRenderer, desktopCapturer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openChat: () => ipcRenderer.send('open-chat'),
  hideChat: () => ipcRenderer.send('hide-chat'),
  onChatOpened: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('chat-opened', listener);
    return () => ipcRenderer.removeListener('chat-opened', listener);
  },
  onChatClosed: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('chat-closed', listener);
    return () => ipcRenderer.removeListener('chat-closed', listener);
  },
  getPrimaryDisplay: () => ipcRenderer.invoke('get-primary-display'),
  saveCapture: (payload) => ipcRenderer.invoke('save-capture', payload),
  startCursorAnimation: () => ipcRenderer.send('start-animation'),
  onStartAnimation: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('start-animation', listener);
    return () => ipcRenderer.removeListener('start-animation', listener);
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
