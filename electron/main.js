const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

let splashWindow = null;
let mainWindow = null;
let isTransitioning = false;
let splashStartTime = 0;
const MIN_SPLASH_DURATION = 1800; // Minimum time in ms so animation runs smoothly

function createSplashScreen() {
  splashStartTime = Date.now();
  splashWindow = new BrowserWindow({
    width: 500,
    height: 400,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    center: true,
    resizable: false,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const param = {
    title: "SmartPOS",
    subtitle: "Gestion de Stock & Point de Vente",
    version: "Version 1.0.0",
  };

  const splashHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', 'Roboto', sans-serif;
            background: transparent;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            overflow: hidden;
            user-select: none;
            -webkit-user-select: none;
          }
          
          .splash-container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(102, 126, 234, 0.4);
            text-align: center;
            width: 500px;
            height: 400px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            position: relative;
            overflow: hidden;
            transition: opacity 0.35s ease, transform 0.35s ease;
          }

          body.fade-out .splash-container {
            opacity: 0;
            transform: scale(0.96);
          }
          
          .splash-container::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: pulse 3s ease-in-out infinite;
          }
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.1); opacity: 0.8; }
          }
          
          .content {
            position: relative;
            z-index: 1;
          }
          
          .icon {
            width: 100px;
            height: 100px;
            background: white;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0 auto 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            animation: bounce 2s ease-in-out infinite;
          }
          
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          
          .icon svg {
            width: 56px;
            height: 56px;
          }
          
          h1 {
            color: white;
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
            text-shadow: 0 2px 10px rgba(0,0,0,0.2);
            letter-spacing: -0.02em;
          }
          
          .subtitle {
            color: rgba(255,255,255,0.95);
            font-size: 17px;
            font-weight: 500;
            margin-bottom: 35px;
          }
          
          .loader {
            width: 200px;
            height: 6px;
            background: rgba(255,255,255,0.2);
            border-radius: 10px;
            overflow: hidden;
            margin: 0 auto;
          }
          
          .loader-bar {
            height: 100%;
            background: white;
            border-radius: 10px;
            animation: loading 2s ease-in-out infinite;
            box-shadow: 0 0 15px rgba(255,255,255,0.5);
          }
          
          @keyframes loading {
            0% { width: 0%; }
            50% { width: 70%; }
            100% { width: 100%; }
          }
          
          .version {
            color: rgba(255,255,255,0.7);
            font-size: 12px;
            margin-top: 20px;
            font-weight: 400;
          }
        </style>
      </head>
      <body>
        <div class="splash-container">
          <div class="content">
            <div class="icon">
              <!-- SmartPOS Store Icon -->
              <svg viewBox="0 0 24 24" fill="none" stroke="#764ba2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
                <path d="M2 7h20"/>
                <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/>
              </svg>
            </div>
            <h1>${param.title}</h1>
            <div class="subtitle">${param.subtitle}</div>
            <div class="loader">
              <div class="loader-bar"></div>
            </div>
            <div class="version">${param.version}</div>
          </div>
        </div>
      </body>
    </html>
  `;

  splashWindow.loadURL(
    "data:text/html;charset=utf-8," + encodeURIComponent(splashHtml),
  );

  splashWindow.once("ready-to-show", () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.show();
    }
  });

  splashWindow.on("closed", () => {
    splashWindow = null;
  });
}

function dismissSplashAndShowMain() {
  if (isTransitioning) return;
  isTransitioning = true;

  const elapsed = Date.now() - splashStartTime;
  const delay = Math.max(0, MIN_SPLASH_DURATION - elapsed);

  setTimeout(() => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.webContents
        .executeJavaScript('document.body.classList.add("fade-out")')
        .catch(() => {});

      setTimeout(() => {
        if (splashWindow && !splashWindow.isDestroyed()) {
          splashWindow.close();
          splashWindow = null;
        }
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.show();
          mainWindow.focus();
        }
      }, 350);
    } else {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  }, delay);
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 700,
    show: false, // Prevents white flash and blank screen
    backgroundColor: "#020617",
    autoHideMenuBar: true,
    title: "SmartPOS - Stock Management & Counter Sales",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  const url = process.env.ELECTRON_START_URL || "http://localhost:3000";
  mainWindow.loadURL(url);

  // When frontend is ready to show
  mainWindow.once("ready-to-show", () => {
    dismissSplashAndShowMain();
  });

  // Safety fallback for dev server slow startup (maximum 6.5 seconds)
  setTimeout(() => {
    dismissSplashAndShowMain();
  }, 6500);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function startApplication() {
  createSplashScreen();
  createMainWindow();
}

// App ready signal from React/Next.js frontend
ipcMain.on("app-ready", () => {
  dismissSplashAndShowMain();
});

// IPC Handlers
ipcMain.handle("toggle-fullscreen", () => {
  if (!mainWindow) return false;
  const isFull = mainWindow.isFullScreen();
  mainWindow.setFullScreen(!isFull);
  return !isFull;
});

ipcMain.on("window-minimize", () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on("window-maximize", () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on("window-close", () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});

// Thermal receipt printing handler via silent/dialog print
ipcMain.handle("print-receipt", async (event, htmlContent) => {
  const printWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: false,
    },
  });

  await printWindow.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`,
  );

  return new Promise((resolve) => {
    printWindow.webContents.print(
      {
        silent: true,
        printBackground: true,
        pageSize: { width: 80000, height: 200000 }, // 80mm roll
      },
      (success, failureReason) => {
        printWindow.close();
        resolve({ success, failureReason });
      },
    );
  });
});

app.whenReady().then(startApplication);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
