import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import Store from 'electron-store';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize electron-store for persistent settings
const store = new Store();

let mainWindow = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: process.platform === 'win32' 
      ? path.join(__dirname, '../../../public/icons/icon.ico')
      : path.join(__dirname, '../../../public/icons/icon.icns'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/index.js'),
      partition: 'temp-session', // Use temporary session that doesn't persist
      webSecurity: true,
    },
  });

  // Clear all authentication data before loading
  win.webContents.once('dom-ready', () => {
    win.webContents.executeJavaScript(`
      console.log('Clearing authentication data on startup...');
      
      // Clear all authentication-related storage
      try {
        // Clear localStorage
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('amplify') || key.includes('cognito') || key.includes('auth'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Clear specific known keys
        localStorage.removeItem('amplify-signin-with-hostedUI');
        localStorage.removeItem('CognitoIdentityServiceProvider');
        localStorage.removeItem('aws-amplify-federatedInfo');
        localStorage.removeItem('aws-amplify-cache');
        
        // Clear sessionStorage
        sessionStorage.clear();
        
        console.log('Authentication data cleared on startup');
      } catch (error) {
        console.error('Error clearing auth data on startup:', error);
      }
    `);
  });

  // Load the online hotel management system
  win.loadURL('https://hotelamrapaliclassic.tekkzy.com/dashboard');
  
  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    win.webContents.openDevTools();
  }

  // Handle window close - logout user before closing
  win.on('close', async (event) => {
    event.preventDefault(); // Prevent immediate close
    
    try {
      // Execute comprehensive logout script in the web page
      await win.webContents.executeJavaScript(`
        console.log('Starting logout process...');
        
        // Clear all authentication-related storage
        try {
          // Clear localStorage
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('amplify') || key.includes('cognito') || key.includes('auth'))) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key));
          
          // Clear specific known keys
          localStorage.removeItem('amplify-signin-with-hostedUI');
          localStorage.removeItem('CognitoIdentityServiceProvider');
          localStorage.removeItem('aws-amplify-federatedInfo');
          localStorage.removeItem('aws-amplify-cache');
          
          // Clear sessionStorage
          sessionStorage.clear();
          
          // Clear IndexedDB if possible
          if ('indexedDB' in window) {
            try {
              indexedDB.deleteDatabase('amplify-datastore');
            } catch (e) {
              console.log('Could not clear IndexedDB:', e);
            }
          }
          
          // Perform Amplify logout if available
          if (window.Amplify && window.Amplify.Auth && window.Amplify.Auth.signOut) {
            console.log('Performing Amplify logout...');
            await window.Amplify.Auth.signOut({ global: true });
          }
          
          // Perform custom auth logout if available
          if (window.Auth && window.Auth.signOut) {
            console.log('Performing custom auth logout...');
            await window.Auth.signOut();
          }
          
          console.log('Logout completed successfully');
        } catch (error) {
          console.error('Error during logout:', error);
        }
      `);
      
      // Wait longer for logout to complete
      setTimeout(() => {
        win.destroy();
      }, 2000);
      
    } catch (error) {
      console.error('Error during logout:', error);
      // Force close even if logout fails
      win.destroy();
    }
  });

  mainWindow = win;
  return win;
}

// App event handlers
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for app settings (no database needed)
ipcMain.handle('get-app-setting', (event, key) => {
  return store.get(key);
});

ipcMain.handle('set-app-setting', (event, key, value) => {
  store.set(key, value);
  return true;
});

ipcMain.handle('show-message-box', async (event, options) => {
  const result = await dialog.showMessageBox(options);
  return result;
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(options);
  return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(options);
  return result;
});

// Handle app version
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Handle app path
ipcMain.handle('get-app-path', (event, name) => {
  return app.getPath(name);
});

// Handle logout request
ipcMain.handle('logout-user', async () => {
  if (mainWindow) {
    try {
      await mainWindow.webContents.executeJavaScript(`
        // Check if user is logged in and perform logout
        if (window.Auth && window.Auth.signOut) {
          console.log('Logging out user...');
          await window.Auth.signOut();
          console.log('User logged out successfully');
        } else if (window.Amplify && window.Amplify.Auth && window.Amplify.Auth.signOut) {
          console.log('Logging out user via Amplify...');
          await window.Amplify.Auth.signOut();
          console.log('User logged out successfully');
        } else {
          console.log('No auth system found, clearing any stored tokens...');
          // Clear any stored authentication tokens
          localStorage.removeItem('amplify-signin-with-hostedUI');
          localStorage.removeItem('CognitoIdentityServiceProvider');
          sessionStorage.clear();
        }
      `);
      return { success: true };
    } catch (error) {
      console.error('Error during logout:', error);
      return { success: false, error: error.message };
    }
  }
  return { success: false, error: 'No main window found' };
});

// Handle app quit with logout
app.on('before-quit', async (event) => {
  if (mainWindow) {
    event.preventDefault();
    try {
      await mainWindow.webContents.executeJavaScript(`
        console.log('Starting logout process on app quit...');
        
        // Clear all authentication-related storage
        try {
          // Clear localStorage
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('amplify') || key.includes('cognito') || key.includes('auth'))) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key));
          
          // Clear specific known keys
          localStorage.removeItem('amplify-signin-with-hostedUI');
          localStorage.removeItem('CognitoIdentityServiceProvider');
          localStorage.removeItem('aws-amplify-federatedInfo');
          localStorage.removeItem('aws-amplify-cache');
          
          // Clear sessionStorage
          sessionStorage.clear();
          
          // Clear IndexedDB if possible
          if ('indexedDB' in window) {
            try {
              indexedDB.deleteDatabase('amplify-datastore');
            } catch (e) {
              console.log('Could not clear IndexedDB:', e);
            }
          }
          
          // Perform Amplify logout if available
          if (window.Amplify && window.Amplify.Auth && window.Amplify.Auth.signOut) {
            console.log('Performing Amplify logout...');
            await window.Amplify.Auth.signOut({ global: true });
          }
          
          // Perform custom auth logout if available
          if (window.Auth && window.Auth.signOut) {
            console.log('Performing custom auth logout...');
            await window.Auth.signOut();
          }
          
          console.log('Logout completed successfully on app quit');
        } catch (error) {
          console.error('Error during logout on quit:', error);
        }
      `);
      
      // Wait longer for logout to complete
      setTimeout(() => {
        app.quit();
      }, 2000);
      
    } catch (error) {
      console.error('Error during logout on quit:', error);
      app.quit();
    }
  }
});

console.log('Hotel Management System - Electron app started');
console.log('Fully online system - no local database required');
