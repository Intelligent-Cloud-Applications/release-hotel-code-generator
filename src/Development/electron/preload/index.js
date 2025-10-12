const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App settings
  getAppSetting: (key) => ipcRenderer.invoke('get-app-setting', key),
  setAppSetting: (key, value) => ipcRenderer.invoke('set-app-setting', key, value),
  
  // Dialog functions
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppPath: (name) => ipcRenderer.invoke('get-app-path', name),
  
  // Logout functionality
  logoutUser: () => ipcRenderer.invoke('logout-user'),
  
  // Network status
  isOnline: () => navigator.onLine,
  onOnline: (callback) => window.addEventListener('online', callback),
  onOffline: (callback) => window.addEventListener('offline', callback),
});
