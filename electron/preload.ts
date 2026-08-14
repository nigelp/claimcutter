import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
  getPlatform: () => Promise<string>;
  openExternal: (url: string) => Promise<{ success: boolean; error?: string }>;
}

const electronAPI: ElectronAPI = {
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
