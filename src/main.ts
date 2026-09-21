import {
  app,
  BrowserWindow,
  ipcMain,
} from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import started from 'electron-squirrel-startup';

const DEFAULT_BASE_URL = 'https://onenote.cloud.microsoft/notebooks';
const WINDOW_TITLE = 'Note Fun';

if (started) {
  app.quit();
}

app.setName('notefun');
app.userAgentFallback =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36';

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

type AppConfig = {
  baseUrl: string;
  lastUrl: string;
};

let mainWindow: BrowserWindow | null = null;
let config: AppConfig = { baseUrl: '', lastUrl: '' };
let lastUrlTimer: ReturnType<typeof setTimeout> | null = null;

const iconPath = () =>
  app.isPackaged
    ? path.join(process.resourcesPath, 'icon.png')
    : path.join(__dirname, '../../assets/icon.png');

const configFilePath = () => path.join(app.getPath('userData'), 'config.json');

const loadConfig = (): AppConfig => {
  try {
    const parsed = JSON.parse(fs.readFileSync(configFilePath(), 'utf8')) as Partial<AppConfig>;
    return {
      baseUrl: typeof parsed.baseUrl === 'string' ? parsed.baseUrl : '',
      lastUrl: typeof parsed.lastUrl === 'string' ? parsed.lastUrl : '',
    };
  } catch {
    return { baseUrl: '', lastUrl: '' };
  }
};

const saveConfig = () => {
  fs.mkdirSync(app.getPath('userData'), { recursive: true });
  fs.writeFileSync(configFilePath(), JSON.stringify(config, null, 2));
};

const isLoginHost = (host: string): boolean => {
  const h = host.toLowerCase();
  return (
    h.startsWith('login.') ||
    h === 'account.live.com' ||
    h === 'login.microsoft.com' ||
    h.endsWith('.microsoftonline.com') ||
    h === 'microsoftonline.com'
  );
};

const isUnlockSignal = (url: string, title?: string): boolean => {
  const blob = `${url} ${title ?? ''}`.toLowerCase();
  return (
    blob.includes('not unlocked') ||
    blob.includes('unlock') ||
    /\bpassword\b/.test(blob)
  );
};

const isRestorableUrl = (url: string, title?: string): boolean => {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:') {
    return false;
  }
  if (isLoginHost(parsed.hostname)) {
    return false;
  }
  if (isUnlockSignal(url, title)) {
    return false;
  }
  if (/\/oauth2\//i.test(parsed.pathname) || /[?&]response_type=/.test(parsed.search)) {
    return false;
  }
  const host = parsed.hostname.toLowerCase();
  return (
    host === 'onedrive.live.com' ||
    host === 'onenote.cloud.microsoft' ||
    host.endsWith('.onenote.cloud.microsoft') ||
    host === 'onenote.com' ||
    host.endsWith('.onenote.com') ||
    host === 'office.com' ||
    host.endsWith('.office.com') ||
    host.endsWith('.officeapps.live.com') ||
    host.endsWith('.sharepoint.com')
  );
};

const persistLastUrl = (url: string, title?: string) => {
  if (!isRestorableUrl(url, title)) {
    return;
  }
  if (config.lastUrl === url) {
    return;
  }
  config.lastUrl = url;
  if (lastUrlTimer) {
    clearTimeout(lastUrlTimer);
  }
  lastUrlTimer = setTimeout(() => {
    lastUrlTimer = null;
    saveConfig();
  }, 250);
};

const flushLastUrl = () => {
  if (lastUrlTimer) {
    clearTimeout(lastUrlTimer);
    lastUrlTimer = null;
  }
  saveConfig();
};

const keepLinksInSameWindow = (contents: Electron.WebContents) => {
  contents.setWindowOpenHandler(({ url }) => {
    if (url && url !== 'about:blank') {
      void contents.loadURL(url);
    }
    return { action: 'deny' };
  });
};

const loadContent = (url: string) => {
  mainWindow?.webContents.send('open-url', url);
};

const showBaseUrlPrompt = () => {
  mainWindow?.webContents.send(
    'prompt-base-url',
    config.baseUrl || DEFAULT_BASE_URL,
  );
};

const attachContentHandlers = (contents: Electron.WebContents) => {
  keepLinksInSameWindow(contents);
  const onNav = () => {
    persistLastUrl(contents.getURL(), contents.getTitle());
  };
  contents.on('did-navigate', onNav);
  contents.on('did-navigate-in-page', onNav);
  contents.on('page-title-updated', () => {
    persistLastUrl(contents.getURL(), contents.getTitle());
  });
};

const createWindow = () => {
  config = loadConfig();

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: WINDOW_TITLE,
    icon: iconPath(),
    frame: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    void mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  mainWindow.on('page-title-updated', (event) => {
    event.preventDefault();
    mainWindow?.setTitle(WINDOW_TITLE);
  });

  mainWindow.on('closed', () => {
    flushLastUrl();
    mainWindow = null;
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.control && input.shift && input.key.toLowerCase() === 'h') {
      event.preventDefault();
      showBaseUrlPrompt();
    }
  });

};

ipcMain.on('shell-ready', () => {
  if (!config.baseUrl) {
    showBaseUrlPrompt();
    return;
  }
  const start =
    config.lastUrl && isRestorableUrl(config.lastUrl)
      ? config.lastUrl
      : config.baseUrl;
  loadContent(start);
});

ipcMain.on('home', () => {
  if (config.baseUrl) {
    loadContent(config.baseUrl);
  } else {
    showBaseUrlPrompt();
  }
});

ipcMain.on('window-minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('window-maximize', () => {
  if (!mainWindow) {
    return;
  }
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on('window-close', () => {
  mainWindow?.close();
});

ipcMain.on('set-base-url', (_event, raw: string) => {
  const url = (raw || '').trim();
  if (!url) {
    return;
  }
  config.baseUrl = url;
  saveConfig();
  loadContent(url);
});

app.on('web-contents-created', (_event, contents) => {
  keepLinksInSameWindow(contents);
  if (contents.getType() === 'webview') {
    attachContentHandlers(contents);
    contents.on('before-input-event', (event, input) => {
      if (input.type === 'keyDown' && input.control && input.shift && input.key.toLowerCase() === 'h') {
        event.preventDefault();
        showBaseUrlPrompt();
      }
    });
  }
});

app.on('second-instance', () => {
  if (!mainWindow) {
    return;
  }
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  mainWindow.focus();
});

app.on('before-quit', () => {
  flushLastUrl();
});

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
