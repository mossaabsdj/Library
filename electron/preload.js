const { contextBridge, ipcRenderer } = require("electron");

// Secure API exposed to Next.js renderer via contextBridge
contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  platform: process.platform,
  printReceipt: (htmlContent) =>
    ipcRenderer.invoke("print-receipt", htmlContent),
  toggleFullscreen: () => ipcRenderer.invoke("toggle-fullscreen"),
  minimize: () => ipcRenderer.send("window-minimize"),
  maximize: () => ipcRenderer.send("window-maximize"),
  close: () => ipcRenderer.send("window-close"),
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  appReady: () => ipcRenderer.send("app-ready"),
});
