import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('notefun', {
  home: () => ipcRenderer.send('home'),
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  submitBaseUrl: (url: string) => ipcRenderer.send('set-base-url', url),
  onPromptBaseUrl: (cb: (current: string) => void) => {
    ipcRenderer.on('prompt-base-url', (_event, url: string) => cb(url));
  },
});
