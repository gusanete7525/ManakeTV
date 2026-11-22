const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("fluxtv", {
  isElectron: true,
  listCastDevices: () => ipcRenderer.invoke("fluxtv:list-cast-devices"),
  castMedia: (opts) => ipcRenderer.invoke("fluxtv:cast-media", opts),
  stopCast: (deviceId) => ipcRenderer.invoke("fluxtv:stop-cast", deviceId),
});
