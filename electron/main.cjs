const { app, BrowserWindow, ipcMain, session } = require("electron");
const path = require("node:path");
const cast = require("./cast.cjs");

const isDev = !app.isPackaged;

/** @type {BrowserWindow | null} */
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: "#1c1e22",
    title: "FluxTV",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (isDev) {
    const url = process.env.FLUXTV_DEV_URL || "http://127.0.0.1:5173";
    mainWindow.loadURL(url);
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Allow media autoplay in the desktop shell (on-air player).
  session.defaultSession.setPermissionRequestHandler((_wc, permission, cb) => {
    if (permission === "media" || permission === "mediaKeySystem") {
      cb(true);
      return;
    }
    cb(false);
  });

  ipcMain.handle("fluxtv:list-cast-devices", () => cast.listDevices());
  ipcMain.handle("fluxtv:cast-media", (_e, opts) => cast.castMedia(opts));
  ipcMain.handle("fluxtv:stop-cast", (_e, deviceId) => cast.stopCast(deviceId));

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
