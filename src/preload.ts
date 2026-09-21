import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('notefun', {
  home: () => ipcRenderer.send('home'),
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  submitBaseUrl: (url: string) => ipcRenderer.send('set-base-url', url),
});
