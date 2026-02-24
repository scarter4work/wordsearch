import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  exportPdf: (): Promise<string | null> => ipcRenderer.invoke('export-pdf'),
  exportPng: (dataUrl: string): Promise<string | null> => ipcRenderer.invoke('export-png', dataUrl),
  saveProject: (data: string): Promise<string | null> => ipcRenderer.invoke('save-project', data),
  loadProject: (): Promise<string | null> => ipcRenderer.invoke('load-project')
})
