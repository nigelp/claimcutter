import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
  saveData: (key: string, data: unknown) => Promise<{ success: boolean; error?: string }>;
  loadData: (key: string) => Promise<{ success: boolean; data: unknown | null; error?: string }>;
  deleteData: (key: string) => Promise<{ success: boolean; error?: string }>;
  getPlatform: () => Promise<string>;
  openExternal: (url: string) => Promise<{ success: boolean; error?: string }>;
}

const electronAPI: ElectronAPI = {
  saveData: (key: string, data: unknown) => ipcRenderer.invoke('save-data', key, data),
  loadData: (key: string) => ipcRenderer.invoke('load-data', key),
  deleteData: (key: string) => ipcRenderer.invoke('delete-data', key),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);